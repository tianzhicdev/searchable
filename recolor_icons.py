#!/usr/bin/env python3
"""
Recolor pixel art icons to match the Midnight Orchid palette:
- Muted violet (#A78BFA) for primary warm/purple hues
- Indigo-blue (#818CF8) for cool/blue hues
- Emerald (#34D399) for green accents
Preserves alpha channel and grayscale pixels.
"""

from PIL import Image
import colorsys
from pathlib import Path

ICONS_DIR = Path('frontend') / 'src' / 'assets' / 'images' / 'icons'
SKIP_FOLDERS = {'legacy', 'source'}

def rgb_to_hsv(r, g, b):
    """Convert 0-255 RGB to HSV with H in 0-360, S/V in 0-1."""
    h, s, v = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
    return h * 360, s, v

def hsv_to_rgb(h, s, v):
    """Convert HSV (H 0-360, S/V 0-1) to 0-255 RGB."""
    r, g, b = colorsys.hsv_to_rgb(h / 360.0, s, v)
    return int(round(r * 255)), int(round(g * 255)), int(round(b * 255))

def recolor_pixel(r, g, b, a):
    """Recolor a single pixel based on its hue to match Midnight Orchid palette."""
    if a == 0:
        return (r, g, b, a)

    h, s, v = rgb_to_hsv(r, g, b)

    # Skip near-grayscale pixels (low saturation)
    if s < 0.15:
        return (r, g, b, a)

    # Purple/violet hues (250-320) -> muted violet (263, matching #A78BFA)
    if 250 <= h <= 320:
        new_h = 263  # violet hue
        new_s = min(s * 0.9, 0.75)  # slightly desaturated for muted look
        new_v = min(v * 1.0, 1.0)
        nr, ng, nb = hsv_to_rgb(new_h, new_s, new_v)
        return (nr, ng, nb, a)

    # Blue-ish hues (170-250) -> indigo-blue (235, matching #818CF8)
    if 170 <= h < 250:
        new_h = 235  # indigo hue
        new_s = min(s * 0.85, 0.7)
        new_v = min(v * 1.05, 1.0)
        nr, ng, nb = hsv_to_rgb(new_h, new_s, new_v)
        return (nr, ng, nb, a)

    # Pink/magenta hues (320-360, 0-10) -> violet (263, matching #A78BFA)
    if h > 320 or h < 10:
        new_h = 263  # violet
        new_s = min(s * 0.8, 0.7)
        new_v = min(v * 1.0, 1.0)
        nr, ng, nb = hsv_to_rgb(new_h, new_s, new_v)
        return (nr, ng, nb, a)

    # Green hues (80-170) -> emerald (160, matching #34D399)
    if 80 <= h < 170:
        new_h = 160
        new_s = min(s * 0.85, 0.75)
        new_v = min(v * 1.0, 1.0)
        nr, ng, nb = hsv_to_rgb(new_h, new_s, new_v)
        return (nr, ng, nb, a)

    # Warm hues (10-80, yellows/oranges) -> indigo-blue (235)
    if 10 <= h < 80:
        new_h = 235  # indigo
        new_s = min(s * 0.7, 0.6)  # gentle saturation
        new_v = min(v * 1.0, 1.0)
        nr, ng, nb = hsv_to_rgb(new_h, new_s, new_v)
        return (nr, ng, nb, a)

    return (r, g, b, a)

def recolor_image(filepath):
    """Recolor all pixels in an image."""
    img = Image.open(filepath).convert('RGBA')
    pixels = img.load()
    width, height = img.size

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            pixels[x, y] = recolor_pixel(r, g, b, a)

    img.save(filepath)
    print(f"  Recolored: {filepath.relative_to(ICONS_DIR)}")


def iter_icon_files():
    """Yield production icon files, excluding source and legacy folders."""
    for filepath in sorted(ICONS_DIR.rglob('*.png')):
        if any(part in SKIP_FOLDERS for part in filepath.relative_to(ICONS_DIR).parts):
            continue
        yield filepath

def main():
    png_files = list(iter_icon_files())
    print(
        f"Found {len(png_files)} icons to recolor in {ICONS_DIR}/ "
        "(excluding legacy/source)"
    )

    for filepath in png_files:
        recolor_image(filepath)

    print(f"\nDone! Recolored {len(png_files)} icons.")

if __name__ == '__main__':
    main()
