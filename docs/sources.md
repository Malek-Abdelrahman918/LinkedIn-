# Source Layer

## Where angles come from

Google News RSS search endpoints. No API key, no quota, no cost:

```
https://news.google.com/rss/search?q=<url-encoded query>&hl=en-US&gl=US&ceid=US:en
```

The queries live in the `Set Config` node (`feedQueries`) so they can be tuned without
touching any code:

| Query | Looking for |
|---|---|
| `sales automation` | New AI automation trends |
| `CRM data entry` | Manual sales pain points |
| `cold calling effectiveness` | Anti-cold-call ammunition |
| `AI sales agents` | What's shipping in the category |
| `lead generation automation` | Adjacent tooling news |
| `HubSpot integration problems` | Specific, nameable pain |

Fetched by `n8n-nodes-base.rssFeedRead`, one execution per query, with
`onError: continueRegularOutput` so one dead feed can't take down the run.

> **Note:** the n8n Code node sandbox has no network access — `fetch()` and `axios` fail
> at runtime there. All fetching goes through RSS Read / HTTP Request nodes.

## Selection

`Select 3 Angles` (Code node) does, in order:

1. Flatten every feed's items into one list.
2. Drop anything whose link already appears in the sheet history (last ~40 rows).
3. Drop near-duplicate titles (normalised, first 60 chars).
4. Score by keyword hits against a pain-point vocabulary — `manual`, `data entry`,
   `cold call`, `sync`, `CRM`, `pipeline`, `outbound`, `quota`, `admin`, `spreadsheet`,
   `automation`, `AI agent`, `lead`.
5. Take the top 3, assign pillars by the ISO-week rotation (see `docs/pillars.md`).

## The evergreen fallback

**This is the part that matters most.**

A weekly cron that silently produces nothing is worse than no cron, because you don't
notice for a month. Google News RSS rate-limits, returns empty results, and occasionally
just changes its mind about a query.

So: if step 4 yields fewer than 3 usable angles, the shortfall is filled from a static
seed list of evergreen LeadSync pain points. The engine always produces 3 posts. Rows
sourced this way are marked `Source URL = evergreen` so it's visible in the sheet.

The seed list (also in the `Select 3 Angles` node):

1. Reps spend more time updating the CRM than talking to buyers.
2. The same lead exists three times across HubSpot, Apollo, and a spreadsheet.
3. Cold call connect rates keep falling and the response is to dial more.
4. Nightly syncs make people trust stale data more than no data.
5. Handoff between SDR and AE loses context every single time.
6. Enrichment tools disagree with each other and nobody reconciles them.
7. Follow-up dies because it depends on somebody remembering.
8. Forecasts are built on fields reps fill in to make the pipeline look busy.
9. Every new tool adds another place the truth can diverge.
10. The automation someone built two years ago is still running and nobody knows what it does.

Add to this list freely. It's the floor on quality for a bad news week.

## Tuning

- **Different market?** Change `feedQueries` in `Set Config`.
- **Direct RSS feeds** (a newsletter, a blog) work too — RSS Read takes any feed URL.
  Add them to the same array.
- **Too much noise?** Tighten the scoring vocabulary in `Select 3 Angles`.
- **Angles too samey week to week?** Raise the history window from 40 rows.
