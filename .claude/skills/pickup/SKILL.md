---
name: pickup
description: "Thaw a parked PR — re-fetch each pinned source, diff it against the manifest snapshot taken at park time, report what changed vs what was predicted, then reconcile the docs and resume the normal pipeline (/reflect → /finalize) toward merge. Run with a PR number, or with no argument to scan all parked PRs and report which triggers have fired. Pairs with /park."
---

# Pickup — thaw a parked PR against its moved source

`/park` froze a PR with a snapshot of the source it tracks. Time passed; the source moved —
the upstream PR merged, the API changed, a version shipped. This skill **thaws the PR**: it
diffs the source's *now* against the *then* recorded in the manifest, tells you exactly what
changed, reconciles the docs, and hands back to the normal merge pipeline.

The manifest format is defined in
[`../_shared/park-manifest.md`](../_shared/park-manifest.md) — **read it first**. Trailer
vocabulary for the reflect/finalize handoff is in
[`../_shared/commit-trailers.md`](../_shared/commit-trailers.md).

## Where this sits

```
/park             →  parked PR + manifest snapshot   [frozen]
        ↓  (the trigger fires)
/pickup           →  diff source now vs snapshot      [THIS SKILL: thaw + reconcile]
        ↓
/reflect+/finalize → durable squash commit            [resume: predicted-vs-actual, distill]
```

## The one principle: diff, then reconcile — don't rewrite from scratch

The manifest's value is the snapshot. Use it: fetch the source now, **compare field-by-field**
against what park recorded, and let the *delta* drive the edits. Rewriting the page blind
throws away the park-time reasoning and re-introduces whatever was already got right. Report
the delta first; edit second.

## Mode A — scan (no argument)

List every parked PR and report, for each, whether its trigger has fired — the standing answer
to "what's waiting, and is any of it ready?"

```
gh pr list --label parked --json number,title,url,updatedAt
```

For each, read the manifest's `Trigger to pick up:`, snapshot the current source state (Step 1's
re-fetch only — don't do the full reconcile), then compare that state to the trigger condition to
decide **fired?**. Use only Step 2's *comparison* — **not** its stop-and-report rule: in scan mode
a not-met trigger is recorded as `fired?=no` and you continue to the next PR, never aborting the
loop. Output a table: PR / trigger / **fired?** / one-line delta. Recommend which to pick up, which are still waiting, and which look abandoned (source
closed-unmerged, or long dead). Then stop — picking one up is Mode B.

## Mode B — pick up one PR (PR number given)

### Step 1 — Extract the manifest & re-fetch sources

Read the PR body, slice out the `<!-- park-manifest -->`…`<!-- /park-manifest -->` block. For
each pinned source, run its recorded re-fetch command and capture current state.

### Step 2 — Diff against the snapshot

Compare current vs park-time, field by field. Has `merged` flipped true? Has `head SHA` moved
(the diff may have changed under review)? Is a `milestone` / version now set? For a merged PR,
read the **released** source at the merged tag, not the PR branch. Confirm whether the trigger
condition is genuinely met — **if it isn't, stop and report**; picking up early re-freezes bad
info.

### Step 3 — Walk the checklist

Take each `- [ ]` item in the manifest and resolve it against the current source: **confirmed
as-written**, **changed → here's the correction**, or **still open**. This is the core output —
a per-item verdict, highest-risk items first. Verify against the actual released source, never
the park-time assumption (which was often LOW-confidence by design).

### Step 4 — Reconcile the docs

Apply the corrections: fix signatures/config, fill version placeholders, add sections for
pieces that landed after park (e.g. a deferred API), convert provisional inline examples to
tested examples where the tooling now allows, and remove the page's `bannerText` "not yet
released" warning. This step is only *what to change* — the git operations that make those
changes land (including the rebase and link checks) come next, in order.

### Step 5 — Resume the pipeline & hand off

Pickup **reconciles; it does not merge.** `/finalize` prepares a squash that operates on the
**pushed remote PR head**, so the invariant governing this whole step is:

> Before the `gh pr merge` hand-off, the remote PR branch must already contain **everything
> that must land** — the reconciliation commit, the rebased/merged-`main` history, and any
> later amend. The squash sees only what has been pushed; anything left local is silently
> dropped from the merge.

The checklist below is the **intent** — *what must be true*, in this order — before the
`gh pr merge` hand-off. It is **not** a command script: achieve each state with normal git, minding
the edge cases of an already-pushed, rebased branch (a rebase needs a clean tree; pushing
rewritten history needs `--force-with-lease`). Stating intent rather than commands is deliberate —
enumerating the exact git steps here drifted out of date every review round.

1. **Reconciliation committed**, the branch **up to date with `main`**, link checks and `relref`
   targets re-verified.
2. **`/reflect`** recorded on that commit — *predicted-vs-actual*: what the park snapshot got
   right, what the source changed (closes the loop; calibrates future preemptive docs).
3. **Remote head == local** — everything above pushed. This is the invariant made true; nothing
   reaches the squash until it is.
4. **`/finalize`** run — the durable squash deferred at park time, now that the source has
   settled; it reconciles the whole arc (park notes + pickup findings + any review) and prepares
   the `gh pr merge … --body-file` command.
5. **Labels dropped last** — remove `parked` / `do not merge yet` and strip the manifest block
   only after `/finalize`. The merge guard holds until then.

Before handing off, **confirm the remote head matches local** (working tree clean, branch not
ahead of `origin`). Then present: the delta report, the doc changes, the finalize output + the
`gh pr merge … --body-file` command, and stop. The human triggers the merge.

## Limits (read honestly)

- **A met trigger is not a settled source.** An upstream PR can merge and *still* churn via
  follow-ups before release. If `milestone`/version is unset, treat the API as not-yet-final and
  lean toward staying parked. Report the ambiguity; don't force it.
- It **trusts the snapshot's honesty.** If `/park` recorded an unverified shape, the diff is
  against fiction — so re-verify high-risk checklist items from source regardless of what the
  snapshot claimed, especially anything tagged LOW.
- It **can't recover a checklist that was never written.** With a thin manifest, pickup
  degrades to a blind re-review — still useful, but the park-time context is gone.
- Reconciliation edits are real doc changes: drive/verify them like any other, don't assume the
  released API matches even a HIGH-confidence snapshot.
