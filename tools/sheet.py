"""
Cut a character sheet into the app's avatar sprites.

The designer supplies one PNG with the six outfits laid out in a grid, already
on transparency. This finds each figure by its own alpha (not a fixed grid, so a
pose that overhangs its cell still comes out whole), normalises every sprite to
the same height, and writes them under the names catalog.js expects.

  python tools/sheet.py <sheet.png> <face-number> [outfit,outfit,...]

Outfits default to the order in catalog.js, read left-to-right, top-to-bottom.
"""
import os, sys
import numpy as np
from scipy import ndimage as nd
from PIL import Image, ImageFilter

ART = os.path.join(os.path.dirname(__file__), "..", "public", "art", "avatar")
SNAP = os.path.join(os.path.dirname(__file__), "..", ".snapshots")
ORDER = ["explorer", "astro", "moonwalk", "ranger", "sprint", "neon"]
HEIGHT = 2000          # every sprite ends up this tall, so swapping outfits never resizes the child


def cells(im, want):
    """Bounding box per figure, ordered the way you read the sheet."""
    a = np.asarray(im.split()[-1]) > 12
    lab, n = nd.label(nd.binary_closing(a, np.ones((9, 9))))
    boxes = []
    for i, sl in enumerate(nd.find_objects(lab), start=1):
        h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        if h * w < (im.width * im.height) / (want * 12):
            continue                      # specks, not a character
        boxes.append((sl[1].start, sl[0].start, sl[1].stop, sl[0].stop))
    cols = 3 if want % 3 == 0 else 2
    rows = want // cols
    if len(boxes) != want:
        # Figures that touch merge into one blob. Cut on the sheet's own empty
        # lanes rather than an even grid: an even split slices through the feet
        # of the row above and drops the shoes into the next cell.
        print(f"  (found {len(boxes)} blobs, cutting on empty lanes instead)")
        xs, ys = a.sum(axis=0), a.sum(axis=1)
        cuts = lambda prof, n, span: _lanes(prof, n, span)
        xcut = cuts(xs, cols - 1, im.width)
        ycut = cuts(ys, rows - 1, im.height)
        xb = [0, *xcut, im.width]
        yb = [0, *ycut, im.height]
        return [(xb[c], yb[r], xb[c + 1], yb[r + 1]) for r in range(rows) for c in range(cols)]
    rowh = im.height / rows
    boxes.sort(key=lambda b: (min(rows - 1, int((b[1] + (b[3] - b[1]) / 2) // rowh)), b[0]))
    return boxes


def _lanes(profile, n, span):
    """Where to cut for n+1 groups: the emptiest row/column near each even split.

    Sheets rarely leave a truly blank lane - the shoes of one row sit level with
    the hair of the next - so look for the valley rather than a gap, searching a
    window around each ideal position so the cuts stay in order."""
    k = max(3, int(span * 0.004)) | 1
    sm = np.convolve(profile.astype(float), np.ones(k) / k, mode="same")
    out = []
    for i in range(n):
        ideal = span * (i + 1) / (n + 1)
        lo, hi = int(max(1, ideal - span * 0.13)), int(min(span - 1, ideal + span * 0.13))
        out.append(lo + int(np.argmin(sm[lo:hi])))
    return out


def trim(im):
    """Crop to the figure, dropping fragments that leaked in from the next cell
    (a shoe from the row above) by keeping only the largest blob."""
    a = np.asarray(im.split()[-1]) > 12
    lab, n = nd.label(nd.binary_closing(a, np.ones((7, 7))))
    if n > 1:
        keep = 1 + int(np.argmax(nd.sum(a, lab, range(1, n + 1))))
        a = lab == keep
        px = np.asarray(im).copy(); px[..., 3] *= a
        im = Image.fromarray(px)
    ys, xs = np.where(a)
    return im.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))


def main(path, face, outfits):
    sheet = Image.open(path).convert("RGBA")
    print(f"sheet {sheet.size} -> face {face}: {', '.join(outfits)}")
    made = []
    for box, outfit in zip(cells(sheet, len(outfits)), outfits):
        fig = trim(sheet.crop(box))
        w = max(1, round(fig.width * HEIGHT / fig.height))
        fig = fig.resize((w, HEIGHT), Image.LANCZOS)
        rgb, alpha = fig.convert("RGB"), fig.split()[-1]
        rgb = rgb.filter(ImageFilter.UnsharpMask(radius=1.6, percent=40, threshold=3))
        rgb.putalpha(alpha)
        out = os.path.join(ART, f"full-kid{face}-{outfit}.webp")
        rgb.save(out, quality=94, method=6)
        made.append((outfit, rgb))
        print(f"  {outfit:9s} {box} -> {rgb.size}  {os.path.basename(out)}")

    from PIL import ImageDraw
    H = 460
    sh = Image.new("RGB", (len(made) * 200, H + 24), (246, 245, 255)); d = ImageDraw.Draw(sh)
    for i, (o, im) in enumerate(made):
        r = im.resize((max(1, int(im.width * H / im.height)), H), Image.LANCZOS)
        sh.paste(r, (i * 200 + (200 - r.width) // 2, 24), r)
        d.text((i * 200 + 6, 7), o, fill=(40, 30, 90))
    os.makedirs(SNAP, exist_ok=True)
    sh.save(os.path.join(SNAP, f"sheet-kid{face}.png"))
    print(f"preview -> .snapshots/sheet-kid{face}.png")


if __name__ == "__main__":
    src, face = sys.argv[1], sys.argv[2]
    outfits = sys.argv[3].split(",") if len(sys.argv) > 3 else ORDER
    main(src, face, outfits)
