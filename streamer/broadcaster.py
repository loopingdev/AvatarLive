import asyncio
import logging
import subprocess
import time
from pathlib import Path
from typing import Optional
import config

logger = logging.getLogger("HubieBroadcaster")

class Broadcaster:
    """
    Autonomous 24/7 RTMP Broadcaster to Kick / Twitch using FFmpeg.
    Recovers from network drops and keeps the stream persistently online.
    """
    def __init__(self, supervisor):
        self.supervisor = supervisor
        self.ffmpeg_path = config.FFMPEG_PATH
        self.platform = config.STREAM_PLATFORM
        self.stream_key = config.STREAM_KEY
        self.is_broadcasting = False
        self._process: Optional[subprocess.Popen] = None
        self._worker_task: Optional[asyncio.Task] = None
        self._running = False

    def get_rtmp_url(self) -> str:
        if self.platform == "twitch":
            base = config.TWITCH_RTMP_URL
        else:
            base = config.KICK_RTMP_URL
        if self.stream_key:
            return f"{base}/{self.stream_key}"
        return f"{base}/test_stream"

    def start(self):
        if not self._running:
            self._running = True
            self._worker_task = asyncio.create_task(self._broadcast_loop())
            logger.info("Broadcaster service initialized.")

    def stop(self):
        self._running = False
        if self._worker_task:
            self._worker_task.cancel()
        self._kill_process()

    def _kill_process(self):
        if self._process:
            try:
                self._process.terminate()
                self._process.wait(timeout=2)
            except Exception:
                try:
                    self._process.kill()
                except Exception:
                    pass
            self._process = None

    async def _broadcast_loop(self):
        # If RTMP broadcast is disabled, broadcaster remains in standby for local studio preview
        if not config.ENABLE_RTMP_BROADCAST:
            logger.info("RTMP Live Broadcast is set to Standby (Web Studio is live for OBS / local browser source).")
            while self._running:
                self.supervisor.heartbeat("broadcaster")
                await asyncio.sleep(5.0)
            return

        reconnect_attempts = 0
        while self._running:
            self.supervisor.heartbeat("broadcaster")
            try:
                target_url = self.get_rtmp_url()
                logger.info(f"Starting RTMP broadcast stream to {self.platform.upper()}...")

                # FFmpeg command creating a persistent 60fps stream with lavfi source (color/test generator + studio capture)
                # In production, this can also capture desktop screen or browser window via gdigrab
                cmd = [
                    self.ffmpeg_path,
                    "-re",
                    "-f", "lavfi",
                    "-i", f"color=c=0x0f111a:s={config.STREAM_WIDTH}x{config.STREAM_HEIGHT}:r={config.STREAM_FPS}",
                    "-f", "lavfi",
                    "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
                    "-c:v", "libx264",
                    "-preset", "veryfast",
                    "-b:v", config.VIDEO_BITRATE,
                    "-maxrate", config.VIDEO_BITRATE,
                    "-bufsize", "9000k",
                    "-pix_fmt", "yuv420p",
                    "-g", str(config.STREAM_FPS * 2),
                    "-c:a", "aac",
                    "-b:a", config.AUDIO_BITRATE,
                    "-ar", "44100",
                    "-f", "flv",
                    target_url
                ]

                self._process = subprocess.Popen(
                    cmd,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL
                )
                self.is_broadcasting = True
                reconnect_attempts = 0

                # Wait while process is running
                while self._process and self._process.poll() is None and self._running:
                    self.supervisor.heartbeat("broadcaster")
                    await asyncio.sleep(2.0)

                # Process exited unexpectedly
                code = self._process.returncode if self._process else -1
                logger.warning(f"FFmpeg broadcast process ended with code {code}. Auto-reconnecting...")
                self.supervisor.record_recovery("broadcaster", f"FFmpeg exited with code {code}")

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Broadcaster encountered exception: {e}")
                self.supervisor.record_recovery("broadcaster", str(e))

            reconnect_attempts += 1
            # Exponential backoff capped at 10 seconds to satisfy 24/7 uptime
            delay = min(10.0, 1.5 * reconnect_attempts)
            await asyncio.sleep(delay)

