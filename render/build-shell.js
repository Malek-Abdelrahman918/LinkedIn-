'use strict';

/**
 * Writes the published card page to docs/card.html.
 *
 * That file is the production renderer: it is served as a static page and takes
 * its spec from the URL hash, so a screenshot service only ever needs a URL and
 * the workflow never has to carry a megabyte of fonts. Re-run this and commit
 * whenever the design changes.
 *
 *   node render/build-shell.js
 */

const fs = require('fs');
const path = require('path');
const { buildShell } = require('./template');

const out = path.join(__dirname, '..', 'docs', 'card.html');
fs.mkdirSync(path.dirname(out), { recursive: true });
const html = buildShell();
fs.writeFileSync(out, html);
console.log('wrote ' + out + ' (' + Math.round(html.length / 1024) + ' kB)');
