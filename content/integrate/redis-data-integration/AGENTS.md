# Redis Data Integration docs — conventions for AI-assisted editing

These pages document Redis Data Integration (RDI) installed on the reader's own
infrastructure: VMs or Kubernetes. RDI as a managed service is documented under
`content/operate/rc/rdi/` with Redis Cloud's conventions, and the Redis Software
cluster that hosts the RDI database is documented under `content/operate/rs/`.
`content/integrate/write-behind/` is a separate, unlisted product and is out of scope.

Read the repository-root `AGENTS.md` first for style and site mechanics. This file adds
terminology, structure, and disclosure rules for this directory, and wins where the two
conflict.

## Names and terms

| Use | Not | Note |
| --- | --- | --- |
| classic processor, Flink processor | Classic processor, Flink Processor | Lowercase "classic" mid-sentence. "Stream processor" names the component, and these are its two implementations. One section of `pipeline-config.md` capitalizes "Classic". |
| RDI database | staging database | Where RDI keeps its state, distinct from the source and target databases. `faq.md` still says "staging database". |
| Debezium collector, Flink collector | — | Which collector a source uses depends on its type. See `data-pipelines/pipeline-config.md`. |
| RDI operator | — | RDI ships its own operator and Helm chart. Kubernetes terms from `content/operate/kubernetes/` (REC, REDB) do not apply here. |
| rejected records | — | The Redis Cloud UI term for what these pages call the dead-letter queue (DLQ). Use it when you describe that UI. |

**"Redis Enterprise" stays where it is.** These pages call the self-managed product
hosting the RDI database "Redis Enterprise" and never "Redis Software". Do not rename it
while editing a page for another reason. That rename is a deliberate pass across the
section.

## Installation types

The pages name three installation types, in this order: **VM**, **Kubernetes**, and
**Redis Cloud**. A statement true of all three stays unqualified. Where one type
differs, qualify it inline, as in "available only on VM installations". The install and
upgrade pages split by type under their own headings.

The two newest pages for hosted source databases, `gcp-cloud-sql-mysql.md` and
`supabase.md`, open with a note. It says the page describes a self-managed RDI
deployment, gives the versions the setup was validated with, and links to the Redis
Cloud equivalent. Copy that note for a new page of that kind. Older hosted-source pages,
such as `neon.md` and the AWS pages, predate it.

## Version references

- Write versions as `RDI 2.0.0`: three parts, no `v`. A few pages still write
  `RDI v2.0.0`. Leave them unless the page is your task.
- `{{< rdi-version >}}` always renders `rdi_current_version` from `config.toml`, which
  is the newest release, on every page that uses it, snapshots included. Use it only in
  the current content, for "the latest version" and download commands. Never use it for
  a version-specific statement.

## Prepare-a-source-database pages — copy the newest shape

Copy `data-pipelines/prepare-dbs/gcp-cloud-sql-mysql.md`. It opens with an intro, then says
how this source differs from the generic one, then gives a `checklist` fence linking each
step. The steps are numbered H2s (`## 1. Enable binary logging`), and the last is
`## N. Configure RDI`, with `redis-di set-secret` and a `config.yaml` `sources` snippet.

Older prepare-dbs pages, such as `postgresql.md`, use topic headings instead. Leave them.

## Where new content goes

- **A new source database** gets a page under `data-pipelines/prepare-dbs/` and a row in
  `content/embeds/rdi-supported-source-versions.md`. That embed is the canonical list of
  supported sources and versions, so never restate the list on another page.
- **A new transformation example** goes under `data-pipelines/transform-examples/`.
- **A new transformation block or CLI command** belongs to the generated reference. See
  "Generated pages — do not hand-edit."
- **Content specific to the managed service** goes under `content/operate/rc/rdi/`.
  Link to it from here rather than repeat it.
- Section `_index.md` pages carry real content. They end with a lead-in sentence, such
  as "See the other pages in this section", and the site lists the children
  automatically. Do not add a hand-written list of child pages.

## Frontmatter families

Every page uses `Title` with a capital T. Beyond that, match one of three shapes:

- **Guide pages**: `categories` `[docs, integrate, rs, rdi]`, `group: di`,
  `type: integration`, and a `summary`, either the shared boilerplate or page-specific.
- **CLI command pages**: `categories: ["redis-di"]`, with no `group` or `type`.
- **Release notes**: `categories` `[docs, operate, rs]` and `toc: 'true'`.

A source or feature in preview carries a `bannerText` that names the preview, as on
`prepare-dbs/snowflake.md`.

## Shortcodes and shared content

- Admonitions use GitHub alert syntax: `> [!NOTE]` and `> [!WARNING]`. These pages do not
  use the `note` or `warning` shortcodes.
- `{{< multitabs >}}` holds the variants of one step, such as Aurora and RDS on
  `aws-aur-mysql.md`, or RAC and single-instance on `oracle.md`.
- **Embeds are shared.** Several `content/embeds/rdi-*.md` files are also embedded by
  Redis Cloud pages under `content/operate/rc/rdi/`, by the `1.19.1/` snapshot, or by
  both. Before you
  edit one, search for every `embed-md` that uses it. A change made for the current
  release also changes the frozen snapshot.

## Generated pages — do not hand-edit

Release automation regenerates part of `reference/` from the private RDI source:

- `reference/cli/`, except `previous-cli-comparison.md`
- `reference/config-yaml-reference.md`
- the block pages under `reference/data-transformation/`
- `reference/jmespath-custom-functions.md`
- `reference/api-reference/openapi.json`

The pages carry no marker. Commits titled like `Update autogenerated docs for RDI <version>`
in a file's `git log` confirm it, but a file the automation has not changed yet has none,
so treat everything in these locations as generated. A change made only here does not
survive regeneration unless the same change reaches the source. If one of these pages
is wrong, report the fix it needs rather than patching the output.

`reference/api-reference.md` renders `openapi.json`, so its Markdown body never
displays.

## Versioned content

The unversioned root is the current release. `1.19.1/` is a frozen snapshot whose
`_index.md` carries `bannerText` and `bannerChildren: true`.

- Default every edit to the current content. Never propagate a current change backward
  into a snapshot.
- Links inside a snapshot include its version segment, as in
  `/content/integrate/redis-data-integration/1.19.1/...`. Keep them that way.
- Snapshot pages carry no `aliases:`. An alias in a snapshot redirects a legacy URL to
  the frozen copy instead of the live page.
- Release notes are not copied into snapshots. They exist only under `release-notes/`.

## Release notes

- Files are named `rdi-<major>-<minor>-<patch>.md`, such as `rdi-2-0-0.md`.
- `Title: Redis Data Integration release notes 2.0.0 (September 2026)` and
  `linkTitle: 2.0.0 (September 2026)`. Set `weight` one lower than the previous note's.
- `description` fills the "Major changes" column of the index table.
- The body opens with `## What's New in <version>`, followed by H3 groups such as
  `### Breaking Changes`, `### New Features`, `### Improvements`, `### Bug Fixes`, and
  `### Security`. **These headings are title case across every recent note.** Match the
  newest note rather than applying the root file's sentence-case rule. The set and order
  of groups vary, so do not reorder an existing note.
- Each item is `- **Label**: Sentence.`, with the colon outside the bold.
- A release also bumps `rdi_current_version` in `config.toml`.

## Document current behavior only

Do not foreshadow planned support, new source databases, or roadmap items, even when a
specification, an internal page, or a subject-matter expert mentions them. Planned work
slips, changes shape, or gets cut, and removing a promise from a published page is
visible to customers.

- Wrong: "Support for more source databases is planned for a future release."
- Right: state what RDI supports today, with no forecast.

**Carve-out: deprecation and removal notices are correct and expected.** Customers need
lead time to migrate, as with the API v1 deprecation in `reference/api-migration.md`.
The test: does the sentence tell the reader they will gain something, or lose something?
Gains are out. Losses are in.

## Do not publish ahead of customer availability

Content describing a feature does not go live until customers can use it. The gate is
availability to customers, not a merged change or an internal build. A feature that is
cut or deferred takes its documentation with it.

Availability differs by installation type. A source or feature in a self-managed release
is not necessarily available in Redis Cloud, so never infer Cloud support from a
self-managed release note.

Drafting ahead is normal. Draft, verify, open the pull request, and hold it.

## The RDI source is private, but its observable surface is not

The RDI source repository is not public, so never link to it or cite a path inside it.
"Check the source for the valid values", in any phrasing, means the page has a gap. Flag
it.

**Do not carry over the Redis Software rule against internal names.** RDI runs on the
reader's infrastructure, so these pages deliberately document what the reader sees and
operates: pod and service names, Helm values, Prometheus metric names, streams in the RDI
database, and Debezium properties. The pages also link to public upstream source, such
as Debezium's, where it explains behavior. That is in bounds. RDI's own code is not.

Published pages carry no audit trail. Strip verification notes and source lists. A
prepare-dbs note saying which versions a setup was validated with is reader-facing, so
it stays.

## Flag rather than decide

- **A value on a generated page looks wrong.** The fix belongs in the source.
- **A setting, default, or flag cannot be confirmed for the release a page documents.**
- **It is unclear whether a statement applies to the classic processor, the Flink
  processor, or both.** Do not pick the one that makes the sentence simpler.
- **It is unclear whether a statement applies to self-managed RDI, Redis Cloud, or both.**
- **Internal material contradicts a published page.** The internal version may describe
  unreleased behavior.
- **A term appears that this file does not cover.**
