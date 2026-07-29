# LeadSync Perpetual LinkedIn Content Engine

Generates **3 LinkedIn posts every Monday at 9AM**, maps each to one of Malek's 4 content
pillars, runs them through a deterministic anti-slop validator, and parks them in Google
Sheets (and Notion) and emails you a digest for review.

It is not a "generate 3 posts" script. Anything can do that. The difference is the
[Anti-Slop Protocol](docs/anti-slop-protocol.md), which is enforced in code, not just
asked for in a prompt.

**Live workflow:** [`ELZxVjqbYCWDDiGM`](https://malekabdelrahman22.app.n8n.cloud/workflow/ELZxVjqbYCWDDiGM) — **active**. Fires Mondays at 09:00 Africa/Cairo.

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
  → Save to Notion          (continues on error)
  → Build Digest → Attach Markdown → Email Digest   (continues on error)

On Failure → Alert Failure  (separate error-trigger branch)
```

**The write order is deliberate.** The sheet is written before Notion and the email, and
both of those continue on error. A missing credential costs you a mirror or a notification.
It never costs you a week of drafts.

## Layers

| Layer | Where | Docs |
|---|---|---|
| Source | Google News RSS, no API key, evergreen fallback | [`docs/sources.md`](docs/sources.md) |
| Strategy | 4 pillars, deterministic ISO-week rotation | [`docs/pillars.md`](docs/pillars.md) |
| Writing | Prompt constraints + code validator | [`docs/anti-slop-protocol.md`](docs/anti-slop-protocol.md) |
| Storage | Google Sheets + Notion, email digest | this file |

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

Everything below is done. This section is kept as a record of what each integration
needed, since none of it is obvious from the workflow alone.

### 1. Google Sheet — ✅ done

Created, wired to both Sheets nodes, verified with a real write, and formatted for
legibility (frozen bold header, **vertical align top**, `CLIP` wrapping so each row is one
line, per-column widths). Sheets defaults vertical alignment to *bottom*, which is what
made the long post column push everything to the floor of a giant row.

**[LeadSync LinkedIn Posts](https://docs.google.com/spreadsheets/d/1Ov-pd5H4_hzuJ2TMMrRkTphhJ8MizQ4hrBmKhpCZwTw/edit)** — tab `Posts`, headers:

```
Post Date | Pillar | Hook | The Text | Image Idea | Source URL | Status | Generated At
```

`Set Config → sheetUrl` already points at it, so the link shows up in the email digest.
There are real drafts in it from the verification runs — delete them if you don't want them.

### 2. Email digest — ✅ done

**WhatsApp was removed.** Meta only delivers *free-form* WhatsApp messages within 24 hours
of the recipient last messaging the business number. Outside that window it accepts the
API call, returns a message ID, and drops the message. A Monday 09:00 cron is never inside
that window, so it cannot work here regardless of configuration. Only pre-approved
template messages would, and templates are too rigid for this digest.

Email has no such restriction. Three nodes:

| Node | Does |
|---|---|
| `Build Digest` | Renders one HTML card per draft: pillar, date, status badge, hook, the full copy-pasteable post, image idea, source link. Also builds a Markdown twin. |
| `Attach Markdown` | Turns that Markdown into a `.md` file (`leadsync-linkedin-<week>.md`). |
| `Email Digest` | Sends the HTML body with the file attached. |

The error branch emails too.

**Verified end to end.** Execution 36 sent successfully: Gmail returned
`labelIds: ["SENT"]` and message ID `19fae361c7f3c653`. The attachment is a 6.45 kB
`leadsync-linkedin-2026-07-27.md`.

Note the difference from the WhatsApp attempt: Gmail reporting `SENT` means the message
is really in the Sent folder, whereas Meta returning a message ID only meant *accepted*.
Not the same claim.

Recipient is `malekabdelrahmanco@gmail.com` on both nodes; credential `Gmail account`.

> `Build Digest` reads its rows from `$('Format Rows')`, not `$json`. Save to Google Sheet
> maps with `defineBelow` and an 8-column schema, so it strips every other field — reading
> `$json` downstream of it silently yields nothing. That bug cost a debugging round once
> already.

### 3. Notion — ✅ done

**[LeadSync LinkedIn Content Engine](https://app.notion.com/p/d3f15667704e4f5fa04e620fd16d9003)**
— data source `00b1b531-360f-41b0-8fcf-24aff32e022a`

| Property | Type |
|---|---|
| Hook | Title |
| Post Date | Date |
| Pillar | Select — `Educational`, `Social Proof`, `Thought Leadership`, `Personal` |
| Status | Select — `DRAFT`, `VERIFY_NUMBERS`, `NEEDS_REWRITE`, `APPROVED`, `POSTED` |
| The Text | Text |
| Image Idea | Text |
| Source URL | URL |
| Generated At | Created time |

Verified on execution 37: pages created with every property mapped, including
`Status: VERIFY_NUMBERS`. `Set Config → notionUrl` is populated, so the digest carries an
"Open in Notion" link.

> `Status` is a **select**, not a Notion `status` property, so the node maps it with
> `Status|select`. Using `|status` fails silently — that cost a round to find.
>
> Notion's API forbids an integration granting itself access, so the database had to be
> shared from the Notion UI (**⋯ → Connections → Connect to**). Nothing about that step
> could be automated.

### 4. Activate — ✅ done

The workflow is **active** and fires Mondays at **09:00 Africa/Cairo**.

The instance default is UTC while generated timestamps were resolving to +03:00, so the
workflow now pins `timezone: Africa/Cairo` in its own settings. That overrides the
instance default, so the schedule is unambiguous regardless of what the instance says.

Test data from the verification runs was cleared from the sheet (`Posts!A2:H1000`);
header and formatting kept. The Notion pages from those runs were left in place.

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
| `sheetUrl` / `notionUrl` | set / empty | Links included in the email digest |

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
| 32 | After the fix | WhatsApp accepted by Meta, but never delivered (24-hour window) |
| 35 | Email digest, no credential | HTML + 6.45 kB `.md` attachment built; send blocked only by the missing credential |
| 36 | **Email digest, live** | Sent. Gmail returned `SENT` and a message ID |
| 37 | **Full stack, live** | Sheet rows + Notion pages (all properties correct) + email sent |

**A real bug that runs 24-30 hid.** The notify node read `$json._alertSummary`, but
`Save to Google Sheet` maps with `defineBelow` and an 8-column schema, so it drops every
other field from its output. The summary never reached the notify node. Every earlier
Slack run had the same defect — the "no credentials set" error fired first and masked it.
The node now reads `$('Format Rows').first().json._alertSummary` directly.

**Still unverified:** the Error Trigger → Alert Failure branch, since n8n only fires error
triggers on production runs — it proves itself the first time a live run breaks. And the
schedule actually firing on a Monday, since the workflow is still inactive.
