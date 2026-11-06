from PIL import Image
import numpy as np
from collections import deque
import os

def remove_sticker_bg(img_path, out_path, tolerance=28):
    img = Image.open(img_path).convert("RGBA")
    arr = np.array(img)
    h, w = arr.shape[:2]
    
    corners = [
        arr[0, 0, :3], arr[0, w-1, :3],
        arr[h-1, 0, :3], arr[h-1, w-1, :3],
        arr[0, w//2, :3], arr[h-1, w//2, :3],
        arr[w//2, 0, :3], arr[w//2, w-1, :3]
    ]
    bg_color = np.median(corners, axis=0)
    
    visited = np.zeros((h, w), dtype=bool)
    mask = np.zeros((h, w), dtype=bool)
    queue = deque()
    
    for x in range(w):
        queue.append((0, x))
        queue.append((h - 1, x))
        visited[0, x] = True
        visited[h - 1, x] = True
    for y in range(h):
        queue.append((y, 0))
        queue.append((y, w - 1))
        visited[y, 0] = True
        visited[y, w - 1] = True
        
    while queue:
        cy, cx = queue.popleft()
        pixel = arr[cy, cx, :3].astype(float)
        diff = np.linalg.norm(pixel - bg_color)
        
        if diff <= tolerance:
            mask[cy, cx] = True
            for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                ny, nx = cy + dy, cx + dx
                if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx]:
                    visited[ny, nx] = True
                    queue.append((ny, nx))
                    
    arr[mask, 3] = 0
    out_img = Image.fromarray(arr)
    bbox = out_img.getbbox()
    if bbox:
        out_img = out_img.crop(bbox)
        
    out_img.save(out_path, "PNG")
    print(f"Saved {out_path} ({out_img.size})")

items = [
    ("scratch/hubie_x_gallery/hubie_2_HWcdz5QX0AA5Orn.jpg", "web/assets/hubie_poses/hubie_flex.png", 32),
    ("scratch/hubie_x_gallery/hubie_1_HWclm6tXoAEDLca.jpg", "web/assets/hubie_poses/hubie_flag.png", 32),
    ("scratch/hubie_x_gallery/hubie_7_HWcOmkqXgAEJm-g.jpg", "web/assets/hubie_poses/hubie_dance.png", 36),
    ("scratch/hubie_x_gallery/hubie_18_HWYbGRLXwAAZkJR.jpg", "web/assets/hubie_poses/hubie_highroller.png", 32),
    ("scratch/hubie_x_gallery/hubie_21_HWXl0ZoXIAEANpz.jpg", "web/assets/hubie_poses/hubie_snack.png", 32),
    ("scratch/hubie_x_gallery/hubie_28_HWVkwh3WsAADl-7.jpg", "web/assets/hubie_poses/hubie_blush.png", 32),
    ("scratch/hubie_x_gallery/hubie_5_HWcWcYJWYAAzFz9.jpg", "web/assets/hubie_poses/hubie_whistle.png", 32),
    ("scratch/hubie_x_gallery/hubie_24_HWWw26iWIAASZZl.jpg", "web/assets/hubie_poses/hubie_magnifier.png", 32),
    ("scratch/test_boss_cutout.png", "web/assets/hubie_poses/hubie_boss.png", 0) # Already clean cutout
]

os.makedirs("web/assets/hubie_poses", exist_ok=True)

for src, dst, tol in items:
    if tol == 0:
        Image.open(src).save(dst)
        print(f"Copied {src} -> {dst}")
    else:
        remove_sticker_bg(src, dst, tolerance=tol)

