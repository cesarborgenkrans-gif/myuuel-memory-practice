"""Draws the README banner and theme illustration from the approved Myuuel sheets.
Run: python tools/make-readme-art.py   (needs Pillow; uses system fonts when the preferred ones are missing)"""
import json, math, random, re, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
KIT = ROOT / 'assets/myuuel/motion-kit'
OUT = ROOT / 'docs/media'; OUT.mkdir(parents=True, exist_ok=True)

def font(names, size):
    for n in names:
        try: f = ImageFont.truetype(n, size)
        except OSError: continue
        try: f.set_variation_by_name('SemiBold')  # variable fonts default to their lightest weight
        except Exception: pass
        return f
    return ImageFont.load_default(size)
SERIF = ['georgia.ttf', 'P052-Roman.otf', '/usr/share/fonts/opentype/urw-base35/P052-Roman.otf']
SERIF_IT = ['georgiai.ttf', '/usr/share/fonts/opentype/urw-base35/P052-Italic.otf']
SANS = ['segoeuisb.ttf', '/tmp/nunito.ttf', 'DejaVuSans.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']
MONO = ['CascadiaMono.ttf', 'consola.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf']

sheets = {s['id']: s for s in json.loads((KIT / 'approved-sheets.json').read_text())}
reg = json.loads(re.search(r'=(\{.*\})', (KIT / 'rig/motion-registration.js').read_text(), re.S).group(1))

def actor(sheet_id, frame=0):
    """One drawing, registered exactly as the app does: 384x512, feet (support) at 192,464."""
    s = sheets[sheet_id]; im = Image.open(KIT / s['image']).convert('RGBA')
    ax, ay = (reg.get(sheet_id) or [s['anchor']] * 8)[frame]
    cell = im.crop(((frame % 4) * 384, (frame // 4) * 512, (frame % 4) * 384 + 384, (frame // 4) * 512 + 512))
    out = Image.new('RGBA', (384, 512)); out.alpha_composite(cell, (192 - ax, 464 - ay)); return out

def place(base, sprite, cx, feet, height):
    k = height / 512; sp = sprite.resize((round(384 * k), round(512 * k)), Image.LANCZOS)
    base.alpha_composite(sp, (round(cx - 192 * k), round(feet - 464 * k)))

def glow(img, x, y, r, rgb, a):
    layer = Image.new('RGBA', img.size); d = ImageDraw.Draw(layer)
    for i in range(24, 0, -1):
        rr = r * i / 24; d.ellipse((x - rr, y - rr, x + rr, y + rr), fill=(*rgb, int(255 * a * (1 - i / 24) ** 1.6 / 6)))
    img.alpha_composite(layer.filter(ImageFilter.GaussianBlur(r / 10)))

def sparkle(d, x, y, s, rgb, a):
    pts = [(x, y - s), (x + s * .16, y - s * .16), (x + s, y), (x + s * .16, y + s * .16), (x, y + s), (x - s * .16, y + s * .16), (x - s, y), (x - s * .16, y - s * .16)]
    d.polygon(pts, fill=(*rgb, a))

def lantern_sky(w, h, seed=7):
    img = Image.new('RGBA', (w, h)); d = ImageDraw.Draw(img)
    for y in range(h):
        t = y / h; c = [int(a + (b - a) * t) for a, b in zip((34, 20, 58), (11, 8, 18))]; d.line((0, y, w, y), fill=(*c, 255))
    glow(img, w * .7, h * .45, w * .55, (122, 79, 143), .9); glow(img, w * .25, h * .1, w * .4, (190, 104, 150), .45)
    r = random.Random(seed); d = ImageDraw.Draw(img)
    for _ in range(int(w * h / 3500)):
        x, y = r.random() * w, (r.random() ** 1.6) * h; s = r.random() * 1.6 + .4; a = int(60 + r.random() * 170)
        d.ellipse((x - s, y - s, x + s, y + s), fill=(255, 236, 205, a))
    for _ in range(int(w / 140)): sparkle(d, r.random() * w, r.random() * h * .7, 6 + r.random() * 9, (255, 236, 200), int(120 + r.random() * 120))
    return img

def type_sky(w, h, seed=3):
    img = Image.new('RGBA', (w, h), (9, 11, 18, 255)); d = ImageDraw.Draw(img)
    for y in range(4, h, 9):
        for x in range(4, w, 9): d.point((x, y), fill=(247, 242, 250, 22))
    for x in range(0, w, 96): d.line((x, 0, x, h), fill=(247, 242, 250, 9))
    for y in range(0, h, 96): d.line((0, y, w, y), fill=(247, 242, 250, 9))
    glow(img, w * .15, 0, w * .6, (130, 178, 250), .5); glow(img, w * .9, 0, w * .5, (236, 134, 194), .45)
    r = random.Random(seed); d = ImageDraw.Draw(img); f = font(SERIF_IT, 26)
    for _ in range(int(w * h / 9000)):
        tint = r.choice([(247, 242, 250), (236, 134, 194), (130, 178, 250), (255, 177, 92)])
        d.text((r.random() * w, r.random() * h), r.choice('AaBbKkMmQqRrSsTtWwYy2345789#&*?@~'), font=f, fill=(*tint, int(25 + r.random() * 45)))
    return img

def wire(img, cx, cy, R, yaw=.7, pitch=.42):
    d = ImageDraw.Draw(img); f = font(MONO, 15); cell = 12; cells = {}
    loops = []
    def ring(fn, n=72): loops.append([fn(i / n * math.tau) for i in range(n + 1)])
    ring(lambda a: (math.cos(a), math.sin(a), 0)); ring(lambda a: (0, math.cos(a), math.sin(a))); ring(lambda a: (math.cos(a), 0, math.sin(a)))
    for yy in (-.62, .62): rr = math.sqrt(1 - yy * yy); ring(lambda a, rr=rr, yy=yy: (math.cos(a) * rr, yy, math.sin(a) * rr), 60)
    for loop in loops:
        prev = None
        for x, y, z in loop:
            x, z = x * math.cos(yaw) + z * math.sin(yaw), -x * math.sin(yaw) + z * math.cos(yaw)
            y, z = y * math.cos(pitch) - z * math.sin(pitch), y * math.sin(pitch) + z * math.cos(pitch)
            px, py = cx + x * R, cy + y * R
            if prev:
                a = math.degrees(math.atan2(py - prev[1], px - prev[0])) % 180
                ch = '-' if a < 22.5 or a >= 157.5 else '\\' if a < 67.5 else '|' if a < 112.5 else '/'
                k = (round(px / cell), round(py / cell))
                if k not in cells or cells[k][1] < z: cells[k] = (ch, z)
            prev = (px, py)
    for (gx, gy), (ch, z) in cells.items():
        d.text((gx * cell, gy * cell), ch, font=f, anchor='mm', fill=(236, 134, 194, 170) if z > 0 else (130, 178, 250, 80))

def combo(d, x, y, text, size, colors):
    f = font(MONO, size); cx = x
    for c in text:
        col = colors['d'] if c.isdigit() else colors['a'] if c.isalpha() else colors['s']
        d.text((cx, y), c, font=f, fill=col); cx += d.textlength(c, font=f)
    return cx

def banner():
    W, H = 1280, 640; img = lantern_sky(W, H)
    glow(img, 1010, 330, 300, (255, 212, 150), .55)
    d = ImageDraw.Draw(img)
    d.ellipse((1010 - 190, 598 - 16, 1010 + 190, 598 + 16), outline=(232, 180, 90, 120), width=2)
    d.ellipse((1010 - 260, 598 - 22, 1010 + 260, 598 + 22), outline=(232, 180, 90, 50), width=2)
    place(img, actor('01-idle-blink'), 1010, 600, 560)
    logo = Image.open(ROOT / 'assets/brand/sparklesnap-watermark-v1-web.webp').convert('RGBA'); logo = logo.crop(logo.getbbox())
    logo.thumbnail((210, 70)); img.alpha_composite(logo, (72, 52))
    d = ImageDraw.Draw(img)
    d.text((70, 140), 'Myuuel', font=font(SERIF, 96), fill=(243, 205, 134))
    d.text((76, 252), 'MEMORY  PRACTICE', font=font(SANS, 26), fill=(203, 187, 216))
    d.text((76, 300), 'Glance. Recall. Remember — with fictional passwords only.', font=font(SERIF_IT, 25), fill=(236, 224, 246))
    # a practice card, as it appears in the app
    card = Image.new('RGBA', (W, H)); cd = ImageDraw.Draw(card)
    cd.rounded_rectangle((70, 368, 700, 572), radius=22, fill=(30, 20, 42, 215), outline=(232, 180, 90, 90), width=2)
    img.alpha_composite(card); d = ImageDraw.Draw(img)
    d.text((98, 388), 'LOOK', font=font(SANS, 20), fill=(243, 205, 134))
    d.text((170, 390), 'SENTENCE INITIALS', font=font(SANS, 16), fill=(189, 145, 231))
    combo(d, 98, 420, 'O5prgatg!', 72, {'a': (251, 243, 228), 'd': (212, 184, 246), 's': (244, 201, 119)})
    d.text((100, 522), '“Our 5 proud rabbits glowed around the garden!”', font=font(SERIF_IT, 22), fill=(203, 187, 216))
    img.convert('RGB').save(OUT / 'banner.png', optimize=True)

def themes():
    W, H = 1280, 560; half = W // 2
    left = lantern_sky(half, H, 11); glow(left, half / 2, 270, 220, (255, 212, 150), .5)
    d = ImageDraw.Draw(left); d.ellipse((half / 2 - 170, 488 - 14, half / 2 + 170, 488 + 14), outline=(232, 180, 90, 120), width=2)
    place(left, actor('04-thinking'), half / 2, 490, 430)
    right = type_sky(half, H); wire(right, half / 2, 290, 190, yaw=.9)
    d = ImageDraw.Draw(right); d.line((40, 492, half - 40, 492), fill=(247, 242, 250, 40), width=1)
    for i in range(0, 360, 8):
        a, b = math.radians(i), math.radians(i + 4)
        d.line((half / 2 + 170 * math.cos(a), 492 + 13 * math.sin(a), half / 2 + 170 * math.cos(b), 492 + 13 * math.sin(b)), fill=(236, 134, 194, 140), width=2)
    place(right, actor('16-cross-legged-thinking'), half / 2, 494, 430)
    img = Image.new('RGBA', (W, H)); img.alpha_composite(left, (0, 0)); img.alpha_composite(right, (half, 0))
    d = ImageDraw.Draw(img)
    d.text((40, 34), 'Lantern Night', font=font(SERIF, 38), fill=(243, 205, 134))
    d.text((42, 84), 'night plum · warm gold · her star ornament', font=font(SERIF_IT, 19), fill=(203, 187, 216))
    d.text((half + 40, 34), 'Living Type', font=font(SERIF, 38), fill=(247, 242, 250))
    d.text((half + 42, 84), 'ASCII wire form · drifting letters · Chiyuki dark', font=font(SERIF_IT, 19), fill=(236, 134, 194))
    d.line((half, 0, half, H), fill=(0, 0, 0, 255), width=3)
    img.convert('RGB').save(OUT / 'themes.png', optimize=True)

banner(); themes()
for f in sorted(OUT.iterdir()): print(f.name, f.stat().st_size)
