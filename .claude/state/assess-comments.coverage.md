# assess-comments — coverage ledger

This file is the self-tracked **test coverage** of the `/docs:assess-comments`
command. It records, per capability, how confident we are that the logic has
actually *fired correctly on real data* — not how accurate its judgement is.

**Read this honestly:** this is a *coverage* tracker, not a correctness proof.
It can only record capabilities it has *seen fire* (positive cases). It cannot
see false negatives — e.g. a ping-pong loop that was present but missed — so a
🟢 means "exercised on real PRs", never "guaranteed correct".

The command reads this at the start of every run and updates it at the end
(step 1 and step 11). Updates are **automatic but evidence-gated**: no
confidence may rise without a citable artifact (PR number + comment id / commit
SHA). When the command updates this file it tells the user, who can choose
whether to commit the change.

## Confidence scale
- ❓ **untested** — logic is written but has never fired on real data.
- 🟡 **seen once** — fired correctly on a single real PR.
- 🟢 **corroborated** — fired correctly on ≥2 *distinct* PRs, **or** once with an
  independent `/codex:review` concurrence on the same finding.
- ⏳ **decaying** — was 🟡/🟢 but not re-confirmed in a long time (treat the API
  shape, bot identities, and repo conventions as possibly drifted; re-verify).

## Capabilities

| Capability | Confidence | Real encounters | Last verified | Evidence |
|---|---|---|---|---|
| Branch/PR identification + arg handling | 🟢 corroborated | 8 | 2026-07-02 | #3415, #3507, #3374, #3536, #3542, #3543, #3573, #2531 |
| Multi-source collection (inline + top-level + reviews) | 🟢 corroborated | 9 | 2026-07-02 | #3415, #3507, #3510, #3374, #3536, #3542, #3543, #3573, #2531 |
| GraphQL thread-resolution pull (`isResolved`/`isOutdated`) | 🟢 corroborated | 7 | 2026-07-02 | #3510 (12/12 resolved), #3374 (15/15), #3536 (2/2 open), #3542 (3 resolved/1 open), #3543 (1/1 open), #3573 (2/2 open), #2531 (r1: 11 open/2 res-outdated/1 open; r2: 11 of 14 outdated after fixes + APPROVED) |
| Source-role tagging (bugbot/security/history/summary/ci/human) | 🟢 corroborated | 8 | 2026-07-02 | #3415, #3507, #3374, #3536, #3542, #3543, #3573, #2531 |
| Open/resolved split | 🟢 corroborated | 7 | 2026-07-02 | #3510, #3374, #3536 (0 resolved/2 open), #3542 (3 resolved/1 open), #3543, #3573 (r1/r2 mixed), #2531 (11 open / 3 resolved) |
| Fix-quality spot-check (genuinely fixed vs silenced) | 🟢 corroborated | 5 | 2026-07-02 | #3510 (term removals landed), #3374 (`num_docs`, dropIndex landed), #3542 (xargs+guard, narrowed exclude, SHA pin landed), #3573 (relpath + `--add` dedup landed), #2531 (r1 found decimal thread 2619563419 reverted; r2 doc fixes landed + engineer ZdravkoDonev **APPROVED**) |
| "Resolved ≠ fixed" flag — **legitimate deferral** variant | 🟡 seen once | 1 | 2026-06-23 | #3510 (TS.BGET:122 left pending eng) |
| "Resolved ≠ fixed" flag — **still-broken / reverted** variant | 🟡 seen once | 1 | 2026-06-30 | #2531 (resolved+outdated thread 2619563419 said decimal default=`string`; a later rewrite reverted current code to `precise`, so the resolved fix is no longer in the code — engineer re-raised it as 3496835587). Regression flavour; see worked examples |
| Cross-tool **agreement** | 🟡 seen once | 1 | 2026-06-23 | #3374 (Claude + bugbot independently on `num_docs`) |
| **Contradiction** detection | 🟢 corroborated | 2 | 2026-07-02 | #3415 (approval vs open bugbot finding); #2531 (RDI engineer's repo ground truth contradicts the page's Debezium-docs claims on ≥4 points — version, decimal default, temporal pass-through, MariaDB connector — **and** engineer-vs-existing-doc on temporal normalization). *(#3507 was an off-branch manual demo — not counted.)* |
| **Ping-pong loop** detection | ❓ untested | 0 | 2026-07-02 | still no true tool A↔B loop across #3536 (4 rounds), #3542 (r2 "empty-scope"), #3573 (r1 fixed point; r2 independent), or #2531. #3542/#3573 were churn not loops; #2531's nearest reopened-concern was the decimal regression (resolved Dec → reverted by a June rewrite → re-raised) — a regression across one rewrite, not a cycle |
| **Subsystem churn** detection (repeated findings on one patched area) | 🟢 corroborated | 3 PRs | 2026-07-02 | 3 distinct PRs. #3536 — 3 instances (review-handling / churn-feature / cap↔report contract). #3542 — 2 instances on the extraction *fail-loud-on-empty* contract (r1 ARG_MAX silent-green → r2 sibling zero-files `exit 0`). #3573 — 2 instances on the `--add` virtual-merge mechanism (r1 dup-vs-disk → r2 dropped-under-collapse). Worked examples below |
| Approval-over-open-finding cross-check | 🟢 corroborated | 6 | 2026-07-02 | #3415 (dwdougherty), #3374 (low-confidence over open HIGH), #3536 (high-confidence over 2 open Mediums: benign), #3542 (paoloredis "yep go ahead" 7 min after open Medium #3498159511; unacknowledged), #3573 (dwdougherty "Sure, why not?" APPROVED 13:41 over open findings; 2 bot findings landed 13:49 after), #2531 (run1 correct **negative** — no approval; run2 **positive** — ZdravkoDonev APPROVED 13:13 then bugbot finding 3499796857 landed 15:08, and he approved over 2-3 of his own still-open findings incl. the temporal one) |
| Depth cap / prioritisation under load | 🟢 corroborated | 2 | 2026-07-02 | #3374 (19 candidate findings → 4 deep-verified); #2531 (r1: 14 threads → 5 deep-verified, 6 deferred). *(#3542/#3573 were under cap — not load tests)* |
| Mandatory deep-verify of resolved+not-outdated HIGH | 🟡 seen once | 1 | 2026-07-02 | #3542 #3467309496 (High "Grep failure skips link check", resolved + isOutdated:false) — deep-verified against current code: xargs+guard genuinely present, so legitimately fixed (not still-broken). First real firing of the rule |
| Bot calibration (fixed-vs-dismissed ratio) | 🟢 corroborated | 6 | 2026-07-02 | #3374 (bugbot mostly accepted); #3536 (5/5 valid); #3542 (3/3 valid — 2 fixed, 1 open); #3543 (1/1 valid; Jit 0); #3573 (4/4 valid; Jit 0); #2531 (r1 bugbot 0 findings; r2 bugbot 1/1 valid — caught the ledger duplicate-rows defect 3499796857; Jit 0) |
| Codex second-opinion availability gate | 🟢 corroborated | 6 | 2026-07-02 | #3415, #3374 (CLI on PATH; #3374 had a real Codex review), #3542, #3543, #3573, #2531 (codex on PATH) |
| Ledger self-integrity after `main` merge (no duplicate rows) | 🟡 seen twice | 2 | 2026-07-02 | #2531 r2 — bugbot 3499796857 caught the shared ledger gaining duplicate rows when `main` (carrying a #3573-era ledger) merged in and git kept both blocks. **2026-07-02**: merging `main` again produced a real conflict as #3542/#3573 edited the same rows — union-merged per capability. Recurring shared-file hazard; see worked examples + step-11 refinement |

## Worked examples library

Concrete real-world signatures, so detection sharpens over time. Add to this
whenever a rare pattern is seen for the first time.

### Ping-pong loops
*(no true loop observed yet — when the first real one appears, record the tool
sequence, the comment ids, and the commits between them here)*

**Near-miss (NOT a loop) — #3536, 2026-06-23.** Round-1 bugbot findings (ids
3460160413, 3460160429 on commit `17517ed`) were fixed in commit `da7c04a`;
bugbot re-reviewed and raised 3 *new* findings (ids 3460820452/470/474). One new
finding (GraphQL pagination, `assess-comments.md:72-75`) sat in the same step I'd
just edited — superficially loop-shaped. But the new findings were independent,
pre-existing issues exposed by the file changing, **not** the same spot toggled
back and forth or a fix being undone. Lesson for the detector: "fix → re-scan →
new findings in an edited region" is normal iteration, **not** ping-pong. A true
loop needs the *same concern* reopened, or tool A's fix re-triggering tool B in a
cycle.

*Confirmed convergence (round 3):* the fixes for those 3 new findings were
pushed, and bugbot's next re-scan came back **clean — no comments**. A real loop
would have spawned another round; this settled. So the "not a loop" judgement is
borne out by what happened next: assess → fix → re-scan reached a fixed point.

**Near-miss (NOT a loop) — #3542, 2026-07-01.** Round-1 bugbot High #3467309496
(ARG_MAX / `|| true` silent-green) was fixed (commit `21f079e1d`: xargs +
zero-URL `exit 1` guard). Round-2 re-scan raised Medium #3498159511 ("empty scope
exits successfully") — the *sibling* zero-files `exit 0` path the new guard didn't
cover. Superficially loop-shaped (same file, same "silent green" theme), but it's
a new adjacent gap, not the same concern reopened → correctly judged churn, not
ping-pong.

### Ledger duplication / conflict after a `main` merge (shared-file hazard)
- **#2531 — 2026-06-30, and again 2026-07-02.** The coverage ledger is a single shared
  file edited by *every* assess-comments run across all branches, so it repeatedly
  collides on merges. (1) 2026-06-30: a #3573 run edited it on `main` while my #2531 run
  edited the branch from the same #3543 ancestor; merging `main` (commit `3007dfb3`)
  kept **both** blocks, duplicating nearly every capability with conflicting confidence.
  Bugbot caught it (finding `3499796857`, Low). (2) 2026-07-02: merging `main` again
  produced a real git **conflict** because #3542/#3573 runs had since edited the same
  rows — resolved by union-merging evidence per capability. **Suggested step-11
  refinement:** reconcile *by capability name* (one row each; merge evidence) and
  re-dedupe/re-merge after any `main` merge — concurrent runs on different branches
  keep colliding in this shared file.

### Resolved-but-still-broken
*(none of the classic "resolved but bug never fixed" variant confirmed yet)*

**Reverted-after-resolve (regression) — #2531, 2026-06-30.** Thread `2619563419`
(ZdravkoDonev-redis, Dec 2025) stated RDI's decimal default is
`debezium.source.decimal.handling.mode=string`; it was **resolved + marked
outdated**. A June 2026 full rewrite of the page (commit `43e02c1d0`) then changed
the documented default to `precise` and added a `TODO` questioning it — i.e. it
**reverted the agreed, resolved fix**. The engineer had to re-raise the identical
point as a fresh finding (`3496835587`). Signature: a *resolved+outdated* thread
whose agreed resolution is no longer reflected in current code because a later
large edit overwrote it. Lesson for the detector: when spot-checking resolved
threads, don't assume "resolved+outdated" means the fix still holds — a big rewrite
can silently undo it. This is a **regression**, distinct from both ping-pong (no
A↔B cycle) and a never-fixed thread (it *was* fixed, then un-fixed).

### Cross-source contradiction (authoritative human vs author's own prior work / other docs)
- **#2531 RDI engineer vs Debezium-docs basis, 2026-06-30.** The page's mappings
  were built from the Debezium 3.0 reference because RDI internals were non-public.
  RDI engineer ZdravkoDonev then supplied repo ground truth contradicting it on
  ≥4 points: shipped Debezium is `3.5.0.Final-rdi.3` not 3.0.8 (`3496835571`);
  decimal default is `string` not `precise` (`3496835587`); RDI *normalizes*
  temporal logical types rather than passing Debezium values through (`3496835595`);
  RDI maps both `mysql` and `mariadb` to `MySqlConnector`, no separate MariaDB
  connector (`3496835604`). Additionally an **doc-vs-doc** contradiction: the
  engineer's temporal-normalization examples disagree with the published
  `formatting-date-and-time-values.md` (Debezium `Date` → ms per engineer vs → days
  per the doc). Lesson: a finding can be authoritative-human-correct yet contradict
  *the author's own verified claims and another shipped doc* — the reconciler's job
  is to surface that the Debezium-docs basis was the weaker source all along.

**Deep-verify came back CLEAN — #3542, 2026-07-01.** First real firing of the
"mandatory deep-verify of resolved+not-outdated High" rule: thread #3467309496 was
`isResolved:true, isOutdated:false` (a green checkmark on an unchanged-looking
line). Opened the current file anyway — the xargs fix + `count==0 → exit 1` guard
are genuinely present (committed `21f079e1d`). So this was resolved-*and*-fixed,
not the still-broken variant. Recorded here as the negative case that proves the
rule fires and distinguishes fixed from still-broken.

### Subsystem churn (not a loop, but the precursor)
- **#3536 review-handling, 2026-06-23.** Bugbot finding 429 (round 1) flagged the
  `$ARGUMENTS` filter dropping cross-check data; it was patched. Two rounds later
  bugbot raised 862 ("filter abort ignores reviews") and 874 ("review bodies skip
  clustering") — *new, independent* findings (so not ping-pong), but all three
  cluster on the **same under-specified subsystem**: how review verdicts flow
  through collect → filter → tag → cluster → abort. Root cause: reviews were
  second-class vs comments. Signature: each incremental patch exposed the next
  adjacent gap. Response that ended it: one **consolidated** fix promoting reviews
  to first-class across steps 2–4, rather than patching 862/874 individually.
- **#3536 churn-on-the-churn-feature (round 5), 2026-06-23.** The *fix* for the
  case above added "subsystem churn" to step 7 — but only there. Round 5 bugbot
  raised 442 ("churn detection capped incorrectly" — gated behind step 6's depth
  cap) and 449 ("report verdict omits churn" — missing from step 9's verdict list
  and headline). Same signature as any churn: a feature added in one place,
  adjacent integration gaps exposed next round. Cured by threading churn through
  steps 6 and 9 in one pass. Lesson: adding a capability *is* a subsystem edit —
  wire it through every dependent step at once, or it becomes its own churn.
- **#3536 churn persisted — consolidation scoped too narrowly (round 6),
  2026-06-23.** The round-5 "consolidated" fix threaded the *churn feature*
  through steps 6 & 9 but left the deeper contract under them unfixed, so round 6
  raised finding 3461052859 ("open table needs full verdicts": step 9 promised a
  verdict per open cluster while step 6 only verifies 3–5). Same area a third
  time. Real root: the **cap ↔ report-completeness contract**, not the churn
  feature. Fixed by making the table cover only deep-verified clusters and
  marking deferred ones unverified. Meta-lesson: when round N+1 finds another gap
  in an area you *just* "consolidated", your consolidation boundary was wrong —
  widen it to the true subsystem, don't re-patch the edge.
- **#3542 extraction "fail-loud-on-empty" contract, 2026-07-01.** 2nd distinct PR
  showing the pattern (promotes churn detection to 🟢). Round-1 bugbot High
  #3467309496 flagged `grep "${files[@]}"` + `|| true` as a silent-green path
  (extraction failure → empty output → lychee passes checking nothing). Fixed
  (commit `21f079e1d`) with xargs streaming + a `count==0 → exit 1` guard — but
  the guard only covered the *zero-URLs-from-found-files* path. Round-2 bugbot
  Medium #3498159511 then flagged the sibling *zero-files-found* branch, which
  still does `: > "$OUTPUT_FILE"; exit 0` (silent green on a broken/mis-scoped
  build). Same under-specified contract ("degenerate extraction must fail loudly"),
  each patch exposing the adjacent path. Signature identical to #3536. Recommended
  consolidation: enforce one invariant — any empty `external-urls.txt` in CI fails
  — in a single place, rather than flipping just the zero-files branch and inviting
  a round-3 finding on a third degenerate path.

- **#3573 `--add` virtual-merge, 2026-06-30 (2nd PR → corroborates the pattern).**
  Round 1 bugbot #3499137529 flagged `--add` duplicating a page that's also on
  disk; fixed by an existence-check in `build_rows`. Round-2 re-scan then raised
  #3499226329: `--add` into a `--collapse`d folder is silently dropped (virtual
  entries merge only when `walk` recurses, which collapsed folders skip). *New,
  independent finding* (not ping-pong) but the **same under-specified subsystem**
  — how `--add` virtual entries reconcile with the on-disk walk and collapse
  state. Signature again: each point-patch exposed the next adjacent gap.
  Consolidation that would end it: resolve all `--add` entries against the final
  tree in one place — validate the parent is a real, non-collapsed, walked dir
  and **warn instead of silently dropping**, and dedupe vs disk there too —
  rather than threading a `virtual` dict through the recursion. Borderline
  (only 2 instances, niche feature), but the cross-round, same-mechanism shape
  is the early churn signal.

### Cross-tool agreement
- **#3374 `num_docs`** — Claude (Critical #2, top-level review) and bugbot
  ("Wrong FT.INFO document count field", inline, 06-17) independently flagged
  the same `info.numDocs` → `num_docs` bug. Verified fixed in current code.
