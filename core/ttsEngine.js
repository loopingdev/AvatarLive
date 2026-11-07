import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
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

    this.tts = new EdgeTTS({
      voice: this.voice,
      rate: this.rate,
      pitch: this.pitch
    });
  }

  start() {
    if (!this.running) {
      this.running = true;
      this.processQueue();
      console.log(`[HubieTTS] Live TTS Engine started with voice: ${this.voice}`);
    }
  }

  stop() {
    this.running = false;
    this.clearQueue();
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

  async synthesizeToFile(text) {
    const hash = crypto.createHash('md5').update(`${text}_${this.voice}`).digest('hex').slice(0, 12);
    const filename = `speech_${hash}.mp3`;
    const filePath = path.join(AUDIO_DIR, filename);

    if (fs.existsSync(filePath) && fs.statSync(filePath).size > 400) {
      return filename;
    }

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
