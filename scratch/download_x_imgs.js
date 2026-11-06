import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const outDir = 'scratch/x_images';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const urls = [
  { name: 'profile_400.jpg', url: 'https://pbs.twimg.com/profile_images/2103207642151759872/-ejxSd2M_400x400.jpg' },
  { name: 'banner.jpg', url: 'https://pbs.twimg.com/profile_banners/2102434240373702656/1790285650/1500x500' },
  { name: 'media_1.jpg', url: 'https://pbs.twimg.com/media/HWcWG0TW0AExXmy?format=jpg&name=large' },
  { name: 'media_2.jpg', url: 'https://pbs.twimg.com/media/HWawaHMWgAAFcgW?format=jpg&name=large' }
];

for (const item of urls) {
  const filePath = path.join(outDir, item.name);
  console.log(`Downloading ${item.url} -> ${filePath}...`);
  execSync(`curl.exe -s -L "${item.url}" -o "${filePath}"`);
  const stats = fs.statSync(filePath);
  console.log(`Saved ${item.name} (${stats.size} bytes)`);
}

