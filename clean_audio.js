import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUDIO_DIR = path.join(__dirname, 'web', 'assets', 'audio');
// Safety rules:
const MIN_AGE_MS = 60 * 1000; // 1 minute (files created within the last 60s are NEVER touched)
const KEEP_MIN_COUNT = 5;      // Extra safeguard: always preserve at least the 5 newest files

console.log(`[CleanAudio] Scanning ${AUDIO_DIR}...`);

if (!fs.existsSync(AUDIO_DIR)) {
  console.log('[CleanAudio] Audio directory does not exist.');
  process.exit(0);
}

const now = Date.now();
const files = fs.readdirSync(AUDIO_DIR)
  .filter(f => f.startsWith('speech_') && f.endsWith('.mp3'))
  .map(f => {
    const fullPath = path.join(AUDIO_DIR, f);
    try {
      return { name: f, path: fullPath, time: fs.statSync(fullPath).mtimeMs };
    } catch {
      return null;
    }
  })
  .filter(Boolean)
  .sort((a, b) => b.time - a.time); // Newest first

console.log(`[CleanAudio] Total speech MP3 files found: ${files.length}`);

let deletedCount = 0;
let preservedCount = 0;

files.forEach((file, index) => {
  const ageMs = now - file.time;
  // Protect files younger than 1 minute OR within the top recent files
  if (ageMs < MIN_AGE_MS || index < KEEP_MIN_COUNT) {
    preservedCount++;
  } else {
    try {
      fs.unlinkSync(file.path);
      deletedCount++;
    } catch (err) {
      console.warn(`[CleanAudio] Could not delete ${file.name}:`, err.message);
    }
  }
});

console.log(`[CleanAudio] ✅ Deleted ${deletedCount} files older than 1 minute.`);
console.log(`[CleanAudio] 🛡️ Preserved ${preservedCount} files (recently generated / active in stream).`);
