# Redis Radar docs — conventions for AI-assisted editing

These pages document Redis Radar, the fleet control plane that inventories Redis
deployments and presents them in one place. They serve **two deployment modes** — Radar
installed on your own infrastructure, and Radar hosted by Redis on Redis Cloud. Redis
Cloud has its own section under `content/operate/rc/` with its own conventions.

Read the repository-root `AGENTS.md` first for style and site mechanics. This file adds
terminology, mode, and disclosure rules for this directory, and wins where the two
conflict.

## Qualify a statement by deployment mode only where it actually differs

Most of what these pages say is true of both modes and is written that way — how
credentials are stored, how often collection runs, what the views show. Leave those
unqualified; adding "on a self-managed install" to a sentence that applies to everyone
makes a hosted reader think it excludes them.

**Where the modes genuinely diverge, the pages qualify inline**, and new content should
match that pattern rather than inventing a structure for it:

- **Installation.** `install.md` is self-managed. Hosted Radar has no install — the reader
  signs in — so the Cloud page carries that path and `install.md` links to it. Do not add
  hosted setup steps to `install.md`.
- **Custody of the credential encryption key.** On a self-managed install the reader
  supplies the key and has to back it up. That obligation is theirs alone, so it is stated
  as self-managed.
- **How connector credentials are entered**, for providers where the procedure differs.
  Follow the existing sentence shape: *"On a self-managed install, Radar authenticates
  with…"*

⚠️ **Do not mistake source type for deployment mode.** `connect.md` splits into
`## Self-managed connections` and `## Cloud connections`, and those headings describe
**what you are connecting** — self-managed sources such as Redis Software and Redis Open
Source, versus cloud sources such as Redis Cloud, ElastiCache, and Memorystore. They do
**not** describe which Radar you are running. Both headings apply to both modes, and a
mode-specific detail inside either one is qualified in the sentence, not by the heading.

Release notes are the one place the split is structural: versioned notes cover
self-managed, and hosted changes go in the Cloud changelog.


## Product names

| Use | Not | Note |
| --- | --- | --- |
| Redis Radar | Radar (alone) | First mention on a page, and in `title` and `description`. |
| Radar | Redis Radar | Every later mention on that page. |
| Redis Software | Redis Enterprise | Every mention, including with a version: Redis Software 7.4. |

**"Multi Cluster Manager" and "MCM" are not product names.** They are the project's
origin, they appear in no published page, and they do not belong in prose. This says
nothing about the lowercase `mcm` service and path identifiers, which are literal strings
a reader types — the root file's rule on literals covers those.

## ElastiCache and Memorystore appear on Databases, never Clusters

Amazon ElastiCache and Google Memorystore resources surface on the **Databases** view.
They have no Clusters view and no cluster-level pages. A procedure that routes a reader
to Clusters for either provider sends them somewhere the resource does not appear.

## Release notes

- **Versions are calendar-based**, not semantic: `2026.9.5`. Do not infer ordering,
  compatibility, or significance from the numbers the way you would from semver.
- **Filenames use dashes, titles and link titles use dots** — `2026-9-5.md` holding
  `title: Redis Radar release notes 2026.9.5` and `linkTitle: 2026.9.5`.
- **Self-managed notes carry the `self-managed` tag.** Keep it; it is what separates them
  from hosted content.
- **Hosted changes go in the Cloud changelog, one section per release, headed by its
  version** — `## 2026.10.1`. Hosted Radar rolls out automatically, so the heading
  identifies the release rather than a build to download. Do not fold a hosted change
  into a versioned self-managed note.
- **A release pull request updates the files for each mode the release changes.** Put the
  newest release first in each.
  - **Self-managed**: a new versioned note, named for the version, and a row in the
    release table in `release-notes/_index.md` with the support track and a one-line
    summary. Copy the note's frontmatter from the previous note and set `weight` one
    lower than that note's, so the newest release sorts first.
  - **Hosted**: a section in the Cloud changelog. Anything that affects hosted Radar goes
    there, including changes and known limitations that also apply to self-managed,
    which go in the versioned note too.
- **A release that changes something a published page describes**, such as a setting, a
  UI label, or an install step, needs that page updated too. Either update it in a
  docs pull request, or note the change in the release ticket for docs to pick up. File
  a DOC ticket instead when it's more than a small edit, such as a new step, section, or
  procedure.
- **Each versioned note opens with a summary and its support track.**
- **Sections go in this order**, and any section that would be empty is left out:
  `## Enhancements`, `## Resolved issues`, `## Breaking changes`, `## Downloads`,
  `## Known limitations`. Every versioned note has Downloads.
  - **Enhancements**: new features, plus performance, maintenance, and documentation
    changes.
  - **Resolved issues**: bug fixes.
  - **Breaking changes**: anything the reader has to change before upgrading, such as
    configuration the chart no longer accepts, and what to change it to. An enhancement
    or fix that causes one links here.
  - **Known limitations**: what the reader can't do in this release and how to work
    around it. State the constraint and the remedy, not the internal cause. End each
    limitation with its RED ticket in an HTML comment, such as `<!--RED-12345-->`, so
    it can be tracked.
- **Downloads opens with the supported platform**, then has one `###` section per
  artifact, each a list of bold-labeled values: `### Helm chart` (chart name, version,
  and repository), `### Container images` (one bullet per image), and `### RPM` and
  `### Agent` (package name and a Download Center link). Take the chart version and
  image tags from the published chart and the package names from the Download Center,
  not from the repository. Add or remove an image when the chart's image list changes.
- **A Cloud changelog section opens with a one-sentence summary**, then lists the
  changes as bullets. Group them under `###` headings only when the list is long
  enough to need it, and name the groups after the versioned note's sections:
  `### Enhancements`, `### Resolved issues`, `### Breaking changes`, and
  `### Known limitations`. It has no Downloads and no support track.
- **Leave out changes a reader can't see or act on**, such as release tooling, CI, test
  infrastructure, and Radar's internal tracing and metrics.
- **Each item is one change**, opening with a bold label ending in a period: a short
  phrase naming the feature or the symptom, not the ticket title. Split unrelated
  changes into separate items, even when they share a ticket.
- **Say what the reader can now do or see.** Name the exact setting, its default, and
  the product versions it applies to. Quantify rather than qualify: "retries once", not
  "a bounded retry".
- **Describe a fix by what the reader saw**, in their terms, not by its internal cause:
  "Certificates that expire within 24 hours now show as **Expiring** instead of
  **Valid**."
- **Bold UI names exactly as they appear on screen**, including paths such as
  **Settings > Agents**.

## Document current behavior only

Do not foreshadow planned support, future feature expansions, or roadmap items — even
when a specification, an internal document, or a subject-matter expert mentions them.
Planned work slips, changes shape, or gets cut, and removing a promise from a published
page is visible to customers.

- Wrong: "Entitlement management is planned for a future release."
- Wrong: "Bulk license renewal is expected in a later version."
- Right: state what the reader can do today, with no forecast.

**Carve-out — deprecation and removal notices are correct and expected.** The rule bans
promising something the reader will *gain*, not telling them what is going away.
Customers need lead time to migrate, and a warning is sometimes published ahead of the
removal itself to give them that time.

The test: does the sentence tell the reader they will gain something, or lose something?
Gains are out. Losses are in.

## Do not publish ahead of customer availability

Content describing a feature does not go live until customers can use it. The gate is
availability to customers — not that the code merged, and not that a flag exists in a
build. A feature that is cut or deferred takes its documentation with it: remove the
content rather than softening it into a promise.

A capability that ships disabled is a special case, not an exception: document it only if
a reader can turn it on, and say that they have to.

Drafting ahead is normal. Draft, verify, open the pull request, and hold it.

## The Radar source is private

The Radar source repository is not public, so a file path or repository URL is a dead end
for every reader of these pages. Where a statement was only defensible because it cited
code, it either stands on its own as documented behavior or it comes out.

"Check the source for the valid values", in any phrasing, means the page has a real gap.
Flag it rather than shipping it.

Do not document internal implementation detail — internal service behavior, queue names,
or database schema — beyond what a reader configures or observes. A service name or path
the reader types is not implementation detail: it is the interface.

Published pages carry no audit trail. Strip verification notes, "verified against" lines,
source lists, and freshness dates.

## Flag rather than decide

- **A default, flag, or chart value cannot be confirmed.** Radar releases on a calendar
  cadence and its packaging is rebuilt at release time, so a value in a development copy
  is not evidence about what shipped. Never infer one.
- **A statement's mode is unclear.** If you cannot tell whether a behavior is
  self-managed, hosted, or both, say so — do not pick the one that makes the sentence
  simpler.
- **Internal material contradicts a published page.** The internal version does not
  automatically win; it may describe unreleased behavior or the other deployment mode.
- **A term appears that this file does not cover.**
