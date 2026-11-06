import http from 'http';
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg'
};

async function testDoor3D() {
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/' || reqPath === '/overlay') reqPath = '/index.html';
    const filePath = path.join(process.cwd(), 'web', reqPath);

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });
  });

  await new Promise(r => server.listen(3464, r));
  console.log('Server running at http://localhost:3464');

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  await page.goto('http://localhost:3464');
  await page.waitForTimeout(1000);

  // Trigger costume routine on game switch
  await page.evaluate(() => {
    window.avatar.onGameChanged("Hubie's Road");
  });

  // Capture door mid-swing (around 30-40 degrees open)
  await page.waitForTimeout(1400);
  await page.screenshot({ path: 'scratch/door_3d_mid_swing.png' });
  console.log('Saved frame: scratch/door_3d_mid_swing.png');

  // Capture door fully wide open (around 78 degrees open with thick edge face and floor shadow)
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'scratch/door_3d_wide_open.png' });
  console.log('Saved frame: scratch/door_3d_wide_open.png');

  // Capture door closing transition
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'scratch/door_3d_closing.png' });
  console.log('Saved frame: scratch/door_3d_closing.png');

  await browser.close();
  server.close();
}

testDoor3D().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});

