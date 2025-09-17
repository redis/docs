---
Title: Redis Enterprise Software release notes 8.0.0-tba (September 2025)
alwaysopen: false
categories:
- docs
- operate
- rs
compatibleOSSVersion: Redis 7.4.0
description: Redis Open Source 8.0 and 8.2 features. Lag-aware availability API. Metrics stream engine GA.
linkTitle: 8.0.0-tba (September 2025)
weight: 90
---

​[​Redis Enterprise Software version 8.0.0](https://redis.io/downloads/#software) is now available!

## Highlights

This version offers:

- Redis Open Source 8.0 and 8.2 features

- Lag-aware availability API

- Metrics stream engine GA

## New in this release

### New features

#### Redis Open Source 8.0 and 8.2 features

Redis Open Source 8.0 and 8.2 features are now available when you [create]({{<relref "/operate/rs/databases/create">}}) or [upgrade]({{<relref "/operate/rs/installing-upgrading/upgrading/upgrade-database">}}) a database with database version 8.2.

##### Redis Open Source 8.0 features and enhancements

- Preview of a new [vector set]({{<relref "/develop/data-types/vector-sets">}}) data structure that supports high-dimensional vector similarity search, ideal for AI use cases such as semantic search and recommendation systems.

- New hash commands [`HGETEX`]({{<relref "/commands/hgetex">}}), [`HSETEX`]({{<relref "/commands/hsetex">}}), and [`HGETDEL`]({{<relref "/commands/hgetdel">}}), which can simplify caching and session management patterns.

- Enhanced access control lists (ACLs) to support new data structures introduced in Redis 8.

    - Existing ACL categories such as `@read` and `@write` now include commands for JSON, time series, vector, and probabilistic data structures.

    - New ACL categories: `@search`, `@json`, `@timeseries`, `@bloom`, `@cuckoo`, `@topk`, `@cms`, and `@tdigest`.

- Redis Query Engine improvements.

- Significant performance improvements, including:

    - Up to 87% lower command latency.

    - 35% memory savings for replica nodes.

    - 16x more query processing capacity with horizontal and vertical scaling.

- See [What's new in Redis 8.0]({{<relref "/develop/whats-new/8-0">}}) and [Redis Open Source 8.0 release notes]({{<relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisce/redisos-8.0-release-notes">}}) for more details.

##### Redis Open Source 8.2 features and enhancements

- New Redis streams commands [`XDELEX`]({{<relref "/commands/xdelex">}}) and [`XACKDEL`]({{<relref "/commands/xackdel">}}) that simplify consumer group management and stream lifecycle operations.

- New operators `DIFF`, `DIFF1`, `ANDOR`, and `ONE` for the [`BITOP`]({{<relref "/commands/bitop">}}) command, which enable more complex bitmap workflows and can simplify operations that previously required multiple commands.

- New keyspace notification event types `OVERWRITTEN` and `TYPE_CHANGED` that provide better visibility into data changes.

- Performance optimizations and memory efficiency improvements.

- See [What's new in Redis 8.2]({{<relref "/develop/whats-new/8-2">}}) and [Redis Open Source 8.2 release notes]({{<relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisce/redisos-8.2-release-notes">}}) for more details.

#### Automatically enabled capabilities in Redis 8

Redis Enterprise Software databases created with or upgraded to Redis version 8 or later automatically enable the capabilities (modules) bundled with Redis Enterprise Software as follows:

| Database type | Automatically enabled capabilities |
|---------------|------------------------------------|
| RAM-only | [Search and query]({{<relref "/operate/oss_and_stack/stack-with-enterprise/search">}})<br />[JSON]({{<relref "/operate/oss_and_stack/stack-with-enterprise/json">}})<br />[Time series]({{<relref "/operate/oss_and_stack/stack-with-enterprise/timeseries">}})<br />[Probabilistic]({{<relref "/operate/oss_and_stack/stack-with-enterprise/bloom">}})  |
| Flash-enabled ([Auto Tiering]({{<relref "/operate/rs/databases/auto-tiering">}})) | [JSON]({{<relref "/operate/oss_and_stack/stack-with-enterprise/json">}})<br />[Probabilistic]({{<relref "/operate/oss_and_stack/stack-with-enterprise/bloom">}}) |
| [Active-Active]({{<relref "/operate/rs/databases/active-active">}}) | [Search and query]({{<relref "/operate/oss_and_stack/stack-with-enterprise/search/search-active-active">}})<br />[JSON]({{<relref "/operate/oss_and_stack/stack-with-enterprise/json">}}) |

#### Lag-aware availability API

The [database availability API]({{<relref "/operate/rs/references/rest-api/requests/bdbs/availability">}}) now supports lag-aware availability checks that consider replication lag tolerance.

You can reduce the risk of data inconsistencies during disaster recovery by incorporating lag-aware availability checks into your disaster recovery solution and ensuring failover-failback flows only occur when databases are accessible and sufficiently synchronized.

The lag tolerance threshold is 100 milliseconds by default. Depending on factors such as workload, network conditions, and  throughput, you might want to adjust the lag tolerance threshold using one of the following methods:

- Change the default threshold for the entire cluster by setting `availability_lag_tolerance_ms` with an [update cluster]({{<relref "/operate/rs/references/rest-api/requests/cluster#put-cluster">}}) request.

- Override the default threshold by adding the `availability_lag_tolerance_ms` query parameter to specific lag-aware [availability checks]({{<relref "/operate/rs/references/rest-api/requests/bdbs/availability">}}). For example:

    ```sh
    GET /v1/bdbs/<database_id>/availability?extend_check=lag&availability_lag_tolerance_ms=100
    ```

For more details, see [Check database availability for monitoring and load balancers]({{<relref "/operate/rs/monitoring/db-availability">}}).

#### Metrics stream engine GA

The [metrics stream engine]({{<relref "/operate/rs/monitoring/metrics_stream_engine">}}) is now generally available:

- The metrics stream engine's exporter-based infrastructure provides access to more accurate, real-time data. This enhanced, scalable monitoring system allows you to set up more effective alerts and respond to issues faster.

- Exposes a new `/v2` Prometheus scraping endpoint that you can use to export metrics to external monitoring tools such as Grafana, DataDog, NewRelic, and Dynatrace.

- Exports raw data instead of aggregated data to improve monitoring at scale and accuracy compared to v1 Prometheus metrics.

- For a list of metrics exported by the metrics stream engine, see [Prometheus metrics v2]({{<relref "/operate/rs/references/metrics/prometheus-metrics-v2">}}).

- To transition to the metrics stream engine, either migrate your existing dashboards using [Prometheus v1 metrics and equivalent v2 PromQL]({{<relref "/operate/rs/references/metrics/prometheus-metrics-v1-to-v2">}}), or use new preconfigured dashboards when they become available.

### Enhancements

- Module management enhancements:

    - Operating system (OS) upgrades no longer require manually uploading module packages compiled for the target OS version to a node in the existing cluster.

    - Copying module packages to a node in the cluster before cluster recovery is no longer required.

    - Added new REST API requests to manage custom, user-defined modules. See [Custom module management APIs]({{<relref "/operate/rs/references/rest-api/requests/modules/user-defined">}}) for details.

    - Added module configuration fields to the database configuration. Use `search`, `timeseries`, and `probabilistic` objects to configure Redis modules instead of the deprecated `module_args` field. These fields are visible in [`GET /v1/bdbs`]({{<relref "/operate/rs/references/rest-api/requests/bdbs">}}) requests only when using the `extended=true` query parameter.

    - Added `--update-db-config-modules` option to the [`crdb-cli crdb update`]({{<relref "/operate/rs/references/cli-utilities/crdb-cli/update">}}) command to streamline updating module information in the CRDB configuration after uprading modules used by Active-Active databases. Use this option only after all CRDB database instances have upgraded their modules.

        ```sh
        crdb-cli crdb update --crdb-guid <guid> --update-db-config-modules true
        ```

- Additional REST API enhancements:

    - Added `replica_sconns_on_demand` to the database configuration. When enabled, the DMC stops holding persistent connections to replica shards and reduces the number of internode connections by half.

    - Added `conns_minimum_dedicated` to the database configuration to define the minimum number of dedicated server connections the DMC maintains per worker per shard.

- Added action IDs to operation and state machine log entries.

- Internal connections no longer generate `new_int_conn` audit records.

- Improved control plane authentication handling for new clusters with a dedicated authentication service.

- Improved handling of long-running read-only scripts to reduce unnecessary failovers.

### Redis database versions

Redis Enterprise Software version 8.0.0 includes four Redis database versions: 8.2, 7.4, 7.2, and 6.2.

The [default Redis database version]({{<relref "/operate/rs/databases/configure/db-defaults#database-version">}}) is 8.2.

### Redis feature sets

As of version 8.0.0, Redis Enterprise Software includes four feature sets, compatible with different Redis database versions.

The following table shows which Redis modules are compatible with each Redis database version included in this release.

| Redis database version | Compatible Redis modules |
|------------------------|--------------------------|
| 8.2 | TBA? |
| 7.4 | [RediSearch 2.10]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisearch/redisearch-2.10-release-notes.md" >}})<br />[RedisJSON 2.8]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisjson/redisjson-2.8-release-notes.md" >}})<br />[RedisTimeSeries 1.12]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redistimeseries/redistimeseries-1.12-release-notes.md" >}})<br />[RedisBloom 2.8]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisbloom/redisbloom-2.8-release-notes.md" >}}) |
| 7.2 | [RediSearch 2.8]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisearch/redisearch-2.8-release-notes.md" >}})<br />[RedisJSON 2.6]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisjson/redisjson-2.6-release-notes.md" >}})<br />[RedisTimeSeries 1.10]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redistimeseries/redistimeseries-1.10-release-notes.md" >}})<br />[RedisBloom 2.6]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisbloom/redisbloom-2.6-release-notes.md" >}}) |
| 6.2 | [RediSearch 2.6]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisearch/redisearch-2.6-release-notes.md" >}})<br />[RedisJSON 2.4]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisjson/redisjson-2.4-release-notes.md" >}})<br />[RedisTimeSeries 1.8]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redistimeseries/redistimeseries-1.8-release-notes.md" >}})<br />[RedisBloom 2.4]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisbloom/redisbloom-2.4-release-notes.md" >}})<br />[RedisGraph v2.10]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisgraph/redisgraph-2.10-release-notes.md" >}})<sup>[1](#module-note-1)</sup>  |

1. <a name="module-note-1"></a>RedisGraph end-of-life has been announced and will be removed in a future release. See the [RedisGraph end-of-life announcement](https://redis.io/blog/redisgraph-eol/) for more details.

### Resolved issues

- RS156391: Fixed an issue where the `job_scheduler`'s memory usage could increase significantly when the diagnostic logging service was enabled.

- RS132033: Fixed an issue where out-of-memory errors in the Lua interpreter prevented scripts from running Redis commands until the shard was restarted. This fix is included in Redis database version 7.2 and requires a database upgrade from earlier versions.

- RS153192: Updated the installer's minimum RAM requirement to 8 GB.

- RS159685: Fixed an issue with high DMC CPU usage after changing the primary node of a cluster that has Active-Active databases.

- RS160546: Fixed an issue where `rladmin status extra all` did not show available RAM.

- RS150592: Fixed an issue where connection errors were not automatically retried.

- RS161945: Fixed an issue where state machine logs showed a generic state machine ID instead of the descriptive state machine name when creating a database from persistence.

- RS160196: Fixed an issue where a node could be set as primary before completing the bootstrap process.

- RS153736: Fixed an issue where the `PUBSUB SHARDNUMSUB` command would not respond when called without arguments if the OSS Cluster API was enabled.

- RS163254: Fixed an issue where the policy update logs displayed inconsistent boolean value formats, mixing `enabled/disabled` and `True/False`.

- RS158250: Fixed an issue with Active-Active databases with search enabled where replica shards could crash after migration to a new node.

- RS164471: Fixed an issue where the script to generate self-signed certificate (generate_self_signed_certs.sh) failed on custom installations due to hard-coded file paths.

- RS164218: Fixed an issue where Speedb log files were not properly rotated and archived, causing logs to accumulate and consume disk space.

- RS162719: Fixed an issue where connection problems could prevent shards from restarting during failover and cause the failover process to become stuck.

- RS161589: Changed the installer answers file parameter from `skip_updating_env_path` to `update_env_path` to improve clarity and accuracy.

- RS161574: Fixed an issue where Active-Active database synchronization could fail when Lua scripts used certain read-only commands that accessed keys across multiple slots.

- RS160347: Made optimizations to reduce the `heartbeatd` service's memory usage.

- RS156394: Improved error messages when module commands are temporarily unavailable during cluster configuration changes.

- RS154815: Improved diagnostic reporting for connection issues when the maximum number of transactions is reached.

- RS147053: Fixed an issue where some `system_reserved_ports` were not displayed in the `rladmin info cluster` command output.

- RS114668: Fixed an issue where setting `failure_detection_sensitivity` with the `bootstrap` API did not automatically update `watchdog_profile` accordingly.

- RS163266: Fixed an issue where shard rebalancing could take excessive time when replicas were unresponsive due to high CPU load by reducing connection retry attempts from 300 to 5.

- RS162524: Fixed an issue where the DNS backend could fail with "too many open files" errors due to socket leaks.

- RS161547: Fixed an issue where nodes could fail to send messages related to state-machines due to a timing issue between notification threads and management threads.

- RS155990: Fixed an issue where the `forwarding_state` field was missing from the endpoint schema.

- RS166307: Updated v2 Prometheus metric names to comply with naming conventions by changing the `proxy_` prefix to `endpoint_` for `connections_rate`, `rate_limit_ok`, `rate_limit_overflows`, `accepted_connections`, and `dispatch_failures`.

- RS164703: Improved diagnostic reporting for shard restart operations by adding PID logging before shutdown.

- RS152179: Reduced log noise by removing a harmless error message that appeared repeatedly in DMC proxy logs.

- RS132087: Fixed inconsistent node status reports between `rladmin` and the REST API.

- RS166878: Fixed legacy `module_args` mapping to handle boolean fields as `TRUE/FALSE` values instead of flags.

- RS166825: Fixed an issue where the Sentinel service could become unresponsive while processing certain commands due to a timing issue.

## Version changes

- [`POST /v1/cluster/actions/change_master`]({{<relref "/operate/rs/references/rest-api/requests/cluster/actions#post-cluster-action">}}) REST API requests will no longer allow a node that exists but is not finished bootstrapping to become the primary node. Such requests will now return the status code `406 Not Acceptable`.

### Breaking changes

Redis Enterprise Software version 8.0.0 introduces the following breaking changes:

- TBA

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

Redis Query Engine deprecations:

- Deprecated commands: `FT.ADD`, `FT.SAFEADD`, `FT.DEL`, `FT.GET`, `FT.MGET`, `FT.SYNADD`, `FT.DROP`, `FT._DROPIFX`, and `FT.CONFIG`.

- Deprecated `FT.SEARCH` options: `GEOFILTER`, `FILTER`, and `NOSTOPWORDS`.

- Deprecated vector search options: `INITIAL_CAP` and `BLOCK_SIZE`.

- Deprecated configuration parameters: `WORKER_THREADS`, `MT_MODE`, `PRIVILEGED_THREADS_NUM`, and `GCSCANSIZE`.

- Deprecated dialects: `DIALECT 1`, `DIALECT 3`, and `DIALECT 4`.

### Product lifecycle updates

- TBA

### Deprecations

#### API deprecations

- Deprecated the `policy` field for [bootstrap]({{<relref "/operate/rs/references/rest-api/requests/bootstrap">}}) REST API requests. Use [`PUT /v1/cluster/policy`]({{< relref "/operate/rs/references/rest-api/requests/cluster/policy#put-cluster-policy" >}}) to change cluster policies after cluster creation instead.

- Deprecated the `module_args` field for [database]({{<relref "/operate/rs/references/rest-api/requests/bdbs">}}) REST API requests. Use the new module configuration objects `search`, `timeseries`, and `probabilistic` instead.

#### Internal monitoring and v1 Prometheus metrics deprecation

The existing [internal monitoring engine]({{<relref "/operate/rs/monitoring/v1_monitoring">}}) is deprecated. We recommend transitioning to the new [metrics stream engine]({{<relref "/operate/rs/monitoring/metrics_stream_engine">}}) for improved performance, enhanced integration capabilities, and modernized metrics streaming.

V1 Prometheus metrics are deprecated but still available. To transition to the new metrics stream engine, either migrate your existing dashboards using [this guide]({{<relref "/operate/rs/references/metrics/prometheus-metrics-v1-to-v2">}}) now, or wait to use new preconfigured dashboards when they become available in a future release.

### Upcoming changes

- TBA

### Supported platforms

The following table provides a snapshot of supported platforms as of this Redis Enterprise Software release. See the [supported platforms reference]({{< relref "/operate/rs/references/supported-platforms" >}}) for more details about operating system compatibility.

<span title="Check mark icon">&#x2705;</span> Supported – The platform is supported for this version of Redis Enterprise Software and Redis Stack modules.

<span title="Warning icon" class="font-serif">:warning:</span> Deprecation warning – The platform is still supported for this version of Redis Enterprise Software, but support will be removed in a future release.

| Redis Software<br />major versions | 8.0 | 7.22 | 7.8 | 7.4 | 7.2 | 6.4 | 6.2 |
|---------------------------------|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|
| **Release date** | Sept 2025 | May 2025 | Nov 2024 | Feb 2024 | Aug 2023 | Feb 2023 | Aug 2021 |
| [**End-of-life date**]({{< relref "/operate/rs/installing-upgrading/product-lifecycle#endoflife-schedule" >}}) | Determined after<br />next major release | Sept 2027 | May 2027 | Nov 2026 | Feb 2026 | Aug 2025 | Feb 2025 |
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

## Downloads

The following table shows the SHA256 checksums for the available packages:

| Package | SHA256 checksum (8.0-tba September release) |
|---------|---------------------------------------|
| Ubuntu 20 | <span class="break-all"></span> |
| Ubuntu 22 | <span class="break-all"></span> |
| Red Hat Enterprise Linux (RHEL) 8 | <span class="break-all"></span> |
| Red Hat Enterprise Linux (RHEL) 9 | <span class="break-all"></span> |
| Amazon Linux 2 | <span class="break-all"></span> |

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

## Security

#### Open source Redis security fixes compatibility

As part of Redis's commitment to security, Redis Enterprise Software implements the latest [security fixes](https://github.com/redis/redis/releases) available with [open source Redis](https://github.com/redis/redis). Redis Enterprise Software has already included the fixes for the relevant CVEs.

Some CVEs announced for open source Redis do not affect Redis Enterprise Software due to different or additional functionality available in Redis Enterprise Software that is not available in open source Redis.

Redis Enterprise Software 8.0.0-tba supports open source Redis 8.2, 7.4, 7.2, and 6.2. Below is the list of open source Redis CVEs fixed by version.

Redis 7.4.x:

- (CVE-2025-32023) An authenticated user can use a specially crafted string to trigger a stack/heap out-of-bounds write on HyperLogLog operations, which can lead to remote code execution.

- (CVE-2025-21605) An unauthenticated client can cause unlimited growth of output buffers until the server runs out of memory or is terminated, which can lead to denial-of-service.

Redis 7.2.x:

- (CVE-2025-32023) An authenticated user can use a specially crafted string to trigger a stack/heap out-of-bounds write on HyperLogLog operations, which can lead to remote code execution.

- (CVE-2025-21605) An unauthenticated client can cause unlimited growth of output buffers until the server runs out of memory or is terminated, which can lead to denial-of-service.

- (CVE-2024-31449) An authenticated user may use a specially crafted Lua script to trigger a stack buffer overflow in the bit library, which may potentially lead to remote code execution.

- (CVE-2024-31228) An authenticated user can trigger a denial-of-service by using specially crafted, long string match patterns on supported commands such as `KEYS`, `SCAN`, `PSUBSCRIBE`, `FUNCTION LIST`, `COMMAND LIST`, and ACL definitions. Matching of extremely long patterns may result in unbounded recursion, leading to stack overflow and process crashes.

- (CVE-2023-41056) In some cases, Redis may incorrectly handle resizing of memory buffers, which can result in incorrect accounting of buffer sizes and lead to heap overflow and potential remote code execution.

- (CVE-2023-41053) Redis does not correctly identify keys accessed by `SORT_RO` and, as a result, may grant users executing this command access to keys that are not explicitly authorized by the ACL configuration. (Redis 7.2.1)

Redis 7.0.x:

- (CVE-2024-31449) An authenticated user may use a specially crafted Lua script to trigger a stack buffer overflow in the bit library, which may potentially lead to remote code execution.

- (CVE-2024-31228) An authenticated user can trigger a denial-of-service by using specially crafted, long string match patterns on supported commands such as `KEYS`, `SCAN`, `PSUBSCRIBE`, `FUNCTION LIST`, `COMMAND LIST`, and ACL definitions. Matching of extremely long patterns may result in unbounded recursion, leading to stack overflow and process crashes.

- (CVE-2023-41056) In some cases, Redis may incorrectly handle resizing of memory buffers, which can result in incorrect accounting of buffer sizes and lead to heap overflow and potential remote code execution.

- (CVE-2023-41053) Redis does not correctly identify keys accessed by `SORT_RO` and, as a result, may grant users executing this command access to keys that are not explicitly authorized by the ACL configuration. (Redis 7.0.13)

- (CVE-2023-36824) Extracting key names from a command and a list of arguments may, in some cases, trigger a heap overflow and result in reading random heap memory, heap corruption, and potentially remote code execution. Specifically: using `COMMAND GETKEYS*` and validation of key names in ACL rules. (Redis 7.0.12)

- (CVE-2023-28856) Authenticated users can use the `HINCRBYFLOAT` command to create an invalid hash field that will crash Redis on access. (Redis 7.0.11)

- (CVE-2023-28425) Specially crafted `MSETNX` commands can lead to assertion and denial-of-service. (Redis 7.0.10)

- (CVE-2023-25155) Specially crafted `SRANDMEMBER`, `ZRANDMEMBER`, and `HRANDFIELD` commands can trigger an integer overflow, resulting in a runtime assertion and termination of the Redis server process. (Redis 7.0.9)

- (CVE-2023-22458) Integer overflow in the Redis `HRANDFIELD` and `ZRANDMEMBER` commands can lead to denial-of-service. (Redis 7.0.8)

- (CVE-2022-36021) String matching commands (like `SCAN` or `KEYS`) with a specially crafted pattern to trigger a denial-of-service attack on Redis can cause it to hang and consume 100% CPU time. (Redis 7.0.9)

- (CVE-2022-35977) Integer overflow in the Redis `SETRANGE` and `SORT`/`SORT_RO` commands can drive Redis to OOM panic. (Redis 7.0.8)

- (CVE-2022-35951) Executing an `XAUTOCLAIM` command on a stream key in a specific state, with a specially crafted `COUNT` argument, may cause an integer overflow, a subsequent heap overflow, and potentially lead to remote code execution. The problem affects Redis versions 7.0.0 or newer. (Redis 7.0.5)

- (CVE-2022-31144) A specially crafted `XAUTOCLAIM` command on a stream key in a specific state may result in heap overflow and potentially remote code execution. The problem affects Redis versions 7.0.0 or newer. (Redis 7.0.4)

- (CVE-2022-24834) A specially crafted Lua script executing in Redis can trigger a heap overflow in the cjson and cmsgpack libraries, and result in heap corruption and potentially remote code execution. The problem exists in all versions of Redis with Lua scripting support, starting from 2.6, and affects only authenticated and authorized users. (Redis 7.0.12)

- (CVE-2022-24736) An attacker attempting to load a specially crafted Lua script can cause NULL pointer dereference which will result in a crash of the `redis-server` process. This issue affects all versions of Redis. (Redis 7.0.0)

- (CVE-2022-24735) By exploiting weaknesses in the Lua script execution environment, an attacker with access to Redis can inject Lua code that will execute with the (potentially higher) privileges of another Redis user. (Redis 7.0.0)

Redis 6.2.x:

- (CVE-2025-32023) An authenticated user can use a specially crafted string to trigger a stack/heap out-of-bounds write on HyperLogLog operations, which can lead to remote code execution.

- (CVE-2025-21605) An unauthenticated client can cause unlimited growth of output buffers until the server runs out of memory or is terminated, which can lead to denial-of-service.

- (CVE-2024-31449) An authenticated user may use a specially crafted Lua script to trigger a stack buffer overflow in the bit library, which may potentially lead to remote code execution.

- (CVE-2024-31228) An authenticated user can trigger a denial-of-service by using specially crafted, long string match patterns on supported commands such as `KEYS`, `SCAN`, `PSUBSCRIBE`, `FUNCTION LIST`, `COMMAND LIST`, and ACL definitions. Matching of extremely long patterns may result in unbounded recursion, leading to stack overflow and process crashes.

- (CVE-2023-28856) Authenticated users can use the `HINCRBYFLOAT` command to create an invalid hash field that will crash Redis on access. (Redis 6.2.12)

- (CVE-2023-25155) Specially crafted `SRANDMEMBER`, `ZRANDMEMBER`, and `HRANDFIELD` commands can trigger an integer overflow, resulting in a runtime assertion and termination of the Redis server process. (Redis 6.2.11)

- (CVE-2023-22458) Integer overflow in the Redis `HRANDFIELD` and `ZRANDMEMBER` commands can lead to denial-of-service. (Redis 6.2.9)

- (CVE-2022-36021) String matching commands (like `SCAN` or `KEYS`) with a specially crafted pattern to trigger a denial-of-service attack on Redis can cause it to hang and consume 100% CPU time. (Redis 6.2.11)

- (CVE-2022-35977) Integer overflow in the Redis `SETRANGE` and `SORT`/`SORT_RO` commands can drive Redis to OOM panic. (Redis 6.2.9)

- (CVE-2022-24834) A specially crafted Lua script executing in Redis can trigger a heap overflow in the cjson and cmsgpack libraries, and result in heap corruption and potentially remote code execution. The problem exists in all versions of Redis with Lua scripting support, starting from 2.6, and affects only authenticated and authorized users. (Redis 6.2.13)

- (CVE-2022-24736) An attacker attempting to load a specially crafted Lua script can cause NULL pointer dereference which will result in a crash of the `redis-server` process. This issue affects all versions of Redis. (Redis 6.2.7)

- (CVE-2022-24735) By exploiting weaknesses in the Lua script execution environment, an attacker with access to Redis can inject Lua code that will execute with the (potentially higher) privileges of another Redis user. (Redis 6.2.7)

- (CVE-2021-41099) Integer to heap buffer overflow handling certain string commands and network payloads, when `proto-max-bulk-len` is manually configured to a non-default, very large value. (Redis 6.2.6)

- (CVE-2021-32762) Integer to heap buffer overflow issue in `redis-cli` and `redis-sentinel` parsing large multi-bulk replies on some older and less common platforms. (Redis 6.2.6)

- (CVE-2021-32761) An integer overflow bug in Redis version 2.2 or newer can be exploited using the `BITFIELD` command to corrupt the heap and potentially result with remote code execution. (Redis 6.2.5)

- (CVE-2021-32687) Integer to heap buffer overflow with intsets, when `set-max-intset-entries` is manually configured to a non-default, very large value. (Redis 6.2.6)

- (CVE-2021-32675) Denial Of Service when processing RESP request payloads with a large number of elements on many connections. (Redis 6.2.6)

- (CVE-2021-32672) Random heap reading issue with Lua Debugger. (Redis 6.2.6)

- (CVE-2021-32628) Integer to heap buffer overflow handling ziplist-encoded data types, when configuring a large, non-default value for `hash-max-ziplist-entries`, `hash-max-ziplist-value`, `zset-max-ziplist-entries` or `zset-max-ziplist-value`. (Redis 6.2.6)

- (CVE-2021-32627) Integer to heap buffer overflow issue with streams, when configuring a non-default, large value for `proto-max-bulk-len` and `client-query-buffer-limit`. (Redis 6.2.6)

- (CVE-2021-32626) Specially crafted Lua scripts may result with Heap buffer overflow. (Redis 6.2.6)

- (CVE-2021-32625) An integer overflow bug in Redis version 6.0 or newer can be exploited using the STRALGO LCS command to corrupt the heap and potentially result with remote code execution. This is a result of an incomplete fix by CVE-2021-29477. (Redis 6.2.4)

- (CVE-2021-29478) An integer overflow bug in Redis 6.2 could be exploited to corrupt the heap and potentially result with remote code execution. The vulnerability involves changing the default set-max-intset-entries configuration value, creating a large set key that consists of integer values and using the COPY command to duplicate it. The integer overflow bug exists in all versions of Redis starting with 2.6, where it could result with a corrupted RDB or DUMP payload, but not exploited through COPY (which did not exist before 6.2). (Redis 6.2.3)

- (CVE-2021-29477) An integer overflow bug in Redis version 6.0 or newer could be exploited using the STRALGO LCS command to corrupt the heap and potentially result in remote code execution. The integer overflow bug exists in all versions of Redis starting with 6.0. (Redis 6.2.3)
