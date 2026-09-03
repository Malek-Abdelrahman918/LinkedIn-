# The Visual — brand layouts

Every post generates its own image. Not an illustration of the post: the thing the post
is arguing about, drawn in the LeadSync brand.

Ground is navy `#001B3D` with a soft cyan bloom top right. Cyan `#0CC0DF` is an accent
and never a fill. Type is Inter; anything representing data is JetBrains Mono. Every card
carries a chip naming the service line, the wordmark bottom left and the domain bottom
right, so five different layouts still read as one account.

## The five layouts

| Layout | For | Body |
| --- | --- | --- |
| **statement** | One claim that needs no diagram | A headline and a sub line |
| **flow** | A process with a before, a middle and an after | Two or three linked nodes |
| **terminal** | A rule that is clearer as code | A titled window of pseudocode |
| **thread** | Enquiries, response time, support | A short message thread |
| **panel** | A before and after across several things | Three to five `from → to` rows |

The model picks the layout. The prompt tells it not to default to one, and the four
pillars pull in different directions anyway, so the feed does not settle into a single
shape the way the old single-template card did.

## The accent is written inline

The cyan words are marked in the headline with pipes:

```
"Nobody was hired to |move data| between tabs."
```

An earlier design took a separate `accentWords` field. That invites the model to name a
word that is not actually in the headline, and then nothing highlights. Pipes cannot
disagree with the text they are in. The validator rejects an unclosed pipe.

## Why there is a validator at all

The card is generated, so it can be wrong in ways a designer never would be: nine nodes
in a three-node row, a code line that runs off the edge, a chip that names a service the
post is not about. `validateVisual` checks the layout, the chip, the pipes and the
per-layout field counts and lengths before the row is written. A card that fails sends
the post back through the rewrite loop.

The limits are not arbitrary. They are the numbers at which the layout stops fitting
1024×1024, found by rendering.

## Auto-fit

Headlines and code blocks are the two things that overflow. The page shrinks the
offending element until it fits rather than letting it run off the card, then sets
`data-ready="1"`. The screenshot service waits on that attribute, so nothing is captured
mid-layout or mid-font-swap.

## How the page gets served

The spec travels in the URL fragment, base64url encoded, so it never reaches a server or
a request log. `render/brand.js` is inlined verbatim into the page rather than
reimplemented, so the local preview and the thing that actually gets screenshotted cannot
drift apart.

The page has to be served as real `text/html` for a screenshot service to render it, and
GitHub's file CDNs will not do that, so n8n serves it from `/webhook/brand-card`. The old
`/webhook/card` path still serves the paper card, because rows already in the sheet carry
old-format specs and would otherwise render a rejection notice.

## Working on it

```
node render/brand-preview.js          # render every sample to render/out/brand/
node render/build-brand-shell.js      # regenerate docs/brand-card.html
node render/build-brand-webhook.js    # emit the n8n node source
```

**Look at the output.** Every defect in this design was found by opening the PNG, and
none of them by reading the code. Two worth remembering:

- Five cards once came back byte-identical from the hash path. That was not the renderer
  working, it was the test harness: changing only the URL fragment does not reload the
  page, so every screenshot was of the first spec. Identical output across different
  inputs is the tell.
- The cyan accent silently did nothing on four of five layouts, because the CSS styled
  `h1 .hi` and four layouts use `h2`.
