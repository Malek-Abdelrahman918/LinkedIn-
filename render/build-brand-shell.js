'use strict';

/**
 * Writes docs/brand-card.html: the card page with the fonts embedded and no
 * spec baked in. It reads its spec from the URL fragment, so one published
 * page serves every card the workflow ever makes.
 *
 *   node render/build-brand-shell.js
 */

const fs = require('fs');
const path = require('path');
const { buildBrandShell } = require('./brand-template');

const out = path.join(__dirname, '..', 'docs', 'brand-card.html');
fs.writeFileSync(out, buildBrandShell());
console.log(out + '  ' + fs.statSync(out).size + ' bytes');
