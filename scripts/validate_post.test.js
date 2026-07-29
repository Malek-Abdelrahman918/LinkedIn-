'use strict';

const test = require('node:test');
const assert = require('node:assert');

const {
  validatePost,
  assemblePost,
  BANNED_PHRASES,
  LIMITS,
} = require('./validate_post.js');

/** A post that should pass every rule. Base for mutation in the tests below. */
function goodPost(overrides = {}) {
  return {
    pillar: 'Educational',
    hook: 'Your CRM is not a database. It is a graveyard.',
    problem:
      'Reps type the same lead into HubSpot, Apollo, and a spreadsheet. Three records, three truths, zero trust. Then someone builds a forecast on it.',
    solution:
      'LeadSync writes once and syncs everywhere. The rep types nothing. The record matches itself across every tool.',
    bullets: [
      'Pick one system as the source of truth. Not two.',
      'Map your fields before you sync anything. Field drift is what breaks pipelines.',
      'Sync on write, not on a nightly cron. Stale data is still wrong data.',
    ],
    cta: 'If your CRM is a graveyard, reply GRAVEYARD and I will send the audit sheet.',
    image_idea:
      'Split screen: a tidy CRM record on the left, four conflicting duplicates on the right.',
    ...overrides,
  };
}

test('a well-formed post passes', () => {
  const result = validatePost(goodPost());
  assert.deepStrictEqual(result.violations, []);
  assert.strictEqual(result.ok, true);
});

test('assembled text follows Hook -> Problem -> Solution -> bullets -> CTA', () => {
  const post = goodPost();
  const text = assemblePost(post);
  const order = [
    text.indexOf(post.hook),
    text.indexOf(post.problem),
    text.indexOf(post.solution),
    text.indexOf(post.bullets[0]),
    text.indexOf(post.cta),
  ];
  assert.ok(
    order.every((v, i) => v !== -1 && (i === 0 || v > order[i - 1])),
    `sections out of order: ${order}`,
  );
});

test('every banned phrase is caught', () => {
  for (const phrase of BANNED_PHRASES) {
    const result = validatePost(goodPost({ problem: `Look, ${phrase} things change.` }));
    assert.strictEqual(result.ok, false, `not caught: "${phrase}"`);
    assert.ok(
      result.violations.some((v) => v.includes(phrase)),
      `no violation naming "${phrase}": ${result.violations.join(' | ')}`,
    );
  }
});

test('banned phrases are caught regardless of casing', () => {
  const result = validatePost(goodPost({ hook: 'Delve Into your pipeline.' }));
  assert.ok(result.violations.some((v) => v.includes('delve into')));
});

test('fewer than three bullets fails', () => {
  const result = validatePost(goodPost({ bullets: ['one', 'two'] }));
  assert.strictEqual(result.ok, false);
  assert.ok(result.violations.some((v) => v.includes('at least 3')));
});

test('more than five bullets fails', () => {
  const result = validatePost(goodPost({ bullets: ['a', 'b', 'c', 'd', 'e', 'f'] }));
  assert.ok(result.violations.some((v) => v.includes('at most 5')));
});

test('bullets must be an array', () => {
  const result = validatePost(goodPost({ bullets: 'not an array' }));
  assert.ok(result.violations.some((v) => v.includes('must be an array')));
});

test('exceeding the LinkedIn character limit fails', () => {
  const result = validatePost(goodPost({ problem: 'x'.repeat(LIMITS.maxChars + 1) }));
  assert.ok(result.violations.some((v) => v.includes("LinkedIn's limit")));
});

test('more than three hashtags fails', () => {
  const result = validatePost(goodPost({ cta: 'Reply AUDIT #sales #crm #ai #automation' }));
  assert.ok(result.violations.some((v) => v.includes('hashtags')));
  // Exactly three is fine.
  assert.ok(validatePost(goodPost({ cta: 'Reply AUDIT #sales #crm #ai' })).ok);
});

test('em-dash fails', () => {
  const result = validatePost(goodPost({ hook: 'Cold calling is buns — and you know it.' }));
  assert.ok(result.violations.some((v) => v.includes('em-dash')));
});

test('emoji-led bullets fail', () => {
  const post = goodPost();
  post.bullets = ['🚀 Ship the sync', ...post.bullets.slice(1)];
  const result = validatePost(post);
  assert.ok(result.violations.some((v) => v.includes('Emoji-led bullet')));
});

test('too many emoji fail', () => {
  const result = validatePost(goodPost({ solution: 'LeadSync 🎯🎯🎯🎯🎯🎯 syncs it.' }));
  assert.ok(result.violations.some((v) => v.includes('emoji')));
});

test('double exclamation fails', () => {
  const result = validatePost(goodPost({ cta: 'Reply AUDIT!!' }));
  assert.ok(result.violations.some((v) => v.includes('!!')));
});

test('machine connectives at line start fail', () => {
  const result = validatePost(goodPost({ solution: 'Furthermore, LeadSync syncs it.' }));
  assert.ok(result.violations.some((v) => v.includes('furthermore')));
});

test('lazy CTAs fail', () => {
  for (const lazy of ['Thoughts?', 'Agree?', 'thoughts']) {
    const result = validatePost(goodPost({ cta: lazy }));
    assert.ok(result.violations.some((v) => v.includes('Lazy CTA')), `not caught: ${lazy}`);
  }
});

test('missing required fields are reported by name', () => {
  const post = goodPost();
  delete post.image_idea;
  post.hook = '   ';
  const result = validatePost(post);
  assert.ok(result.violations.some((v) => v.includes('"image_idea"')));
  assert.ok(result.violations.some((v) => v.includes('"hook"')));
});

test('an over-long hook fails', () => {
  const result = validatePost(goodPost({ hook: 'a'.repeat(LIMITS.maxHookChars + 1) }));
  assert.ok(result.violations.some((v) => v.includes('Hook is')));
});

test('non-object input is rejected without throwing', () => {
  for (const bad of [null, undefined, 'string', 42]) {
    const result = validatePost(bad);
    assert.strictEqual(result.ok, false);
  }
});

test('a slop post accumulates multiple violations', () => {
  const result = validatePost({
    pillar: 'Educational',
    hook: "In today's fast-paced world, sales teams must unlock their potential.",
    problem: 'It is no secret that data entry is a game-changer to eliminate.',
    solution: 'LeadSync will revolutionize how you delve into your pipeline — truly.',
    bullets: ['🚀 Automate'],
    cta: 'Thoughts?',
    image_idea: 'A rocket.',
  });
  assert.strictEqual(result.ok, false);
  assert.ok(result.violations.length >= 6, `only ${result.violations.length} violations`);
});
