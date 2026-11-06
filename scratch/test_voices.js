import fs from 'fs';
import path from 'path';
import { EdgeTTS } from 'node-edge-tts';

const candidates = [
  { voice: 'en-US-EricNeural', rate: '+5%', pitch: '+3Hz', desc: 'Expressive & animated character' },
  { voice: 'en-US-ChristopherNeural', rate: '+4%', pitch: '+0Hz', desc: 'Chill, cool streamer sloth' },
  { voice: 'en-US-BrianNeural', rate: '+6%', pitch: '+2Hz', desc: 'Upbeat energetic gaming streamer' },
  { voice: 'en-US-RogerNeural', rate: '+2%', pitch: '+2Hz', desc: 'Friendly, laid-back conversational sloth' },
  { voice: 'en-US-AndrewNeural', rate: '+4%', pitch: '+1Hz', desc: 'Warm, charismatic & youthful' }
];

const testLine = "Yo squad! Hubie is in the building, catching the clean multipliers on Housebets!";

async function testVoices() {
  const outDir = path.join(process.cwd(), 'scratch', 'voice_samples');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const c of candidates) {
    const filename = `${c.voice}.mp3`;
    const outPath = path.join(outDir, filename);
    console.log(`Testing ${c.voice}...`);
    try {
      const tts = new EdgeTTS({ voice: c.voice, rate: c.rate, pitch: c.pitch });
      await tts.ttsPromise(testLine, outPath);
      const size = fs.statSync(outPath).size;
      console.log(`✓ ${c.voice}: generated (${size} bytes) - ${c.desc}`);
    } catch (e) {
      console.log(`✗ ${c.voice} failed:`, e.message);
    }
  }
}

testVoices().catch(console.error);

