import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const tweetIds = [
  '2118686458605175248',
  '2118574639945273397',
  '2118630479968563654',
  '2118528224846037296',
  '2118480050194350344'
];

const mediaUrls = new Set();

for (const id of tweetIds) {
  try {
    const url = `https://x.com/HousebetsHubie/status/${id}`;
    const cmd = `curl.exe -s -L "${url}" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"`;
    const html = execSync(cmd, { maxBuffer: 15 * 1024 * 1024 }).toString();

    const matches = html.match(/https:\/\/pbs\.twimg\.com\/media\/[A-Za-z0-9_-]+/g) || [];
    for (const m of matches) {
      mediaUrls.add(m);
    }
  } catch (e) {
    console.error(e.message);
  }
}

console.log('Total unique media URLs found across tweets:', mediaUrls.size);
for (const m of mediaUrls) {
  console.log(m);
}

