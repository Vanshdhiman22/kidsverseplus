# -*- coding: utf-8 -*-
"""
Lift Nova out of the child cutouts she was baked into.

  python tools/novasplit.py [--dry]

The 36 approved designs draw the child and the robot as one flat PNG on 25 screens. That
is fine while the master child is the only child, and fatal the moment another one is
picked: drawing a child-only sprite takes Nova with the boy she was fused to, which is
exactly what happened the first time the swap went live.

Redrawing her is not needed. On most of those screens she is already a separate shape
inside the same file, so she can simply be cut out and given her own layer -- and cutting
her from the screen's own art keeps her exact pose, lighting and scale, which a generic
stand-in never would.

Writes:
  public/art/chars/nova/<cutout>.webp   Nova alone, at that screen's pose
  public/art/chars/nova-boxes.json      where to draw her, in design pixels

Screens where the two physically interlock (a hand-hold, a fist-bump) are skipped: there
is no seam to cut along, and half a hand on each layer looks worse than the master art.
Those wait for the paired renders. See tools/pose-spec.md.
"""
import os, sys, json, io
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..")
CH = os.path.join(ROOT, "public", "art", "chars")
OUT = os.path.join(CH, "nova")

# Cutouts where the child's hand actually meets Nova's. No automatic seam exists.
INTERLOCKED = {"landing-0", "bresult-0"}

# Cuts that come out technically valid and visibly wrong. Checked by eye; a broken Nova
# on screen is worse than the approved master art, so these are refused by name rather
# than left to a threshold that would also start refusing good ones.
UNCLEAN = {
    "nova-0": "the design occludes her body behind a panel; only her head and one hand survive",
    "profile-0": "her neck falls in a gap, leaving the head floating above the shoulders",
    "result-0": "a violet banner is welded to her feet and its ghost survives the cleanup",
}


def masks(rgb, alpha):
    """Per-pixel signals. Nova is the only thing in this art that combines a big glossy
    near-black face screen with saturated cyan curves on a bright near-neutral shell."""
    r, g, b = rgb[..., 0].astype(float), rgb[..., 1].astype(float), rgb[..., 2].astype(float)
    mx, mn = rgb.max(-1).astype(float), rgb.min(-1).astype(float)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0)
    val = mx / 255.0
    on = alpha > 40
    face = on & (val < 0.22)                                   # the dark screen and joints
    glow = on & (b > 120) & (b > r + 55) & (sat > 0.45)        # cyan curves and rings
    shell = on & (val > 0.66) & (sat < 0.22)                   # the white body
    skin = on & (r > 95) & (r > g + 18) & (g > b + 8) & (sat > 0.18) & (sat < 0.72)
    return face, glow, shell, skin


def _span(mask):
    ys, xs = np.nonzero(mask)
    return (int(ys.min()), int(ys.max()), int(xs.min()), int(xs.max())) if len(ys) else (0, 0, 0, 0)


def split(path):
    """Return (nova_rgba, box in image pixels, share) or None.

    Two things had to be true at once and each attempt only got one of them.

    Picking a whole shape by average colour respects real outlines but chose a sneaker on
    one screen and a purple pedestal on another, both being bright and blue-ish. Growing a
    region from her face by colour picked the right subject but bled straight into the
    child, whose denim, hair and white shirt read the same as her shell, leaving a holed
    ghost of the boy attached to her.

    So: shapes decide the boundary, her face decides which shapes are hers. Nothing else
    in this art has a glossy near-black screen with cyan curves inside it."""
    im = Image.open(path).convert("RGBA")
    a = np.array(im)
    rgb, alpha = a[..., :3], a[..., 3]
    face, glow, shell, skin = masks(rgb, alpha)

    seed = ndimage.binary_opening(ndimage.binary_dilation(glow, np.ones((9, 9))) & face, np.ones((3, 3)))
    if seed.sum() < 200:
        return None

    shapes = ndimage.binary_closing(alpha > 40, np.ones((3, 3)))
    lab, n = ndimage.label(shapes)
    if n == 0:
        return None

    # Per label, vectorised -- a python loop over labels on a 1400px canvas took minutes.
    idx = np.arange(1, n + 1)
    size = np.array(ndimage.sum(shapes, lab, idx))
    seeded = np.array(ndimage.sum(seed, lab, idx))
    skinned = np.array(ndimage.sum(skin, lab, idx))
    inked = size.sum()

    # Her face alone is not enough to tell them apart: the child's denim carries dark folds
    # beside saturated blue, which reads as a face-and-glow seed too. What separates them
    # cleanly is skin -- measured, Nova's shape scores 0.001 and the boy's 0.16.
    with np.errstate(invalid="ignore", divide="ignore"):
        skin_ratio = np.where(size > 0, skinned / np.maximum(size, 1), 1.0)
    hers = idx[(size / inked >= 0.01) & (seeded >= 150) & (skin_ratio <= 0.02)]
    if not len(hers):
        return None

    m = np.isin(lab, hers)

    # Pull in the small pieces of her that sit inside her own span and carry no skin --
    # a neck joint thin enough to be its own island left her head floating on one screen.
    y0, y1, x0, x1 = _span(m)
    for i in idx:
        if i in hers or size[i - 1] >= inked * 0.05 or size[i - 1] < 150 or skin_ratio[i - 1] > 0.01:
            continue
        by0, by1, bx0, bx1 = _span(lab == i)
        if by0 >= y0 - 6 and by1 <= y1 + 6 and bx0 >= x0 - 6 and bx1 <= x1 + 6:
            m = m | (lab == i)

    # Screen furniture welded to her feet: a violet banner rode along on the result screen.
    # Her accents are cyan (green above red); violet is the other way round.
    r, g, b = rgb[..., 0].astype(int), rgb[..., 1].astype(int), rgb[..., 2].astype(int)
    violet = (b > r + 20) & (r > g + 10) & (b > 120)
    if (m & violet).sum() > 400:
        m = m & ~ndimage.binary_dilation(violet, np.ones((3, 3)))
        m = ndimage.binary_opening(m, np.ones((3, 3)))
        lab2, n2 = ndimage.label(m)
        if n2 == 0:
            return None
        s2 = np.array(ndimage.sum(m, lab2, np.arange(1, n2 + 1)))
        m = lab2 == (int(np.argmax(s2)) + 1)

    share = m.sum() / inked
    if share < 0.05:
        return None                             # a stray highlight, not her

    ys, xs = np.nonzero(m)
    out = a.copy()
    out[..., 3] = np.where(m, out[..., 3], 0)
    box = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
    return Image.fromarray(out, "RGBA").crop(box), box, share


def main(dry=False):
    manifest = json.load(open(os.path.join(CH, "manifest.json")))
    poses = io.open(os.path.join(ROOT, "src", "data", "poses.js"), encoding="utf-8").read()
    fused = sorted(set(
        m.group(1) for m in __import__("re").finditer(r"cutout: '([^']+)'[^}]*layer: 'fused'", poses)
    ))

    boxes, done, skipped = {}, [], []
    for cut in fused:
        path = os.path.join(CH, cut + ".webp")
        if not os.path.exists(path) or cut not in manifest:
            skipped.append((cut, "no art or no box"))
            continue
        if cut in INTERLOCKED:
            skipped.append((cut, "hands interlock -- needs the paired render"))
            continue
        if cut in UNCLEAN:
            skipped.append((cut, UNCLEAN[cut]))
            continue
        res = split(path)
        if res is None:
            skipped.append((cut, "no clean seam -- she overlaps the child"))
            continue
        nova, (x0, y0, x1, y1), share = res
        W, H = Image.open(path).size
        dx, dy, dw, dh = manifest[cut]
        sx, sy = dw / W, dh / H
        boxes[cut] = [round(dx + x0 * sx), round(dy + y0 * sy),
                      round((x1 - x0) * sx), round((y1 - y0) * sy)]
        if not dry:
            os.makedirs(OUT, exist_ok=True)
            nova.save(os.path.join(OUT, cut + ".webp"), "WEBP", quality=94, method=6)
        done.append((cut, nova.size, boxes[cut], share))

    if not dry:
        json.dump(boxes, io.open(os.path.join(CH, "nova-boxes.json"), "w"), indent=1)

    print("%-14s %-12s %-26s %s" % ("cutout", "size", "box (design px)", "share"))
    print("-" * 66)
    for c, sz, b, m in done:
        print("%-14s %-12s %-26s %.0f%%" % (c, "%dx%d" % sz, b, m * 100))
    print("-" * 66)
    print("lifted   : %d" % len(done))
    for c, why in skipped:
        print("skipped  : %-14s %s" % (c, why))
    print("\nfused screens: %d   covered: %d   still on master art: %d"
          % (len(fused), len(done), len(fused) - len(done)))


if __name__ == "__main__":
    main(dry="--dry" in sys.argv)
