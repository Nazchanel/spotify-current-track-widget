const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto('https://spotify-current-track-widget.onrender.com/', { waitUntil: 'networkidle0' });

  const svg = await page.$('svg');
  await svg.screenshot({ path: 'songs-pictures/image.png', type: 'png' });

  await browser.close();
})();
