import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.join(__dirname, '.env') });

function findFFmpegPath() {
  if (process.env.FFMPEG_BINARY && fs.existsSync(process.env.FFMPEG_BINARY)) {
    return process.env.FFMPEG_BINARY;
  }
  const knownWinPath = path.join(
    process.env.LOCALAPPDATA || 'C:\\Users\\Bangkit Jaya\\AppData\\Local',
    'Packages',
    'PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0',
    'LocalCache',
    'local-packages',
    'Python313',
    'site-packages',
    'imageio_ffmpeg',
    'binaries',
    'ffmpeg-win-x86_64-v7.1.exe'
  );
  if (fs.existsSync(knownWinPath)) {
    return knownWinPath;
  }
  return 'ffmpeg';
}

export const CONFIG = {
  BASE_DIR: __dirname,

  // Housebets Credentials
  HOUSEBETS_EMAIL: process.env.HOUSEBETS_EMAIL || '',
  HOUSEBETS_PASSWORD: process.env.HOUSEBETS_PASSWORD || '',
  HOUSEBETS_BASE_URL: 'https://www.housebets.com/house-games',
  HEADLESS_BROWSER: ['true', '1', 'yes'].includes((process.env.HEADLESS_BROWSER || 'false').toLowerCase()),

  // Real Stream Chat Channels (Kick or Twitch)
  KICK_CHANNEL: process.env.KICK_CHANNEL || '',
  TWITCH_CHANNEL: process.env.TWITCH_CHANNEL || '',

  // All 14 House Original Games on housebets.com
  HOUSE_GAMES: [
    { id: 'keno', name: 'Keno', slug: 'housegames-keno', url: 'https://www.housebets.com/games/housegames-keno' },
    { id: 'mines', name: 'Mines', slug: 'housegames-mines', url: 'https://www.housebets.com/games/housegames-mines' },
    { id: 'dragon_tower', name: 'Dragon Tower', slug: 'housegames-dragon-tower', url: 'https://www.housebets.com/games/housegames-dragon-tower' },
    { id: 'hubies_road', name: "Hubie's Road", slug: 'housegames-hubie-s-road', url: 'https://www.housebets.com/games/housegames-hubie-s-road' },
    { id: 'coinflip', name: 'Coinflip', slug: 'housegames-coin-flip', url: 'https://www.housebets.com/games/housegames-coin-flip' },
    { id: 'hilo', name: 'Hilo', slug: 'housegames-hilo', url: 'https://www.housebets.com/games/housegames-hilo' },
    { id: 'roulette', name: 'Roulette', slug: 'housegames-roulette', url: 'https://www.housebets.com/games/housegames-roulette' },
    { id: 'plinko', name: 'Plinko', slug: 'housegames-plinko', url: 'https://www.housebets.com/games/housegames-plinko' },
    { id: 'dice', name: 'Dice', slug: 'housegames-dice', url: 'https://www.housebets.com/games/housegames-dice' },
    { id: 'limbo', name: 'Limbo', slug: 'housegames-limbo', url: 'https://www.housebets.com/games/housegames-limbo' },
    { id: 'wheel', name: 'Wheel', slug: 'housegames-wheel', url: 'https://www.housebets.com/games/housegames-wheel' },
    { id: 'blackjack', name: 'Blackjack', slug: 'housegames-blackjack', url: 'https://www.housebets.com/games/housegames-blackjack' },
    { id: 'baccarat', name: 'Baccarat', slug: 'housegames-baccarat', url: 'https://www.housebets.com/games/housegames-baccarat' },
    { id: 'max_win', name: 'Max Win', slug: 'housegames-max-win', url: 'https://www.housebets.com/games/housegames-max-win' }
  ],
  ROUNDS_PER_GAME: parseInt(process.env.ROUNDS_PER_GAME || '12', 10),

  // OpenRouter Configuration
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001',
  OPENROUTER_BASE_URL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',

  // Streaming Configuration (Kick or Twitch)
  STREAM_PLATFORM: (process.env.STREAM_PLATFORM || 'kick').toLowerCase(),
  KICK_RTMP_URL: process.env.KICK_RTMP_URL || 'rtmp://fa7237973e61.global-contribute.live-video.net/app',
  TWITCH_RTMP_URL: 'rtmp://live.twitch.tv/app',
  STREAM_KEY: process.env.STREAM_KEY || '',
  ENABLE_RTMP_BROADCAST: ['true', '1', 'yes'].includes((process.env.ENABLE_RTMP_BROADCAST || 'false').toLowerCase()),

  STREAM_WIDTH: parseInt(process.env.STREAM_WIDTH || '1920', 10),
  STREAM_HEIGHT: parseInt(process.env.STREAM_HEIGHT || '1080', 10),
  STREAM_FPS: parseInt(process.env.STREAM_FPS || '60', 10),
  VIDEO_BITRATE: process.env.VIDEO_BITRATE || '4500k',
  AUDIO_BITRATE: process.env.AUDIO_BITRATE || '160k',

  // Voice (Edge-TTS) Configuration: EricNeural is the expressive animated mascot voice
  VOICE_NAME: process.env.VOICE_NAME || 'en-US-EricNeural',
  VOICE_RATE: process.env.VOICE_RATE || '+6%',
  VOICE_PITCH: process.env.VOICE_PITCH || '+3Hz',

  // Safety & Moderation
  SAFETY_DISCLAIMER: '18+ ONLY | Gamble Responsibly | Demo / Entertainment Mode | begambleaware.org',
  SAFETY_REMINDER_INTERVAL_SECONDS: parseInt(process.env.SAFETY_REMINDER_INTERVAL_SECONDS || '300', 10),

  // Studio Server
  PORT: parseInt(process.env.PORT || '8080', 10),
  HOST: process.env.HOST || '0.0.0.0',

  FFMPEG_PATH: findFFmpegPath()
};
