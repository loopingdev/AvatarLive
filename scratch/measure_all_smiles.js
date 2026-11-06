import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();
  
  const poses = ['stand', 'crouch', 'jump', 'land', 'celebrate', 'scared', 'fall'];
  
  for (const p of poses) {
    const f = 'hubie-' + p + '.webp';
    const filePath = 'file:///' + path.resolve('./web/assets/hubie_road/' + f).replace(/\\\\/g, '/');
    await page.goto(filePath);
    
    const info = await page.evaluate((poseName) => {
      const img = document.querySelector('img');
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      
      // Look in upper half for face
      let minX = 999, maxX = 0, minY = 999, maxY = 0;
      let count = 0;
      
      // Face search zone
      const yMin = Math.floor(canvas.height * 0.22);
      const yMax = Math.floor(canvas.height * 0.48);
      const xMin = Math.floor(canvas.width * 0.25);
      const xMax = Math.floor(canvas.width * 0.75);

      for (let y = yMin; y <= yMax; y++) {
        for (let x = xMin; x <= xMax; x++) {
          const i = (y * canvas.width + x) * 4;
          const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
          // Dark mouth/smile line
          if (a > 200 && r < 55 && g < 40 && b < 40) {
            count++;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      return {
        pose: poseName,
        minX, maxX, minY, maxY,
        width: maxX - minX,
        height: maxY - minY,
        centerX: Math.round((minX + maxX) / 2),
        centerY: Math.round((minY + maxY) / 2)
      };
    }, p);
    console.log(p, info);
  }
  await browser.close();
})();

