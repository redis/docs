# Redis Software for Kubernetes docs — conventions for AI-assisted editing

These pages document the operator-based deployment of Redis Software on Kubernetes and
OpenShift. The self-managed product is documented under `content/operate/rs/` and the
managed service under `content/operate/rc/`; both have their own conventions.

Read the repository-root `AGENTS.md` first for style and site mechanics. This file adds
terminology and disclosure rules for this directory, and wins where the two conflict.

## Product name — a deliberate transition, not an inconsistency to resolve

The current product name is **Redis Software for Kubernetes**. The legacy name is
"Redis Enterprise for Kubernetes".

These pages are mid-rebrand: most current pages still carry the legacy name. **That is
expected.**

- **New and rewritten content uses "Redis Software for Kubernetes".**
- **Do not rename the legacy occurrences.** Rebranding is a deliberate pass across the
  whole section, not something to do while editing a page for another reason.

**This overrides the root file's "match the corpus" rule for this term.** The legacy name
is more common here, so following the majority is wrong. Treat the name as settled and
the pages as lagging.

_This section is transitional. Once the rebrand pass is complete and the legacy name no
longer appears in this directory, delete it and keep only the name itself._

When linking to a page whose `title` still carries the legacy name, use the current
name in your link text — `relref` resolves by path, not by title.

## Identifiers that never change

Custom resource kinds are used exactly as they appear in the API, legacy name and all:

`RedisEnterpriseCluster`, `RedisEnterpriseDatabase`, `RedisEnterpriseUser`,
`RedisEnterpriseACL`, `RedisEnterpriseRole`, `RedisEnterpriseRoleBinding`,
`RedisEnterpriseClusterRole`, `RedisEnterpriseClusterRoleBinding`,
`RedisEnterpriseActiveActiveDatabase`, `RedisEnterpriseRemoteCluster`.

The same holds for abbreviations — **REC**, **REDB**, **REAADB**, **RERC** — and for
field paths such as
`RedisEnterpriseCluster.spec.accessControl.policy.allowREDBRolesPermissions`.

Never "modernize" an identifier to match the product name. The API is the API.

## Say "databases", not "BDB"

Do not write "BDB" or "BDBs" in prose. Write "databases", or "databases created
directly through the REST API" where that distinction matters.

- **REDB** is fine — it is the custom resource name.
- A literal `bdb` in an API path, request body, or placeholder such as `<BDB UID>`
  stays as-is. It is what the reader types.

## Roles

Use the readable form in prose — "cluster admin" is the established usage — and the
role ID only where the reader types it, or once in parentheses on first mention.

Role names as *defined* appear in title case in reference tables and examples ("Cluster
Member", "DB Viewer"). Match the surrounding page: title case where a specific named
role is being identified, lowercase prose where you are describing who does something.

## Container image paths differ by registry

Release notes and deployment pages reference images from two registries that name the
same components differently. Match the path style to the registry being documented.

| Component | Red Hat Connect | Docker Hub |
| --- | --- | --- |
| Redis Software node | `redis-enterprise` | `redis` |
| Operator | `redis-enterprise-operator` | `operator` |
| Services Rigger | `services-manager` | `k8s-controller` |
| Call-home client | `call-home-client` | `re-call-home-client` |

Getting this wrong produces a path that looks plausible and does not resolve. Check the
registry before writing or editing an image reference.

## Release codenames are internal

Operator releases carry internal codenames. **None of them appear anywhere in published
content, and none should.** Refer to releases by version number.

## Versioned content

Version-specific pages live in sibling folders such as `7.22/`, `7.8.6/`, and `8.0/`.
The unversioned root is the current content.

Default every edit to the current content. When updating shared behavior, check whether
the change applies across versions or only to the current one, and never propagate a
current-version change backward into a snapshot.

## Document current behavior only

Do not foreshadow planned support, future feature expansions, or roadmap items — even
when a specification, an internal document, or a subject-matter expert mentions them.
Planned work slips, changes shape, or gets cut, and removing a promise from a published
page is visible to customers.

- Wrong: "Support for multi-namespace deployments is planned for a future release."
- Wrong: "This limitation is expected to be lifted in a later operator version."
- Right: state the current limitation flatly, with no forecast — for example, "custom
  resources of this kind are reconciled only in the operator namespace."

**Carve-out — deprecation and removal notices are correct and expected.** The rule bans
promising something the reader will *gain*, not telling them what is going away.
Customers need lead time to migrate or upgrade, and a warning is sometimes published
ahead of the deprecation itself to give them that time.

- Right: "Support for this platform will be removed in a future release."
- Right: "This field is deprecated and will be removed in a future release. Use
  `<replacement>` instead."

The test: does the sentence tell the reader they will gain something, or lose something?
Gains are out. Losses are in.

## Do not publish ahead of customer availability

Content describing a feature does not go live until customers can use it. The gate is
availability to customers — not that the code merged, and not that the field exists in
an internal build. A feature that is cut or deferred takes its documentation with it:
remove the content rather than softening it into a promise.

Drafting ahead is normal. Draft, verify, open the pull request, and hold it.

## The operator source is private

The operator source repository is not public, so a file path or repository URL is a dead
end for every reader of these pages. Where a statement was only defensible because it
cited code, it either stands on its own as documented behavior or it comes out.

"Check the controller for the valid values", in any phrasing, means the page has a real
gap. Flag it rather than shipping it.

Do not document internal implementation detail — reconcile-loop internals, internal
service names, or controller-private fields — beyond what a user sets in a custom
resource or observes in its status.

Published pages carry no audit trail. Strip verification notes, "verified against"
lines, source lists, and freshness dates.

## Flag rather than decide

- A custom resource field, default, or image tag cannot be confirmed. Operator fields
  and defaults shift between releases; never infer one.
- Internal material contradicts a published page. The internal version does not
  automatically win — it may describe unreleased behavior or a different operator
  version than the page documents.
- A version or release boundary is unclear. These pages describe shipped behavior.
- A term appears that this file does not cover.
