# Contributing to Redis docs

Thanks for helping keep our docs accurate and useful. Docs are part of a feature's definition of done — this guide is everything you need to contribute with minimal friction.

> **Fastest path:** check for an existing page → copy a template → draft with AI in the repo (it already knows our style) → run the self-check → open a PR. Details below.

## Do I need to write docs for this change?

- **No user-facing change** (refactor, internal, tests, CI) → **no docs.** Note "no docs needed" on your PR.
- **New product or feature area** → **yes** — start with the docs team on where it lives before writing.
- **New feature, behavior, or setting** → **yes** — a short task or concept page.
- **New or changed API / config field** → **update the reference** (often auto-generated — check with the docs team first).

When unsure, ask in **#docs** — a 30-second question beats a missed page.

## The golden path

Each step names the actual action — a prompt to the AI, a command, or a click.

1. **Check what already exists.** Ask Claude or Codex in the repo: *"Is there already a page about `<topic>` under `content/`? If so, where, and should I add to it instead of making a new one?"* — or in the editor, `Cmd/Ctrl+Shift+F` across `content/` for the topic, and check the search box on the docs site. If there's a related page, add to it instead of creating a new one.
2. **Create a branch and stamp out the template.** From an up-to-date `main`, `git checkout -b DOC-xxxx` (or ask the AI to). Then generate the page from the right archetype: `hugo new content/<path>/<page>.md --kind task` (or `concept` / `reference`) — that drops in the template with frontmatter and section scaffolding. Open the new file.
3. **Draft with AI in the repo.** In the Claude Code (or Codex) panel, paste your source material and ask it to draft — *"Draft this task page from these notes: `<spec>`."* It reads the committed `CLAUDE.md` automatically, so the draft comes out in our voice, naming, and shortcodes.
4. **Self-check and preview.** Run `/docs:review-doc` — or manually: `vale content/<path>`, the link check, and `make serve`, then open `http://localhost:1313` to eyeball the page. Fix what's flagged, then actually run the steps or commands the page describes to confirm they work.
5. **Open a PR.** Commit and push the branch (or tell the AI "commit and push this branch"), then open a PR on GitHub — the PR template auto-loads the docs checklist, so fill it in and request a reviewer. A docs teammate reviews for voice, structure, and placement, then merges. Merging to `main` publishes to the live site automatically — so review happens *before* merge, and changes to sensitive areas (security, release notes) always get a human reviewer first.

## Templates

Per-type starting points live in **`archetypes/`**: `task` (how-to), `concept` (what/why), `reference` (fields/options). To use one, run `hugo new content/<path>/<page>.md --kind task` (or `concept` / `reference`), or copy the archetype file into place. Each has inline guidance — delete the comments before publishing.

## Style

We follow Google developer style. The full rules live in the committed **`CLAUDE.md`**, so AI drafting in the repo inherits them automatically. The short version: write to "you," active voice, present tense; sentence-case headings; verb-first task titles; angle-bracket `<placeholders>` in code; descriptive link text; no marketing language.

To check a draft against the style, run `/docs:review-doc`, or ask the AI: *"Check this page against our style rules in `CLAUDE.md` and flag anything off."*

## What makes a PR ready for review (the bar)

A docs teammate edits *from* your draft — they can't rewrite it from scratch. Before you request review, make sure it:

- [ ] Uses the right **template** (structure is there)
- [ ] Is **placed sensibly** — folded into or cross-linked with related docs, not an orphan or duplicate
- [ ] **Builds clean**, with complete frontmatter (CI will tell you)
- [ ] Is **technically accurate — and you've tested it** (followed the steps / ran the commands / checked the output), not just written it — the part only you can guarantee

Run `/docs:review-doc` before you open the PR — it checks most of these at once (template, placement, build, frontmatter). The last one, testing it, is the part only you can do.

If it's missing these, we'll send it back with a pointer — not to be difficult, but because that bar is what lets a small docs team keep up.

## Who owns what

**You** own technical accuracy and a solid first draft. **The docs team** owns voice, structure, and where it lives in the docs.

## Getting help

Ask in **#docs**, or tag a docs teammate on your PR.
