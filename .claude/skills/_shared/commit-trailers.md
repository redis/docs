# Commit trailer vocabulary & format (shared)

Canonical definition of the experience-note trailer vocabulary and the commit-message format,
shared by **`/reflect`** (which *writes* notes) and **`/finalize`** (which *distills* them into
the durable squash commit). Both skills reference this file so the vocabulary can't drift
between capture and distillation. Change it here, once.

> This file is referenced by `.claude/skills/reflect/SKILL.md` and
> `.claude/skills/finalize/SKILL.md`. It is **not** a skill itself (no `SKILL.md`), so it
> won't be invoked directly.

## Subject line

This repo does **not** use Conventional Commits (`type(scope):`). The subject stays in the
existing house convention — `DOC-XXXX <summary>` (the Jira workflow keys off the ticket id),
or the `RS:` / `DEV:` area prefixes. Neither skill rewrites the subject; they own the **body
and the trailers** only.

## Trailer vocabulary

**Core** — reach for these first; each one changes what a future agent *does*:

| Trailer | Use it for |
|---|---|
| `Constraint:` | A load-bearing invariant. Breaking it is a bug. |
| `Rejected:` | `<approach> \| <why not>` — a dead end already burned, so it isn't re-proposed. |
| `Directive:` | A message to the next editor of this code, pinned here. |
| `Learned:` | One-line index to the body reflection (keeps "show me commits that taught us something" a clean `git log` query). |

**Situational** — only when they genuinely apply:

| Trailer | Use it for |
|---|---|
| `Reversibility:` | `clean` / `migration-needed` / `irreversible` — how freely a future agent can experiment here. |
| `Gaps:` | What was *not* verified — where to be skeptical / add tests. |
| `Ticket:` | `DOC-NNNN` or a link, so commits thread back to the ticket. Duplicates the subject's id on purpose — belt-and-braces, and keeps the trailer query clean if the subject convention ever changes. |
| `Recheck:` | An expiry *condition* for a fact that tracks a moving target, e.g. `when AR* commands reach GA`. (Especially for docs.) |

**A field only earns its place if reading it before touching the code would change a
decision.** Provenance-only fields ("this came from review") don't qualify — don't invent
fields casually. Prose belongs in the body, not in a trailer value.

## Message shape

```
DOC-XXXX <summary>

<the change in a sentence or two, then prose — the why, the surprise, the
dead end. This is what humans and the semantic history bot read.>

Learned: <one-line index to the body>
Constraint: <invariant that must hold>
Rejected: <approach> | <reason it was dropped>
Directive: <warning to the next editor>
Ticket: DOC-XXXX
```

## Format rules (or the trailers won't parse)

- Trailers are a single, **contiguous block at the very end** of the message — no blank lines
  *inside* the block, and nothing after it.
- A stray blank line in the block, or an earlier `Foo: bar`-looking line in the body, will
  break git's trailer extraction. Keep `Key: value` patterns out of the prose body.
- Keep each value on **one line** where you can. Standard trailers (`Co-Authored-By`, etc.)
  live in the same block and are fine.

## Reading trailers (downstream consumers)

Always pass `unfold`, or a value folded across lines (RFC-822 continuation) comes back
wrapped and a naive reader sees a truncated/oddly-split value:

```
git log -1 --format='%(trailers:only,unfold)'                     # verify a single commit
git log --reverse main..HEAD --format='%(trailers:only,unfold)'   # all notes on a branch, oldest-first (the distiller's input)
git log -1 --format='%(trailers:key=Learned,valueonly)'           # one keyed field
```

If a verify prints nothing but trailers were written, the block isn't contiguous/last — fix
the blank lines.

## Author-reflection PR comments (the fallback channel)

When a note can't go on a commit (e.g. the commit is already pushed), `/reflect` may post it
as a PR comment instead. To stop `/finalize` from mistaking it for reviewer critique, such a
comment **must begin with the marker line**:

```
<!-- reflect-note -->
```

`/finalize` treats PR comments **with** this marker as author-side reflection (part of the
oldest-first arc) and comments **without** it as reviewer/bot critique. The marker is an HTML
comment, so it's invisible in the rendered PR.
