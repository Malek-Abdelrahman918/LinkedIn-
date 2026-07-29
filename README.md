# LeadSync Perpetual LinkedIn Content Engine

Generates **3 LinkedIn posts every Monday at 9AM**, maps each to one of Malek's 4 content
pillars, runs them through a deterministic anti-slop validator, and parks them in Google
Sheets (and Notion) with a Slack ping for review.

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
  → Notify Slack            (continues on error)

On Failure → Alert Failure  (separate error-trigger branch)
```

**The write order is deliberate.** The sheet is written before Notion and Slack, and both
of those continue on error. A missing credential costs you a mirror or a notification.
It never costs you a week of drafts.

## Layers

| Layer | Where | Docs |
|---|---|---|
| Source | Google News RSS, no API key, evergreen fallback | [`docs/sources.md`](docs/sources.md) |
| Strategy | 4 pillars, deterministic ISO-week rotation | [`docs/pillars.md`](docs/pillars.md) |
| Writing | Prompt constraints + code validator | [`docs/anti-slop-protocol.md`](docs/anti-slop-protocol.md) |
| Storage | Google Sheets + Notion, Slack alert | this file |

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

The workflow is built, tested, and **inactive**. Three things stand between it and a live
Monday run.

### 1. Create the Google Sheet (required)

Create a spreadsheet with a tab named `Posts` and this exact header row:

```
Post Date | Pillar | Hook | The Text | Image Idea | Source URL | Status | Generated At
```

Then in n8n open **Read Post History** and **Save to Google Sheet** and pick it from the
Document dropdown. The Google Sheets credential is already attached; only the document
selection is blank.

Optionally paste the sheet URL into `Set Config → sheetUrl` so it appears in the Slack ping.

### 2. Add the Slack credential (required for notifications)

Your n8n instance has no Slack credential yet. Create a Slack app with `chat:write`, add
it to n8n, then set it on **Notify Slack** and **Alert Failure**. Both are pre-pointed at
`#linkedin-drafts` — change the channel in the node or in `Set Config`.

Until this exists, the workflow still runs and still fills the sheet. You just won't get
pinged.

> Your WhatsApp credential already works. If you'd rather get the alerts there, swapping
> the two Slack nodes for WhatsApp nodes is a five-minute change and needs no new setup.

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

Toggle the workflow **Active**. Confirm your n8n instance timezone is what you expect
first — "Monday 9AM" is evaluated in the instance timezone, not necessarily yours.

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
| `sheetUrl` / `notionUrl` | empty | Links included in the Slack ping |

Voice changes go in `prompts/system-prompt.md`, then into both chainLlm nodes. Banned
phrases go in the validator *and* the system prompt — the prompt stops most of them, the
validator catches the rest.

### Cost

6 RSS fetches (free) and 3 GPT-5.4 calls per week, plus one extra call per draft that
fails the validator. Across the two test runs, 6 of 6 drafts passed on the first attempt.

> The brief specified GPT-4o. n8n's current node contract rejects it as superseded and
> will not offer it as a valid choice, so this uses **GPT-5.4** on the same OpenAI
> credential. Changing it is a one-field edit on the `OpenAI GPT-5.4` node.

---

## Verified

Both scenarios were run end-to-end against the live workflow:

- **Normal week** (execution 24) — pulled real Google News angles, produced 3 posts across
  3 distinct pillars, all passed the validator on the first attempt.
- **Dead feed** (execution 25) — RSS pinned to a broken response; the evergreen fallback
  filled all 3 slots and the run completed normally.

The Google Sheets append was pinned in both runs, since no spreadsheet is selected yet.
That path goes live with step 1 above.
