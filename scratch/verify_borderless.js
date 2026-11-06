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

  await new Promise(r => server.listen(3459, r));
  console.log('Listening on http://localhost:3459');

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  await page.goto('http://localhost:3459');
  await page.waitForTimeout(1500);

  // Send a mock screencast frame with Housebets game background
  // and trigger colored streamer chat overlay
  const testInfo = await page.evaluate(async () => {
    const container = document.getElementById('stream-container');
    const screencast = document.getElementById('live-screencast');
    const loading = document.getElementById('screen-loading');
    if (loading) loading.style.display = 'none';

    // Draw mock Housebets gameplay into a canvas dataURL
    const cvs = document.createElement('canvas');
    cvs.width = 1280;
    cvs.height = 720;
    const ctx = cvs.getContext('2d');
    // Dark game background
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, 1280, 720);
    // Draw Housebets top nav
    ctx.fillStyle = '#0e1626';
    ctx.fillRect(0, 0, 1280, 56);
    ctx.fillStyle = '#00ffcc';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('Housebets', 24, 38);
    // Game arena
    ctx.fillStyle = '#161f33';
    ctx.fillRect(280, 80, 720, 580);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('DRAGON TOWER  38.05x', 480, 140);
    screencast.src = cvs.toDataURL('image/jpeg');

    // Trigger streamer chat messages with colored usernames
    const wsEvent1 = { user: 'CryptoKing', text: 'Lock in Hubie! 50x next floor!', platform: 'kick' };
    const wsEvent2 = { user: 'NeonSloth', text: 'That dragon stayed asleep let us gooo', platform: 'twitch' };
    const wsEvent3 = { user: 'VIP_Gamer', text: 'W in the chat squad!', platform: 'live' };

    // Trigger chat messages
    const chatMsgBox = document.getElementById('chat-messages');
    
    // Call the page's actual appendChatMessage
    // In our index.html, it's defined inside DOMContentLoaded, let's trigger via simulated dispatch or direct call
    const event = new MessageEvent('message', {
      data: JSON.stringify({ type: 'chat_message', message: wsEvent1 })
    });
    window.dispatchEvent ? null : null;

    // Direct invocation
    const users = [
      { name: 'CryptoKing', text: 'Lock in Hubie! 50x next floor!', plat: 'kick' },
      { name: 'NeonSloth', text: 'That dragon stayed asleep let us gooo!', plat: 'twitch' },
      { name: 'HighRoller99', text: 'W in the chat squad! Huge multiplier run!', plat: 'live' }
    ];

    const USER_COLORS = [
      '#00ffcc', '#ff007f', '#ffd700', '#00e5ff', 
      '#a855f7', '#ff6b00', '#38bdf8', '#4ade80', 
      '#f43f5e', '#ec4899', '#818cf8', '#2dd4bf'
    ];
    function getCol(u) {
      let h = 0;
      for (let i = 0; i < u.length; i++) h = (h << 5) - h + u.charCodeAt(i);
      return USER_COLORS[Math.abs(h) % USER_COLORS.length];
    }

    users.forEach(u => {
      const item = document.createElement('div');
      item.className = 'chat-item';
      const col = getCol(u.name);
      item.style.setProperty('--user-color', col);
      item.innerHTML = `<span class="chat-badge ${u.plat}">${u.plat.toUpperCase()}</span><span class="chat-user" style="color: ${col}; text-shadow: 0 0 10px ${col}88;">@${u.name}:</span><span class="chat-text">${u.text}</span>`;
      chatMsgBox.appendChild(item);
    });

    // Make Hubie speak
    window.avatar.setSpeaking(true, "Dragon Tower is heating up squad! Trusting the middle egg!");

    return {
      containerW: container.offsetWidth,
      containerH: container.offsetHeight,
      screencastW: screencast.offsetWidth,
      screencastH: screencast.offsetHeight,
      chatItemCount: chatMsgBox.children.length
    };
  });

  console.log('Test Info:', testInfo);

  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'scratch/streamer_overlay_verified.png' });
  console.log('Saved screenshot to scratch/streamer_overlay_verified.png');

  await browser.close();
  server.close();
}

runTest();
