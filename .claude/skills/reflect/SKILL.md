---
name: reflect
description: "Capture an agent experience note into the commit message — the lived reasoning behind a change (what was learned, what was rejected, what future-you must not break), written where the work happens so it travels with the code. Use right after finishing a meaningful chunk of coding/writing, when about to commit, or to amend the last un-pushed commit. Skip for mechanical changes. Feeds the squash-time distiller and the learning skills."
---

# Reflect — experience notes in the commit message

You did the work, so you hold context that exists nowhere else and lasts about five
minutes: the false starts, the *why*, the thing that surprised you. This skill serialises
that context into the **commit message** while you still have it, so a future you — in the
IDE, with only `git log` and `git blame` on the file in front of you — gets it back at the
exact spot it matters.

This is **judgment work, not a logging step.** Most commits deserve no note. The value is
in the few that do, and in the compression. A note on every commit is noise the
squash-time distiller has to filter back out.

## Where this sits in the pipeline

```
/reflect (here)        →  WIP commit messages          [episodic, provisional, disposable]
PR review + bots       →  PR comments                  [external critique, via assess-comments]
            ↓ at squash/merge
distiller (later skill)→  surviving commit trailers    [durable, location-reachable]
            ↓
promotion              →  learning skills / memory      [cross-cutting, always-loaded]
```

Two rules follow from this and they are not negotiable:

1. **WIP notes are provisional and disposable.** Squash throws them away. So write freely —
   being wrong here is *fine*, it's the interim space. Do **not** treat a WIP note as the
   durable record.
2. **The durable write happens later, once, at squash** — by the distiller (or you,
   pre-merge), after the PR has had its say. Never promote a note to "final" mid-cycle; the
   review may overturn it.

## Step 1 — Is it worth a note? (default: no)

Write a note only if one of these is true. If none are, **commit normally and stop.**

- You **learned** something a future editor here wouldn't know from the diff (a tooling
  gotcha, a non-obvious cause, a "looks wrong but isn't").
- You **rejected** an approach for a reason that isn't visible in the result.
- You established a **constraint** that's load-bearing — quietly breaking it would be a bug.
- You're leaving a **directive** for whoever touches this next ("don't reintroduce X here").
- The change rests on something **that will go stale** (a preview feature, a version-pinned
  fact) and should be re-checked later.

Skip: typo fixes, renames, formatting, dependency bumps, pure mechanical edits, anything
where the diff fully explains itself.

## Step 2 — Write the note

**Prose reflection → commit body.** One short paragraph, in plain language. This is what a
human reviewer reads and what a semantic-matching history bot recalls on. Keep it about
*this change*; cross-cutting lessons go to a learning skill instead (see Step 3).

**Atomic facts → trailers.** Flat `Key: value`, one line each, in a single contiguous block
at the very end of the message, no blank lines inside the block (git's trailer parser needs
this — a stray blank line or an earlier `Foo: bar` line in the body will break extraction).

### Trailer vocabulary, message shape, and format rules

These are defined once in [`../_shared/commit-trailers.md`](../_shared/commit-trailers.md) so
they can't drift between this skill and `/finalize`. **Read it now** for the core vocabulary
(`Constraint` / `Rejected` / `Directive` / `Learned`), the situational fields, the
`DOC-XXXX` subject convention, and the format rules that keep trailers parseable.

The one rule worth repeating here: a field only earns its place if reading it before touching
the code would change a decision. When in doubt, leave it out and let the body prose carry it.

## Step 3 — Sort: where does this note belong? (decide *before* you commit)

The sort picks the destination, so it must run **before** Step 4 lands anything — once a note
is committed or amended in, you can't honour a "this didn't belong in the commit" decision
without a rewrite.

- **Location-bound** — a future agent editing *this file/area* is who needs it → it goes in
  the commit message (Step 4).
- **Cross-cutting** — it must apply regardless of what's being edited (a user preference, a
  process rule, a standing gotcha like "check the running image, not the client version") →
  a commit can never guarantee it'll be seen, so flag it for promotion to the relevant
  **learning skill** or **memory**. Tell the user what you're proposing to promote and where;
  don't edit a learning skill silently.

A note can **split**: the location-bound part goes in the commit, the cross-cutting part gets
promoted. Decide the split here, then carry only the location-bound part into Step 4.

## Step 4 — Land the location-bound part on the commit

- **Not yet committed** → fold the body + trailers into the commit message you're about to
  write. (Preferred — no rewrite.)
- **Already committed, not pushed** → `git commit --amend` to add the note.
- **Already pushed** → do *not* amend (it rewrites shared history). Either carry the note on
  the next related commit, or leave it for the squash-time distiller to pick up from your
  working notes. Say which you did.

Verify the trailers parse before finishing:

```
git log -1 --format='%(trailers:only,unfold)'
```

If that prints nothing but you wrote trailers, the block isn't contiguous/last — fix the
blank lines. (Format and `unfold` rules:
[`../_shared/commit-trailers.md`](../_shared/commit-trailers.md).)

## Limits (read honestly)

- This captures *episodic* notes. It does **not** produce the durable record — that's the
  squash-time distiller's job, and it should run after review, not now.
- It cannot make a note correct. A confidently-wrong reflection that survives into a durable
  trailer is worse than none, which is exactly why the durable write is deferred and
  reviewable.
- It will not catch cross-cutting lessons by itself — Step 3 is manual judgment, and if it's
  skipped the learning-skills tier quietly starves.
- The temptation is to over-capture because schemas are satisfying to fill. Resist it; an
  empty note is the right output for most commits.
