#!/usr/bin/env python3
"""Generate site icons from the Disrupção cover language.

Album DNA: deep navy -> cobalt -> royal -> azure vertical gradient,
cyan grid, azure glow blob. Identity mark: the disruption bolt,
glowing ice-white with a cyan halo. Pure stdlib (PNG/ICO by hand).
"""
import math
import os
import struct
import zlib

NAVY = (0, 6, 56)
COBALT = (0, 29, 138)
ROYAL = (7, 79, 183)
AZURE = (47, 143, 231)
ICE = (238, 246, 255)
CYAN = (103, 232, 249)

# Lightning bolt, normalized 0..1
BOLT = [
    (0.555, 0.055),
    (0.235, 0.565),
    (0.435, 0.565),
    (0.375, 0.945),
    (0.765, 0.415),
    (0.525, 0.415),
]

STOPS = [(0.0, NAVY), (0.5, COBALT), (0.8, ROYAL), (1.0, AZURE)]


def grad(t):
    for (t0, c0), (t1, c1) in zip(STOPS, STOPS[1:]):
        if t <= t1:
            m = (t - t0) / (t1 - t0)
            return tuple(c0[i] * (1 - m) + c1[i] * m for i in range(3))
    return AZURE


def pip(px, py, poly):
    inside = False
    j = len(poly) - 1
    for i in range(len(poly)):
        xi, yi = poly[i]
        xj, yj = poly[j]
        if (yi > py) != (yj > py):
            xc = (xj - xi) * (py - yi) / (yj - yi) + xi
            if px < xc:
                inside = not inside
        j = i
    return inside


def seg_d(px, py, x0, y0, x1, y1):
    dx, dy = x1 - x0, y1 - y0
    l2 = dx * dx + dy * dy
    if l2 == 0:
        return math.hypot(px - x0, py - y0)
    t = ((px - x0) * dx + (py - y0) * dy) / l2
    t = 0.0 if t < 0 else (1.0 if t > 1 else t)
    return math.hypot(px - (x0 + t * dx), py - (y0 + t * dy))


def render(S, maskable=False, square=False, ss=1):
    """Return RGBA bytes (S*S*4) of the icon at size S."""
    R = S * ss
    poly = [(x * R, y * R) for x, y in BOLT]
    if maskable:
        cx, cy = R / 2.0, R / 2.0
        poly = [(cx + (x - cx) * 0.78, cy + (y - cy) * 0.78) for x, y in poly]
    rad = R * 0.225
    grid = max(ss, (R // 8 // ss) * ss)
    halo = R * 0.11
    bx0 = min(p[0] for p in poly) - halo
    bx1 = max(p[0] for p in poly) + halo
    by0 = min(p[1] for p in poly) - halo
    by1 = max(p[1] for p in poly) + halo
    gx, gy, gr = 0.78 * R, 0.82 * R, 0.55 * R
    edge = max(1, R // 64)

    buf = bytearray(R * R * 4)
    pos = 0
    for y in range(R):
        base = grad(y / (R - 1.0))
        gyline = (y % grid) < edge
        for x in range(R):
            r, g, b = base
            # cyan grid
            if gyline or (x % grid) < edge:
                f = 0.16
                r = r * (1 - f) + CYAN[0] * f
                g = g * (1 - f) + CYAN[1] * f
                b = b * (1 - f) + CYAN[2] * f
            # azure glow blob low-right
            d = math.hypot(x - gx, y - gy)
            if d < gr:
                f = (1 - d / gr) * 0.42
                r += (AZURE[0] - r) * f * 0.5 + AZURE[0] * f * 0.2
                g += (AZURE[1] - g) * f * 0.5 + AZURE[1] * f * 0.2
                b += (AZURE[2] - b) * f * 0.5 + AZURE[2] * f * 0.2
            # bolt + halo
            if bx0 <= x <= bx1 and by0 <= y <= by1:
                dm = 1e9
                j = len(poly) - 1
                for i in range(len(poly)):
                    dm = min(dm, seg_d(x, y, poly[j][0], poly[j][1], poly[i][0], poly[i][1]))
                    j = i
                if dm <= halo:
                    f = (1 - dm / halo) * 0.5
                    r = r * (1 - f) + CYAN[0] * f
                    g = g * (1 - f) + CYAN[1] * f
                    b = b * (1 - f) + CYAN[2] * f
                inside = dm < 1e9 and pip(x, y, poly)
                cov = 0.0 if not inside else 1.0
                if not inside and dm < 1.0:
                    cov = 0.5 - dm if dm < 0.5 else 0.0
                if cov > 0:
                    r = r * (1 - cov) + ICE[0] * cov
                    g = g * (1 - cov) + ICE[1] * cov
                    b = b * (1 - cov) + ICE[2] * cov
            # rounded corners (skip for square outputs)
            a = 255
            if not square:
                cxx = rad if x < rad else (R - 1 - rad if x >= R - rad else None)
                cyy = rad if y < rad else (R - 1 - rad if y >= R - rad else None)
                if cxx is not None and cyy is not None:
                    ddx, ddy = x - cxx, y - cyy
                    dd = math.hypot(ddx, ddy)
                    if dd > rad + 0.5:
                        a = 0
                    elif dd > rad - 0.5:
                        a = int(255 * (rad + 0.5 - dd))
            buf[pos] = max(0, min(255, int(r)))
            buf[pos + 1] = max(0, min(255, int(g)))
            buf[pos + 2] = max(0, min(255, int(b)))
            buf[pos + 3] = a
            pos += 4

    if ss == 1:
        return bytes(buf)
    # box downsample ss x ss (alpha-weighted)
    out = bytearray(S * S * 4)
    for y in range(S):
        for x in range(S):
            rs = gs = bs = as_ = 0
            for yy in range(y * ss, (y + 1) * ss):
                row = yy * R * 4
                for xx in range(x * ss, (x + 1) * ss):
                    o = row + xx * 4
                    a = buf[o + 3]
                    as_ += a
                    rs += buf[o] * a
                    gs += buf[o + 1] * a
                    bs += buf[o + 2] * a
            o2 = (y * S + x) * 4
            if as_:
                out[o2] = rs // as_
                out[o2 + 1] = gs // as_
                out[o2 + 2] = bs // as_
            out[o2 + 3] = as_ // (ss * ss)
    return bytes(out)


def png_bytes(w, h, rgba):
    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    raw = b"".join(b"\x00" + rgba[y * w * 4:(y + 1) * w * 4] for y in range(h))
    return (b"\x89PNG\r\n\x1a\n"
            + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(raw, 9))
            + chunk(b"IEND", b""))


def save_png(path, S, **kw):
    data = png_bytes(S, S, render(S, **kw))
    with open(path, "wb") as f:
        f.write(data)
    print("saved", path, len(data) // 1024, "K")


def save_ico(path, sizes):
    imgs = [(s, png_bytes(s, s, render(s, ss=3))) for s in sizes]
    out = struct.pack("<HHH", 0, 1, len(imgs))
    offset = 6 + 16 * len(imgs)
    for s, data in imgs:
        out += struct.pack("<BBBBHHII", s % 256, s % 256, 0, 0, 1, 32, len(data), offset)
        out += data
        offset += len(data)
    with open(path, "wb") as f:
        f.write(out)
    print("saved", path, len(out) // 1024, "K")


os.makedirs("images/icons", exist_ok=True)
save_png("images/icons/icon-192.png", 192, ss=3)
save_png("images/icons/icon-512.png", 512)
save_png("images/icons/icon-maskable-512.png", 512, maskable=True)
save_png("images/icons/apple-touch-icon.png", 180, square=True, ss=3)
save_ico("favicon.ico", [16, 32, 48])


# ------------------------------------------------------------------
# OG card for /software (stdlib twin of tools/gen_og.py's `card()`:
# same cobalt gradient + cyan grid + domain footer, bolt mark added).
# ------------------------------------------------------------------

def save_og(path, W=1200, H=630):
    blob_x, blob_y, blob_r = 0.78 * W, 0.72 * H, 0.55 * W
    grid = 60
    bolt = [(x * W, y * H) for x, y in [
        (0.44, 0.24), (0.30, 0.50), (0.39, 0.50),
        (0.35, 0.74), (0.56, 0.44), (0.445, 0.44)]]
    buf = bytearray(W * H * 4)
    pos = 0
    for y in range(H):
        base = grad(y / (H - 1.0))
        hline = (y % grid) == 0
        for x in range(W):
            r, g, b = base
            if hline or (x % grid) == 0:
                f = 0.1
                r = r * (1 - f) + CYAN[0] * f
                g = g * (1 - f) + CYAN[1] * f
                b = b * (1 - f) + CYAN[2] * f
            d = math.hypot(x - blob_x, y - blob_y)
            if d < blob_r:
                f = (1 - d / blob_r) * 0.45
                r += (AZURE[0] - r) * f
                g += (AZURE[1] - g) * f
                b += (AZURE[2] - b) * f
            dm = min(seg_d(x, y, bolt[j][0], bolt[j][1], bolt[i][0], bolt[i][1])
                     for i in range(len(bolt)) for j in [(i - 1) % len(bolt)])
            if dm < 26:
                f = (1 - dm / 26) * 0.5
                r = r * (1 - f) + CYAN[0] * f
                g = g * (1 - f) + CYAN[1] * f
                b = b * (1 - f) + CYAN[2] * f
            if pip(x, y, bolt):
                r, g, b = ICE
            buf[pos] = int(r); buf[pos + 1] = int(g)
            buf[pos + 2] = int(b); buf[pos + 3] = 255
            pos += 4
    with open(path, "wb") as f:
        f.write(png_bytes(W, H, bytes(buf)))
    print("saved", path)


os.makedirs("images/og", exist_ok=True)
save_og("images/og/software.png")
save_og("images/og/biografia.png")
