#!/usr/bin/env python3
"""
Store assets generator for Point (Точки) game.
Creates PNG files for Google Play Store — stdlib only (no external deps).

Output:
  store_assets/icon_512.png                 — 512×512   app icon
  store_assets/feature_graphic_1024x500.png — 1024×500  feature graphic
  store_assets/screenshot_1080x1920.png     — 1080×1920 phone screenshot
"""
import zlib
import struct
import math
import os
import random

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "store_assets")

# ── Color palette ─────────────────────────────────────────────────────────────

BG_DARK   = (12,  12,  32)
BG_MED    = (22,  22,  52)
GRID_CLR  = (45,  45,  90)
RED       = (220, 55,  55)
BLUE      = (55,  120, 220)
RED_AREA  = (90,  25,  25)
BLUE_AREA = (20,  45,  90)
RED_HL    = (255, 110, 110)
BLUE_HL   = (110, 170, 255)

# ── PNG encoder ───────────────────────────────────────────────────────────────

def encode_png(pixels):
    """Encode list-of-rows of (R,G,B) tuples to PNG bytes."""
    H = len(pixels)
    W = len(pixels[0])
    raw = bytearray()
    for row in pixels:
        raw.append(0)  # filter: None
        for r, g, b in row:
            raw += bytes([r & 0xFF, g & 0xFF, b & 0xFF])

    def chunk(tag, data):
        payload = tag + data
        crc = zlib.crc32(payload) & 0xFFFFFFFF
        return struct.pack(">I", len(data)) + payload + struct.pack(">I", crc)

    ihdr = struct.pack(">II", W, H) + bytes([8, 2, 0, 0, 0])  # 8-bit RGB
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", zlib.compress(bytes(raw), 6))
        + chunk(b"IEND", b"")
    )

# ── Drawing primitives ────────────────────────────────────────────────────────

def new_canvas(W, H, color=BG_DARK):
    row = [color] * W
    return [row[:] for _ in range(H)]

def blend(bg, fg, a):
    return tuple(int(bg[i] * (1 - a) + fg[i] * a) for i in range(3))

def fill_rect(c, x0, y0, x1, y1, color):
    W, H = len(c[0]), len(c)
    for y in range(max(0, y0), min(H, y1)):
        row = c[y]
        for x in range(max(0, x0), min(W, x1)):
            row[x] = color

def gradient_v(c, x0, y0, x1, y1, c1, c2):
    """Vertical gradient fill."""
    W, H = len(c[0]), len(c)
    span = max(1, y1 - y0)
    for y in range(max(0, y0), min(H, y1)):
        t = (y - y0) / span
        col = tuple(int(a + (b - a) * t) for a, b in zip(c1, c2))
        row = c[y]
        for x in range(max(0, x0), min(W, x1)):
            row[x] = col

def draw_circle(c, cx, cy, r, color, alpha=1.0):
    """Anti-aliased filled circle."""
    W, H = len(c[0]), len(c)
    for y in range(max(0, cy - r - 1), min(H, cy + r + 2)):
        dy2 = (y - cy) ** 2
        row = c[y]
        for x in range(max(0, cx - r - 1), min(W, cx + r + 2)):
            d = math.sqrt((x - cx) ** 2 + dy2)
            a = max(0.0, min(1.0, r - d + 0.5)) * alpha
            if a > 0.003:
                row[x] = blend(row[x], color, a)

def draw_dot(c, cx, cy, r, color):
    """Filled dot with inner highlight."""
    draw_circle(c, cx, cy, r, color)
    hl = tuple(min(255, int(v * 1.6)) for v in color)
    draw_circle(c, cx - r // 4, cy - r // 4, max(1, r // 3), hl, 0.55)

def draw_line_h(c, y, x0, x1, color, alpha=1.0):
    W = len(c[0])
    row = c[y]
    for x in range(max(0, x0), min(W, x1)):
        row[x] = blend(row[x], color, alpha)

def draw_line_v(c, x, y0, y1, color, alpha=1.0):
    H = len(c)
    for y in range(max(0, y0), min(H, y1)):
        c[y][x] = blend(c[y][x], color, alpha)

def fill_polygon_grid(c, pts_grid, cell, ox, oy, color, alpha=0.45):
    """Fill a polygon given as grid-coord vertices."""
    W, H = len(c[0]), len(c)
    pts = [(ox + p[0] * cell, oy + p[1] * cell) for p in pts_grid]
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    x0, x1 = max(0, int(min(xs))), min(W, int(max(xs)) + 1)
    y0, y1 = max(0, int(min(ys))), min(H, int(max(ys)) + 1)
    n = len(pts)
    for py in range(y0, y1):
        row = c[py]
        for px in range(x0, x1):
            inside = False
            j = n - 1
            for i in range(n):
                xi, yi = pts[i]
                xj, yj = pts[j]
                if (yi > py) != (yj > py):
                    if px < (xj - xi) * (py - yi) / (yj - yi + 1e-9) + xi:
                        inside = not inside
                j = i
            if inside:
                row[px] = blend(row[px], color, alpha)

# ── Icon 512×512 ──────────────────────────────────────────────────────────────

def make_icon():
    W, H = 512, 512
    c = new_canvas(W, H)
    gradient_v(c, 0, 0, W, H, BG_MED, BG_DARK)

    COLS, ROWS = 5, 5
    cell = 90
    ox = (W - (COLS - 1) * cell) // 2
    oy = (H - (ROWS - 1) * cell) // 2
    DOT_R = 20

    # Grid lines
    for i in range(COLS):
        draw_line_v(c, ox + i * cell, oy, oy + (ROWS - 1) * cell + 1, GRID_CLR, 0.5)
    for j in range(ROWS):
        draw_line_h(c, oy + j * cell, ox, ox + (COLS - 1) * cell + 1, GRID_CLR, 0.5)

    # Captured territories
    fill_polygon_grid(c, [(0, 0), (2, 0), (2, 2), (0, 2)], cell, ox, oy, RED_AREA, 0.5)
    fill_polygon_grid(c, [(2, 2), (4, 2), (4, 4), (2, 4)], cell, ox, oy, BLUE_AREA, 0.5)

    # Boundary dots of captured regions
    dots = [
        (0, 0, RED), (2, 0, RED), (0, 2, RED), (2, 2, RED),
        (2, 2, BLUE), (4, 2, BLUE), (2, 4, BLUE), (4, 4, BLUE),
        (1, 1, RED), (3, 1, BLUE), (1, 3, RED), (3, 3, BLUE),
        (0, 4, RED), (4, 0, BLUE),
    ]
    seen = set()
    for col, row, color in dots:
        key = (col, row)
        if key in seen:
            continue
        seen.add(key)
        draw_dot(c, ox + col * cell, oy + row * cell, DOT_R, color)

    return encode_png(c)

# ── Feature Graphic 1024×500 ──────────────────────────────────────────────────

def make_feature():
    W, H = 1024, 500
    c = new_canvas(W, H)
    gradient_v(c, 0, 0, W, H, BG_MED, BG_DARK)

    # Faint background dots scattered
    rng = random.Random(42)
    for _ in range(55):
        bx = rng.randint(20, W - 20)
        by = rng.randint(20, H - 20)
        br = rng.randint(4, 11)
        bc = RED if rng.random() < 0.5 else BLUE
        draw_circle(c, bx, by, br, bc, 0.15)

    # Central 3×3 grid
    COLS, ROWS = 3, 3
    cell = 110
    ox = (W - (COLS - 1) * cell) // 2
    oy = (H - (ROWS - 1) * cell) // 2
    DOT_R = 34

    for i in range(COLS):
        draw_line_v(c, ox + i * cell, oy, oy + (ROWS - 1) * cell + 1, GRID_CLR, 0.6)
    for j in range(ROWS):
        draw_line_h(c, oy + j * cell, ox, ox + (COLS - 1) * cell + 1, GRID_CLR, 0.6)

    # Blue captures entire field
    fill_polygon_grid(c, [(0, 0), (2, 0), (2, 2), (0, 2)], cell, ox, oy, BLUE_AREA, 0.45)

    # Checkerboard red/blue
    layout = [
        (0, 0, BLUE), (1, 0, RED),  (2, 0, BLUE),
        (0, 1, RED),  (1, 1, BLUE), (2, 1, RED),
        (0, 2, BLUE), (1, 2, RED),  (2, 2, BLUE),
    ]
    for col, row, color in layout:
        draw_dot(c, ox + col * cell, oy + row * cell, DOT_R, color)

    return encode_png(c)

# ── Screenshot 1080×1920 ──────────────────────────────────────────────────────

def make_screenshot():
    W, H = 1080, 1920
    c = new_canvas(W, H, BG_DARK)

    STATUS_H = 80
    HEADER_H = 100
    NAV_H    = 80
    GAME_TOP = STATUS_H + HEADER_H
    GAME_BOT = H - NAV_H

    # Status bar
    fill_rect(c, 0, 0, W, STATUS_H, (18, 18, 42))

    # Header
    gradient_v(c, 0, STATUS_H, W, STATUS_H + HEADER_H, (30, 30, 65), (22, 22, 52))
    # Score pills
    draw_dot(c, 130, STATUS_H + HEADER_H // 2, 32, RED)
    draw_dot(c, W - 130, STATUS_H + HEADER_H // 2, 32, BLUE)
    # Score numbers (3 small circles simulate "0 : 0")
    for dx in range(-8, 9, 8):
        draw_circle(c, W // 2 + dx, STATUS_H + HEADER_H // 2, 5, GRID_CLR, 0.9)

    # Game area background
    fill_rect(c, 0, GAME_TOP, W, GAME_BOT, BG_DARK)

    # 11×11 board
    COLS, ROWS = 11, 11
    CELL = min(W, GAME_BOT - GAME_TOP) // 13
    board_w = (COLS - 1) * CELL
    board_h = (ROWS - 1) * CELL
    ox = (W - board_w) // 2
    oy = GAME_TOP + (GAME_BOT - GAME_TOP - board_h) // 2
    DOT_R = max(5, CELL // 4)

    # Grid lines
    for i in range(COLS):
        draw_line_v(c, ox + i * CELL, oy, oy + board_h + 1, GRID_CLR, 0.55)
    for j in range(ROWS):
        draw_line_h(c, oy + j * CELL, ox, ox + board_w + 1, GRID_CLR, 0.55)

    # Captured territories
    fill_polygon_grid(c, [(1, 1), (5, 1), (5, 5), (1, 5)], CELL, ox, oy, RED_AREA, 0.5)
    fill_polygon_grid(c, [(5, 5), (9, 5), (9, 9), (5, 9)], CELL, ox, oy, BLUE_AREA, 0.5)

    # Dots
    red_dots = [
        (1, 0), (3, 0), (5, 0),
        (0, 1), (2, 1), (4, 1), (6, 1),
        (1, 2), (3, 2), (5, 2),
        (0, 3), (2, 3), (4, 3),
        (1, 4), (3, 4), (5, 4),
        (0, 6), (2, 6), (4, 6),
        (1, 8), (3, 8),
        (0, 9), (2, 9), (4, 9),
        (1, 10), (3, 10), (5, 10),
    ]
    blue_dots = [
        (7, 0), (9, 0),
        (8, 1), (10, 1),
        (6, 2), (8, 2), (10, 2),
        (7, 3), (9, 3),
        (6, 4), (8, 4), (10, 4),
        (6, 6), (8, 6), (10, 6),
        (5, 7), (7, 7), (9, 7),
        (6, 8), (8, 8), (10, 8),
        (5, 9), (7, 9), (9, 9),
        (6, 10), (8, 10), (10, 10),
    ]
    for col, row in red_dots:
        if 0 <= col < COLS and 0 <= row < ROWS:
            draw_dot(c, ox + col * CELL, oy + row * CELL, DOT_R, RED)
    for col, row in blue_dots:
        if 0 <= col < COLS and 0 <= row < ROWS:
            draw_dot(c, ox + col * CELL, oy + row * CELL, DOT_R, BLUE)

    # Nav bar
    fill_rect(c, 0, GAME_BOT, W, H, (15, 15, 38))
    draw_circle(c, W // 2, GAME_BOT + NAV_H // 2, 20, GRID_CLR, 0.7)

    return encode_png(c)

# ── Entry point ───────────────────────────────────────────────────────────────

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    assets = [
        ("icon_512.png",                 make_icon,       "512×512"),
        ("feature_graphic_1024x500.png", make_feature,    "1024×500"),
        ("screenshot_1080x1920.png",     make_screenshot, "1080×1920"),
    ]

    for filename, fn, size in assets:
        path = os.path.join(OUTPUT_DIR, filename)
        print(f"Generating {filename} ({size})...", end=" ", flush=True)
        data = fn()
        with open(path, "wb") as f:
            f.write(data)
        print(f"done  ({len(data):,} bytes)")

    print(f"\nAll assets saved to: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
