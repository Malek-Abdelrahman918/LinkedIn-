# Publishing — the sheet is the queue

The generator writes three posts every Monday and dates them Monday, Wednesday and
Friday. The publisher (`ed3rmPiKQGB7Wu9t`) runs **daily at 11:00 Africa/Cairo**, takes
the rows dated today, and posts them to LinkedIn with their card image. Three dated
rows, one daily run, three posts a week.

```
Every Morning (daily 11:00 Cairo)
  → Read Posts        the whole Posts tab
  → Due Today         rows dated today that are safe to publish
  → Render Card       screenshots the card page into a PNG
  → Post to LinkedIn  image post, public
  → Mark Posted       writes POSTED back to the row
```

## What gets published, and what does not

`Due Today` is the gate. A row goes out only if all of these hold:

| Check | Why |
| --- | --- |
| `Post Date` is today | The date in the sheet is the schedule. |
| `Status` is `DRAFT` or `APPROVED` | See below. |
| `The Text` is non-empty | Nothing to post otherwise. |
| `Image Idea` is a renderer URL | See "stale rows". |

Statuses:

- **DRAFT** — passed the anti-slop validator. Publishes automatically.
- **APPROVED** — you released it by hand. Publishes automatically.
- **VERIFY_NUMBERS** — **held.** These posts contain figures the model invented. The
  digest says so in the email. A schedule should not decide to publish an invented
  number to a real audience, so the row waits until you change the cell to `APPROVED`.
- **NEEDS_REWRITE** — held. Failed the validator twice.
- **POSTED** — written back after LinkedIn accepts the post. A row can never go out
  twice, and re-running the publisher on the same day is a no-op.

## Two things the dry run caught

**Stale rows.** The sheet still holds rows from before the image work, whose
`Image Idea` column is a prose description rather than a card URL — and whose copy is
the old generic B2B sales material, not real estate. The first dry run selected one of
them for 2026-07-31 and the renderer rejected it with a 400. Requiring the column to be
a renderer URL keeps those rows out of the queue entirely, instead of failing at render
time. It also means any row from the current system is publishable and any row from
before it is not, which is the behaviour you want.

**Duplicate dates.** Every generator run appends a fresh set of three rows, so several
rows can share a `Post Date`. Without a cap the publisher would post all of them that
day. `Due Today` returns at most one row per day and logs how many it left behind.

## Setup

Done. The `LinkedIn account` credential is connected to the **Post to LinkedIn** node
and the author is pinned to the person URN resolved through it. The workflow is active.

If the credential is ever replaced, re-resolve the author: the *Person* dropdown on that
node reads the profile from the credential, and a stale URN posts as nobody.

## What is verified and what is not

Verified: the sheet read, the date and status gate, the stale-row guard, the one-per-day
cap, and the render — a 374 kB PNG came back for the row selected for 2026-07-31.
Resolving the profile name through the credential is itself a live authenticated call to
LinkedIn, so OAuth works.

Not verified: **the post call and the `Mark Posted` write-back.** Proving those means
publishing something real. Two things could still bite:

- The app may be missing the `w_member_social` scope. Auth succeeding does not imply
  permission to post.
- The image upload is a separate LinkedIn API step from the text.

Activation was safe to do blind because nothing is dated today — the queue was run with
publishing disabled first and returned zero rows. The first live post is the real test.
