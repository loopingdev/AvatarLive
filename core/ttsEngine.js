import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { spawn } from 'child_process';
import { EdgeTTS } from 'node-edge-tts';
import { CONFIG } from '../config.js';

const AUDIO_DIR = path.join(CONFIG.BASE_DIR, 'web', 'assets', 'audio');
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

export class TTSEngine {
  constructor({ onSpeechStart = null, onSpeechEnd = null } = {}) {
    this.voice = CONFIG.VOICE_NAME;
    this.rate = CONFIG.VOICE_RATE;
    this.pitch = CONFIG.VOICE_PITCH;
    this.queue = [];
    this.isSpeaking = false;
    this.lastChatSpeechTime = 0;
    this.onSpeechStart = onSpeechStart;
    this.onSpeechEnd = onSpeechEnd;
    this.running = false;
    this.cleanupInterval = null;

    this.tts = new EdgeTTS({
      voice: this.voice,
      rate: this.rate,
      pitch: this.pitch
    });
  }

  start() {
    if (!this.running) {
      this.running = true;
      this.cleanOldAudioFiles(30);
      this.cleanupInterval = setInterval(() => this.cleanOldAudioFiles(30), 5 * 60 * 1000);
      this.processQueue();
      console.log(`[HubieTTS] Live TTS Engine started with voice: ${this.voice}`);
    }
  }

  stop() {
    this.running = false;
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clearQueue();
  }

  cleanOldAudioFiles(minAgeMs = 60000, keepMinCount = 5) {
    try {
      if (!fs.existsSync(AUDIO_DIR)) return;
      const now = Date.now();
      const files = fs.readdirSync(AUDIO_DIR)
        .filter(f => f.startsWith('speech_') && f.endsWith('.mp3'))
        .map(f => {
          const fp = path.join(AUDIO_DIR, f);
          try {
            return { name: f, path: fp, time: fs.statSync(fp).mtimeMs };
          } catch {
            return null;
          }
        })
        .filter(Boolean)
        .sort((a, b) => b.time - a.time); // Newest first

      files.forEach((file, index) => {
        const ageMs = now - file.time;
        // Never delete files younger than minAgeMs (1 minute) or top recent files
        if (ageMs >= minAgeMs && index >= keepMinCount) {
          try {
            fs.unlinkSync(file.path);
          } catch {}
        }
      });
    } catch {}
  }

  clearQueue() {
    this.queue = [];
  }

  get isBusy() {
    return this.isSpeaking || this.queue.length > 0;
  }

  speak(text, priorityOrOpts = false) {
    const clean = (text || '').trim();
    if (!clean) return;

    const opts = typeof priorityOrOpts === 'boolean'
      ? { priority: priorityOrOpts, isChat: false }
      : (priorityOrOpts || {});

    const isChat = Boolean(opts.isChat);
    const priority = Boolean(opts.priority || isChat);

    if (isChat) {
      this.lastChatSpeechTime = Date.now();
      // Immediately clear out backlog so chat response takes top priority
      this.queue = [clean];
      return;
    }

    // Routine background commentary check:
    // If chat spoke recently (< 8s) or TTS is currently busy, drop routine commentary
    if (!priority) {
      const chatRecentlySpoke = (Date.now() - this.lastChatSpeechTime) < 8000;
      if (chatRecentlySpoke || this.isBusy) {
        return;
      }
    }

    if (priority) {
      this.queue = [clean];
    } else {
      if (this.queue.length > 0) {
        this.queue = [clean];
      } else {
        this.queue.push(clean);
      }
    }
  }

  async waitForSpeech(maxMs = 5000) {
    const start = Date.now();
    while (this.isBusy && (Date.now() - start < maxMs)) {
      await new Promise(r => setTimeout(r, 150));
    }
  }

  async synthesizeWithOpenRouter(text, filePath) {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: CONFIG.OPENROUTER_TTS_MODEL || 'openai/gpt-audio-mini',
        modalities: ['text', 'audio'],
        audio: { voice: CONFIG.OPENROUTER_VOICE || 'onyx', format: 'pcm16' },
        stream: true,
        messages: [
          {
            role: 'system',
            content: 'You are Hubie, a crazy hype 24/7 live casino slot streamer. Always refer to yourself as Hubie (never "the sloth"). Perform the spoken text with intense, natural live streamer vocal emotion: shout with crazy hype on big wins or all-caps, scream in funny disbelief on losses, and sound 100% human, lively, and energetic.'
          },
          { role: 'user', content: text }
        ]
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenRouter TTS status ${res.status}: ${errText.slice(0, 150)}`);
    }

    const reader = res.body.getReader();
    const chunks = [];
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += new TextDecoder().decode(value);
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (line.startsWith('data: ') && line.trim() !== 'data: [DONE]') {
          try {
            const json = JSON.parse(line.slice(6));
            const audioData = json.choices?.[0]?.delta?.audio?.data;
            if (audioData) {
              chunks.push(Buffer.from(audioData, 'base64'));
            }
          } catch {}
        }
      }
    }

    const rawPcm = Buffer.concat(chunks);
    if (rawPcm.length === 0) {
      throw new Error('No audio PCM received from OpenRouter');
    }

    // Convert 24kHz 1ch 16-bit PCM to MP3 via ffmpeg pipe
    await new Promise((resolve, reject) => {
      const ffmpeg = spawn(CONFIG.FFMPEG_PATH, [
        '-y',
        '-f', 's16le',
        '-ar', '24000',
        '-ac', '1',
        '-i', 'pipe:0',
        '-b:a', '128k',
        filePath
      ]);

      ffmpeg.stdin.on('error', () => {});
      ffmpeg.stdin.write(rawPcm);
      ffmpeg.stdin.end();

      ffmpeg.on('close', (code) => {
        if (code === 0 && fs.existsSync(filePath)) {
          resolve();
        } else {
          reject(new Error(`FFmpeg exited with code ${code}`));
        }
      });
      ffmpeg.on('error', reject);
    });
  }

  async synthesizeToFile(text) {
    const provider = CONFIG.TTS_PROVIDER || 'openrouter';
    const voiceKey = provider === 'openrouter' ? `${provider}_${CONFIG.OPENROUTER_VOICE}` : `${provider}_${this.voice}`;
    const hash = crypto.createHash('md5').update(`${text}_${voiceKey}`).digest('hex').slice(0, 12);
    const filename = `speech_${hash}.mp3`;
    const filePath = path.join(AUDIO_DIR, filename);

    if (fs.existsSync(filePath) && fs.statSync(filePath).size > 400) {
      return filename;
    }

    // 1. Try OpenRouter Voice Model if configured
    if (provider === 'openrouter' && CONFIG.OPENROUTER_API_KEY) {
      try {
        await this.synthesizeWithOpenRouter(text, filePath);
        return filename;
      } catch (err) {
        console.warn(`[HubieTTS] OpenRouter voice synthesis failed (${err.message}). Falling back to Edge-TTS...`);
      }
    }

    // 2. Edge-TTS (Fallback or Offline)
    try {
      await this.tts.ttsPromise(text, filePath);
      return filename;
    } catch (err) {
      if (err.message?.includes('429')) {
        this.tts = new EdgeTTS({ voice: this.voice, rate: this.rate, pitch: this.pitch });
        await new Promise(r => setTimeout(r, 1000));
      }
      return null;
    }
  }

  estimateDuration(text) {
    const words = text.split(/\s+/).length;
    return Math.max(1.8, words * 0.36);
  }

  async processQueue() {
    while (this.running) {
      if (this.queue.length > 0) {
        const text = this.queue.shift();
        this.isSpeaking = true;

        const filename = await this.synthesizeToFile(text);
        const duration = this.estimateDuration(text);
        const audioUrl = filename ? `/assets/audio/${filename}` : null;

        if (this.onSpeechStart) {
          await this.onSpeechStart(text, duration, audioUrl);
        }

        // Wait for speech duration plus brief pacing buffer
        await new Promise(r => setTimeout(r, (duration + 0.2) * 1000));

        this.isSpeaking = false;
        if (this.onSpeechEnd) {
          await this.onSpeechEnd();
        }

        await new Promise(r => setTimeout(r, 200));
      } else {
        await new Promise(r => setTimeout(r, 150));
      }
    }
  }
}
