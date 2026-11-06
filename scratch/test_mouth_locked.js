import http from 'http';
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const html = `
<!DOCTYPE html>
<html>
<body style="margin:0; background:#0b0e14; overflow:hidden;">
  <canvas id="c" width="1920" height="1080"></canvas>
  <script>
    const cvs = document.getElementById('c');
    const ctx = cvs.getContext('2d');

    const SIZES = {
      stand: [458, 562],
      crouch: [431, 502],
      jump: [530, 562],
      land: [450, 509],
      celebrate: [390, 580]
    };
    const ANCHORS = {
      stand: 0.3809,
      crouch: 0.4380,
      jump: 0.4631,
      land: 0.4241,
      celebrate: 0.5228
    };
    const MOUTH_OFFSETS = {
      stand:     [217, 193],
      crouch:    [288, 202],
      jump:      [313, 190],
      land:      [266, 193],
      celebrate: [222, 205]
    };
    const SMILE_WIDTHS = {
      stand:     54,
      crouch:    58,
      jump:      56,
      land:      54,
      celebrate: 52
    };

    const images = {};
    let loaded = 0;
    const poses = Object.keys(SIZES);

    poses.forEach(p => {
      const img = new Image();
      img.src = '/assets/hubie_road/hubie-' + p + '.webp';
      img.onload = () => {
        images[p] = img;
        loaded++;
        if (loaded === poses.length) renderTest();
      };
    });

    function renderTest() {
      const scale = 440 / 562;

      // Draw 3 test cases:
      // 1. Stand with subtle talking (mouthOpenness = 0.5)
      drawCharacter(ctx, 'stand', 400, 950, 1, 0.5);
      // 2. Stand with wide talking (mouthOpenness = 0.9)
      drawCharacter(ctx, 'stand', 960, 950, 1, 0.9);
      // 3. Jump with talking (mouthOpenness = 0.7)
      drawCharacter(ctx, 'jump', 1520, 850, 1, 0.7);
    }

    function drawCharacter(ctx, pose, x, y, dir, openness) {
      const scale = 440 / 562;
      const img = images[pose];
      const rawSize = SIZES[pose];
      const anchor = ANCHORS[pose];
      const mouthOffset = MOUTH_OFFSETS[pose];
      const smileW = SMILE_WIDTHS[pose];

      ctx.save();
      ctx.translate(x, y);
      if (dir === -1) ctx.scale(-1, 1);

      const drawW = rawSize[0] * scale;
      const drawH = rawSize[1] * scale;
      const drawX = -drawW * anchor;
      const drawY = -drawH;

      // Draw base character
      ctx.drawImage(img, drawX, drawY, drawW, drawH);

      // Mouth position rigidly locked to face
      const mouthX = drawX + mouthOffset[0] * scale;
      const mouthY = drawY + mouthOffset[1] * scale;

      // Draw mouth matching the exact width of his smile
      const mW = smileW * scale;
      const mH = (2 + openness * 12) * scale;

      ctx.save();
      ctx.translate(mouthX, mouthY);

      // Dark mouth cavity matching natural smile curvature
      ctx.beginPath();
      // Curved mouth contour
      ctx.ellipse(0, mH * 0.15, mW * 0.48, mH * 0.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#220b0d';
      ctx.fill();
      ctx.lineWidth = 2 * scale;
      ctx.strokeStyle = '#2d1214';
      ctx.stroke();

      // Upper white teeth row along smile line
      ctx.save();
      ctx.beginPath();
      ctx.rect(-mW * 0.42, -mH * 0.5, mW * 0.84, mH * 0.42);
      ctx.clip();
      ctx.beginPath();
      ctx.ellipse(0, -mH * 0.25, mW * 0.38, mH * 0.32, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#f8fafc';
      ctx.fill();
      ctx.restore();

      // Soft pink tongue responding to speech
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(0, mH * 0.15, mW * 0.44, mH * 0.45, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.beginPath();
      ctx.ellipse(0, mH * 0.28, mW * 0.32, mH * 0.35, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#ff4365';
      ctx.fill();
      ctx.restore();

      ctx.restore(); // end mouth

      ctx.restore(); // end character
    }
  </script>
</body>
</html>
`;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost:8993');
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

server.listen(8993, async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('http://localhost:8993/');
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'scratch/mouth_locked_test.png' });
  console.log('Saved scratch/mouth_locked_test.png');
  await browser.close();
  server.close();
});

