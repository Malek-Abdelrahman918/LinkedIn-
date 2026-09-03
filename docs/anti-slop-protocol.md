# The Anti-Slop Writing Protocol

The point of this system is not "generate 3 posts." Anything can do that. The point is
to generate 3 posts that don't sound like they were generated.

Slop is what an LLM produces when nobody constrains it: sentences that are grammatically
perfect and say nothing. This document is the constraint.

## Enforced twice, on purpose

A prompt that says "don't be generic" produces generic output roughly as often as one
that doesn't. Instructions are a suggestion; code is a rule. So this protocol lives in
two places:

1. **`prompts/system-prompt.md`** — tells the model what good looks like.
2. **`scripts/validate_post.js`** — deterministically rejects what it produced if it
   isn't. Mirrored verbatim into the `Validate Anti-Slop` Code node in n8n.

Failing the validator triggers exactly one rewrite pass with the specific violations fed
back to the model. If the rewrite fails too, the post is still saved, flagged
`NEEDS_REWRITE`. Malek sees it and decides. Nothing is silently dropped.

---

## Rule 1 — Banned phrases

Case-insensitive substring match. Any hit is a hard failure.

| Phrase | Why it's banned |
|---|---|
| `in today's fast-paced world` | The canonical opener of a post nobody read |
| `in today's digital age` | Same, wearing a hat |
| `in the ever-evolving landscape` | Landscapes do not evolve. Nothing is being said. |
| `unlock your potential` | Unlock it into what |
| `unlock the power` / `harness the power of` | Power is not locked, nor loose |
| `game-changer` / `game changing` | Every tool claims this. It carries no information. |
| `revolutionize` / `revolutionise` | No, it won't |
| `leverage synergies` | Two dead words holding each other up |
| `dive deep` / `let's dive in` | We are not diving |
| `delve into` | The single loudest AI tell in English |
| `it's no secret that` | Then don't announce it |
| `look no further` | Nobody was looking |
| `at the end of the day` | Filler that survives deletion |
| `moving the needle` | Which needle |
| `take it to the next level` | There is no level |
| `in conclusion` | This is a LinkedIn post, not an essay |
| `the bottom line is` | Just say the thing |
| `buckle up` | No |
| `plot twist` | Usually precedes no twist |
| `here's the kicker` | It never kicks |
| `let that sink in` | Condescending |
| `i'm excited to announce` | Only if genuinely announcing something |
| `thoughts?` | The laziest possible CTA |
| `agree?` | See above |

## Rule 2 — Structure

Every post is generated as **structured JSON**, not freeform prose, so structure is
verified rather than guessed at by parsing:

```json
{
  "pillar":     "Educational",
  "hook":       "one punchy line",
  "problem":    "the pain, concretely",
  "solution":   "what LeadSync actually does about it",
  "bullets":    ["how-to 1", "how-to 2", "how-to 3"],
  "cta":        "low-friction ask",
  "visual": { "headline": "...", "note": "...", "footer": "...", "artefact_json": "..." }
}
```

Assembled into the final post as: **Hook → Problem → Solution → 3 bullets → CTA.**

Hard requirements:

- All seven fields present and non-empty.
- **At least 3 bullets**, at most 5.
- `hook` ≤ 120 characters. A hook that needs a paragraph is not a hook.
- Assembled text ≤ **3000 characters** (LinkedIn's limit).

## Rule 3 — Format tells

- **≤ 3 hashtags.** More than that is a 2019 growth-hack ghost.
- **No em-dashes (`—`).** The most reliable machine fingerprint in the language.
- **No emoji-led bullets** (`🚀 Do the thing`). Listicle padding.
- **≤ 5 emoji total.**
- **No `!!`.** One exclamation mark is a choice; two is a robot performing enthusiasm.
- **No sentence opening with** `Furthermore`, `Moreover`, `Additionally`, `Firstly`.

## Rule 4 — Voice

The target is a founder typing between calls, not a brand account.

**Yes:**
> Cold calling is buns.

> HubSpot is a mess without sync.

> I wasted 10 hours on data entry so you don't have to.

**No:**
> In today's fast-paced sales environment, organizations must leverage cutting-edge
> solutions to unlock their full revenue potential.

What makes the difference:

- **Specific numbers over adjectives.** "10 hours" beats "significant time savings."
- **Name real tools.** HubSpot, Salesforce, Apollo, Clay, Zapier. Naming things is
  what someone who has actually used them does.
- **Short sentences.** Fragments are fine. Rhythm matters more than grammar.
- **Concede something.** A post that admits a tradeoff reads as human. One that only
  sells reads as an ad.
- **First person, past tense, specific.** "I broke this" beats "one might encounter."

## Rule 5 — Low-friction CTA

The ask should cost the reader almost nothing. This is a content engine, not a
closing sequence.

**Yes:** "If your CRM is a graveyard, reply GRAVEYARD and I'll send the audit sheet."
**Yes:** "Curious what yours looks like — what's your worst data-entry task?"
**No:** "Book a 30-minute discovery call to learn how we can transform your pipeline."
**No:** "Thoughts?"

---

## Tuning

Edit the arrays in `scripts/validate_post.js` (`BANNED_PHRASES`, `LIMITS`) and mirror the
change into the `Validate Anti-Slop` Code node. `npm test` — well, `node --test` — will
tell you if you broke something.

If a rule fires too often and the rewrites are worse than the originals, that rule is
wrong. Delete it. A protocol that blocks good writing is just a different kind of slop.
