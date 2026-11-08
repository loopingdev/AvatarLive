import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { CONFIG } from './config.js';

console.log('====================================================');
console.log('  HUBIE LIVE — EXPORT HOUSEBETS SESSION TO JSON     ');
console.log('====================================================\n');

async function main() {
  const userDataDir = path.join(CONFIG.BASE_DIR, 'chrome_data');
  const sessionFilePath = path.join(CONFIG.BASE_DIR, 'session.json');

  console.log(`[1/2] Mengekstrak data sesi dari: ${userDataDir}...`);

  const launchOptions = {
    headless: true
  };

  if (process.platform === 'win32') {
    launchOptions.channel = 'chrome';
  } else {
    launchOptions.executablePath = chromium.executablePath();
  }

  const context = await chromium.launchPersistentContext(userDataDir, launchOptions);

  await context.storageState({ path: sessionFilePath });
  await context.close();

  if (fs.existsSync(sessionFilePath)) {
    const data = JSON.parse(fs.readFileSync(sessionFilePath, 'utf8'));
    const cookieCount = data.cookies ? data.cookies.length : 0;
    console.log(`[2/2] ✅ SUKSES! Berhasil mengekstrak ${cookieCount} cookies ke:`);
    console.log(`      ${sessionFilePath}\n`);
    console.log('📋 LANGKAH SELANJUTNYA:');
    console.log('Upload file session.json ke VPS:');
    console.log('  scp session.json root@35.219.125.109:/root/hubie/\n');
    console.log('Lalu di VPS jalankan:');
    console.log('  pm2 restart all --update-env\n');
  } else {
    console.error('❌ Gagal membuat session.json');
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
