#!/usr/bin/env python3
"""Extract individual icons from sprite sheets using manual bounding boxes."""

import numpy as np
from PIL import Image
from pathlib import Path

SRC_DIR = Path.home() / "Downloads" / "Eccentric New Design"
OUT_DIR = (
    Path(__file__).resolve().parent
    / "frontend"
    / "src"
    / "assets"
    / "images"
    / "icons"
    / "source"
    / "extracted"
)
OUT_DIR.mkdir(parents=True, exist_ok=True)

PAD = 10  # extra padding


def crop_icon(img_arr, x, y, w, h, img_w, img_h):
    """Crop an icon region, make white pixels transparent, trim to content."""
    x0 = max(0, x - PAD)
    y0 = max(0, y - PAD)
    x1 = min(img_w, x + w + PAD)
    y1 = min(img_h, y + h + PAD)
    crop = img_arr[y0:y1, x0:x1].copy()
    # Make white pixels transparent
    white = (crop[:, :, 0] > 245) & (crop[:, :, 1] > 245) & (crop[:, :, 2] > 245)
    crop[white, 3] = 0
    # Trim transparent borders
    alpha = crop[:, :, 3]
    rows = np.any(alpha > 0, axis=1)
    cols = np.any(alpha > 0, axis=0)
    if not rows.any() or not cols.any():
        return None
    rmin, rmax = np.where(rows)[0][[0, -1]]
    cmin, cmax = np.where(cols)[0][[0, -1]]
    trimmed = crop[max(0, rmin - 4):rmax + 5, max(0, cmin - 4):cmax + 5]
    return Image.fromarray(trimmed)


def process_sheet(image_path, icons_def):
    """Process a sprite sheet with manually defined icon regions."""
    img = Image.open(image_path).convert("RGBA")
    arr = np.array(img)
    img_w, img_h = img.size
    saved = 0
    for name, (x, y, w, h) in icons_def.items():
        result = crop_icon(arr, x, y, w, h, img_w, img_h)
        if result:
            result.save(OUT_DIR / f"{name}.png")
            rw, rh = result.size
            print(f"  {name}.png  {rw}x{rh}")
            saved += 1
        else:
            print(f"  {name} - EMPTY, skipped")
    return saved


# =============================================================================
# Image 1: Purple pixel art (1792 x 2400)
# Manual bounding boxes: (x, y, width, height) in pixels
# =============================================================================
print("=== Image 1 (purple pixel art) ===")
sheet1 = {
    # Row 1 - sparkles and shapes
    "sparkles-cluster":       (20, 30, 350, 300),
    "sparkles-group":         (400, 30, 400, 300),
    "cube-large":             (800, 30, 350, 350),
    "window-titlebar":        (1200, 40, 570, 140),
    # Row 2 - sparkles, shapes
    "sparkle-green-large":    (30, 350, 350, 350),
    "sparkles-purple":        (400, 350, 350, 350),
    "cube-small":             (800, 300, 280, 280),
    "sphere-purple":          (1100, 300, 280, 280),
    "pyramid":                (1400, 300, 280, 280),
    # Row 3 - retro objects (y~690-860)
    "joystick":               (955, 690, 230, 170),
    "heart-pixel":            (1200, 650, 260, 210),
    "mushroom":               (1470, 690, 240, 170),
    # Row 4 - smileys (starts y~920)
    "smiley-happy":           (60, 915, 280, 260),
    "smiley-neutral":         (390, 915, 280, 260),
    "smiley-blushing":        (710, 915, 280, 260),
    "smiley-winking":         (1040, 915, 280, 260),
    "smiley-cute":            (1370, 915, 280, 260),
    # Row 5 - retro tech + cursors + moon (starts y~1240)
    "floppy-disk":            (85, 1240, 230, 230),
    "cassette-tape":          (385, 1240, 320, 230),
    "tamagotchi":             (780, 1230, 230, 240),
    "cursor-small":           (1075, 1290, 110, 140),
    "cursor-medium":          (1220, 1270, 100, 170),
    "cursor-large":           (1350, 1250, 100, 200),
    "moon-crescent":          (1480, 1240, 220, 230),
    # Row 6 - moon, cloud, shapes (starts y~1540)
    "moon-star":              (80, 1540, 210, 200),
    "cloud":                  (350, 1570, 370, 170),
    "sphere-shiny":           (765, 1550, 220, 200),
    "chat-bubble":            (1030, 1590, 410, 140),
    "diamond-purple":         (1490, 1530, 210, 200),
    # Row 7 - progress bars + coin (starts y~1820)
    "progress-bar-full":      (80, 1825, 625, 90),
    "progress-bar-half":      (740, 1825, 330, 90),
    "progress-bar-empty":     (1110, 1825, 330, 90),
    "coin-side":              (1470, 1825, 240, 90),
    # Row 8 - characters + coins (actual sprites start at y~2030, platforms above at y:1830)
    "cat-pixel":              (80, 2030, 340, 280),
    "robot-pixel":            (490, 1960, 320, 350),
    "coin-dollar":            (910, 2060, 250, 250),
    "coin-generic":           (1190, 2060, 260, 250),
    "coin-ethereum":          (1490, 2060, 230, 250),
}
n1 = process_sheet(SRC_DIR / "1000109572.png", sheet1)

# =============================================================================
# Image 2: Pastel gradient (1792 x 2400)
# =============================================================================
print(f"\n=== Image 2 (pastel gradient) ===")
sheet2 = {
    # Top area
    "sparkles-pastel":          (50, 40, 420, 420),
    "sparkles-small-pastel":    (500, 80, 280, 350),
    "browser-window":           (900, 40, 830, 500),
    # Middle scattered
    "sparkle-gradient-large":   (370, 370, 230, 230),
    "sphere-pastel-small":      (820, 360, 150, 150),
    "sparkles-tiny-gold":       (460, 610, 220, 220),
    # Center area
    "cursor-heart":             (620, 760, 220, 270),
    "sphere-pastel-large":      (830, 520, 300, 300),
    "cube-gradient":            (1090, 490, 200, 120),
    "arrows-triangles":         (1310, 370, 270, 320),
    "cube-small-gradient":      (1440, 580, 220, 230),
    # Lower center
    "sphere-basketball":        (100, 810, 400, 400),
    "diamond-gradient":         (340, 850, 300, 340),
    "cursor-hearts":            (620, 1010, 200, 270),
    "coin-dollar-gold":         (860, 840, 260, 260),
    "coin-dollar-silver":       (850, 1090, 270, 270),
    "coin-dollar-pink":         (1190, 860, 320, 320),
    # Bottom area
    "browser-windows-stacked":  (50, 1380, 680, 600),
    "robot-cute":               (860, 1610, 280, 350),
    "cloud-sunglasses":         (1190, 1590, 350, 320),
}
n2 = process_sheet(SRC_DIR / "1000109573.png", sheet2)

# =============================================================================
# Image 3: Mixed pixel/gradient (1792 x 2400)
# =============================================================================
print(f"\n=== Image 3 (mixed pixel/gradient) ===")
sheet3 = {
    # Top area - sparkles glow is a large glowing 4-point star
    "sparkles-glow":            (30, 30, 400, 400),
    "snowflake-small":          (550, 260, 120, 120),
    "snowflake-large":          (590, 160, 160, 160),
    "smiley-small-pixel":       (680, 220, 160, 170),
    "windows-stack-ok":         (1050, 50, 680, 440),
    # Middle top
    "smiley-green-pixel":       (60, 550, 190, 210),
    "joystick-isometric":       (270, 340, 370, 370),
    "potion-bottle":            (650, 320, 310, 390),
    "diamond-glow":             (950, 420, 200, 220),
    "cursor-swiftui":           (1390, 370, 300, 300),
    # Sparkle row - dashed sparkle shapes
    "sparkle-dashed-small":     (330, 700, 190, 190),
    "sparkle-dashed-medium":    (530, 670, 250, 250),
    "sparkle-dashed-large":     (790, 670, 290, 300),
    # Action row
    "sparkle-star-purple":      (40, 770, 270, 280),
    "cursor-arrow-outline":     (340, 860, 220, 260),
    "cursor-arrow-filled":      (600, 860, 190, 230),
    "clouds-duo":               (1090, 770, 500, 320),
    # Characters
    "character-blue-wave":      (890, 1110, 280, 320),
    "character-green-happy":    (1270, 930, 300, 360),
    # Dialog and sparkles
    "dialog-box-ok-cancel":     (40, 1100, 620, 700),
    "sparkles-mixed-colors":    (670, 1240, 350, 360),
    "sparkle-large-purple":     (690, 1550, 360, 360),
    # Coins
    "bitcoin-coin":             (1230, 1350, 250, 270),
    "bit-coin-text":            (1080, 1560, 290, 280),
    "coin-text-purple":         (1370, 1610, 320, 320),
}
n3 = process_sheet(SRC_DIR / "1000109574.png", sheet3)

print(f"\nTotal: {n1 + n2 + n3} icons → {OUT_DIR}")
