---
Title: Redis Enterprise Software release notes 8.0.x
alwaysopen: false
categories:
- docs
- operate
- rs
compatibleOSSVersion: Redis 8.0
description: TBA
hideListLinks: true
linkTitle: 8.0.x releases
toc: 'true'
weight: 67
---

​[​Redis Enterprise Software version 8.0](https://redis.io/downloads/#software) is now available!

## Highlights

This version offers:

- TBA

## Detailed release notes

For more detailed release notes, select a build version from the following table:

{{<table-children columnNames="Version&nbsp;(Release&nbsp;date)&nbsp;,Major changes,Redis CE compatibility" columnSources="LinkTitle,Description,compatibleOSSVersion" enableLinks="LinkTitle">}}

## Version changes

- TBA

### Breaking changes

Redis Enterprise Software version 8.0 introduces the following breaking changes:

- TBA

### Product lifecycle updates

- TBA

### Deprecations

#### API deprecations

- Deprecated the `policy` field for [bootstrap]({{<relref "/operate/rs/references/rest-api/requests/bootstrap">}}) REST API requests. Use [`PUT /v1/cluster/policy`]({{< relref "/operate/rs/references/rest-api/requests/cluster/policy#put-cluster-policy" >}}) to change cluster policies after cluster creation instead.

#### Internal monitoring and v1 Prometheus metrics deprecation

The existing [internal monitoring engine]({{<relref "/operate/rs/monitoring/v1_monitoring">}}) is deprecated. We recommend transitioning to the new [metrics stream engine]({{<relref "/operate/rs/monitoring/metrics_stream_engine">}}) for improved performance, enhanced integration capabilities, and modernized metrics streaming.

V1 Prometheus metrics are deprecated but still available. To transition to the new metrics stream engine, either migrate your existing dashboards using [this guide]({{<relref "/operate/rs/references/metrics/prometheus-metrics-v1-to-v2">}}) now, or wait to use new preconfigured dashboards when they become available in a future release.

### Upcoming changes

### Supported platforms

The following table provides a snapshot of supported platforms as of this Redis Software release. See the [supported platforms reference]({{< relref "/operate/rs/references/supported-platforms" >}}) for more details about operating system compatibility.

<span title="Check mark icon">&#x2705;</span> Supported – The platform is supported for this version of Redis Software and Redis Stack modules.

<span title="Warning icon" class="font-serif">:warning:</span> Deprecation warning – The platform is still supported for this version of Redis Software, but support will be removed in a future release.

| Redis Software<br />major versions | 7.8 | 7.4 | 7.2 | 6.4 | 6.2 |
|---------------------------------|:-----:|:-----:|:-----:|:-----:|:-----:|
| **Release date** | Nov 2024 | Feb 2024 | Aug 2023 | Feb 2023 | Aug 2021 |
| [**End-of-life date**]({{< relref "/operate/rs/installing-upgrading/product-lifecycle#endoflife-schedule" >}}) | Determined after<br />next major release | Nov 2026 | Feb 2026 | Aug 2025 | Feb 2025 |
| **Platforms** | | | | | |
| RHEL 9 &<br />compatible distros<sup>[1](#table-note-1)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – | – | – |
| RHEL 9<br />FIPS mode<sup>[5](#table-note-5)</sup> | <span title="Supported">&#x2705;</span> | – | – | – | – |
| RHEL 8 &<br />compatible distros<sup>[1](#table-note-1)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| RHEL 7 &<br />compatible distros<sup>[1](#table-note-1)</sup> | – | – | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Ubuntu 22.04<sup>[2](#table-note-2)</sup> | <span title="Supported">&#x2705;</span> | – | – | – | – |
| Ubuntu 20.04<sup>[2](#table-note-2)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – |
| Ubuntu 18.04<sup>[2](#table-note-2)</sup> | – | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Ubuntu 16.04<sup>[2](#table-note-2)</sup> | – | – | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Amazon Linux 2 | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – |
| Amazon Linux 1 | – | – | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Kubernetes<sup>[3](#table-note-3)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Docker<sup>[4](#table-note-4)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |

1. <a name="table-note-1"></a>The RHEL-compatible distributions CentOS, CentOS Stream, Alma, and Rocky are supported if they have full RHEL compatibility. Oracle Linux running the Red Hat Compatible Kernel (RHCK) is supported, but the Unbreakable Enterprise Kernel (UEK) is not supported.

2. <a name="table-note-2"></a>The server version of Ubuntu is recommended for production installations. The desktop version is only recommended for development deployments.

3. <a name="table-note-3"></a>See the [Redis Enterprise for Kubernetes documentation]({{< relref "/operate/kubernetes/reference/supported_k8s_distributions" >}}) for details about support per version and Kubernetes distribution.

4. <a name="table-note-4"></a>[Docker images]({{< relref "/operate/rs/installing-upgrading/quickstarts/docker-quickstart" >}}) of Redis Software are certified for development and testing only.

5. <a name="table-note-5"></a>Supported only if [FIPS was enabled during RHEL installation](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/security_hardening/switching-rhel-to-fips-mode_security-hardening#proc_installing-the-system-with-fips-mode-enabled_switching-rhel-to-fips-mode) to ensure FIPS compliance.

## Known issues

- RS131972: Creating an ACL that contains a line break in the Cluster Manager UI can cause shard migration to fail due to ACL errors.

- RS155734: Endpoint availability metrics do not work as expected due to a calculation error.

- RS153589: The metrics stream engine preview reports incorrect latency metrics.

## Known limitations

#### New Cluster Manager UI limitations

The following legacy UI features are not yet available in the new Cluster Manager UI:

- Purge an Active-Active instance.

    Use [`crdb-cli crdb purge-instance`]({{< relref "/operate/rs/references/cli-utilities/crdb-cli/crdb/purge-instance" >}}) instead.

- Search and export the log.
