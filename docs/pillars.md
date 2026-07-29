# The 4 Pillars

Every post maps to exactly one pillar. Nothing gets written "in general" — a post
without a pillar is a post without a reason to exist.

| Pillar | Shorthand | What it does | Reader leaves with |
|---|---|---|---|
| **Educational** | Aha! moments | Teaches one specific mechanic, usually by flipping something the reader believed | A thing they can do today |
| **Social Proof** | Receipts | A concrete result with real numbers | Evidence that this works |
| **Thought Leadership** | Anti-Cold Call | Argues a position on why outbound is broken | A side to agree or disagree with |
| **Personal** | Founder Behind the Bot | Malek as a person, not a vendor | A reason to trust the human |

## Rotation

3 posts per week, 4 pillars. Rotation is **deterministic** — derived from the ISO week
number, so there's no counter to store, nothing to drift, and no risk of the same pillar
running three weeks straight because a state write failed:

```js
pillarIndex = (isoWeekNumber * 3 + i) % 4   // i = 0, 1, 2
```

Because 3 and 4 are coprime, this cycles through all four pillars evenly. Over any four
consecutive weeks each pillar appears exactly three times:

| Week | Post 1 | Post 2 | Post 3 |
|---|---|---|---|
| n   | Personal | Educational | Social Proof |
| n+1 | Thought Leadership | Personal | Educational |
| n+2 | Social Proof | Thought Leadership | Personal |
| n+3 | Educational | Social Proof | Thought Leadership |

(Exact starting offset depends on the week number; the pattern is what matters.)

## Guardrails per pillar

**Educational.** The "aha" has to be something that is actually counterintuitive. "Use
automation to save time" is not an aha. "Syncing nightly is worse than not syncing,
because it makes people trust stale data" is.

**Social Proof.** Numbers must be real. The workflow prompt explicitly forbids inventing
named customers, testimonials, or statistics attributed to real companies. Where there's
no client detail available, the post is written as Malek's own result from building
LeadSync — which is true and still counts as a receipt.

**Thought Leadership.** Must take a side someone could disagree with. If nobody could
object to it, it's a status update wearing a suit. The prompt requires naming the
counterargument and answering it.

**Personal.** No moral at the end. The tell of a fake founder story is the tidy lesson
in the last line. Specific, slightly unflattering detail is what makes these land.

## Changing the pillars

Pillar names live in the `Set Config` node in n8n (`pillars` array) and in the system
prompt (`prompts/system-prompt.md`). Change both. The rotation math works for any
pillar count that is coprime with 3 — so 4 pillars is fine, 5 is fine, 6 would give you
an uneven cycle.
