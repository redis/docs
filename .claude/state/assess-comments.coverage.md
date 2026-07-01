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
| Branch/PR identification + arg handling | 🟢 corroborated | 5 | 2026-07-01 | #3415, #3507, #3374, #3536, #3542 |
| Multi-source collection (inline + top-level + reviews) | 🟢 corroborated | 6 | 2026-07-01 | #3415, #3507, #3510, #3374, #3536, #3542 (inline + top-level + 5 reviews) |
| GraphQL thread-resolution pull (`isResolved`/`isOutdated`) | 🟢 corroborated | 4 | 2026-07-01 | #3510 (12/12 resolved), #3374 (15/15), #3536 (2/2 open), #3542 (3 resolved / 1 open) |
| Source-role tagging (bugbot/security/history/summary/ci/human) | 🟢 corroborated | 5 | 2026-07-01 | #3415, #3507, #3374, #3536, #3542 (bugbot/human/ci/security/summary all present) |
| Open/resolved split | 🟢 corroborated | 4 | 2026-07-01 | #3510, #3374, #3536 (0 resolved / 2 open), #3542 (3 resolved / 1 open) |
| Fix-quality spot-check (genuinely fixed vs silenced) | 🟢 corroborated | 3 | 2026-07-01 | #3510 (term removals landed), #3374 (`num_docs`, dropIndex landed), #3542 (xargs+guard, narrowed exclude, SHA pin all landed) |
| "Resolved ≠ fixed" flag — **legitimate deferral** variant | 🟡 seen once | 1 | 2026-06-23 | #3510 (TS.BGET:122 left pending eng) |
| "Resolved ≠ fixed" flag — **still-broken** variant | ❓ untested | 0 | — | never confirmed a resolved thread that was actually still broken |
| Cross-tool **agreement** | 🟡 seen once | 1 | 2026-06-23 | #3374 (Claude + bugbot independently on `num_docs`) |
| **Contradiction** detection | 🟡 seen once | 1 | 2026-06-23 | #3415 (approval vs open bugbot finding). *(#3507 bugbot-vs-author was an off-branch manual demo — illustrative, not counted toward encounters.)* |
| **Ping-pong loop** detection | ❓ untested | 0 | 2026-07-01 | still no real loop. #3536 (4 rounds) + #3542 (round-2 "empty-scope" was a new adjacent finding, not a reopened concern or A↔B cycle) — all correctly judged NOT a loop. #3542 was churn, not a loop |
| **Subsystem churn** detection (repeated findings on one patched area) | 🟢 corroborated | 5 | 2026-07-01 | 2 distinct PRs. #3536 — 3 instances on review-handling / churn-feature / cap↔report contract. #3542 — 2 instances on the extraction *fail-loud-on-empty* contract: r1 High #3467309496 (ARG_MAX silent-green) fixed with xargs+zero-URL guard, r2 Medium #3498159511 exposed the sibling zero-files `exit 0` path the guard didn't cover. Worked examples below |
| Approval-over-open-finding cross-check | 🟢 corroborated | 4 | 2026-07-01 | #3415 (dwdougherty), #3374 (dwdougherty low-confidence over open HIGH), #3536 (dwdougherty high-confidence over 2 open Mediums: benign), #3542 (paoloredis "yep go ahead" 7 min after open Medium #3498159511 posted; neither human acknowledged it) |
| Depth cap / prioritisation under load | 🟡 seen once | 1 | 2026-06-23 | #3374 (19 candidate findings → 4 deep-verified) |
| Mandatory deep-verify of resolved+not-outdated HIGH | 🟡 seen once | 1 | 2026-07-01 | #3542 #3467309496 (High "Grep failure skips link check", resolved + isOutdated:false) — deep-verified against current code: xargs+guard genuinely present, so legitimately fixed (not still-broken). First real firing of the rule |
| Bot calibration (fixed-vs-dismissed ratio) | 🟢 corroborated | 3 | 2026-07-01 | #3374 (bugbot mostly accepted); #3536 (bugbot 5/5 valid); #3542 (bugbot 3/3 valid — High + 2 Medium, all verified real; 2 fixed, 1 open — high trust) |
| Codex second-opinion availability gate | 🟢 corroborated | 3 | 2026-07-01 | #3415, #3374 (CLI on PATH; #3374 had a real Codex review), #3542 (CLI on PATH) |

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

### Resolved-but-still-broken
*(none confirmed yet — record any thread marked resolved whose bug was still
present in the code)*

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

### Cross-tool agreement
- **#3374 `num_docs`** — Claude (Critical #2, top-level review) and bugbot
  ("Wrong FT.INFO document count field", inline, 06-17) independently flagged
  the same `info.numDocs` → `num_docs` bug. Verified fixed in current code.
