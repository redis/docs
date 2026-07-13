---
Title: Redis Software release notes 8.2.x
alwaysopen: false
categories:
- docs
- operate
- rs
compatibleOSSVersion: Redis 8.6, 8.4, 8.2, 8.0, 7.4, 7.2, 6.2
description: TBA
hideListLinks: true
linkTitle: 8.2.x releases
toc: 'true'
weight: 66
---

​[​Redis Software version 8.2](https://redis.io/downloads/#Redis_Software) is now available!

## Highlights

This version offers:

- TBA

## Detailed release notes

For more detailed release notes, select a build version from the following table:

{{<table-children columnNames="Version&nbsp;(Release&nbsp;date)&nbsp;,Major changes,Redis Open Source compatibility" columnSources="LinkTitle,Description,compatibleOSSVersion" enableLinks="LinkTitle">}}

## Version changes

- TBA

### OpenSSL version

Redis Software version 8.0.16 and later requires OpenSSL 3.3 or later.

### Reserved ports

Make sure the following ports are open before upgrading Redis Software.

The following port was added as a reserved port in Redis Software version 8.0.18; however, it is optional instead of reserved in Redis Software version 8.0.20-44:

| Port | Process name | Usage |
|------|--------------|-------|
| 3357 | reconciliation_tree_grpc | Internal communication |

| Port | Process name | Usage | 
|------|--------------|-------|
| 3357 | reconciliation_tree_grpc | Internal communication |

Ports reserved as of Redis Software version 7.22.0:

| Port | Process name | Usage | 
|------|--------------|-------|
| 3346 | cluster_api_internal | Cluster API internal port |
| 3351 | cluster_watchdog_grpc_api | Cluster watchdog now supports gRPC |
| 3352 | grpc_service_mesh | gRPC communication between nodes |
| 3353 | local_grpc_service_mesh | Local gRPC services |
| 3354 | grpc_gossip_envoy | gRPC gossip protocol communication between nodes |
| 3355 | authentication_service | Authentication service internal port |

Ports reserved as of Redis Software version 7.8.2:

| Port | Process name | Usage | 
|------|--------------|-------|
| 3347 | cert_exporter | Reports cluster certificate metrics |
| 3348 | process_exporter | Reports process metrics for DMC and Redis processes |
| 3349 | cluster_wd_exporter | Reports cluster watchdog metrics |
| 3350 | db_controller | Internode communication |
| 9091 | node_exporter | Reports host node metrics related to CPU, memory, disk, and more |
| 9125 | statsd_exporter | Reports push metrics related to the DMC and syncer, and some cluster and node metrics |

See [Ports and port ranges used by Redis Software]({{<relref "/operate/rs/networking/port-configurations#ports-and-port-ranges-used-by-redis-software">}}) for a complete list.

### Deprecations

#### API deprecations

- TBA

#### Internal monitoring and v1 Prometheus metrics deprecation

The existing [internal monitoring engine]({{<relref "/operate/rs/monitoring/v1_monitoring">}}) is deprecated. We recommend transitioning to the new [metrics stream engine]({{<relref "/operate/rs/monitoring/metrics_stream_engine">}}) for improved performance, enhanced integration capabilities, and modernized metrics streaming.

V1 Prometheus metrics are deprecated but still available. To transition to the new metrics stream engine, either migrate your existing dashboards using [this guide]({{<relref "/operate/rs/references/metrics/prometheus-metrics-v1-to-v2">}}) or use [new preconfigured dashboards]({{<relref "/integrate/prometheus-with-redis-enterprise#grafana-dashboards-for-redis-software">}}).

As part of the transition to the metrics stream engine, some internal cluster manager alerts were deprecated in favor of external monitoring solutions. See the [alerts transition plan]({{<relref "/operate/rs/references/alerts/alerts-v1-to-v2">}}) for guidance.

### Supported platforms

The following table provides a snapshot of supported platforms as of this Redis Software release. See the [supported platforms reference]({{< relref "/operate/rs/references/supported-platforms" >}}) for more details about operating system compatibility.

<span title="Check mark icon">&#x2705;</span> Supported – The platform is supported for this version of Redis Software and Redis Stack modules.

<span title="Warning icon" class="font-serif">:warning:</span> Deprecation warning – The platform is still supported for this version of Redis Software, but support will be removed in a future release.

| Redis Software<br />major versions | 8.2 | 8.0 | 7.22 | 7.8 | 7.4 | 7.2 | 6.4 | 6.2 |
|---------------------------------|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|
| **Release date** | Jul 2026 | Oct 2025 | May 2025 | Nov 2024 | Feb 2024 | Aug 2023 | Feb 2023 | Aug 2021 |
| [**End-of-life date**]({{< relref "/operate/rs/installing-upgrading/product-lifecycle#endoflife-schedule" >}}) | Determined after<br />next major release | Jul 2028 | Oct 2027 | May 2027 | Nov 2026 | Feb 2026 | Aug 2025 | Feb 2025 |
| **Platforms** | | | | | | | | |
| RHEL 9 &<br />compatible distros<sup>[1](#table-note-1)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – | – | – |
| RHEL 9<br />FIPS mode<sup>[5](#table-note-5)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – | – | – | – |
| RHEL 8 &<br />compatible distros<sup>[1](#table-note-1)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| RHEL 7 &<br />compatible distros<sup>[1](#table-note-1)</sup> | – | – | – | – | – | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Deprecated" class="font-serif">:warning:</span> |
| Ubuntu 22.04<sup>[2](#table-note-2)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – | – | – | – |
| Ubuntu 20.04<sup>[2](#table-note-2)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – |
| Ubuntu 18.04<sup>[2](#table-note-2)</sup> | – | – | – | – | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Deprecated" class="font-serif">:warning:</span> |
| Ubuntu 16.04<sup>[2](#table-note-2)</sup> | – | – | – | – | – | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Deprecated" class="font-serif">:warning:</span> |
| Amazon Linux 2023<sup>[6](#table-note-6)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – | – | – | – | – | – |
| Amazon Linux 2 | – | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – |
| Amazon Linux 1 | – | – | – | – | – | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Deprecated" class="font-serif">:warning:</span> |
| Kubernetes<sup>[3](#table-note-3)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Docker<sup>[4](#table-note-4)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |

1. <a name="table-note-1"></a>The RHEL-compatible distributions CentOS, CentOS Stream, Alma, and Rocky are supported if they have full RHEL compatibility. Oracle Linux running the Red Hat Compatible Kernel (RHCK) is supported, but the Unbreakable Enterprise Kernel (UEK) is not supported.

2. <a name="table-note-2"></a>The server version of Ubuntu is recommended for production installations. The desktop version is only recommended for development deployments.

3. <a name="table-note-3"></a>See the [Redis Enterprise for Kubernetes documentation]({{< relref "/operate/kubernetes/reference/supported_k8s_distributions" >}}) for details about support per version and Kubernetes distribution.

4. <a name="table-note-4"></a>[Docker images]({{< relref "/operate/rs/installing-upgrading/quickstarts/docker-quickstart" >}}) of Redis Software are certified for development and testing only.

5. <a name="table-note-5"></a>Supported only if [FIPS was enabled during RHEL installation](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/security_hardening/switching-rhel-to-fips-mode_security-hardening#proc_installing-the-system-with-fips-mode-enabled_switching-rhel-to-fips-mode) to ensure FIPS compliance.

6. <a name="table-note-6"></a>Amazon Linux 2023 support was added in Redis Software version 8.0.20.

## Known issues

- RS155734: Endpoint availability metrics do not work as expected due to a calculation error.

## Known limitations

#### Redis Search query failures during rolling upgrades across the 8.4 version boundary

Redis Search queries can fail during a rolling upgrade when a cluster contains shards running Redis versions earlier than 8.4 and shards running Redis version 8.4 or later, due to an internal protocol change introduced in version 8.4. This issue affects only clusters where `parallel_shards_upgrade` has been changed from its default value of `0`. If both conditions apply, expect Redis Search downtime until all nodes are upgraded.

#### Trim ACKED not supported for Active-Active 8.4 databases

For Active-Active databases running Redis database version 8.4, the `ACKED` option is not supported for trimming commands.

#### Rolling upgrade limitation for clusters with custom or deprecated modules

Due to module handling changes introduced in Redis Software version 8.0, upgrading a cluster that contains custom or deprecated modules, such as RedisGraph and RedisGears v2, can become stuck when adding a new node to the cluster during a rolling upgrade.

#### Module commands limitation during Active-Active database upgrades to Redis 8.0

When upgrading an Active-Active database to Redis version 8.0, you cannot use module commands until all Active-Active database instances have been upgraded. Currently, these commands are not blocked automatically.

#### Redis 8.0 database cannot be created with flash

You cannot create a Redis 8.0 database with flash storage enabled. Create a Redis 8.0 database with RAM-only storage instead, or use Redis 8.2 for flash-enabled (Redis Flex) databases.

#### New Cluster Manager UI limitations

The following legacy UI features are not yet available in the new Cluster Manager UI:

- Purge an Active-Active instance.

    Use [`crdb-cli crdb purge-instance`]({{< relref "/operate/rs/references/cli-utilities/crdb-cli/crdb/purge-instance" >}}) instead.

- Search and export the log.
