import { chromium } from 'playwright';

async function checkAudio() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();

  const audioUrls = [];
  page.on('response', response => {
    const url = response.url();
    const contentType = response.headers()['content-type'] || '';
    if (url.match(/\.(mp3|wav|ogg|aac|m4a|webm)($|\?)/i) || contentType.includes('audio')) {
      audioUrls.push({ url, contentType });
    }
  });

  console.log('Navigating to Hubie\'s Road...');
  try {
    await page.goto('https://www.housebets.com/games/housegames-hubie-s-road', { timeout: 30000, waitUntil: 'networkidle' });
  } catch (e) {
    console.log('Navigation finished with:', e.message);
  }

  await page.waitForTimeout(5000);

  // Also check Audio elements or Web Audio in DOM
  const domAudio = await page.evaluate(() => {
    const audios = Array.from(document.querySelectorAll('audio, source')).map(a => a.src);
    return audios;
  });

  console.log('Intercepted audio network requests:');
  console.log(JSON.stringify(audioUrls, null, 2));

  console.log('DOM audio elements:', domAudio);

  await browser.close();
}

checkAudio().catch(console.error);

