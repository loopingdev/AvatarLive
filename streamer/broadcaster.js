import { spawn, execSync } from 'child_process';
import { chromium } from 'playwright';
import { CONFIG } from '../config.js';

export class Broadcaster {
  constructor(supervisor) {
    this.supervisor = supervisor;
    this.ffmpegPath = CONFIG.FFMPEG_PATH;
    this.platform = CONFIG.STREAM_PLATFORM;
    this.streamKey = CONFIG.STREAM_KEY;
    this.isBroadcasting = false;
    this.process = null;
    this.overlayBrowser = null;
    this.running = false;
  }

  getRTMPUrl() {
    const base = this.platform === 'twitch' ? CONFIG.TWITCH_RTMP_URL : CONFIG.KICK_RTMP_URL;
    if (this.streamKey) {
      return `${base}/${this.streamKey}`;
    }
    return `${base}/test_stream`;
  }

  start() {
    if (!this.running) {
      this.running = true;
      this.broadcastLoop();
      console.log('[HubieBroadcaster] Broadcaster service initialized.');
    }
  }

  stop() {
    this.running = false;
    this.killProcess();
    if (this.overlayBrowser) {
      this.overlayBrowser.close().catch(() => {});
      this.overlayBrowser = null;
    }
  }

  killProcess() {
    if (this.process) {
      try {
        this.process.kill('SIGTERM');
      } catch {
        // ignore
      }
      this.process = null;
    }
  }

  async launchOverlayBrowser() {
    if (this.overlayBrowser) return;
    try {
      console.log(`[HubieBroadcaster] Opening 1080p Kiosk Overlay Browser at http://localhost:${CONFIG.PORT}/overlay...`);
      this.overlayBrowser = await chromium.launch({
        headless: false,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--autoplay-policy=no-user-gesture-required',
          '--kiosk',
          '--start-fullscreen',
          '--hide-scrollbars',
          '--disable-notifications',
          `--window-size=${CONFIG.STREAM_WIDTH},${CONFIG.STREAM_HEIGHT}`,
          '--window-position=0,0',
          '--disable-infobars',
          '--no-first-run',
          '--check-for-update-interval=31536000',
          `--app=http://localhost:${CONFIG.PORT}/overlay`
        ]
      });

      const pages = this.overlayBrowser.contexts()[0]?.pages() || [];
      const page = pages.length > 0 ? pages[0] : await this.overlayBrowser.newPage();
      if (!pages.length) {
        await page.goto(`http://localhost:${CONFIG.PORT}/overlay`, { timeout: 30000 });
      }
      console.log('[HubieBroadcaster] ✅ Live Kiosk Overlay active on virtual screen.');
    } catch (err) {
      console.warn('[HubieBroadcaster] Overlay browser notice:', err.message);
    }
  }

  getAudioInputArgs() {
    if (process.platform === 'win32') {
      return ['-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100'];
    }
    try {
      execSync('pactl info', { stdio: 'ignore' });
      console.log('[HubieBroadcaster] 🎙️ PulseAudio sound server active. Capturing audio for stream.');
      return ['-f', 'pulse', '-i', 'default'];
    } catch {
      console.warn('[HubieBroadcaster] PulseAudio not running. Using silent audio fallback (run pulseaudio for live voice).');
      return ['-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100'];
    }
  }

  getVideoInputArgs() {
    if (process.platform === 'win32') {
      return [
        '-re',
        '-f', 'lavfi',
        '-i', `color=c=0x0b0e14:s=${CONFIG.STREAM_WIDTH}x${CONFIG.STREAM_HEIGHT}:r=${CONFIG.STREAM_FPS}`
      ];
    }
    const display = process.env.DISPLAY || ':99';
    const x11Display = display.includes('.') ? display : `${display}.0`;
    console.log(`[HubieBroadcaster] 🎥 Capturing virtual screen from X11 (${x11Display}) at ${CONFIG.STREAM_WIDTH}x${CONFIG.STREAM_HEIGHT}@${CONFIG.STREAM_FPS}fps...`);
    return [
      '-f', 'x11grab',
      '-draw_mouse', '0',
      '-video_size', `${CONFIG.STREAM_WIDTH}x${CONFIG.STREAM_HEIGHT}`,
      '-framerate', String(CONFIG.STREAM_FPS || 30),
      '-i', x11Display
    ];
  }

  async broadcastLoop() {
    if (!CONFIG.ENABLE_RTMP_BROADCAST) {
      console.log('[HubieBroadcaster] RTMP Live Broadcast is in Standby mode (Studio preview available at http://localhost:8080).');
      while (this.running) {
        this.supervisor.heartbeat('broadcaster');
        await new Promise(r => setTimeout(r, 5000));
      }
      return;
    }

    // Wait a brief moment for HTTP server & WebSocket to be fully ready
    await new Promise(r => setTimeout(r, 4000));

    // Open fullscreen live kiosk overlay on X11 display
    if (process.platform !== 'win32') {
      await this.launchOverlayBrowser();
      // Brief pause to allow overlay DOM and WebSocket to connect
      await new Promise(r => setTimeout(r, 2500));
    }

    let reconnectAttempts = 0;
    while (this.running) {
      this.supervisor.heartbeat('broadcaster');
      try {
        const targetUrl = this.getRTMPUrl();
        console.log(`[HubieBroadcaster] 🚀 Starting live RTMP stream to ${this.platform.toUpperCase()}...`);

        const videoInput = this.getVideoInputArgs();
        const audioInput = this.getAudioInputArgs();

        const args = [
          ...videoInput,
          ...audioInput,
          '-c:v', 'libx264',
          '-preset', 'veryfast',
          '-b:v', CONFIG.VIDEO_BITRATE,
          '-maxrate', CONFIG.VIDEO_BITRATE,
          '-bufsize', '9000k',
          '-pix_fmt', 'yuv420p',
          '-g', String((CONFIG.STREAM_FPS || 30) * 2),
          '-c:a', 'aac',
          '-b:a', CONFIG.AUDIO_BITRATE,
          '-ar', '44100',
          '-f', 'flv',
          targetUrl
        ];

        this.process = spawn(this.ffmpegPath, args);
        this.isBroadcasting = true;
        reconnectAttempts = 0;

        if (this.process.stderr) {
          this.process.stderr.on('data', (d) => {
            const text = d.toString();
            if (text.includes('Error') || text.includes('failed') || text.includes('Connection refused') || text.includes('Cannot open')) {
              console.error(`[HubieBroadcaster FFmpeg] ${text.trim()}`);
            }
          });
        }

        await new Promise((resolve) => {
          this.process.on('close', (code) => {
            console.warn(`[HubieBroadcaster] FFmpeg exited (code ${code}). Auto-reconnecting in few seconds...`);
            this.supervisor.recordRecovery('broadcaster', `FFmpeg closed with code ${code}`);
            resolve();
          });
          this.process.on('error', (err) => {
            console.error('[HubieBroadcaster] FFmpeg spawn error:', err.message);
            this.supervisor.recordRecovery('broadcaster', err.message);
            resolve();
          });
        });

      } catch (err) {
        console.error('[HubieBroadcaster] Exception:', err.message);
        this.supervisor.recordRecovery('broadcaster', err.message);
      }

      reconnectAttempts++;
      const delay = Math.min(10000, 2000 * reconnectAttempts);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}
