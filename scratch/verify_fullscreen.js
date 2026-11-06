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
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost:8995');
  let p = path.join(process.cwd(), 'web', url.pathname === '/' ? 'index.html' : url.pathname);
  if (url.pathname === '/overlay') p = path.join(process.cwd(), 'web', 'index.html');
  if (fs.existsSync(p) && fs.statSync(p).isFile()) {
    const ext = path.extname(p).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    fs.createReadStream(p).pipe(res);
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(8995, async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));

  await page.goto('http://localhost:8995/');
  await page.waitForTimeout(1200);

  // 1. Idle + Speaking Test
  await page.evaluate(() => {
    window.testAvatar = new HubieAvatar('avatar-canvas', 'speech-bubble');
    window.testAvatar.setSpeaking(true, "Yo chat! Welcome to the Housebets 24/7 stream! We're chasing the 1000x multiplier today!");
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'scratch/stream_fullscreen_speaking.png' });
  console.log('Saved scratch/stream_fullscreen_speaking.png');

  // 2. Mid-air Hopping Test (speaking while moving!)
  await page.evaluate(() => {
    window.testAvatar.moveTo(450);
  });
  await page.waitForTimeout(240); // Mid-leap flight!
  await page.screenshot({ path: 'scratch/stream_fullscreen_hop.png' });
  console.log('Saved scratch/stream_fullscreen_hop.png');

  // 3. Surfing Cruise Test
  await page.evaluate(() => {
    window.testAvatar.moveTo(1250); // Big jump triggers surfing mode
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'scratch/stream_fullscreen_surf.png' });
  console.log('Saved scratch/stream_fullscreen_surf.png');

  // 4. Celebration Win Test
  await page.evaluate(() => {
    window.testAvatar.reactToWin(12.5);
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'scratch/stream_fullscreen_win.png' });
  console.log('Saved scratch/stream_fullscreen_win.png');

  // 5. Loss Wipeout Test
  await page.evaluate(() => {
    window.testAvatar.reactToLoss();
  });
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'scratch/stream_fullscreen_loss.png' });
  console.log('Saved scratch/stream_fullscreen_loss.png');

  await browser.close();
  server.close();
  console.log('All full-screen visual tests complete!');
});

