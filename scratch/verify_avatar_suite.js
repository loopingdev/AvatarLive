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

async function runTest() {
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(process.cwd(), 'web', reqPath);

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404);
        res.end('Not Found: ' + reqPath);
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });
  });

  await new Promise(r => server.listen(3457, r));
  console.log('Test Server listening on http://localhost:3457');

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  const pageErrors = [];
  page.on('pageerror', err => pageErrors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') console.error('Browser error:', msg.text());
  });

  await page.goto('http://localhost:3457');
  await page.waitForTimeout(1500);

  // 1. Trigger Dressing Room Door Routine
  console.log('Triggering Dressing Room Door Routine...');
  await page.evaluate(() => {
    window.avatar.triggerCostumeChangeRoutine('astronaut');
  });

  // Capture door open & approach
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'scratch/door_open_approach.png' });
  console.log('Screenshot 1: Door open & approach saved.');

  // Capture changing inside wobbling wardrobe
  await page.waitForTimeout(1600);
  await page.screenshot({ path: 'scratch/door_changing_inside.png' });
  console.log('Screenshot 2: Changing inside wardrobe saved.');

  // Capture reveal burst in Astronaut costume
  await page.waitForTimeout(1600);
  await page.screenshot({ path: 'scratch/astronaut_reveal.png' });
  console.log('Screenshot 3: Astronaut reveal saved.');

  const finalCheck = await page.evaluate(() => {
    return {
      currentCostume: window.avatar.currentCostume,
      doorActive: window.avatar.dressingRoom.active,
      isChangingCostume: window.avatar.isChangingCostume,
      characterAlpha: window.avatar.characterAlpha
    };
  });

  console.log('Routine Result:', finalCheck);
  console.log('Page Errors:', pageErrors.length);

  await browser.close();
  server.close();
}

runTest();
