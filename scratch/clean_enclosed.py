from PIL import Image
import numpy as np

def clean_enclosed_beige(img_path):
    img = Image.open(img_path).convert("RGBA")
    arr = np.array(img)
    
    # Beige halo definition
    r, g, b, a = arr[:,:,0], arr[:,:,1], arr[:,:,2], arr[:,:,3]
    beige_mask = (a > 0) & (r > 165) & (g > 145) & (b > 130) & (abs(r.astype(int) - g.astype(int)) < 40) & (abs(g.astype(int) - b.astype(int)) < 40) & ~((r > 240) & (g > 240) & (b > 240))
    
    # Only touch pixels in lower half / between legs
    h = arr.shape[0]
    beige_mask[:int(h * 0.4), :] = False # Preserve upper body
    
    arr[beige_mask, 3] = 0
    Image.fromarray(arr).save(img_path)
    print(f"Cleaned enclosed beige in {img_path}")

clean_enclosed_beige("web/assets/hubie_poses/hubie_flag.png")
clean_enclosed_beige("web/assets/hubie_poses/hubie_whistle.png")

