# -*- coding: utf-8 -*-
"""
Put Nova back on the screens novasplit.py could not cut her out of.

  python tools/novafill.py

novasplit lifts Nova out of the child's cutout where she is her own shape. On the rest --
she overlaps the child, or the two hold hands -- there is no seam. Rather than leave those
screens on the master boy, this places a clean standalone Nova where the fused art has her
face, so a substituted child always has the robot beside them.

The placement is self-calibrating: her face screen is found in the fused art and in the
standalone sprite the same way, and the sprite is scaled and anchored so the two faces
coincide. Nothing is hand-positioned.

These are approximations of the design, not the design: her pose is the standalone's, not
the screen's, and on the two hand-contact screens the hands no longer meet. That is recorded
in nova-fallback.json so the docs stay honest. When a real cut or a paired render arrives for
a screen, novasplit's output for it wins and this file's entry is dropped.
"""
import os, json, io, re, sys
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from novasplit import masks  # noqa: E402

ROOT = os.path.join(HERE, "..")
ART = os.path.join(ROOT, "public", "art")
CH = os.path.join(ART, "chars")
OUT = os.path.join(CH, "nova")

DEFAULT = os.path.join(ART, "hd", "nova-guide.webp")
# Screens with a known-good standalone that matches their pose better than the default.
OVERRIDE = {"confidence-0": os.path.join(ART, "confidence-nova-hq-cutout.webp")}


# Two screens where the detector cannot get a clean read: on arena-0 her face screen is
# welded to the boy's sleeve, on setup-0 it is small against a wide scene. Coordinates
# read off the dark/cyan mask dump by eye (image pixels).
FACE_OVERRIDE = {"arena-0": (345, 188, 539, 328), "setup-0": (746, 242, 1019, 451)}


def _disk(r):
    y, x = np.ogrid[-r:r + 1, -r:r + 1]
    return (x * x + y * y) <= r * r


def face_box(im, name=None):
    """Bounding box of Nova's face screen.

    Three things were tried and two failed in instructive ways. The largest dark region
    beside cyan is the child's hair against a denim collar. The region with the most cyan
    inside is the child's jacket. What actually singles out her face is that it is the
    biggest *round* dark shape with cyan inside it -- a solid oval, where hair is ragged,
    a platform is a bar and her chest emblem is round but small. So: fill the dark mask,
    snap thin necks and antennae with an opening, then score compactness x sqrt(area)."""
    if name in FACE_OVERRIDE:
        return FACE_OVERRIDE[name]
    a = np.array(im.convert("RGBA"))
    face, glow, shell, skin = masks(a[..., :3], a[..., 3])
    dark = ndimage.binary_fill_holes(ndimage.binary_closing(face, np.ones((15, 15))))
    scale = min(a.shape[:2]) / 900.0
    dark = ndimage.binary_opening(dark, _disk(max(4, int(9 * scale))))
    lab, n = ndimage.label(dark)
    best, score = None, 0.0
    for i in range(1, n + 1):
        m = lab == i
        area = int(m.sum())
        if area < 1500:
            continue
        ys, xs = np.nonzero(m)
        w, h = xs.max() - xs.min() + 1, ys.max() - ys.min() + 1
        if not 0.9 <= w / h <= 2.0 or glow[m].sum() < 60:
            continue
        per = area - int(ndimage.binary_erosion(m).sum())
        comp = 4 * np.pi * area / max(per * per, 1)
        s = comp * np.sqrt(area)
        if s > score:
            best, score = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1), s
    return best


def main():
    manifest = json.load(open(os.path.join(CH, "manifest.json")))
    boxes = json.load(open(os.path.join(CH, "nova-boxes.json")))
    poses = io.open(os.path.join(ROOT, "src", "data", "poses.js"), encoding="utf-8").read()
    fused = sorted(set(re.findall(r"cutout: '([^']+)'[^}]*layer: 'fused'", poses)))
    todo = [c for c in fused if c not in boxes and c in manifest]

    # calibrate each standalone once: where its face sits, as a fraction of its own size
    calib = {}
    for src in {DEFAULT, *OVERRIDE.values()}:
        im = Image.open(src).convert("RGBA")
        fb = face_box(im)
        assert fb, "no face found in standalone %s" % src
        calib[src] = (im, fb)

    fallback = {}
    os.makedirs(OUT, exist_ok=True)
    for cut in todo:
        fused_im = Image.open(os.path.join(CH, cut + ".webp")).convert("RGBA")
        fb = face_box(fused_im, cut)
        if not fb:
            print("skip     %-14s no face found" % cut)
            continue
        src = OVERRIDE.get(cut, DEFAULT)
        sp, (sx0, sy0, sx1, sy1) = calib[src]
        W, H = fused_im.size
        dx, dy, dw, dh = manifest[cut]
        kx, ky = dw / W, dh / H                     # fused px -> design px
        # face in design px
        fx0, fy0, fx1, fy1 = fb[0] * kx + dx, fb[1] * ky + dy, fb[2] * kx + dx, fb[3] * ky + dy
        # scale the standalone so its face width matches
        s = (fx1 - fx0) / (sx1 - sx0)
        nw, nh = round(sp.size[0] * s), round(sp.size[1] * s)
        nx, ny = round(fx0 - sx0 * s), round(fy0 - sy0 * s)
        # keep her on the canvas
        nx = max(-20, min(nx, 1672 - nw + 20)); ny = max(-20, min(ny, 941 - nh + 20))
        if not (0.35 * dh <= nh <= 1.6 * dh):
            print("reject   %-14s nova %dpx tall against a %dpx cutout -- bad face read" % (cut, nh, dh)); continue
        boxes[cut] = [nx, ny, nw, nh]
        fallback[cut] = {"source": os.path.relpath(src, ART).replace("\\", "/"),
                         "note": "standalone placed on the detected face; pose is the sprite's, not the design's"}
        sp.save(os.path.join(OUT, cut + ".webp"), "WEBP", quality=94, method=6)
        print("placed   %-14s <- %-30s box %s" % (cut, os.path.basename(src), boxes[cut]))

    json.dump(boxes, io.open(os.path.join(CH, "nova-boxes.json"), "w"), indent=1)
    json.dump(fallback, io.open(os.path.join(CH, "nova-fallback.json"), "w"), indent=1)
    print("\nfused screens %d   covered %d   (of which approximated %d)"
          % (len(fused), sum(1 for c in fused if c in boxes), len(fallback)))


if __name__ == "__main__":
    main()
