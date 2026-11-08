import os from 'os';
import path from 'path';
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
    this.overlayProcess = null;
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
    if (this.overlayProcess) {
      try {
        this.overlayProcess.kill('SIGKILL');
      } catch {}
      this.overlayProcess = null;
    }
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
    if (this.overlayProcess || this.overlayBrowser) return;
    try {
      console.log(`[HubieBroadcaster] Opening 1080p Pure Kiosk Overlay (Zero URL Bar / Zero Tabs) at http://localhost:${CONFIG.PORT}/overlay...`);

      const chromeBin = chromium.executablePath();
      const profileDir = process.platform === 'win32'
        ? path.join(CONFIG.BASE_DIR, 'scratch', 'overlay_profile')
        : '/tmp/hubie_overlay_kiosk';

      const overlayArgs = [
        `--app=http://localhost:${CONFIG.PORT}/overlay`,
        '--kiosk',
        '--start-fullscreen',
        '--hide-scrollbars',
        '--disable-notifications',
        '--disable-infobars',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-session-crashed-bubble',
        '--autoplay-policy=no-user-gesture-required',
        `--window-size=${CONFIG.STREAM_WIDTH},${CONFIG.STREAM_HEIGHT}`,
        '--window-position=0,0',
        `--user-data-dir=${profileDir}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu-vsync',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding'
      ];

      this.overlayProcess = spawn(chromeBin, overlayArgs, {
        env: { ...process.env, DISPLAY: process.env.DISPLAY || ':99' },
        stdio: 'ignore'
      });

      this.overlayProcess.on('error', (err) => {
        console.warn('[HubieBroadcaster] Direct kiosk spawn notice:', err.message);
      });

      console.log('[HubieBroadcaster] ✅ Pure 1080p Borderless Kiosk Overlay active on virtual screen.');
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
      return ['-thread_queue_size', '4096', '-f', 'pulse', '-i', 'default'];
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
      '-thread_queue_size', '4096',
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

    // Configurable delay before broadcasting to Twitch/Kick (allows game & avatar to fully load first)
    const delaySec = CONFIG.STREAM_START_DELAY_SECONDS || 0;
    if (delaySec > 0) {
      console.log(`[HubieBroadcaster] ⏳ Jeda ${delaySec} detik sebelum stream ke ${this.platform.toUpperCase()} dimulai (memberi waktu game & avatar siap 100%)...`);
      let remaining = delaySec;
      while (remaining > 0 && this.running) {
        this.supervisor.heartbeat('broadcaster');
        const step = Math.min(10, remaining);
        await new Promise(r => setTimeout(r, step * 1000));
        remaining -= step;
        if (remaining > 0 && remaining % 20 === 0) {
          console.log(`[HubieBroadcaster] ⏳ Mulai stream ke Twitch dalam ${remaining} detik...`);
        }
      }
      console.log(`[HubieBroadcaster] ✅ Waktu jeda selesai. Memulai live broadcast sekarang!`);
    }

    let reconnectAttempts = 0;
    const cpuCount = os.cpus()?.length || 2;
    // Cap FFmpeg threads so it doesn't starve the audio system and Chromium
    const ffmpegThreads = String(Math.max(1, Math.min(4, cpuCount > 2 ? cpuCount - 1 : 2)));

    while (this.running) {
      this.supervisor.heartbeat('broadcaster');
      try {
        const targetUrl = this.getRTMPUrl();
        console.log(`[HubieBroadcaster] 🚀 Starting live RTMP stream to ${this.platform.toUpperCase()} (${ffmpegThreads} encoding threads)...`);

        const videoInput = this.getVideoInputArgs();
        const audioInput = this.getAudioInputArgs();

        const videoFilter = [];
        if (CONFIG.OUTPUT_WIDTH && CONFIG.OUTPUT_HEIGHT &&
            (CONFIG.OUTPUT_WIDTH !== CONFIG.STREAM_WIDTH || CONFIG.OUTPUT_HEIGHT !== CONFIG.STREAM_HEIGHT)) {
          videoFilter.push('-vf', `scale=${CONFIG.OUTPUT_WIDTH}:${CONFIG.OUTPUT_HEIGHT}`);
        }

        const args = [
          ...videoInput,
          ...audioInput,
          ...videoFilter,
          '-c:v', 'libx264',
          '-preset', 'ultrafast',
          '-tune', 'zerolatency',
          '-b:v', CONFIG.VIDEO_BITRATE,
          '-maxrate', CONFIG.VIDEO_BITRATE,
          '-bufsize', '4000k',
          '-pix_fmt', 'yuv420p',
          '-g', String((CONFIG.STREAM_FPS || 30) * 2),
          '-threads', ffmpegThreads,
          '-c:a', 'aac',
          '-b:a', CONFIG.AUDIO_BITRATE,
          '-ar', '44100',
          '-af', 'aresample=async=1:first_pts=0',
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
