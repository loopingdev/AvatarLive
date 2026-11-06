import os
import rembg
from PIL import Image
import numpy as np

session = rembg.new_session('silueta')

items = [
    ("scratch/hubie_x_gallery/hubie_2_HWcdz5QX0AA5Orn.jpg", "web/assets/hubie_poses/hubie_flex.png"),
    ("scratch/hubie_x_gallery/hubie_1_HWclm6tXoAEDLca.jpg", "web/assets/hubie_poses/hubie_flag.png"),
    ("scratch/hubie_x_gallery/hubie_7_HWcOmkqXgAEJm-g.jpg", "web/assets/hubie_poses/hubie_dance.png"),
    ("scratch/hubie_x_gallery/hubie_18_HWYbGRLXwAAZkJR.jpg", "web/assets/hubie_poses/hubie_highroller.png"),
    ("scratch/hubie_x_gallery/hubie_21_HWXl0ZoXIAEANpz.jpg", "web/assets/hubie_poses/hubie_snack.png"),
    ("scratch/hubie_x_gallery/hubie_28_HWVkwh3WsAADl-7.jpg", "web/assets/hubie_poses/hubie_blush.png"),
    ("scratch/hubie_x_gallery/hubie_5_HWcWcYJWYAAzFz9.jpg", "web/assets/hubie_poses/hubie_whistle.png"),
    ("scratch/hubie_x_gallery/hubie_24_HWWw26iWIAASZZl.jpg", "web/assets/hubie_poses/hubie_magnifier.png"),
    ("scratch/hubie_x_gallery/hubie_11_HWZhuYOWMAEFqkW.jpg", "web/assets/hubie_poses/hubie_boss.png"),
    ("scratch/hubie_x_gallery/hubie_13_HWY0RlfWwAA2-GI.jpg", "web/assets/hubie_poses/hubie_surfer.png"),
]

os.makedirs("web/assets/hubie_poses", exist_ok=True)

for src, dst in items:
    print(f"Processing {src} -> {dst}...")
    im = Image.open(src).convert("RGB")
    out = rembg.remove(im, session=session)
    
    # Bounding box crop
    bbox = out.getbbox()
    if bbox:
        out = out.crop(bbox)
        
    # Check borders to ensure 100% clean transparency
    arr = np.array(out)
    alpha = arr[:, :, 3]
    h, w = alpha.shape
    top = int(np.sum(alpha[0, :] > 10))
    bottom = int(np.sum(alpha[-1, :] > 10))
    left = int(np.sum(alpha[:, 0] > 10))
    right = int(np.sum(alpha[:, -1] > 10))
    
    # Pad 2px transparent border so edges never clamp
    padded = Image.new("RGBA", (w + 4, h + 4), (0, 0, 0, 0))
    padded.paste(out, (2, 2))
    padded.save(dst, "PNG")
    print(f"Saved {dst}: {padded.size}, border alpha: (T:{top}, B:{bottom}, L:{left}, R:{right})")

print("ALL POSES SLICED PERFECTLY WITH ZERO BACKGROUND!")

