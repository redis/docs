---
Title: Redis Enterprise Software release notes 8.0.x
alwaysopen: false
categories:
- docs
- operate
- rs
compatibleOSSVersion: Redis 8.2, 8.0, 7.4, 7.2, 6.2
description: Redis Open Source 8.0 and 8.2 features. Lag-aware availability API. Redis Flex GA. Metrics stream engine GA. Module management enhancements. New REST API fields for database and cluster configuration.
hideListLinks: true
linkTitle: 8.0.x releases
toc: 'true'
weight: 67
---

​[​Redis Enterprise Software version 8.0](https://redis.io/downloads/#Redis_Software) is now available!

## Highlights

This version offers:

- Redis Open Source 8.0 and 8.2 features

- Lag-aware availability API

- Redis Flex GA

- Metrics stream engine GA

- Module management enhancements

- New REST API fields for database and cluster configuration

## Detailed release notes

For more detailed release notes, select a build version from the following table:

{{<table-children columnNames="Version&nbsp;(Release&nbsp;date)&nbsp;,Major changes,Redis Open Source compatibility" columnSources="LinkTitle,Description,compatibleOSSVersion" enableLinks="LinkTitle">}}

## Version changes

- [`POST /v1/cluster/actions/change_master`]({{<relref "/operate/rs/references/rest-api/requests/cluster/actions#post-cluster-action">}}) REST API requests will no longer allow a node that exists but is not finished bootstrapping to become the primary node. Such requests will now return the status code `406 Not Acceptable`.

- Node status now returns the actual provisional RAM and flash values even when the maximum number of shards on the node (`max_redis_servers`) is reached. Previously, the API returned 0 for `provisional_ram_of_node` and `provisional_flash_of_node` when a node reached its shard limit. This change affects REST API node status requests and the `rladmin status nodes` command's output.

### Breaking changes

### Redis database version 8 breaking changes {#redis-8-breaking-changes}

When new major versions of Redis Open Source change existing commands, upgrading your database to a new version can potentially break some functionality. Before you upgrade, read the provided list of breaking changes that affect Redis Software and update any applications that connect to your database to handle these changes.

#### ACL behavior changes

Before Redis 8, the existing [ACL]({{<relref "/operate/rs/security/access-control/redis-acl-overview">}}) categories `@read`, `@write`, `@dangerous`, `@admin`, `@slow`, and `@fast` did not include commands for the Redis Query Engine and the JSON, time series, and probabilistic data structures.

Starting with Redis 8, Redis includes all Query Engine, JSON, time series, Bloom filter, cuckoo filter, top-k, count-min sketch, and t-digest commands in these existing ACL categories.

As a result:

- Existing ACL rules such as `+@read +@write` will allow access to more commands than in previous versions of Redis. Here are some examples:

  - A user with `+@read` access will be able to execute `FT.SEARCH`.

  - A user with `+@write` access will be able to execute `JSON.SET`. 

- ACL rules such as `+@all -@write`  will allow access to fewer commands than previous versions of Redis.

  - For example, a user with `+@all -@write` will not be able to execute `JSON.SET`.

  - Explicit inclusion of new [command categories]({{<relref "/operate/oss_and_stack/management/security/acl#command-categories">}}) is required to maintain access. The new categories are: `@search`, `@json`, `@timeseries`, `@bloom`, `@cuckoo`, `@topk`, `@cms`, and `@tdigest`.

- ACL rules such as `+@read +JSON.GET` can now be simplified as `+@read` because `JSON.GET` is included in the `@read` category.

Note that the `@all` category did not change, as it always included all the commands.

#### Redis Query Engine changes

The following changes affect behavior and validation in the Redis Query Engine:

- Enforces validation for `LIMIT` arguments (offset must be 0 if limit is 0).

- Enforces parsing rules for `FT.CURSOR READ` and `FT.ALIASADD`.

- Parentheses are now required for exponentiation precedence in `APPLY` expressions.

- Invalid input now returns errors instead of empty results.

- Default values revisited for reducers like `AVG`, `COUNT`, `SUM`, `STDDEV`, `QUANTILE`, and others.

- Updates to scoring (`BM25` is now the default instead of `TF-IDF`).

- Improved handling of expired records, memory constraints, and malformed fields.

### Deprecations

#### API deprecations

- Deprecated the `policy` field for [bootstrap]({{<relref "/operate/rs/references/rest-api/requests/bootstrap">}}) REST API requests. Use [`PUT /v1/cluster/policy`]({{< relref "/operate/rs/references/rest-api/requests/cluster/policy#put-cluster-policy" >}}) to change cluster policies after cluster creation instead.

- Deprecated the `module_args` field for [database]({{<relref "/operate/rs/references/rest-api/requests/bdbs">}}) REST API requests. Use the new module configuration objects `search`, `timeseries`, and `probabilistic` instead.

#### Redis Query Engine deprecations

- Deprecated commands: `FT.ADD`, `FT.SAFEADD`, `FT.DEL`, `FT.GET`, `FT.MGET`, `FT.SYNADD`, `FT.DROP`, `FT._DROPIFX`, and `FT.CONFIG`.

- Deprecated `FT.SEARCH` options: `GEOFILTER`, `FILTER`, and `NOSTOPWORDS`.

- Deprecated vector search options: `INITIAL_CAP` and `BLOCK_SIZE`.

- Deprecated configuration parameters: `WORKER_THREADS`, `MT_MODE`, `PRIVILEGED_THREADS_NUM`, and `GCSCANSIZE`.

- Deprecated dialects: `DIALECT 1`, `DIALECT 3`, and `DIALECT 4`.

#### Internal monitoring and v1 Prometheus metrics deprecation

The existing [internal monitoring engine]({{<relref "/operate/rs/monitoring/v1_monitoring">}}) is deprecated. We recommend transitioning to the new [metrics stream engine]({{<relref "/operate/rs/monitoring/metrics_stream_engine">}}) for improved performance, enhanced integration capabilities, and modernized metrics streaming.

V1 Prometheus metrics are deprecated but still available. To transition to the new metrics stream engine, either migrate your existing dashboards using [this guide]({{<relref "/operate/rs/references/metrics/prometheus-metrics-v1-to-v2">}}) or use [new preconfigured dashboards]({{<relref "/operate/rs/monitoring/prometheus_and_grafana#v2-metrics-dashboards">}}).

As part of the transition to the metrics stream engine, some internal cluster manager alerts were deprecated in favor of external monitoring solutions. See the [alerts transition plan]({{<relref "/operate/rs/references/alerts/alerts-v1-to-v2">}}) for guidance.

### Supported platforms

The following table provides a snapshot of supported platforms as of this Redis Software release. See the [supported platforms reference]({{< relref "/operate/rs/references/supported-platforms" >}}) for more details about operating system compatibility.

<span title="Check mark icon">&#x2705;</span> Supported – The platform is supported for this version of Redis Enterprise Software and Redis Stack modules.

<span title="Warning icon" class="font-serif">:warning:</span> Deprecation warning – The platform is still supported for this version of Redis Enterprise Software, but support will be removed in a future release.

| Redis Software<br />major versions | 8.0 | 7.22 | 7.8 | 7.4 | 7.2 | 6.4 | 6.2 |
|---------------------------------|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|
| **Release date** | Oct 2025 | May 2025 | Nov 2024 | Feb 2024 | Aug 2023 | Feb 2023 | Aug 2021 |
| [**End-of-life date**]({{< relref "/operate/rs/installing-upgrading/product-lifecycle#endoflife-schedule" >}}) | Determined after<br />next major release | Oct 2027 | May 2027 | Nov 2026 | Feb 2026 | Aug 2025 | Feb 2025 |
| **Platforms** | | | | | | | |
| RHEL 9 &<br />compatible distros<sup>[1](#table-note-1)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – | – | – |
| RHEL 9<br />FIPS mode<sup>[5](#table-note-5)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – | – | – | – |
| RHEL 8 &<br />compatible distros<sup>[1](#table-note-1)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| RHEL 7 &<br />compatible distros<sup>[1](#table-note-1)</sup> | – | – | – | – | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Ubuntu 22.04<sup>[2](#table-note-2)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – | – | – | – |
| Ubuntu 20.04<sup>[2](#table-note-2)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – |
| Ubuntu 18.04<sup>[2](#table-note-2)</sup> | – | – | – | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Ubuntu 16.04<sup>[2](#table-note-2)</sup> | – | – | – | – | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Amazon Linux 2 | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – |
| Amazon Linux 1 | – | – | – | – | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Kubernetes<sup>[3](#table-note-3)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Docker<sup>[4](#table-note-4)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |

1. <a name="table-note-1"></a>The RHEL-compatible distributions CentOS, CentOS Stream, Alma, and Rocky are supported if they have full RHEL compatibility. Oracle Linux running the Red Hat Compatible Kernel (RHCK) is supported, but the Unbreakable Enterprise Kernel (UEK) is not supported.

2. <a name="table-note-2"></a>The server version of Ubuntu is recommended for production installations. The desktop version is only recommended for development deployments.

3. <a name="table-note-3"></a>See the [Redis Enterprise for Kubernetes documentation]({{< relref "/operate/kubernetes/reference/supported_k8s_distributions" >}}) for details about support per version and Kubernetes distribution.

4. <a name="table-note-4"></a>[Docker images]({{< relref "/operate/rs/installing-upgrading/quickstarts/docker-quickstart" >}}) of Redis Enterprise Software are certified for development and testing only.

5. <a name="table-note-5"></a>Supported only if [FIPS was enabled during RHEL installation](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/security_hardening/switching-rhel-to-fips-mode_security-hardening#proc_installing-the-system-with-fips-mode-enabled_switching-rhel-to-fips-mode) to ensure FIPS compliance.

## Known issues

- RS131972: Creating an ACL that contains a line break in the Cluster Manager UI can cause shard migration to fail due to ACL errors.

- RS155734: Endpoint availability metrics do not work as expected due to a calculation error.

## Known limitations

#### Rolling upgrade limitation for clusters with custom or deprecated modules

Due to module handling changes introduced in Redis Enterprise Software version 8.0, upgrading a cluster that contains custom or deprecated modules, such as RedisGraph and RedisGears v2, can become stuck when adding a new node to the cluster during a rolling upgrade.

#### Module commands limitation during Active-Active database upgrades to Redis 8.0

When upgrading an Active-Active database to Redis version 8.0, you cannot use module commands until all Active-Active database instances have been upgraded. Currently, these commands are not blocked automatically.

#### New Cluster Manager UI limitations

The following legacy UI features are not yet available in the new Cluster Manager UI:

- Purge an Active-Active instance.

    Use [`crdb-cli crdb purge-instance`]({{< relref "/operate/rs/references/cli-utilities/crdb-cli/crdb/purge-instance" >}}) instead.

- Search and export the log.
