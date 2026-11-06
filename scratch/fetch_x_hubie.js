import { chromium } from 'playwright';
import fs from 'fs';

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();
  try {
    console.log('Navigating to https://x.com/HousebetsHubie ...');
    const response = await page.goto('https://x.com/HousebetsHubie', { timeout: 30000 }).catch(e => console.log('Goto err:', e.message));
    if (response) {
      console.log('Status code:', response.status());
    }
    await page.waitForTimeout(6000);
    const title = await page.title();
    console.log('Title:', title);

    const data = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img[src*="pbs.twimg.com"]')).map(i => i.src);
      const tweets = Array.from(document.querySelectorAll('[data-testid="tweetText"]')).map(t => t.innerText);
      return { imgs, tweets };
    });
    console.log('Found', data.imgs.length, 'images and', data.tweets.length, 'tweets.');
    console.log(JSON.stringify(data, null, 2));

    // Also check media tab
    await page.goto('https://x.com/HousebetsHubie/media', { timeout: 30000 });
    await page.waitForTimeout(6000);
    const mediaData = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img[src*="pbs.twimg.com"]')).map(i => i.src);
      return imgs;
    });
    console.log('Media tab images:', JSON.stringify(mediaData, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
}

main();
