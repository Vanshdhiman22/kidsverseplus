"""
Turn the designer's green-screen pose library into the app's character sprites.

  python tools/poselib.py <library-dir> [--dry]

The library ships one PNG per (character, pose) on a flat green field. This keys the
green out, kills the fringe a hard threshold leaves around hair and fingers, trims to
the figure, and writes:

  public/art/chars/pose/<APP_POSE>/<charId>.webp   the sprite
  public/art/chars/pose-boxes.json                 where each screen should draw it

Two things the numbering hides:

* The library's pose ids are NOT the app's. Their P01 is a neutral standing pose; the
  app's P01 is the hand-hold with Nova. Dropping them in by number would put the wrong
  pose on every screen, so POSE_MAP pairs them by what the child is doing.

* A replacement figure is not the same shape as the master it stands in for. Reusing the
  master's box would stretch a girl into a boy's proportions, so each box keeps the
  master's height and ground line and takes its width from the new sprite's own aspect.
"""
import os, sys, glob, json, re
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(__file__)
CHARS = os.path.join(HERE, "..", "public", "art", "chars")
OUT = os.path.join(CHARS, "pose")
SCALE = 2   # sprites ship at 2x design pixels, like the rest of the art

# library pose -> the app pose it stands in for. Left side is the file prefix in the
# library, right side is the id in src/data/poses.js.
POSE_MAP = {
    "P02": "P02",   # presenting welcome      -> presenting hologram
    "P01": "P03",   # neutral standing        -> standing relaxed
    "P03": "P05",   # pointing up right       -> pointing up
    "P04": "P07",   # pointing side           -> arm extended
    "P08": "P08",   # seated relaxed          -> seated on the ground
    "P05": "P09",   # leaning toward a table  -> turned toward the lesson
    "P10": "P13",   # celebrating, fist up    -> fist raised, victory
    "P11": "P14",   # arms crossed            -> arms crossed
    "P07": "P16",   # fist bump               -> fist-bump with Nova
}
# One library render can serve two app poses. The raised open arm is the high-five; the
# raised fist is the victory punch. These were the other way round -- a clenched fist was
# standing in for a hand meeting Nova's, which is not the same gesture.
ALSO = {"P03": ["P11"]}          # pointing up right -> high-five celebration
# Poses the library has no shot for, standing in with the nearest thing it does have.
STAND_IN = {"P01": "P01", "P12": "P01"}   # hand-hold and waist-up both fall back to neutral standing

# library folder -> the character id in src/data/poses.js.
#
# Matched on the art, not on the folder name. The library's boy is the MASTER child
# (kid1: brown messy hair, light skin -- mean skin RGB 188,114,66 against kid1's
# 190,115,80, and 17 away from kid2's), and its girl is the bob-and-headband child
# (kid4). Naming them boy_02/girl_01 by folder order would have shown face 2 the master
# boy again and given face 3 the wrong girl entirely.
CHAR_MAP = {"boy": "boy_01", "girl": "girl_02"}


def key_green(im):
    """Flat green field -> alpha, with the green fringe removed from what is left."""
    a = np.array(im.convert("RGB")).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    # How green a pixel is relative to the strongest other channel. Soft, so antialiased
    # hair keeps a gradient instead of a staircase.
    greenness = g - np.maximum(r, b)
    alpha = np.clip((28.0 - greenness) / 26.0, 0.0, 1.0)
    # Spill: the green that bounced onto the figure's edges. Pull the green channel down
    # to its neighbours wherever it is the brightest, which is never true of real skin,
    # denim or hair but is always true of a green rim.
    cap = np.maximum(r, b)
    spill = g > cap
    g = np.where(spill, cap + (g - cap) * 0.15, g)
    rgb = np.stack([r, g, b], -1).clip(0, 255).astype(np.uint8)
    al = (alpha * 255).astype(np.uint8)
    out = Image.fromarray(np.dstack([rgb, al]), "RGBA")
    # A one-pixel erode removes the last hairline of key colour without eating the figure.
    a2 = out.split()[-1].filter(ImageFilter.MinFilter(3))
    out.putalpha(Image.fromarray(np.minimum(np.array(out.split()[-1]), np.array(a2))))
    return out


def trim(im):
    al = np.array(im.split()[-1])
    ys, xs = np.nonzero(al > 8)
    if not len(xs): return None
    return im.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))


def main(lib, dry=False):
    manifest = json.load(open(os.path.join(CHARS, "manifest.json")))
    poses_js = open(os.path.join(HERE, "..", "src", "data", "poses.js"), encoding="utf-8").read()
    blk = re.search(r"export const SLOTS = \{(.*?)\n\}", poses_js, re.S).group(1)
    slots = []
    for m in re.finditer(r"(\w+):\s*\{([^}]*)\}", blk):
        body = m.group(2)
        get = lambda k: (re.search(k + r": '([^']*)'", body) or [None, None])[1]
        slots.append(dict(key=m.group(1), cutout=get("cutout"), pose=get("pose"),
                          layer=get("layer"), outfits="outfits" in body, exception="exception" in body))
    required = [s for s in slots if s["layer"] in ("solo", "fused") and not s["outfits"] and not s["exception"]]

    produced, boxes, report = [], {}, []
    for folder, char in CHAR_MAP.items():
        for path in sorted(glob.glob(os.path.join(lib, folder, "*.png"))):
            lib_id = os.path.basename(path)[:3]
            targets = [POSE_MAP[lib_id]] + ALSO.get(lib_id, []) if lib_id in POSE_MAP else []
            targets += [app for app, src_id in STAND_IN.items() if src_id == lib_id]
            if not targets:
                report.append(("skipped", char, lib_id, os.path.basename(path)))
                continue
            cut = trim(key_green(Image.open(path)))
            if cut is None: continue
            for app_pose in targets:
                d = os.path.join(OUT, app_pose)
                if not dry: os.makedirs(d, exist_ok=True)
                dst = os.path.join(d, char + ".webp")
                w, h = cut.size
                if app_pose == "P12": h = int(h * 0.56)
                if not dry:
                    # The library renders at 1024px, so a trimmed figure already carries more
                    # detail than the design boxes need; saved as keyed rather than resampled.
                    art = cut
                    if app_pose == "P12":
                        # The app crops this one at the waist. A whole standing child squeezed
                        # into that box would read as a small distant figure, not a close one.
                        art = cut.crop((0, 0, w, h))
                    art.save(dst, "WEBP", quality=92, method=6)
                produced.append("%s/%s" % (app_pose, char))
                # Where each screen using this pose should draw this particular figure:
                # same height and ground line as the master, width from its own aspect.
                for s in required:
                    if s["pose"] != app_pose: continue
                    mb = manifest.get(s["cutout"])
                    if not mb: continue
                    mx, my, mw, mh = mb
                    nw = round(mh * (w / h))
                    boxes["%s--%s" % (s["cutout"], char)] = [round(mx + (mw - nw) / 2), my, nw, mh]
                report.append(("mapped", char, lib_id, app_pose))

    if not dry:
        json.dump(boxes, open(os.path.join(CHARS, "pose-boxes.json"), "w"), indent=1)
        json.dump(sorted(set(produced)), open(os.path.join(CHARS, "pose-manifest.json"), "w"), indent=1)

    made = sorted(set(produced))
    print("sprites written : %d" % len(made))
    print("boxes written   : %d" % len(boxes))
    skipped = [r for r in report if r[0] == "skipped"]
    if skipped:
        print("library poses the app does not use: %s"
              % ", ".join(sorted({"%s(%s)" % (r[2], r[3][4:-4]) for r in skipped})))
    need = {s["pose"] for s in required}
    have = {p.split("/")[0] for p in made}
    if need - have:
        print("app poses with NO art: %s" % ", ".join(sorted(need - have)))
    else:
        print("every required pose has art for: %s" % ", ".join(sorted(CHAR_MAP.values())))


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    main(args[0], dry="--dry" in sys.argv)
