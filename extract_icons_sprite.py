#!/usr/bin/env python3
"""
Extract individual icons from a sprite sheet.
Simple approach: find connected non-white regions, cut at white space.
No pixel modification — just crop.
"""

import os
from PIL import Image
import numpy as np
from collections import deque

def find_components(mask):
    """BFS connected component labeling (8-connected)."""
    h, w = mask.shape
    labels = np.zeros((h, w), dtype=np.int32)
    cid = 0
    for y in range(h):
        for x in range(w):
            if mask[y, x] and labels[y, x] == 0:
                cid += 1
                q = deque([(y, x)])
                labels[y, x] = cid
                while q:
                    cy, cx = q.popleft()
                    for dy in (-1, 0, 1):
                        for dx in (-1, 0, 1):
                            if dy == 0 and dx == 0:
                                continue
                            ny, nx = cy + dy, cx + dx
                            if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and labels[ny, nx] == 0:
                                labels[ny, nx] = cid
                                q.append((ny, nx))
    return labels, cid

def extract_icons(input_path, output_dir):
    os.makedirs(output_dir, exist_ok=True)

    img = Image.open(input_path).convert('RGBA')
    px = np.array(img)
    h, w = px.shape[:2]
    r, g, b, a = px[:,:,0], px[:,:,1], px[:,:,2], px[:,:,3]

    # Content = anything that is NOT white/near-white
    is_content = ~((r > 250) & (g > 250) & (b > 250)) & (a > 10)

    print(f"Image: {w}x{h}, content pixels: {is_content.sum()}")

    # Find connected regions of content
    print("Finding connected regions...")
    labels, num = find_components(is_content)
    print(f"Connected regions: {num}")

    # Get bboxes, skip tiny noise
    bboxes = []
    for cid in range(1, num + 1):
        ys, xs = np.where(labels == cid)
        if len(ys) < 80:  # skip tiny specks
            continue
        bbox = (int(ys.min()), int(xs.min()), int(ys.max()), int(xs.max()))
        bh = bbox[2] - bbox[0] + 1
        bw = bbox[3] - bbox[1] + 1
        if bh < 15 and bw < 15:
            continue
        bboxes.append(bbox)

    print(f"After filtering noise: {len(bboxes)} regions")

    # Merge bboxes that overlap or are within 3px (parts of same icon)
    bboxes.sort(key=lambda b: (b[2]-b[0])*(b[3]-b[1]), reverse=True)
    merged = []
    used = [False] * len(bboxes)

    for i in range(len(bboxes)):
        if used[i]:
            continue
        box = list(bboxes[i])
        changed = True
        while changed:
            changed = False
            for j in range(len(bboxes)):
                if used[j] or j == i:
                    continue
                b = bboxes[j]
                # Check if within 3px
                dy = max(0, max(box[0], b[0]) - min(box[2], b[2]))
                dx = max(0, max(box[1], b[1]) - min(box[3], b[3]))
                if max(dy, dx) <= 3:
                    used[j] = True
                    box[0] = min(box[0], b[0])
                    box[1] = min(box[1], b[1])
                    box[2] = max(box[2], b[2])
                    box[3] = max(box[3], b[3])
                    changed = True
        merged.append(tuple(box))

    # Sort top-to-bottom, left-to-right
    merged.sort(key=lambda b: (b[0] // 100, b[1]))

    print(f"After merging close parts: {len(merged)} icons")

    # Crop and save — NO pixel modification
    padding = 4
    for idx, (y1, x1, y2, x2) in enumerate(merged):
        cy1 = max(0, y1 - padding)
        cx1 = max(0, x1 - padding)
        cy2 = min(h - 1, y2 + padding)
        cx2 = min(w - 1, x2 + padding)

        iw = cx2 - cx1 + 1
        ih = cy2 - cy1 + 1

        crop = img.crop((cx1, cy1, cx2 + 1, cy2 + 1))
        fname = f"icon_{idx+1:02d}_{iw}x{ih}.png"
        crop.save(os.path.join(output_dir, fname), 'PNG')
        print(f"  {fname} @ ({cx1},{cy1})")

    print(f"\nDone! {len(merged)} icons → {output_dir}/")

if __name__ == '__main__':
    src = '/Users/biubiu/Downloads/Eccentric New Design/1000109573.png'
    out = '/Users/biubiu/Downloads/Eccentric New Design/extracted_icons'
    extract_icons(src, out)
