---
name: park
description: "Freeze a release-ready-pending-upstream branch as a parked PR — open (or update) the PR with a machine-diffable pickup manifest, apply the parked / do-not-merge labels, and deliberately defer /finalize so the episodic re-check notes survive. Use when docs are written against an unreleased or still-changing external source (an upstream PR, a preview feature) and must wait for it to ship before merging. Pairs with /pickup."
---

# Park — freeze a PR that's waiting on the world

Some docs are done as far as they *can* be, but can't merge yet: they're written against an
upstream PR that hasn't merged, a feature that hasn't GA'd, an API still in review. Left as a
bare open PR, the context rots — six weeks later nobody remembers what it tracked or what was
known to be shaky. This skill **freezes that context into the PR** so it can be picked up
cleanly when the source settles.

Park is the pipeline's **pause button between `/reflect` and `/finalize`** — it preserves the
episodic layer and adds a forward-looking re-check contract, instead of distilling and
merging.

The manifest format is defined once in
[`../_shared/park-manifest.md`](../_shared/park-manifest.md) — **read it first**, and
[`../_shared/commit-trailers.md`](../_shared/commit-trailers.md) for the trailer vocabulary
you'll harvest. This file is *how to build and land the manifest*.

## Where this sits

```
/reflect          →  WIP commit messages          [episodic, provisional]
        ↓  THIS SKILL — when the work can't merge yet
/park             →  parked PR + manifest           [frozen; /finalize DEFERRED]
        ↓  (wait for the upstream trigger)
/pickup           →  reconcile docs vs source        [thaw + delta]
        ↓
/reflect+/finalize → durable squash commit           [resume the normal pipeline]
```

## The one principle: snapshot the source, not just a pointer

A note that says "watch upstream PR X" is nearly useless on pickup — it tells you where to
look but not *what changed*. The manifest must capture the source's **state at park time**
(merge status, head SHA, milestone, the observed API shape) so pickup is a **diff**, not a
fresh read. Recording the snapshot is the whole value of parking; everything else is
plumbing.

## Step 1 — Confirm it should be parked (not merged, not abandoned)

Park only when **the docs are as complete as the source allows** and the sole blocker is an
external event. If the work is merely unfinished, keep working. If the source may never ship,
don't park — say so. There must be a concrete, testable **trigger condition**.

## Step 2 — Harvest the loose ends already on the branch

The branch's own commits hold the re-check items, from `/reflect`:

```
git log --reverse main..HEAD --format='%(trailers:only,unfold)'
```

Pull the `Recheck:`, `Gaps:`, and `Directive:` trailers — these seed the checklist. Read the
commit bodies too, for the *why*. Don't restate them as trailers on a new commit; they belong
in the manifest checklist now (see [`../_shared/park-manifest.md`](../_shared/park-manifest.md),
"Relationship to commit trailers").

## Step 3 — Snapshot each pinned source

Identify the external sources the docs depend on (URLs in the ticket, commit bodies, the page's
`bannerText`). For each, capture its live state. For a GitHub PR/issue:

```
gh api repos/<owner>/<repo>/pulls/<n> \
  --jq '{state, merged, head_sha: .head.sha, base: .base.ref, milestone: .milestone.title, updated_at}'
```

Record URL + snapshot in the sources table, and the re-fetch command for pickup. Add a
**confidence-tagged** summary of the API/behaviour the page assumes (LOW for docs written
against an unmerged diff — and say *why* it's low, e.g. "signatures differed between two reads
of the diff").

## Step 4 — Compose the manifest & PR body

Build the PR body: a short human summary, a prominent **do-not-merge warning** linking the
source, then the `<!-- park-manifest -->`…`<!-- /park-manifest -->` block with all five
required sections (per the shared spec). The page itself should already carry a `bannerText`
"not yet released / subject to change" note — if it doesn't, add one before parking.

## Step 5 — Land it

- Push the branch.
- Open the PR (or update an existing one — replace any prior manifest block in place):
  ```
  gh pr create --title "DOC-XXXX <summary> [PARKED]" --body-file <body> \
    --label parked --label "do not merge yet" --base main
  ```
- Verify the labels stuck (`gh pr view <n> --json labels`).
- **Do not run `/finalize`.** State explicitly that it's deferred until pickup — the manifest
  records this, but say it in your handoff too.

Present the PR URL, the trigger condition, and the checklist, then stop. Opening a PR is
outward-facing — if the branch isn't pushed or the user hasn't asked, confirm first.

## Limits (read honestly)

- **A stale snapshot is worse than none** — if you record a head SHA or API shape you didn't
  actually verify, pickup diffs against fiction. Snapshot only what you checked; leave the
  rest out and flag it in the checklist.
- Park **cannot judge whether the source will ship.** It records a trigger; it doesn't predict
  the future. A parked PR that never triggers is dead weight — `/pickup`'s scan mode is how you
  find and close those.
- It **defers, never distills.** If you're tempted to "just finalize while it's fresh," don't:
  you'll squash away the very notes pickup needs. Freshness is preserved *in the manifest*, not
  in a premature durable commit.
- The manifest is only as good as the checklist. If Step 2's harvest is skipped, the loose ends
  live only in scattered trailers and the pickup starts blind.
