/**
 * PROTOTYPE — the brand-correct card layouts, pending approval.
 *
 * Five layouts (statement, flow, terminal, thread, panel) built on BRAND.md:
 * navy #001B3D ground, cyan #0CC0DF as accent only, Inter for type and
 * JetBrains Mono for data. No handwriting, no red pen, no paper — the old
 * artefact card broke almost every rule in sections 2 and 3 of the brand.
 *
 * Not wired into the pipeline yet. Renders straight to PNG so the layouts can
 * be looked at before anything depends on them:
 *
 *   node render/brand-layouts.preview.js
 *
 * The copy in here is placeholder written by hand. Any card showing invented
 * records carries the site's own "illustrative example" chip, because BRAND.md
 * section 4 forbids fabricated metrics outright.
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');

const FONTS = path.join(__dirname, 'fonts');
const b64 = (f) => fs.readFileSync(path.join(FONTS, f)).toString('base64');
const face = (fam, file, wt) =>
  `@font-face{font-family:'${fam}';font-weight:${wt};font-display:block;src:url(data:font/ttf;base64,${b64(file)}) format('truetype')}`;

const FONT_CSS =
  face('Inter', 'Inter-400.ttf', 400) +
  face('Inter', 'Inter-600.ttf', 600) +
  face('Inter', 'Inter-700.ttf', 700) +
  face('Mono', 'JetBrainsMono-400.ttf', 400) +
  face('Mono', 'JetBrainsMono-600.ttf', 600);

const CSS = `
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1024px;height:1024px;overflow:hidden}
body{background:#001B3D;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased}
.card{width:1024px;height:1024px;position:relative;overflow:hidden;background:#001B3D;
  display:flex;flex-direction:column}
/* the site's ambient depth: a soft cyan bloom, never a flat block */
.card::before{content:'';position:absolute;width:900px;height:900px;right:-280px;top:-340px;
  background:radial-gradient(circle,rgba(12,192,223,.16) 0%,rgba(12,192,223,.05) 38%,transparent 66%);
  pointer-events:none}
.card::after{content:'';position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(120% 80% at 50% 120%,rgba(0,0,0,.42),transparent 60%)}
.inner{position:relative;z-index:2;flex:1;display:flex;flex-direction:column;padding:70px 76px 0}
.body{flex:1;display:flex;flex-direction:column;justify-content:center;padding-bottom:52px}

.chip{display:inline-flex;align-items:center;gap:10px;align-self:flex-start;
  font-family:'Mono';font-size:15px;font-weight:400;letter-spacing:.14em;text-transform:uppercase;
  color:#8FA6BE;border:1px solid rgba(255,255,255,.14);border-radius:999px;padding:9px 17px;
  background:rgba(255,255,255,.03)}
.chip .dot{width:7px;height:7px;border-radius:50%;background:#0CC0DF}

h1{font-size:78px;line-height:1.04;font-weight:700;letter-spacing:-.022em;color:#fff;margin-top:30px}
h1 .hi{color:#0CC0DF}
h2{font-size:51px;line-height:1.12;font-weight:600;letter-spacing:-.02em;color:#fff;margin-top:26px}
.sub{font-size:25px;line-height:1.55;color:#93A7BD;font-weight:400;margin-top:26px;max-width:800px}

.foot{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;
  padding:0 76px 60px;margin-top:auto}
.mark{font-size:26px;font-weight:600;letter-spacing:.30em;color:#fff}
.mark b{color:#0CC0DF;font-weight:600}
.site{font-family:'Mono';font-size:17px;letter-spacing:.05em;color:#5A6B82}

/* ---------- flow ---------- */
.nodes{display:flex;align-items:stretch;gap:0;margin-top:56px}
.node{flex:1;border:1px solid rgba(255,255,255,.13);border-radius:16px;padding:26px 22px;
  background:rgba(255,255,255,.028);min-height:168px;display:flex;flex-direction:column}
.node.on{border-color:rgba(12,192,223,.75);background:rgba(12,192,223,.075)}
.node .lbl{font-family:'Mono';font-size:13px;letter-spacing:.15em;text-transform:uppercase;color:#5A6B82}
.node.on .lbl{color:#0CC0DF}
.node .val{font-size:27px;font-weight:600;color:#fff;margin-top:16px;line-height:1.25;letter-spacing:-.01em}
.node .note{font-size:17px;color:#8296AD;margin-top:auto;line-height:1.4}
.arrow{width:52px;display:flex;align-items:center;justify-content:center;color:#0CC0DF;font-size:26px}

/* ---------- terminal ---------- */
.term{margin-top:44px;border:1px solid rgba(255,255,255,.13);border-radius:16px;overflow:hidden;
  background:rgba(255,255,255,.026)}
.tbar{display:flex;align-items:center;gap:11px;padding:17px 22px;border-bottom:1px solid rgba(255,255,255,.09)}
.tbar i{width:11px;height:11px;border-radius:50%;background:rgba(255,255,255,.2);display:block}
.tbar span{font-family:'Mono';font-size:16px;color:#7E93AB;margin-left:12px}
.code{padding:30px 30px 34px;font-family:'Mono';font-size:21px;line-height:1.72;color:#C3D3E4;
  white-space:pre-wrap}
.code .c{color:#5A6B82}
.code .s{color:#0CC0DF}
.code .k{color:#fff;font-weight:600}

/* ---------- thread ---------- */
.thread{margin-top:40px;border:1px solid rgba(255,255,255,.13);border-radius:18px;overflow:hidden;
  background:rgba(255,255,255,.026)}
.thd{display:flex;align-items:center;gap:15px;padding:20px 24px;border-bottom:1px solid rgba(255,255,255,.09)}
.av{width:46px;height:46px;border-radius:50%;background:linear-gradient(140deg,#0CC0DF,#1E5F9E);
  display:flex;align-items:center;justify-content:center;font-weight:700;font-size:20px;color:#00253F}
.who{font-size:20px;font-weight:600;color:#fff}
.st{font-family:'Mono';font-size:14px;color:#4FD2E8;margin-top:3px}
.msgs{padding:24px}
.b{max-width:76%;padding:18px 22px;border-radius:16px;font-size:22px;line-height:1.42;margin-bottom:14px}
.b.in{background:rgba(255,255,255,.07);color:#DDE7F1;border-bottom-left-radius:5px}
.b.out{background:#0A93AE;color:#022E38;margin-left:auto;border-bottom-right-radius:5px;font-weight:500}
.b .t{display:block;font-family:'Mono';font-size:13px;opacity:.62;margin-top:8px}
.evt{border:1px solid rgba(12,192,223,.4);background:rgba(12,192,223,.07);border-radius:12px;
  padding:17px 21px;font-size:19px;color:#BFE9F3;display:flex;align-items:center;gap:11px}

/* ---------- panel ---------- */
.rows{margin-top:46px;border-top:1px solid rgba(255,255,255,.1)}
.r{display:flex;align-items:center;padding:25px 4px;border-bottom:1px solid rgba(255,255,255,.1)}
.r .rl{flex:1;font-size:25px;color:#A9BCD1}
.r .a{font-family:'Mono';font-size:25px;color:#8296AD;min-width:190px;text-align:right}
.r .arw{color:#3D5570;padding:0 22px;font-size:19px}
.r .z{font-family:'Mono';font-size:25px;color:#fff;min-width:190px;text-align:right;font-weight:600}
.r.on .z{color:#0CC0DF}
.r.on .rl{color:#fff;font-weight:500}
.kick{font-family:'Mono';font-size:16px;letter-spacing:.14em;text-transform:uppercase;color:#0CC0DF}
.cap{font-size:21px;color:#8296AD;margin-top:34px;line-height:1.5}
`;

function shell(chip, body, opts) {
  opts = opts || {};
  return `<div class="card"><div class="inner">
    ${chip ? `<div class="chip"><span class="dot"></span>${chip}</div>` : ''}
    <div class="body">${body}</div>
  </div><div class="foot">
    <div class="mark">LEAD<b>S</b>YNC</div>
    <div class="site">${opts.site || 'useleadsync.com'}</div>
  </div></div>`;
}

/* 1 — statement */
const c1 = shell('Real estate · Speed to lead', `
  <h1>A portal lead at 22:41<br>does not wait for <span class="hi">09:12</span>.</h1>
  <div class="sub">They message the next agent. First reply wins the viewing, and after
  hours is when most enquiries land.</div>
`);

/* 2 — flow */
const c2 = shell('Lead handling', `
  <h2>What happens between the enquiry<br>and the agent.</h2>
  <div class="nodes">
    <div class="node"><div class="lbl">Source</div><div class="val">Portal enquiry</div>
      <div class="note">Property Finder, Bayut, Dubizzle</div></div>
    <div class="arrow">→</div>
    <div class="node on"><div class="lbl">Zara</div><div class="val">Qualify &amp; reply</div>
      <div class="note">Budget, area, timeline. Arabic or English.</div></div>
    <div class="arrow">→</div>
    <div class="node"><div class="lbl">Destination</div><div class="val">Agent + CRM</div>
      <div class="note">Routed with the thread attached</div></div>
  </div>
  <div class="cap">No one re-types the lead. The agent picks up a conversation that already started.</div>
`);

/* 3 — terminal */
const c3 = shell('How it is built', `
  <h2>The rule that answers at 3am.</h2>
  <div class="term">
    <div class="tbar"><i></i><i></i><i></i><span>workflows/qualify-lead.n8n</span></div>
    <div class="code"><span class="c"># trigger: portal enquiry lands</span>
<span class="k">on</span> <span class="s">"webhook:portal.enquiry"</span> {
  lead   = enrich(enquiry.contact)
  intent = claude.classify(enquiry.body)

  <span class="k">if</span> intent == <span class="s">"viewing_request"</span> {
    whatsapp.reply(zara.draft(lead))
    crm.upsert(lead, status=<span class="s">"hot"</span>)
    agent.notify(lead.owner)
  }
}</div>
  </div>
`);

/* 4 — thread */
const c4 = shell('Illustrative example · Zara', `
  <h2>Answered in eight seconds. At 3am.</h2>
  <div class="thread">
    <div class="thd"><div class="av">Z</div>
      <div><div class="who">Zara · LeadSync</div><div class="st">online · replies instantly</div></div></div>
    <div class="msgs">
      <div class="b in">Hi, is the JVC studio still available?<span class="t">02:58</span></div>
      <div class="b out">Yes, it is. Are you looking to move in before September?<span class="t">02:58 ✓✓</span></div>
      <div class="b in">Yes. Can I view tomorrow morning?<span class="t">03:01</span></div>
      <div class="evt">◆ Viewing booked · agent notified · CRM updated</div>
    </div>
  </div>
`);

/* 5 — panel */
const c5 = shell('Back office', `
  <h2>One price change. Four places to type it.</h2>
  <div class="rows">
    <div class="r"><div class="rl">CRM listing record</div><div class="a">manual</div>
      <div class="arw">→</div><div class="z">automatic</div></div>
    <div class="r"><div class="rl">Property Finder</div><div class="a">manual</div>
      <div class="arw">→</div><div class="z">automatic</div></div>
    <div class="r"><div class="rl">Bayut &amp; Dubizzle</div><div class="a">manual</div>
      <div class="arw">→</div><div class="z">automatic</div></div>
    <div class="r on"><div class="rl">Time per change</div><div class="a">52 min</div>
      <div class="arw">→</div><div class="z">one edit</div></div>
  </div>
  <div class="cap">The work was never hard. It just kept happening.</div>
`);

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONT_CSS}${CSS}</style></head>
<body>${[c1, c2, c3, c4, c5].join('')}</body></html>`;

const DIR = process.env.OUT_DIR || path.join(__dirname, 'out', 'brand');
fs.mkdirSync(DIR, { recursive: true });
fs.writeFileSync(path.join(DIR, 'preview.html'), html);

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage({ viewport: { width: 1024, height: 1024 } });
  await page.goto('file://' + path.join(DIR, 'preview.html'));
  await page.waitForTimeout(600);
  const cards = await page.$$('.card');
  for (let i = 0; i < cards.length; i++) {
    await cards[i].screenshot({ path: path.join(DIR, `layout-${i + 1}.png`) });
  }
  console.log('rendered ' + cards.length);
  await browser.close();
})();
