# Park manifest — format & conventions (shared)

Canonical definition of the **park manifest**: the pickup contract embedded in a parked PR.
Shared by **`/park`** (which *writes* it) and **`/pickup`** (which *reads and diffs against*
it), so the format can't drift between the two. Change it here, once.

> Referenced by `.claude/skills/park/SKILL.md` and `.claude/skills/pickup/SKILL.md`. Not a
> skill itself (no `SKILL.md`), so it won't be invoked directly.

## What a parked PR is

A PR whose docs are **written but deliberately not mergeable yet** because they track an
external event that hasn't happened — an upstream release, a feature reaching GA, an API
being finalised. The work is done to the extent it *can* be; what remains is **re-checking it
against the source once the source stops moving.**

The enemy is forgetting: which upstream thing this tracked, what state it was in when we
wrote against it, and what we already knew was likely to change. The manifest fixes all
three in a place a future agent can find with `gh` alone.

## Where it lives

In the **PR body**, as a markdown block delimited by exact marker lines so `/pickup` can
extract it deterministically:

```
<!-- park-manifest -->
## Park manifest
...
<!-- /park-manifest -->
```

PR-body (not an in-repo file) on purpose: `gh` can read/write it and list parked PRs by
label, with nothing to clean up at merge. The block is plain markdown — human-readable in the
PR, machine-locatable by its markers.

## Required sections

1. **Header fields** — flat `Key: value` lines:
   - `Ticket:` — `DOC-NNNN`.
   - `Parked at:` — date (pass it in; agents can't read the clock).
   - `Trigger to pick up:` — the *condition*, concrete enough to test mechanically, e.g.
     "upstream PR X merged **and** in a released version".
   - `Labels:` — the labels applied (`parked`, `do not merge yet`).

2. **Pinned sources (state observed at park time)** — a table, one row per external source.
   Each row records the URL **and a snapshot of its state at park time**: for a GitHub PR,
   `state` / `merged` / `head SHA` / `base` / `milestone` / `updated`. **The snapshot is what
   makes pickup a diff rather than a re-read** — without it, `/pickup` sees "now" with nothing
   to compare against. Include the exact command to re-fetch each source.

3. **Observed shape the page assumes** — a **confidence-tagged** summary of the API/behaviour
   the docs commit to. Tag it (`LOW`/`MEDIUM`/`HIGH`) — preemptive docs written against an
   unmerged diff are usually LOW, and saying so tells pickup how hard to scrutinise.

4. **Re-check checklist** — GitHub task-list (`- [ ]`) of everything to verify or finish on
   pickup. **Seed it from the branch's commit trailers** — harvest `Recheck:` / `Gaps:` /
   `Directive:` from `main..HEAD` (see [`commit-trailers.md`](./commit-trailers.md)); those
   *are* the loose ends. Add anything predicted-to-change not already captured. Mark the
   highest-risk items.

5. **On pickup, then** — the closing steps, in the exact order `/pickup` Step 5 defines:
   reconcile docs, remove the `bannerText` warning, **commit** the reconciliation, run
   **`/reflect`**, **push** (so the remote head carries the final history, including any
   `/reflect` amend — the squash merges only what has been pushed), run **`/finalize`**, and
   **only then** drop the labels. The `do not merge yet` guard must hold until `/finalize`
   completes. This is a summary; **`/pickup` Steps 4–5 are the authoritative sequence** — keep
   it in that order (commit → `/reflect` → push → `/finalize` → drop labels).

## Relationship to commit trailers

No double-bookkeeping. Commit `Recheck:` / `Gaps:` trailers are the *per-change,
location-bound* record (`git log`-reachable). The manifest is the *consolidated, source-pinned*
contract for the PR as a whole. `/park` **harvests** the trailers into the checklist; it does
not restate them as trailers.

## Finalize is deferred while parked

Critical: **do not run `/finalize` at park time.** Finalize squashes away the episodic
`Recheck:` / `Gaps:` trailers — exactly what `/pickup` needs. The durable distill happens
*after* pickup, once the source has settled. The manifest's "On pickup, then" section records
this so it isn't forgotten.

## Labels

- `parked` — "PR speculatively added based on pre-release info. Check validity when release
  goes ahead."
- `do not merge yet` — the merge guard.

`/pickup` finds parked PRs with `gh pr list --label parked`.
