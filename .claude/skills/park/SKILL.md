---
name: park
description: "Freeze a release-ready-pending-upstream branch as a parked PR — open (or update) the PR with a machine-diffable unpark manifest, apply the parked / do-not-merge labels, and deliberately defer /finalize so the episodic re-check notes survive. Use when docs are written against an unreleased or still-changing external source (an upstream PR, a preview feature) and must wait for it to ship before merging. Pairs with /unpark."
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
/unpark           →  reconcile docs vs source        [thaw + delta]
        ↓
/reflect+/finalize → durable squash commit           [resume the normal pipeline]
```

## The one principle: snapshot the source, not just a pointer

A note that says "watch upstream PR X" is nearly useless on unpark — it tells you where to
look but not *what changed*. The manifest must capture the source's **state at park time**
(merge status, head SHA, milestone, the observed API shape) so unpark is a **diff**, not a
fresh read. Recording the snapshot is the whole value of parking; everything else is
plumbing.

## Step 1 — Confirm it should be parked (not merged, not abandoned)

Park only when **the docs are as complete as the source allows** and the sole blocker is an
external event. If the work is merely unfinished, keep working. If the source may never ship,
don't park — say so. There must be a concrete, testable **trigger condition**.

Two things make a trigger actually testable, and both have bitten:

- **Point it at the source that will ship the feature, not the one you read.** A draft PR is
  often one step in a series that lands on the default branch as a different, consolidated PR.
  Watch the branch the release is cut from; if the PR you wrote against targets an integration
  branch rather than `master`/`main`, say so in the trigger and name the umbrella once it
  exists.
- **Require "in a released version", and make it mean an ancestry check.** Merge and release can
  be minutes apart, so date order proves nothing, and the newest tag is often a beta the page's
  version note must not cite. The trigger is met when the merge commit is an **ancestor of a
  non-prerelease tag** — record the command that shows it (`gh api
  repos/<o>/<r>/compare/<merge-sha>...<tag>`, expecting `behind_by: 0`).

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
`bannerText`). For each, capture its live state with the endpoint that matches the source type.

For a GitHub **pull request**:

```
gh api repos/<owner>/<repo>/pulls/<n> \
  --jq '{state, merged, head_sha: .head.sha, base: .base.ref, milestone: .milestone.title, updated_at}'
```

For a GitHub **issue** — a feature-request or GA-tracking issue, say — the `pulls` endpoint and
its `merged` / `head` / `base` fields don't exist, so use `issues/<n>`:

```
gh api repos/<owner>/<repo>/issues/<n> \
  --jq '{state, state_reason, milestone: .milestone.title, updated_at, closed_at}'
```

Record URL + snapshot in the sources table, and the re-fetch command for unpark. Add a
**confidence-tagged** summary of the API/behaviour the page assumes (LOW for docs written
against an unmerged diff — and say *why* it's low, e.g. "signatures differed between two reads
of the diff").

**Split that summary in two: the semantics, and the identifiers.** They decay at completely
different rates. What the feature *does* — the shape of the page, the ordering guarantees, the
caveats — usually survives to release intact. The **names** usually don't: types get renamed,
optional-arg methods split into no-arg plus `WithOptions` variants, fields appear, and fields
leave the type they were on. So enumerate every type, method, field and default the page
commits to as an explicit list unpark can tick off one by one, rather than describing them in
prose. A prose sentence covering four field names is one checklist item that can be half-right;
four listed names are four verdicts.

Two traps worth calling out while you write that list:

- **Distinguish "renamed" from "was never there".** Record *where* you saw each identifier
  (which file, which struct), because the useful unpark finding is sometimes "this field isn't
  part of this API at all" — a mis-attributed field looks exactly like a renamed one in the
  snapshot, and only the location tells them apart.
- **Note where the changelog and the source disagree.** Release notes summarize and under-report;
  the source is authoritative for which client types expose the API.

## Step 4 — Compose the manifest & PR body

Build the PR body: a short human summary, a prominent **do-not-merge warning** linking the
source, then the `<!-- park-manifest -->`…`<!-- /park-manifest -->` block with all five
required sections (per the shared spec). The page itself should already carry a `bannerText`
"not yet released / subject to change" note — if it doesn't, add one before parking.

## Step 5 — Land it

- **Commit any working-tree edits first** — including a `bannerText` you added in Step 4 — and
  confirm a clean tree before pushing. The parked PR must not get its manifest and labels while a
  required edit lingers only in the local working tree.
- Push the branch.
- Open the PR, or update an existing one in place. For a new PR:
  ```
  gh pr create --title "DOC-XXXX <summary> [PARKED]" --body-file <body> \
    --label parked --label "do not merge yet" --base main
  ```
  When the branch already has a PR (re-parking — `gh pr create` would fail), replace the body
  and ensure the labels instead:
  ```
  gh pr edit <n> --body-file <body> --add-label parked --add-label "do not merge yet"
  ```
- Verify the labels stuck (`gh pr view <n> --json labels`).
- **Do not run `/finalize`.** State explicitly that it's deferred until unpark — the manifest
  records this, but say it in your handoff too.

Present the PR URL, the trigger condition, and the checklist, then stop. Opening a PR is
outward-facing — if the branch isn't pushed or the user hasn't asked, confirm first.

## Limits (read honestly)

- **A stale snapshot is worse than none** — if you record a head SHA or API shape you didn't
  actually verify, unpark diffs against fiction. Snapshot only what you checked; leave the
  rest out and flag it in the checklist.
- **Expect the identifiers to be wrong, and don't let that shake your confidence in the page.**
  Measured on DOC-6832 (go-redis automatic pipelining, parked ~3.5 weeks across two re-parks):
  at release the page's structure, ordering semantics and every caveat still read correctly,
  while nearly every type, method and field name had moved. That is the *normal* outcome, not a
  sign the page was written too early — which is why the LOW confidence tag belongs on the
  identifier list specifically, not smeared over the whole page.
- **Re-verifying during the park is what makes the final reconcile cheap.** Each re-park that
  refreshes the snapshot converts churn into an already-answered checklist item; skip them and
  every delta arrives at once, at the moment you least want a surprise.
- Park **cannot judge whether the source will ship.** It records a trigger; it doesn't predict
  the future. A parked PR that never triggers is dead weight — `/unpark`'s scan mode is how you
  find and close those.
- It **defers, never distills.** If you're tempted to "just finalize while it's fresh," don't:
  you'll squash away the very notes unpark needs. Freshness is preserved *in the manifest*, not
  in a premature durable commit.
- The manifest is only as good as the checklist. If Step 2's harvest is skipped, the loose ends
  live only in scattered trailers and the unparking starts blind.
