import fs from 'fs';
import { execSync } from 'child_process';

try {
  const cmd = `curl.exe -s -L "https://x.com/Housebetsio" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"`;
  const html = execSync(cmd, { maxBuffer: 25 * 1024 * 1024 }).toString();

  const mediaRegex = /https:\/\/pbs\.twimg\.com\/media\/[A-Za-z0-9_-]+/g;
  const matches = [...new Set(html.match(mediaRegex) || [])];
  console.log(`Found ${matches.length} media photos on @Housebetsio:`);
  matches.forEach(m => console.log(m));
} catch (e) {
  console.error(e.message);
}

