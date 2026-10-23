---
name: vet-redis-tool
description: Score a third-party Redis tool (GUI, desktop database manager, web console, CLI) against the docs team's quality checklist. Use when reviewing a PR or suggestion to add an entry to the Third-party tools section of the Client tools page (content/develop/tools/_index.md), when re-vetting an entry already on that page, or when asked to vet/evaluate a Redis tool. For client libraries, use /vet-redis-client instead.
---

# Vet a third-party Redis tool

Score a third-party Redis tool against the docs team's 19-criterion checklist and produce an evidence-backed verdict (Recommend include / Needs discussion / Decline). Every score must cite a URL plus the specific fact observed (e.g. "repo created 2026-09-28"). Reviews, blog posts, vendor-published comparisons, and social-media popularity are deliberately excluded as signals — only verifiable repo, release, and artifact facts count.

This is the tools sibling of `/vet-redis-client`, and keeps its scoring discipline. It differs in three ways:

- **A tool is an installed application that holds credentials to someone's database**, so trust and safety (section C) carry weight that has no counterpart for a library.
- **There is no package registry**, so adoption is read from weaker, independent signals.
- **Closed-source tools are eligible.** The page already lists one (VisuaLeaf), so an OSI license is not a hard stop here.

Most of the tools on this page are multi-database managers. **The criteria in sections A and B measure the project; section D measures its Redis support.** A mature project can carry young, thin, or beta Redis support, and D is where that shows.

## 1. Identify the tool

The input is the PR adding the entry, the tool's repository, its website, or an entry already on the page (a re-vet). From any of these, establish:

- The source repository, if public. For a closed-source tool, the publisher (company or person) and where the binaries are published.
- The **entry text**: the PR diff for a new entry, or the current subsection of `content/develop/tools/_index.md` for a re-vet. Section E scores it, and its claims are hypotheses to verify, not evidence.
- The submitter's relationship to the tool. Record it, but **do not score it**: most entries are submitted by the tool's own developer, and that is fine. Note it for the reviewer (section 5).

If you cannot find either public source or an identifiable publisher, stop and report that — an unattributable binary is disqualifying on its own.

## 2. Gather evidence

`gh`, `whois`, and large release downloads need an unsandboxed call in this environment. `$TMPDIR` differs between sandboxed and unsandboxed calls, so keep scratch files under one explicit absolute path (the session scratchpad) rather than `$TMPDIR`. Vendor websites are often refused by the sandbox; a refusal is the boundary, so note the gap and use WebFetch or the browser tools rather than finding another route. Check all of the following before scoring:

- **Repo metadata** — `gh api repos/<owner>/<repo>`: `created_at`, `pushed_at`, stars, forks, license, archived flag.
- **Releases** — `gh api repos/<owner>/<repo>/releases`: tags, `published_at`, and per-asset `download_count`.
- **Commits** — author names over the last 12 months, and which accounts are the same person.
- **Issues and PRs** — the A4 sample, and who opens them.
- **Source tree** — `gh api 'repos/<owner>/<repo>/git/trees/HEAD?recursive=1'` to find the Redis code, then the contents API to read it. Do not rely on GitHub code search (see the traps).
- **CI** — the workflow list (`…/contents/.github/workflows`), and the run that built the latest release. Its logs often include the signing and notarization verification that C1 needs (`gh api …/actions/jobs/<id>/logs`).
- **Updater metadata** — for Electron and Tauri apps, `latest.yml`, `latest-mac.yml`, or `latest.json` next to the release artifacts. C2 reads it.
- **Security** — `…/security-advisories`, SECURITY.md or `/.well-known/security.txt`, the vendor's security or status page, and an NVD keyword search for the product name. For dependency advisories, list the packages the **shipped artifact** contains (for Electron, the `package.json` files inside `resources/app.asar`), not the lockfile, which includes development dependencies. Check each hit against OSV and confirm the shipped version is inside the advisory's affected range; OSV has false positives.
- **Vendor material** — license or terms, pricing, privacy policy, telemetry statement, and the Redis docs page. **Read pricing and feature matrices from the rendered page** (the Playwright browser tools) or from edition gating in the source, never from a WebFetch summary.
- **The domain's registration date** (`whois <domain>`), as a cross-check on project age.
- **Distribution listings** — official Homebrew, winget-pkgs, Flathub, the app stores, distro repositories, and the AUR.

**Signature inspection without execution is allowed.** You may download an installer to the scratch path and inspect it without running it:

- **macOS:** mount the `.dmg` with `hdiutil attach -nobrowse -readonly`, then run `codesign -dv --verbose=4`, `codesign --verify --deep --strict`, and `xcrun stapler validate` on the `.app`. `spctl -a -vv` is also useful, but on a machine with Gatekeeper disabled it reports `override=security disabled`; the `codesign` and `stapler` results are the evidence.
- **Windows:** `osslsigncode verify` on the installer. If no Authenticode verifier is available, the Windows check is blind — do not improvise one.
- **Electron updater config:** extract `resources/app-update.yml` from the installer. C2 needs it.

Detach mounted images and delete the downloads afterwards. Never launch the app.

**Do not install or run the tool without asking first.** A hands-on run is a legitimate way to verify rows that source cannot (section 3), but it means executing untrusted code with network access. If the user agrees, run it against a throwaway Redis on a spare port holding no real data — never against 6379 or any server with credentials worth stealing.

### Verification traps

- **Commit dates are set by the author, not by GitHub.** History can be imported or backdated. Date the project from server-side timestamps: repo `created_at`, the first release's `published_at`. The domain registration counts only with evidence that it hosted this product at that date (an archive capture) — domains are bought and reused. Use an earlier date only on positive evidence of an earlier public life, and cite it.
- **One person can appear as several accounts.** An org or bot account committing alongside its owner is still one maintainer. Merge accounts that share a name, email, or profile before counting committers. Exclude dependency bots and AI co-author accounts (`claude`, `copilot`, `*[bot]`) from every count, and commits whose author name is an AI agent even when they sit under a human login.
- **Release download counts include non-installer assets.** Updater metadata (`latest*.yml`, `latest.json`), `.blockmap` files, Electron's macOS `*-mac.zip` updater payloads, Tauri's `.app.tar.gz`, checksums, signatures, and on-demand plugin or driver bundles are fetched by the app itself, often far more than the installers. Count installer assets only (`.dmg`, `.exe`, `.msi`, `.deb`, `.rpm`, `.AppImage`, `.flatpak`, `.snap`, `.pacman`), and leave out releases that exist only to host bundles.
- **GitHub code search fails silently.** New repositories are not indexed yet, so a search returning nothing is no evidence of absence. Walk the git tree instead.
- **WebFetch summaries are unreliable for exact facts.** A summarizing fetch has returned two different wrong answers for the same pricing table. For pricing, feature matrices, and any vendor sentence a score rests on, read the rendered page or quote the raw text, and re-check before scoring.
- **Website analytics are not app telemetry.** A site that runs Google Analytics says nothing about whether the app phones home. Score C4 from the app's source, docs, or privacy policy.

### Evidence strength

From strongest to weakest: **source code** and **inspection of the shipped artifact** — where these two conflict, the artifact wins, because it is what users run — then **a hands-on run**, then **vendor product documentation** (docs pages, settings references, privacy policy), then **vendor marketing pages**, then **README and entry claims**.

- A capability supported only by a marketing page, a README, or the entry text is unverified: it can reach Warn at most.
- A vendor statement of a *limitation* (an admission against interest, such as "SSH tunneling is not available yet") counts as verified absence, wherever it appears — including the entry text.
- **Where sources conflict**, cite both, score from the stronger source, and if they are equally strong score the lower band and say the evidence conflicts. A hard stop resting on conflicting or vendor-docs-only evidence is unconfirmed (section 4).

## 3. Score against the checklist

Score each criterion Pass (2) / Warn (1) / Fail (0). Every criterion's evidence must cite a URL and a concrete fact.

**Each criterion's three bands must be mutually exclusive and exhaustive** — numeric ones as half-open intervals, qualitative ones as cases. If a plausible tool matches two bands, or none, the row is broken rather than the reviewer's judgement: fix the row.

**Where a band offers alternative routes ("X **or** Y"), every lower band must explicitly exclude those routes**, or the tie-break below silently kills the alternative.

**If more than one band still applies, score the lowest one** and say in the evidence cell that the row needs repair. Prefer restructuring a row around the single axis it measures over appending another "or" clause.

**A Fail requires positive evidence of the deficiency.** Where the figure does not exist, or the only instrument available is blind (closed source, a feature you could not exercise), score **Warn**, mark the evidence cell **(blind)**, and name the gap — not Fail, and not Pass. This rule takes precedence over every band below. Blind Warns are counted in section 4, so that a tool which documents nothing cannot score like one measured as mediocre.

**Closed source and source-reading rows.** Rows that read source code (C2–C4, D2, D4) can instead be satisfied by vendor product documentation that states the behavior explicitly, or by a hands-on run. Say which instrument you used. A3, C1, and D1 are excluded on purpose: their own bands say what closed-source evidence can reach.

**Checklist rows with unverified items** (D2, D4): count only verified items. If resolving the unverified items could change the band, score Warn.

**Time windows.** "The last 12 months" means the project's whole life when it is younger than that; say so in the evidence cell.

### A. Project maturity and maintenance

| # | Criterion | Pass (2) | Warn (1) | Fail (0) | Where to look |
|---|-----------|----------|----------|----------|---------------|
| A1 | Project age | ≥ 12 months since the earliest public evidence of the project | ≥ 6 and < 12 months | < 6 months | Repo `created_at`, first release `published_at`, an archived capture of the product site — per the traps |
| A2 | Activity | Not archived, and a release in the last 6 months | Not archived, no release in the last 6 months, and a release or commit within the last 18 months — **or** no release history is observable (closed source with no changelog or dated releases, blind) | Archived, or an observable release and commit history shows nothing within the last 18 months | `…/releases`, `…/commits`, vendor changelog for closed source. A burst of releases in a tool's first weeks is recency, not cadence — A1 already covers the missing history |
| A3 | Bus factor | ≥ 2 distinct people each authored ≥ 10% of commits in the last 12 months | Commits exist in the last 12 months but fewer than 2 people reach 10%, **or** the team is not observable (closed source, blind) | A public repository with no commits in the last 12 months | Commit author names, after merging accounts and excluding bots, per the traps. A vendor-named team does not reach Pass, since it cannot be checked |
| A4 | Responsiveness | ≥ 80% of a sample of ≥ 5 items got a maintainer response within 14 days | ≥ 30% and < 80% of a sample of ≥ 5 items, **or** a public inbound channel exists but fewer than 5 items qualify (give the count), **or** the only channel is private (support email, blind) | < 30% of a sample of ≥ 5 items, or no inbound channel at all, public or private | The sample: the 20 most recent issues and PRs opened by people outside the project (not maintainers, not bots), each at least 14 days old. Count only channels the project offers — a project with no PR channel is scored on issues alone. A **response** is a comment, review, close, or merge by a maintainer; a label alone is not. **Maintainers** are A3's ≥ 10% committers plus any account seen merging or closing others' items |

### B. Adoption

| # | Criterion | Pass (2) | Warn (1) | Fail (0) | Where to look |
|---|-----------|----------|----------|----------|---------------|
| B1 | Independent usage | ≥ 2 of the 4 signals below are met | Exactly 1 is met, **or** none is met and at least one could not be measured (blind) | All 4 were measured and none is met | Repo front page, issues, release assets, distribution listings |
| B2 | Distribution | Accepted into a channel that reviews submissions: official Homebrew (`homebrew/core` or `homebrew/cask`), winget-pkgs, Flathub, the Mac App Store, the Microsoft Store, or a distribution's official repositories | Installable, but not accepted into any reviewed channel: the maintainer's own Homebrew tap, the AUR, a website download, or a submission still pending | No installable distribution — build from source only | `brew info`, the winget-pkgs and Flathub repos, store listings, the README's install section. Only merged or published listings count |

**B1 signals:**

1. ≥ 200 GitHub stars (all-time).
2. ≥ 10 distinct accounts outside the project opening issues or PRs in the last 12 months.
3. ≥ 10,000 installer-asset downloads across releases in the last 12 months (installers only, per the traps). Self-hosted binaries with no published counts are blind.
4. Packaged by an independent third party — someone outside the project maintains it in a distribution channel (for example an AUR package or a distro package).

**Outside the project** means not a maintainer (A4's definition), not a member of the project's GitHub organization, and showing no affiliation with the project or vendor (profile company, vendor email domain, or signing agreements or releases on the vendor's behalf). Count only accounts you can establish as outside; say how many you excluded as affiliated.

State each number you found and whether it met the signal. These thresholds are a starting point; a reviewer may override one with a stated alternative. A1 and B1 both hold back a brand-new tool, and that is deliberate: A1 measures elapsed time and B1 measures uptake, and a young tool with real uptake still passes B1. Stars can be bought — a star history with a single spike is worth a reviewer note, but is not scored.

### C. Trust and safety

| # | Criterion | Pass (2) | Warn (1) | Fail (0) | Where to look |
|---|-----------|----------|----------|----------|---------------|
| C1 | Binary provenance | A signature check shows the current release is signed on every OS it ships for where signing is the norm (macOS: notarized Developer ID; Windows: valid Authenticode), by the person or organization that controls the project | Not Pass, but either signed on some such OS, **or** built by a public CI workflow from tagged source, **or** signing was not checked (blind) | Inspection shows the release unsigned on every such OS, and there is no CI-build trace to source | Your own inspection of a downloaded installer (section 2), or the release CI run's verification log for the same release. A workflow that *configures* signing, or a CI log that says signing or notarization succeeded without verifying the result, is not a signature check. A person's certificate (for example a Developer ID in the founder's name) counts when that person owns or maintains the project. An unverifiable Windows signature is blind. Linux has no platform-signing norm and is excluded |
| C2 | Runtime code fetch | Every code artifact the app fetches by default (updates, drivers, engines) is verified against a signature, a hash pinned in the installed app, or a hash from an index signed with a pinned key — or the app fetches none. Updates verified against the app's code signature count: Squirrel.Mac on macOS, and electron-updater on Windows only when the installer's `resources/app-update.yml` names a `publisherName` — without it, electron-updater checks only the unsigned hash in `latest.yml` | Neither Pass nor Fail: every fetch path not verified as Pass is verified only against an unsigned hash from the same location, **or** only when a hash happens to be present, **or** its verification cannot be determined (blind) | Any default fetch path is verified to fetch and run code with no verification — this decides the row whatever the other paths show | Updater metadata, driver and plugin loaders, docs. Name what is fetched. User-installed third-party extensions are recorded but not scored. If the Redis support itself is a plugin or extension, its install and update path counts as a default fetch path and is scored in the bands like any other |
| C3 | Credential storage | Saved secrets, or the key that encrypts them, are held in the OS credential store (Keychain, Credential Manager, Secret Service) or an external secret manager by default — or secrets are not saved by default | Neither Pass nor Fail — for example, secrets encrypted under a key derived from a user-supplied master password, or a storage path that cannot be determined (blind) | Any default storage path is verified recoverable by anyone who can read the user's files — this decides the row whatever the other paths show: plaintext by default (including encryption the user must opt in to), or a key stored beside the data or derived from a constant in the app or its source | Connection-storage and key-loading code, docs, a config file written during a test run. Record whether "remember password" is on by default |
| C4 | Telemetry and data egress | No telemetry, or opt-in only; **and** every path that sends Redis data, key names, or schemas off the machine (AI assistant, cloud sync, built-in MCP server) is opt-in and documented; **and** no service listens beyond loopback by default | Neither Pass nor Fail — for example, documented opt-out telemetry, an opt-in data path that is undocumented, or behavior that cannot be determined (blind) | Telemetry that is undisclosed or cannot be disabled; Redis data sent off the machine by default; or a service listening beyond loopback by default | Analytics or crash-reporting dependencies in the source, privacy policy, settings docs, AI provider config. **Opt-in** means an explicit setting that is off by default, or a per-use action that names the destination |
| C5 | License and terms | An OSI-approved license covering the Redis support, **or** published proprietary or source-available terms with a free tier that includes the Redis support | Published proprietary or source-available terms, but the Redis support needs a paid tier or a time-limited trial, **or** a closed-source tool whose terms could not be found (blind) | A public repository with no license — no license file, and GitHub's license API returns none — and no terms linked from the repository or the project website | Repo license, EULA, pricing page (rendered, per section 2). For open-core projects, check that the Redis code is outside the proprietary directories and not edition-gated |
| C6 | Security | A security-specific reporting channel exists (SECURITY.md, `security.txt`, or a security contact or page), **and** the current release ships no advisory of the kinds in the Fail band, **and** no other shipped dependency advisory | No advisory of the Fail kinds, but either no security-specific channel, **or** a shipped dependency advisory that is not of the Fail kinds — any severity with no shown path, or medium or low with one — **or** advisory status cannot be established (blind) | The current release is affected by an advisory against the tool itself, or ships a critical or high dependency advisory with a shown path from the tool's own code | `…/security-advisories` (published advisories only), the vendor's security or scanner page, NVD, and the shipped-artifact package list checked against OSV (section 2). "Affected" means the shipped version is in the advisory's range, whether or not upstream has a fix. A **shown path** is a call from the tool's own code to the affected function, found in source, or a vendor or upstream statement that the tool is affected. OSV and NVD establish the affected version, not reachability, so without that evidence an advisory has no shown path. A large Electron or Node app nearly always ships transitive highs; without a shown path they are Warn, not Fail. Patched historical CVEs are a reviewer note, not a score |

### D. Redis fit

Score these on how the tool handles Redis, not how many databases it supports. Apart from D1, these rows do not affect the verdict: they decide which gaps the entry must state (section 4).

| # | Criterion | Pass (2) | Warn (1) | Fail (0) | Where to look |
|---|-----------|----------|----------|----------|---------------|
| D1 | Depth of Redis support | Not Fail, and either tests that CI runs against a real Redis server **or** Redis-specific behavior demonstrated across ≥ 4 data types in a hands-on run | Not Fail, and neither Pass route holds: no tests run by CI (for example `#[ignore]` with no Redis service in CI) and no run covering ≥ 4 types — **or** closed source with only vendor docs (blind) | Redis is handled by a generic key-value adapter with no Redis-specific behavior. This takes precedence: a generic adapter that displays several types in a run is still Fail | The Redis driver/adapter directory, its tests, and the CI workflow that runs them |
| D2 | Production safety | Key discovery is verified not to use `KEYS`, **and** ≥ 4 of the 5 behaviors below are verified present | Neither Pass nor Fail | Key discovery uses `KEYS`, **or** ≥ 3 of the 5 verified absent | Key-browser, value-loading, and command-dispatch code, and the console UI |
| D3 | Topology | Both Cluster and Sentinel are supported | Exactly one is supported, **or** support cannot be determined (blind) | Verified standalone-only: neither is supported | Connection code and forms, docs. A vendor statement that a topology is not supported counts as verified absence |
| D4 | Connection and type coverage | ≥ 4 of the 5 items below verified supported | Neither Pass nor Fail | At most 1 item could be supported: verified-supported items plus unverified items total ≤ 1 | Connection code and forms, value views, docs |
| D5 | Maturity of the Redis support | In a stable public release for ≥ 12 months, and not labeled beta, preview, or experimental | In a stable public release for ≥ 6 months, and either < 12 months or still labeled beta, preview, or experimental | Not in a stable public release, or in one for < 6 months | The first stable (not beta or pre-release) release whose changelog or source includes the Redis support; labels in the UI source, the connection form, and the docs. Record who wrote the Redis code in the evidence cell — a single author of a mature project's Redis driver is worth a reviewer note |

**D2 behaviors:**

1. **Bounded key discovery** — `SCAN` page by page, or with an explicit cap. Walking the whole keyspace on every view does not count, even with `SCAN`.
2. **Bounded value loading** — values of every type loaded in pages or with a size cap; whole-value `HGETALL`, `GET`, or `LRANGE 0 -1` on any type means absent.
3. **Confirmation before destructive commands** (`FLUSHDB`, `FLUSHALL`, bulk deletes), including when typed into the tool's console. Staged edits that must be applied are confirmation for edits, not for the console. The console path alone settles it: if a typed `FLUSHALL` reaches the server unconfirmed, the behavior is absent.
4. **A default-deny read-only mode** — when enabled, commands the tool does not recognize as read-only are blocked, not passed through.
5. **`MONITOR` only on explicit user action.** A tool that never issues `MONITOR` has this behavior.

**D4 items:** TLS; TLS client certificates; ACL username-and-password authentication; a stream view (type-aware display of stream entries with their IDs — a console that can send `XRANGE` does not count); a JSON view (type-aware display of JSON keys — a console that can send `JSON.GET` does not count).

### E. The entry

Score these against the entry text from section 1. Both must reach Pass before merge (section 4).

| # | Criterion | Pass (2) | Warn (1) | Fail (0) | Where to look |
|---|-----------|----------|----------|----------|---------------|
| E1 | Claims match the evidence | No claim is contradicted, every capability and limitation claim is verified, **and** the entry states the Redis gaps found in D2–D5 | No claim is contradicted, but some claims could not be verified **or** known gaps are omitted | At least one claim is contradicted by the evidence | The entry, checked line by line against sections C and D |
| E2 | Fits the page | Has all four elements of the established pattern and needs no edits | At most one of the four elements is missing, **or** all are present but edits are needed: marketing words, commands not named in the capability list, length over 1.5× the longest neighboring entry | Two or more of the four elements are missing | The other entries in the Third-party tools section |

**Reading claims for E1.** Read each claim as a typical reader would. Pricing and availability are claims: a feature listed under an unqualified "free" or "open-source" opening that needs a paid tier, or a download link labeled "free" for a tool whose Redis support is paid, is a contradiction, not an omission. A missing gap statement is scored here only, not again in E2.

**The established pattern** for an entry has four elements: an opening paragraph naming the platforms and the license or pricing; a bulleted capability list that names the Redis commands behind each feature (`SCAN`, `SLOWLOG GET`, `CLIENT LIST`); a connection paragraph covering topologies, TLS, authentication, and what is *not* supported; and a download link. Apply the repo's style rules (`AGENTS.md`) — no "seamless", "powerful", "simply", "easily".

## 4. Total and verdict

The Third-party tools section is a directory: it lists tools that work with Redis and says plainly what each one does not do. So the scores split into three jobs:

- **Sections A–C decide the listing** — is the tool alive, adopted, and safe to point readers at? 12 criteria × 2 points = **24 max**.
- **Section D decides what the entry must say.** Thin Redis support is not a reason to decline; an entry that hides it is. Every D2–D5 row below Pass is a gap the entry must state, which is what E1's Pass condition checks. D1 is the exception — see the gates.
- **Section E decides whether the entry is ready to merge.** E1 and E2 must both reach Pass before merge, whatever the verdict. The edits from section 5 are a merge condition, not a reason to decline.

| Verdict | A–C total (of 24) |
|---------|-------------------|
| **Recommend include** | ≥ 17 |
| **Needs discussion** (list the specific Warn/Fail items to resolve) | 12–16 |
| **Decline** (cite the failing criteria in the PR response) | < 12 |

Record the full 38-point total too. It is not part of the verdict, but it makes reviews comparable over time.

**Gates, regardless of the A–C total:**

- **Too young:** A1 Fail (under 6 months) → **Decline (not yet)**. Give the date the tool turns 6 months old, so the reply can invite a resubmission then.
- **No real Redis support:** D1 Fail (a generic key-value adapter) → **Decline**. There is nothing Redis-specific to list.
- **Too little evidence:** more than 3 blind Warns in sections A–C → at most **Needs discussion**, and the discussion item is the missing evidence.
- **Hard stops:** archived repo; a public repository with no license and no terms (C5 Fail); an advisory of the kinds in C6's Fail band; unverified runtime code fetch (C2 Fail) → **Decline**. Check these first. If one applies, still complete the scorecard for the record.

**A hard stop must be confirmed.** If it rests only on vendor documentation or marketing, or on sources that conflict, the verdict is **Needs discussion (unconfirmed hard stop)** until source code, inspection of the shipped artifact, a hands-on run, or the vendor confirms it. Confirmed, the verdict is Decline no matter the total.

## 5. Output format

Produce, in this order:

1. A header naming the tool, its repo URL (or publisher, if closed source), its website, the version observed, the review date, and whether this is a new entry or a re-vet.
2. A scorecard table with columns: criterion | score | evidence. Every evidence cell must contain at least one URL and the concrete fact observed. Name the instrument for rows scored on docs or a test run instead of source, and mark blind Warns **(blind)**.
3. The A–C total (of 24), the full total (of 38), the count of blind Warns in A–C, and the verdict per section 4, noting explicitly whether any gate or hard stop applies and whether a hard stop is confirmed.
4. A 2–3 sentence summary of the standout strengths and weaknesses.
5. If E1 or E2 scored below Pass, the specific edits the entry needs before merge, as replacement text where you can — including a sentence for every D2–D5 gap.
6. **Reviewer notes**, kept separate: the submitter's affiliation, star-history anomalies, patched historical CVEs, and anything else that is not a criterion. These carry no score. Keep them out of anything published — in a public reply they read as a judgement on the author rather than on the tool.

## 6. Record the verdict

Do not save the scorecard as a file in this repo: most of its facts (download counts, "released last week", the total itself) are false within months. A dated snapshot belongs somewhere understood to be a snapshot.

**On an accept**, put it in the squash commit message of the PR that adds the entry, so `git blame` on the entry leads to the evidence. Write it as a snapshot: name the review date and the version observed, keep the non-Pass criteria in full with their evidence, and compress the passes to a single line. Anchor it with the same trailers as client vetting, so both sets stay enumerable with one query (`git log --grep='^Vetted:'`):

```
Vetted: <tool> <a-c>/24 (<n>/38) <verdict> <YYYY-MM-DD>
Gaps: <what could not be measured, and which instrument was blind>
Recheck: <expiry condition, for example the tool reaching 12 months old or its sole maintainer going quiet>
```

This repo squashes with `squash_merge_commit_message = COMMIT_MESSAGES`, so the default body is the contributor's commits concatenated and the scorecard is silently discarded. Override it explicitly:

```
gh pr merge <n> --squash --subject "<subject>" --body-file <scorecard-file>
```

**On a decline**, the PR reply comment is the record. Lead with the criteria the tool can fix by waiting or working — age, adoption, signing — and say what would change the verdict, since a young tool that fails A1 today may pass in six months.

**On a re-vet of a live entry**, the outcome is one of two things, and neither is removal by default:

- **Entry corrections** (E1 or E2 below Pass): propose them as a docs PR, and put the scorecard in that PR's squash commit message with the trailers above.
- **Needs discussion or Decline**: report it to the docs owner with the scorecard. Removing a listed tool is the docs team's decision, and usually starts with asking the vendor about the failing criteria.
