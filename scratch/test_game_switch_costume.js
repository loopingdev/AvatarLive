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

async function testGameSwitch() {
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

  await new Promise(r => server.listen(3463, r));
  console.log('Test server running at http://localhost:3463');

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  await page.goto('http://localhost:3463');
  await page.waitForTimeout(1000);

  const initialCostume = await page.evaluate(() => window.avatar.currentCostume);
  console.log('Initial Costume:', initialCostume);

  // 1. Simulate Game Switch Event: Hilo -> Dragon Tower
  console.log('Simulating Housebets game switch: Hilo -> Dragon Tower...');
  await page.evaluate(() => {
    window.avatar.onGameChanged('Dragon Tower');
  });

  // Verify routine triggered immediately
  const isChanging = await page.evaluate(() => window.avatar.isChangingCostume);
  console.log('isChangingCostume on game switch:', isChanging);

  const speechText = await page.evaluate(() => {
    const bubble = document.getElementById('speech-bubble');
    return bubble ? bubble.textContent : '';
  });
  console.log('Speech Bubble text:', speechText);

  // Wait 4.5 seconds for wardrobe routine to change style
  await page.waitForTimeout(4500);

  const newCostume = await page.evaluate(() => window.avatar.currentCostume);
  console.log('Costume after Dragon Tower switch:', newCostume);

  // Wait for routine to finish
  await page.waitForTimeout(3000);

  // 2. Simulate next Game Switch: Dragon Tower -> Mines
  console.log('Simulating next Housebets game switch: Dragon Tower -> Mines...');
  await page.evaluate(() => {
    window.avatar.onGameChanged('Mines');
  });

  await page.waitForTimeout(4500);
  const nextCostume = await page.evaluate(() => window.avatar.currentCostume);
  console.log('Costume after Mines switch:', nextCostume);

  await page.screenshot({ path: 'scratch/game_switch_costume_verified.png' });
  console.log('Saved screenshot: scratch/game_switch_costume_verified.png');

  await browser.close();
  server.close();
}

testGameSwitch().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});

