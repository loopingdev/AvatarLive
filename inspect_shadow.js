import { chromium } from 'playwright';

async function main() {
  const context = await chromium.launchPersistentContext('./chrome_data', {
    channel: 'chrome',
    headless: false,
    viewport: { width: 1280, height: 800 }
  });
  const page = context.pages()[0] || await context.newPage();
  await page.goto('https://www.housebets.com/games/housegames-hubie-s-road', { timeout: 35000 });
  await page.waitForTimeout(6000);

  // Inspect inside shadow root
  const shadowInfo = await page.evaluate(() => {
    const host = document.querySelector('[data-housegames-direct]');
    if (!host) return { error: 'No data-housegames-direct host found' };
    const root = host.shadowRoot;
    if (!root) return { error: 'No shadowRoot on host' };

    const buttons = Array.from(root.querySelectorAll('button, input, [role="button"]')).map(b => ({
      tag: b.tagName,
      text: b.innerText?.trim(),
      aria: b.getAttribute('aria-label'),
      type: b.getAttribute('type'),
      className: b.className?.slice(0, 50),
      rect: b.getBoundingClientRect()
    }));

    return {
      buttons,
      htmlSnippet: root.innerHTML.slice(0, 1000)
    };
  });

  console.log('Shadow DOM Contents of Hubie Road:');
  console.log(JSON.stringify(shadowInfo, null, 2));

  await context.close();
}

main().catch(console.error);

