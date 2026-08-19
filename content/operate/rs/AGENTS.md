# Redis Software docs — conventions for AI-assisted editing

These pages document **Redis Software** — the self-managed product installed on VMs,
bare metal, or containers. The Kubernetes operator is documented under
`content/operate/kubernetes/` and the managed service under `content/operate/rc/`;
both have their own conventions.

Read the repository-root `AGENTS.md` first for style and site mechanics. This file
adds terminology and disclosure rules for this directory, and wins where the two
conflict.

## Product names

| Use | Not | Note |
| --- | --- | --- |
| Redis Software | Redis Enterprise Software, Redis Enterprise | Current name. Use it in all current prose. |
| Redis Software | RS | `RS` is internal shorthand and the URL slug (`/operate/rs/`). Never use it in customer-facing prose. |

**Versioned folders predate the rebrand.** Pages under `7.4/`, `7.8/`, and `7.22/`
still say "Redis Enterprise Software" and "Redis Enterprise". Leave that wording
alone. Renaming is a deliberate repo-wide pass, not something to do while editing a
page for another reason.

When linking to a page whose `title` still carries the old name, use the current name
in your link text — `relref` resolves by path, not by title.

## Active-Active databases

Active-Active databases were formerly called CRDBs, and both forms are correct in
different places. This is the most commonly mis-corrected convention in this
directory, so check which surface you are editing.

- **Prose** — "Active-Active database". Where a gloss helps, write "(formerly known as
  CRDB)". CRDB is a former name, not a current synonym.
- **REST API reference titles** — **keep CRDB.** The API surface is named `crdb`, and
  the object pages are titled "CRDB object", "CRDB database config object", and so on.
  Retitling one makes it the outlier among its siblings.
- **Code, identifiers, endpoints** — always literal: `crdb-cli`, `/crdbs`, JSON field
  names.

**Never write bare "Active-Active" with no noun.** Qualify it with whichever is
accurate:

- The whole replicated object is the **Active-Active database**.
- Per-cluster settings are configured **per participating cluster** — for example the
  REST `instances[].cluster.certificate_auth` field, or `crdb-cli --instance`. Write
  "each participating cluster in the Active-Active database", not "each Active-Active
  instance".

## Roles

Use the readable form in prose — "cluster admin" is the established usage — and the
role ID only where the reader types it, or once in parentheses on first mention.

Role names as *defined* appear in title case in the reference tables ("Cluster Member",
"Cluster Viewer", "DB Member", "DB Viewer"). Match the surrounding page: title case
where a specific named role is being identified, lowercase prose where you are
describing who does something.

## Versioned content

The unversioned root of this directory (`clusters/`, `databases/`, `references/`) is
the current content. `7.4/`, `7.8/`, and `7.22/` are frozen snapshots carrying a
`bannerText` that names the version.

Default every edit to the current content. Touch a snapshot only when the change is
specific to that version, and never propagate a current-version change backward into
one.

## Generated pages — do not hand-edit

The Cluster REST API reference under `references/rest-api/api-reference/` is generated
from an engineering-owned OpenAPI specification. Edits to those pages are overwritten
on the next regeneration.

If something there is wrong — a missing property description, an inconsistency between
request and response fields, an outdated product name — report it so it can be fixed in
the specification. Do not patch the generated output.

## Release notes

Release notes live under `release-notes/`, grouped by minor line (`rs-8-0-releases/`,
`rs-7-22-releases/`).

- Build numbers are `<version>-<build>`, for example `8.0.20-19`.
- Titles read `Redis Software release notes 8.0.20-19 (May 2026)`.
- Frontmatter includes `compatibleOSSVersion` and a `weight`.
- Structure: **Highlights**, then **New in this release** (New features, then
  Enhancements), then resolved issues, then known limitations. Follow the most recent
  notes in the newest release folder; older notes predate the current template.
- A new release also updates `references/supported-platforms.md` and
  `references/upgrade-paths.md`.

## Document current behavior only

Do not foreshadow planned support, future feature expansions, or roadmap items — even
when a specification, an internal document, or a subject-matter expert mentions them.
Planned work slips, changes shape, or gets cut, and removing a promise from a published
page is visible to customers.

- Wrong: "Support for this is planned for a future release."
- Wrong: "This limitation is expected to be lifted in 8.4."
- Right: state the current limitation flatly, with no forecast.

**Carve-out — deprecation and removal notices are correct and expected.** The rule bans
promising something the reader will *gain*, not telling them what is going away.
Customers need lead time to migrate or upgrade, and a warning is sometimes published
ahead of the deprecation itself to give them that time. These pages carry many such
notices deliberately.

- Right: "Support for TLS 1.1 and earlier will be removed in a future release."
- Right: "This endpoint is deprecated as of Redis Software version 7.2.4 and will be
  removed in a future release. Use `<replacement>` instead."

The test: does the sentence tell the reader they will gain something, or lose
something? Gains are out. Losses are in.

## Do not publish ahead of customer availability

Content describing a feature does not go live until customers can use it. The gate is
availability to customers — not that the code merged, and not that it exists in an
internal build. A feature that is cut or deferred takes its documentation with it:
remove the content rather than softening it into a promise.

Drafting ahead is normal. Draft, verify, open the pull request, and hold it.

## The product source is private

The Redis Software source repository is not public, so a file path or repository URL is
a dead end for every reader of these pages. Where a statement was only defensible
because it cited code, it either stands on its own as documented behavior or it comes
out.

"Check the implementation for the valid values", in any phrasing, means the page has a
real gap. Flag it rather than shipping it.

Do not document internal implementation detail — process names, internal service names,
on-disk layouts, or internal field encodings — beyond what a customer configures or
observes.

Published pages carry no audit trail. Strip verification notes, "verified against"
lines, source lists, and freshness dates.

## Flag rather than decide

- Internal material contradicts a published page. The internal version does not
  automatically win — it may describe unreleased behavior, an internal rename, or a
  different version than the page documents.
- A version or release boundary is unclear. These pages describe shipped behavior.
- A term appears that this file does not cover.
