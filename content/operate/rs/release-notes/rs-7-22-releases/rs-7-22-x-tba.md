---
Title: Redis Enterprise Software release notes 7.22.x-tba (April 2025)
alwaysopen: false
categories:
- docs
- operate
- rs
compatibleOSSVersion: Redis 7.4.0
description: Metrics stream engine GA. Diagnostic logging service. Revamp database API. Migration status API. Usage reports in support packages. Two-dimensional rack awareness. v2 actions API. Additional REST API enhancements.
linkTitle: 7.22.x-tba (April 2025)
weight: 90
---

​[​Redis Enterprise Software version 7.22.x](https://redis.io/downloads/#software) is now available!

## Highlights

This version offers:

- Metrics stream engine GA

- Diagnostic logging service

- Revamp database API

- Migration status API

- Usage reports in support packages

- Two-dimensional rack awareness

- v2 actions API

- Additional REST API enhancements

## New in this release

### New features

- The [metrics stream engine]({{<relref "/operate/rs/monitoring/metrics_stream_engine">}}) is now generally available.

- Diagnostic logging service:

    - New diagnostic logs for improved troubleshooting.

    - Diagnostic logs are enabled by default.

    - Logs are configurable using [REST API requests]({{<relref "/operate/rs/references/rest-api/requests/diagnostics">}}).

    - Logs have a predefined rotation and retention policy, which can be updated as needed.

    - JSON response format for easy integration with external logging tools.

- [Revamp database REST API requests]({{<relref "operate/rs/references/rest-api/requests/bdbs/actions/revamp">}}):

    - Updates topology-related configurations of an active database and optimises the shards placement for the new configuration. Example configuration parameters include `memory_size`, `shards_count`, `avoid_nodes`, `shards_placement`, `bigstore_ram_size`, and `replication`.

    - `PUT /v1/bdbs/<uid>/actions/revamp?dry_run=true` replaces the deprecated request to [optimize shards placement]({{<relref "/operate/rs/references/rest-api/requests/bdbs/actions/optimize_shards_placement">}}).

- [Migration status REST API request]({{<relref "/operate/rs/references/rest-api/requests/migrations">}}), which reports the migration status of a database in the cluster.

- [Support packages]({{<relref "/operate/rs/installing-upgrading/creating-support-package">}}) now include [usage reports]({{<relref "/operate/rs/references/rest-api/requests/usage_report">}}).

- Added `secondary_rack_id` to bootstrap and node configuration to support [two-dimensional rack awareness]({{<relref "/operate/rs/clusters/configure/rack-zone-awareness#set-up-two-dimensional-rack-zone-awareness">}}).

- A new version of the [actions API]({{<relref "/operate/rs/references/rest-api/requests/actions">}}) is available at `GET /v2/actions`.

### Enhancements

- REST API enhancements:

    - Adjusted the API to [get the database recovery plan]({{<relref "/operate/rs/references/rest-api/requests/bdbs/actions/recover#get-bdbs-actions-recover">}}) to only return the best persistence file per slot range for databases with `master_persistence` enabled.

    - A database's `maxclients` can now be configured with an [update database configuration]({{<relref "/operate/rs/references/rest-api/requests/bdbs#put-bdbs">}}) request.

    - Added `bigstore_version` to database configuration and `default_bigstore_version` to cluster settings.

    - Added `default_oss_cluster` to cluster settings.

    - Added `sentinel_service` as an optional service that can be enabled or turned off with an [update cluster services configuration]({{<relref "/operate/rs/references/rest-api/requests/cluster/services_configuration#put-cluster-services_config">}}) request.

    - Added `replica_read_only` to database configuration. If set to `true`, it enables an Active-Passive setup where Replica Of databases only allow read operations. `replica_read_only` is only configurable during [database creation]({{<relref "/operate/rs/references/rest-api/requests/bdbs#post-bdbs-v1">}}) and cannot be changed later.

    - Added `robust_crdt_syncer` to enable or turn off the robust syncer for Active-Active databases.

    - Added `incoming_connections_rate_limit`, `incoming_connections_capacity`, and `incoming_connections_min_capacity` to proxy configuration.

    - Added `client_eviction` to proxy configuration. If set to `true`, it enables client eviction based on `maxmemory_clients`.

    - The cluster's `logrotate_settings` can now be configured with an [update cluster configuration]({{<relref "/operate/rs/references/rest-api/requests/cluster#put-cluster">}}) request.

    - Added `multi_commands_opt` to cluster configuration and database configuration. If set to `batch`, it reduces the overhead of transaction management by batching multiple commands into a single transaction.

    - Added the following active defragmentation parameters to database configuration: `activedefrag`, `active_defrag_cycle_max`, `active_defrag_cycle_min`, `active_defrag_ignore_bytes`, `active_defrag_max_scan_fields`, `active_defrag_threshold_lower`, and `active_defrag_threshold_upper`.

    - Added an `original_bdb_shards` option for the `recovery_plan` specified in [`POST /v2/bdbs`]({{<relref "/operate/rs/references/rest-api/requests/bdbs#post-bdbs-v2">}}) requests to recover a database from the provided list of shards.

- Added module information to database creation log messages.

- Performance improvements for full-sync replication flows.

- Additional performance improvements:

    - Introduced proxy optimizations for single-sharded databases when a user sends a pipeline of commands. 

    - Enabled deeper default optimization levels on the proxy, namely O3 and link time optimization (LTO).

    - Introduced `redis-last` shard optimizations that improved overall baseline performance for `@fast` commands.

- Reserved the following ports:

    | Port | Process name | Usage | 
    |------|--------------|-------|
    | 3346 | authentication_service | Authentication service internal port |
    | 3351 | cluster_watchdog_grpc_api | Cluster watchdog now supports gRPC |
    | 9082 | cluster_api_internal | Cluster API internal port |

### Redis database versions

Redis Enterprise Software version 7.22.x includes three Redis database versions: 7.4, 7.2, and 6.2.

The [default Redis database version]({{<relref "/operate/rs/databases/configure/db-defaults#database-version">}}) is 7.4.

### Redis module feature sets

Redis Enterprise Software comes packaged with several modules. As of version 7.22.x, Redis Enterprise Software includes three feature sets, compatible with different Redis database versions.

The following table shows which Redis modules are compatible with each Redis database version included in this release.

| Redis database version | Compatible Redis modules |
|------------------------|--------------------------|
| 7.4 | [RediSearch 2.10]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisearch/redisearch-2.10-release-notes.md" >}})<br />[RedisJSON 2.8]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisjson/redisjson-2.8-release-notes.md" >}})<br />[RedisTimeSeries 1.12]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redistimeseries/redistimeseries-1.12-release-notes.md" >}})<br />[RedisBloom 2.8]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisbloom/redisbloom-2.8-release-notes.md" >}}) |
| 7.2 | [RediSearch 2.8]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisearch/redisearch-2.8-release-notes.md" >}})<br />[RedisJSON 2.6]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisjson/redisjson-2.6-release-notes.md" >}})<br />[RedisTimeSeries 1.10]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redistimeseries/redistimeseries-1.10-release-notes.md" >}})<br />[RedisBloom 2.6]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisbloom/redisbloom-2.6-release-notes.md" >}}) |
| 6.2 | [RediSearch 2.6]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisearch/redisearch-2.6-release-notes.md" >}})<br />[RedisJSON 2.4]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisjson/redisjson-2.4-release-notes.md" >}})<br />[RedisTimeSeries 1.8]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redistimeseries/redistimeseries-1.8-release-notes.md" >}})<br />[RedisBloom 2.4]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisbloom/redisbloom-2.4-release-notes.md" >}})  |

### Resolved issues

- RS134225: Fixed an issue where the server restart could fail during cluster upgrade due to a timeout.

- RS133342: Fixed an issue where too many API requests in the queue could cause new API requests to fail.

- RS125543: Changed slow log duration to milliseconds in the new Cluster Manager UI.

- RS142296: Fixed a REST API issue where updating an existing database with an empty module list removed modules from the database. Such requests now return an error instead.

- RS94080: Fixed `PUT /v1/bdbs/<id>/<action>` requests to allow `flush` and `reset_admin_pass` actions without requiring a request body.

- RS140649: Fixed an issue where database backups were not deleted at the expected time based on the configured retention period.

- RS136409: Improved checks to determine if the cluster is in an unstable state.

- RS122370: Changed Envoy concurrency to 4 by default to prevent an issue where Envoy on the primary node in a cluster with many nodes sometimes failed to receive API requests.

- RS107325: Fixed an issue where database recovery could get stuck due to shard UID conflicts.

- RS139699: Fixed an issue where the Cluster Manager UI reported "invalid username or password" if the connection timed out during a sign-in attempt.

- RS138625: Fixed an issue where `rlcheck` reported `verify_tcp_connectivity` as failed for optional services that were not enabled instead of skipping the check.

- RS134742: Fixed an issue where the `virbr0` interface was automatically added to the external addresses when nodes joined the cluster, which could cause network conflicts and connectivity issues due to duplicated IP addresses.

- RS138490: Reduced log entries for unbootstrapped nodes, which do not have log rotation scheduled yet, to prevent filling the disk with logs.

- RS123576: Fixed an issue that prevented reconfiguring an existing ACL file with `rlutil`.

- RS133679: Added a validation check to the optimize shards API to return quicker if the database cannot fit on the cluster.

- RS134968: Improved the functionality around killing shards.

- RS146096: Fixed an issue where the syncer could fail due to the RDB file parser incorrectly parsing least frequently used values larger than 127.

- RS125845: Fixed an issue where outdated AOF persistence files were not rotated upon upgrading the Redis database version from 6 to 7.

- RS147882: Fixed a `Failed to write PID file: Permission denied` error in `ccs-redis.log` by removing an unneeded CCS PID file.

- RS146941: Fixed an issue where `crdb-cli crdb get` failed with a `KeyError` when `replication_endpoint` or `replication_tls_sni` were not set for the Active-Active database.

- RS122668: Fixed an issue where new DMC workers created after a certificate update could still have the old certificate.

- RS141853: Optimized connection pool handling to reduce memory and CPU usage by `node_wd`.

- RS150853: Fixed an issue during RDB loading where replica shards sometimes terminated with the module error `no matching module type 'AAAAAAAAA'`.

- RS149480: Fixed an issue where port 9091 was missing from the reserved ports list returned by `rladmin` and `ccs-cli`.

- RS148075: Changed the default value of `gradual_sync_mode` to `enabled` for Replica Of databases to sync data from one shard at a time and reduce load on the destination.

- RS135446: Added cleanup of temporary files after `debug_info` generation failures.

- RS151534: Fixed a permissions issue for `crdb-cli.log` that caused `crdb-cli crdb list` to fail for users in the `redislabs` group.

- RS150746: Added a retry mechanism in case the DMC fails to create a listener on a database port.

- RS145047: Fixed an issue where repeated error messages were excessively logged when the auditing server was no longer reachable.

## Version changes

- The fully qualified domain name is now validated using the FQDN library instead of a regex during cluster creation.

### Deprecations

#### API deprecations

- Deprecated [`GET /v1/bdbs/<uid>/actions/optimize_shards_placement`]({{<relref "/operate/rs/references/rest-api/requests/bdbs/actions/optimize_shards_placement/#get-bdbs-actions-optimize-shards-placement">}}) REST API request. Use [`PUT /v1/bdbs/<uid>/actions/revamp?dry_run=true`]({{<relref "/operate/rs/references/rest-api/requests/bdbs/actions/revamp/#put-bdbs-actions-revamp">}}) to get an optimized shard placement blueprint for a database instead.

- Deprecated the `data_files` option for the `recovery_plan` specified in [`POST /v2/bdbs`]({{<relref "/operate/rs/references/rest-api/requests/bdbs#post-bdbs-v2">}}) requests. Use the new `original_bdb_shards` option to recover a database from the provided list of shards instead.

#### Internal monitoring and v1 Prometheus metrics deprecation

The existing [internal monitoring engine]({{<relref "/operate/rs/monitoring/v1_monitoring">}}) is deprecated. We recommend transitioning to the new [metrics stream engine]({{<relref "/operate/rs/monitoring/metrics_stream_engine">}}) for improved performance, enhanced integration capabilities, and modernized metrics streaming.

V1 Prometheus metrics are deprecated but still available. To transition to the new metrics stream engine, either migrate your existing dashboards using [this guide]({{<relref "/operate/rs/references/metrics/prometheus-metrics-v1-to-v2">}}) now, or wait to use new preconfigured dashboards when they become available in a future release.

### Supported platforms

The following table provides a snapshot of supported platforms as of this Redis Enterprise Software release. See the [supported platforms reference]({{< relref "/operate/rs/references/supported-platforms" >}}) for more details about operating system compatibility.

<span title="Check mark icon">&#x2705;</span> Supported – The platform is supported for this version of Redis Enterprise Software and Redis Stack modules.

<span title="Warning icon" class="font-serif">:warning:</span> Deprecation warning – The platform is still supported for this version of Redis Enterprise Software, but support will be removed in a future release.

| Redis Software<br />major versions | 7.22 | 7.8 | 7.4 | 7.2 | 6.4 | 6.2 |
|---------------------------------|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|
| **Release date** | Apr 2025 | Nov 2024 | Feb 2024 | Aug 2023 | Feb 2023 | Aug 2021 |
| [**End-of-life date**]({{< relref "/operate/rs/installing-upgrading/product-lifecycle#endoflife-schedule" >}}) | Determined after<br />next major release | Apr 2027 | Nov 2026 | Feb 2026 | Aug 2025 | Feb 2025 |
| **Platforms** | | | | | | |
| RHEL 9 &<br />compatible distros<sup>[1](#table-note-1)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – | – | – |
| RHEL 9<br />FIPS mode<sup>[5](#table-note-5)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – | – | – | – |
| RHEL 8 &<br />compatible distros<sup>[1](#table-note-1)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| RHEL 7 &<br />compatible distros<sup>[1](#table-note-1)</sup> | – | – | – | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Ubuntu 22.04<sup>[2](#table-note-2)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – | – | – | – |
| Ubuntu 20.04<sup>[2](#table-note-2)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – |
| Ubuntu 18.04<sup>[2](#table-note-2)</sup> | – | – | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Ubuntu 16.04<sup>[2](#table-note-2)</sup> | – | – | – | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Amazon Linux 2 | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – |
| Amazon Linux 1 | – | – | – | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Kubernetes<sup>[3](#table-note-3)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Docker<sup>[4](#table-note-4)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |

1. <a name="table-note-1"></a>The RHEL-compatible distributions CentOS, CentOS Stream, Alma, and Rocky are supported if they have full RHEL compatibility. Oracle Linux running the Red Hat Compatible Kernel (RHCK) is supported, but the Unbreakable Enterprise Kernel (UEK) is not supported.

2. <a name="table-note-2"></a>The server version of Ubuntu is recommended for production installations. The desktop version is only recommended for development deployments.

3. <a name="table-note-3"></a>See the [Redis Enterprise for Kubernetes documentation]({{< relref "/operate/kubernetes/reference/supported_k8s_distributions" >}}) for details about support per version and Kubernetes distribution.

4. <a name="table-note-4"></a>[Docker images]({{< relref "/operate/rs/installing-upgrading/quickstarts/docker-quickstart" >}}) of Redis Enterprise Software are certified for development and testing only.

5. <a name="table-note-5"></a>Supported only if [FIPS was enabled during RHEL installation](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/security_hardening/switching-rhel-to-fips-mode_security-hardening#proc_installing-the-system-with-fips-mode-enabled_switching-rhel-to-fips-mode) to ensure FIPS compliance.

## Downloads

The following table shows the SHA256 checksums for the available packages:

| Package | SHA256 checksum (7.22.x-tba April release) |
|---------|---------------------------------------|
| Ubuntu 20 | <span class="break-all"></span> |
| Ubuntu 22 | <span class="break-all"></span> |
| Red Hat Enterprise Linux (RHEL) 8 | <span class="break-all"></span> |
| Red Hat Enterprise Linux (RHEL) 9 | <span class="break-all"></span> |
| Amazon Linux 2 | <span class="break-all"></span> |

## Known issues

- RS131972: Creating an ACL that contains a line break in the Cluster Manager UI can cause shard migration to fail due to ACL errors.

- RS155734: Endpoint availability metrics do not work as expected due to a calculation error. As a workaround, use this query to measure availability:

    ```sh
    endpoint_server_became_unavailable{cluster="$cluster", db="$db"} 
    - 
    endpoint_server_available_again{cluster="$cluster", db="$db"}
    ```

    For up: 0-2

    For down: 2-1000000

## Known limitations

#### Upload modules before OS upgrade

If the cluster contains any databases that use modules, you must upload module packages for the target OS version to a node in the existing cluster before you upgrade the cluster's operating system.

See [Upgrade a cluster's operating system]({{<relref "/operate/rs/installing-upgrading/upgrading/upgrade-os">}}) for detailed upgrade instructions.

#### New Cluster Manager UI limitations

The following legacy UI features are not yet available in the new Cluster Manager UI:

- Purge an Active-Active instance.

    Use [`crdb-cli crdb purge-instance`]({{< relref "/operate/rs/references/cli-utilities/crdb-cli/crdb/purge-instance" >}}) instead.

- Search and export the log.

#### RedisGraph prevents upgrade to RHEL 9 

You cannot upgrade from a prior RHEL version to RHEL 9 if the Redis Enterprise Software cluster contains a RedisGraph module, even if unused by any database. The [RedisGraph module has reached End-of-Life](https://redis.com/blog/redisgraph-eol/) and is completely unavailable in RHEL 9.

#### Query results might include hash keys with lazily expired fields

If one or more fields of a hash key expire after an `FT.SEARCH` or `FT.AGGREGATE` query begins, Redis does not account for these lazily expired fields. As a result, keys with expired fields might still be included in the query results, leading to potentially incorrect or inconsistent results.

#### Active defragmentation does not stop mid-key for JSON

Active defragmentation does not stop mid-key for JSON data. Large keys are defragmented in full, which might cause latency spikes.

## Security

#### Open source Redis security fixes compatibility

As part of Redis's commitment to security, Redis Enterprise Software implements the latest [security fixes](https://github.com/redis/redis/releases) available with [open source Redis](https://github.com/redis/redis). Redis Enterprise Software has already included the fixes for the relevant CVEs.

Some CVEs announced for open source Redis do not affect Redis Enterprise Software due to different or additional functionality available in Redis Enterprise Software that is not available in open source Redis.

Redis Enterprise Software 7.22.x-tba supports open source Redis 7.4, 7.2, and 6.2. Below is the list of open source Redis CVEs fixed by version.

Redis 7.2.x:

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
