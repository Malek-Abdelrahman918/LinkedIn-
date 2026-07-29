'use strict';

/**
 * Builds the card page: a self-contained 1024x1024 HTML document that draws its
 * own pen marks.
 *
 * The page waits for the fonts, measures where the marked elements actually
 * ended up, and only then puts ink down. That is the whole point — the
 * annotation has to survive content of a different length. Hardcoded ellipse
 * coordinates do not; they end up circling the rows the note says are fine.
 *
 * Two shapes of page come out of here:
 *   buildHtml(spec)  bakes one spec in. Used by the local preview.
 *   buildShell()     reads its spec from the URL hash. Published once, then
 *                    driven by whatever the workflow puts after the #.
 * Both share render/artefacts.js, inlined below, so the markup cannot drift
 * between preview and production.
 */

const fs = require('fs');
const path = require('path');
const { validateSpec, ARTEFACTS } = require('./artefacts');

// The handwriting is the design, so it is embedded rather than linked: a
// renderer with no network, a blocked font CDN or a slow stylesheet would
// otherwise silently fall back and ship a card set in Times. The artefact
// itself is meant to look like a screenshot of a real app, and the system UI
// stack does that everywhere without another megabyte of base64.
const FONT_DIR = path.join(__dirname, 'fonts');
const UI_STACK = "-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,'Liberation Sans',sans-serif";

const FONT_FILES = [['Caveat', 'Caveat.ttf', 700], ['Arch', 'ArchitectsDaughter.ttf', 400]];

let FONT_CSS = null;
function fontCss(fontBase) {
  // Serving the page from a webhook means shipping it in a Code node, and a
  // megabyte of base64 does not belong there. Pointing at the font files in the
  // repo keeps the page small; they are pinned to a commit, and the page still
  // waits for document.fonts.ready either way.
  if (fontBase) {
    return FONT_FILES.map(([family, file, weight]) =>
      "@font-face{font-family:'" + family + "';font-weight:" + weight + ";font-display:block;" +
      "src:url(" + fontBase + '/' + file + ") format('truetype')}").join('');
  }
  if (FONT_CSS) return FONT_CSS;
  FONT_CSS = FONT_FILES.map(([family, file, weight]) =>
    "@font-face{font-family:'" + family + "';font-weight:" + weight + ";font-display:block;" +
    "src:url(data:font/ttf;base64," + fs.readFileSync(path.join(FONT_DIR, file)).toString('base64') +
    ") format('truetype')}").join('');
  return FONT_CSS;
}

let ARTEFACT_SRC = null;
function artefactSrc() {
  if (ARTEFACT_SRC === null) {
    ARTEFACT_SRC = fs.readFileSync(path.join(__dirname, 'artefacts.js'), 'utf8');
  }
  return ARTEFACT_SRC;
}

/**
 * `spec` bakes a spec into the page. Pass null for a shell that reads its spec
 * from the URL hash instead.
 */
function buildPage(spec, opts) {
  opts = opts || {};
  if (spec !== null) {
    const problems = validateSpec(spec);
    if (problems.length) throw new Error('invalid visual spec: ' + problems.join('; '));
  }

  const specSource = spec === null
    // base64url so the spec survives being pasted into a URL, and the hash so
    // it never reaches a server or a log.
    ? `(function () {
        var raw = location.hash.replace(/^#/, '');
        if (!raw) throw new Error('no spec in the url hash');
        var b64 = raw.replace(/-/g, '+').replace(/_/g, '/');
        while (b64.length % 4) b64 += '=';
        return JSON.parse(decodeURIComponent(escape(atob(b64))));
      })()`
    : JSON.stringify(spec);

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>LeadSync card</title>
<style>
${fontCss(opts.fontBase)}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1024px;height:1024px;overflow:hidden}
body{background:#EDEAE3;font-family:${UI_STACK}}
.card{width:1024px;height:1024px;position:relative;overflow:hidden;background:#EDEAE3}
.head{position:absolute;left:48px;top:52px;right:48px;font-family:'Caveat';font-weight:700;
  font-size:60px;line-height:1.05;color:#1E2024;transform:rotate(-.8deg)}
/* Everything inside the artefact is sized in em off this one value, so a
   sheet the model gave nine columns to can be shrunk to fit with a single
   assignment instead of a per-element climbdown. */
.artefact{position:absolute;left:44px;right:44px;top:150px;transform:rotate(-1.2deg);font-size:19px;
  box-shadow:0 18px 44px rgba(0,0,0,.20);background:#fff;border:1px solid #d5d2cb;overflow:hidden}
.artefact.narrow{right:186px}
.ink{position:absolute;inset:0;pointer-events:none}
.pen{fill:none;stroke:#C0392B;stroke-width:5;stroke-linecap:round;filter:url(#rough);opacity:.88}
.underline{stroke-width:4}
.note{position:absolute;left:96px;top:780px;right:80px;font-family:'Caveat';font-weight:700;
  color:#C0392B;line-height:1.08;font-size:47px;transform:rotate(-2.4deg)}
.foot{position:absolute;left:48px;right:48px;bottom:50px;font-family:'Arch';
  font-size:28px;color:#55585E;transform:rotate(-.5deg);line-height:1.35}

.sheet{width:100%;border-collapse:collapse;color:#25272B}
.sheet td{border:1px solid #E1E3E6;padding:.74em .68em;white-space:nowrap;overflow:hidden;
  text-overflow:ellipsis}
.sheet .hdr td{background:#F1F3F4;font-weight:600;color:#4A4E55;font-size:.95em}
.sheet .rn{background:#F1F3F4;color:#8A8F97;width:2.3em;text-align:center;font-size:.84em}
.sheet .bad{color:#B0442F}
.sheet .good{color:#1F7A4C}
.sheet tr.flag td{background:#FAF3EA}

.art-chat{background:#EFE7DE}
.chdr{background:#F6F4F1;border-bottom:1px solid #E3E0DA;padding:.95em 1.26em;display:flex;
  justify-content:space-between;align-items:baseline;gap:1em}
.cav{font-size:1.1em;font-weight:600;color:#2A2D33}
.con{font-size:.9em;color:#7C818A;white-space:nowrap}
.cbody{padding:1.37em 1.26em 1.58em}
.msg{max-width:74%;padding:.79em .95em 1.16em;border-radius:.74em;font-size:1.1em;color:#1F2227;
  position:relative;margin-bottom:.84em;line-height:1.35}
.msg.in{background:#fff;border:1px solid #E6E3DD}
.msg.out{background:#DCF6C6;margin-left:auto}
.msg .t{position:absolute;right:.67em;bottom:.29em;font-size:.67em;color:#8A8F97}
.daysep{text-align:center;font-size:.84em;color:#8A8F97;margin:.42em 0 .95em}
.nothing{font-size:.9em;color:#A9AEB5;text-align:right;padding-right:.32em}

.slot{display:flex;align-items:center;gap:1.16em;height:3.47em;padding:0 1.37em;
  border-bottom:1px solid #EAE7E1;font-size:1.1em}
.slot:last-child{border-bottom:none}
.slot .hr{width:3.9em;color:#8A8F97;font-size:.86em;flex:0 0 auto}
.slot .ev{overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.slot.admin{background:#FBF4EC;color:#8A5A3A}
.slot.sell{background:#EDF6EF;color:#22633F;font-weight:600}
.slot.neutral{background:#fff;color:#3E434B}

.art-listing{display:flex}
.photo{width:20.6em;min-height:24.7em;align-self:stretch;flex:0 0 auto;position:relative;
  background:linear-gradient(140deg,#C9D2DA,#9EAAB6 60%,#8794A2)}
.pcount{position:absolute;left:.95em;bottom:.95em;background:rgba(0,0,0,.55);color:#fff;
  font-size:.84em;padding:.37em .63em;border-radius:.32em}
.tbody{padding:1.47em 1.68em;flex:1 1 auto;min-width:0}
.price{font-size:2.21em;font-weight:800;color:#1B1E23;letter-spacing:-.02em;display:inline-block}
.taddr{font-size:1.16em;color:#3E434B;margin-top:.53em}
.meta{display:flex;gap:.63em;font-size:.95em;color:#7C818A;margin-top:.74em;flex-wrap:wrap}
.badges{display:flex;flex-wrap:wrap;gap:.53em;margin-top:1.05em}
.bd{font-size:.84em;padding:.42em .68em;border-radius:.37em;background:#F0F1F3;color:#5A5F67}
.bd.warn{background:#FBEDE6;color:#A4512F}
.desc{font-size:.9em;line-height:1.55;color:#6B7079;margin-top:1.16em}
.agentrow{display:flex;align-items:center;gap:.68em;margin-top:1.26em}
.av{width:2em;height:2em;border-radius:50%;background:#CBD3DB;flex:0 0 auto}
.ag{font-size:.95em;color:#6B7079}
.btnrow{display:flex;gap:.53em;margin-top:1.16em}
.btn{font-size:.9em;padding:.58em 1.16em;border-radius:.42em;border:1px solid #D3D7DC;color:#4A4E55}
.btn.wa{background:#25A65B;border-color:#25A65B;color:#fff}
</style></head>
<body>
<svg width="0" height="0" style="position:absolute">
  <filter id="rough">
    <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="3.5" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
</svg>
<div class="card">
  <div class="head"></div>
  <div class="artefact"></div>
  <svg class="ink" viewBox="0 0 1024 1024"></svg>
  <div class="note"></div>
  <div class="foot"></div>
</div>
<script>
${artefactSrc()}
</script>
<script>
(function () {
  var CARD = 1024;
  var SPEC = ${specSource};

  function paint() {
    var problems = validateSpec(SPEC);
    if (problems.length) throw new Error('invalid visual spec: ' + problems.join('; '));
    document.querySelector('.head').innerHTML = escLines(SPEC.headline);
    document.querySelector('.note').innerHTML = escLines(SPEC.note);
    document.querySelector('.foot').innerHTML = escLines(SPEC.footer);
    var art = document.querySelector('.artefact');
    art.className = 'artefact art-' + SPEC.artefact.type;
    art.innerHTML = buildArtefact(SPEC);
  }

  // A block that spans the artefact cannot be circled: an ellipse that wide has
  // to bulge past the card edge, and its arcs eat the rows above and below —
  // on a calendar that means marking the exact slots the note says are fine.
  // Bracket it in the margin instead, the way a person would.
  function bracket(x, t, b) {
    var c = 15;
    return 'M ' + (x + 20) + ' ' + t + ' Q ' + x + ' ' + t + ', ' + x + ' ' + (t + c) +
           ' L ' + x + ' ' + (b - c) + ' Q ' + x + ' ' + b + ', ' + (x + 20) + ' ' + b;
  }

  // One mark per run of touching elements, not one per group. A group whose
  // members are not adjacent — rows 2, 3, 4 and 6 of a sheet — would otherwise
  // union into a single bracket that also spans row 5, marking a row the note
  // never mentions.
  function measure(card, cb) {
    var byGroup = {};
    var marked = card.querySelectorAll('[data-ring]');
    for (var i = 0; i < marked.length; i++) {
      var el = marked[i];
      var g = el.getAttribute('data-ring');
      var b = el.getBoundingClientRect();
      if (!byGroup[g]) byGroup[g] = [];
      byGroup[g].push({ l: b.left - cb.left, t: b.top - cb.top, r: b.right - cb.left, bt: b.bottom - cb.top });
    }

    var shapes = [];
    Object.keys(byGroup).forEach(function (g) {
      var boxes = byGroup[g].slice().sort(function (a, b) { return a.t - b.t; });
      var cur = null;
      boxes.forEach(function (b) {
        var touching = cur && b.t - cur.bt <= 14 && b.l < cur.r && b.r > cur.l;
        var sameRow = cur && Math.abs(b.t - cur.t) < 6;
        if (touching || sameRow) {
          cur.l = Math.min(cur.l, b.l);
          cur.t = Math.min(cur.t, b.t);
          cur.r = Math.max(cur.r, b.r);
          cur.bt = Math.max(cur.bt, b.bt);
        } else {
          cur = { l: b.l, t: b.t, r: b.r, bt: b.bt };
          shapes.push(cur);
        }
      });
    });
    return shapes;
  }

  // The model decides how many columns and rows there are, so the artefact has
  // to be made to fit rather than assumed to. Everything inside is em-based,
  // so one number does it.
  function fit(art) {
    var MAX_BOTTOM = 706;
    for (var size = 19; size >= 11; size--) {
      art.style.fontSize = size + 'px';
      var overWide = art.scrollWidth > art.clientWidth + 1;
      var overTall = art.getBoundingClientRect().bottom > MAX_BOTTOM;
      if (!overWide && !overTall) return size;
    }
    return 11;
  }

  function draw() {
    paint();
    var card = document.querySelector('.card');
    var art = card.querySelector('.artefact');
    fit(art);

    var cb = card.getBoundingClientRect();
    var svg = card.querySelector('.ink');
    var shapes = measure(card, cb);

    // A mark that is both wide and more than one row deep cannot be circled:
    // an ellipse that big bulges off the card and its arcs cover the rows above
    // and below, which is how a calendar ends up circling the two slots the
    // note says are fine. Bracket in the margin instead. The whole card commits
    // to one or the other — mixing a bracket and an ellipse looks like a slip.
    var useBrackets = shapes.some(function (g) {
      return (g.r - g.l) > 700 && (g.bt - g.t) > 110;
    });
    if (useBrackets) {
      art.classList.add('narrow');
      void art.offsetWidth;
      fit(art);
      cb = card.getBoundingClientRect();
      shapes = measure(card, cb);
    }

    var lowest = null;
    shapes.forEach(function (g) {
      var w = g.r - g.l, h = g.bt - g.t;
      if (useBrackets) {
        var x = Math.min(g.r + 26, CARD - 40);
        svg.insertAdjacentHTML('beforeend',
          '<path d="' + bracket(x, g.t + 6, g.bt - 6) + '" class="pen"/>');
      } else {
        var cx = (g.l + g.r) / 2, cy = (g.t + g.bt) / 2;
        // On a wide mark both radii stay tight: vertically because the arcs
        // otherwise reach into the row above and the row below and circle those
        // too, horizontally so the loop closes on the card instead of running
        // off the edge.
        var wide = w > 400;
        var rx = wide ? Math.min(w / 2 + 10, CARD / 2 - 60) : w / 2 + 16;
        var ry = wide ? h * 0.5 : h / 2 + 13;
        svg.insertAdjacentHTML('beforeend',
          '<ellipse cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) +
          '" rx="' + rx.toFixed(1) + '" ry="' + ry.toFixed(1) + '" class="pen"/>');
        // Only an ellipse earns an arrow. An arrow drawn to a margin bracket
        // points at empty paper.
        if (!lowest || g.bt > lowest.bt) lowest = { cx: cx, bt: g.bt };
      }
    });

    // Park the note under the artefact, whatever height the artefact came out.
    // A short artefact leaves a lot of paper between the note and the footer,
    // so the note drifts down into it rather than sitting in the gap's ceiling.
    var artBottom = art.getBoundingClientRect().bottom - cb.top;
    var note = card.querySelector('.note');
    note.style.top = (artBottom + 92) + 'px';
    var noteHeight = note.getBoundingClientRect().height;
    var footTop = card.querySelector('.foot').getBoundingClientRect().top - cb.top;
    var spare = footTop - 46 - (artBottom + 92 + noteHeight);
    var noteTop = Math.min(artBottom + 92 + Math.max(0, spare) * 0.42, 792);
    note.style.top = noteTop + 'px';
    var nb = note.getBoundingClientRect();
    var noteBottom = nb.bottom - cb.top;

    if (lowest) {
      var ax = Math.max(150, Math.min(lowest.cx, 620));
      svg.insertAdjacentHTML('beforeend',
        '<path d="M' + ax + ' ' + (noteTop - 26) + ' C ' + (ax - 14) + ' ' + (noteTop - 70) +
        ', ' + (ax - 6) + ' ' + (lowest.bt + 54) + ', ' + (ax + 8) + ' ' + (lowest.bt + 20) + '" class="pen"/>' +
        '<path d="M' + (ax + 8) + ' ' + (lowest.bt + 20) + ' L ' + (ax - 8) + ' ' + (lowest.bt + 48) +
        ' M' + (ax + 8) + ' ' + (lowest.bt + 20) + ' L ' + (ax + 26) + ' ' + (lowest.bt + 46) + '" class="pen"/>');
    }
    svg.insertAdjacentHTML('beforeend',
      '<path d="M96 ' + (noteBottom + 20) + ' C 250 ' + (noteBottom + 8) + ', 420 ' + (noteBottom + 12) +
      ', ' + Math.min(nb.width + 90, 620) + ' ' + (noteBottom + 22) + '" class="pen underline"/>');

    document.documentElement.setAttribute('data-ready', '1');
  }

  // Measuring before the fonts land gives geometry for the fallback face, and
  // the pen ends up somewhere else entirely. A failure has to be visible too:
  // a renderer screenshotting a silently blank card would publish a blank card.
  function start() {
    try {
      draw();
    } catch (err) {
      document.documentElement.setAttribute('data-error', err.message);
      document.body.innerHTML =
        '<pre style="padding:40px;font:16px/1.5 monospace;color:#B0442F;white-space:pre-wrap">' +
        esc(err.message) + '</pre>';
    }
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start);
  else window.addEventListener('load', start);
})();
</script>
</body></html>`;
}

/** A page with the spec baked in. Used by the local preview. */
function buildHtml(spec, opts) {
  return buildPage(spec, opts);
}

/** A page that reads its spec from the URL hash. Served once, driven by the workflow. */
function buildShell(opts) {
  return buildPage(null, opts);
}

module.exports = { buildHtml, buildShell, buildPage, validateSpec, ARTEFACTS };
