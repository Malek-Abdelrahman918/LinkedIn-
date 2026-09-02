'use strict';

/**
 * The brand card layouts, as data.
 *
 * ES5 and dependency-free on purpose: this file runs under Node for the local
 * preview AND is inlined verbatim into the card page, so the preview and the
 * thing that actually gets screenshotted cannot drift apart.
 *
 * Everything here comes from BRAND.md: navy #001B3D ground, cyan #0CC0DF as an
 * accent only, Inter for type and JetBrains Mono for anything that represents
 * data. No handwriting, no red pen, no paper.
 */

var LAYOUTS = ['statement', 'flow', 'terminal', 'thread', 'panel'];

var NAVY = '#001B3D';
var CYAN = '#0CC0DF';

function esc(s) {
  return String(s === undefined || s === null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Headline accent. The model writes the emphasis inline with pipes, because a
 * separate "accentWords" field invites it to name a word that is not actually
 * in the headline. "Nobody was hired to |move data| between tabs."
 */
function headline(text) {
  var parts = String(text || '').split('|');
  var out = '';
  for (var i = 0; i < parts.length; i++) {
    out += i % 2 ? '<span class="hi">' + esc(parts[i]) + '</span>' : esc(parts[i]);
  }
  return out;
}

/* ---------- terminal colouring ---------- */

var KEYWORDS = ['on', 'if', 'else', 'return', 'when', 'then', 'for', 'each', 'and', 'or', 'not'];

/**
 * Deliberately crude. It colours strings, numbers, comments and a short list of
 * keywords and leaves everything else alone. A real parser would be worse here:
 * the "code" is illustrative pseudocode written by a model, and a parser that
 * fails on it would produce a blank card.
 */
function codeLine(raw) {
  var line = String(raw || '');
  var trimmed = line.replace(/^\s+/, '');
  if (trimmed.indexOf('#') === 0) return '<span class="c">' + esc(line) + '</span>';

  var out = '';
  var re = /("[^"]*")|(\b\d+(?:\.\d+)?\b)|(#.*$)|([A-Za-z_][A-Za-z0-9_]*)/g;
  var last = 0;
  var m;
  while ((m = re.exec(line)) !== null) {
    out += esc(line.slice(last, m.index));
    if (m[1]) out += '<span class="s">' + esc(m[1]) + '</span>';
    else if (m[2]) out += '<span class="s">' + esc(m[2]) + '</span>';
    else if (m[3]) out += '<span class="c">' + esc(m[3]) + '</span>';
    else if (KEYWORDS.indexOf(m[4]) !== -1) out += '<span class="k">' + esc(m[4]) + '</span>';
    else out += esc(m[4]);
    last = m.index + m[0].length;
  }
  out += esc(line.slice(last));
  return out;
}

/* ---------- builders ---------- */

var BUILDERS = {
  statement: function (s) {
    return '<h1>' + headline(s.headline) + '</h1>' +
      (s.sub ? '<div class="sub">' + esc(s.sub) + '</div>' : '');
  },

  flow: function (s) {
    var html = '<h2>' + headline(s.headline) + '</h2><div class="nodes">';
    var nodes = s.nodes || [];
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (i) html += '<div class="arrow">&#8594;</div>';
      html += '<div class="node' + (n.on ? ' on' : '') + '">' +
        '<div class="lbl">' + esc(n.label) + '</div>' +
        '<div class="val">' + esc(n.value) + '</div>' +
        (n.note ? '<div class="note">' + esc(n.note) + '</div>' : '') +
        '</div>';
    }
    html += '</div>';
    if (s.caption) html += '<div class="cap">' + esc(s.caption) + '</div>';
    return html;
  },

  terminal: function (s) {
    var lines = s.code || [];
    var body = '';
    for (var i = 0; i < lines.length; i++) {
      body += codeLine(lines[i]) + (i < lines.length - 1 ? '\n' : '');
    }
    return '<h2>' + headline(s.headline) + '</h2>' +
      '<div class="term"><div class="tbar"><i></i><i></i><i></i>' +
      '<span>' + esc(s.file) + '</span></div>' +
      '<div class="code">' + body + '</div></div>';
  },

  thread: function (s) {
    var html = '<h2>' + headline(s.headline) + '</h2>' +
      '<div class="thread"><div class="thd"><div class="av">&#9670;</div><div>' +
      '<div class="who">' + esc(s.who) + '</div>' +
      '<div class="st">' + esc(s.status) + '</div></div></div><div class="msgs">';
    var msgs = s.messages || [];
    for (var i = 0; i < msgs.length; i++) {
      var m = msgs[i];
      html += '<div class="b ' + (m.dir === 'out' ? 'out' : 'in') + '">' + esc(m.text) +
        (m.time ? '<span class="t">' + esc(m.time) + '</span>' : '') + '</div>';
    }
    if (s.event) html += '<div class="evt">&#9670; ' + esc(s.event) + '</div>';
    return html + '</div></div>';
  },

  panel: function (s) {
    var html = '<h2>' + headline(s.headline) + '</h2><div class="rows">';
    var rows = s.rows || [];
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      html += '<div class="r' + (r.on ? ' on' : '') + '">' +
        '<div class="rl">' + esc(r.label) + '</div>' +
        '<div class="a">' + esc(r.from) + '</div>' +
        '<div class="arw">&#8594;</div>' +
        '<div class="z">' + esc(r.to) + '</div></div>';
    }
    html += '</div>';
    if (s.caption) html += '<div class="cap">' + esc(s.caption) + '</div>';
    return html;
  }
};

/* ---------- validation ---------- */

function nonEmpty(v) {
  return typeof v === 'string' && v.trim() !== '';
}

function validateBrandSpec(spec) {
  var problems = [];
  if (!spec || typeof spec !== 'object') return ['spec is not an object'];

  if (LAYOUTS.indexOf(spec.layout) === -1) {
    problems.push('layout must be one of ' + LAYOUTS.join(', '));
  }
  if (!nonEmpty(spec.chip)) problems.push('chip is empty; every card names its service line');
  else if (spec.chip.length > 46) problems.push('chip is ' + spec.chip.length + ' chars; keep it under 46');

  if (!nonEmpty(spec.headline)) problems.push('headline is empty');
  else if (spec.headline.replace(/\|/g, '').length > 96) {
    problems.push('headline is too long for the card; keep it under 96 characters');
  }
  if ((String(spec.headline || '').split('|').length - 1) % 2 !== 0) {
    problems.push('headline has an unclosed | accent marker');
  }

  var L = spec.layout;
  if (L === 'statement') {
    if (!nonEmpty(spec.sub)) problems.push('statement needs a sub line under the headline');
  } else if (L === 'flow') {
    var n = spec.nodes || [];
    if (n.length < 2 || n.length > 3) problems.push('flow needs 2 or 3 nodes, got ' + n.length);
    for (var i = 0; i < n.length; i++) {
      if (!nonEmpty(n[i].label) || !nonEmpty(n[i].value)) {
        problems.push('flow node ' + (i + 1) + ' needs a label and a value');
      }
    }
  } else if (L === 'terminal') {
    if (!nonEmpty(spec.file)) problems.push('terminal needs a file name in its title bar');
    var c = spec.code || [];
    if (c.length < 3 || c.length > 14) problems.push('terminal needs 3 to 14 lines, got ' + c.length);
  } else if (L === 'thread') {
    if (!nonEmpty(spec.who)) problems.push('thread needs a "who" for its header');
    var m = spec.messages || [];
    if (m.length < 3 || m.length > 5) problems.push('thread needs 3 to 5 messages, got ' + m.length);
  } else if (L === 'panel') {
    var r = spec.rows || [];
    if (r.length < 3 || r.length > 5) problems.push('panel needs 3 to 5 rows, got ' + r.length);
    for (var j = 0; j < r.length; j++) {
      if (!nonEmpty(r[j].label) || !nonEmpty(r[j].from) || !nonEmpty(r[j].to)) {
        problems.push('panel row ' + (j + 1) + ' needs a label, a from and a to');
      }
    }
  }

  return problems;
}

function buildBrandBody(spec) {
  return BUILDERS[spec.layout](spec);
}

function buildBrandCard(spec) {
  return '<div class="card"><div class="inner">' +
    '<div class="chip"><span class="dot"></span>' + esc(spec.chip) + '</div>' +
    '<div class="body">' + buildBrandBody(spec) + '</div>' +
    '</div><div class="foot">' +
    '<div class="mark">LEAD<b>S</b>YNC</div>' +
    '<div class="site">useleadsync.com</div>' +
    '</div></div>';
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    LAYOUTS: LAYOUTS,
    NAVY: NAVY,
    CYAN: CYAN,
    esc: esc,
    headline: headline,
    codeLine: codeLine,
    validateBrandSpec: validateBrandSpec,
    buildBrandBody: buildBrandBody,
    buildBrandCard: buildBrandCard
  };
}
