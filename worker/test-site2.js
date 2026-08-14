const Camoufox = require('camoufox');

(async () => {
  const browser = await Camoufox({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });
  
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });
  
  await page.goto('https://socials.relaysolutions.net/', { waitUntil: 'networkidle2' });
  
  console.log('Page loaded.');
  const rootHtml = await page.evaluate(() => document.getElementById('root').innerHTML);
  if (!rootHtml || rootHtml.trim() === '') {
    console.log('ROOT IS BLANK!');
  } else {
    console.log('ROOT HAS CONTENT');
  }
  
  await browser.close();
})();
