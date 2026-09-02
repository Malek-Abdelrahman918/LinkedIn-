/**
 * LeadSync Perpetual LinkedIn Content Engine
 * n8n Workflow SDK source. This is what built the live workflow.
 *
 * Live workflow: ELZxVjqbYCWDDiGM
 * https://malekabdelrahman22.app.n8n.cloud/workflow/ELZxVjqbYCWDDiGM
 *
 * This file is the version-controlled source of truth for the pipeline shape.
 * The prompt and validator content is mirrored from prompts/ and scripts/ —
 * see README "Keeping the validator in sync" before editing either copy.
 *
 * Credential IDs below are references to credentials that already exist in the
 * n8n instance. No secrets live in this repo.
 */

import { workflow, node, trigger, sticky, merge, ifElse, languageModel, outputParser, expr, newCredential } from '@n8n/workflow-sdk';

const SYSTEM_PROMPT = `You write LinkedIn posts as Malek, founder of LeadSync, an AI automation studio. LeadSync sells a service, not a product. A client brings a process that eats their week, and LeadSync builds the automation that runs it.
The work spans nine service lines: lead handling, sales workflows, customer support bots, internal operations, document processing, data pipelines, reporting dashboards, e-commerce automation, content workflows. The clients are agencies, SaaS companies, e-commerce brands and real estate brokerages, mostly in the Gulf. Each post picks one service line and one kind of business and stays there. Do not write as if LeadSync only does real estate, or only does CRM work. Across a month the posts should visibly cover different services.
You are not a brand account. You are a founder typing between calls. Every post exists so that one person with that exact problem sends a reply.

VOICE. Write like this: "Cold calling is buns." / "Your leads go cold overnight." / "I wasted 10 hours re-typing leads so you do not have to."
Not like this: "In todays fast-paced business environment, organizations must leverage cutting-edge solutions."
1. Numbers, not adjectives. "10 hours a week" beats "significant time savings".
2. Name real things: the CRM, the shared inbox, the approval queue, WhatsApp, Sheets, Airtable, HubSpot, Shopify, Stripe, Slack, Zapier, n8n, the nightly export. For property posts: Property Finder, Bayut, Dubizzle, Ejari, viewings, title deeds.
3. Short sentences. Fragments are fine. Rhythm beats grammar.
4. Concede something. A post that only sells reads like an ad.
5. First person, past tense, specific. "I broke our lead routing doing this" beats "one might encounter issues".
6. Open in the middle of the thought. No throat-clearing.

HONESTY. There are two kinds of claim and they have different rules.
A claim about how this work usually goes needs no label. "Enquiries that land after 10pm get answered the next morning" is an observation about the world. State it plainly.
A claim about LeadSync, what it built, what it fixed, what it would do for a client, is different. If it did not actually happen, label it as an example inside the post text. Open that line with "Example, not a client:" or "Made up numbers, real mechanic:". Never present an invented build, saving or result as work LeadSync delivered.
Never invent a named customer, a testimonial, a client logo, or a statistic attributed to a real company. No exceptions.

HARD BANS. The post is auto-rejected if it contains any of these, or a near-miss of them:
in todays fast-paced world / in todays digital age / in the ever-evolving landscape / unlock your potential / unlock the power / harness the power of / game-changer / game changing / revolutionize / leverage synergies / dive deep / lets dive in / delve into / it is no secret that / look no further / at the end of the day / moving the needle / take it to the next level / in conclusion / the bottom line is / buckle up / plot twist / heres the kicker / let that sink in / im excited to announce
Also auto-rejected: em-dashes (use a period or a comma), more than 3 hashtags, more than 5 emoji, any bullet starting with an emoji, a doubled exclamation mark, any line starting with Furthermore/Moreover/Additionally/Firstly/Lastly, a CTA that is just "Thoughts?" or "Agree?", more than 3000 characters.

THE 4 PILLARS. You are assigned exactly one. Write to it.
Educational (Aha! moments): teach one specific mechanic. The aha is something the reader believed that turns out to be backwards.
Social Proof (Receipts): evidence the mechanic works. Exactly two legal ways to write this. Either a true result from something Malek actually built, which includes his own internal tooling and the workflows he has shipped. Or a worked example carrying the label from the HONESTY rule. Pick one and make which one obvious.
Thought Leadership: argue a position on how this work should be done. Cold outreach, manual re-keying, hiring a person to do a workflows job, nightly syncs that make people trust stale data. Take a side. Name the counterargument and answer it.
Personal (Founder Behind the Bot): a mistake, a 2am debugging session, why he started this. No tidy moral at the end.

STRUCTURE. Hook, then Problem, then Solution, then 3 bullet how-tos, then CTA.
Hook: one line that stops a scroll. A claim, a number, or a confession. Not a question. Max 120 characters.
Problem: make them feel a specific pain. A concrete scenario, not a category.
Solution: the mechanism LeadSync would build. Not a promise, and not a named product. LeadSync sells the build.
Bullets: actionable how-tos, useful even to someone who never hires LeadSync. Exactly 3 unless a 4th earns its place. No leading dash or emoji inside the bullet strings.
CTA: low friction and lead-shaped. The best CTA gets the reader to describe their own version of the problem, because that reply is the lead. A reply keyword, or a question answerable from their own experience in five seconds. Never "book a call".

THE VISUAL. Every post ships with a visual object. It is rendered into the image: a realistic artefact on warm paper, marked up in red pen. It is not a description of a picture, it is the data in the picture. Invent plausible, specific detail: real-looking names, times, amounts, tool names. Match the detail to the business the post is about. An e-commerce post shows order refs and Shopify, not AED apartment prices.

visual.headline. The handwritten line above the artefact. Lowercase, under 46 characters. It names what we are looking at, not what to conclude. "monday's inbound enquiries." not "why speed to lead matters".
visual.note. The verdict, in red pen. Two short lines separated by a newline, under 40 characters each. This is the only place the point gets stated.
visual.footer. One quiet typed line under the card. The thought the reader leaves with.
visual.artefact_json. A JSON string. Pick the artefact that shows the problem. Do not default to the spreadsheet.

  sheet, for any log or comparison, in any industry. Response times, order exceptions, invoices awaiting approval, duplicate records, one item across three systems.
  {"type":"sheet","columns":["Enquiry","Source","Came in","We replied","Gap","Outcome"],"rows":[{"cells":["A. Haddad","Website form","22:41","09:12","!10h 31m","!No response"]},{"cells":["M. Sultan","WhatsApp","08:52","08:56","~4m","~Call booked"],"mark":"g1"}]}
  Six to nine rows, four to six columns, every row exactly as long as columns. Prefix a cell with ! to print it red, ~ to print it green. Keep cells short.

  chat, for anything about enquiries, response time, support or WhatsApp.
  {"type":"chat","title":"Website enquiry","subtitle":"+971 55 9082","messages":[{"dir":"in","text":"Hi, is this still available?","time":"22:41","mark":"g1"},{"sep":"next morning"},{"dir":"out","text":"Yes! when suits you?","time":"09:18","mark":"g2"}],"tail":"no reply"}
  dir is "in" for the customer, "out" for us. Four to six messages.

  calendar, for anything about where a working day goes. Works for an agent, an ops manager, a support lead, a founder.
  {"type":"calendar","slots":[{"time":"08:00","label":"Reply to overnight enquiries","tone":"admin","mark":"g1"},{"time":"10:00","label":"Customer call","tone":"sell"}]}
  Six to nine slots. tone is "admin" for work that should be automated, "sell" for the work worth doing, "neutral" otherwise. Give adjacent admin slots the same mark so the pen brackets them as one block.

  listing, for property posts only. Listings, pricing, portal hygiene.
  {"type":"listing","price":"AED 1,690,000","address":"2 BR Apartment, Jumeirah Village Circle","meta":["1,204 sqft","Balcony","Unfurnished"],"photoCount":"11 photos","photoMark":"g2","badges":[{"text":"Listed 94 days ago","tone":"warn","mark":"g1"},{"text":"Ref DXB-4417"}],"description":"Bright two bedroom in a quiet tower.","agent":"Reem, listed by agency","buttons":["Call","Email","WhatsApp"]}

VISUAL RULES.
1. Mark something. An unmarked artefact is just a screenshot. Use the same mark id for things the pen should circle as one group.
2. Every number in the note must be countable off the artefact. A note saying "six hours of admin" needs exactly six admin slots. This is checked.
3. The note must not claim anything the artefact does not show. If the card shows one listing, it cannot say "cheapest of the three".
4. The artefact and the post are the same story. The hook and the note point at the same fact.
5. The artefact is invented data. It illustrates the problem, so it needs no label. But if the post claims LeadSync produced the after state, that claim is a company claim and the HONESTY rule applies to the post text.`;

const POST_SCHEMA_EXAMPLE = `{
  "pillar": "Educational",
  "hook": "Your CRM is not a database. It is a graveyard.",
  "problem": "Reps type the same lead into HubSpot, Apollo, and a spreadsheet. Three records, three truths, zero trust.",
  "solution": "LeadSync writes once and syncs everywhere. The rep types nothing.",
  "bullets": ["Pick one system as the source of truth.", "Map your fields before you sync anything.", "Sync on write, not on a nightly cron."],
  "cta": "If your CRM is a graveyard, reply GRAVEYARD and I will send the audit sheet.",
  "image_idea": "Split screen: a tidy CRM record on the left, four conflicting duplicates on the right."
}`;

/**
 * Mirror of scripts/validate_post.js, inlined into both Code nodes.
 * Kept in sync by hand; scripts/validate_post.test.js is the regression suite.
 */
const VALIDATOR_SRC = `
const BANNED_PHRASES = [
  "in today's fast-paced world", "in today's fast paced world", "in today's digital age",
  "in the ever-evolving landscape", "in the ever evolving landscape",
  "unlock your potential", "unlock the power", "harness the power of",
  "game-changer", "game changer", "game changing", "game-changing",
  "revolutionize", "revolutionise", "leverage synergies",
  "dive deep", "let's dive in", "delve into", "it's no secret that",
  "look no further", "at the end of the day", "moving the needle",
  "take it to the next level", "in conclusion", "the bottom line is",
  "buckle up", "plot twist", "here's the kicker", "let that sink in",
  "i'm excited to announce"
];
const BANNED_OPENERS = ['furthermore', 'moreover', 'additionally', 'firstly', 'lastly'];
const LAZY_CTAS = ['thoughts?', 'agree?', 'thoughts', 'agree'];
const LIMITS = { maxChars: 3000, maxHashtags: 3, maxEmoji: 5, minBullets: 3, maxBullets: 5, maxHookChars: 120 };
const REQUIRED_FIELDS = ['pillar', 'hook', 'problem', 'solution', 'bullets', 'cta', 'image_idea'];
const EMOJI_RE = /\\p{Extended_Pictographic}/gu;
const EMOJI_LEAD_RE = /^\\s*\\p{Extended_Pictographic}/u;

function assemblePost(post) {
  const bullets = Array.isArray(post.bullets) ? post.bullets : [];
  const parts = [post.hook, '', post.problem, '', post.solution, ''];
  for (const b of bullets) parts.push('- ' + String(b).replace(/^[-\\u2022*]\\s*/, ''));
  parts.push('');
  parts.push(post.cta);
  return parts.filter(function (l) { return l !== undefined && l !== null; })
    .join('\\n').replace(/\\n{3,}/g, '\\n\\n').trim();
}

function countMatches(text, re) { const m = text.match(re); return m ? m.length : 0; }

function validatePost(post) {
  const violations = [];
  if (!post || typeof post !== 'object') return { ok: false, violations: ['Post is not an object.'], text: '' };
  for (const field of REQUIRED_FIELDS) {
    const v = post[field];
    const empty = v === undefined || v === null || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0);
    if (empty) violations.push('Missing or empty required field: "' + field + '".');
  }
  const bullets = Array.isArray(post.bullets) ? post.bullets : [];
  if (!Array.isArray(post.bullets)) violations.push('Field "bullets" must be an array.');
  else if (bullets.length < LIMITS.minBullets) violations.push('Only ' + bullets.length + ' bullet(s); at least ' + LIMITS.minBullets + ' how-to bullets are required.');
  else if (bullets.length > LIMITS.maxBullets) violations.push(bullets.length + ' bullets; at most ' + LIMITS.maxBullets + ' are allowed.');
  const hook = typeof post.hook === 'string' ? post.hook.trim() : '';
  if (hook.length > LIMITS.maxHookChars) violations.push('Hook is ' + hook.length + ' chars; must be <= ' + LIMITS.maxHookChars + '.');
  const text = assemblePost(post);
  const lower = text.toLowerCase();
  for (const phrase of BANNED_PHRASES) if (lower.indexOf(phrase) !== -1) violations.push('Banned phrase: "' + phrase + '".');
  if (text.length > LIMITS.maxChars) violations.push('Post is ' + text.length + ' chars; the LinkedIn limit is ' + LIMITS.maxChars + '.');
  const hashtags = countMatches(text, /(^|\\s)#[\\w-]+/g);
  if (hashtags > LIMITS.maxHashtags) violations.push(hashtags + ' hashtags; at most ' + LIMITS.maxHashtags + ' allowed.');
  if (text.indexOf('\\u2014') !== -1) violations.push('Contains an em-dash. Use a period or a comma.');
  const emoji = countMatches(text, EMOJI_RE);
  if (emoji > LIMITS.maxEmoji) violations.push(emoji + ' emoji; at most ' + LIMITS.maxEmoji + ' allowed.');
  for (const b of bullets) {
    const s = String(b).replace(/^[-\\u2022*]\\s*/, '').trim();
    if (EMOJI_LEAD_RE.test(s)) violations.push('Emoji-led bullet: "' + s.slice(0, 40) + '". No listicle padding.');
  }
  if (/!!/.test(text)) violations.push('Contains a doubled exclamation mark. One is a choice; two is a robot.');
  for (const line of text.split('\\n')) {
    const first = line.trim().split(/[\\s,]/)[0].toLowerCase().replace(/[^a-z]/g, '');
    if (first && BANNED_OPENERS.indexOf(first) !== -1) violations.push('Line opens with "' + first + '". Cut the connective.');
  }
  const cta = typeof post.cta === 'string' ? post.cta.trim().toLowerCase() : '';
  if (cta && LAZY_CTAS.indexOf(cta.replace(/[.!]/g, '')) !== -1) violations.push('Lazy CTA: "' + String(post.cta).trim() + '". Ask for something specific.');
  return { ok: violations.length === 0, violations: violations, text: text };
}
`;


/**
 * Renders the weekly review email: one HTML card per draft plus a Markdown twin
 * that gets attached as a .md file.
 */
const DIGEST_SRC = `// Read from Format Rows, NOT $json. Save to Google Sheet maps with \`defineBelow\`
// and an 8-column schema, so it strips every other field from its output.
const rows = $('Format Rows').all().map(function (i) { return i.json; });
const cfg = $('Set Config').first().json;
const weekOf = $now.minus({ days: $now.weekday - 1 }).toFormat('yyyy-MM-dd');

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const STATUS_STYLE = {
  DRAFT: 'background:#e8eaed;color:#3c4043',
  VERIFY_NUMBERS: 'background:#fef7e0;color:#7a5900',
  NEEDS_REWRITE: 'background:#fce8e6;color:#a50e0e'
};
const STATUS_NOTE = {
  VERIFY_NUMBERS: 'The model invented these figures. Verify or replace every number before posting.',
  NEEDS_REWRITE: 'Failed the anti-slop validator twice. Saved so you can judge it yourself.'
};

const cards = rows.map(function (r) {
  const badge = STATUS_STYLE[r.Status] || STATUS_STYLE.DRAFT;
  const note = STATUS_NOTE[r.Status];
  let card = '<div style="border:1px solid #dadce0;border-radius:10px;padding:20px;margin:0 0 20px">';
  card += '<div style="font-size:12px;color:#5f6368;margin-bottom:10px">';
  card += '<strong>' + esc(r.Pillar) + '</strong> &nbsp;|&nbsp; ' + esc(r['Post Date']);
  card += ' &nbsp; <span style="' + badge + ';padding:2px 8px;border-radius:10px;font-size:11px">' + esc(r.Status) + '</span>';
  card += '</div>';
  card += '<div style="font-size:17px;font-weight:600;line-height:1.4;margin-bottom:12px">' + esc(r.Hook) + '</div>';
  if (note) card += '<div style="' + badge + ';padding:8px 12px;border-radius:6px;font-size:13px;margin-bottom:12px">' + esc(note) + '</div>';
  card += '<div style="white-space:pre-wrap;font-size:14px;line-height:1.6;color:#202124;border-left:3px solid #e8eaed;padding-left:14px">' + esc(r['The Text']) + '</div>';
  card += '<div style="margin-top:14px;font-size:13px;color:#5f6368"><strong>Image idea:</strong> ' + esc(r['Image Idea']) + '</div>';
  if (r['Source URL'] && r['Source URL'] !== 'evergreen') {
    card += '<div style="margin-top:6px;font-size:12px"><a href="' + esc(r['Source URL']) + '">Source article</a></div>';
  }
  card += '</div>';
  return card;
});

const flagged = rows.filter(function (r) { return r.Status === 'NEEDS_REWRITE'; }).length;
const unverified = rows.filter(function (r) { return r.Status === 'VERIFY_NUMBERS'; }).length;

let links = '';
if (cfg.sheetUrl) links += '<a href="' + cfg.sheetUrl + '">Open the sheet</a>';
if (cfg.notionUrl) links += (links ? ' &nbsp;|&nbsp; ' : '') + '<a href="' + cfg.notionUrl + '">Open in Notion</a>';

let html = '<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;max-width:680px;margin:0 auto;padding:8px">';
html += '<h2 style="margin:0 0 4px">' + rows.length + ' LinkedIn drafts ready</h2>';
html += '<div style="color:#5f6368;font-size:13px;margin-bottom:20px">Week of ' + weekOf + '</div>';
if (unverified || flagged) {
  html += '<div style="background:#fef7e0;border-radius:8px;padding:12px 16px;font-size:13px;margin-bottom:20px">';
  if (unverified) html += unverified + ' draft(s) contain model-generated metrics. Check every number.<br>';
  if (flagged) html += flagged + ' draft(s) failed the anti-slop check twice.';
  html += '</div>';
}
html += cards.join('');
if (links) html += '<div style="font-size:13px;margin-top:8px">' + links + '</div>';
html += '<div style="color:#9aa0a6;font-size:11px;margin-top:24px">The full week is also attached as Markdown.</div>';
html += '</div>';

// Markdown twin, attached as a file.
let md = '# LinkedIn drafts, week of ' + weekOf + '\\n\\n';
rows.forEach(function (r, i) {
  md += '## ' + (i + 1) + '. ' + r.Pillar + ' | ' + r['Post Date'] + ' | ' + r.Status + '\\n\\n';
  if (STATUS_NOTE[r.Status]) md += '> ' + STATUS_NOTE[r.Status] + '\\n\\n';
  md += r['The Text'] + '\\n\\n';
  md += '**Image idea:** ' + r['Image Idea'] + '\\n\\n';
  md += '**Source:** ' + (r['Source URL'] || 'evergreen') + '\\n\\n---\\n\\n';
});

return [{
  json: {
    subject: rows.length + ' LinkedIn drafts ready for review (week of ' + weekOf + ')',
    html: html,
    fileName: 'leadsync-linkedin-' + weekOf + '.md',
    fileB64: Buffer.from(md, 'utf8').toString('base64')
  }
}];`;

const scheduleTrigger = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.3,
  config: {
    name: 'Every Monday 9AM',
    parameters: {
      rule: {
        interval: [{ field: 'weeks', weeksInterval: 1, triggerAtDay: [1], triggerAtHour: 9, triggerAtMinute: 0 }]
      }
    }
  }
});

const setConfig = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Set Config',
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: {
        assignments: [
          { id: 'sheet-tab', name: 'sheetTab', value: 'Posts', type: 'string' },
          { id: 'slack-channel', name: 'slackChannel', value: '#linkedin-drafts', type: 'string' },
          { id: 'posts-per-week', name: 'postsPerWeek', value: 3, type: 'number' },
          { id: 'history-rows', name: 'historyRows', value: 40, type: 'number' },
          { id: 'sheet-url', name: 'sheetUrl', value: '', type: 'string' },
          { id: 'notion-url', name: 'notionUrl', value: '', type: 'string' },
          { id: 'pillars', name: 'pillars', value: expr('{{ ["Educational", "Social Proof", "Thought Leadership", "Personal"] }}'), type: 'array' },
          { id: 'feed-queries', name: 'feedQueries', value: expr('{{ ["lead response time sales", "sales workflow automation", "AI customer support automation", "back office process automation", "invoice document processing automation", "data pipeline automation business", "automated reporting dashboards", "ecommerce operations automation", "real estate lead automation"] }}'), type: 'array' }
        ]
      }
    }
  }
});

const buildQueries = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Build Source Queries',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const cfg = $('Set Config').first().json;
const queries = Array.isArray(cfg.feedQueries) ? cfg.feedQueries : [];

// Google News RSS search endpoints. No API key, no quota.
return queries.map(function (q) {
  return {
    json: {
      query: q,
      feedUrl: 'https://news.google.com/rss/search?q=' + encodeURIComponent(q) + '&hl=en-US&gl=US&ceid=US:en'
    }
  };
});`
    }
  }
});

const readFeeds = node({
  type: 'n8n-nodes-base.rssFeedRead',
  version: 1.2,
  config: {
    name: 'Read RSS Feeds',
    // One dead feed must not take down the week.
    onError: 'continueRegularOutput',
    parameters: { url: expr('{{ $json.feedUrl }}'), options: {} }
  }
});

const readHistory = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'Read Post History',
    executeOnce: true,
    // A brand-new (empty) sheet must not stop the run; Select 3 Angles handles 0 rows.
    alwaysOutputData: true,
    onError: 'continueRegularOutput',
    parameters: {
      resource: 'sheet',
      operation: 'read',
      documentId: { __rl: true, mode: 'list', value: '', cachedResultName: 'LeadSync LinkedIn Posts' },
      sheetName: { __rl: true, mode: 'name', value: 'Posts' },
      options: { returnAllMatches: 'returnAllMatches' }
    },
    credentials: { googleSheetsOAuth2Api: { id: 'Gx2cwVWtYe844eDB', name: 'Google Sheets OAuth2 API' } }
  }
});

const selectAngles = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Select 3 Angles',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const cfg = $('Set Config').first().json;
const pillars = Array.isArray(cfg.pillars) ? cfg.pillars : ['Educational', 'Social Proof', 'Thought Leadership', 'Personal'];
const wanted = Number(cfg.postsPerWeek) || 3;
const historyRows = Number(cfg.historyRows) || 40;

// --- history: empty on a brand-new sheet, or a synthetic {} item -------------
let history = [];
try {
  history = $input.all().map(function (i) { return i.json; }).filter(function (r) { return r && r['The Text']; });
} catch (e) { history = []; }
const recent = history.slice(-historyRows);
const usedLinks = {};
const recentHooks = [];
for (const row of recent) {
  if (row['Source URL']) usedLinks[String(row['Source URL'])] = true;
  if (row['Hook']) recentHooks.push('- [' + (row['Pillar'] || '?') + '] ' + row['Hook']);
}

// --- feed items -------------------------------------------------------------
let raw = [];
try { raw = $('Read RSS Feeds').all().map(function (i) { return i.json; }); } catch (e) { raw = []; }

const PAIN_WORDS = ['manual', 'data entry', 'cold call', 'sync', 'crm', 'pipeline', 'outbound',
  'quota', 'admin', 'spreadsheet', 'automation', 'ai agent', 'lead', 'sales rep', 'follow-up',
  'hubspot', 'salesforce', 'prospecting', 'workflow'];

function score(item) {
  const hay = ((item.title || '') + ' ' + (item.contentSnippet || item.content || '')).toLowerCase();
  let s = 0;
  for (const w of PAIN_WORDS) if (hay.indexOf(w) !== -1) s += 1;
  return s;
}

const seen = {};
const candidates = [];
for (const item of raw) {
  if (!item || !item.title || !item.link) continue;
  if (usedLinks[String(item.link)]) continue;
  const key = String(item.title).toLowerCase().replace(/[^a-z0-9 ]/g, '').slice(0, 60);
  if (seen[key]) continue;
  seen[key] = true;
  candidates.push({
    title: String(item.title),
    summary: String(item.contentSnippet || item.content || '').replace(/<[^>]*>/g, '').slice(0, 600),
    link: String(item.link),
    score: score(item)
  });
}
candidates.sort(function (a, b) { return b.score - a.score; });

// --- evergreen fallback: the engine never produces a zero-post week ----------
const EVERGREEN = [
  'Reps spend more time updating the CRM than talking to buyers.',
  'The same lead exists three times across HubSpot, Apollo, and a spreadsheet.',
  'Cold call connect rates keep falling and the response is to dial more.',
  'Nightly syncs make people trust stale data more than no data.',
  'Handoff between SDR and AE loses context every single time.',
  'Enrichment tools disagree with each other and nobody reconciles them.',
  'Follow-up dies because it depends on somebody remembering.',
  'Forecasts are built on fields reps fill in to make the pipeline look busy.',
  'Every new tool adds another place the truth can diverge.',
  'The automation someone built two years ago is still running and nobody knows what it does.'
];

const chosen = candidates.slice(0, wanted);
let e = 0;
while (chosen.length < wanted) {
  chosen.push({
    title: EVERGREEN[(new Date().getDate() + e) % EVERGREEN.length],
    summary: 'Evergreen LeadSync pain point. No source article this week.',
    link: '',
    score: 0
  });
  e += 1;
}

// --- ISO week to deterministic pillar rotation ------------------------------
const now = $now;
const isoWeek = Number(now.weekNumber);
const monday = now.minus({ days: now.weekday - 1 });

return chosen.map(function (angle, i) {
  return {
    json: {
      pillar: pillars[(isoWeek * wanted + i) % pillars.length],
      title: angle.title,
      summary: angle.summary,
      link: angle.link,
      isEvergreen: angle.link === '',
      postDate: monday.plus({ days: i * 2 }).toFormat('yyyy-MM-dd'),
      weekOf: monday.toFormat('yyyy-MM-dd'),
      recentHooks: recentHooks.length ? recentHooks.join('\\n') : '(nothing posted yet)'
    }
  };
});`
    }
  }
});

const openAiModel = languageModel({
  type: '@n8n/n8n-nodes-langchain.lmChatOpenAi',
  version: 1.3,
  config: {
    name: 'OpenAI GPT-5.4',
    parameters: {
      model: { __rl: true, mode: 'list', value: 'gpt-5.4', cachedResultName: 'gpt-5.4' },
      options: { temperature: 0.9, timeout: 120000, maxRetries: 2 }
    },
    credentials: { openAiApi: { id: '1TxOUW6ClNLeisNe', name: 'OpenAI account 2' } }
  }
});

const postParser = outputParser({
  type: '@n8n/n8n-nodes-langchain.outputParserStructured',
  version: 1.3,
  config: {
    name: 'Post Schema',
    parameters: { schemaType: 'fromJson', jsonSchemaExample: POST_SCHEMA_EXAMPLE }
  }
});

const writePost = node({
  type: '@n8n/n8n-nodes-langchain.chainLlm',
  version: 1.9,
  config: {
    name: 'Write Post',
    parameters: {
      promptType: 'define',
      hasOutputParser: true,
      text: expr(`Write this week's LinkedIn post.

PILLAR (write to this one, copy it into the "pillar" field exactly):
{{ $json.pillar }}

ANGLE - the trend or pain point this post is about:
Headline: {{ $json.title }}
Summary: {{ $json.summary }}
Source: {{ $json.link }}

Treat the source as raw material, not as the subject. Do not summarise the article and do not write "I read an article about...". Use it as evidence for a point Malek is making about manual sales work.
If the angle is thin or off-topic, ignore it and write to the pillar using the pain point in the headline as a jumping-off point. A good post about a weak source beats a faithful post about a strong one.

ALREADY POSTED - do not repeat these hooks, claims, or framings:
{{ $json.recentHooks }}`),
      messages: {
        messageValues: [{ type: 'SystemMessagePromptTemplate', message: SYSTEM_PROMPT }]
      },
      batching: { batchSize: 1, delayBetweenBatches: 1000 }
    },
    subnodes: { model: openAiModel, outputParser: postParser }
  }
});

const validateDraft = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Validate Anti-Slop',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: VALIDATOR_SRC + `
const angles = $('Select 3 Angles').all();

return $input.all().map(function (item, i) {
  const post = item.json.output || item.json;
  const result = validatePost(post);
  const angle = (angles[i] && angles[i].json) || {};
  return {
    json: {
      ok: result.ok,
      violations: result.violations,
      violationList: result.violations.join('\\n'),
      text: result.text,
      post: post,
      draftJson: JSON.stringify(post),
      pillar: angle.pillar || post.pillar,
      postDate: angle.postDate,
      link: angle.link || '',
      attempt: 1
    }
  };
});`
    }
  }
});

const needsRewrite = ifElse({
  version: 2.3,
  config: {
    name: 'Passed Anti-Slop?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
        conditions: [
          { id: 'ok-flag', leftValue: expr('{{ $json.ok }}'), operator: { type: 'boolean', operation: 'true', singleValue: true } }
        ],
        combinator: 'and'
      }
    }
  }
});

const rewritePost = node({
  type: '@n8n/n8n-nodes-langchain.chainLlm',
  version: 1.9,
  config: {
    name: 'Rewrite Post',
    parameters: {
      promptType: 'define',
      hasOutputParser: true,
      text: expr(`Your previous draft was rejected by the Anti-Slop validator.

VIOLATIONS - every one of these must be gone:
{{ $json.violationList }}

YOUR REJECTED DRAFT:
{{ $json.draftJson }}

Rewrite it. Keep what worked: the pillar, the angle, and any specific numbers, tool names, or concrete details. Fix only what the violations name, plus anything else that reads like it was generated rather than written.
Do not fix a banned phrase by swapping in a synonym for the same empty idea. If the sentence said nothing, cut it and say something.

PILLAR: {{ $json.pillar }}`),
      messages: {
        messageValues: [{ type: 'SystemMessagePromptTemplate', message: SYSTEM_PROMPT }]
      },
      batching: { batchSize: 1, delayBetweenBatches: 1000 }
    },
    subnodes: { model: openAiModel, outputParser: postParser }
  }
});

const revalidate = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Re-validate',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: VALIDATOR_SRC + `
// Everything reaching this node failed the first pass.
const failed = $('Passed Anti-Slop?').all();

return $input.all().map(function (item, i) {
  const post = item.json.output || item.json;
  const result = validatePost(post);
  const prior = (failed[i] && failed[i].json) || {};
  return {
    json: {
      ok: result.ok,
      violations: result.violations,
      violationList: result.violations.join('\\n'),
      text: result.text,
      post: post,
      draftJson: JSON.stringify(post),
      pillar: prior.pillar || post.pillar,
      postDate: prior.postDate,
      link: prior.link || '',
      attempt: 2
    }
  };
});`
    }
  }
});

const mergeDrafts = merge({
  version: 3.2,
  config: { name: 'All Drafts', parameters: { mode: 'append', numberInputs: 2 } }
});

const formatRows = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Format Rows',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const cfg = $('Set Config').first().json;
const generatedAt = $now.toISO();

// The prompt's HONESTY rule: a claim about what LeadSync did or would do, if it
// did not happen, has to say so in the post text. A post that says so is
// publishable as written.
const HONESTY_LABELS = ['example, not a client', 'made up numbers, real mechanic'];

function labelled(text) {
  const lower = String(text || '').toLowerCase();
  for (let i = 0; i < HONESTY_LABELS.length; i++) {
    if (lower.indexOf(HONESTY_LABELS[i]) !== -1) return true;
  }
  return false;
}

const rows = $input.all().map(function (item) {
  const j = item.json;
  const post = j.post || {};
  const pillar = j.pillar || post.pillar || '';

  // Social Proof used to be flagged by pillar alone, so every one of them was
  // held and none ever published. A labelled post is honest about being an
  // example and goes out as a draft. An unlabelled one is claiming a real
  // result, and that is the case a human should check before it is published.
  let status;
  if (!j.ok) status = 'NEEDS_REWRITE';
  else if (pillar === 'Social Proof' && !labelled(j.text)) status = 'VERIFY_NUMBERS';
  else status = 'DRAFT';

  return {
    'Post Date': j.postDate || '',
    'Pillar': pillar,
    'Hook': post.hook || '',
    'The Text': j.text || '',
    'Image Idea': post.image_idea || '',
    'Source URL': j.link || 'evergreen',
    'Status': status,
    'Generated At': generatedAt
  };
});

rows.sort(function (a, b) { return String(a['Post Date']).localeCompare(String(b['Post Date'])); });

// Exactly the 8 sheet columns and nothing else. Build Digest reads these rows back
// via $('Format Rows') to compose the email, because Save to Google Sheet maps with
// defineBelow and strips any field not in its schema.
return rows.map(function (r) { return { json: r }; });`
    }
  }
});

const saveToSheet = node({
  type: 'n8n-nodes-base.googleSheets',
  version: 4.7,
  config: {
    name: 'Save to Google Sheet',
    parameters: {
      resource: 'sheet',
      operation: 'append',
      documentId: { __rl: true, mode: 'list', value: '', cachedResultName: 'LeadSync LinkedIn Posts' },
      sheetName: { __rl: true, mode: 'name', value: 'Posts' },
      columns: {
        mappingMode: 'defineBelow',
        value: {
          'Post Date': expr('{{ $json["Post Date"] }}'),
          'Pillar': expr('{{ $json.Pillar }}'),
          'Hook': expr('{{ $json.Hook }}'),
          'The Text': expr('{{ $json["The Text"] }}'),
          'Image Idea': expr('{{ $json["Image Idea"] }}'),
          'Source URL': expr('{{ $json["Source URL"] }}'),
          'Status': expr('{{ $json.Status }}'),
          'Generated At': expr('{{ $json["Generated At"] }}')
        },
        schema: [
          { id: 'Post Date', displayName: 'Post Date', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'Pillar', displayName: 'Pillar', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'Hook', displayName: 'Hook', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'The Text', displayName: 'The Text', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'Image Idea', displayName: 'Image Idea', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'Source URL', displayName: 'Source URL', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'Status', displayName: 'Status', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
          { id: 'Generated At', displayName: 'Generated At', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }
        ]
      },
      options: {}
    },
    credentials: { googleSheetsOAuth2Api: { id: 'Gx2cwVWtYe844eDB', name: 'Google Sheets OAuth2 API' } }
  }
});

// Shipped DISABLED. The Notion node refuses to execute without a Data Source
// selected, and no Notion credential exists in the instance yet. Enable after
// creating the credential and picking the database. See the README.
// Enabled, but inert until the database is shared with the n8n integration.
// Notion's API forbids an integration granting itself access, so that share is a
// manual step: database page -> Connections -> Connect to -> the integration.
// Safe to leave enabled now that dataSourceId is populated; an empty Data Source
// blocks the whole workflow from executing, a permissions failure does not.
const saveToNotion = node({
  type: 'n8n-nodes-base.notion',
  version: 3,
  config: {
    name: 'Save to Notion',
    onError: 'continueRegularOutput',
    parameters: {
      resource: 'databasePage',
      operation: 'create',
      dataSourceId: {
        __rl: true,
        mode: 'id',
        value: '00b1b531-360f-41b0-8fcf-24aff32e022a',
        cachedResultName: 'LeadSync LinkedIn Content Engine'
      },
      title: expr('{{ $json.Hook }}'),
      propertiesUi: {
        propertyValues: [
          { key: 'Post Date|date', includeTime: false, date: expr('{{ $json["Post Date"] }}') },
          { key: 'Pillar|select', selectValue: expr('{{ $json.Pillar }}') },
          // Status is a *select*, not a Notion `status` property. Using `|status`
          // here silently fails to map.
          { key: 'Status|select', selectValue: expr('{{ $json.Status }}') },
          { key: 'The Text|rich_text', textContent: expr('{{ $json["The Text"] }}') },
          { key: 'Image Idea|rich_text', textContent: expr('{{ $json["Image Idea"] }}') },
          { key: 'Source URL|url', urlValue: expr('{{ $json["Source URL"] }}'), ignoreIfEmpty: true }
        ]
      }
    },
    credentials: { notionApi: { id: 'wXNmh55cmSH48XPB', name: 'Notion account 2' } }
  }
});

// Email, not WhatsApp. Meta only delivers free-form WhatsApp messages within 24 hours
// of the recipient messaging the business number; a Monday cron is never inside that
// window, so the API accepts the send and silently drops it. Email has no such window.
const buildDigest = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Build Digest',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: DIGEST_SRC
    }
  }
});

const attachMarkdown = node({
  type: 'n8n-nodes-base.convertToFile',
  version: 1.1,
  config: {
    name: 'Attach Markdown',
    parameters: {
      operation: 'toBinary',
      sourceProperty: 'fileB64',
      options: { fileName: expr('{{ $json.fileName }}'), mimeType: 'text/markdown' }
    }
  }
});

const emailDigest = node({
  type: 'n8n-nodes-base.gmail',
  version: 2.2,
  config: {
    name: 'Email Digest',
    // Drafts are already in the sheet by now; a failed send costs the digest only.
    onError: 'continueRegularOutput',
    parameters: {
      resource: 'message',
      operation: 'send',
      sendTo: 'malekabdelrahmanco@gmail.com',
      // Read from Build Digest, not $json: Attach Markdown replaces the JSON payload
      // with the binary wrapper.
      subject: expr("{{ $('Build Digest').first().json.subject }}"),
      emailType: 'html',
      message: expr("{{ $('Build Digest').first().json.html }}"),
      options: {
        appendAttribution: false,
        senderName: 'LeadSync Content Engine',
        attachmentsUi: { attachmentsBinary: [{ property: 'data' }] }
      }
    },
    credentials: { gmailOAuth2: newCredential('Gmail account') }
  }
});

const errorTrigger = trigger({
  type: 'n8n-nodes-base.errorTrigger',
  version: 1,
  config: { name: 'On Failure' }
});

const alertFailure = node({
  type: 'n8n-nodes-base.gmail',
  version: 2.2,
  config: {
    name: 'Alert Failure',
    parameters: {
      resource: 'message',
      operation: 'send',
      sendTo: 'malekabdelrahmanco@gmail.com',
      subject: expr('LinkedIn content engine FAILED at {{ $json.execution.lastNodeExecuted }}'),
      emailType: 'html',
      message: expr('<b>The LinkedIn content engine failed.</b><br><br>Workflow: {{ $json.workflow.name }}<br>Failed at node: {{ $json.execution.lastNodeExecuted }}<br>Error: {{ $json.execution.error.message }}<br><br><a href="{{ $json.execution.url }}">Open the execution</a>'),
      options: { appendAttribution: false, senderName: 'LeadSync Content Engine' }
    },
    credentials: { gmailOAuth2: newCredential('Gmail account') }
  }
});

const noteSource = sticky(
  '## 1. Source\nGoogle News RSS search, no API key. Queries live in **Set Config** so they are tunable without touching code.\n\nOne dead feed cannot take down the week: RSS Read continues on error, and **Select 3 Angles** falls back to an evergreen pain-point list so the engine never produces a zero-post week.',
  [buildQueries, readFeeds],
  { color: 4 }
);

const noteStrategy = sticky(
  '## 2. Strategy\nDeterministic pillar rotation from the ISO week number. No state to store, and all 4 pillars cycle evenly.\n\nHistory from the sheet filters already-used source URLs and feeds recent hooks into the prompt, so posts do not repeat themselves.',
  [readHistory, selectAngles],
  { color: 5 }
);

const noteWriting = sticky(
  '## 3. Anti-Slop Protocol\nEnforced twice: as prompt constraints, and as a deterministic validator.\n\n**Validate Anti-Slop** rejects banned phrases, em-dashes, hashtag spam, emoji-led bullets and structural failures. A rejected draft gets exactly one rewrite with the violations fed back.\n\nStill failing after the rewrite? It is saved anyway, flagged NEEDS_REWRITE. Nothing is silently dropped.',
  [writePost, validateDraft, needsRewrite, rewritePost, revalidate],
  { color: 3 }
);

const noteStorage = sticky(
  '## 4. Storage and Review\nThe order is deliberate. The **Sheet is the system of record and is written first**. Notion and the email both continue on error, so a failure there costs a mirror or a notification, never a week of drafts.\n\nNotion still needs a credential before it does anything. See the repo README.',
  [formatRows, saveToSheet, saveToNotion, buildDigest, attachMarkdown, emailDigest],
  { color: 6 }
);

export default workflow('leadsync-linkedin-engine', 'LeadSync Perpetual LinkedIn Content Engine')
  .add(scheduleTrigger)
  .to(setConfig)
  .to(buildQueries)
  .to(readFeeds)
  .to(readHistory)
  .to(selectAngles)
  .to(writePost)
  .to(validateDraft)
  .to(
    needsRewrite
      .onTrue(mergeDrafts.input(0))
      .onFalse(rewritePost.to(revalidate.to(mergeDrafts.input(1))))
  )
  .add(mergeDrafts)
  .to(formatRows)
  .to(saveToSheet)
  .to(saveToNotion)
  .to(buildDigest)
  .to(attachMarkdown)
  .to(emailDigest)
  .add(errorTrigger)
  .to(alertFailure)
  .add(noteSource)
  .add(noteStrategy)
  .add(noteWriting)
  .add(noteStorage);
