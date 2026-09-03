'use strict';

/**
 * Builds the brand card page.
 *
 * Two shapes, same body:
 *   buildBrandHtml(spec)  bakes the spec in. Used by the local preview.
 *   buildBrandShell(opts) reads the spec from the URL fragment. Published as
 *                         docs/brand-card.html and served by the n8n renderer.
 *
 * The spec travels in the fragment, so it never reaches a server or a request
 * log. render/brand.js is inlined verbatim rather than re-implemented, so what
 * you preview is what gets screenshotted.
 */

const fs = require('fs');
const path = require('path');
const { validateBrandSpec, LAYOUTS } = require('./brand');

const FONT_DIR = path.join(__dirname, 'fonts');
const CSS_FILE = path.join(__dirname, 'brand.css');

const FONT_FILES = [
  ['Inter', 'Inter-400.ttf', 400],
  ['Inter', 'Inter-600.ttf', 600],
  ['Inter', 'Inter-700.ttf', 700],
  ['Mono', 'JetBrainsMono-400.ttf', 400],
  ['Mono', 'JetBrainsMono-600.ttf', 600]
];

/**
 * Fonts are embedded by default. A Google Fonts stylesheet does not load from
 * file://, and a screenshot service that renders before a webfont lands gives
 * you a serif card. Pass fontBase to reference them by URL instead, which keeps
 * the n8n node small at the cost of depending on the repo being reachable.
 */
function fontCss(fontBase) {
  return FONT_FILES.map(function (f) {
    const src = fontBase
      ? "url('" + fontBase + '/' + f[1] + "') format('truetype')"
      : 'url(data:font/ttf;base64,' +
        fs.readFileSync(path.join(FONT_DIR, f[1])).toString('base64') + ") format('truetype')";
    return "@font-face{font-family:'" + f[0] + "';font-weight:" + f[2] +
      ';font-display:block;src:' + src + '}';
  }).join('');
}

let BRAND_SRC = null;
function brandSrc() {
  if (BRAND_SRC === null) BRAND_SRC = fs.readFileSync(path.join(__dirname, 'brand.js'), 'utf8');
  return BRAND_SRC;
}

let CSS = null;
function cardCss() {
  if (CSS === null) CSS = fs.readFileSync(CSS_FILE, 'utf8');
  return CSS;
}

/**
 * spec === null means "read it from location.hash at render time". Anything
 * else is baked into the page.
 */
function buildPage(spec, opts) {
  opts = opts || {};
  const baked = spec === null ? 'null' : JSON.stringify(spec);

  return '<!doctype html><meta charset="utf-8">' +
    '<title>LeadSync card</title>' +
    '<style>' + fontCss(opts.fontBase) + cardCss() + '</style>' +
    '<div id="root"></div>' +
    '<script>' + brandSrc() + '</script>' +
    '<script>' + RUNTIME.replace('__SPEC__', baked) + '</script>';
}

/**
 * Runs in the page. Decodes the spec, renders it, then auto-fits any layout
 * that overflows before marking the document ready. The screenshot service
 * waits on data-ready, so nothing is captured mid-layout or mid-font-swap.
 */
const RUNTIME = `
(function () {
  function fail(msg) {
    document.getElementById('root').innerHTML =
      '<div style="padding:80px;font:20px/1.5 monospace;color:#F5A2A2;background:#001B3D;' +
      'height:1024px">card spec rejected\\n\\n' + msg + '</div>';
    document.documentElement.setAttribute('data-ready', '1');
  }

  function fromHash() {
    var h = location.hash.replace(/^#/, '');
    if (!h) return null;
    var b64 = h.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    var bytes = atob(b64);
    var arr = new Uint8Array(bytes.length);
    for (var i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return JSON.parse(new TextDecoder('utf-8').decode(arr));
  }

  var spec = __SPEC__;
  try { if (spec === null) spec = fromHash(); } catch (e) { return fail('bad spec in url: ' + e.message); }
  if (!spec) return fail('no spec in the url fragment');

  var problems = validateBrandSpec(spec);
  if (problems.length) return fail(problems.join('\\n'));

  try {
    document.getElementById('root').innerHTML = buildBrandCard(spec);
  } catch (e) {
    return fail('render failed: ' + e.message);
  }

  // Long headlines and long code blocks are the two things that overflow. Shrink
  // the offending element until it fits rather than letting it run off the card.
  function fit(el, start, min) {
    if (!el) return;
    var size = start;
    el.style.fontSize = size + 'px';
    var card = document.querySelector('.card');
    while (size > min && el.scrollHeight > el.clientHeight + 1) {
      size -= 1;
      el.style.fontSize = size + 'px';
    }
    // The body is centred, so overflow shows up as the card scrolling, not the
    // element. Check the card too.
    while (size > min && card && card.scrollHeight > 1024) {
      size -= 1;
      el.style.fontSize = size + 'px';
    }
  }

  function settle() {
    fit(document.querySelector('h1'), 78, 46);
    fit(document.querySelector('h2'), 51, 32);
    fit(document.querySelector('.code'), 21, 13);
    var card = document.querySelector('.card');
    var guard = 0;
    while (card && card.scrollHeight > 1024 && guard < 40) {
      var body = document.querySelector('.body');
      var pad = parseInt(getComputedStyle(body).paddingBottom, 10) || 0;
      if (pad <= 0) break;
      body.style.paddingBottom = (pad - 4) + 'px';
      guard++;
    }
    document.documentElement.setAttribute('data-ready', '1');
  }

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(settle);
  else settle();
})();
`;

function buildBrandHtml(spec, opts) {
  const problems = validateBrandSpec(spec);
  if (problems.length) throw new Error('invalid brand spec: ' + problems.join('; '));
  return buildPage(spec, opts);
}

function buildBrandShell(opts) {
  return buildPage(null, opts);
}

module.exports = { buildBrandHtml, buildBrandShell, buildPage, validateBrandSpec, LAYOUTS };
