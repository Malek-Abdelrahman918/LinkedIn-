# The 4 Pillars

Every post maps to exactly one pillar. Nothing gets written "in general" — a post
without a pillar is a post without a reason to exist.

| Pillar | Shorthand | What it does | Reader leaves with |
|---|---|---|---|
| **Educational** | Aha! moments | Teaches one specific mechanic, usually by flipping something the reader believed | A thing they can do today |
| **Social Proof** | Receipts | A true own result, or a labelled worked example | Evidence that this works |
| **Thought Leadership** | The Argument | Argues a position on how this work should be done | A side to agree or disagree with |
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

## Layout rotation

The card layout rotates on the same mechanism, from the same ISO week number:

```js
layoutIndex = (isoWeekNumber * 3 + i) % 5   // i = 0, 1, 2
```

Three posts a week and five layouts are coprime, so all five come up evenly and the
three posts in any one week never share a shape. The layout is **assigned**, not chosen:
left to itself the model picks one structure and stays there, which is the repeated
template problem in a new coat. The brand does not move. Only the structure does.

| Week | Post 1 | Post 2 | Post 3 |
|---|---|---|---|
| 36 | thread | panel | statement |
| 37 | flow | terminal | thread |
| 38 | panel | statement | flow |
| 39 | terminal | thread | panel |

Writing to an assigned layout is a feature rather than a constraint to route around. A
terminal card forces the mechanic into pseudocode; a thread forces the writer to find
the conversation in the story. The same week's material comes out differently depending
on which shape it has to fit.

## Guardrails per pillar

**Educational.** The "aha" has to be something that is actually counterintuitive. "Use
automation to save time" is not an aha. "Syncing nightly is worse than not syncing,
because it makes people trust stale data" is.

**Social Proof.** There are exactly two legal shapes, and the prompt's HONESTY section
draws the line. Either a result that actually happened, which includes Malek's own
internal tooling and the workflows he has shipped. Or a worked example that says so in
the post text, opening with "Example, not a client:". What is banned is the third shape:
an invented result presented as delivered work. Named customers, testimonials and
statistics attributed to real companies are never allowed, labelled or not.

A claim about how the work usually goes is not a company claim and needs no label.
"Enquiries that land after 10pm get answered the next morning" is an observation about
the world. Only claims about what LeadSync did, fixed, or would do carry the label.

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
