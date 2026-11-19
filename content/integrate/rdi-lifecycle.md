---
title: RDI lifecycle and compatibility
description: Proposed release support dates and compatibility information for self-managed Redis Data Integration.
linkTitle: RDI lifecycle and compatibility
type: integration
weight: 2
---

Use this page to check release support dates and deployment requirements for
self-managed Redis Data Integration (RDI).

For a new deployment, start with the latest RDI release, **{{< rdi-version >}}**,
and check its compatibility with your environment. See the [RDI installation requirements](/content/integrate/redis-data-integration/installation/reqsummary.md)
and [upgrade instructions](/content/integrate/redis-data-integration/installation/upgrade.md).
For the managed RDI service, see [Data Integration in Redis Cloud](/content/operate/rc/rdi/_index.md).

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

### End-of-life schedule

Release months refer to the first GA release in each family, not its latest patch.

Each bar starts at the first GA release month and ends on the EOL date. The chart
uses the first day of the release month for positioning, not as the exact GA date.

```timeline {title="RDI lifecycle: GA to EOL" version-label="RDI family" min-width="600" show-today="true"}
2.2.x: Oct 2026 - Apr 30, 2028
2.0.x: Sep 2026 - Mar 31, 2028
1.19.x: Jul 2026 - Jan 31, 2028
1.18.x: Apr 2026 - Oct 31, 2027
1.16.x: Jan 2026 - Jul 31, 2027
1.15.x: Oct 2025 - Apr 30, 2027
1.14.x: Aug 2025 - Feb 28, 2027
1.12.x: Jun 2025 - Dec 31, 2026
1.10.x: May 2025 - Nov 30, 2026
1.8.x: May 2025 - Nov 30, 2026
```

## RDI upgrade and downgrade paths

Rows identify your current release family. Columns identify the destination family.
Use the installation package for your destination version and its documentation
where available. Download examples in the current upgrade instructions use the
latest RDI release.

- ✅ **Upgrade**: Follow the [upgrade instructions](/content/integrate/redis-data-integration/installation/upgrade.md).
- ⚠️ **Review restrictions**: Read the linked upgrade or downgrade requirements before proceeding.
- ❌ **Not supported**: You cannot downgrade from RDI 2.0.0 or later to a version before 2.0.0.
- **—**: Both versions belong to the same release family.

{{< table-scrollable >}}

| Current RDI family | 1.8.x | 1.10.x | 1.12.x | 1.14.x | 1.15.x | 1.16.x | 1.18.x | 1.19.x | 2.0.x | 2.2.x |
|---|---|---|---|---|---|---|---|---|---|---|
| 1.8.x | — | [✅](/content/integrate/redis-data-integration/installation/upgrade.md "Upgrade instructions") | [✅](/content/integrate/redis-data-integration/installation/upgrade.md "Upgrade instructions") | [✅](/content/integrate/redis-data-integration/installation/upgrade.md "Upgrade instructions") | [✅](/content/integrate/redis-data-integration/installation/upgrade.md "Upgrade instructions") | [✅](/content/integrate/redis-data-integration/installation/upgrade.md "Upgrade instructions") | [✅](/content/integrate/redis-data-integration/installation/upgrade.md "Upgrade instructions") | [✅](/content/integrate/redis-data-integration/installation/upgrade.md "Upgrade instructions") | [⚠️](/content/integrate/redis-data-integration/installation/upgrade.md#upgrading-to-rdi-200 "Review upgrade requirements") | [⚠️](/content/integrate/redis-data-integration/installation/upgrade.md#upgrading-to-rdi-200 "Review upgrade requirements") |
| 1.10.x | [⚠️](/content/integrate/redis-data-integration/installation/upgrade.md#verifying-the-upgrade "Review downgrade restrictions") | — | [✅](/content/integrate/redis-data-integration/installation/upgrade.md "Upgrade instructions") | [✅](/content/integrate/redis-data-integration/installation/upgrade.md "Upgrade instructions") | [✅](/content/integrate/redis-data-integration/installation/upgrade.md "Upgrade instructions") | [✅](/content/integrate/redis-data-integration/installation/upgrade.md "Upgrade instructions") | [✅](/content/integrate/redis-data-integration/installation/upgrade.md "Upgrade instructions") | [✅](/content/integrate/redis-data-integration/installation/upgrade.md "Upgrade instructions") | [⚠️](/content/integrate/redis-data-integration/installation/upgrade.md#upgrading-to-rdi-200 "Review upgrade requirements") | [⚠️](/content/integrate/redis-data-integration/installation/upgrade.md#upgrading-to-rdi-200 "Review upgrade requirements") |
| 1.12.x | [⚠️](/content/integrate/redis-data-integration/installation/upgrade.md#verifying-the-upgrade "Review downgrade restrictions") | [⚠️](/content/integrate/redis-data-integration/installation/upgrade.md#verifying-the-upgrade "Review downgrade restrictions") | — | [✅](/content/integrate/redis-data-integration/installation/upgrade.md "Upgrade instructions") | [✅](/content/integrate/redis-data-integration/installation/upgrade.md "Upgrade instructions") | [✅](/content/integrate/redis-data-integration/installation/upgrade.md "Upgrade instructions") | [✅](/content/integrate/redis-data-integration/installation/upgrade.md "Upgrade instructions") | [✅](/content/integrate/redis-data-integration/installation/upgrade.md "Upgrade instructions") | [⚠️](/content/integrate/redis-data-integration/installation/upgrade.md#upgrading-to-rdi-200 "Review upgrade requirements") | [⚠️](/content/integrate/redis-data-integration/installation/upgrade.md#upgrading-to-rdi-200 "Review upgrade requirements") |
| 1.14.x | [⚠️](/content/integrate/redis-data-integration/installation/upgrade.md#verifying-the-upgrade "Review downgrade restrictions") | [⚠️](/content/integrate/redis-data-integration/installation/upgrade.md#verifying-the-upgrade "Review downgrade restrictions") | [⚠️](/content/integrate/redis-data-integration/installation/upgrade.md#verifying-the-upgrade "Review downgrade restrictions") | — | [✅](/content/integrate/redis-data-integration/installation/upgrade.md "Upgrade instructions") | [✅](/content/integrate/redis-data-integration/installation/upgrade.md "Upgrade instructions") | [✅](/content/integrate/redis-data-integration/installation/upgrade.md "Upgrade instructions") | [✅](/content/integrate/redis-data-integration/installation/upgrade.md "Upgrade instructions") | [⚠️](/content/integrate/redis-data-integration/installation/upgrade.md#upgrading-to-rdi-200 "Review upgrade requirements") | [⚠️](/content/integrate/redis-data-integration/installation/upgrade.md#upgrading-to-rdi-200 "Review upgrade requirements") |
| 1.15.x | [⚠️](/content/integrate/redis-data-integration/installation/upgrade.md#verifying-the-upgrade "Review downgrade restrictions") | [⚠️](/content/integrate/redis-data-integration/installation/upgrade.md#verifying-the-upgrade "Review downgrade restrictions") | [⚠️](/content/integrate/redis-data-integration/installation/upgrade.md#verifying-the-upgrade "Review downgrade restrictions") | [⚠️](/content/integrate/redis-data-integration/installation/upgrade.md#verifying-the-upgrade "Review downgrade restrictions") | — | [✅](/content/integrate/redis-data-integration/installation/upgrade.md "Upgrade instructions") | [✅](/content/integrate/redis-data-integration/installation/upgrade.md "Upgrade instructions") | [✅](/content/integrate/redis-data-integration/installation/upgrade.md "Upgrade instructions") | [⚠️](/content/integrate/redis-data-integration/installation/upgrade.md#upgrading-to-rdi-200 "Review upgrade requirements") | [⚠️](/content/integrate/redis-data-integration/installation/upgrade.md#upgrading-to-rdi-200 "Review upgrade requirements") |
| 1.16.x | [⚠️](/content/integrate/redis-data-integration/installation/upgrade.md#verifying-the-upgrade "Review downgrade restrictions") | [⚠️](/content/integrate/redis-data-integration/installation/upgrade.md#verifying-the-upgrade "Review downgrade restrictions") | [⚠️](/content/integrate/redis-data-integration/installation/upgrade.md#verifying-the-upgrade "Review downgrade restrictions") | [⚠️](/content/integrate/redis-data-integration/installation/upgrade.md#verifying-the-upgrade "Review downgrade restrictions") | [⚠️](/content/integrate/redis-data-integration/installation/upgrade.md#verifying-the-upgrade "Review downgrade restrictions") | — | [✅](/content/integrate/redis-data-integration/installation/upgrade.md "Upgrade instructions") | [✅](/content/integrate/redis-data-integration/installation/upgrade.md "Upgrade instructions") | [⚠️](/content/integrate/redis-data-integration/installation/upgrade.md#upgrading-to-rdi-200 "Review upgrade requirements") | [⚠️](/content/integrate/redis-data-integration/installation/upgrade.md#upgrading-to-rdi-200 "Review upgrade requirements") |
| 1.18.x | [⚠️](/content/integrate/redis-data-integration/installation/upgrade.md#verifying-the-upgrade "Review downgrade restrictions") | [⚠️](/content/integrate/redis-data-integration/installation/upgrade.md#verifying-the-upgrade "Review downgrade restrictions") | [⚠️](/content/integrate/redis-data-integration/installation/upgrade.md#verifying-the-upgrade "Review downgrade restrictions") | [⚠️](/content/integrate/redis-data-integration/installation/upgrade.md#verifying-the-upgrade "Review downgrade restrictions") | [⚠️](/content/integrate/redis-data-integration/installation/upgrade.md#verifying-the-upgrade "Review downgrade restrictions") | [⚠️](/content/integrate/redis-data-integration/installation/upgrade.md#verifying-the-upgrade "Review downgrade restrictions") | — | [✅](/content/integrate/redis-data-integration/installation/upgrade.md "Upgrade instructions") | [⚠️](/content/integrate/redis-data-integration/installation/upgrade.md#upgrading-to-rdi-200 "Review upgrade requirements") | [⚠️](/content/integrate/redis-data-integration/installation/upgrade.md#upgrading-to-rdi-200 "Review upgrade requirements") |
| 1.19.x | [⚠️](/content/integrate/redis-data-integration/installation/upgrade.md#verifying-the-upgrade "Review downgrade restrictions") | [⚠️](/content/integrate/redis-data-integration/installation/upgrade.md#verifying-the-upgrade "Review downgrade restrictions") | [⚠️](/content/integrate/redis-data-integration/installation/upgrade.md#verifying-the-upgrade "Review downgrade restrictions") | [⚠️](/content/integrate/redis-data-integration/installation/upgrade.md#verifying-the-upgrade "Review downgrade restrictions") | [⚠️](/content/integrate/redis-data-integration/installation/upgrade.md#verifying-the-upgrade "Review downgrade restrictions") | [⚠️](/content/integrate/redis-data-integration/installation/upgrade.md#verifying-the-upgrade "Review downgrade restrictions") | [⚠️](/content/integrate/redis-data-integration/installation/upgrade.md#verifying-the-upgrade "Review downgrade restrictions") | — | [⚠️](/content/integrate/redis-data-integration/installation/upgrade.md#upgrading-to-rdi-200 "Review upgrade requirements") | [⚠️](/content/integrate/redis-data-integration/installation/upgrade.md#upgrading-to-rdi-200 "Review upgrade requirements") |
| 2.0.x | [❌](/content/integrate/redis-data-integration/installation/upgrade.md "Downgrade not supported") | [❌](/content/integrate/redis-data-integration/installation/upgrade.md "Downgrade not supported") | [❌](/content/integrate/redis-data-integration/installation/upgrade.md "Downgrade not supported") | [❌](/content/integrate/redis-data-integration/installation/upgrade.md "Downgrade not supported") | [❌](/content/integrate/redis-data-integration/installation/upgrade.md "Downgrade not supported") | [❌](/content/integrate/redis-data-integration/installation/upgrade.md "Downgrade not supported") | [❌](/content/integrate/redis-data-integration/installation/upgrade.md "Downgrade not supported") | [❌](/content/integrate/redis-data-integration/installation/upgrade.md "Downgrade not supported") | — | [⚠️](/content/integrate/redis-data-integration/installation/upgrade.md#upgrading-to-rdi-220 "Review upgrade requirements") |
| 2.2.x | [❌](/content/integrate/redis-data-integration/installation/upgrade.md "Downgrade not supported") | [❌](/content/integrate/redis-data-integration/installation/upgrade.md "Downgrade not supported") | [❌](/content/integrate/redis-data-integration/installation/upgrade.md "Downgrade not supported") | [❌](/content/integrate/redis-data-integration/installation/upgrade.md "Downgrade not supported") | [❌](/content/integrate/redis-data-integration/installation/upgrade.md "Downgrade not supported") | [❌](/content/integrate/redis-data-integration/installation/upgrade.md "Downgrade not supported") | [❌](/content/integrate/redis-data-integration/installation/upgrade.md "Downgrade not supported") | [❌](/content/integrate/redis-data-integration/installation/upgrade.md "Downgrade not supported") | [⚠️](/content/integrate/redis-data-integration/installation/upgrade.md#downgrade-from-rdi-220 "Review downgrade restrictions") | — |

{{< /table-scrollable >}}

The upgrade instructions also document these requirements:

- To upgrade from a version before 1.8.0 to 2.2.0, [upgrade to 2.0.0 first](/content/integrate/redis-data-integration/installation/upgrade.md#upgrade-from-a-version-before-180-in-two-steps).
- Before upgrading from 1.19.x or earlier to 2.0.0 or later, review the [processor migration and configuration changes](/content/integrate/redis-data-integration/installation/upgrade.md#upgrading-to-rdi-200). Migrating a classic pipeline to the Flink processor requires migration on 1.19.0 before the upgrade.
- A downgrade from 2.2.0 to 2.0.0 can preserve an existing `default` pipeline. [Do not downgrade after creating a pipeline other than `default`](/content/integrate/redis-data-integration/installation/upgrade.md#downgrade-from-rdi-220).
- A disaster recovery (DR) setup using a DynamoDB lease requires 2.2.0 or later. Downgrading a setup using a Google Cloud Storage (GCS) lease to 2.0.0 requires downtime and additional steps. See [Upgrade or downgrade a DR setup](/content/integrate/redis-data-integration/installation/disaster-recovery/_index.md#upgrade-or-downgrade-a-dr-setup).
- Downgrading from 1.8.0 or later to a version before 1.8.0 with `helm upgrade` does not work. The [upgrade verification instructions](/content/integrate/redis-data-integration/installation/upgrade.md#verifying-the-upgrade) require uninstalling and reinstalling the earlier version.

## Redis target compatibility

The target Redis Enterprise (RE) cluster receives your pipeline's output.
Use the following RE cluster versions for each RDI family.

{{< table-scrollable >}}

| RDI family | Minimum RE cluster version | Maximum RE cluster version |
|---|---|---|
| 2.2.x | 6.4.2-61 | 8.0.2-10 |
| 2.0.x | 6.4.2-61 | 8.0.2-10 |
| 1.19.x | 6.4.2-61 | 8.0.2-10 |
| 1.18.x | 6.4.2-61 | 8.0.2-10 |
| 1.16.x | 6.4.2-61 | 8.0.2-10 |
| 1.15.x | 6.4.2-61 | 8.0.2-10 |
| 1.14.x | 6.4.2-61 | 8.0.2-10 |
| 1.12.x | 6.4.2-61 | 8.0.2-10 |
| 1.10.x | 6.4.2-61 | 8.0.2-10 |
| 1.8.x | 6.4.2-61 | 8.0.2-10 |

{{< /table-scrollable >}}

RDI can write to one Redis Active-Active database endpoint. It does not support
writing the same pipeline to multiple Active-Active replicas.

The internal RDI database stores pipeline state. Its separate
[RDI database requirements](/content/integrate/redis-data-integration/installation/reqsummary.md#rdi-database-requirements)
do not establish supported target RE cluster versions.

## VM installation OS Compatibility matrix

For virtual machine (VM) installations, use one of the following operating
systems (OSs) on the host running RDI. RHEL means Red Hat Enterprise Linux.

✅ Supported · ❌ Not supported

{{< table-scrollable >}}

| RDI family | RHEL 8 | RHEL 9 | Ubuntu 20.04 | Ubuntu 22.04 | Ubuntu 24.04 |
|---|---|---|---|---|---|
| 2.2.x | ✅ | ✅ | ✅ | ✅ | ✅ |
| 2.0.x | ✅ | ✅ | ✅ | ✅ | ✅ |
| 1.19.x | ✅ | ✅ | ✅ | ✅ | ✅ |
| 1.18.x | ✅ | ✅ | ✅ | ✅ | ✅ |
| 1.16.x | ✅ | ✅ | ✅ | ✅ | ✅ |
| 1.15.x | ✅ | ✅ | ✅ | ✅ | ✅ |
| 1.14.x | ✅ | ✅ | ✅ | ✅ | ✅ |
| 1.12.x | ✅ | ✅ | ✅ | ✅ | ✅ |
| 1.10.x | ✅ | ✅ | ✅ | ✅ | ✅ |
| 1.8.x | ✅ | ✅ | ✅ | ✅ | ✅ |

{{< /table-scrollable >}}

## Kubernetes and OpenShift installations

Use Kubernetes and OpenShift versions that have not reached EOL. See the
[Kubernetes release lifecycle](https://kubernetes.io/releases/) and
[OpenShift lifecycle](https://access.redhat.com/support/policy/updates/openshift).
For deployment requirements, see [RDI installation requirements](/content/integrate/redis-data-integration/installation/reqsummary.md).

An RDI lifecycle date does not establish continued support for its Redis target,
OS, or Kubernetes distribution. Check each dependency's support status separately.
For source database versions, see [Supported source databases](/content/integrate/redis-data-integration/_index.md#supported-source-databases).
