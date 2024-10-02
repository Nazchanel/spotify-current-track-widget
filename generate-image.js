const puppeteer = require('puppeteer');
const fs = require('fs');

async function generateImage() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    await page.goto('https://spotify-current-track-widget.onrender.com/', { waitUntil: 'networkidle0' });

    const svg = await page.$('svg');
    if (!svg) {
      throw new Error('SVG element not found on the page.');
    }

    await svg.screenshot({ path: 'songs-pictures/image.png', type: 'png' });
  } finally {
    await browser.close();
  }
}

(async () => {
  let retries = 1;
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      console.log(`Attempt ${attempt}: Generating image...`);
      await generateImage();
      console.log(`Image generated successfully on attempt ${attempt}.`);
      break;
    } catch (error) {
      console.error(`Attempt ${attempt} failed: ${error.message}`);
      if (attempt > retries) {
        console.error('Image generation failed after retrying. Throwing error.');
        throw error;
      }
      console.log('Retrying image generation...');
    }
  }
})();
