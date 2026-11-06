import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

(async () => {
  const browser = await chromium.launchPersistentContext('./chrome_data', { channel: 'chrome', headless: false });
  const page = browser.pages()[0] || await browser.newPage();

  const assetList = [];

  page.on('response', async (res) => {
    const url = res.url();
    const ct = res.headers()['content-type'] || '';
    if (ct.includes('image') || url.includes('.png') || url.includes('.webp') || url.includes('.svg') || url.includes('.jpg') || url.includes('sprite') || url.includes('hubie') || url.includes('road')) {
      console.log('ASSET:', ct, url);
      try {
        const buffer = await res.buffer();
        assetList.push({ url, ct, size: buffer.length, buffer });
      } catch {}
    }
  });

  console.log('Loading Hubie Road with launch parameter...');
  await page.goto('https://www.housebets.com/games/housegames-hubie-s-road?launch=mw4mqzo3', { timeout: 45000 });
  await page.waitForTimeout(8000);

  // Inspect DOM inside shadowRoot for images, svgs, canvases
  const domInspect = await page.evaluate(() => {
    const host = document.querySelector('[data-housegames-direct]');
    if (!host?.shadowRoot) return { error: 'no host shadow' };
    const gameEl = host.shadowRoot.querySelector('*[data-game-slug], *[class*="game"]') || host.shadowRoot;
    const root = gameEl.shadowRoot || gameEl;

    const imgs = Array.from(root.querySelectorAll('img')).map(i => ({ src: i.src, className: i.className, w: i.width, h: i.height }));
    const svgs = Array.from(root.querySelectorAll('svg')).map(s => ({ className: String(s.className), inner: s.innerHTML.slice(0, 300) }));
    const bgElements = Array.from(root.querySelectorAll('*')).map(el => {
      const bg = window.getComputedStyle(el).backgroundImage;
      return bg && bg !== 'none' ? { tag: el.tagName, className: el.className, bg } : null;
    }).filter(Boolean);

    // Check for canvas elements and whether sprite is drawn
    const canvases = Array.from(root.querySelectorAll('canvas')).map(c => ({ w: c.width, h: c.height, className: c.className }));

    return { imgs, svgsCount: svgs.length, svgs: svgs.slice(0, 10), bgElements, canvases };
  });

  console.log('DOM Inspect:', JSON.stringify(domInspect, null, 2));

  // Save all downloaded image assets to scratch/road_assets/
  const outDir = './scratch/road_assets';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (let i = 0; i < assetList.length; i++) {
    const item = assetList[i];
    try {
      const u = new URL(item.url);
      const ext = path.extname(u.pathname) || (item.ct.includes('svg') ? '.svg' : item.ct.includes('webp') ? '.webp' : '.png');
      const base = path.basename(u.pathname, ext) || `asset_${i}`;
      const safeName = `${i}_${base.replace(/[^a-zA-Z0-9_-]/g, '_')}${ext}`;
      fs.writeFileSync(path.join(outDir, safeName), item.buffer);
      console.log(`Saved: ${safeName} (${item.size} bytes)`);
    } catch {}
  }

  await page.waitForTimeout(3000);
  await browser.close();
})();

