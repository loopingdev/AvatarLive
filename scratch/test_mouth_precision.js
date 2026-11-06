import http from 'http';
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  const SIZES = {
    stand: [458, 562],
    crouch: [431, 502],
    jump: [530, 562]
  };
  const ANCHORS = {
    stand: 0.3809,
    crouch: 0.4380,
    jump: 0.4631
  };
  const MOUTH = {
    stand: [220, 193],
    crouch: [290, 202],
    jump: [313, 190]
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0; background:#0b0e14; overflow:hidden;">
      <canvas id="c" width="1920" height="1080"></canvas>
      <script>
        const cvs = document.getElementById('c');
        const ctx = cvs.getContext('2d');
        const baseHeight = 440;

        function loadImg(src) {
          return new Promise(r => {
            const img = new Image();
            img.src = src;
            img.onload = () => r(img);
          });
        }

        async function init() {
          const standImg = await loadImg('/assets/hubie_road/hubie-stand.webp');
          const jumpImg = await loadImg('/assets/hubie_road/hubie-jump.webp');
          const crouchImg = await loadImg('/assets/hubie_road/hubie-crouch.webp');

          // Draw stand at x=400, y=1000
          drawPose(ctx, 'stand', standImg, 400, 1000, 1, 0.7);
          // Draw jump at x=960, y=750
          drawPose(ctx, 'jump', jumpImg, 960, 750, 1, 0.9);
          // Draw crouch at x=1500, y=1000
          drawPose(ctx, 'crouch', crouchImg, 1500, 1000, -1, 0.5);
        }

        function drawPose(ctx, pose, img, x, y, dir, mouthOpenness) {
          ctx.save();
          ctx.translate(x, y);
          if (dir === -1) ctx.scale(-1, 1);

          const scale = baseHeight / 562;
          const rawSize = ${JSON.stringify(SIZES)}[pose];
          const anchor = ${JSON.stringify(ANCHORS)}[pose];
          const drawW = rawSize[0] * scale;
          const drawH = rawSize[1] * scale;
          const drawX = -drawW * anchor;
          const drawY = -drawH;

          ctx.drawImage(img, drawX, drawY, drawW, drawH);

          // Draw precision mouth
          const mouthOffset = ${JSON.stringify(MOUTH)}[pose];
          const mouthPxX = drawX + mouthOffset[0] * scale;
          const mouthPxY = drawY + mouthOffset[1] * scale;

          if (mouthOpenness > 0.05) {
            ctx.save();
            ctx.translate(mouthPxX, mouthPxY);
            
            const mouthW = 28 * scale;
            const mouthH = (4 + mouthOpenness * 14) * scale;

            // Mouth cavity
            ctx.beginPath();
            ctx.ellipse(0, 0, mouthW * 0.5, mouthH * 0.5, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#220b0d';
            ctx.fill();
            ctx.lineWidth = 2.5 * scale;
            ctx.strokeStyle = '#3d1619';
            ctx.stroke();

            // Upper teeth
            ctx.save();
            ctx.beginPath();
            ctx.rect(-mouthW * 0.4, -mouthH * 0.5, mouthW * 0.8, mouthH * 0.35);
            ctx.clip();
            ctx.beginPath();
            ctx.ellipse(0, -mouthH * 0.25, mouthW * 0.38, mouthH * 0.3, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#f8fafc';
            ctx.fill();
            ctx.restore();

            // Tongue
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(0, 0, mouthW * 0.48, mouthH * 0.48, 0, 0, Math.PI * 2);
            ctx.clip();
            ctx.beginPath();
            ctx.ellipse(0, mouthH * 0.28, mouthW * 0.32, mouthH * 0.3, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#ff4365';
            ctx.fill();
            ctx.restore();

            ctx.restore();
          }

          ctx.restore();
        }

        init();
      </script>
    </body>
    </html>
  `;

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost:8997');
    if (url.pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } else {
      const p = path.join(process.cwd(), 'web', url.pathname);
      if (fs.existsSync(p)) {
        res.writeHead(200, { 'Content-Type': 'image/webp' });
        fs.createReadStream(p).pipe(res);
      } else {
        res.writeHead(404);
        res.end();
      }
    }
  });

  server.listen(8997, async () => {
    await page.goto('http://localhost:8997/');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'scratch/mouth_precision_test.png' });
    console.log('Saved scratch/mouth_precision_test.png');
    await browser.close();
    server.close();
  });
})();
