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

async function test15SecondCycle() {
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

  await new Promise(r => server.listen(3461, r));
  console.log('Server running at http://localhost:3461');

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  await page.goto('http://localhost:3461');
  console.log('Page loaded. Initial costume:', await page.evaluate(() => window.avatar.currentCostume));

  // Verify that the autonomous 15s timer changes costume
  console.log('Waiting 16.5 seconds for first autonomous costume switch...');
  await page.waitForTimeout(16500);

  const costume1 = await page.evaluate(() => window.avatar.currentCostume);
  const isChanging1 = await page.evaluate(() => window.avatar.isChangingCostume);
  console.log(`At 16.5s -> costume: ${costume1}, isChanging: ${isChanging1}`);

  // Wait for routine to finish and next 15s to trigger
  console.log('Waiting another 16 seconds for second autonomous costume switch...');
  await page.waitForTimeout(16000);

  const costume2 = await page.evaluate(() => window.avatar.currentCostume);
  console.log(`At 32.5s -> costume: ${costume2}`);

  await page.screenshot({ path: 'scratch/costume_15s_verified.png' });
  console.log('Saved screenshot: scratch/costume_15s_verified.png');

  await browser.close();
  server.close();
}

test15SecondCycle().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
