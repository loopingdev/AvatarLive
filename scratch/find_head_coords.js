import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function findHeadCoordinates() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();

  const poses = ['stand', 'crouch', 'jump', 'land', 'celebrate', 'scared', 'fall'];
  const results = {};

  for (const pose of poses) {
    const p = path.resolve(`web/assets/hubie_road/hubie-${pose}.webp`);
    const b64 = fs.readFileSync(p).toString('base64');
    const dataUrl = 'data:image/webp;base64,' + b64;

    const coords = await page.evaluate(async (url) => {
      const img = new Image();
      img.src = url;
      await new Promise(r => img.onload = r);

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const data = ctx.getImageData(0, 0, img.width, img.height).data;
      const w = img.width;
      const h = img.height;

      // Find top of head (first non-transparent pixels near the center X)
      let headTopY = h;
      let headTopX = w / 2;
      for (let y = 0; y < h * 0.6; y++) {
        for (let x = 0; x < w; x++) {
          if (data[(y * w + x) * 4 + 3] > 100) {
            if (y < headTopY) {
              headTopY = y;
              headTopX = x;
            }
          }
        }
      }

      return { w, h, headTopX, headTopY };
    }, dataUrl);

    results[pose] = coords;
  }

  console.log('Detected Head Bounds:', results);
  await browser.close();
}

findHeadCoordinates();

