# RDI lifecycle and compatibility review

This change creates a shared documentation draft at
`content/integrate/rdi-lifecycle.md`. It does not approve a lifecycle policy or
qualify new deployment combinations.

## Policy status

The proposed policy follows the requested decisions: 18 months from the first
general availability month of each major.minor family, rounded to month end;
patches share the date; maintenance targets the latest patch; no initial grace
period applies. The schedule covers the 20 documented releases from 1.8.0 to
2.2.1 in ten families.

This proposal differs from the public
[Redis Software Support Policy, section 2.6](https://redis.io/legal/software-support-policy/),
which describes 18 months after the subsequent Major Release. It also differs
from the [Redis Software cluster lifecycle](https://redis.io/docs/latest/operate/rs/installing-upgrading/product-lifecycle/),
which describes 24 months after the subsequent major cluster release.
The proposed RDI rule must not be presented as either existing policy.

The policy remains a proposal. Adopting it is a product/support decision outside
this documentation change. In particular,
1.8.x and 1.10.x would reach EOL on November 30, 2026, without a notice period.

## Compatibility evidence and gaps

- Public release-note months establish the first GA month of each family.
  Later patch dates do not extend the calculated EOL date.
- The documented VM distribution list matches the installer checks across all
  20 releases: Ubuntu 20.04, 22.04, and 24.04; RHEL 8 and 9. This supports
  grouping the documented OS list, not claiming that all runtime combinations
  passed qualification.
- Release-tag test configurations identify cluster builds, not supported bounds
  or completed release qualification. A successful current development run
  provides separate evidence for that snapshot only. The draft records the
  configured builds without deriving support bounds from them or from the state
  database's requirements.
- No complete release-specific qualification evidence was found for Redis Cloud
  target plans, workload architectures, or Kubernetes/OpenShift versions. Those
  combinations remain explicitly unverified.
- Online and offline VM installations need separate runtime compatibility
  verification. The documented OS list alone does not establish that every
  installed runtime combination is supported.
- The Active-Active restriction is preserved from release notes. JSON merge
  conditions follow the 1.15.0 and 1.19.0 release notes; neither condition
  establishes a general target support matrix.

Before publishing a completed compatibility matrix, Engineering must supply
release-specific target cluster/database versions, Cloud plans if applicable,
deployment platform versions, architectures, and any patch-specific exceptions.
Unverified entries must not be relabelled supported based only on the latest
shared requirements or a configured test job.

## Reference patterns

- [Confluent interoperability](https://docs.confluent.io/platform/current/installation/versions-interoperability.html):
  separate lifecycle and OS tables; patches share a family support window.
- [Red Hat Debezium supported configurations](https://access.redhat.com/articles/4938181):
  separate deployment and database integration tables; distinguish tested and
  supported combinations.
- [Fivetran HVR lifecycle](https://fivetran.com/docs/hvr6/getting-started/release-life-cycle):
  distinguish compatibility from current support.

## Validation

- Passed: all 20 documented releases map to the ten listed families. Every EOL
  date matches the first GA month plus 18 months, rounded to month end.
- Passed: the real version archiver copies neither the shared page nor a stale
  lifecycle table into a future snapshot. Links retain the shared source path.
- Passed: full current, 1.19.1, and 2.0.0 documentation builds using the pinned
  Hugo 0.143.1. The current build adds no unresolved-link warnings compared with
  the baseline. Existing unrelated warnings remain.
- Passed: all six current entry points and the available entry points in both
  version builds link to the shared URL. Article links and anchors resolve.
- Passed: desktop rendering at 1440 pixels and narrow rendering at 390 pixels.
  Compatibility tables use the existing horizontal scrolling wrapper; the
  rightmost conditions remain accessible. The RDI version selector stays hidden.
- The Libraries and tools list template previously ignored the section's body.
  A condition scoped to that index now renders its explicit lifecycle link.
  Version copying and deployment logic are unchanged.
- Initial preview setup needed the pinned Hugo version, regenerated local
  example metadata, and public remote examples. These adjustments were made only
  in temporary build copies; no dependency changes are part of this change.

### Initial independent prospective-customer review

The final validation step reviews only rendered documentation and public links,
without these review notes or internal evidence.

The independent reviewer evaluated an existing 1.12.3 deployment with Redis
Software 7.8, Redis database 7.2, and Ubuntu 22.04 on x86-64; a new deployment
with Redis Software 8.0, Redis database 8.2, and RHEL 9 or OpenShift; and a
self-managed deployment with a Redis Cloud target.

- Passed: lifecycle information is discoverable from the RDI overview,
  requirements, and release notes. The latest release and upgrade link are clear.
- Passed: the reviewer correctly found December 31, 2026 as the proposed EOL for
  1.12.3 and understood that patches do not extend support.
- Passed: cluster versions, database versions, and the internal state database
  are distinguishable. Managed Cloud RDI does not imply self-managed Cloud target
  compatibility.
- Publication gap: the reviewer could not select a production-supported
  combination because target/platform/architecture qualification is missing.
  This is a product evidence gap, not permission to infer support. The draft
  explicitly labels the gaps and directs the reader to Redis support.
- Addressed in the new page: the reviewer found conflicting state-database
  sharding claims. The 1.15.0 release notes claim support for a multi-sharded
  internal RDI database, while the requirements say to disable sharding. The
  new page no longer repeats either position; existing documentation is unchanged.
- Addressed in the new page: the reviewer found that the linked upgrade page's
  general rollback instructions conflict with its warning about downgrading
  from 2.0.0+ to pre-2.0.0. The new page repeats that existing downgrade boundary
  without promising a recovery path. The upgrade page needs a separate technical
  correction to bound its VM and Helm rollback instructions.
- Follow-up outside this change: reconcile the installation pages' broad
  supported-platform language with release-specific qualification and distinguish
  managed RDI from self-managed RDI writing to a cloud-hosted target.

The result is a reviewable lifecycle proposal and compatibility draft. It is not
ready to guide a production purchase until the qualification gaps and existing
technical conflicts are resolved.

After the edits, all three builds and link checks passed again. The independent
reviewer then checked the updated rendered page and found no remaining blocking
defect in the new page's handling of the reviewed points. It confirmed that the
page repeats neither disputed sharding position, promises no rollback path,
separates target and state requirements, and presents the dates and compatibility
gaps as a draft. Policy adoption and product qualification remain open.

## Local review revision

- Removed the requested introductory scope sentences and the draft warning.
  The lifecycle policy remains labelled as proposed; the schedule uses EOL.
- Replaced the release-date table with a Gantt-style lifecycle chart. All ten
  release months and EOL dates appear on the chart. Month-only release dates
  use the first day for positioning, without asserting an exact GA day.
- Reused the site's timeline renderer, with optional version-label and minimum
  width attributes. Existing charts keep their cluster-version heading and
  sizing. The RDI chart labels release families and scrolls on narrow screens.
- Added a release-family upgrade/downgrade matrix. Newer-family entries point to
  the upgrade procedure; downgrades from 2.x to 1.x are explicitly unsupported.
  Other downgrade entries require review rather than assuming that the absence
  of a restriction establishes support.
- Included additional published restrictions: the pre-1.8.0 to 2.2.0 route via
  2.0.0, processor migration on 1.19.0 when switching from classic to Flink,
  the named-pipeline downgrade restriction, disaster recovery lease constraints,
  and the Helm downgrade boundary at 1.8.0.
- Searched all 36 public RDI release-note pages, including releases before 1.8.0,
  for RE cluster support additions and version bounds. No minimum or maximum
  supported target RE cluster version was specified. Target compatibility now
  has only RDI family, minimum RE cluster version, and maximum RE cluster version;
  missing bounds are labelled **Not documented**, not inferred from test inputs.
- Relevant release-note changes do not establish RE cluster version bounds:
  1.10.0 adds MongoDB sources; 1.14.0 adds Spanner sources; 1.18.0 introduces
  Snowflake sources in preview; 1.15.0 adds native JSON merge with an older-module
  fallback and describes sharded internal RDI databases; 1.19.0 unifies Flink JSON
  merge behavior. Source and module versions are not RE cluster versions.
- Passed: production build with Hugo 0.143.1, chart date calculations, matrix
  downgrade-boundary checks, and all ten article links and their section anchors.
  The lifecycle article adds no unresolved-link warning.
- Passed: desktop and narrow-screen chart rendering. All chart labels fit inside
  the diagram, horizontal scrolling preserves readable dates on narrow screens,
  and the existing Redis Software lifecycle chart keeps its default heading.
- The independent prospective-customer reviewer checked this revision and found
  no blocking new issue. It confirmed the chart's date precision, the matrix's
  2.x-to-1.x restriction and conditional downgrade wording, and the distinction
  between undocumented RE cluster bounds and unrestricted support.

### Dynamic current-date marker

The RDI chart opts into a blue vertical line labelled with the current date.
The browser calculates the date when rendering the page, so deployed content
needs no daily edit or rebuild. The marker uses the reader's local calendar day.
An open page checks for a new day every minute and when the reader returns to it.
The time axis includes the current day even after the listed lifecycle dates.

Browser checks simulated November 18 and 19, 2026 without editing the page or
rebuilding it: both the label and line position updated, with exactly one marker.
A December 31, 2030 check verified an extended axis and an unclipped label.
The current-date marker also fits the narrow-screen chart. Existing Redis
Software lifecycle charts retain their previous behavior unless they opt in.
The independent customer review confirmed that the Today line is clear and
leaves the release and EOL labels readable.

## Automated test coverage research

Checked the current development snapshot on November 18, 2026, and the remote
release-tag objects for all 20 documented releases. The development snapshot is
`d5dbdf4cbe03e073e9ffcbb5331c1de77e76dbb8`. Release-tag configuration evidence is
separate from successful test execution and from an approved support matrix.
The extra 1.9.0 tag has no corresponding public release notes and is not added
to the lifecycle schedule as a confirmed GA family.

### Redis target findings

- Current E2E groups use RE 6.4.2-61, 7.8.2-60, and 8.0.2-10. Groups and
  processors do not exercise every scenario on every build. Smoke tests use
  RE 7.22.0-250. The smoke setup creates the internal and target databases on
  that cluster, so this is target-cluster evidence.
- The E2E command's default is also 7.22.0-250, but the workflow overrides it.
  It is not an additional E2E matrix entry.
- All documented releases through 1.15.1 configure E2E with 6.4.2-61 and
  7.8.2-60. From 1.16.0, the union of E2E configurations also includes 8.0.2-10.
- Smoke configuration uses 7.8.4-18 through 1.16.0, switches to 7.22.0-250 in
  1.16.1, still uses 7.8.4-18 in the 1.16.2 release branch, and uses 7.22.0-250
  in the documented 1.18.x through 2.2.x releases. Do not infer inheritance
  between patch branches or label 1.16.2 an intentional reversal without evidence.
- Image OS suffixes describe the RE container, not the RDI host operating system.
  The public page uses numeric cluster builds and omits internal image locations.
- The observed lowest and highest cluster builds are useful qualification
  candidates. They do not establish supported bounds or support for versions
  between the observed builds. The minimum/maximum columns remain undocumented.

### Platform findings

- Current development jobs explicitly select Ubuntu 26.04 for one VM installer
  case, Ubuntu 24.04 for upgrades from 1.8.0 and 2.2.1, and a RHEL 9 runner for
  one VM smoke case. Other Ubuntu cases use the rolling ubuntu-latest label.
- E2E jobs also use ubuntu-latest, except one classic integration group pinned
  to Ubuntu 24.04. The workflows select amd64 tooling and an x64 RHEL runner.
  This provides x86-64 configuration evidence, not ARM workload qualification.
- Helm and multi-source smoke jobs install K3s, rather than a separate
  customer-managed Kubernetes or OpenShift distribution. No version-specific
  OpenShift test configuration was found in the inspected workflows and scripts.
- All 20 release packages pin K3s 1.31.1+k3s1 for offline installation. Their
  online installers and E2E setup downloaded an unpinned version. Historical
  online runtime versions cannot be reconstructed from those tags alone.
- Current development pins online installation and E2E setup to K3s
  1.37.2+k3s1. This and Ubuntu 26.04 coverage postdate 2.2.1. They must not be
  presented as released-family platform support.
- Current development also changes installer OS acceptance. The page preserves
  the published released-family OS list instead of applying unreleased changes
  retroactively. Online/offline qualification remains separate.

### Changes in test configuration

Dates are commit dates in the project's Europe/Sofia timezone. These dates
identify configuration changes, not first GA support commitments.

| Date | Change |
|---|---|
| February 1, 2024 | E2E pipeline includes RE 6.4.2-61 and 7.2.4-64. |
| May 27, 2024 | Smoke test configuration starts with RE 6.4.2-61. |
| October 6, 2024 | Packaged K3s pinned to 1.31.1+k3s1. |
| October 14, 2024 | RE test container OS changes from RHEL 7 to RHEL 8; this is not host OS coverage. |
| December 16, 2024 | E2E replaces RE 7.2.4-64 with 7.8.2-60 and keeps 6.4.2-61. |
| March 20, 2025 | Smoke RE changes from 6.4.2-61 to 7.8.4-18. |
| April 29, 2025 | RHEL 9 smoke coverage added alongside Ubuntu. |
| October 23, 2025 | RE 8.0.2-10 added to classic and Flink E2E configurations. The first documented initial family release tag containing it is 1.16.0. |
| February 11, 2026 | Smoke RE changes to 7.22.0-250. Release branches differ, including 1.16.2. |
| April 17, 2026 | Classic E2E retains 6.4 and 7.8; Flink E2E retains 6.4 and 8.0. The union still contains all three versions. |
| July 16, 2026 | Matrix redesign distributes 6.4, 7.8, and 8.0 across both classic and Flink groups. |
| November 5, 2026 | Explicit Ubuntu 26.04 installer smoke case added. |
| November 10, 2026 | One classic integration group pinned to Ubuntu 24.04; E2E and online installer setup begin using the packaged K3s pin. |
| November 11, 2026 | Packaged K3s changes to 1.37.2+k3s1. |
| November 12, 2026 | Ubuntu 24.04 smoke upgrade from 2.2.1 added. |
| November 13, 2026 | Ubuntu 24.04 smoke upgrade from 1.8.0 added. |

### Execution evidence

The completed main-branch run for the checked snapshot passed all 63 relevant
jobs: 14 classic, 22 Flink, 14 Helm smoke, nine installer smoke, three multi-source
smoke, and one RHEL 9 smoke. The run completed on November 18, 2026 in Sofia
(November 17 UTC). This verifies that snapshot's selected jobs, not every
OS/RE/processor combination, all historical releases, or an approved support range.

The public page separates documented requirements, historical test inputs, and
current development environments. It retains unknown support bounds and the
existing product limitations.

### Validation of test-coverage revision

- Full current documentation build passed with the pinned Hugo version. No
  unresolved-link warning references the lifecycle page; unrelated warnings remain.
- Checked desktop and 390-pixel rendering. The added tables use the existing
  horizontal scrolling wrapper and do not widen the page.
- The release-notes link resolves to the current index. The rendered article
  includes no private source or issue-tracker links.
- Re-extracted all 20 release-tag configurations and checked every grouped RE
  row, including both 1.16.x smoke configurations and the offline K3s pin.
- The final independent prospective-customer review found no blocking new issue.
  It confirmed the separation between support claims, release-tag test inputs,
  and current development coverage. Its wording finding was addressed by naming
  K3s 1.37.2+k3s1 explicitly in the development pinning sentence. The reviewer
  could find EOL, patch behavior, and upgrade guidance. It still could not choose
  a fully supported production combination without product qualification.
