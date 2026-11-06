from PIL import Image
import numpy as np
from collections import deque
import os

def remove_bg_gradient(img_path, out_path, tolerance=38):
    img = Image.open(img_path).convert("RGBA")
    arr = np.array(img)
    h, w = arr.shape[:2]
    
    visited = np.zeros((h, w), dtype=bool)
    mask = np.zeros((h, w), dtype=bool)
    queue = deque()
    
    # Track border colors
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
        current_pixel = arr[cy, cx, :3].astype(float)
        mask[cy, cx] = True
        
        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx]:
                next_pixel = arr[ny, nx, :3].astype(float)
                # Local color difference between adjacent pixels in background is very small
                diff = np.linalg.norm(next_pixel - current_pixel)
                
                # Check if it hits the black/dark character outline or white sticker outline
                # In media_1, character has a dark outline / border
                # If next pixel is significantly different from current, it's an edge
                if diff <= tolerance:
                    visited[ny, nx] = True
                    queue.append((ny, nx))
                    
    arr[mask, 3] = 0
    out_img = Image.fromarray(arr)
    bbox = out_img.getbbox()
    if bbox:
        out_img = out_img.crop(bbox)
    out_img.save(out_path, "PNG")
    print(f"Processed {img_path} -> {out_path} ({out_img.size})")

if __name__ == "__main__":
    remove_bg_gradient("scratch/x_images/media_1.jpg", "scratch/test_boss_cutout.png", tolerance=18)
    remove_bg_gradient("scratch/x_images/media_2.jpg", "scratch/test_detective_cutout.png", tolerance=18)

