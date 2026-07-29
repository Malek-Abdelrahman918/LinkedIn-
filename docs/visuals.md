# The Visual — artefact and annotation

Every post generates its own image. Not an illustration of the post: the thing the post
is arguing about, marked up in red pen.

A card is four parts.

| Part | What it is |
| --- | --- |
| **Headline** | Handwritten, top left. Names what we are looking at. `monday's portal leads.` |
| **Artefact** | A realistic screenshot: a spreadsheet, a WhatsApp thread, a calendar day, a portal listing. Rotated −1.2° with a drop shadow, so it reads as a printout on a desk. |
| **Pen** | Red marks on the artefact, plus the verdict handwritten underneath with a scrawled underline. |
| **Footer** | One quiet typed line. The thought you leave with. |

Ground is warm off‑white `#EDEAE3`. Handwriting is Caveat, the footer is Architects
Daughter, the artefact uses the system UI stack so it looks like a real app.

## Why the pen is measured, not placed

The obvious way to draw an ellipse is to write down its coordinates. That works exactly
once. The model decides how many rows the spreadsheet has and how long each label is, so
fixed coordinates land on whatever happens to be in that spot.

An early calendar card had its marks hardcoded. The note said *six hours of admin, two
hours of selling*, and the pen circled the two Viewing rows — the selling. The card
argued against itself.

So the page draws its own ink. It waits for `document.fonts.ready`, reads the bounding box
of every element carrying `data-ring`, unions them per group, and draws around what is
actually there. It also decides *what* to draw:

- **Ellipse** for anything that fits inside one. On a wide mark the radii stay tight, or
  the arcs reach into the rows above and below and circle those too.
- **Bracket in the margin** when a group spans the artefact and is more than one row deep.
  An ellipse that wide has to bulge off the card. The artefact gets a right margin to
  bracket in, the way a printed schedule has one.
- **Arrow** only from an ellipse. An arrow drawn to a margin bracket points at blank paper.

The artefact is sized in `em` off a single value, so a sheet the model gave nine columns
to shrinks until it fits rather than running off the edge.

## The spec

The model returns a `visual` object with the post:

```json
{
  "headline": "tuesday. my actual calendar.",
  "note": "six hours of admin.\ntwo hours of selling.",
  "footer": "i did not hire an agent. i hired a data entry clerk.",
  "artefact_json": "{\"type\":\"calendar\",\"slots\":[...]}"
}
```

`artefact_json` is a string because the four artefact shapes are a union, and the
structured-output parser can only hold one shape. It is parsed and checked in the same
pass as the text: a visual that will not render is a violation like any other and goes
through the existing rewrite loop.

### Artefact types

| Type | Use it for | Marked with |
| --- | --- | --- |
| `sheet` | logs and comparisons: call logs, response times, one listing across three portals | `mark` on a row |
| `chat` | enquiries, response time, WhatsApp | `mark` on a message |
| `calendar` | where the day actually goes | `mark` on a slot; `tone` is `admin`, `sell` or `neutral` |
| `listing` | listings, pricing, portal hygiene | `mark` on a badge, `photoMark`, `priceMark` |

In a `sheet`, a cell prefixed `!` prints red and `~` prints green. The marker used to be
`+`, which ate the plus on every UAE phone number and tinted it green.

## Rules the validator enforces

1. **Something must be marked.** An unmarked artefact is a screenshot, not a card.
2. **Rows must match the column count.** A ragged row silently loses data.
3. **The note must fit.** Each line under 52 characters, or Caveat at 47px overflows.
4. **The artefact must have enough in it to be real.** Four rows, five slots, three messages.

Two rules the validator *cannot* enforce, which is why the digest still asks you to look:

- Every number in the note must be countable off the artefact. A note saying "six hours of
  admin" needs exactly six admin slots.
- The note must not claim what the artefact does not show. A card showing one listing
  cannot say "cheapest of the three". An early draft did exactly that.

## How it renders

`docs/card.html` is the page. It is self-contained — fonts embedded, no network — and
reads its spec from the URL hash, so the workflow builds a ~1.2 kB URL and the post
content never reaches a server as a query parameter or a log line.

It has to be served as real `text/html`, which is harder than it sounds. Both obvious
hosts fail, and both fail *silently* — they return 200 and a valid PNG of the wrong page:

- **rawcdn.githack.com** answers with a click-through interstitial ("One more step").
- **cdn.statically.io** serves the file as `text/plain`, so the screenshot is the source.

The tell was three different specs producing byte-identical PNGs. A separate n8n
workflow, **LeadSync Card Renderer** (`jiOceub7MxpBrjv0`), fetches the page from the repo
and returns it with the right content type. `cardBase` in **Set Config** points at its
webhook; the renderer pins the page to a commit, so a redesign is a deliberate act rather
than something that silently alters every card already in the sheet.

The workflow then screenshots that URL. Anything that can screenshot a page will do; the
current setup uses a free screenshot API, 3 renders a week against a 25-a-day limit, and
`Render Cards` continues on error so a render outage costs the images, never the drafts.

## Working on the design

```bash
node render/preview.js                  # renders render/samples.json to render/out/
node render/preview.js my-specs.json    # any file of specs
node render/build-shell.js              # regenerate docs/card.html after a change
node --test render/artefacts.test.js scripts/validate_post.test.js
```

`render/artefacts.js` is shared between Node and the page, so the preview and production
cannot drift. **Look at the output.** Every defect in this design was found by opening the
PNG, and none of them by reading the code.
