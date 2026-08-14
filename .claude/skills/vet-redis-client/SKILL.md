---
name: vet-redis-client
description: Score a community Redis client library against the docs team's quality checklist. Use when reviewing a PR or suggestion to add a client library to the redis.io clients page, or when asked to vet/evaluate a Redis client library.
---

# Vet a community Redis client library

Score a community-supported Redis client library against the docs team's 13-criterion checklist and produce an evidence-backed verdict (Recommend include / Needs discussion / Decline). Every score must cite a URL plus the specific fact observed (e.g. "last release v2.3.1, 2026-05-02"). Reviews, blog posts, project-published benchmarks, and social-media popularity are deliberately excluded as signals — only verifiable repo/registry facts count.

## 1. Identify the repository

The input is the client's GitHub repository, given as a URL or `owner/name`. If you are only given a package name, look up the package on its language's registry and follow the registry page's repository/homepage link to find the GitHub repo. If you cannot locate a source repository at all, stop and report that — an unreviewable source is disqualifying on its own.

## 2. Gather evidence

Use `gh` or the GitHub API when available; otherwise fetch the public HTML pages. Check all of the following before scoring:

- **GitHub repo front page** — last-commit date, stars, forks, "Used by" sidebar, license, README, archived banner.
- **`/releases` and `/tags`** — release recency and cadence over the last 2 years.
- **`/commits/<default-branch>`** — commit dates and distinct author names in the last 12 months (the contributors graph is JS-rendered; the commits list works).
- **Issues sorted by recently updated** (`/issues?q=is%3Aissue+sort%3Aupdated-desc`) and **`/pulls`** — maintainer responsiveness and triage.
- **CI status on the default branch** — README badges and the `/actions` tab.
- **`/security/advisories`** — open security advisories.
- **The language's package registry page** — npm / PyPI (use pepy.tech for downloads) / crates.io / pkg.go.dev / rubygems / packagist / nuget / pub.dev / hex.pm — for download counts, version/publish history, changelog, dependents.
- **The project's docs site and README** — quickstart, feature list, Redis version compatibility statement.

## 3. Score against the checklist

Score each criterion Pass (2) / Warn (1) / Fail (0). Every criterion's evidence must cite a URL and a concrete fact; if you cannot find evidence for a criterion, score it Warn at best and state explicitly what is missing.

### A. Maintenance

| # | Criterion | Pass (2) | Warn (1) | Fail (0) | Where to look |
|---|-----------|----------|----------|----------|---------------|
| A1 | Recent commit activity | Last commit on default branch ≤ 6 months ago | 6–18 months | > 18 months, or repo archived | GitHub repo front page / `…/commits/<default-branch>` |
| A2 | Release recency & cadence | ≥ 1 tagged release in last 12 months **and** visible cadence over the last 2 years | Release in last 12 months but thin/irregular history | No release in 12 months, or no tags at all | `…/releases`, `…/tags`, registry version list |
| A3 | Bus factor | ≥ 2 distinct committers active in the last year | Exactly 1 active committer | 0 active committers in the last year | `…/commits` author names (contributors graph is JS-rendered; the commits list works) |
| A4 | Responsiveness | Maintainers reply to recent issues; open PRs get triaged | Slow but eventual responses | Issues ignored/disabled, or a large pile of untouched open PRs | `…/issues?q=is%3Aissue+sort%3Aupdated-desc`, `…/pulls` |

### B. Adoption

| # | Criterion | Pass (2) | Warn (1) | Fail (0) | Where to look |
|---|-----------|----------|----------|----------|---------------|
| B1 | Registry downloads | High for its ecosystem (state the number **and** the threshold you applied — thresholds are language-relative; e.g. npm/PyPI: ≥ 100k/month Pass; pub.dev/hex.pm: ≥ 5k/month Pass, 500–5k Warn, < 500 Fail) | Middling for the ecosystem | Negligible for the ecosystem | npmjs.com / pypi.org (pepy.tech) / crates.io / pub.dev / packagist.org / nuget.org / hex.pm package page |
| B2 | Downstream usage | GitHub "Used by"/dependents in the hundreds+, or named independent downstream users | Some independent dependents | None, or only the author's own projects | GitHub repo sidebar "Used by", `…/network/dependents`, registry "dependents" tab |

### C. Engineering quality

| # | Criterion | Pass (2) | Warn (1) | Fail (0) | Where to look |
|---|-----------|----------|----------|----------|---------------|
| C1 | CI + tests | CI configured and green on default branch; real test suite | Test suite exists but CI absent/failing | Neither CI nor meaningful tests | README badges, `…/actions`, `test/` or `spec/` dirs |
| C2 | Release hygiene | Published to the official registry, semver tags, changelog/release notes maintained | Registry + semver but no changelog (or unverified publisher) | Not on the official registry, or chaotic versioning | Registry page + changelog tab, `…/tags` vs registry versions |
| C3 | License & security | OSI-approved license; no open security advisories | License OK but advisory hygiene unclear | Non-OSI/no license, or open unpatched advisories | Repo sidebar License, `…/security/advisories` |

### D. Redis-specific fit

| # | Criterion | Pass (2) | Warn (1) | Fail (0) | Where to look |
|---|-----------|----------|----------|----------|---------------|
| D1 | Modern feature coverage (RESP3, cluster, TLS, ACL/AUTH, pub/sub, pipelining) | 4–5+ of these covered | 2–3 covered | 0–1 covered | README feature list, changelog, API reference (search for RESP3/cluster/TLS/subscribe/pipeline) |
| D2 | Stated Redis version compatibility | Docs explicitly state compatibility with Redis 7.x/8.x | Compatibility implied (recent feature work) but not stated | No compatibility statement anywhere | README, docs site, CI matrix |

### E. Documentation

| # | Criterion | Pass (2) | Warn (1) | Fail (0) | Where to look |
|---|-----------|----------|----------|----------|---------------|
| E1 | README quickstart | Install → connect → set/get a fresh user can follow | Partial (examples exist but no clean end-to-end path, or non-English gaps) | No usable quickstart | Repo README |
| E2 | Docs beyond README | Maintained API reference or docs site with guides | Auto-generated API reference only | Nothing beyond README | Docs link in README/registry sidebar (readthedocs, pub.dev dartdoc, docs.rs, etc.) |

## 4. Total and verdict

13 criteria × 2 points = **26 max**.

| Total | Verdict |
|-------|---------|
| ≥ 21 | **Recommend include** |
| 14–20 | **Needs discussion** (list the specific Warn/Fail items to resolve) |
| < 14 | **Decline** (cite the failing criteria in the PR response) |

**Hard stops regardless of total:** archived repo, no OSI license, or open unpatched security advisory → **Decline**. Check these first; if one applies, still complete the scorecard for the record, but the verdict is Decline no matter the total.

## 5. Output format

Produce, in this order:

1. A header naming the library, its repo URL, its registry URL, and the review date.
2. A scorecard table with columns: criterion | score | evidence. Every evidence cell must contain at least one URL and the concrete fact observed (dates, counts, version numbers). If evidence for a criterion could not be found, score Warn at best and say what is missing.
3. The total (n / 26) and the verdict per the thresholds above, noting explicitly whether any hard stop applies.
4. A 2–3 sentence summary of the standout strengths and weaknesses.