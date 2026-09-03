'use strict';

/**
 * Renders every spec in a JSON file to a PNG, so a card can be looked at before
 * anything depends on it.
 *
 *   node render/brand-preview.js [specs.json] [outDir]
 *
 * Defaults to render/brand-samples.json and render/out/brand/. Needs Playwright;
 * the production path does not.
 */

const fs = require('fs');
const path = require('path');
const { buildBrandHtml } = require('./brand-template');

const specsPath = path.resolve(process.argv[2] || path.join(__dirname, 'brand-samples.json'));
const outDir = path.resolve(process.argv[3] || path.join(__dirname, 'out', 'brand'));

const CHROMIUM = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const PLAYWRIGHT = process.env.PLAYWRIGHT_PATH || '/opt/node22/lib/node_modules/playwright';

(async () => {
  const { chromium } = require(PLAYWRIGHT);
  const specs = JSON.parse(fs.readFileSync(specsPath, 'utf8'));
  const list = Array.isArray(specs) ? specs : [specs];
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({
    executablePath: CHROMIUM,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage({ viewport: { width: 1024, height: 1024 } });

  for (let i = 0; i < list.length; i++) {
    const file = path.join(outDir, 'layout-' + (i + 1) + '.html');
    fs.writeFileSync(file, buildBrandHtml(list[i]));
    await page.goto('file://' + file);
    await page.waitForSelector('html[data-ready="1"]', { timeout: 15000 });
    const png = path.join(outDir, 'layout-' + (i + 1) + '.png');
    await page.screenshot({ path: png });
    console.log(String(list[i].layout).padEnd(10) + ' -> ' + png);
  }

  await browser.close();
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
