import { spawn } from 'child_process';
import { CONFIG } from '../config.js';

export class Broadcaster {
  constructor(supervisor) {
    this.supervisor = supervisor;
    this.ffmpegPath = CONFIG.FFMPEG_PATH;
    this.platform = CONFIG.STREAM_PLATFORM;
    this.streamKey = CONFIG.STREAM_KEY;
    this.isBroadcasting = false;
    this.process = null;
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

  async broadcastLoop() {
    if (!CONFIG.ENABLE_RTMP_BROADCAST) {
      console.log('[HubieBroadcaster] RTMP Live Broadcast is in Standby mode (Studio preview available at http://localhost:8080).');
      while (this.running) {
        this.supervisor.heartbeat('broadcaster');
        await new Promise(r => setTimeout(r, 5000));
      }
      return;
    }

    let reconnectAttempts = 0;
    while (this.running) {
      this.supervisor.heartbeat('broadcaster');
      try {
        const targetUrl = this.getRTMPUrl();
        console.log(`[HubieBroadcaster] Starting live RTMP stream to ${this.platform.toUpperCase()}...`);

        const args = [
          '-re',
          '-f', 'lavfi',
          '-i', `color=c=0x0b0e14:s=${CONFIG.STREAM_WIDTH}x${CONFIG.STREAM_HEIGHT}:r=${CONFIG.STREAM_FPS}`,
          '-f', 'lavfi',
          '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
          '-c:v', 'libx264',
          '-preset', 'veryfast',
          '-b:v', CONFIG.VIDEO_BITRATE,
          '-maxrate', CONFIG.VIDEO_BITRATE,
          '-bufsize', '9000k',
          '-pix_fmt', 'yuv420p',
          '-g', String(CONFIG.STREAM_FPS * 2),
          '-c:a', 'aac',
          '-b:a', CONFIG.AUDIO_BITRATE,
          '-ar', '44100',
          '-f', 'flv',
          targetUrl
        ];

        this.process = spawn(this.ffmpegPath, args, { stdio: 'ignore' });
        this.isBroadcasting = true;
        reconnectAttempts = 0;

        await new Promise((resolve) => {
          this.process.on('close', (code) => {
            console.warn(`[HubieBroadcaster] FFmpeg closed with code ${code}. Auto-reconnecting...`);
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
      const delay = Math.min(10000, 1500 * reconnectAttempts);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

