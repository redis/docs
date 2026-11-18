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

The draft labels both the policy and dates as proposed. Adopting the proposal is
a product/support decision outside this documentation change. In particular,
1.8.x and 1.10.x would reach EOL on November 30, 2026, without a notice period.

## Compatibility evidence and gaps

- Public release-note months establish the first GA month of each family.
  Later patch dates do not extend the calculated EOL date.
- The documented VM distribution list matches the installer checks across all
  20 releases: Ubuntu 20.04, 22.04, and 24.04; RHEL 8 and 9. This supports
  grouping the documented OS list, not claiming that all runtime combinations
  passed qualification.
- Available test configurations are not evidence of completed successful tests
  or a complete support matrix. Cluster versions also do not establish the Redis
  database versions used by the target. The draft leaves target versions
  unverified instead of deriving them from the state database's requirements.
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

### Independent prospective-customer review

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
