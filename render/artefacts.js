/**
 * Turns a `visual` spec into the artefact markup, and checks a spec before
 * anything tries to draw it.
 *
 * This file runs in two places and must stay plain, dependency-free ES5: Node
 * requires it for validation and previews, and render/template.js inlines its
 * source verbatim into the card page so the browser builds the same markup.
 * One source of truth — a fix here reaches both.
 */
/* eslint-disable */
'use strict';

var ARTEFACTS = ['sheet', 'chat', 'calendar', 'listing'];
var TONES = ['admin', 'sell', 'neutral'];

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Line breaks in a headline or note arrive as \n from the model.
function escLines(s) {
  return esc(s).replace(/\r?\n/g, '<br>');
}

// A leading ! marks a cell as the bad number, ~ marks the good one. Chosen so
// that a value like "+971 55" keeps its plus sign, instead of being read as a
// marker and tinted green.
function cell(raw) {
  var v = String(raw == null ? '' : raw);
  if (v.charAt(0) === '!') return '<td class="bad">' + esc(v.slice(1)) + '</td>';
  if (v.charAt(0) === '~') return '<td class="good">' + esc(v.slice(1)) + '</td>';
  return '<td>' + esc(v) + '</td>';
}

function ringAttr(mark) {
  return mark ? ' data-ring="' + esc(mark) + '"' : '';
}

function sheet(a) {
  var cols = (a.columns || []).map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('');
  var rows = (a.rows || []).map(function (r, i) {
    var cells = (r.cells || []).map(cell).join('');
    return '<tr class="' + (r.mark ? 'flag' : '') + '"' + ringAttr(r.mark) + '>' +
      '<td class="rn">' + (i + 2) + '</td>' + cells + '</tr>';
  }).join('');
  return '<table class="sheet"><tr class="hdr"><td class="rn"></td>' + cols + '</tr>' + rows + '</table>';
}

function chat(a) {
  var body = (a.messages || []).map(function (m) {
    if (m.sep) return '<div class="daysep">' + esc(m.sep) + '</div>';
    var dir = m.dir === 'out' ? 'out' : 'in';
    return '<div class="msg ' + dir + '"' + ringAttr(m.mark) + '>' + esc(m.text) +
      (m.time ? '<span class="t">' + esc(m.time) + '</span>' : '') + '</div>';
  }).join('');
  return '<div class="chdr"><span class="cav">' + esc(a.title) + '</span>' +
    '<span class="con">' + esc(a.subtitle) + '</span></div>' +
    '<div class="cbody">' + body +
    (a.tail ? '<div class="nothing">' + esc(a.tail) + '</div>' : '') + '</div>';
}

function calendar(a) {
  return (a.slots || []).map(function (s) {
    var tone = TONES.indexOf(s.tone) === -1 ? 'neutral' : s.tone;
    return '<div class="slot ' + tone + '"' + ringAttr(s.mark) + '>' +
      '<span class="hr">' + esc(s.time) + '</span>' +
      '<span class="ev">' + esc(s.label) + '</span></div>';
  }).join('');
}

function listing(a) {
  var meta = (a.meta || []).map(function (m) { return '<span>' + esc(m) + '</span>'; }).join('<span>·</span>');
  var warn = [], plain = [];
  (a.badges || []).forEach(function (b) {
    var html = '<span class="bd ' + (b.tone === 'warn' ? 'warn' : '') + '"' + ringAttr(b.mark) + '>' +
      esc(b.text) + '</span>';
    (b.tone === 'warn' ? warn : plain).push(html);
  });
  var buttons = a.buttons || [];
  var btns = buttons.map(function (b, i) {
    return '<span class="btn' + (i === buttons.length - 1 ? ' wa' : '') + '">' + esc(b) + '</span>';
  }).join('');
  return '<div class="photo">' +
      (a.photoCount ? '<span class="pcount"' + ringAttr(a.photoMark) + '>' + esc(a.photoCount) + '</span>' : '') +
    '</div>' +
    '<div class="tbody">' +
      '<div class="price"' + ringAttr(a.priceMark) + '>' + esc(a.price) + '</div>' +
      '<div class="taddr">' + esc(a.address) + '</div>' +
      (meta ? '<div class="meta">' + meta + '</div>' : '') +
      (warn.length ? '<div class="badges">' + warn.join('') + '</div>' : '') +
      (plain.length ? '<div class="badges">' + plain.join('') + '</div>' : '') +
      (a.description ? '<div class="desc">' + esc(a.description) + '</div>' : '') +
      (a.agent ? '<div class="agentrow"><span class="av"></span><span class="ag">' + esc(a.agent) + '</span></div>' : '') +
      (btns ? '<div class="btnrow">' + btns + '</div>' : '') +
    '</div>';
}

var BUILDERS = { sheet: sheet, chat: chat, calendar: calendar, listing: listing };

/**
 * Returns a list of problems with a spec; empty means it is good. A bad spec
 * should fail here, loudly, rather than quietly produce a card with an empty
 * artefact on it.
 */
function validateSpec(spec) {
  var problems = [];
  if (!spec || typeof spec !== 'object') return ['visual spec is missing'];
  if (!spec.headline) problems.push('headline is missing');
  if (!spec.note) problems.push('note is missing');
  if (!spec.footer) problems.push('footer is missing');

  var a = spec.artefact;
  if (!a || typeof a !== 'object') {
    problems.push('artefact is missing');
    return problems;
  }
  if (ARTEFACTS.indexOf(a.type) === -1) {
    problems.push('artefact.type must be one of ' + ARTEFACTS.join(', '));
    return problems;
  }

  var marks = 0;
  if (a.type === 'sheet') {
    var cols = (a.columns || []).length;
    if (!cols) problems.push('sheet needs columns');
    if ((a.rows || []).length < 4) problems.push('sheet needs at least 4 rows to read as real data');
    (a.rows || []).forEach(function (r, i) {
      if (r.mark) marks++;
      if ((r.cells || []).length !== cols) {
        problems.push('row ' + (i + 1) + ' has ' + (r.cells || []).length +
          ' cells but there are ' + cols + ' columns');
      }
    });
  } else if (a.type === 'chat') {
    if ((a.messages || []).length < 3) problems.push('chat needs at least 3 messages');
    (a.messages || []).forEach(function (m) { if (m.mark) marks++; });
  } else if (a.type === 'calendar') {
    if ((a.slots || []).length < 5) problems.push('calendar needs at least 5 slots');
    (a.slots || []).forEach(function (s) { if (s.mark) marks++; });
  } else if (a.type === 'listing') {
    if (!a.price) problems.push('listing needs a price');
    if (!a.address) problems.push('listing needs an address');
    if (a.photoMark) marks++;
    if (a.priceMark) marks++;
    (a.badges || []).forEach(function (b) { if (b.mark) marks++; });
  }

  if (marks === 0) problems.push('nothing is marked, so the pen has nothing to circle');
  return problems;
}

function buildArtefact(spec) {
  return BUILDERS[spec.artefact.type](spec.artefact);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ARTEFACTS: ARTEFACTS,
    esc: esc,
    escLines: escLines,
    validateSpec: validateSpec,
    buildArtefact: buildArtefact
  };
}
