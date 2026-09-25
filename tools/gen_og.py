#!/usr/bin/env python3
"""Branded OG cards (1200x630) in the Disrupção palette: cobalt gradient,
cyan grid, title + domain footer. Zero external deps."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np, os, json

NAVY = np.array([0, 6, 56], float)
COBALT = np.array([0, 29, 138], float)
ROYAL = np.array([7, 79, 183], float)
AZURE = np.array([47, 143, 231], float)
ICE = (238, 246, 255)
CYAN = (34, 211, 238)
W, H = 1200, 630
FB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

def bg():
    t = np.linspace(0, 1, H)[:, None]
    stops = [(0.0, NAVY), (0.45, COBALT), (0.78, ROYAL), (1.0, AZURE)]
    row = np.zeros((H, 3), float)
    for (t0, c0), (t1, c1) in zip(stops, stops[1:]):
        m = np.clip((t - t0) / (t1 - t0), 0, 1)
        seg = c0[None, :] * (1 - m) + c1[None, :] * m
        band = np.clip((t >= t0) & (t <= t1), 0, 1)
        row = row * (1 - band) + seg * band
    img = Image.fromarray(np.tile(row[:, None, :], (1, W, 1)).astype(np.uint8)).convert("RGB")
    d = ImageDraw.Draw(img, "RGBA")
    for g in range(0, W, 60):
        d.line([g, 0, g, H], fill=CYAN + (26,), width=1)
    for g in range(0, H, 60):
        d.line([0, g, W, g], fill=CYAN + (26,), width=1)
    blob = Image.new("RGB", (W, H), (0, 0, 0))
    db = ImageDraw.Draw(blob)
    db.ellipse([W * 0.55, H * 0.45, W * 1.05, H * 1.15], fill=(47, 143, 231))
    blob = blob.filter(ImageFilter.GaussianBlur(110))
    img = Image.fromarray(np.clip(np.asarray(img, float) + np.asarray(blob, float) * 0.5, 0, 255).astype(np.uint8))
    return img

def fit(d, text, max_w, start):
    size = start
    while size > 24:
        f = ImageFont.truetype(FB, size)
        if d.textlength(text, font=f) <= max_w:
            return f
        size -= 3
    return ImageFont.truetype(FB, 24)

def card(title, out):
    img = bg()
    d = ImageDraw.Draw(img)
    f1 = fit(d, title.upper(), W - 200, 96)
    bb = d.textbbox((0, 0), title.upper(), font=f1)
    x = (W - (bb[2] - bb[0])) // 2
    y = (H - (bb[3] - bb[1])) // 2 - 60
    glow = Image.new("RGB", (W, H), (0, 0, 0))
    ImageDraw.Draw(glow).text((x, y), title.upper(), font=f1, fill=(120, 200, 255))
    glow = glow.filter(ImageFilter.GaussianBlur(16))
    img = Image.fromarray(np.clip(np.asarray(img, float) + np.asarray(glow, float) * 0.6, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(img)
    d.text((x, y), title.upper(), font=f1, fill=ICE)
    # domain footer
    dom = "rodrigorodriguez.com"
    f2 = ImageFont.truetype(FR, 30)
    dw = d.textlength(dom, font=f2)
    d.line([W/2 - 190, H - 96, W/2 + 190, H - 96], fill=CYAN + (150,), width=2)
    d.text(((W - dw) / 2, H - 76), dom, font=f2, fill=(200, 228, 252))
    img.save(out, quality=82)
    print(out, os.path.getsize(out) // 1024, "K")

PAGES = json.load(open("tools/og_pages.json"))
os.makedirs("images/og", exist_ok=True)
for slug, title in PAGES.items():
    card(title, f"images/og/{slug}.jpg")
