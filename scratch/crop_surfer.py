from PIL import Image

img = Image.open("scratch/x_images/banner.jpg")
w, h = img.size
# Crop Hubie on surfboard from banner
# Looking at banner.jpg: Hubie is roughly from x=840 to 1400, y=50 to 480
crop_box = (820, 40, 1420, 490)
hubie_surf = img.crop(crop_box)
hubie_surf.save("web/assets/hubie_poses/hubie_surfer.png", "PNG")
print(f"Saved surfer crop: {hubie_surf.size}")

