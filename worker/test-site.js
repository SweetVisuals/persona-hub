const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
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
  const rootHtml = await page.$eval('#root', el => el.innerHTML);
  if (!rootHtml || rootHtml.trim() === '') {
    console.log('ROOT IS BLANK!');
  } else {
    console.log('ROOT HAS CONTENT');
  }
  
  await browser.close();
})();
