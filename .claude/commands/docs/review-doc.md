---
description: Self-review a docs change against the style rubric + deterministic gates before opening a PR
argument-hint: (no args — reviews changed docs on the current branch)
---

<!--
FIRST CUT. The QUALITY RUBRIC below is the docs-team lane. The MECHANICS
(how it runs Vale / links / build / the model) are for the automation + AI folks to design and change freely.
-->

# /docs:review-doc — self-review before you open a PR

Purpose: a contributor runs this on their changed docs so problems get caught *before* a human review — keeping the docs-team gate fast.

## What it checks

**Deterministic (wire to existing tooling):**
- **Vale** — style + terminology, on changed files only
- **Links** — relref / shortcode paths resolve (reuse the shortcode-path hook)
- **Build** — `hugo` builds clean
- **Frontmatter** — present + complete: `title`, `linkTitle`, `description`, `weight`, `categories`

**AI rubric (the judgment layer — the part that needs a model):**
- **Voice:** addresses "you," active voice, present tense; no marketing words ("seamless," "powerful," "simply")
- **Structure:** matches the template shape for the doc type; sentence-case headings; verb-first task titles; one action per step
- **Coverage / IA:** does this duplicate or belong inside an existing page? → suggest fold-in or cross-links
- **Placeholders & security:** code uses `<angle-bracket>` placeholders; no real credentials, PII, IPs, or keys
- **Minimalism:** flag intro fluff, redundancy, and jargon

## Output
A per-item checklist (pass / fix), each fix with a line pointer and a concrete suggestion, ending with a **"ready for review?"** verdict.

## Mechanics (teammate lane — stub, design freely)
- Scope to changed files via `git diff` (the `/edit` skill already does this — reuse it).
- Model: per the plan's model strategy (Opus for the rubric gate; Haiku for the deterministic pass). <!-- TODO: confirm -->
- Follows Andy's `/docs:*` command pattern.
