'use strict';

/**
 * Local preview. Renders every spec in a JSON file to a PNG so the card can be
 * looked at before it goes anywhere near a post.
 *
 *   node render/preview.js [specs.json] [outDir]
 *
 * Defaults to render/samples.json and render/out/. Needs Playwright; the
 * production path does not — see render/README.md.
 */

const fs = require('fs');
const path = require('path');
const { buildHtml } = require('./template');

const specsPath = process.argv[2] || path.join(__dirname, 'samples.json');
const outDir = process.argv[3] || path.join(__dirname, 'out');

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
    const spec = list[i];
    const file = path.join(outDir, 'card-' + (i + 1) + '.html');
    fs.writeFileSync(file, buildHtml(spec));
    await page.goto('file://' + file);
    // The page sets data-ready once the fonts have landed and the ink is down.
    await page.waitForSelector('html[data-ready="1"]', { timeout: 15000 });
    const png = path.join(outDir, 'card-' + (i + 1) + '.png');
    await page.screenshot({ path: png });
    console.log(spec.artefact.type.padEnd(9) + ' -> ' + png);
  }

  await browser.close();
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
