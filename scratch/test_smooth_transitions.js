import http from 'http';
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

// Test smooth pose crossfade and mouth lerp logic
const html = `
<!DOCTYPE html>
<html>
<body style="margin:0; background:#0b0e14; overflow:hidden;">
  <canvas id="c" width="1920" height="1080"></canvas>
  <script>
    // Easing helper
    function easeInOutQuad(t) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    const cvs = document.getElementById('c');
    const ctx = cvs.getContext('2d');

    const SIZES = {
      stand: [458, 562],
      crouch: [431, 502],
      jump: [530, 562],
      land: [450, 509],
      celebrate: [390, 580],
      scared: [272, 462],
      fall: [505, 572]
    };

    const ANCHORS = {
      stand: 0.3809,
      crouch: 0.4380,
      jump: 0.4631,
      land: 0.4241,
      celebrate: 0.5228,
      scared: 0.4984,
      fall: 0.4719
    };

    const MOUTH_OFFSETS = {
      stand:     [220, 193],
      crouch:    [290, 202],
      jump:      [313, 190],
      land:      [266, 193],
      celebrate: [222, 205],
      scared:    [136, 115],
      fall:      [232, 196]
    };

    const images = {};
    const poses = Object.keys(SIZES);
    let loaded = 0;

    poses.forEach(p => {
      const img = new Image();
      img.src = '/assets/hubie_road/hubie-' + p + '.webp';
      img.onload = () => {
        images[p] = img;
        loaded++;
        if (loaded === poses.length) start();
      };
    });

    let currentPose = 'stand';
    let prevPose = 'stand';
    let poseBlend = 1.0;
    const blendDuration = 180; // ms

    let mouthCurX = 0;
    let mouthCurY = 0;
    let mouthOpenness = 0;
    let targetMouthOpenness = 0;
    let mouthAlpha = 0;

    let isSpeaking = true;
    let lastTime = performance.now();

    function setPose(newPose) {
      if (newPose === currentPose) return;
      prevPose = currentPose;
      currentPose = newPose;
      poseBlend = 0.0;
    }

    function start() {
      // Initialize mouth at stand
      const s = 440 / 562;
      const initialAnchor = ANCHORS.stand;
      const drawX = -(SIZES.stand[0] * s) * initialAnchor;
      const drawY = -(SIZES.stand[1] * s);
      mouthCurX = drawX + MOUTH_OFFSETS.stand[0] * s;
      mouthCurY = drawY + MOUTH_OFFSETS.stand[1] * s;

      requestAnimationFrame(loop);
    }

    // Cycle through poses every 600ms to test smoothness
    let cycleTimer = 0;
    const testCycle = ['stand', 'crouch', 'jump', 'land', 'stand', 'celebrate', 'stand'];
    let cycleIdx = 0;

    function loop(time) {
      const dt = Math.min(50, time - lastTime);
      lastTime = time;

      // Pose blending progress
      if (poseBlend < 1.0) {
        poseBlend = Math.min(1.0, poseBlend + dt / blendDuration);
      }

      // Automatic test pose switcher
      cycleTimer += dt;
      if (cycleTimer > 500) {
        cycleTimer = 0;
        cycleIdx = (cycleIdx + 1) % testCycle.length;
        setPose(testCycle[cycleIdx]);
      }

      // Speech audio envelope simulation
      if (isSpeaking) {
        const t = time * 0.001;
        const wave = (Math.sin(t * 14) + Math.sin(t * 23) * 0.5 + 1.2) * 0.4;
        targetMouthOpenness = Math.max(0.1, Math.min(0.9, wave));
        targetMouthAlpha = 1.0;
      } else {
        targetMouthOpenness = 0;
        targetMouthAlpha = 0;
      }

      // Smooth mouth lerp
      mouthOpenness += (targetMouthOpenness - mouthOpenness) * Math.min(1, dt * 0.015);
      mouthAlpha += (targetMouthAlpha - mouthAlpha) * Math.min(1, dt * 0.012);

      // Target mouth location based on blended pose
      const s = 440 / 562;
      const getPoseMouth = (p) => {
        const dX = -(SIZES[p][0] * s) * ANCHORS[p];
        const dY = -(SIZES[p][1] * s);
        return { x: dX + MOUTH_OFFSETS[p][0] * s, y: dY + MOUTH_OFFSETS[p][1] * s };
      };

      const curM = getPoseMouth(currentPose);
      const prevM = getPoseMouth(prevPose);
      const blendFactor = easeInOutQuad(poseBlend);

      const targetX = prevM.x + (curM.x - prevM.x) * blendFactor;
      const targetY = prevM.y + (curM.y - prevM.y) * blendFactor;

      mouthCurX += (targetX - mouthCurX) * Math.min(1, dt * 0.02);
      mouthCurY += (targetY - mouthCurY) * Math.min(1, dt * 0.02);

      // Render
      ctx.clearRect(0, 0, cvs.width, cvs.height);

      ctx.save();
      ctx.translate(960, 950);

      // Draw blended pose
      if (poseBlend < 1.0 && images[prevPose]) {
        // Draw previous pose fading out
        ctx.save();
        ctx.globalAlpha = 1.0 - blendFactor;
        drawPose(ctx, prevPose, images[prevPose], s);
        ctx.restore();
      }

      // Draw current pose fading in
      if (images[currentPose]) {
        ctx.save();
        ctx.globalAlpha = poseBlend < 1.0 ? blendFactor : 1.0;
        drawPose(ctx, currentPose, images[currentPose], s);
        ctx.restore();
      }

      // Draw smooth mouth
      if (mouthAlpha > 0.02 && mouthOpenness > 0.03) {
        ctx.save();
        ctx.globalAlpha = mouthAlpha;
        ctx.translate(mouthCurX, mouthCurY);

        const mouthW = 28 * s;
        const mouthH = (3 + mouthOpenness * 14) * s;

        // Dark cavity
        ctx.beginPath();
        ctx.ellipse(0, 0, mouthW * 0.5, mouthH * 0.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#220b0d';
        ctx.fill();
        ctx.lineWidth = 2 * s;
        ctx.strokeStyle = '#2d1214';
        ctx.stroke();

        // Upper teeth
        ctx.save();
        ctx.beginPath();
        ctx.rect(-mouthW * 0.45, -mouthH * 0.5, mouthW * 0.9, mouthH * 0.42);
        ctx.clip();
        ctx.beginPath();
        ctx.ellipse(0, -mouthH * 0.28, mouthW * 0.4, mouthH * 0.32, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#f8fafc';
        ctx.fill();
        ctx.restore();

        // Tongue
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(0, 0, mouthW * 0.48, mouthH * 0.48, 0, 0, Math.PI * 2);
        ctx.clip();
        ctx.beginPath();
        ctx.ellipse(0, mouthH * 0.24, mouthW * 0.32, mouthH * 0.32, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#ff4365';
        ctx.fill();
        ctx.restore();

        ctx.restore();
      }

      ctx.restore();

      requestAnimationFrame(loop);
    }

    function drawPose(ctx, p, img, s) {
      const w = SIZES[p][0] * s;
      const h = SIZES[p][1] * s;
      const x = -w * ANCHORS[p];
      const y = -h;
      ctx.drawImage(img, x, y, w, h);
    }
  </script>
</body>
</html>
`;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost:8994');
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

server.listen(8994, async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('http://localhost:8994/');
  await page.waitForTimeout(600);

  // Capture 4 sequential frames during pose transition to verify smoothness
  for (let i = 0; i < 4; i++) {
    await page.waitForTimeout(60);
    await page.screenshot({ path: `scratch/transition_frame_${i}.png` });
  }
  console.log('Saved 4 sequential transition frames.');

  await browser.close();
  server.close();
});

