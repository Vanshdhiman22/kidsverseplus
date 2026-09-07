"""
Scene pipeline: turn each design render into (a) a clean background scene and
(b) transparent character cutouts, so the app can draw the designer's exact
backdrop and poses with live UI and real animation on top.

  python tools/scene.py [name ...]        (run with the 3.11 venv that has lama + rembg)

Per screen: `chars` boxes are cut out with rembg (isnet) into public/art/chars/,
then characters + `ui` boxes are inpainted with LaMa into public/art/scenes/.
Coordinates are design pixels (1672x941).
"""
import os, sys, glob
import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter

D = "S:/Temp/claude/F--ssss/696337f3-b9d5-429e-a372-4cb43c37c6bd/scratchpad/d36/Kidsverse_36_Desktop_Light_v1/"
ROOT = os.path.join(os.path.dirname(__file__), "..", "public", "art")
SCENES, CHARS, CROPS, PREVIEW = os.path.join(ROOT, "scenes"), os.path.join(ROOT, "chars"), os.path.join(ROOT, "crops"), os.path.join(os.path.dirname(__file__), "..", ".snapshots", "scenes")
W, H = 1672, 941
LOGO, CONTROLS = (28, 20, 420, 110), (1170, 20, 1655, 105)

SCREENS = {
  "landing":  dict(file="01", chars=[(470,350,930,790)], ui=[LOGO, CONTROLS, (80,130,700,460), (680,240,915,355), (955,160,1595,750), (70,780,1150,915)]),
  "login":    dict(file="02", chars=[(200,360,720,790)], ui=[LOGO, CONTROLS, (120,140,720,380), (900,75,1575,885), (40,780,860,915)]),
  "child":    dict(file="03", chars=[(110,330,750,790)], ui=[LOGO, (470,25,1290,115), (1340,35,1645,100), (110,150,640,362), (90,780,720,900), (815,145,1565,865)]),
  "setup":    dict(file="04", chars=[(20,360,680,900)], ui=[LOGO, (540,25,1180,115), CONTROLS, (120,150,620,380), (675,155,1630,905)]),
  "avatar":   dict(file="05", chars=[(560,140,900,720), (850,270,1090,560)], ui=[LOGO, (490,30,1180,90), CONTROLS, (80,105,700,200), (80,215,330,800), (365,550,495,670), (415,695,500,780), (970,695,1050,780), (840,165,1070,265), (1120,135,1635,905), (75,795,830,920), (1075,785,1620,880)]),
  "interests":dict(file="06", chars=[(30,270,540,790)], ui=[LOGO, (500,25,1210,95), CONTROLS, (540,100,1540,225), (245,125,500,235), (535,225,1625,795), (40,790,1620,905)]),
  "goals":    dict(file="07", chars=[(1000,300,1445,800)], erase=[(1300,296,1460,438)], ui=[LOGO, (630,35,1070,90), CONTROLS, (90,110,220,170), (90,165,800,275), (85,265,790,900), (870,55,1510,470), (1450,460,1650,560), (935,785,1480,905)]),
  "nova":     dict(file="08", chars=[(120,120,960,941)], erase=[(150,780,880,915)], ui=[LOGO, CONTROLS, (1000,80,1620,900), (150,780,880,915)]),
  "welcome":  dict(file="10", chars=[(215,235,800,725)], erase=[(560,255,745,375)], ui=[(0,0,218,941), (1240,15,1650,90), (240,60,800,245), (560,255,745,375), (850,100,1650,435), (845,440,1650,540), (240,555,1650,895), (540,895,1660,940)]),
  "home":     dict(file="09", chars=[(80,400,520,800)], ui=[LOGO, (1490,15,1650,60), (1200,75,1650,145), (95,130,530,275), (130,285,510,420), (610,145,1180,805), (1200,160,1650,805), (200,820,1480,920)]),
  "learn":    dict(file="11", chars=[(0,230,400,690)], ui=[(30,25,300,95), (1500,25,1640,75), (540,70,1140,215), (1370,125,1630,190), (150,120,460,365), (380,400,550,500), (520,220,1650,730), (490,735,1650,835), (40,835,1650,935)]),
  "journey":  dict(file="13", chars=[(912,238,1272,578)], ui=[LOGO, (1200,25,1650,100), (30,110,500,900), (700,90,920,180), (1170,130,1380,215), (650,320,930,410), (1280,395,1510,590), (690,545,930,655), (780,690,1040,800), (150,830,1530,925)]),
  "topic":    dict(file="12", chars=[(560,110,840,600), (1010,230,1310,600)],
                # the fraction pizza is Fractions-only art, but every subject now opens this
                # screen, so it is painted out and the subject's own globe drawn in its place
                ui=[(785,105,1135,400), LOGO, (1110,20,1650,100), (40,110,560,340), (40,345,545,720), (790,395,1070,515), (1310,170,1560,370), (1580,160,1640,290), (330,580,1200,830), (1220,600,1640,800), (30,835,1640,935)]),
  "discover": dict(file="14", chars=[(10,430,300,760)], fill="soft", ui=[(0,0,W,H)]),
  "explain":  dict(file="15", chars=[(20,480,300,820), (1390,600,1660,880)], ui=[(10,10,300,880), (640,20,1060,80), (1390,20,1650,80), (440,90,1300,240), (420,250,1250,560), (400,570,1240,775), (440,785,1210,850), (1390,100,1660,600), (20,865,1660,935)]),
  "spot":     dict(file="16", chars=[(20,420,300,790), (1030,350,1260,760)],
                # a check badge and its connector line sit behind Nova's left side in the
                # design; without this they ride along inside the cutout
                erase=[(1054,598,1106,762)], ui=[(20,20,300,90), (640,25,1100,70), (450,80,1250,260), (20,105,280,365), (600,270,960,610), (1075,245,1265,350), (430,610,1140,790), (1350,80,1650,800), (10,815,1660,935)]),
  "complete": dict(file="17", chars=[(60,340,760,800)], model="isnet-anime", ui=[LOGO, (1120,20,1660,105), (120,100,860,360), (450,380,600,470), (20,470,300,640), (840,95,1610,840), (60,820,1610,930)]),
  "arena":    dict(file="18", chars=[(400,190,780,510), (820,150,1100,470)], ui=[LOGO, (1000,25,1650,100), (30,130,620,250), (590,130,800,250), (1120,110,1580,470), (60,490,1610,840), (270,845,1420,935)]),
  "intro":    dict(file="19", chars=[(230,90,880,800)], ui=[LOGO, (680,15,1030,85), (1180,15,1650,95), (870,105,1645,790), (30,790,1650,935)]),
  "question": dict(file="20", chars=[(20,440,320,730)], ui=[(20,20,300,95), (20,100,310,440), (20,730,310,830), (680,20,1340,95), (1400,15,1650,100), (350,95,1380,830), (1390,115,1660,840), (15,840,300,935), (360,840,1360,935)]),
  "result":   dict(file="21", chars=[(90,280,700,800)], ui=[LOGO, (1390,20,1650,105), (150,120,760,310), (680,160,1060,540), (640,550,1070,700), (380,715,1330,840), (1065,115,1590,740), (20,840,1650,935)]),
  "extra":    dict(file="22", chars=[], crops=[("card-reading",(245,368,680,665)), ("card-confidence",(705,375,1145,675)), ("card-brain",(1170,375,1620,675))], ui=[(0,0,218,941), (255,70,960,345), (1005,90,1620,330), (235,360,1630,830), (240,850,1640,920)]),
  "reading":  dict(file="23", chars=[(30,440,320,820)], crops=[("moonlight",(805,165,1210,615))], ui=[(10,10,280,440), (20,835,290,920), (615,20,1040,150), (345,165,790,615), (805,165,1210,615), (1230,20,1640,820), (345,625,1210,820), (310,835,1640,935)]),
  "confidence": dict(file="24", chars=[(20,490,300,820), (1390,610,1660,880)], crops=[("starfruits",(325,145,995,580))], ui=[(10,10,300,500), (640,20,1050,110), (1330,25,1650,100), (325,145,995,580), (325,590,995,795), (1020,170,1325,700), (1340,130,1650,640), (10,830,1660,935)]),
  "challenge": dict(file="25", chars=[(700,20,1250,680)], erase=[(40,405,1630,640)], crops=[("mystery",(70,670,390,800)), ("dragon",(1020,675,1200,800))], ui=[LOGO, (1180,30,1650,105), (40,130,700,390), (40,405,1630,640), (40,665,1630,805), (40,825,1630,915)]),
  "opponents": dict(file="26", chars=[(10,240,330,780), (1400,380,1670,800),
                # the four bots again, this time cut transparent: the Battle Preview needs
                # them as free-standing figures, and `crops` below are opaque card art
                (325,285,575,540), (615,285,850,540), (885,285,1120,540), (1155,285,1395,540)], crops=[("bot-robo",(325,285,575,540)), ("bot-lexi",(615,285,850,540)), ("bot-cosmo",(885,285,1120,540)), ("bot-pixel",(1155,285,1395,540))], ui=[(20,20,300,100), (1370,20,1640,95), (480,80,1300,260), (300,265,1410,700), (310,710,1430,860), (400,860,1260,930)]),
  "preview":  dict(file="27", chars=[(180,100,470,780), (1090,110,1520,760), (500,540,660,730)], ui=[(30,20,340,95), (430,20,1220,85), (1300,20,1650,90), (470,100,1200,300), (555,270,1090,560), (670,565,1110,715), (420,720,1250,820), (270,830,1370,930)]),
  "battle":   dict(file="28", chars=[(1300,110,1560,400)], crops=[("aarav-portrait",(140,150,420,390))], fill="soft", ui=[(0,0,W,H)]),
  "bresult":  dict(file="29", chars=[(560,250,1080,690)], ui=[(20,20,330,100), (470,30,770,80), (1310,25,1650,90), (25,100,440,780), (580,110,1110,270), (545,670,1130,800), (1245,100,1650,760), (120,815,1550,920)]),
  "league":   dict(file="30", chars=[(110,340,500,800)], crops=[("podium",(300,225,800,540)), ("trophy",(1340,130,1630,590))], ui=[(20,20,250,90), (25,110,120,660), (290,20,480,65), (300,70,850,220), (300,225,800,540), (500,540,790,780), (860,95,1310,750), (1330,120,1640,590), (1330,600,1640,770), (20,830,180,905), (580,800,1550,895)]),
  "profile":  dict(file="31", chars=[(400,140,730,600)], ui=[(20,20,300,90), (1330,20,1650,90), (115,95,400,560), (115,440,420,560), (120,565,770,835), (815,95,1590,835), (290,850,1310,930)]),
  "ourjourney": dict(file="32", chars=[(130,120,640,800)], erase=[(30,650,265,790)], ui=[(30,30,360,110), (1130,25,1650,95), (40,660,260,780), (680,110,1300,270), (640,270,1640,410), (640,415,1640,780), (30,805,1100,895), (1150,800,1610,895)]),
  "switch":   dict(file="33", chars=[(215,430,440,760)], crops=[("aarav-card",(455,280,660,690)), ("mira",(900,300,1100,620)), ("vihaan",(1120,300,1310,620))], ui=[(0,0,218,941), (1215,20,1640,90), (330,90,1050,210), (240,320,430,430), (445,245,880,780), (895,290,1100,780), (1115,290,1315,780), (1335,290,1575,780), (780,800,1090,855), (580,875,1090,925)]),
  "parent":   dict(file="34", chars=[(830,130,1060,470)], erase=[(770,365,945,475)], crops=[("aarav-avatar",(250,180,450,400))], ui=[(0,0,212,941), (250,25,520,105), (1170,25,1640,95), (450,190,800,410), (770,370,940,470), (240,480,1030,790), (240,800,1030,905), (1065,150,1630,860)]),
  "evidence": dict(file="35", chars=[(1210,590,1380,800)], ui=[(0,0,280,941), (290,90,1640,890), (1250,20,1650,90), (560,900,1120,935)]),
  "nhome":    dict(file="37", chars=[(615,105,1260,432)], erase=[(900,120,1075,245)], text=[(240,195,700,390)], ui=[(0,0,212,941), (200,0,305,92), (985,15,1660,80), (905,130,1120,225), (232,418,1648,570), (218,578,1655,875), (0,872,W,H)]),
  "plan":     dict(file="36", chars=[], ui=[(10,20,240,910), (980,30,1210,250), (265,30,1220,890), (1240,95,1640,640), (1240,660,1640,880)]),
}

SCALE = 2   # assets ship at 2x design pixels so the browser downsamples (crisp) instead of upscaling (soft)

def save_hi(img, path, quality=88):
    """Resample to SCALE x with Lanczos and add a little acutance back, then save."""
    if SCALE != 1:
        img = img.resize((img.width * SCALE, img.height * SCALE), Image.LANCZOS)
    if img.mode == "RGBA":
        rgb, a = img.convert("RGB"), img.split()[-1]
        img = rgb.filter(ImageFilter.UnsharpMask(radius=1.6, percent=55, threshold=3))
        img.putalpha(a)
    else:
        img = img.filter(ImageFilter.UnsharpMask(radius=1.6, percent=55, threshold=3))
    img.save(path, quality=quality, method=6)


def src(prefix):
    return glob.glob(D + f"{prefix}_*.png")[0]

def cut(names):
    """Stage 1: character cutouts (rembg). Runs in its own process — onnxruntime and torch crash together on Windows."""
    from rembg import remove, new_session
    sessions = {}
    os.makedirs(CHARS, exist_ok=True); os.makedirs(CROPS, exist_ok=True)
    for name in names:
        cfg = SCREENS[name]; im = Image.open(src(cfg["file"])).convert("RGB")
        for cname, b in cfg.get("crops", []):   # card art kept as-is (with its own painted background)
            save_hi(im.crop(b), os.path.join(CROPS, f"{cname}.webp"), quality=88)
        model = cfg.get("model", "isnet-general-use")
        session = sessions.setdefault(model, new_session(model))
        for i, b in enumerate(cfg["chars"]):
            cut = remove(im.crop(b), session=session)
            # UI that sat on top of the character in the design is not character
            for (ex0, ey0, ex1, ey1) in cfg.get("erase", []):
                r = (max(ex0, b[0]) - b[0], max(ey0, b[1]) - b[1], min(ex1, b[2]) - b[0], min(ey1, b[3]) - b[1])
                if r[2] > r[0] and r[3] > r[1]:
                    al = cut.split()[-1]; ImageDraw.Draw(al).rectangle(r, fill=0); cut.putalpha(al)
            if cfg.get("fill_holes"):   # semi-transparent interiors (glossy white robot heads): anything enclosed by the silhouette is solid
                al = cut.split()[-1]; bw = al.point(lambda v: 255 if v > 40 else 0).filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.MinFilter(9))
                pad = Image.new("L", (bw.width + 2, bw.height + 2), 0); pad.paste(bw, (1, 1))
                ImageDraw.floodfill(pad, (0, 0), 128)   # exterior -> 128
                inner = pad.crop((1, 1, bw.width + 1, bw.height + 1)).point(lambda v: 255 if v != 128 else 0)
                edge = inner.filter(ImageFilter.MinFilter(3))   # keep soft antialiased rim
                al = Image.composite(Image.new("L", al.size, 255), al, edge); cut.putalpha(al)
            if cfg.get("alpha_gamma"):   # glossy white robots come back half-transparent against white; firm them up
                al = cut.split()[-1].point(lambda v: int(255 * (v / 255) ** cfg["alpha_gamma"])); cut.putalpha(al)
            # Pale backdrops (a white speech bubble, a hazy city) come back as a broad
            # veil of alpha 1-60 -- invisible in the matte, but a ghost rectangle beside
            # the character once it is drawn on a light screen. A real antialiased edge
            # is never more than a pixel or two from something solid, so drop faint
            # pixels that sit away from the silhouette and leave the rim alone.
            al = cut.split()[-1]
            solid = al.point(lambda v: 255 if v > 160 else 0).filter(ImageFilter.MaxFilter(7))
            al = Image.composite(al, al.point(lambda v: 0 if v < 140 else v), solid)
            cut.putalpha(al)
            a = np.asarray(cut.split()[-1])
            if a.max() == 0: print(name, i, "empty"); continue
            ys, xs = np.where(a > 8); bb = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
            save_hi(cut.crop(bb), os.path.join(CHARS, f"{name}-{i}.webp"), quality=92)
            with open(os.path.join(CHARS, f"{name}-{i}.txt"), "w") as f: f.write(f"{b[0] + bb[0]} {b[1] + bb[1]} {bb[2] - bb[0]} {bb[3] - bb[1]}\n")
        print(name, "cut ok")
    import json
    man = {}
    for t in glob.glob(os.path.join(CHARS, "*.txt")):
        k = os.path.basename(t)[:-4]; x, y, w, h = map(int, open(t).read().split()); man[k] = [x, y, w, h]
    json.dump(man, open(os.path.join(CHARS, "manifest.json"), "w"))

def paint(names):
    """Stage 2: inpaint UI + character silhouettes (LaMa) into a clean scene."""
    from simple_lama_inpainting import SimpleLama
    lama = SimpleLama()
    for d in (SCENES, PREVIEW): os.makedirs(d, exist_ok=True)
    for name in names:
        cfg = SCREENS[name]; im = Image.open(src(cfg["file"])).convert("RGB")
        mask = Image.new("L", (W, H), 0); md = ImageDraw.Draw(mask)
        for b in cfg["ui"]: md.rectangle(b, fill=255)
        for i in range(len(cfg["chars"])):
            p = os.path.join(CHARS, f"{name}-{i}.txt")
            if not os.path.exists(p): continue
            x, y, w, h = map(int, open(p).read().split())
            a = Image.open(os.path.join(CHARS, f"{name}-{i}.webp")).split()[-1]
            if a.size != (w, h): a = a.resize((w, h), Image.LANCZOS)
            sil = a.point(lambda v: 255 if v > 8 else 0).filter(ImageFilter.MaxFilter(15))
            mask.paste(sil, (x, y), sil)
            # the drop shadow under a character sits just below its silhouette
            md.rectangle((x - 10, y + h - 20, x + w + 10, y + h + 34), fill=255)
        mask = mask.filter(ImageFilter.MaxFilter(41))   # panel borders and shadows
        # Text sitting straight on the artwork (headlines, taglines) must not be
        # masked as a block: that erases the city around it. Mask the glyphs only.
        for b in cfg.get("text", []):
            # high pass: anything with more local contrast than the sky is a glyph,
            # whichever colour it is drawn in
            g = im.crop(b).convert("L")
            diff = ImageChops.difference(g, g.filter(ImageFilter.GaussianBlur(12)))
            glyph = diff.point(lambda v: 255 if v > 12 else 0).filter(ImageFilter.MaxFilter(13))
            mask.paste(ImageChops.lighter(mask.crop(b), glyph), (b[0], b[1]))
        if cfg.get("fill") == "soft":
            # flat designs: a smooth gradient made from the design's own colours beats an inpaint
            med = tuple(int(v) for v in np.median(np.asarray(im).reshape(-1, 3), axis=0))
            out = Image.blend(Image.new("RGB", (W, H), med), im.resize((2, 2), Image.BOX).resize((W, H), Image.BICUBIC), 0.35)
        else:
            out = lama(im, mask)
            if out.size != (W, H): out = out.resize((W, H), Image.LANCZOS)
        # LaMa re-encodes the whole frame; keep the designer's pixels wherever we did not paint
        feather = mask.filter(ImageFilter.GaussianBlur(6))
        out = Image.composite(out, im, feather)
        save_hi(out, os.path.join(SCENES, f"{name}.webp"), quality=88)
        pv = Image.new("RGB", (W * 3 // 2, H // 2)); pv.paste(im.resize((W // 2, H // 2)), (0, 0))
        pv.paste(Image.merge("RGB", (mask, mask, mask)).resize((W // 2, H // 2)), (W // 2, 0)); pv.paste(out.resize((W // 2, H // 2)), (W, 0))
        pv.save(os.path.join(PREVIEW, f"{name}.png")); print(name, "paint ok")

def hires(_names=None):
    """One-off: re-save existing 1x outputs at SCALE x. Skips anything already scaled."""
    import json
    man = json.load(open(os.path.join(CHARS, "manifest.json")))
    for f in glob.glob(os.path.join(SCENES, "*.webp")):
        im = Image.open(f)
        if im.width >= W * SCALE: continue
        save_hi(im.convert("RGB"), f); print("scene", os.path.basename(f))
    for f in glob.glob(os.path.join(CHARS, "*.webp")):
        k = os.path.splitext(os.path.basename(f))[0]; im = Image.open(f)
        if k in man and im.width >= man[k][2] * SCALE: continue
        save_hi(im.convert("RGBA"), f, quality=92); print("char", k)
    for f in glob.glob(os.path.join(CROPS, "*.webp")):
        im = Image.open(f)
        if im.width >= 1000: continue
        save_hi(im.convert("RGB"), f); print("crop", os.path.basename(f))

if __name__ == "__main__":
    stage, names = sys.argv[1], sys.argv[2:] or list(SCREENS)
    {"cut": cut, "paint": paint, "hires": hires}[stage](names)
