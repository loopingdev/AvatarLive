from PIL import Image
import numpy as np
from collections import deque
import sys

def remove_background(img_path, out_path, tolerance=24):
    img = Image.open(img_path).convert("RGBA")
    arr = np.array(img)
    h, w = arr.shape[:2]
    
    # Sample corner pixels to get background color
    corners = [
        arr[0, 0, :3], arr[0, w-1, :3],
        arr[h-1, 0, :3], arr[h-1, w-1, :3],
        arr[0, w//2, :3], arr[h-1, w//2, :3]
    ]
    bg_color = np.median(corners, axis=0)
    print(f"Detected background color: {bg_color}")
    
    # BFS flood fill from edges to only remove outer background (preserving any similar colors inside character)
    visited = np.zeros((h, w), dtype=bool)
    mask = np.zeros((h, w), dtype=bool) # True = background
    
    queue = deque()
    # Add borders
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
        
        # Check color distance to bg_color
        pixel = arr[cy, cx, :3].astype(float)
        diff = np.linalg.norm(pixel - bg_color)
        
        # If it's close to background color, mark as background and explore neighbors
        if diff <= tolerance:
            mask[cy, cx] = True
            for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                ny, nx = cy + dy, cx + dx
                if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx]:
                    visited[ny, nx] = True
                    queue.append((ny, nx))
                    
    # Set alpha to 0 for background
    arr[mask, 3] = 0
    
    out_img = Image.fromarray(arr)
    # Crop to non-transparent bounding box
    bbox = out_img.getbbox()
    if bbox:
        out_img = out_img.crop(bbox)
        
    out_img.save(out_path, "PNG")
    print(f"Saved cutout to {out_path} ({out_img.size})")

if __name__ == "__main__":
    remove_background(
        "scratch/hubie_x_gallery/hubie_2_HWcdz5QX0AA5Orn.jpg",
        "scratch/test_flex_cutout.png",
        tolerance=32
    )
