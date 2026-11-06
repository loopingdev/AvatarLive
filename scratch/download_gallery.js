import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = 'scratch/hubie_x_gallery';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const mediaIds = [
  'HWclm6tXoAEDLca',
  'HWcdz5QX0AA5Orn',
  'HWcY09lXQAAkj5S',
  'HWcYxiEXYAAYoB_',
  'HWcWcYJWYAAzFz9',
  'HWcTvh3XUAARZNb',
  'HWcOmkqXgAEJm-g',
  'HWbk99pWoAEtj0Z',
  'HWac5_cXUAA0W7V',
  'HWZ-HfUXwAA7tTk',
  'HWZhuYOWMAEFqkW',
  'HWY2uC1WMAAXWMI',
  'HWY0RlfWwAA2-GI',
  'HWYxmfIWEAA_2TR',
  'HWYqPQBXkAAmIft',
  'HWYnrdHXoAATmpe',
  'HWYk-sYWIAEbvDg',
  'HWYbGRLXwAAZkJR',
  'HWX5zPnXAAA8-bD',
  'HWX3azrXgAA5_Qv',
  'HWXl0ZoXIAEANpz',
  'HWW9nm1WIAA0dQO',
  'HWW4kkFXQAAisIk',
  'HWWw26iWIAASZZl',
  'HWWSWdJWcAApB0p',
  'HWWH9iMXIAA_txb',
  'HWVnIHzXEAEvQWj',
  'HWVkwh3WsAADl-7',
  'HWVdMHoWQAAjI2G',
  'HWVYJ0kXMAAUSjK',
  'HWT_6fKW8AAXJOX',
  'HWTHxc-WgAEKE2V',
  'HWTEV6ZWEAAH0oG',
  'HWTBezsWAAAqX6T',
  'HWSeR_YWsAAUI5_'
];

console.log(`Downloading ${mediaIds.length} images...`);

for (let i = 0; i < mediaIds.length; i++) {
  const id = mediaIds[i];
  const filePath = path.join(outDir, `hubie_${i + 1}_${id}.jpg`);
  if (!fs.existsSync(filePath)) {
    const url = `https://pbs.twimg.com/media/${id}?format=jpg&name=large`;
    try {
      execSync(`curl.exe -s -L "${url}" -o "${filePath}"`);
      const sz = fs.statSync(filePath).size;
      if (sz < 5000) {
        fs.unlinkSync(filePath);
        console.log(`Skipped ${id} (too small: ${sz} bytes)`);
      } else {
        console.log(`[${i + 1}/${mediaIds.length}] Saved ${id} (${(sz / 1024).toFixed(1)} KB)`);
      }
    } catch (e) {
      console.log(`Error on ${id}: ${e.message}`);
    }
  }
}

