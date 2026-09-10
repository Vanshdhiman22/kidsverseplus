# -*- coding: utf-8 -*-
"""
Keep a substituted child off Nova.

  python tools/unclash.py

A replacement child's box keeps the master's height and ground line and takes its width
from its own sprite, centred on the master's box. When the replacement is wider than the
master -- a seated pose, a wide stance -- that extra width spills sideways, and on the side
where Nova stands it spills onto her. She is drawn behind the child, so she vanishes into
their shoulder.

This reads the final Nova boxes and slides each child box horizontally *away* from Nova
until the two overlap by no more than a sliver. Height and ground line never change, and
the child never leaves the canvas. Run it after poselib.py and after novasplit/novafill,
since it needs both sets of boxes.
"""
import os, json, io

HERE = os.path.dirname(os.path.abspath(__file__))
CH = os.path.join(HERE, "..", "public", "art", "chars")
CANVAS_W = 1672
MAX_OVERLAP = 0.12       # of Nova's area; a touching shoulder is fine, a covered face is not
MARGIN = 14
EDGE = 20             # never flush against the canvas edge; the bleed would clip a shoulder


def inter(a, b):
    x = max(0, min(a[0] + a[2], b[0] + b[2]) - max(a[0], b[0]))
    y = max(0, min(a[1] + a[3], b[1] + b[3]) - max(a[1], b[1]))
    return x * y


def main():
    nova = json.load(open(os.path.join(CH, "nova-boxes.json")))
    boxes = json.load(open(os.path.join(CH, "pose-boxes.json")))
    moved = 0
    for key, g in boxes.items():
        cut = key.split("--")[0]
        n = nova.get(cut)
        if not n:
            continue
        before = inter(g, n) / (n[2] * n[3])
        if before <= MAX_OVERLAP:
            continue
        gx, gy, gw, gh = g
        nx, nw = n[0], n[2]
        g_cx, n_cx = gx + gw / 2, nx + nw / 2
        if g_cx <= n_cx:                      # Nova on the right: slide the child left
            new_x = min(gx, nx - gw - MARGIN)
        else:                                 # Nova on the left: slide the child right
            new_x = max(gx, nx + nw + MARGIN)
        new_x = max(EDGE, min(new_x, CANVAS_W - gw - EDGE))
        after = inter([new_x, gy, gw, gh], n) / (n[2] * n[3])
        if after < before:
            boxes[key] = [int(round(new_x)), gy, gw, gh]
            moved += 1
            print("%-26s overlap %3.0f%% -> %3.0f%%   x %d -> %d" % (key, before * 100, after * 100, gx, new_x))
    json.dump(boxes, io.open(os.path.join(CH, "pose-boxes.json"), "w"), indent=1)
    print("\nmoved %d boxes" % moved)


if __name__ == "__main__":
    main()
