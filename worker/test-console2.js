const Camoufox = require('camoufox');
(async () => {
  const browser = await Camoufox({ headless: true });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  await page.goto('https://socials.relaysolutions.net/', { waitUntil: 'networkidle0' });
  const root = await page.evaluate(() => document.getElementById('root')?.innerHTML || '');
  console.log('Root size:', root.length);
  await browser.close();
})();
