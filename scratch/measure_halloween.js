import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function measure() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();
  await page.goto('about:blank');

  const files = ['hubie-stand.webp', 'hubie-crouch.webp', 'hubie-jump.webp', 'hubie-land.webp', 'hubie-celebrate.webp', 'hubie-scared.webp', 'hubie-fall.webp'];
  
  for (const f of files) {
    const p = path.resolve('web/assets/hubie_halloween', f);
    const b64 = fs.readFileSync(p).toString('base64');
    const dataUrl = 'data:image/webp;base64,' + b64;
    const res = await page.evaluate(async (url) => {
      const img = new Image();
      img.src = url;
      await new Promise(r => img.onload = r);

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, img.width, img.height).data;

      let minX = img.width, maxX = 0, minY = img.height, maxY = 0;
      for (let y = 0; y < img.height; y++) {
        for (let x = 0; x < img.width; x++) {
          const a = imgData[(y * img.width + x) * 4 + 3];
          if (a > 30) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      // Foot center is around the bottom 15%
      let footSumX = 0, footCount = 0;
      for (let y = Math.floor(maxY - (maxY - minY) * 0.15); y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const a = imgData[(y * img.width + x) * 4 + 3];
          if (a > 50) {
            footSumX += x;
            footCount++;
          }
        }
      }
      const footAnchorX = footCount > 0 ? (footSumX / footCount) / img.width : 0.5;

      return {
        w: img.width,
        h: img.height,
        minX, maxX, minY, maxY,
        footAnchorX
      };
    }, dataUrl);

    console.log(f, res);
  }

  await browser.close();
}

measure();
