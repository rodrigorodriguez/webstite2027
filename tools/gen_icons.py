#!/usr/bin/env python3
"""Generate site icons in the Disrupção cover palette.
Deep navy -> cobalt gradient, cyan grid, glowing ice 'R' monogram.
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np
import os

NAVY = np.array([0, 6, 56], float)
COBALT = np.array([0, 29, 138], float)
ROYAL = np.array([7, 79, 183], float)
AZURE = np.array([47, 143, 231], float)
ICE = (238, 246, 255)
CYAN = (34, 211, 238)
FONT_B = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def gradient_bg(size):
    t = np.linspace(0, 1, size)[:, None]
    stops = [(0.0, NAVY), (0.5, COBALT), (0.8, ROYAL), (1.0, AZURE)]
    row = np.zeros((size, 3), float)
    for (t0, c0), (t1, c1) in zip(stops, stops[1:]):
        m = np.clip((t - t0) / (t1 - t0), 0, 1)
        seg = c0[None, :] * (1 - m) + c1[None, :] * m
        band = np.clip((t >= t0) & (t <= t1), 0, 1)
        row = row * (1 - band) + seg * band
    return Image.fromarray(np.tile(row[:, None, :], (1, size, 1)).astype(np.uint8))


def make_icon(size, out, maskable=False):
    img = gradient_bg(size).convert("RGB")
    d = ImageDraw.Draw(img, "RGBA")
    step = max(24, size // 12)
    for g in range(0, size, step):
        d.line([0, g, size, g], fill=CYAN + (28,), width=1)
        d.line([g, 0, g, size], fill=CYAN + (28,), width=1)
    # glow blob low-right like the covers
    blob = Image.new("RGB", (size, size), (0, 0, 0))
    db = ImageDraw.Draw(blob)
    r = size // 2
    db.ellipse([size * 0.45, size * 0.5, size * 0.45 + r, size * 0.5 + r], fill=(47, 143, 231))
    blob = blob.filter(ImageFilter.GaussianBlur(size // 6))
    img = Image.fromarray(np.clip(np.asarray(img, float) + np.asarray(blob, float) * 0.55, 0, 255).astype(np.uint8))
    # monogram
    d = ImageDraw.Draw(img)
    f = ImageFont.truetype(FONT_B, int(size * (0.52 if maskable else 0.62)))
    bb = d.textbbox((0, 0), "R", font=f)
    x = (size - (bb[2] - bb[0])) // 2 - bb[0]
    y = (size - (bb[3] - bb[1])) // 2 - bb[1] - (size * 0.04 if maskable else 0)
    glow = Image.new("RGB", (size, size), (0, 0, 0))
    dg = ImageDraw.Draw(glow)
    dg.text((x, y), "R", font=f, fill=(120, 200, 255))
    glow = glow.filter(ImageFilter.GaussianBlur(max(3, size // 40)))
    img = Image.fromarray(np.clip(np.asarray(img, float) + np.asarray(glow, float) * 0.7, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(img)
    d.text((x, y), "R", font=f, fill=ICE)
    if maskable:
        # keep content inside 80% safe zone: draw on padded canvas is handled by scale above
        pass
    img.save(out, quality=92)
    print("saved", out, img.size)


os.makedirs("images/icons", exist_ok=True)
make_icon(192, "images/icons/icon-192.png")
make_icon(512, "images/icons/icon-512.png")
make_icon(180, "images/icons/apple-touch-icon.png")
make_icon(512, "images/icons/icon-maskable-512.png", maskable=True)
