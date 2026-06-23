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
| Branch/PR identification + arg handling | 🟢 corroborated | 3 | 2026-06-23 | #3415, #3507, #3374 |
| Multi-source collection (inline + top-level + reviews) | 🟢 corroborated | 4 | 2026-06-23 | #3415, #3507, #3510, #3374 |
| GraphQL thread-resolution pull (`isResolved`/`isOutdated`) | 🟢 corroborated | 2 | 2026-06-23 | #3510 (12/12 resolved), #3374 (15/15) |
| Source-role tagging (bugbot/security/history/summary/ci/human) | 🟢 corroborated | 3 | 2026-06-23 | #3415, #3507, #3374 |
| Open/resolved split | 🟢 corroborated | 2 | 2026-06-23 | #3510, #3374 |
| Fix-quality spot-check (genuinely fixed vs silenced) | 🟢 corroborated | 2 | 2026-06-23 | #3510 (term removals landed), #3374 (`num_docs`, dropIndex landed) |
| "Resolved ≠ fixed" flag — **legitimate deferral** variant | 🟡 seen once | 1 | 2026-06-23 | #3510 (TS.BGET:122 left pending eng) |
| "Resolved ≠ fixed" flag — **still-broken** variant | ❓ untested | 0 | — | never confirmed a resolved thread that was actually still broken |
| Cross-tool **agreement** | 🟡 seen once | 1 | 2026-06-23 | #3374 (Claude + bugbot independently on `num_docs`) |
| **Contradiction** detection | 🟡 seen once | 1 | 2026-06-23 | #3415 (approval vs open bugbot finding); #3507 (bugbot vs author intent, off-branch) |
| **Ping-pong loop** detection | ❓ untested | 0 | — | never observed a real loop; all PRs so far had clean find→fix→resolve flow |
| Approval-over-open-finding cross-check | 🟢 corroborated | 2 | 2026-06-23 | #3415 (dwdougherty), #3374 (dwdougherty low-confidence over open HIGH) |
| Depth cap / prioritisation under load | 🟡 seen once | 1 | 2026-06-23 | #3374 (19 candidate findings → 4 deep-verified) |
| Mandatory deep-verify of resolved+not-outdated HIGH | ❓ untested | 0 | — | rule added 2026-06-23; not yet fired on a fresh run |
| Bot calibration (fixed-vs-dismissed ratio) | 🟡 seen once | 1 | 2026-06-23 | #3374 (bugbot signal mostly accepted) |
| Codex second-opinion availability gate | 🟢 corroborated | 2 | 2026-06-23 | #3415, #3374 (CLI on PATH; #3374 had a real Codex review) |

## Worked examples library

Concrete real-world signatures, so detection sharpens over time. Add to this
whenever a rare pattern is seen for the first time.

### Ping-pong loops
*(none observed yet — when the first real loop appears, record the tool
sequence, the comment ids, and the commits between them here)*

### Resolved-but-still-broken
*(none confirmed yet — record any thread marked resolved whose bug was still
present in the code)*

### Cross-tool agreement
- **#3374 `num_docs`** — Claude (Critical #2, top-level review) and bugbot
  ("Wrong FT.INFO document count field", inline, 06-17) independently flagged
  the same `info.numDocs` → `num_docs` bug. Verified fixed in current code.
