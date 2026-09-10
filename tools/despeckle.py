# -*- coding: utf-8 -*-
"""
Strip detached fragments from the character sprites.

  python tools/despeckle.py            # every file under public/art/chars/pose/
  python tools/despeckle.py <file>...  # just these

The pose library ships as 3x3 sheets. A tile cropped from one carries slivers of its
neighbours at the edges -- the seated girl arrived with a pair of shoes floating above her
head, from the tile above -- and the green key keeps anything that is not green. trim() then
keeps the union bounding box, so the sliver rides along into the app.

A figure is one shape. Anything that is not connected to the largest shape, does not overlap
its bounding box, and is small, is not the figure. Hair strands and a raised hand are
connected; a scarf tip or a hair tuft that comes away is inside the figure's box and is kept.
"""
import os, sys, glob, io
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
POSE = os.path.join(HERE, "..", "public", "art", "chars", "pose")


def clean(im):
    """Return (image, removed_share) with detached fragments cleared."""
    a = np.array(im.convert("RGBA"))
    on = a[..., 3] > 40
    lab, n = ndimage.label(ndimage.binary_closing(on, np.ones((3, 3))))
    if n < 2:
        return im, 0.0
    idx = np.arange(1, n + 1)
    size = np.array(ndimage.sum(on, lab, idx))
    main = int(np.argmax(size)) + 1
    ys, xs = np.nonzero(lab == main)
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    keep = lab == main
    dropped = 0
    for i in idx:
        if i == main:
            continue
        yy, xx = np.nonzero(lab == i)
        inside = yy.min() >= y0 and yy.max() <= y1 and xx.min() >= x0 and xx.max() <= x1
        if inside or size[i - 1] >= 0.08 * size.sum():
            keep |= lab == i
        else:
            dropped += size[i - 1]
    if not dropped:
        return im, 0.0
    a[..., 3] = np.where(keep, a[..., 3], 0)
    out = Image.fromarray(a, "RGBA")
    # re-trim to the figure that is left
    al = np.array(out.split()[-1]); ys, xs = np.nonzero(al > 8)
    out = out.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))
    return out, dropped / size.sum()


def main(files):
    files = files or sorted(glob.glob(os.path.join(POSE, "*", "*.webp")))
    touched = 0
    for f in files:
        im = Image.open(f)
        before = im.size
        out, share = clean(im)
        if share:
            out.save(f, "WEBP", quality=92, method=6)
            touched += 1
            print("cleaned  %-34s dropped %4.1f%% of ink   %s -> %s"
                  % (os.path.relpath(f, POSE), share * 100, before, out.size))
    print("\n%d of %d sprites had detached fragments" % (touched, len(files)))
    if touched:
        print("boxes take width from the sprite's aspect: re-run poselib (or unclash) if a size changed")


if __name__ == "__main__":
    main(sys.argv[1:])
