import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function processAstronautImage() {
  const jpgPath = 'C:\\Users\\Bangkit Jaya\\.gemini\\antigravity\\brain\\7ac1cb26-db0f-4ce2-bdd6-10af6b36e23c\\hubie_astronaut_stand_1793957990075.jpg';
  const outDir = path.resolve('web/assets/hubie_astronaut');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();

  const b64 = fs.readFileSync(jpgPath).toString('base64');
  const dataUrl = 'data:image/jpeg;base64,' + b64;

  const resultPngB64 = await page.evaluate(async (url) => {
    const img = new Image();
    img.src = url;
    await new Promise(r => img.onload = r);

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const imgData = ctx.getImageData(0, 0, img.width, img.height);
    const data = imgData.data;

    // Flood fill or corner color distance check for white background removal
    // Corner background is near white: r > 240, g > 240, b > 240
    // Let's do a flood-fill from all 4 borders to remove background while preserving whites inside the astronaut suit!
    const w = img.width;
    const h = img.height;
    const visited = new Uint8Array(w * h);
    const queue = [];

    // Push border pixels that are near white
    for (let x = 0; x < w; x++) {
      queue.push([x, 0]);
      queue.push([x, h - 1]);
    }
    for (let y = 0; y < h; y++) {
      queue.push([0, y]);
      queue.push([w - 1, y]);
    }

    function isWhite(x, y) {
      const idx = (y * w + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      return (r > 235 && g > 235 && b > 235);
    }

    let head = 0;
    while (head < queue.length) {
      const [cx, cy] = queue[head++];
      const pIdx = cy * w + cx;
      if (visited[pIdx]) continue;
      visited[pIdx] = 1;

      if (isWhite(cx, cy)) {
        // Clear pixel to transparent
        const idx = pIdx * 4;
        data[idx + 3] = 0;

        // Spread to 4 neighbors
        if (cx > 0 && !visited[pIdx - 1]) queue.push([cx - 1, cy]);
        if (cx < w - 1 && !visited[pIdx + 1]) queue.push([cx + 1, cy]);
        if (cy > 0 && !visited[pIdx - w]) queue.push([cx, cy - 1]);
        if (cy < h - 1 && !visited[pIdx + w]) queue.push([cx, cy + 1]);
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL('image/png').split(',')[1];
  }, dataUrl);

  const pngBuf = Buffer.from(resultPngB64, 'base64');
  const targetPath = path.join(outDir, 'hubie-stand.png');
  fs.writeFileSync(targetPath, pngBuf);
  console.log('Saved transparent astronaut stand sprite to:', targetPath, 'Size:', pngBuf.length);

  await browser.close();
}

processAstronautImage();

