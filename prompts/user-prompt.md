# User Prompt Templates

> Mirrored into the n8n workflow. `{{ }}` values are n8n expressions resolved at runtime.

---

## 1. Generation (`Write Post (GPT-4o)`)

```
Write this week's LinkedIn post.

PILLAR (write to this one, copy it into the "pillar" field exactly):
{{ $json.pillar }}

ANGLE — the trend or pain point this post is about:
Headline: {{ $json.title }}
Summary:  {{ $json.summary }}
Source:   {{ $json.link }}

Treat the source as raw material, not as the subject. Do not summarise the article and
do not write "I read an article about...". Use it as evidence for a point Malek is
making about manual sales work.

If the angle is thin or off-topic, ignore it and write to the pillar using the pain
point in the headline as a jumping-off point. A good post about a weak source beats a
faithful post about a strong one.

ALREADY POSTED — do not repeat these hooks, claims, or framings:
{{ $json.recentHooks }}

Return only the JSON object.
```

## 2. Rewrite (`Rewrite Post (GPT-4o)`)

Fires once when the validator rejects the first draft. The violations are fed back
verbatim so the model fixes the actual problem instead of rewriting blind.

```
Your previous draft was rejected by the Anti-Slop validator.

VIOLATIONS — every one of these must be gone:
{{ $json.violations }}

YOUR REJECTED DRAFT:
{{ $json.draftJson }}

Rewrite it. Keep what worked: the pillar, the angle, and any specific numbers, tool
names, or concrete details. Fix only what the violations name, plus anything else that
reads like it was generated rather than written.

Do not fix a banned phrase by swapping in a synonym for the same empty idea. If the
sentence said nothing, cut it and say something.

PILLAR: {{ $json.pillar }}

Return only the JSON object, same schema as before.
```
