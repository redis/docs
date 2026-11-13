# Redis Insight docs — conventions for AI-assisted editing

These pages document **Redis Insight**, the GUI for working with Redis databases. It ships
as a desktop app and as a Docker image that serves the same UI in a browser. The
documentation is split across two directories by task:

- `content/develop/tools/insight/` — using the app: the feature overview, feature pages,
  the Redis Copilot FAQ, debugging, and release notes.
- `content/operate/redisinsight/` — getting it running: install pages per platform,
  the environment variable reference, and proxy setup.

`content/integrate/redisinsight/_index.md` is a catalog tile that links into both. It
follows the integrations catalog shape, not these conventions.

This file is duplicated in both directories so that either one loads it on its own.
**Keep the two copies identical** — a change to one is a change to both.

Read the repository-root `AGENTS.md` first for style and site mechanics. This file adds
terminology, placement, and disclosure rules for these directories, and wins where the
two conflict.

## Where new content goes

- **A new feature gets a subsection of the overview first.** `develop/tools/insight/_index.md`
  describes each feature in an `###` subsection under `## Overview` or `## Tools`. Most
  features live only there. A feature gets its own page when it needs several `##` task
  sections, as `search-workspace.md` and `rdi-connector.md` do. The subsection then
  keeps a short description and links to the page.
- **A new environment variable is a row in `operate/redisinsight/configuration.md`**,
  not a new page. Put it in the table for its purpose.
- **A new install target is a page under `operate/redisinsight/install/`** plus a
  `tile-card` in `install/_index.md`. That index sets `hideListLinks: true`, so a page
  without a tile is unreachable from it.
- **A release is a new file under `develop/tools/insight/release-notes/`.** The release
  notes index builds its table from the child pages, so no index row is needed.
- **Ordering is by `weight`.** Check the siblings before choosing one. Two develop pages
  already share a weight; leave that alone unless reordering is the task.
- **Do not copy `aliases` from a sibling.** The `/develop/connect/insight/...` and
  `/operate/oss_and_stack/install/install-redis-insight/...` aliases redirect URLs those
  specific pages once had. A new page has no old URL to claim.

## Page types — copy from these

- **Feature page**: copy `develop/tools/insight/search-workspace.md`, not older feature
  pages such as `rdi-connector.md`, which use "click" and screen-position language. It
  opens with what the feature does and how to open it, then a screenshot.
  `## Prerequisites` comes first when the feature needs something the database may lack.
  Then one `##` per task. Columns and
  fields are tables with a bold label column; lists of controls are bullets with a bold
  label, ` &mdash; `, and what it does.
- **Install page**: copy `operate/redisinsight/install/install-on-docker.md`. The AWS page
  is an unheaded numbered list and the desktop page is a table, so neither is a model.
  It has a one-sentence intro naming the platform, `##` sections in install order, the
  command in a fenced block, and the URL to open at the end.

These pages do not end with "Next steps" or "See also" sections. Do not add one.

## Product names

| Use | Not | Note |
| --- | --- | --- |
| Redis Insight | RedisInsight, Redis insight, Insight, RI | Every mention in prose, titles, link text, and alt text. |
| Redis Software | Redis Enterprise | Including "Redis Software for Kubernetes". See the legal-text exception below. |

**The one-word and lowercase forms are identifiers, never prose.** They are correct where
the reader types or follows them: the repository path `redis/RedisInsight`, the Docker
image `redis/redisinsight`, container, service, and volume names in examples, the
`redisinsight` category value, and data directories such as `.redisinsight-app`. The
app's own file names, such as `Redis Insight.app`, are literals too.

**Release notes before v2.48.0 use "RedisInsight" in their titles and prose.** They are
the record of those releases under the name the product had then. Leave them as they
are. Every note from v2.48.0 on uses "Redis Insight".

## The source is public — links to it are expected

The repository-root file says commercial product directories do not link to source.
**That does not apply here, in either directory.** The Redis Insight repository is
public, and the pages link to it on purpose: issue links in release notes, changelog
comparisons, build-from-source instructions, and setup guides kept in the repository.

- New links use `https://github.com/redis/RedisInsight`. Older pages link to
  `github.com/RedisInsight/RedisInsight`, which redirects. Do not rewrite those in
  passing.
- Behavior a user configures or observes is documented in detail: environment
  variables, ports, local data and log locations, the health check endpoint, and the
  API docs endpoint.
- The pages describe the license as SSPL. They never call Redis Insight open source.
  Do not introduce that claim.

## Legal and privacy wording is not prose to edit

Some sentences carry legal or privacy commitments: the `RI_ACCEPT_TERMS_AND_CONDITIONS`
row in `configuration.md`, the license line in `_index.md`, the telemetry statement, and
the Data and Privacy answers in `copilot-faq.md`. Do not reword, shorten, or "fix" them
while editing nearby text.

That includes product names inside them. "Redis Enterprise Software Subscription
Agreement" is the name of an agreement, not a product mention, and stays as written.

## Desktop and Docker differ — say which, where they do

Most behavior is the same in the desktop app and the Docker image, and the pages leave
it unqualified. Where it differs, the pages say so in place, and new content should too:

- **Defaults** in `configuration.md` list both, as `Docker: ... desktop: ...` inside the
  cell. The default port is `5540` for Docker and `5530` for desktop. Examples use `5540`
  because they run the container.
- **Docker-only features** say "Available only for Docker" in the configuration table,
  or "(only for Docker)" in a heading.
- **Paths** for logs and data are listed per platform.

## Feature pages describe the current release

Feature pages describe the app as it ships now, with no "introduced in" or "as of
version" markers. The release notes record when something arrived. `rdi-connector.md`
carries one older "As of version `2.54.0`" line; do not copy that pattern.

## UI labels and screenshots

- **Bold every UI label exactly as it appears on screen**, including case and symbols:
  **+ Create search index**, **>_ CLI**, **STREAM**.
- **Icons are named in words**, as in "the **pencil** icon". These pages do not use
  inline icon images.
- **"Click" and "select" are both in use.** Newer pages use "select". Match the page you
  are editing, and do not convert one to the other in passing.
- **Screenshots live in `/images/ri/`** and are named `ri-<feature>-<subject>.png`, such
  as `ri-search-query-library.png`. Place one directly after the sentence that describes
  that screen, as its own paragraph. Alt text names the screen: "The Search workspace
  welcome screen".

## Release notes

- **One file per release, patches included**, named `v.<major>.<minor>.<patch>.md`:
  `v.3.8.0.md`. Some older files lack the dot after `v`; leave them, since the filename
  is the URL.
- **Frontmatter**, copied from the newest note:

  ```yaml
  Title: Redis Insight v3.8.0, July 2026
  linkTitle: v3.8.0 (July 2026)
  date: 2026-07-20 00:00:00 +0000
  description: Redis Insight v3.8.0
  weight: 1
  ```

  Every current note has `weight: 1`, so **`date` decides the order** in the release
  table. A wrong date puts the note in the wrong place.
- **The heading is the version and month without `v`**: `## 3.8.0 (July 2026)`.
- **The opening sentence names the release type.** A minor release: "This is the
  General Availability (GA) release of Redis Insight 3.8.0, which includes ...". A patch:
  "This is a maintenance release of Redis Insight."
- **Sections**: `### Headlines` (the few changes worth leading with), `### Details`
  (every change, headline items included), and `### Bug fixes`. Leave out an empty one.
  A patch often has only Bug fixes.
- **An item tied to a public issue starts with its link**:
  `[#5835](https://github.com/redis/RedisInsight/issues/5835) Fixed ...`. The number in
  the link text and the URL match.
- **Every note ends with** `**SHA-512 Checksums**` and a `Package | SHA-512` table. A
  minor release puts `**Full Changelog**:` and a compare link between the previous and
  current version just before it; patch notes so far have no changelog link.
- **Checksums are copied from the published release, never computed or edited.** Some
  older notes label SHA-512 values as SHA-256. Those are shipped notes; leave them.
- **Deprecations go in Details** with a bold label, what is going away, and any
  environment variable that restores the old behavior. Follow `v.3.6.0.md`.

## Document current behavior only

Do not foreshadow planned features or roadmap items, even when an issue, a pull request,
or an internal document mentions them. Planned work slips or gets cut, and removing a
promise from a published page is visible to customers.

**Carve-out — deprecation and removal notices are correct and expected.** Telling the
reader what is going away, as `v.3.6.0.md` does for custom tutorials, gives them time to
migrate. Gains are out. Losses are in.

## Flag rather than decide

- **A UI description or screenshot may predate the 3.0 interface.** Version 3.0.0
  replaced the left sidebar with top navigation. Do not rewrite a location or replace a
  screenshot without a confirmed current one.
- **Two pages disagree on a path, port, or default.** Several do today. Say which pages
  conflict rather than picking one.
- **A release note names a setting or label that `configuration.md` or a feature page
  describes differently or not at all.** Name the gap; do not fill it from the note.
- **A sentence would call Redis Insight open source**, or otherwise characterize its
  license beyond what the pages say.
- **A term appears that this file does not cover.**
