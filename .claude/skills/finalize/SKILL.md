---
name: finalize
description: "Distil a PR's accumulated knowledge into the durable squash commit message — reconcile the /reflect experience notes across its commits with the review feedback into one end-state record, and propose promoting cross-cutting lessons to learning skills/memory. Use just before squash-merging a PR. Prepares the message and the gh merge command; does not merge."
---

# Finalize — distil a PR into its durable commit

`/reflect` scatters provisional experience notes across a PR's WIP commits while the work
happens. The PR then accumulates review feedback. **This skill compresses both into the one
commit that survives the squash** — the durable, location-reachable record a future agent
meets via `git log` / `git blame`.

Vocabulary, subject convention, and format are defined once in
[`../_shared/commit-trailers.md`](../_shared/commit-trailers.md) — **read it first**, then
read this for *how to reconcile and where to put the output*.

## Where this sits

```
/reflect          →  WIP commit messages         [episodic, provisional, disposable]
PR review + bots  →  PR comments                 [external critique]
        ↓  THIS SKILL, just before squash
/finalize         →  squash commit message        [durable, location-reachable]
        ↓  fork
promotion         →  learning skills / memory      [cross-cutting, always-loaded]
```

## The one principle: reconcile to the *end state*, not concatenate

The easy version — collect every trailer and paste them in — is wrong, because **the PR's job
is to change its own mind.** A WIP note the PR later contradicted must be **dropped**, not
carried, or it lands frozen and wrong on `main`:

> WIP commit 1: `Rejected: server-side sessions | too much infra`. Review pushes back; commit
> 4 *adopts* server-side sessions. Concatenation carries `Rejected: server-side sessions` onto
> `main` — now actively misleading. Reconciliation drops it (or flips it to a `Constraint`).

So read the whole arc **in order** (commits + comments + check outcomes) and emit only what is
still true at the end. This is judgment work — it's why this is a skill, and why it's a
human-triggered pre-merge step, not an automated merge hook.

## Step 1 — Gather

- **Author-side notes:** `git log main..HEAD --format='%(trailers:only,unfold)'` for the
  trailers, plus the commit bodies for the prose. (Drop the deliberate no-note commits.)
- **Reviewer/bot critique:** the PR comments. Reuse `/docs:assess-comments` if available (it
  already collects, role-tags, and splits open/resolved across tools); otherwise read them
  directly (`gh api repos/<o>/<r>/pulls/<n>/comments`, `.../issues/<n>/comments`,
  `.../pulls/<n>/reviews`). Note which findings were *fixed* vs *dismissed* vs *still open*.
- **Check outcomes:** whether CI / security / Bugbot ended clean.

## Step 2 — Reconcile

Walk the arc in commit/comment order and produce the **end state**:

- **Drop** any WIP note a later commit or review overturned.
- **Merge** duplicates and near-duplicates into one line; prefer the latest, most specific.
- **Resolve contradictions** in favour of what the final code actually does — verify against
  the diff, don't trust the note.
- **Fold in review outcomes** as their *verdict*, not a transcript: a review thread that
  settled on a rule becomes one `Constraint:`; an approach the review killed becomes
  `Rejected:`. Copy what survived, not the conversation.
- An *open* unresolved concern is **not** end-state knowledge — leave it on the PR, don't
  bury it in a trailer.

## Step 3 — Sort & propose promotion

Same split `/reflect` Step 3 makes, now over the reconciled set:

- **Location-bound** (a future agent editing this area needs it) → durable trailer on the
  squash commit.
- **Cross-cutting** (must apply regardless of what's edited — a preference, a process rule, a
  standing gotcha, a project-wide constraint) → **propose** an edit to the relevant learning
  skill or a memory file. A commit can't guarantee it'll be seen. **Propose, don't apply
  silently** — show the user the exact addition and target file.

## Step 4 — Compose

Write the distilled message per the shared shape: `DOC-XXXX` subject, a tight body paragraph
(the durable narrative for humans + the history bot), then the reconciled trailer block. Far
fewer trailers than the inputs held — distillation is compression, not collection.

## Step 5 — Hand off (do **not** merge)

This repo squashes with `squash_merge_commit_message = COMMIT_MESSAGES` (verified
2026-06-25), so the **default** squash body is every WIP commit message concatenated — exactly
the raw dump we're avoiding. Override it explicitly; never rely on the default:

```
gh pr merge <n> --squash \
  --subject "DOC-XXXX <summary>" \
  --body-file <distilled-message-file>
```

Present three things and **stop**:
1. the distilled squash message (subject + body + trailers),
2. any promotion proposals (target file + exact addition),
3. the ready-to-run `gh pr merge … --body-file` command.

The human triggers the merge. Reconciliation is judgment-heavy and a squash-merge is hard to
reverse, so finalize *prepares*; it does not press the button. (An opt-in auto-merge could be
added later, but it inherits all the risk below.)

## Limits (read honestly)

- **Under-distilling is recoverable; a wrong frozen trailer on `main` is not.** When the arc
  is ambiguous, drop the trailer and leave the nuance in body prose. Bias to fewer, certain
  trailers.
- It **reconciles text, it doesn't relive the work** — its only knowledge is what `/reflect`
  and the reviewers serialised. Garbage in stays garbage; verify contradictions against the
  actual diff.
- A merge-time **automated backstop** (GitHub Action) is the weakest possible version of this
  — least context, no human, and under `COMMIT_MESSAGES` it must *also* override `--body-file`
  or it concatenates raw. Keep it phase 2, and conservative.
- If Step 3 promotion is skipped, cross-cutting lessons die in a commit nobody re-reads and
  the always-loaded tier starves. It is not optional.
