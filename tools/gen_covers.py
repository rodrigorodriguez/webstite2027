#!/usr/bin/env python3
"""Generate Disrupção-themed procedural album covers.
DNA from images/disrupcao.jpg: deep cobalt (0,29,138), royal (7,79,183),
azure (47,143,231), ice (152,213,236); vertical luminosity ramp (dark top,
bright bottom); soft painterly turbulence; sparse luminous accents.
"""
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

W = H = 1400
OUT = "images/covers"
os.makedirs(OUT, exist_ok=True)

COBALT  = np.array([0, 29, 138], float)
ROYAL   = np.array([7, 79, 183], float)
AZURE   = np.array([47, 143, 231], float)
ICE     = np.array([152, 213, 236], float)
NAVY    = np.array([0, 6, 56], float)

# value-noise turbulence (poor-man's perlin, multi-octave, tileable-ish)
def noise_stack(rng, w, h, octaves=(( 3, 1.0), (7, 0.5), (17, 0.25), (43, 0.12))):
    acc = np.zeros((h, w), float)
    for cells, amp in octaves:
        g = rng.random((cells + 1, cells + 1))
        img = Image.fromarray((g * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
        acc += amp * (np.asarray(img, float) / 255.0)
    acc -= acc.min(); acc /= acc.max()
    return acc

def value_noise_rgb(rng, w, h, cells):
    g = rng.random((cells + 1, cells + 1, 3))
    img = Image.fromarray((g * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
    return np.asarray(img, float) / 255.0

def ramp(h, w):
    """vertical luminosity ramp like disrupcao: dark top -> bright bottom"""
    y = np.linspace(0, 1, h)[:, None]
    return np.repeat(y, w, axis=1)

def base_field(seed, tint_shift=0.0):
    rng = np.random.default_rng(seed)
    n = value_noise_rgb(rng, W, H, 4)                    # color turbulence
    n2 = noise_stack(rng, W, H)                          # luminance turbulence
    r = ramp(H, W)
    t = 0.22 + 0.5 * r + 0.26 * n2                       # position along palette
    t = np.clip(t + tint_shift, 0, 1)
    # palette: navy -> cobalt -> royal -> azure -> ice
    stops = [(0.0, NAVY), (0.28, COBALT), (0.55, ROYAL), (0.78, AZURE), (1.0, ICE)]
    img = np.zeros((H, W, 3), float)
    for (t0, c0), (t1, c1) in zip(stops, stops[1:]):
        m = np.clip((t - t0) / (t1 - t0), 0, 1)[..., None]
        seg = c0[None, None, :] * (1 - m) + c1[None, None, :] * m
        band = np.clip((t >= t0) & (t <= t1), 0, 1)[..., None]
        img = img * (1 - band) + seg * band
    # painterly warp: displace sampling with low-freq noise
    dx = (value_noise_rgb(rng, W, H, 3)[..., 0] - 0.5) * 26
    dy = (value_noise_rgb(rng, W, H, 3)[..., 1] - 0.5) * 26
    yy, xx = np.mgrid[0:H, 0:W]
    ix = np.clip((xx + dx).astype(int), 0, W - 1)
    iy = np.clip((yy + dy).astype(int), 0, H - 1)
    img = img[iy, ix]
    # subtle chroma variation from turbulence
    img *= (0.92 + 0.16 * n2)[..., None]
    return np.clip(img, 0, 255).astype(np.uint8)

def glow_blobs(img, rng, k=5, strength=90):
    """sparse luminous accents (bokeh-like) low in frame, like disrupcao's glow"""
    layer = Image.new("RGB", (W, H), (0, 0, 0))
    d = ImageDraw.Draw(layer)
    for _ in range(k):
        x = int(rng.uniform(0.1, 0.9) * W)
        y = int(rng.uniform(0.55, 0.95) * H)
        rad = int(rng.uniform(90, 260))
        col = AZURE if rng.random() < 0.6 else ICE
        a = int(strength * rng.uniform(0.5, 1.0))
        d.ellipse([x - rad, y - rad, x + rad, y + rad], fill=tuple(int(v * a / 255) for v in col))
    layer = layer.filter(ImageFilter.GaussianBlur(90))
    arr = np.asarray(layer, float)
    out = np.asarray(img, float) + arr
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))

def grain(img, seed, amt=7):
    rng = np.random.default_rng(seed + 999)
    a = np.asarray(img, float)
    n = rng.normal(0, amt, a.shape[:2])[..., None]
    return Image.fromarray(np.clip(a + n, 0, 255).astype(np.uint8))

FONT_B = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_R = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

def fit(draw, text, max_w, start, path=FONT_B):
    size = start
    while size > 18:
        f = ImageFont.truetype(path, size)
        if draw.textlength(text, font=f) <= max_w:
            return f
        size -= 2
    return ImageFont.truetype(path, 18)

def typeset(img, title, artist, year):
    d = ImageDraw.Draw(img)
    f_title = fit(d, title.upper(), W - 200, 118)
    f_artist = fit(d, artist.upper(), W - 260, 40, FONT_R)
    bb = d.textbbox((0, 0), title.upper(), font=f_title)
    tw = bb[2] - bb[0]
    x = (W - tw) // 2
    y = H - 300
    # soft scrim behind type for legibility
    scrim = Image.new("RGB", (W, H), (0, 0, 0))
    ds = ImageDraw.Draw(scrim)
    ds.rectangle([0, y - 80, W, H], fill=(0, 10, 40))
    scrim = scrim.filter(ImageFilter.GaussianBlur(70))
    img = Image.blend(img, Image.composite(scrim, img, scrim.convert("L").point(lambda v: min(v, 120))), 0.5)
    d = ImageDraw.Draw(img)
    # title with slight glow: draw blurred copy beneath
    glow = Image.new("RGB", (W, H), (0, 0, 0))
    dg = ImageDraw.Draw(glow)
    dg.text((x, y), title.upper(), font=f_title, fill=(120, 200, 255))
    glow = glow.filter(ImageFilter.GaussianBlur(14))
    img = Image.fromarray(np.clip(np.asarray(img, float) + np.asarray(glow, float) * 0.6, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(img)
    d.text((x, y), title.upper(), font=f_title, fill=(238, 246, 255))
    atxt = f"{artist.upper()}  |  {year}"
    f_a = ImageFont.truetype(FONT_R, 34)
    aw = d.textlength(atxt, font=f_a)
    d.text(((W - aw) / 2, y + bb[3] - bb[1] + 42), atxt, font=f_a, fill=(190, 222, 250))
    return img

def accent_marks(img, seed, kind):
    """per-album abstract identity marks, kept subtle and blue"""
    d = ImageDraw.Draw(img, "RGBA")
    rng = np.random.default_rng(seed + 7)
    if kind == "horizon":      # Do Brasil: luminous horizon + calm sea bands
        for i, (yy, wdt, a) in enumerate([(880, 5, 120), (960, 3, 90), (1060, 2, 70)]):
            d.line([120, yy, W - 120, yy], fill=(152, 213, 236, a), width=wdt)
        d.ellipse([W//2 - 130, 730, W//2 + 130, 990], outline=(152, 213, 236, 150), width=4)
    elif kind == "grid":       # LogX: digital grid + signal trace
        for gx in range(140, W, 168):
            d.line([gx, 120, gx, 860], fill=(47, 143, 231, 70), width=2)
        for gy in range(120, 880, 168):
            d.line([140, gy, W - 140, gy], fill=(47, 143, 231, 55), width=2)
        pts = [(int(140 + (W - 280) * t / 40), int(520 + np.sin(t / 2.6) * 160 * np.exp(-t / 34))) for t in range(41)]
        d.line(pts, fill=(152, 213, 236, 210), width=5)
    elif kind == "strings":    # Primitive Instrumentals: plucked string arcs
        for k in range(5):
            off = 240 + k * 190
            pts = [(int(x), int(300 + 300 * np.sin(np.pi * (x - off) / (W - 2 * off)) ** 0.8)) for x in range(off, W - off, 8)]
            d.line(pts, fill=(200 + k * 8, 225, 245, 120 - k * 15), width=3)
    elif kind == "duo":        # Roberto & Celso: two interlocked rings
        d.ellipse([330, 320, 830, 820], outline=(152, 213, 236, 190), width=7)
        d.ellipse([570, 430, 1070, 930], outline=(47, 143, 231, 200), width=7)
    elif kind == "bolts":      # A.M.E: vertical energy streaks
        for k in range(7):
            x = int(rng.uniform(0.15, 0.85) * W)
            y0 = int(rng.uniform(0.12, 0.4) * H)
            y1 = y0 + int(rng.uniform(260, 620))
            d.line([x, y0, x, y1], fill=(152, 213, 236, int(rng.uniform(90, 170))), width=int(rng.choice([3, 4, 6])))
    elif kind == "fracture":   # Nao E Mais: diagonal fracture
        for k in range(6):
            off = k * 26
            d.line([W // 2 - 300 + off, 140, W // 2 + 220 + off, H - 200], fill=(152, 213, 236, 110 - k * 14), width=3)
        d.polygon([(W//2 - 60, 300), (W//2 + 80, 420), (W//2 - 20, 560)], outline=(220, 240, 255, 170), width=4)
    return img

ALBUMS = [
    ("do-brasil-ai",                      "Do Brasil", "Rodrigo Rodriguez & Moina", "2010", 11, "horizon"),
    ("logx-ai",                           "LogX", "Rodrigo Rodriguez", "1998", 22, "grid"),
    ("primitive-instrumentals-ai",        "Primitive Instrumentals", "Rodrigo Rodriguez", "1998", 33, "strings"),
    ("roberto-ferreira-celso-esteves-ai", "Roberto Ferreira & Celso Esteves", "Roberto Ferreira & Celso Esteves", "1999", 44, "duo"),
    ("rodrigo-quik-ame-ai",               "A.M.E", "Rodrigo Quik", "2009", 55, "bolts"),
    ("nao-e-mais-um-disco-de-amor-ai",    "Nao E Mais Um Disco de Amor", "Rodrigo Quik", "2007", 66, "fracture"),
]

for name, title, artist, year, seed, kind in ALBUMS:
    img = Image.fromarray(base_field(seed))
    img = glow_blobs(img, np.random.default_rng(seed + 1))
    img = accent_marks(img, seed, kind)
    img = grain(img, seed)
    img = typeset(img, title, artist, year)
    img.save(f"{OUT}/{name}.jpg", quality=90)
    print("saved", name, img.size)
