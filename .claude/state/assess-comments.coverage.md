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
| Branch/PR identification + arg handling | 🟢 corroborated | 4 | 2026-06-23 | #3415, #3507, #3374, #3536 |
| Multi-source collection (inline + top-level + reviews) | 🟢 corroborated | 5 | 2026-06-23 | #3415, #3507, #3510, #3374, #3536 |
| GraphQL thread-resolution pull (`isResolved`/`isOutdated`) | 🟢 corroborated | 3 | 2026-06-23 | #3510 (12/12 resolved), #3374 (15/15), #3536 (2/2 open) |
| Source-role tagging (bugbot/security/history/summary/ci/human) | 🟢 corroborated | 4 | 2026-06-23 | #3415, #3507, #3374, #3536 |
| Open/resolved split | 🟢 corroborated | 3 | 2026-06-23 | #3510, #3374, #3536 (0 resolved / 2 open) |
| Fix-quality spot-check (genuinely fixed vs silenced) | 🟢 corroborated | 2 | 2026-06-23 | #3510 (term removals landed), #3374 (`num_docs`, dropIndex landed) |
| "Resolved ≠ fixed" flag — **legitimate deferral** variant | 🟡 seen once | 1 | 2026-06-23 | #3510 (TS.BGET:122 left pending eng) |
| "Resolved ≠ fixed" flag — **still-broken** variant | ❓ untested | 0 | — | never confirmed a resolved thread that was actually still broken |
| Cross-tool **agreement** | 🟡 seen once | 1 | 2026-06-23 | #3374 (Claude + bugbot independently on `num_docs`) |
| **Contradiction** detection | 🟡 seen once | 1 | 2026-06-23 | #3415 (approval vs open bugbot finding). *(#3507 bugbot-vs-author was an off-branch manual demo — illustrative, not counted toward encounters.)* |
| **Ping-pong loop** detection | ❓ untested | 0 | 2026-06-23 | still no real loop. #3536 was the first *post-fix re-scan* tested: round-1 fixes (commit `da7c04a`) re-triggered a bugbot re-review that raised 3 new findings, but they were independent/pre-existing, not a back-and-forth — correctly judged NOT a loop (near-miss recorded below) |
| Approval-over-open-finding cross-check | 🟢 corroborated | 3 | 2026-06-23 | #3415 (dwdougherty), #3374 (dwdougherty low-confidence over open HIGH), #3536 (dwdougherty high-confidence — tested — over 2 open Mediums: benign variant) |
| Depth cap / prioritisation under load | 🟡 seen once | 1 | 2026-06-23 | #3374 (19 candidate findings → 4 deep-verified) |
| Mandatory deep-verify of resolved+not-outdated HIGH | ❓ untested | 0 | — | rule added 2026-06-23; not yet fired on a fresh run |
| Bot calibration (fixed-vs-dismissed ratio) | 🟢 corroborated | 2 | 2026-06-23 | #3374 (bugbot signal mostly accepted); #3536 (bugbot 5/5 findings valid across 2 rounds — high trust) |
| Codex second-opinion availability gate | 🟢 corroborated | 2 | 2026-06-23 | #3415, #3374 (CLI on PATH; #3374 had a real Codex review) |

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

### Resolved-but-still-broken
*(none confirmed yet — record any thread marked resolved whose bug was still
present in the code)*

### Cross-tool agreement
- **#3374 `num_docs`** — Claude (Critical #2, top-level review) and bugbot
  ("Wrong FT.INFO document count field", inline, 06-17) independently flagged
  the same `info.numDocs` → `num_docs` bug. Verified fixed in current code.
