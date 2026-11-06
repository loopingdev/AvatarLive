import asyncio
import hashlib
import logging
import os
from pathlib import Path
from typing import Optional, Callable
import edge_tts
import config

logger = logging.getLogger("HubieTTS")

AUDIO_CACHE_DIR = config.BASE_DIR / "web" / "assets" / "audio"
AUDIO_CACHE_DIR.mkdir(parents=True, exist_ok=True)

class TTSEngine:
    def __init__(self, on_speech_start: Optional[Callable] = None, on_speech_end: Optional[Callable] = None):
        self.voice = config.VOICE_NAME
        self.rate = config.VOICE_RATE
        self.pitch = config.VOICE_PITCH
        self.queue: asyncio.Queue = asyncio.Queue()
        self.is_speaking = False
        self.on_speech_start = on_speech_start
        self.on_speech_end = on_speech_end
        self._worker_task: Optional[asyncio.Task] = None
        self._running = False

    def start(self):
        if not self._running:
            self._running = True
            self._worker_task = asyncio.create_task(self._process_queue())
            logger.info(f"Hubie TTS Engine started with voice: {self.voice}")

    def stop(self):
        self._running = False
        if self._worker_task:
            self._worker_task.cancel()

    async def speak(self, text: str, priority: int = 1):
        """Enqueue text to be spoken by Hubie."""
        clean_text = text.strip()
        if not clean_text:
            return
        await self.queue.put((priority, clean_text))

    async def _synthesize_to_file(self, text: str) -> Optional[Path]:
        """Synthesize speech using edge-tts and save to mp3."""
        # Use hash of text for caching repeated phrases
        text_hash = hashlib.md5(f"{text}_{self.voice}_{self.rate}_{self.pitch}".encode("utf-8")).hexdigest()[:12]
        output_file = AUDIO_CACHE_DIR / f"speech_{text_hash}.mp3"

        if output_file.exists() and output_file.stat().st_size > 500:
            return output_file

        try:
            communicate = edge_tts.Communicate(
                text,
                self.voice,
                rate=self.rate,
                pitch=self.pitch
            )
            await communicate.save(str(output_file))
            return output_file
        except Exception as e:
            logger.error(f"TTS synthesis failed for '{text}': {e}")
            return None

    def _estimate_duration(self, text: str) -> float:
        """Estimate speech duration in seconds (~130-150 words per minute)."""
        words = len(text.split())
        return max(1.8, words * 0.38)

    async def _process_queue(self):
        while self._running:
            try:
                priority, text = await self.queue.get()
                self.is_speaking = True

                audio_file = await self._synthesize_to_file(text)
                duration = self._estimate_duration(text)

                audio_url = f"/assets/audio/{audio_file.name}" if audio_file else None

                # Trigger speech start callback for UI animations and audio playback
                if self.on_speech_start:
                    await self.on_speech_start(text, duration, audio_url)

                # Wait for speech duration plus small buffer
                await asyncio.sleep(duration + 0.3)

                self.is_speaking = False
                if self.on_speech_end:
                    await self.on_speech_end()

                self.queue.task_done()
                # Brief pause between thoughts
                await asyncio.sleep(0.5)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in TTS queue processing: {e}")
                self.is_speaking = False
                await asyncio.sleep(1.0)

