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
  const url = new URL(req.url, 'http://localhost:8998');
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

server.listen(8998, async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('http://localhost:8998/overlay');
  await page.waitForTimeout(1200);

  // Expose avatar
  const avatarStage = await page.locator('#avatar-stage');
  await avatarStage.screenshot({ path: 'scratch/avatar_idle.png' });
  console.log('Saved scratch/avatar_idle.png');

  // Trigger win celebration
  await page.evaluate(() => {
    // Find canvas and create a celebrate trigger
    const cvs = document.getElementById('avatar-canvas');
    // We can call avatar directly if we stored it or dispatch event
    window.testAvatar = new HubieAvatar('avatar-canvas', 'speech-bubble');
    window.testAvatar.reactToWin(5.0);
  });
  await page.waitForTimeout(600);
  await avatarStage.screenshot({ path: 'scratch/avatar_win.png' });
  console.log('Saved scratch/avatar_win.png');

  // Trigger jump/hop
  await page.evaluate(() => {
    window.testAvatar.moveTo(350);
  });
  await page.waitForTimeout(250); // Mid-hop flight!
  await avatarStage.screenshot({ path: 'scratch/avatar_hop.png' });
  console.log('Saved scratch/avatar_hop.png');

  // Trigger loss fall
  await page.evaluate(() => {
    window.testAvatar.reactToLoss();
  });
  await page.waitForTimeout(700); // Falling backwards with splash and flying hat!
  await avatarStage.screenshot({ path: 'scratch/avatar_loss.png' });
  console.log('Saved scratch/avatar_loss.png');

  await browser.close();
  server.close();
  console.log('All avatar visual tests complete!');
});

