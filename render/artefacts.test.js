'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const { validateSpec, buildArtefact, ARTEFACTS } = require('./artefacts.js');
const { buildHtml, buildShell } = require('./template.js');

const SAMPLES = JSON.parse(fs.readFileSync(path.join(__dirname, 'samples.json'), 'utf8'));

function sheetSpec(overrides = {}) {
  return {
    headline: "monday's portal leads.",
    note: 'the only two that booked\nare the only two we answered fast.',
    footer: 'nobody enquires at 22:41 and waits until 09:12.',
    artefact: {
      type: 'sheet',
      columns: ['Enquiry', 'Gap', 'Outcome'],
      rows: [
        { cells: ['A. Haddad', '!10h 31m', '!No response'] },
        { cells: ['M. Sultan', '~4m', '~Viewing booked'], mark: 'g1' },
        { cells: ['R. Kapoor', '!6h 12m', '!No response'] },
        { cells: ['L. Farouk', '~7m', '~Viewing booked'], mark: 'g2' }
      ]
    },
    ...overrides
  };
}

test('every shipped sample is a valid spec', () => {
  for (const spec of SAMPLES) {
    assert.deepStrictEqual(validateSpec(spec), [], spec.artefact.type + ' sample should be valid');
  }
});

test('the samples cover every artefact type', () => {
  const covered = SAMPLES.map((s) => s.artefact.type).sort();
  assert.deepStrictEqual(covered, [...ARTEFACTS].sort());
});

test('a spec missing its written parts is rejected', () => {
  for (const field of ['headline', 'note', 'footer']) {
    const problems = validateSpec(sheetSpec({ [field]: '' }));
    assert.ok(problems.some((p) => p.includes(field)), field + ' should be reported');
  }
});

test('an unknown artefact type is rejected', () => {
  const problems = validateSpec(sheetSpec({ artefact: { type: 'dashboard' } }));
  assert.ok(problems.some((p) => p.includes('artefact.type')));
});

test('a spec with nothing marked is rejected', () => {
  // The pen is the design. A card with no mark is just a screenshot.
  const spec = sheetSpec();
  spec.artefact.rows.forEach((r) => delete r.mark);
  assert.ok(validateSpec(spec).some((p) => p.includes('nothing is marked')));
});

test('a ragged row is reported against its column count', () => {
  const spec = sheetSpec();
  spec.artefact.rows[2].cells = ['only', 'two'];
  const problems = validateSpec(spec);
  assert.ok(problems.some((p) => p.includes('row 3') && p.includes('3 columns')));
});

test('a sheet too short to read as real data is rejected', () => {
  const spec = sheetSpec();
  spec.artefact.rows = spec.artefact.rows.slice(0, 2);
  assert.ok(validateSpec(spec).some((p) => p.includes('at least 4 rows')));
});

test('cell markers colour the cell and are stripped from the text', () => {
  const html = buildArtefact(sheetSpec());
  assert.match(html, /<td class="bad">10h 31m<\/td>/);
  assert.match(html, /<td class="good">4m<\/td>/);
  assert.doesNotMatch(html, /[!~]10h/);
});

test('a leading plus is left alone, so phone numbers survive', () => {
  // An earlier marker was "+", which ate the plus on every UAE number and
  // tinted it green.
  const spec = sheetSpec();
  spec.artefact.rows[0].cells = ['+971 55 •• 9082', '!10h 31m', '!No response'];
  const html = buildArtefact(spec);
  assert.match(html, /<td>\+971 55 •• 9082<\/td>/);
});

test('spec text is escaped rather than injected', () => {
  const spec = sheetSpec();
  spec.artefact.rows[0].cells[0] = '<script>alert(1)</script>';
  const html = buildArtefact(spec);
  assert.doesNotMatch(html, /<script>alert/);
  assert.match(html, /&lt;script&gt;/);
});

test('marked rows carry the ring group the drawing code reads', () => {
  const html = buildArtefact(sheetSpec());
  assert.match(html, /data-ring="g1"/);
  assert.match(html, /data-ring="g2"/);
});

test('buildHtml refuses an invalid spec instead of rendering an empty card', () => {
  assert.throws(() => buildHtml(sheetSpec({ note: '' })), /invalid visual spec/);
});

test('the baked page carries its spec and the fonts', () => {
  const html = buildHtml(sheetSpec());
  assert.match(html, /monday's portal leads\./);
  assert.match(html, /@font-face\{font-family:'Caveat'/);
  assert.match(html, /data:font\/ttf;base64,/);
});

test('the published shell reads its spec from the hash and bakes none in', () => {
  const html = buildShell();
  assert.match(html, /location\.hash/);
  assert.doesNotMatch(html, /monday's portal leads\./);
});

test('every sample fits in a URL hash a workflow can build', () => {
  for (const spec of SAMPLES) {
    const b64 = Buffer.from(JSON.stringify(spec), 'utf8').toString('base64');
    assert.ok(b64.length < 6000, spec.artefact.type + ' spec is ' + b64.length + ' chars encoded');
  }
});
