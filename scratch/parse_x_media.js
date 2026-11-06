import { execSync } from 'child_process';
import fs from 'fs';

try {
  const cmd = `curl.exe -s -L "https://x.com/HousebetsHubie/media" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"`;
  const html = execSync(cmd, { maxBuffer: 25 * 1024 * 1024 }).toString();

  const regex = /https:\/\/pbs\.twimg\.com\/media\/[A-Za-z0-9_-]+(?:\.[a-z]+|\?format=[a-z]+&amp;name=[a-z0-9_]+)?/g;
  const matches = [...new Set(html.match(regex) || [])];
  console.log(`Found ${matches.length} media photos from /media:`);
  matches.forEach(m => console.log(m));
} catch (e) {
  console.error(e.message);
}
