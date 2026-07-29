# LeadSync Perpetual LinkedIn Content Engine

Generates **3 LinkedIn posts every Monday at 9AM**, maps each to one of Malek's 4 content
pillars, runs them through a deterministic anti-slop validator, and parks them in Google
Sheets (and Notion) with a WhatsApp ping for review.

It is not a "generate 3 posts" script. Anything can do that. The difference is the
[Anti-Slop Protocol](docs/anti-slop-protocol.md), which is enforced in code, not just
asked for in a prompt.

**Live workflow:** [`ELZxVjqbYCWDDiGM`](https://malekabdelrahman22.app.n8n.cloud/workflow/ELZxVjqbYCWDDiGM) — currently **inactive**, see [Go live](#go-live).

---

## How it works

```
Every Monday 9AM
  → Set Config              tunables: feed queries, pillars, sheet tab, channel
  → Build Source Queries    one Google News RSS URL per query
  → Read RSS Feeds          continues on error; one dead feed can't kill the week
  → Read Post History       last ~40 rows: used links + recent hooks
  → Select 3 Angles         dedupe, score, assign pillars, evergreen fallback
  → Write Post (GPT-5.4)    structured JSON out, one call per angle
  → Validate Anti-Slop      deterministic gate
  → Passed?  ── yes ─────────────────────────────┐
              └─ no → Rewrite Post → Re-validate ┤
  → All Drafts                                  ←┘
  → Format Rows
  → Save to Google Sheet    ← SYSTEM OF RECORD, written first
  → Save to Notion          (disabled until credential exists)
  → Notify WhatsApp         (continues on error)

On Failure → Alert Failure  (separate error-trigger branch)
```

**The write order is deliberate.** The sheet is written before Notion and WhatsApp, and
both of those continue on error. A missing credential costs you a mirror or a notification.
It never costs you a week of drafts.

## Layers

| Layer | Where | Docs |
|---|---|---|
| Source | Google News RSS, no API key, evergreen fallback | [`docs/sources.md`](docs/sources.md) |
| Strategy | 4 pillars, deterministic ISO-week rotation | [`docs/pillars.md`](docs/pillars.md) |
| Writing | Prompt constraints + code validator | [`docs/anti-slop-protocol.md`](docs/anti-slop-protocol.md) |
| Storage | Google Sheets + Notion, WhatsApp alert | this file |

## Repo layout

| Path | What |
|---|---|
| `workflows/leadsync-linkedin-engine.sdk.js` | n8n Workflow SDK source that built the live workflow |
| `prompts/system-prompt.md` | The anti-slop system prompt (source of truth) |
| `prompts/user-prompt.md` | Generation + rewrite user prompts |
| `scripts/validate_post.js` | The validator, mirrored into the n8n Code nodes |
| `scripts/validate_post.test.js` | Regression suite, zero dependencies |
| `docs/` | Pillars, anti-slop protocol, source layer |

No credentials or tokens are committed. The credential *references* in the SDK file point
at credentials that already live in n8n.

---

## Go live

Sheets and WhatsApp are done and verified. The workflow is still **inactive** — only the
timezone check and the Active toggle stand between it and a live Monday run. Notion is
optional.

### 1. Google Sheet — ✅ done

The spreadsheet is created, wired to both Sheets nodes, and verified with a real write:

**[LeadSync LinkedIn Posts](https://docs.google.com/spreadsheets/d/1Ov-pd5H4_hzuJ2TMMrRkTphhJ8MizQ4hrBmKhpCZwTw/edit)** — tab `Posts`, headers:

```
Post Date | Pillar | Hook | The Text | Image Idea | Source URL | Status | Generated At
```

`Set Config → sheetUrl` already points at it, so the link shows up in the WhatsApp ping.
There are real drafts in it from the verification runs — delete them if you don't want them.

### 2. WhatsApp notifications — ✅ done

Notifications go to **WhatsApp**, not Slack. Creating a Slack app needs a desktop browser
and a credential this instance doesn't have; the WhatsApp credential already works and is
already used for error alerts in the Dubai lead-handler workflow.

- `Notify WhatsApp` — weekly summary: 3 hooks, review flags, sheet link.
- `Alert Failure` — fires from the Error Trigger branch when a run breaks.

Verified delivered (execution 32 returned a WhatsApp message ID). To redirect, change
`recipientPhoneNumber` on either node.

> The summary uses real emoji, not Slack `:shortcode:` syntax, which WhatsApp doesn't
> render. If you ever move back to Slack, that's the one extra thing to change in
> `Format Rows`.

### 3. Enable Notion (optional)

The Notion node ships **disabled**, because n8n refuses to execute a Notion node with no
Data Source selected — leaving it enabled-but-blank would have blocked the whole workflow
from running at all.

To turn it on:

1. Create a Notion internal integration and add the credential to n8n.
2. Create a database named **LeadSync LinkedIn Content Engine** with these properties:

   | Property | Type |
   |---|---|
   | Hook | Title |
   | Post Date | Date |
   | Pillar | Select — `Educational`, `Social Proof`, `Thought Leadership`, `Personal` |
   | The Text | Text |
   | Image Idea | Text |
   | Source URL | URL |
   | Status | Status — `DRAFT`, `VERIFY_NUMBERS`, `NEEDS_REWRITE` |

3. Share the database with your integration.
4. In n8n, enable **Save to Notion**, pick the Data Source, and confirm the property
   mappings resolved.

### 4. Activate

Toggle the workflow **Active**.

> ⚠️ **Your n8n instance timezone is UTC.** Confirmed from a live run
> (`"Timezone": "UTC (UTC+00:00)"`). So "Monday 9AM" currently fires at **09:00 UTC** —
> 1PM if you're in Dubai. Either change the instance timezone in n8n Settings, or change
> `triggerAtHour` on the trigger node to compensate.

---

## Reviewing the drafts

Each row lands with a `Status`:

| Status | Meaning |
|---|---|
| `DRAFT` | Passed the validator. Read it, add the image, post it. |
| `VERIFY_NUMBERS` | A Social Proof post. **Check every number before posting.** |
| `NEEDS_REWRITE` | Failed the anti-slop validator twice. Saved anyway so you can see it. |

### About `VERIFY_NUMBERS`

Social Proof asks for receipts, and the model has no access to real client data. So it
invents plausible-looking metrics. The first test run produced *"41 Reddit-sourced
signals"* and *"cut about 6 hours"* — both fabricated.

The prompt forbids attributing invented statistics to named companies, and it does obey
that. But it will still generate a number for Malek's own results, because a Social Proof
post without a number isn't a Social Proof post.

**Every Social Proof row is therefore flagged automatically.** Replace the numbers with
real ones or cut the claim. This is the one part of the system that genuinely cannot be
automated away: it needs someone who knows what actually happened.

---

## Development

```bash
node --test scripts/validate_post.test.js
```

19 tests, no dependencies, no install step. Covers every banned phrase, the structural
rules, the format tells, and a compound-slop case.

### Keeping the validator in sync

`scripts/validate_post.js` is the source of truth. The same logic is inlined into two n8n
Code nodes (**Validate Anti-Slop** and **Re-validate**) because the n8n sandbox can't
`require` a repo file.

When you change a rule:

1. Edit `scripts/validate_post.js`.
2. Run the tests.
3. Mirror the change into `VALIDATOR_SRC` in `workflows/leadsync-linkedin-engine.sdk.js`.
4. Paste it into both Code nodes in n8n, or rebuild the workflow from the SDK file.

Note the escaping difference: inside the SDK file's template literal, regex backslashes
are doubled (`\\p{...}`) and resolve to single backslashes in the Code node.

### Tuning

Nearly everything is in the **Set Config** node — no code edits needed:

| Field | Default | Effect |
|---|---|---|
| `feedQueries` | 6 Google News searches | What the engine reads |
| `pillars` | The 4 pillars | Rotation source |
| `postsPerWeek` | 3 | Posts generated per run |
| `historyRows` | 40 | Anti-repetition lookback |
| `sheetUrl` / `notionUrl` | set / empty | Links included in the WhatsApp ping |

Voice changes go in `prompts/system-prompt.md`, then into both chainLlm nodes. Banned
phrases go in the validator *and* the system prompt — the prompt stops most of them, the
validator catches the rest.

### Cost

6 RSS fetches (free) and 3 GPT-5.4 calls per week, plus one extra call per draft that
fails the validator. Across every unpinned run, all drafts passed on the first attempt.

> The brief specified GPT-4o. n8n's current node contract rejects it as superseded and
> will not offer it as a valid choice, so this uses **GPT-5.4** on the same OpenAI
> credential. Changing it is a one-field edit on the `OpenAI GPT-5.4` node.

---

## Verified

Run end-to-end against the live workflow:

| # | Scenario | Result |
|---|---|---|
| 24 | Normal week, Sheets pinned | 3 posts, 3 distinct pillars, all passed the validator first try |
| 25 | Dead feed (RSS pinned broken) | Evergreen fallback filled all 3 slots, run completed |
| 26 | Forced rewrite (2 slop drafts pinned) | Validator caught 11 + 11 violations; both rewrote and passed on attempt 2; merge combined 1 passed + 2 rewritten |
| 29 | **Fully live, nothing pinned** | 3 rows written to the real spreadsheet with correct columns and statuses |
| 30 | **Live, with history present** | Read the 3 prior rows, fed their hooks into the prompt, and selected 3 different source URLs |
| 31 | First WhatsApp attempt | **Failed** — empty message body, see below |
| 32 | After the fix | WhatsApp delivered, message ID returned |

**A real bug that runs 24-30 hid.** The notify node read `$json._alertSummary`, but
`Save to Google Sheet` maps with `defineBelow` and an 8-column schema, so it drops every
other field from its output. The summary never reached the notify node. Every earlier
Slack run had the same defect — the "no credentials set" error fired first and masked it.
The node now reads `$('Format Rows').first().json._alertSummary` directly.

**Still unverified:** the Error Trigger → Alert Failure branch (n8n only fires error
triggers on production runs, so it'll prove itself the first time a live run breaks), and
the schedule actually firing on a Monday (the workflow is still inactive).
