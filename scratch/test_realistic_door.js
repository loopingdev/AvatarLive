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

async function testRealisticDoor() {
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

  await new Promise(r => server.listen(3462, r));
  console.log('Test server running at http://localhost:3462');

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  await page.goto('http://localhost:3462');
  await page.waitForTimeout(1000);

  // Trigger costume routine
  console.log('Triggering realistic wardrobe routine...');
  await page.evaluate(() => {
    window.avatar.triggerCostumeChangeRoutine();
  });

  // 1. Capture approach & open door with vanity interior
  await page.waitForTimeout(1800);
  await page.screenshot({ path: 'scratch/door_open_approach.png' });
  console.log('Saved frame 1 (approach & open): scratch/door_open_approach.png');

  // 2. Capture Hubie stepping into the room (clipped inside door frame)
  await page.waitForTimeout(1400);
  await page.screenshot({ path: 'scratch/door_stepping_in.png' });
  console.log('Saved frame 2 (stepping inside): scratch/door_stepping_in.png');

  // 3. Capture door firmly closed with Hubie inside
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'scratch/door_closed_changing.png' });
  console.log('Saved frame 3 (closed changing): scratch/door_closed_changing.png');

  // 4. Capture door burst open and Hubie leaping out in fresh style
  await page.waitForTimeout(1600);
  await page.screenshot({ path: 'scratch/door_reveal_burst.png' });
  console.log('Saved frame 4 (reveal burst): scratch/door_reveal_burst.png');

  const finalCostume = await page.evaluate(() => window.avatar.currentCostume);
  console.log('Resulting costume:', finalCostume);

  await browser.close();
  server.close();
}

testRealisticDoor().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});

