---
title: RDI lifecycle and compatibility
description: Proposed release support dates and compatibility information for self-managed Redis Data Integration.
linkTitle: RDI lifecycle and compatibility
type: integration
weight: 2
---

Use this page to check release support dates and deployment requirements for
self-managed Redis Data Integration (RDI), starting with release family `1.8.x`.
This page covers all listed families and is shared across documentation versions.

> [!WARNING]
> **Draft proposal.** The lifecycle policy and end-of-life dates on this page are
> proposed, not an approved support commitment. The compatibility tables also
> contain entries that need verification. Confirm your deployment combination
> with [Redis support](https://redis.io/support/) before relying on this draft.

For a new deployment, start with the latest RDI release, **{{< rdi-version >}}**,
and check its compatibility with your environment. See the [RDI installation requirements](/content/integrate/redis-data-integration/installation/reqsummary.md)
and [upgrade instructions](/content/integrate/redis-data-integration/installation/upgrade.md).
For the managed RDI service, see [Data Integration in Redis Cloud](/content/operate/rc/rdi/_index.md).

Downgrading from RDI 2.0.0 or later to a version before 2.0.0 is not supported.

## Proposed lifecycle policy

A release family includes all patch releases with the same major and minor version
numbers. For example, `1.12.x` includes `1.12.0` through `1.12.3`.

Under this proposal:

- Each family receives 18 months of standard technical support and maintenance
  from its first general availability (GA) release month.
- The end-of-life (EOL) date is the last day of the month 18 months after the first
  GA release month. For example, a May 2025 release reaches EOL on November 30, 2026.
- Patch releases share their family's EOL date. A new patch does not extend it.
- Maintenance fixes are delivered in the latest patch of each supported family.
- At EOL, standard technical support and maintenance end for every patch in the
  family. Upgrade to a supported family before that date.
- The same calculation applies to existing families, without an initial grace period.

### Proposed end-of-life schedule

Release months refer to the first GA release in each family, not its latest patch.

| RDI family | First GA release | Proposed EOL |
|---|---|---|
| 2.2.x | October 2026 | April 30, 2028 |
| 2.0.x | September 2026 | March 31, 2028 |
| 1.19.x | July 2026 | January 31, 2028 |
| 1.18.x | April 2026 | October 31, 2027 |
| 1.16.x | January 2026 | July 31, 2027 |
| 1.15.x | October 2025 | April 30, 2027 |
| 1.14.x | August 2025 | February 28, 2027 |
| 1.12.x | June 2025 | December 31, 2026 |
| 1.10.x | May 2025 | November 30, 2026 |
| 1.8.x | May 2025 | November 30, 2026 |

## Redis target compatibility

The target database receives your pipeline's output. Its Redis Software cluster
version and Redis database version are separate compatibility requirements.
Do not use the minimum version for the internal RDI database as the minimum for a target.

**Not verified** means that this draft does not establish support for the
combination. It does not mean **unsupported**. No row marked **Not verified** is
a recommendation for a production deployment.

{{< table-scrollable >}}

| RDI family | Redis product | Cluster version | Redis database version | Conditions |
|---|---|---|---|---|
| 2.2.x | Redis Software | Not verified | Not verified | Version qualification pending. |
| 2.0.x | Redis Software | Not verified | Not verified | Version qualification pending. |
| 1.19.x | Redis Software | Not verified | Not verified | Version qualification pending. |
| 1.18.x | Redis Software | Not verified | Not verified | Version qualification pending. |
| 1.16.x | Redis Software | Not verified | Not verified | Version qualification pending. |
| 1.15.x | Redis Software | Not verified | Not verified | Version qualification pending. |
| 1.14.x | Redis Software | Not verified | Not verified | Version qualification pending. |
| 1.12.x | Redis Software | Not verified | Not verified | Version qualification pending. |
| 1.10.x | Redis Software | Not verified | Not verified | Version qualification pending. |
| 1.8.x | Redis Software | Not verified | Not verified | Version qualification pending. |

{{< /table-scrollable >}}

Redis Cloud target database versions and plans are also **not verified** for these
families in this draft. A managed RDI service's target requirements do not establish
compatibility for self-managed RDI.

RDI can write to one Redis Active-Active database endpoint. It does not support
writing the same pipeline to multiple Active-Active replicas.
For JavaScript Object Notation (JSON) output, check the target's JSON capabilities. RDI `1.15.0` adds native
`JSON.MERGE` for RedisJSON 2.6.0 and later, with a fallback for older versions.
Starting with `1.19.0`, the Flink processor's JSON merge deletes null leaf values
on both paths; the classic processor's fallback preserves them.

The internal RDI database stores pipeline state. Its separate
[RDI database requirements](/content/integrate/redis-data-integration/installation/reqsummary.md#rdi-database-requirements)
do not qualify a target database version.

## Deployment platform compatibility

For virtual machine (VM) installations, the operating system (OS) applies to the
host running RDI. Check customer-managed Kubernetes or OpenShift platform versions
separately from VM operating systems. A command-line interface (CLI) download for an
architecture does not establish support for running RDI workloads on that architecture.

The VM OS list matches the installation documentation and release-specific installer
checks. It does not establish qualification of every OS and runtime combination.

{{< table-scrollable >}}

| RDI families | Installation method | OS or platform versions | Architecture | Conditions |
|---|---|---|---|---|
| 1.8.x–2.2.x | VM | Red Hat Enterprise Linux (RHEL) 8 or 9; Ubuntu 20.04, 22.04, or 24.04 | Not verified | OS list documented; qualification of the installed runtime is pending. Online and offline installations need separate verification. |
| 1.8.x | Kubernetes/OpenShift | Not verified | Not verified | Release-specific version qualification pending. |
| 1.10.x | Kubernetes/OpenShift | Not verified | Not verified | Release-specific version qualification pending. |
| 1.12.x | Kubernetes/OpenShift | Not verified | Not verified | Release-specific version qualification pending. |
| 1.14.x | Kubernetes/OpenShift | Not verified | Not verified | Release-specific version qualification pending. |
| 1.15.x | Kubernetes/OpenShift | Not verified | Not verified | Release-specific version qualification pending. |
| 1.16.x | Kubernetes/OpenShift | Not verified | Not verified | Release-specific version qualification pending. |
| 1.18.x | Kubernetes/OpenShift | Not verified | Not verified | Release-specific version qualification pending. |
| 1.19.x | Kubernetes/OpenShift | Not verified | Not verified | Release-specific version qualification pending. |
| 2.0.x | Kubernetes/OpenShift | Not verified | Not verified | Release-specific version qualification pending. |
| 2.2.x | Kubernetes/OpenShift | Not verified | Not verified | Release-specific version qualification pending. |

{{< /table-scrollable >}}

The installation documentation requires Kubernetes and OpenShift versions that
have not reached EOL. That requirement alone does not qualify every non-EOL version
with every RDI family. See the [Kubernetes release lifecycle](https://kubernetes.io/releases/)
and [OpenShift lifecycle](https://access.redhat.com/support/policy/updates/openshift).

An RDI lifecycle date does not establish continued support for its Redis target,
OS, or Kubernetes distribution. Check each dependency's support status separately.
For source database versions, see [Supported source databases](/content/integrate/redis-data-integration/_index.md#supported-source-databases).
