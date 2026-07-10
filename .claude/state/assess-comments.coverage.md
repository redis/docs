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
| Branch/PR identification + arg handling | 🟢 corroborated | 11 | 2026-07-10 | #3415, #3507, #3374, #3536, #3542, #3543, #3573, #2531, #3585, #3604, #3612 |
| Multi-source collection (inline + top-level + reviews) | 🟢 corroborated | 12 | 2026-07-10 | #3415, #3507, #3510, #3374, #3536, #3542, #3543, #3573, #2531, #3585, #3604, #3612 |
| GraphQL thread-resolution pull (`isResolved`/`isOutdated`) | 🟢 corroborated | 10 | 2026-07-10 | #3510 (12/12 resolved), #3374 (15/15), #3536 (2/2 open), #3542 (3 resolved/1 open), #3543 (1/1 open), #3573 (2/2 open), #2531 (r1: 11 open/2 res-outdated/1 open; r2: 11 of 14 outdated after fixes + APPROVED), #3585 (r1 2 open; r2 3 open + 2 resolved — one outdated, one resolved-not-outdated); #3604 (r1 2/2 open; r2 4/4 open; r3 5 threads = 2 resolved [one outdated, one resolved-not-outdated] / 3 open, hasNextPage:false); #3612 (r1 4/4 open, hasNextPage:false) |
| Source-role tagging (bugbot/security/history/summary/ci/human) | 🟢 corroborated | 11 | 2026-07-10 | #3415, #3507, #3374, #3536, #3542, #3543, #3573, #2531, #3585, #3604, #3612 (bugbot inline + github-actions Jira-link ci; no human/summary this PR) |
| Open/resolved split | 🟢 corroborated | 10 | 2026-07-10 | #3510, #3374, #3536 (0 resolved/2 open), #3542 (3 resolved/1 open), #3543, #3573 (r1/r2 mixed), #2531 (11 open / 3 resolved), #3585 (r1 2 open/0 res; r2 3 open/2 resolved), #3604 (r1 0 res/2 open; r2 0 res/4 open; r3 2 res/3 open), #3612 (0 res/4 open) |
| Fix-quality spot-check (genuinely fixed vs silenced) | 🟢 corroborated | 8 | 2026-07-10 | #3510 (term removals landed), #3374 (`num_docs`, dropIndex landed), #3542 (xargs+guard, narrowed exclude, SHA pin landed), #3573 (relpath + `--add` dedup landed), #2531 (r1 found decimal thread 2619563419 reverted; r2 doc fixes landed + engineer ZdravkoDonev **APPROVED**), #3585 r2 (both r1 findings genuinely fixed — byId multimap + isError wrapping present in code, not silenced); #3604 r3 (reactive race 3544441638 resolved+outdated by 6735cf9cc — sequential `.then()` chain present + harness PASS; smismember 3545172677 resolved-not-outdated, genuinely fixed in client sources not the anchored sets.md line); #3612 (r1's 3 doc-consistency fixes + r2 commit-gap all resolved; r2 3558314964 resolved+**outdated** by 7044aefc1 — consolidation genuinely present in Step 5, not silenced; **structural de-dup confirmed**: bugbot re-scan of the collapsed manifest §5 (`03ec1e1f5`) raised nothing on it — the copy-drift class is genuinely closed, not merely silenced) |
| "Resolved ≠ fixed" flag — **legitimate deferral** variant | 🟡 seen once | 1 | 2026-06-23 | #3510 (TS.BGET:122 left pending eng) |
| "Resolved ≠ fixed" flag — **still-broken / reverted** variant | 🟡 seen once | 1 | 2026-06-30 | #2531 (resolved+outdated thread 2619563419 said decimal default=`string`; a later rewrite reverted current code to `precise`, so the resolved fix is no longer in the code — engineer re-raised it as 3496835587). Regression flavour; see worked examples |
| Cross-tool **agreement** | 🟡 seen once | 1 | 2026-06-23 | #3374 (Claude + bugbot independently on `num_docs`) |
| **Contradiction** detection | 🟢 corroborated | 3 | 2026-07-10 | #3415 (approval vs open bugbot finding); #2531 (RDI engineer's repo ground truth contradicts the page's Debezium-docs claims on ≥4 points — version, decimal default, temporal pass-through, MariaDB connector — **and** engineer-vs-existing-doc on temporal normalization); #3612 (**new flavour: internal doc-vs-doc within one PR's own files** — bugbot 3558223727: `park-manifest.md` "On pickup, then" drops labels *before* `/reflect`+`/finalize` while `pickup` Step 5 drops them *after*; `/park` copies the manifest into every PR body so the guard could lift early). *(#3507 was an off-branch manual demo — not counted.)* |
| **Ping-pong loop** detection | ❓ untested | 0 | 2026-07-09 | still no true tool A↔B loop across #3536 (4 rounds), #3542 (r2 "empty-scope"), #3573 (r1 fixed point; r2 independent), #2531, #3585, or #3604 (r2: SMISMEMBER finding fixed by 9bf49b2f4 with no re-flag; node-dep FP independent; r3: new `Double.MIN_VALUE` finding in `SortedSetExample.java`, a file *untouched* by the 6735cf9cc push that triggered the re-scan — new-independent-in-different-file, textbook normal iteration). #3542/#3573/#3585 were churn not loops; #3585 r2 was the closest yet (the r1 fix *caused* r2's findings) but still not a loop — new independent findings + no fix undone, no A↔B cycle. #2531's nearest was the decimal regression (resolved → reverted by a rewrite → re-raised), a regression not a cycle |
| **Subsystem churn** detection (repeated findings on one patched area) | 🟢 corroborated | 5 PRs | 2026-07-10 | 5 distinct PRs. #3536 — 3 instances (review-handling / churn-feature / cap↔report contract). #3542 — 2 instances on the extraction *fail-loud-on-empty* contract. #3573 — 2 instances on the `--add` virtual-merge mechanism. #3585 — get_page/search **resolution** subsystem: r1 fix (dup-id → byId multimap + matchByUrlSuffix + ambiguous-url early-return) directly caused 2 of r2's 3 findings (suffix path-boundary High, url-blocks-id-fallback) plus adjacent version-default gap. Cleanest "fix-caused-its-own-next-round" churn yet. #3612 — pickup **closing sequence** (Step 4→5), **3 rounds**: r1 label-drop ordering (3558223727) + r2 commit-before-reflect High (3558314964) + r3 push-before-merge High (3558614316). The r2 "consolidation" (explicit ordered commit→reflect→finalize→drop-labels) was **scoped too narrowly** — it threaded *commit* but not the full local→remote→squash dependency, so r3 landed on that very commit. 2nd PR to show the #3536-r6 "consolidation boundary too narrow" meta-pattern. Worked examples below |
| Approval-over-open-finding cross-check | 🟢 corroborated | 7 | 2026-07-08 | #3415 (dwdougherty), #3374 (low-confidence over open HIGH), #3536 (high-confidence over 2 open Mediums: benign), #3542 (paoloredis "yep go ahead" 7 min after open Medium #3498159511; unacknowledged), #3573 (dwdougherty "Sure, why not?" APPROVED 13:41 over open findings; 2 bot findings landed 13:49 after), #2531 (run1 correct **negative** — no approval; run2 **positive** — ZdravkoDonev APPROVED 13:13 then bugbot finding 3499796857 landed 15:08, and he approved over 2-3 of his own still-open findings incl. the temporal one), #3585 (correct **negative** both rounds — open bugbot findings, only bot COMMENTED verdicts, no human approval); #3604 (correct **negative** all 3 rounds — r3 3 open bugbot findings, only cursor COMMENTED verdicts, no human approval); #3612 (correct **negative** — 4 open bugbot findings, only cursor COMMENTED verdict, no human approval) |
| Depth cap / prioritisation under load | 🟢 corroborated | 2 | 2026-07-02 | #3374 (19 candidate findings → 4 deep-verified); #2531 (r1: 14 threads → 5 deep-verified, 6 deferred). *(#3542/#3573 were under cap — not load tests)* |
| Mandatory deep-verify of resolved+not-outdated HIGH | 🟢 corroborated | 2 | 2026-07-02 | #3542 #3467309496 (High "Grep failure skips link check", resolved + isOutdated:false) — deep-verified: xargs+guard genuinely present, legitimately fixed. #3585 #3513924736 (High "Duplicate page IDs break get_page", resolved + isOutdated:false) — deep-verified against current code: byId multimap + url-first resolution present, genuinely fixed. 2nd distinct PR → corroborated |
| Bot calibration (fixed-vs-dismissed ratio) | 🟢 corroborated | 8 | 2026-07-08 | #3374 (bugbot mostly accepted); #3536 (5/5 valid); #3542 (3/3 valid — 2 fixed, 1 open); #3543 (1/1 valid; Jit 0); #3573 (4/4 valid; Jit 0); #2531 (r1 bugbot 0 findings; r2 bugbot 1/1 valid — caught the ledger duplicate-rows defect 3499796857; Jit 0); #3585 (bugbot **5/5 valid** across 2 rounds); #3604 (across 3 rounds **3 valid / 2 FP**: valid = reactive `Mono.when` race 3544441638 + SMISMEMBER client-tab parity 3545172677 [fixed by 9bf49b2f4] + `Double.MIN_VALUE`≠−∞ range bug 3550287458 [r3, a language-semantics catch]; FP = async `allOf` 3544581411 + node harness `@redis/time-series` "missing dep" 3545172685. **Calibration axis**: bugbot is strong on API/language semantics [`Double.MIN_VALUE` is smallest-positive] but both FPs mis-model runtime dependency/ordering it can't see from the diff [async fire-on-call; npm transitive hoisting]. Also found 2 of 3 identical `Double.MIN_VALUE` instances — correctly skipped the jedis one, pre-existing on main / outside the PR diff); #3612 (**6 valid / 1 FP across the review cycle** — r1 valid = internal doc-vs-doc label-order contradiction 3558223727 + scan-mode wrong-step-ref 3558223733 + park update-path-only-shows-`gh pr create` 3558223738; r2 valid = commit-before-reflect High 3558314964; r3 valid = push-before-merge High 3558614316; r5 valid = manifest-omits-rebase 3558867168 [manifest copy-drift]; r6 valid = rebase-before-commit 3558994646 [pickup git-op ordering]; FP = r1 High "`merged` field doesn't exist" 3558223722, refuted empirically — single-PR REST endpoint returns top-level `merged`. **Calibration axis holds**: all 6 valid catches are cross-file doc-consistency / procedure-completeness [bugbot's strength], and it effectively ran the churn detection one seam per round across ~6 rounds; the 1 FP is again an **unseen API mechanic** [list-endpoint vs single-PR-endpoint response shape] — same root as #3604's async/npm FPs) |
| Codex second-opinion availability gate | 🟢 corroborated | 9 | 2026-07-10 | #3415, #3374 (CLI on PATH; #3374 had a real Codex review), #3542, #3543, #3573, #2531, #3585, #3604, #3612 (codex on PATH at /Users/andrew.stark/bin/codex) |
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

**Internal doc-vs-doc within one PR's own files — #3612, 2026-07-10.** A new contradiction
flavour: not human-vs-doc or tool-vs-intent, but two files *in the same PR* that must stay
consistent by construction. Bugbot Medium `3558223727` caught `_shared/park-manifest.md`'s
"On pickup, then" listing *"drop the labels, run `/reflect` then `/finalize`"* (guard removed
**before** the durable commit) while `pickup/SKILL.md` Step 5 removes labels **after** reflect
+ finalize. The bite: `/park` copies the manifest section verbatim into every parked PR body,
so an agent following the PR-body copy could lift the `do not merge yet` guard before
reconciliation finishes. Signature: a shared/duplicated spec fragment whose ordering disagrees
with the authoritative procedure that consumes it. Extra irony — these very skills exist to stop
`/park` and `/pickup` drifting, and the seam bugbot found is a drift between them. Lesson for the
detector: when one PR ships a spec split across N files, diff the *duplicated* fragments against
their canonical procedure; contradictions hide in the copies.

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

- **#3585 get_page/search resolution, 2026-07-02 (fix-caused-its-own-next-round — the purest signature).**
  Round 1 bugbot raised a High (duplicate page ids break get_page, `3513924736`) and a
  Medium (missing page returns success, `3513924746`). Both were fixed in `ea1b97254`:
  `byId` became a multimap, a new `matchByUrlSuffix` returned all suffix matches, an
  ambiguous `url` returned an error early, and a `toolResult` wrapper set `isError`.
  Round-2 re-scan then raised THREE new findings, **two of them defects created by that very
  fix**: `matchByUrlSuffix` uses `endsWith` with no path boundary so `url:"get"` matches 19
  pages incl. `arget`/`config-get` (High `3514124777`, confirmed empirically); the ambiguous-url
  early-return skips the `id` fallback (Medium `3514124798`); plus the adjacent pre-existing
  version-default gap (Medium `3514124788`). Not ping-pong (no fix undone, no A↔B cycle) —
  it's churn: the get_page/search *resolution* logic is under-specified, and each patch exposes
  the next adjacent gap. Distinct from #3536/#3542/#3573 in that here the *fix itself* introduced
  the next round's findings, making the "consolidate, don't patch" call unambiguous. Recommended
  consolidation: one resolver with explicit handle precedence (exact url → unique id →
  boundary-anchored suffix url, collecting candidates across handles), path-segment-anchored
  suffix matching, and version semantics decided once.

### Cross-tool agreement
- **#3374 `num_docs`** — Claude (Critical #2, top-level review) and bugbot
  ("Wrong FT.INFO document count field", inline, 06-17) independently flagged
  the same `info.numDocs` → `num_docs` bug. Verified fixed in current code.

### Bot false positives (calibration signatures)
- **#3604 async fire-on-call mis-modeled, 2026-07-08 (first adjudicated bugbot FP).**
  Bugbot raised two Medium concurrency findings on new Lettuce doc examples, same
  heuristic ("concurrent Redis ops on a shared key"): (a) `3544441638` reactive
  `StringExample` — `Mono.when(setAndGet, setnx, setxx, mset, incrby).block()`
  subscribes cold publishers ~concurrently → **REAL** interleaving race on `bike:1`
  (corroborated: the sibling reactive `SortedSetExample` blocks per-step, and the
  async `StringExample` uses per-step `join()` — the `Mono.when` file is the outlier);
  (b) `3544581411` async `HashExample` — `CompletableFuture.allOf(delResult, hIncrBy,
  incrByGetMget)` claimed to race `del bike:1:stats` against the stats increments →
  **FALSE POSITIVE**: `delResult = asyncCommands.del(...)` fires *on call* (line 26),
  and a single Lettuce connection executes commands in write order, so the delete
  completes before `incrByGetMget`'s increments are dispatched (line ~120); `allOf`
  only awaits. Corroborated by upstream `redis/lettuce` shipping the identical async
  structure under CI. Lesson for the detector: bugbot's concurrency heuristic is sound
  for reactive **cold-publisher** subscription (`Mono.when`) but over-fires on **async
  fire-on-call** commands, which are already ordered by call site on one connection.
  When a "race" finding lands on Lettuce **async** code, check dispatch order before
  trusting it.
- **#3604 node "missing dependency" mis-modeled npm hoisting, 2026-07-08 (2nd bugbot FP on same PR).**
  Bugbot Medium `3545172685` claimed `run_node` installs only `redis` while the time-series
  node example `import`s `@redis/time-series`, so `./run.sh time_series_tutorial node` "fails
  at module load." **FALSE POSITIVE**: the `redis` npm metapackage (v6.1.0) declares
  `@redis/time-series` (and `@redis/bloom`/`json`/`search`/`client`) as **direct dependencies**;
  after `npm i redis` they sit hoisted-flat at `node_modules/@redis/time-series`, so the bare
  import resolves. Refuted empirically: `node_modules/@redis/` contains `time-series`, and the
  existing `results/time_series_tutorial_node.log` shows the module **loaded** and failed later
  on a `deepEqual` assertion (out-of-scope `.rules` staleness), not at import. Lesson: bugbot's
  "missing dependency / fails at module load" findings don't account for metapackage transitive
  hoisting — check `node_modules` (or the metapackage's `dependencies`) before trusting them.
  Same root as the async-`allOf` FP: bugbot mis-models a **dependency/ordering mechanic** it
  can't see from the diff alone.

- **#3612 pickup closing-sequence churn, 2026-07-10 (5th churn PR; docs/spec target).** Round 1
  flagged the label-drop *ordering* between `park-manifest.md` and `pickup` Step 5 (3558223727);
  the fix reordered Step 5. Round 2 (on the fix commit `d5b6c86fd`) then raised a High,
  `3558314964`: Step 4 reconciles + rebases but never *commits*, and Step 5 runs `/reflect` on
  "the reconciliation commit" + `/finalize` — both of which see committed history only, so an
  uncommitted reconcile is silently dropped from the squash. New, independent finding (not
  ping-pong — no fix undone, no A↔B cycle) but the **same under-specified subsystem**: the
  pickup closing sequence (reconcile → commit → reflect → finalize → drop-labels). The r1 edit
  sat right in that area, so it's a "fix-caused-its-own-next-round" flavour like #3585. Consolidated (r2 fix `7044aefc1`):
  an explicit ordered 4-step closing sequence in `pickup` Step 5 with the commit as step 1, and
  the manifest summary deferring to it as authoritative. **But r3 (2026-07-10) proved that
  consolidation was scoped too narrowly** — bugbot High `3558614316` "Missing push before merge":
  Step 5 commits locally but never pushes, and the squash merges the *remote* head, so the
  reconciliation commit **and** Step 4's rebased/merged-`main` history stay local and can be
  omitted from the merge. Landed on the r2 commit itself. This is the **2nd PR** exhibiting the
  #3536-round-6 meta-pattern ("when round N+1 finds another gap in an area you *just*
  consolidated, your boundary was wrong — widen it"): the true subsystem is the
  **local→remote→squash** dependency, not "is it committed." Recommended r4 fix is not another
  step but an **invariant**: before the `gh pr merge` hand-off the remote PR head must contain
  everything that must land (commit + push + Step 4 history + re-push after any `/reflect`
  amend). Calibration note: bugbot effectively performed the churn detection one seam per round
  — strong on procedure-completeness, which is why the fix must widen the boundary, not chase
  the next seam. Meta-flag: if even the invariant rewrite draws an r4, the closing sequence
  likely needs to leave prose for an actual checklist/script the skill references.
  **It did (r5/bugbot-r4, 2026-07-10): `3558867168` "Manifest omits rebase step"** — the
  *third* finding on the manifest-summary-vs-`pickup` drift (after r1 label-order and Codex's
  push-order P2). Root cause finally clear: the manifest kept a hand-maintained **copy** of
  pickup's closing sequence, and a copy drifts from its source every round — each fix matched
  one more element, the next round found the next omission (rebase, this time). Ended not by
  patching in "rebase" but by **eliminating the duplication**: manifest §5 now defers entirely
  to `/pickup` Steps 4–5 (the single authoritative sequence) and restates *no* steps, so there
  is nothing left to drift. Lesson (generalises the #3536-r6 "widen the boundary" rule): when a
  *summary/duplicate* of a procedure keeps drawing drift findings, the boundary to widen is
  "stop duplicating" — collapse to one source and point at it, don't keep re-syncing the copy.
  The 5-round arc (3 of them manifest-copy drift) is the textbook case for it.
  **Validated + a 2nd thread exposed (r6/bugbot re-scan of `03ec1e1f5`, 2026-07-10):** the
  re-scan of the collapsed manifest raised **nothing** on it — the copy-drift class is
  structurally closed (fix-quality confirmed). But a *distinct* churn thread surfaced underneath
  on the authoritative source: `3558994646` "Rebase before reconciliation commit"
  (pickup/SKILL.md) — Step 4 applies edits then `git rebase`, which fails on a dirty tree, while
  Step 5 commits only afterwards. This is thread B: the **git-operation ordering** in the
  closing sequence (commit r2 → push r3 → rebase-vs-commit r6) — three genuine ordering gaps in
  pickup itself, separate from the manifest-copy thread. Lesson refinement: de-duplication kills
  *copy* drift but not an under-specified *procedure*; six prose rounds is the signal to stop
  describing a precise git sequence in prose and make it one explicit ordered block/checklist
  (commit → rebase → link-check → /reflect → push → /finalize → drop-labels). Also: **longest
  clean churn-not-loop case on record (6 rounds, still no ping-pong)** — new independent finding
  each round, no fix undone, no A↔B cycle.
- **#3604 `@Test`/`[Fact]` "leak" ignores the build's marker stripping, 2026-07-09 (3rd FP flavour).**
  Bugbot Low `3552548353` flagged a Lettuce override for leaving `@Test` on `run()` *outside*
  any `REMOVE_START`/`REMOVE_END` region, concluding it would "expose JUnit markup in the client
  tab." The *observation* is correct (the `@Test` is unwrapped) but the *impact is wrong*:
  `build/components/example.py:185` strips any line matching the language's test marker
  (`@Test` for java/java-async/java-reactive, `[Fact]` for c#) during extraction, independent
  of REMOVE markers. Verified empirically — the rendered file has **zero** `@Test`. Lesson:
  when bugbot claims a test annotation (`@Test`/`[Fact]`/`[SkippableFact]`) "leaks" into a
  rendered client tab, check `build/components/example.py`'s `TEST_MARKER` stripping and the
  actual rendered `examples/...` output before trusting it — the extractor already removes them.
  (User flagged this one as a likely FP before I confirmed it — trust that instinct.)

- **#3612 "`merged` field doesn't exist" — list-vs-single-PR endpoint confusion, 2026-07-10 (4th bugbot FP flavour; docs/spec target, not code).**
  Bugbot High `3558223722` claimed the park/pickup snapshot command `gh api repos/<o>/<r>/pulls/<n> --jq '{merged, ...}'`
  selects a nonexistent top-level `merged` field (should use `merged_at`), so merge-state diffs "silently fail."
  **FALSE POSITIVE**: the **single-PR** REST endpoint (`GET /pulls/{n}`) — which the skills document — returns a
  top-level `merged` boolean. Refuted empirically twice: `gh api repos/redis/docs/pulls/3612 --jq '{merged}'` →
  `{"merged":false}`, and the DOC-6829 park run got `"merged":false` for spring-data-redis#3390 via the same path.
  Root cause: the **list** endpoint (`GET /pulls`) omits `merged`, so the field is context-dependent; bugbot generalised
  the list-shape to the single-PR call it can't distinguish from the diff. Same family as #3604's async/npm FPs — an
  **API/runtime mechanic bugbot can't see from the diff**. Lesson: when bugbot says "this field/API won't work", run the
  documented call before trusting it, especially where list-vs-item endpoint response shapes differ.

### Bot true positives (calibration — what bugbot is good at)
- **#3604 `Double.MIN_VALUE` ≠ −∞, 2026-07-09 (language-semantics strength).** Bugbot Low
  `3550287458` flagged `Range.create(Double.MIN_VALUE, 10)` in the Lettuce `SortedSetExample`
  async+reactive overrides: `Double.MIN_VALUE` is Java's smallest *positive* value (~4.9e-324),
  not −∞, so the range is ~0→10 not −∞→10 (the CLI uses `-inf`). Correct, and correctly scoped
  as "produces right output on this all-positive dataset but teaches a copy-paste-wrong pattern."
  This is the **complement** to the two dependency/ordering FPs on the same PR: bugbot is reliable
  on **pure language/API semantics** (values it can evaluate from the source alone) and unreliable
  on **runtime mechanics** it can't see (dispatch order, transitive deps). Reconciler value-add:
  the *identical* bug also sits in `tmp/datatypes/sorted-sets/SortedSetsExample.java` (jedis, from
  DOC-6057 `2569d4bc2`) — bugbot correctly did **not** flag it because it's pre-existing on `main`,
  outside the PR diff. So "bugbot found N instances" ≠ "N instances exist"; grep the whole tree for
  the pattern when a semantics finding lands.
