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
- **The language's package registry page** — npm / PyPI (use pepy.tech for downloads) / crates.io / pkg.go.dev / rubygems / packagist / nuget / pub.dev / hex.pm / Maven Central (JVM: Scala, Java, Kotlin) — for download counts, version/publish history, changelog, dependents. Not every registry publishes all of these: **Maven Central and pkg.go.dev publish no download figures at all**, so a missing count there is a property of the registry, never a finding about the project — see the B1 note below before scoring it.
- **The project's docs site and README** — quickstart, feature list, Redis version compatibility statement.

### Verification traps

**A single index returning zero is not evidence of absence.** Before scoring any criterion Fail on a missing-from-the-registry or missing-from-the-graph reading, confirm it against the authoritative store, or state that you could not. Three instances that have each been one step away from producing a wrong score on a real submission:

- **Maven Central's search index lags.** `search.maven.org/solrsearch` returned 0 hits for `com.github.ghostdogpr:sage-core_3` while all seven published versions were sitting in the artifact store. The authoritative check is the store itself: `https://repo1.maven.org/maven2/<group/path>/<artifact>/maven-metadata.xml`, which lists every version and a `lastUpdated` stamp.
- **GitHub's dependents graph does not parse every ecosystem's manifest** — notably `build.sbt`, so it reports "0 Repositories / 0 Packages" for *any* sbt project regardless of real usage. Treat a zero as no-signal, not as a Fail on its own, and say which instrument was blind.
- **`mvnrepository.com` (which does show a "Used By" count) returns HTTP 403 to scripted requests.** It is browser-only; do not cite it as a source that a re-run can reproduce.

## 3. Score against the checklist

Score each criterion Pass (2) / Warn (1) / Fail (0). Every criterion's evidence must cite a URL and a concrete fact.

**Each criterion's three bands must be mutually exclusive and exhaustive** — numeric ones as half-open intervals, qualitative ones as cases. If a plausible project matches two bands, or none, the row is broken rather than the reviewer's judgement: fix the row. This applies to the qualitative criteria exactly as much as the numeric ones; every band gap found in this checklist so far has been in a row whose wording read perfectly well as English.

**A Fail requires positive evidence of the deficiency, from an instrument known to work for that ecosystem.** Where the figure does not exist, or the only instrument available is blind to the project's ecosystem, score **Warn** and name the gap — not Fail, and not Pass. This rule takes precedence over every band in the tables below: if a band's wording would produce a Fail on nothing more than a missing or unmeasurable reading, the score is Warn and the evidence cell says which instrument was blind. Absence of a claim is not evidence of absence of the thing claimed.

### A. Maintenance

| # | Criterion | Pass (2) | Warn (1) | Fail (0) | Where to look |
|---|-----------|----------|----------|----------|---------------|
| A1 | Recent commit activity | Last commit on default branch ≤ 6 months ago | > 6 and ≤ 18 months | > 18 months, or repo archived | GitHub repo front page / `…/commits/<default-branch>` |
| A2 | Release recency & cadence | ≥ 1 release in last 12 months **and** visible cadence over the last 2 years | Release in last 12 months but thin/irregular history | No release in 12 months | `…/releases`, `…/tags`, registry version list — a release counts whether it is evidenced by a git tag or by a registry publish; score only recency and cadence here, and leave missing tags to C2 |
| A3 | Bus factor | ≥ 2 distinct committers active in the last year | Exactly 1 active committer | 0 active committers in the last year | `…/commits` author names (contributors graph is JS-rendered; the commits list works) |
| A4 | Responsiveness | Maintainers reply to recent issues; open PRs get triaged | Slow but eventual responses, **or** too little inbound activity to judge (say so, and give the counts) | Issues ignored/disabled, or a large pile of untouched open PRs | `…/issues?q=is%3Aissue+sort%3Aupdated-desc`, `…/pulls` |

### B. Adoption

| # | Criterion | Pass (2) | Warn (1) | Fail (0) | Where to look |
|---|-----------|----------|----------|----------|---------------|
| B1 | Registry downloads | ≥ the ecosystem's Pass threshold, per the table below | ≥ the Fail floor and < the Pass threshold | < the Fail floor | npmjs.com / pypi.org (pepy.tech) / crates.io / pub.dev / packagist.org / nuget.org / hex.pm package page |
| B2 | Downstream usage | ≥ 100 dependents, **or** ≥ 1 named independent downstream user of real substance | 1–99 dependents, **or** no dependents figure obtainable for the ecosystem (state which instrument was blind) | 0 dependents from an instrument that does work for this ecosystem, and none named | GitHub repo sidebar "Used by", `…/network/dependents`, registry "dependents" tab; for Go, pkg.go.dev's "Imported by" count is a working substitute |

**B1 thresholds are ecosystem-relative.** State the number you found **and** the threshold triple you applied. Monthly downloads:

| Ecosystem | Pass | Fail floor |
|---|---|---|
| npm, PyPI | ≥ 100k | < 10k |
| crates.io, packagist, nuget | ≥ 20k | < 2k |
| pub.dev, hex.pm | ≥ 5k | < 500 |

For a registry not listed, pick a triple in proportion to that ecosystem's size and **state it** — the Pass threshold and a Fail floor an order of magnitude below it, matching the pattern above. Naming all three bands is the requirement; the specific numbers are a starting point a reviewer may override with a stated alternative. Two registries are absent from the table because they publish no figures at all rather than because a triple is missing — do not invent one for them, see the note below.

**Ecosystems that publish no download figures at all:** Maven Central (JVM — Scala, Java, Kotlin) and pkg.go.dev (Go). B1 is unscoreable there, so cap it at Warn and state that the number does not exist rather than implying the project has poor uptake — the same limitation hits every client in that language. Note the asymmetry: Go loses B1 but keeps B2 via "Imported by", whereas a JVM project's dependents are only visible through named adopters (`mvnrepository.com`'s "Used By" is browser-only, per the traps above).

### C. Engineering quality

| # | Criterion | Pass (2) | Warn (1) | Fail (0) | Where to look |
|---|-----------|----------|----------|----------|---------------|
| C1 | CI + tests | CI configured and green on default branch; real test suite | Test suite exists but CI absent/failing, **or** CI green while exercising no real tests (lint/build only) | Neither CI nor meaningful tests | README badges, `…/actions`, `test/` or `spec/` dirs |
| C2 | Release hygiene | On the official registry, semver, changelog/release notes maintained, **and** published versions traceable to a source state (git tags or equivalent) | On the registry with semver but missing one of those — no changelog, or no tags to trace versions to, or an unverified publisher | Not on the official registry, or chaotic versioning | Registry page + changelog tab, `…/tags` vs registry versions (on the JVM, diff the tags against `repo1.maven.org/maven2/…/maven-metadata.xml`, not the search index) |
| C3 | License & security | OSI-approved license; no open security advisories | License OK but advisory hygiene unclear | Non-OSI/no license, or open unpatched advisories | Repo sidebar License, `…/security/advisories` |

### D. Redis-specific fit

| # | Criterion | Pass (2) | Warn (1) | Fail (0) | Where to look |
|---|-----------|----------|----------|----------|---------------|
| D1 | Modern feature coverage (RESP3, cluster, TLS, ACL/AUTH, pub/sub, pipelining) | ≥ 4 of these 6 covered | 2–3 covered | ≤ 1 covered | README feature list, changelog, API reference (search for RESP3/cluster/TLS/subscribe/pipeline) |
| D2 | Stated Redis version compatibility | Docs explicitly state compatibility with Redis 7.x/8.x | Explicitly stated but only for an older range (≤ 6.x), **or** implied by recent feature work but not stated | No compatibility statement anywhere | README, docs site, CI matrix |

### E. Documentation

| # | Criterion | Pass (2) | Warn (1) | Fail (0) | Where to look |
|---|-----------|----------|----------|----------|---------------|
| E1 | Quickstart | Install → connect → set/get a fresh user can follow, in the README or one hop from it | Partial (examples exist but no clean end-to-end path, or non-English gaps) | No usable quickstart anywhere | Repo README and the page it links to for getting started (a quickstart on the docs site counts; note where it lives, since a README with no inline snippet is worth saying out loud) |
| E2 | Docs beyond README | Maintained API reference or docs site with guides | Auto-generated API reference only, **or** a hand-written docs site that is no longer maintained (say how you can tell) | Nothing beyond README | Docs link in README/registry sidebar (readthedocs, pub.dev dartdoc, docs.rs, etc.) — the quickstart already scored in E1 does not by itself satisfy this; E2 asks what exists *beyond* it |

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

Keep observations that are not criteria out of the scorecard and out of anything published — note them separately for the reviewer. They carry no score, and in a public reply they read as a judgement on the author rather than on the library.

## 6. Record the verdict

Do not save the scorecard as a file in this repo: readers expect a checked-in file to be current, and half of a scorecard's facts (open-issue counts, "last commit 5 days ago", the total itself) are false within months. A dated snapshot belongs somewhere that is understood to be a snapshot.

**On an accept**, put it in the squash commit message of the PR that adds the table row. That commit touches exactly the one line being justified, so `git blame` on the row leads a future reviewer straight to the evidence. Write it as a snapshot: name the review date and the version observed, keep the four-or-so non-Pass criteria in full with their evidence, and compress the passes to a single line — a Pass is cheap to re-derive, whereas *why* a criterion was scored down (and what instrument was blind when it was) is not.

Anchor it with trailers so the set stays enumerable across reviews (`git log --grep='^Vetted:'`), using the vocabulary in `.claude/skills/_shared/commit-trailers.md`:

```
Vetted: <library> <n>/26 <verdict> <YYYY-MM-DD>
Gaps: <what could not be measured, and which instrument was blind>
Recheck: <expiry condition — an age, or a signal such as the sole maintainer going quiet>
```

This repo squashes with `squash_merge_commit_message = COMMIT_MESSAGES`, so the default body is the contributor's WIP commits concatenated and the scorecard is silently discarded. Override it explicitly:

```
gh pr merge <n> --squash --subject "<subject>" --body-file <scorecard-file>
```

**On a decline**, the PR reply comment is the record — a closed PR is still discoverable by searching the repo URL. There is no commit to carry it, so the accept and decline paths are deliberately asymmetric; a queryable data file only earns its place if the volume of reviews ever makes that gap hurt.