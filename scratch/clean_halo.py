from PIL import Image
import numpy as np
from collections import deque

def remove_halo(img_path, out_path, bg_threshold=160):
    img = Image.open(img_path).convert("RGBA")
    arr = np.array(img)
    h, w = arr.shape[:2]
    
    # Check pixels that are part of the beige circle halo:
    # Character has dark blues (#1e2538), rich browns (#4a2a1a), bright orange (#f97316), and white outline (#ffffff).
    # The halo is a flat beige/tan circle: R in [190..235], G in [170..220], B in [155..205], where R > G > B.
    # We can BFS flood-fill from transparent borders (alpha == 0) and expand into any beige halo pixels!
    
    visited = np.zeros((h, w), dtype=bool)
    mask = (arr[:, :, 3] == 0) # Already transparent
    visited[mask] = True
    
    queue = deque()
    # Add all edge transparent pixels to queue
    for y, x in zip(*np.where(mask)):
        queue.append((y, x))
        
    while queue:
        cy, cx = queue.popleft()
        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx]:
                r, g, b = arr[ny, nx, :3].astype(int)
                
                # Halo condition: it's beige/tan (r,g,b close to each other, light, not pure white character border)
                is_halo = (r > 165 and g > 145 and b > 130 and abs(r - g) < 45 and abs(g - b) < 45)
                # Pure white character outline is r > 245, g > 245, b > 245. Do NOT eat the white outline!
                is_white_border = (r > 245 and g > 245 and b > 245)
                
                if is_halo and not is_white_border:
                    visited[ny, nx] = True
                    mask[ny, nx] = True
                    queue.append((ny, nx))
                else:
                    visited[ny, nx] = True
                    
    arr[mask, 3] = 0
    out_img = Image.fromarray(arr)
    bbox = out_img.getbbox()
    if bbox:
        out_img = out_img.crop(bbox)
    out_img.save(out_path, "PNG")
    print(f"Cleaned halo from {img_path} -> {out_path} ({out_img.size})")

remove_halo("web/assets/hubie_poses/hubie_flag.png", "web/assets/hubie_poses/hubie_flag.png")
remove_halo("web/assets/hubie_poses/hubie_snack.png", "web/assets/hubie_poses/hubie_snack.png")

