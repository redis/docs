# Redis Cloud docs — conventions for AI-assisted editing

These pages document **Redis Cloud**, the managed service, and the Redis Cloud console
that runs it. The self-managed product is documented under `content/operate/rs/`, the
Kubernetes operator under `content/operate/kubernetes/`, Redis Radar under
`content/operate/radar/`, and the Redis Iris services under `content/operate/iris/`.
Each has its own conventions.

Read the repository-root `AGENTS.md` first for style and site mechanics. This file adds
terminology, structure, and disclosure rules for this directory, and wins where the two
conflict.

## Product and plan names

| Use | Not | Note |
| --- | --- | --- |
| Redis Cloud | RC, Redis Enterprise Cloud | `rc` is the URL slug and category, never prose. |
| Redis Cloud console | Redis Cloud Console, admin console | "admin console" is correct for a third-party identity provider's console. |
| Redis Cloud Essentials, Essentials | Fixed | Pages use both forms freely, with no first-mention rule. |
| Redis Cloud Pro, Pro | Flexible | "Annual" is a current Pro billing term, not a legacy name. |
| Redis Flex, Flex | Redis on Flash | See the Auto Tiering note. |
| Redis Cloud Bring your own Cloud (BYOC) | | Match the BYOC index page title. |
| Google Cloud | GCP, Google Cloud Platform | `gcp` stays where it is literal: shortcode arguments, anchors, paths. |

**Older changelogs keep the names of their time.** The 2023 and 2024 entries say "Fixed"
and "Flexible"; leave them. Image filenames ending in `-flexible` are paths, not prose.

**Flex and Auto Tiering are not cleanly separated.** The Flex create page offers tiered
RAM and Flash on Essentials and Pro. "Auto Tiering" survives as a console label in
settings tables, and one page still presents it as a separate Pro option. Use "Flex" in
new prose, keep "Auto Tiering" where it is a console label, and flag contradictions.

Plan limits, prices, and feature tables change. Link to
[Subscription plans](/content/operate/rc/subscriptions/_index.md) or the Essentials plan
details page instead of restating them.

## There is no Redis Cloud version

Redis Cloud is continuously updated. There are no versioned folders, and "as of Redis
Cloud 7.x" is wrong; the RS and Kubernetes snapshot rules do not apply. "Redis version"
means the **database** version a reader selects, such as Redis 8.6. Earlier docs live in
an external archive linked from `cloud-archive.md`.

## Active-Active is organized by region

An Active-Active database's copies are **instances** deployed to **regions**, defined by
an **Active-Active subscription**. Readers set local throughput "for each instance" or
"for each region". **Do not carry over the Redis Software rule** that replaces "instance"
with "participating cluster": Cloud readers never see clusters. "CRDB" does not belong in
Cloud prose; API schema names such as `CrdbRegionSpec` are literals.

## Two separate role systems

- **Account roles** govern the Redis Cloud console: Owner, Billing Admin, Manager,
  Member, Viewer, and Logs Viewer, defined in
  `security/access-control/access-management.md`. Prose capitalizes them as names:
  "Billing Admins can add payment methods." The RS lowercase "cluster admin" rule does
  not apply.
- **Data access roles** govern what a database user can do, through role-based access
  control (RBAC) and ACL rules, under `security/access-control/data-access-control/`.

Never describe one system in the other's terms.

## Say which plans a feature applies to

- **Availability note after the intro**: "VPC peering is available only with Redis Cloud
  Pro. It is not supported for Redis Cloud Essentials."
- **Different steps per plan go in tabs on one page**, `tab1="Essentials"` then
  `tab2="Pro"`. Copy the `multitabs` block from `databases/delete-database.md`.
- **Whole-page preview** uses `bannerText`, currently "<Feature> is currently in public
  preview. Features and behavior are subject to change." A beta section marks its heading
  `(Beta)`. The banner or marker comes out at general availability.
- **Request-gated features** say how to request them:
  `[contact support](https://redis.io/support/)` or `[contact sales](https://redis.io/meeting/)`.
  `support.redislabs.com` links are for specific knowledge base articles.

## Procedure conventions

- **Every step is numbered `1.`**; Markdown renumbers them. The exception is a list that
  continues after a step embed, which numbers explicitly: `create-essentials-database.md`
  resumes at `3.` after the shared first-steps embed.
- **Navigation starts from the console menu**: "Select **Databases** from the
  [Redis Cloud console](https://cloud.redis.io/) menu and then select your database."
- **Console actions use "select"**, not "click". Third-party steps, such as AWS or an
  identity provider, sometimes say "click"; leave those.
- **UI paths** appear as `**Connectivity > PrivateLink**` and as
  `**More actions** > **Delete database**`. Match the page you are editing.
- **Closing sections** are `## More info` or `## Next steps`. `## Continue learning with
  Redis University` renders only if `static/resources/redisuniversity.yaml` has an entry
  for the page. Do not copy it onto a new page.
- **Identity provider guides** carry a `bannerText` telling the reader to check the
  provider's docs. Keep it.

## Where new content goes

The landing page `_index.md` maps the sections. Extend an existing page before adding
one; plan variants go in tabs, not separate pages.

- **Sidebar order is `weight`.** Weights are spaced and ties exist; pick a number between
  the neighbors.
- **Most section indexes set `hideListLinks: true`** and carry a hand-written list, such
  as `databases/_index.md`. Add the new page where it fits. Not every child is listed, and
  that is not a gap to fill while doing other work.
- **Bridge pages point elsewhere.** `context-engine/` points to `content/operate/iris/` and
  `radar.md` to `content/operate/radar/`; that content goes in those directories, under
  their conventions. `rdi/` documents Cloud's Data Integration flow and links to
  `content/integrate/redis-data-integration/` for RDI concepts.
- **Keep explicit heading IDs.** Some `{#id}` values preserve an older anchor that other
  pages still link to. Change the heading text, never the ID.

## Frontmatter and images

- Most pages use `Title` (capital T); use it on new pages. `linktitle`, `linkTitle`, and
  `LinkTitle` all appear; match the sibling you copy from.
- `categories` is `docs`, `operate`, `rc`, with `alwaysopen: false`.
- Some pages carry `weight: $weight`, an unresolved placeholder. Do not copy it.
- Under `subscriptions/bring-your-own-cloud/`, `bannerChildren: true` shows the index
  banner on every child page.
- Screenshots are PNG files in `static/images/rc/`, named for the UI area or element:
  `button-`, `icon-`, `database-`, `subscription-`. Button images take a pixel width;
  full screenshots take a percentage width.

## Generated and shared content — do not hand-edit

- **`api/api-reference/openapi.json`** is overwritten daily from the live Redis Cloud API
  by the `rc_api_sync` workflow, and `api/api-reference.md` only renders it. Report a wrong
  description so the API specification can be fixed.
- **`data/rc_supported_regions.json`** feeds the `rc-supported-regions` shortcode on
  `supported-regions.md`. A weekly sync adds regions and sets their `pro` and `essentials`
  flags. Only `location` and `area` are hand-maintained; a new region arrives with both
  set to `UNKNOWN`. Link to `supported-regions.md` instead of listing regions elsewhere.
- **BYOC IAM policies** are pulled in with `external-json`. Do not paste the JSON inline.
- **`content/embeds/rc-*.md`** are shared across Cloud pages. `rc-rs-*.md` embeds also
  render on Redis Software pages, including RS version snapshots, so their wording must
  hold for both products. Edit the embed, not a copy of its text.

## Changelog and Redis version release notes

- **Monthly changelogs** are `changelog/<month>-<year>.md`. Copy the newest month's
  frontmatter and set `weight` lower than its value. The index table reads `highlights`
  and lists only pages tagged `changelog`, so both are required.
- **Sections**, each optional: `## New features`, `## Enhancements`, `## Deprecations`,
  `## Security fixes`. Features and enhancements are `###` items with a short paragraph
  linking to the doc page. Deprecations and security fixes are bullet lists.
- Past years sit in `2023/` and `2024/`; later months are at the root. Do not move files.
- **Redis version release notes** are `changelog/version-release-notes/<major>-<minor>.md`,
  titled "Redis 8.6 release notes and breaking changes". The index table shows each
  `description`, so copy that sentence's shape exactly.
- **Hosted Radar's per-release changes go in `content/operate/radar/release-notes/cloud-changelog.md`**,
  which the Radar conventions call "the Cloud changelog". This directory's changelog
  announces Cloud-level milestones, such as Radar becoming available.

## Document current behavior only

Do not foreshadow planned support or roadmap items, even when an internal document or a
subject-matter expert mentions them. A few published pages still say "coming soon"; do
not copy that, and flag rather than strip it while doing other work. **Deprecation and
removal notices are the carve-out.** Gains are out. Losses are in.

## Do not publish ahead of customer availability

Content goes live when customers can use the feature, not when the code merges. Cloud
features often roll out gradually or reach the API before the console, so say exactly
where a feature is available: "These regions are not available in the Redis Cloud
console." A capability behind a beta flag is documented only with how to turn it on.

## The service source is private

Never link to Redis Cloud service code or say "see the implementation". Public
repositories are fine: Redis Open Source, the Terraform provider, `redisctl`, and the RDI
Cloud automation scripts.

Do not document the infrastructure under the service: cluster internals, nodes, or Redis
Software tools such as `rladmin` and `crdb-cli`, which Cloud readers cannot use. Linking
to an RS page for a shared concept is established; an RS procedure does not apply. Names
a reader creates in their own cloud account, such as BYOC IAM role names, stay literal.

Published pages carry no audit trail. Strip verification notes and source lists.

## Flag rather than decide

- **Plan applicability is unclear.** Never infer whether a feature covers Essentials, Pro,
  Flex, or BYOC.
- **A limit, quota, price, or region list would have to be restated.** Link instead.
- **Pages disagree on a name**, such as Flex and Auto Tiering, or the Owner role, which some
  pages call "Account Owner" or "Account Admin".
- **Internal material contradicts a published page.** It may describe unreleased behavior.
- **A term appears that this file does not cover.**
