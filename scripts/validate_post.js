'use strict';

/**
 * Anti-Slop validator for LeadSync LinkedIn posts.
 *
 * This file is the source of truth. It is mirrored verbatim into the
 * "Validate Anti-Slop" Code node in the n8n workflow — if you change the rules
 * here, mirror them there (see README "Keeping the validator in sync").
 *
 * Spec: docs/anti-slop-protocol.md
 */

/** Rule 1 — banned phrases. Matched case-insensitively as substrings. */
const BANNED_PHRASES = [
  "in today's fast-paced world",
  "in today's fast paced world",
  "in today's digital age",
  'in the ever-evolving landscape',
  'in the ever evolving landscape',
  'unlock your potential',
  'unlock the power',
  'harness the power of',
  'game-changer',
  'game changer',
  'game changing',
  'game-changing',
  'revolutionize',
  'revolutionise',
  'leverage synergies',
  'dive deep',
  "let's dive in",
  'delve into',
  "it's no secret that",
  'look no further',
  'at the end of the day',
  'moving the needle',
  'take it to the next level',
  'in conclusion',
  'the bottom line is',
  'buckle up',
  'plot twist',
  "here's the kicker",
  'let that sink in',
  "i'm excited to announce",
];

/** Sentence-opening connectives that read as machine-generated. */
const BANNED_OPENERS = ['furthermore', 'moreover', 'additionally', 'firstly', 'lastly'];

/** Lazy CTAs — checked against the CTA field only, as whole content. */
const LAZY_CTAS = ['thoughts?', 'agree?', 'thoughts', 'agree'];

const LIMITS = {
  maxChars: 3000, // LinkedIn hard limit
  maxHashtags: 3,
  maxEmoji: 5,
  minBullets: 3,
  maxBullets: 5,
  maxHookChars: 120,
};

const REQUIRED_FIELDS = [
  'pillar',
  'hook',
  'problem',
  'solution',
  'bullets',
  'cta',
  'image_idea',
];

const EMOJI_RE = /\p{Extended_Pictographic}/gu;
/** Non-global twin, for stateless `.test()` calls. */
const EMOJI_LEAD_RE = /^\s*\p{Extended_Pictographic}/u;

/**
 * Assemble the final post text from its structured parts.
 * Hook -> Problem -> Solution -> bullets -> CTA.
 * @param {object} post
 * @returns {string}
 */
function assemblePost(post) {
  const bullets = Array.isArray(post.bullets) ? post.bullets : [];
  return [
    post.hook,
    '',
    post.problem,
    '',
    post.solution,
    '',
    ...bullets.map((b) => `- ${String(b).replace(/^[-•*]\s*/, '')}`),
    '',
    post.cta,
  ]
    .filter((line) => line !== undefined && line !== null)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function countMatches(text, re) {
  const m = text.match(re);
  return m ? m.length : 0;
}

/**
 * Validate a generated post against the Anti-Slop protocol.
 * @param {object} post structured post object
 * @returns {{ok: boolean, violations: string[], text: string}}
 */
function validatePost(post) {
  const violations = [];

  if (!post || typeof post !== 'object') {
    return { ok: false, violations: ['Post is not an object.'], text: '' };
  }

  // --- Structure: required fields -----------------------------------------
  for (const field of REQUIRED_FIELDS) {
    const value = post[field];
    const empty =
      value === undefined ||
      value === null ||
      (typeof value === 'string' && value.trim() === '') ||
      (Array.isArray(value) && value.length === 0);
    if (empty) violations.push(`Missing or empty required field: "${field}".`);
  }

  const bullets = Array.isArray(post.bullets) ? post.bullets : [];
  if (!Array.isArray(post.bullets)) {
    violations.push('Field "bullets" must be an array.');
  } else if (bullets.length < LIMITS.minBullets) {
    violations.push(
      `Only ${bullets.length} bullet(s); at least ${LIMITS.minBullets} how-to bullets are required.`,
    );
  } else if (bullets.length > LIMITS.maxBullets) {
    violations.push(
      `${bullets.length} bullets; at most ${LIMITS.maxBullets} are allowed.`,
    );
  }

  const hook = typeof post.hook === 'string' ? post.hook.trim() : '';
  if (hook.length > LIMITS.maxHookChars) {
    violations.push(
      `Hook is ${hook.length} chars; must be <= ${LIMITS.maxHookChars}. A hook that needs a paragraph is not a hook.`,
    );
  }

  const text = assemblePost(post);
  const lower = text.toLowerCase();

  // --- Rule 1: banned phrases ---------------------------------------------
  for (const phrase of BANNED_PHRASES) {
    if (lower.includes(phrase)) {
      violations.push(`Banned phrase: "${phrase}".`);
    }
  }

  // --- Rule 3: format tells -----------------------------------------------
  if (text.length > LIMITS.maxChars) {
    violations.push(
      `Post is ${text.length} chars; LinkedIn's limit is ${LIMITS.maxChars}.`,
    );
  }

  const hashtags = countMatches(text, /(^|\s)#[\w-]+/g);
  if (hashtags > LIMITS.maxHashtags) {
    violations.push(`${hashtags} hashtags; at most ${LIMITS.maxHashtags} allowed.`);
  }

  if (text.includes('—')) {
    violations.push('Contains an em-dash (—). Use a period or a comma.');
  }

  const emoji = countMatches(text, EMOJI_RE);
  if (emoji > LIMITS.maxEmoji) {
    violations.push(`${emoji} emoji; at most ${LIMITS.maxEmoji} allowed.`);
  }

  for (const bullet of bullets) {
    const b = String(bullet).replace(/^[-•*]\s*/, '').trim();
    if (EMOJI_LEAD_RE.test(b)) {
      violations.push(`Emoji-led bullet: "${b.slice(0, 40)}". No listicle padding.`);
    }
  }

  if (/!!/.test(text)) {
    violations.push('Contains "!!". One exclamation mark is a choice; two is a robot.');
  }

  for (const line of text.split('\n')) {
    const first = line.trim().split(/[\s,]/)[0].toLowerCase().replace(/[^a-z]/g, '');
    if (first && BANNED_OPENERS.includes(first)) {
      violations.push(`Sentence opens with "${first}". Cut the connective.`);
    }
  }

  // --- Rule 5: low-friction CTA -------------------------------------------
  const cta = typeof post.cta === 'string' ? post.cta.trim().toLowerCase() : '';
  if (cta && LAZY_CTAS.includes(cta.replace(/[.!]/g, ''))) {
    violations.push(`Lazy CTA: "${post.cta.trim()}". Ask for something specific.`);
  }

  return { ok: violations.length === 0, violations, text };
}


/* ---------------------------------------------------------------------------
 * The visual
 * ------------------------------------------------------------------------ */

const ARTEFACT_TYPES = ['sheet', 'chat', 'calendar', 'listing'];

/**
 * Checks the `visual` object that drives the image.
 *
 * The model returns the artefact as a JSON string, because the four artefact
 * shapes are a union and the structured-output parser can only hold one shape.
 * Returns { ok, violations, visual } with `visual.artefact` parsed, so the rest
 * of the workflow never has to think about the string form.
 */
function validateVisual(raw) {
  const violations = [];
  if (!raw || typeof raw !== 'object') {
    return { ok: false, violations: ['visual is missing entirely.'], visual: null };
  }

  for (const field of ['headline', 'note', 'footer']) {
    if (typeof raw[field] !== 'string' || !raw[field].trim()) {
      violations.push(`visual.${field} is missing.`);
    }
  }
  if (typeof raw.headline === 'string' && raw.headline.length > 60) {
    violations.push(`visual.headline is ${raw.headline.length} characters; keep it under 60.`);
  }
  for (const line of String(raw.note || '').split('\n')) {
    if (line.length > 52) {
      violations.push(`Note line is ${line.length} characters; keep each under 52 so it fits the card.`);
    }
  }

  let artefact = null;
  try {
    artefact = typeof raw.artefact_json === 'string' ? JSON.parse(raw.artefact_json) : raw.artefact;
  } catch (err) {
    violations.push(`visual.artefact_json is not valid JSON: ${err.message}`);
  }

  if (!artefact || typeof artefact !== 'object') {
    violations.push('visual.artefact is missing.');
    return { ok: false, violations, visual: null };
  }
  if (!ARTEFACT_TYPES.includes(artefact.type)) {
    violations.push(`visual.artefact.type "${artefact.type}" is not one of ${ARTEFACT_TYPES.join(', ')}.`);
    return { ok: false, violations, visual: null };
  }

  // The pen is the design. An unmarked artefact renders as a plain screenshot.
  let marks = 0;
  if (artefact.type === 'sheet') {
    const cols = (artefact.columns || []).length;
    if (cols < 3) violations.push('A sheet needs at least 3 columns.');
    const rows = artefact.rows || [];
    if (rows.length < 4) violations.push('A sheet needs at least 4 rows to read as real data.');
    rows.forEach((r, i) => {
      if (r && r.mark) marks++;
      const n = (r && r.cells ? r.cells : []).length;
      if (n !== cols) violations.push(`Sheet row ${i + 1} has ${n} cells but there are ${cols} columns.`);
    });
  } else if (artefact.type === 'chat') {
    const msgs = artefact.messages || [];
    if (msgs.length < 3) violations.push('A chat needs at least 3 messages.');
    msgs.forEach((m) => { if (m && m.mark) marks++; });
  } else if (artefact.type === 'calendar') {
    const slots = artefact.slots || [];
    if (slots.length < 5) violations.push('A calendar needs at least 5 slots.');
    slots.forEach((s) => { if (s && s.mark) marks++; });
  } else if (artefact.type === 'listing') {
    if (!artefact.price) violations.push('A listing needs a price.');
    if (!artefact.address) violations.push('A listing needs an address.');
    if (artefact.photoMark) marks++;
    if (artefact.priceMark) marks++;
    (artefact.badges || []).forEach((b) => { if (b && b.mark) marks++; });
  }
  if (marks === 0) violations.push('Nothing in the artefact is marked, so the pen has nothing to circle.');

  const visual = {
    headline: String(raw.headline || ''),
    note: String(raw.note || ''),
    footer: String(raw.footer || ''),
    artefact,
  };
  return { ok: violations.length === 0, violations, visual };
}

module.exports = {
  validatePost,
  validateVisual,
  ARTEFACT_TYPES,
  assemblePost,
  BANNED_PHRASES,
  BANNED_OPENERS,
  LAZY_CTAS,
  LIMITS,
  REQUIRED_FIELDS,
};
