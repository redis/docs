# Contributing to Redis docs

Thanks for helping keep our docs accurate and useful. Docs are part of a feature's definition of done — this guide is everything you need to contribute with minimal friction.

> **Fastest path:** check for an existing page → copy a template → draft with AI in the repo (it already knows our style) → run the self-check → open a PR. Details below.

## Do I need to write docs for this change?

- **No user-facing change** (refactor, internal, tests, CI) → **no docs.** Note "no docs needed" on your PR.
- **New feature, behavior, or setting** → **yes** — a short task or concept page.
- **New or changed API / config field** → **update the reference** (often auto-generated — check with the docs team first).

Full policy: [Definition of Done: Docs](./docs-definition-of-done.md). When unsure, ask in **#ask-docs** — a 30-second question beats a missed page.

## The golden path

1. **Check what exists.** Search the docs for your topic; if there's a related page, add to it instead of creating a new one.
2. **Copy the template** for your doc type from `archetypes/` (`task` / `concept` / `reference`), or run `hugo new content/<path>/<page>.md --kind task`.
3. **Draft with AI in the repo.** Claude inherits our style from the committed `CLAUDE.md` — give it your notes and ask it to draft in our conventions.
4. **Self-check.** Run `/docs:review-doc` (or at least Vale + the link check + a local `hugo` build) and fix what it flags.
5. **Open a PR** and fill the docs checklist. A docs teammate reviews for voice and structure, then merges.

## Templates

Per-type starting points live in **`archetypes/`**: `task` (how-to), `concept` (what/why), `reference` (fields/options). Each has inline guidance — delete the comments before publishing.

## Style

We follow Google developer style. The full rules live in the committed **`CLAUDE.md`**, so AI drafting in the repo inherits them automatically. The short version: write to "you," active voice, present tense; sentence-case headings; verb-first task titles; angle-bracket `<placeholders>` in code; descriptive link text; no marketing language.

## What makes a PR ready for review (the bar)

A docs teammate edits *from* your draft — they can't rewrite it from scratch. Before you request review, make sure it:

- [ ] Uses the right **template** (structure is there)
- [ ] Is **placed sensibly** — folded into or cross-linked with related docs, not an orphan or duplicate
- [ ] **Builds clean**, with complete frontmatter (CI will tell you)
- [ ] Is **technically accurate — and you've tested it** (followed the steps / ran the commands / checked the output), not just written it — the part only you can guarantee

If it's missing these, we'll send it back with a pointer — not to be difficult, but because that bar is what lets a small docs team keep up.

## Who owns what

**You** own technical accuracy and a solid first draft. **The docs team** owns voice, structure, and where it lives in the docs.

## Getting help

Ask in **#ask-docs**, or tag a docs teammate on your PR.
