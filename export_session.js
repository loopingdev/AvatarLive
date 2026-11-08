import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { spawn } from 'child_process';
import { chromium } from 'playwright';
import { CONFIG } from './config.js';

console.log('====================================================');
console.log('  HUBIE LIVE — FRESH LOGIN & SESSION EXPORTER       ');
console.log('====================================================\n');

function findChromePath() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe')
  ];

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  try {
    return chromium.executablePath();
  } catch {}
  return 'chrome';
}

function cleanStaleFiles(dir) {
  if (!fs.existsSync(dir)) return;
  const toDelete = ['SingletonLock', 'SingletonSocket', 'SingletonCookie'];
  for (const f of toDelete) {
    const p = path.join(dir, f);
    if (fs.existsSync(p)) {
      try { fs.unlinkSync(p); } catch {}
    }
  }
}

async function main() {
  const userDataDir = path.join(CONFIG.BASE_DIR, 'chrome_data');
  const sessionFilePath = path.join(CONFIG.BASE_DIR, 'session.json');

  // 1. Remove old session.json
  if (fs.existsSync(sessionFilePath)) {
    try {
      fs.unlinkSync(sessionFilePath);
      console.log('🗑️  File session.json lama berhasil dihapus.');
    } catch {}
  }

  // 2. Clean lock files in chrome_data
  cleanStaleFiles(userDataDir);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const answer = await new Promise((res) => {
    rl.question('Apakah kamu ingin mereset total chrome_data lokal untuk login baru dari nol? (y/n) [default: y]: ', (a) => {
      res((a || 'y').trim().toLowerCase());
    });
  });

  if (answer === 'y') {
    console.log('🧹 Membersihkan sesi chrome_data lama agar bersih dari nol...');
    try {
      if (fs.existsSync(userDataDir)) {
        fs.rmSync(userDataDir, { recursive: true, force: true });
        console.log('✅ chrome_data lama berhasil dibersihkan.');
      }
    } catch (e) {
      console.warn('Catatan pembersihan (beberapa file mungkin sedang dibuka):', e.message);
    }
  }

  // Ensure fresh folder exists
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  const chromePath = findChromePath();
  console.log(`\n[1/3] Membuka Google Chrome biasa: ${chromePath}`);

  // Launch Chrome as native app (no automation flags, bypasses Cloudflare challenge loop)
  const chromeArgs = [
    CONFIG.HOUSEBETS_BASE_URL,
    `--user-data-dir=${userDataDir}`,
    '--start-maximized',
    '--no-first-run',
    '--no-default-browser-check'
  ];

  const proc = spawn(chromePath, chromeArgs, {
    detached: true,
    stdio: 'ignore'
  });
  proc.unref();

  console.log('\n----------------------------------------------------');
  console.log('👉 Jendela Google Chrome asli sekarang sudah terbuka.');
  console.log('👉 Silakan login ke akun Housebets kamu seperti biasa.');
  console.log('👉 Selesaikan captcha / verifikasi jika diminta.');
  console.log('👉 Pastikan akunmu sudah masuk dan saldo/dashboard tampil.');
  console.log('----------------------------------------------------\n');

  await new Promise((res) => {
    rl.question('Sudah selesai login di Chrome? Tekan tombol [ENTER] untuk mengekstrak sesi: ', () => {
      rl.close();
      res();
    });
  });

  console.log('\n[2/3] Mengekstrak cookie dan token autentikasi baru...');

  // Brief pause to allow Chrome to flush cookies to disk
  await new Promise((r) => setTimeout(r, 2000));

  cleanStaleFiles(userDataDir);

  const launchOptions = {
    headless: true
  };
  if (process.platform === 'win32') {
    launchOptions.channel = 'chrome';
  }

  let context = null;
  try {
    context = await chromium.launchPersistentContext(userDataDir, launchOptions);
    await context.storageState({ path: sessionFilePath });
    await context.close();
  } catch (err) {
    console.warn('Peringatan saat membaca via Chrome:', err.message);
    console.log('Mencoba menutup proses Chrome lokal terlebih dahulu agar file cookie tidak terkunci...');
    try {
      if (process.platform === 'win32') {
        const { execSync } = await import('child_process');
        execSync('taskkill /F /IM chrome.exe /FI "STATUS eq RUNNING"', { stdio: 'ignore' });
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 1500));
    cleanStaleFiles(userDataDir);
    context = await chromium.launchPersistentContext(userDataDir, launchOptions);
    await context.storageState({ path: sessionFilePath });
    await context.close();
  }

  if (fs.existsSync(sessionFilePath)) {
    const data = JSON.parse(fs.readFileSync(sessionFilePath, 'utf8'));
    const cookieCount = data.cookies ? data.cookies.length : 0;
    console.log(`\n[3/3] ✅ SUKSES! Berhasil mengekstrak ${cookieCount} cookies ke:`);
    console.log(`      ${sessionFilePath}\n`);
    console.log('📋 LANGKAH SELANJUTNYA UNTUK VPS:');
    console.log('Upload file session.json yang baru ke VPS:');
    console.log('  scp session.json root@35.219.125.109:/root/hubie/\n');
    console.log('Lalu di terminal VPS, restart:');
    console.log('  pm2 restart all --update-env\n');
  } else {
    console.error('❌ Gagal membuat session.json baru.');
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Terjadi error:', err.message);
  process.exit(1);
});
