---
Title: Redis Enterprise Software release notes 8.0.10-tba (January 2026)
alwaysopen: false
categories:
- docs
- operate
- rs
compatibleOSSVersion: Redis 8.4.0, 8.2.1, 8.0.2, 7.4.3, 7.2.7, 6.2.13
description: Redis 8.4 feature set and enhancements. ARM support for RHEL 9 and Ubuntu 22.04. Redis Flex operational optimizations during maintenance, scaling, full sync, and shard migration.
linkTitle: 8.0.10-tba (January 2026)
weight: 88
---

​[​Redis Enterprise Software version 8.0.6](https://redis.io/downloads/#Redis_Software) is now available! This release includes API enhancements that warranted a new minor version instead of a maintenance release for version 8.0.6. However, you can upgrade from 8.0.2 or 8.0.6 to 8.0.10 without issue.

## Highlights

This version offers:

- Redis 8.4 feature set and enhancements

- ARM support for RHEL 9 and Ubuntu 22.04

- Redis Flex operational optimizations during maintenance, scaling, full sync, and shard migration

## New in this release

### New features

#### Redis 8.4 feature set and enhancements

The Redis 8.4 feature set is now available when you [create]({{<relref "/operate/rs/databases/create">}}) or [upgrade]({{<relref "/operate/rs/installing-upgrading/upgrading/upgrade-database">}}) a database with database version 8.4.

Redis 8.4 builds on the foundation of Redis 8.2 with significant enhancements to cluster operations, string manipulation, and stream processing capabilities.

This release delivers major improvements across multiple areas:

- Enhanced string operations with atomic compare-and-set functionality

- Advanced stream processing with idle entry claiming

- Hybrid search capabilities combining multiple ranking algorithms

- High-performance SIMD optimizations for bit operations and vector processing

- Improved JSON handling with better memory efficiency

- See [What's new in Redis 8.4]({{<relref "/develop/whats-new/8-4">}}) and [Redis Open Source 8.4 release notes]({{<relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisce/redisos-8.4-release-notes">}}) for more details.

#### Redis Flex operational optimizations 

Redis Flex databases running on Redis 8.4 have major operational optimizations:

- Scaling is 2x faster, cutting the duration of scaling in half.

- A new internal replication mechanism:

    - Enables 10x faster full sync operations, where an entire shard is replicated across nodes. Operations such as maintenance, shard migration, recovery from node failure, and upgrades are now up to 10x faster than before.

    - Enables shorter copy-on-write (CoW), which lowers peak memory usage, reduces latency jitter, and improves write throughput during persistence.

#### ARM support for RHEL 9 and Ubuntu 22.04

Redis Enterprise Software now supports ARM architecture on RHEL 9 and Ubuntu 22.04, enabling deployments on cost-efficient, high-performance ARM-based servers.

### Enhancements

- Added support for database name labels in v2 metrics when the `metrics_exporter_expose_bdb_name` cluster policy setting is enabled:

    ```sh
    PUT /v1/cluster/policy
    { "metrics_exporter_expose_bdb_name": true }
    ```

- Added `node_wd` v2 metrics for monitoring the health of shards, the DMC, and endpoints.

### Redis database versions

Redis Enterprise Software version 8.0.10 includes the following Redis database versions: 8.4.0, 8.2.1, 8.0.2, 7.4.3, 7.2.7, and 6.2.13.

The [default Redis database version]({{<relref "/operate/rs/databases/configure/db-defaults#database-version">}}) is 8.4.

### Redis feature sets

Redis Enterprise Software includes multiple feature sets, compatible with different Redis database versions.

The following table shows which Redis modules are compatible with each Redis database version included in this release.

| Redis database version | Compatible Redis modules |
|------------------------|--------------------------|
| 8.4 | RediSearch 8.4<br />RedisJSON 8.4<br />RedisTimeSeries 8.4<br />RedisBloom 8.4<br />See [What's new in Redis 8.4]({{<relref "/develop/whats-new/8-4">}}) and [Redis Open Source 8.4 release notes]({{<relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisce/redisos-8.4-release-notes">}}) |
| 8.2 | RediSearch 8.2<br />RedisJSON 8.2<br />RedisTimeSeries 8.2<br />RedisBloom 8.2<br />See [What's new in Redis 8.2]({{<relref "/develop/whats-new/8-2">}}) and [Redis Open Source 8.2 release notes]({{<relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisce/redisos-8.2-release-notes">}}) |
| 8.0 | RediSearch 8.0<br />RedisJSON 8.0<br />RedisTimeSeries 8.0<br />RedisBloom 8.0<br />See [What's new in Redis 8.0]({{<relref "/develop/whats-new/8-0">}}) and [Redis Open Source 8.0 release notes]({{<relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisce/redisos-8.0-release-notes">}}) |
| 7.4 | [RediSearch 2.10]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisearch/redisearch-2.10-release-notes.md" >}})<br />[RedisJSON 2.8]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisjson/redisjson-2.8-release-notes.md" >}})<br />[RedisTimeSeries 1.12]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redistimeseries/redistimeseries-1.12-release-notes.md" >}})<br />[RedisBloom 2.8]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisbloom/redisbloom-2.8-release-notes.md" >}}) |
| 7.2 | [RediSearch 2.8]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisearch/redisearch-2.8-release-notes.md" >}})<br />[RedisJSON 2.6]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisjson/redisjson-2.6-release-notes.md" >}})<br />[RedisTimeSeries 1.10]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redistimeseries/redistimeseries-1.10-release-notes.md" >}})<br />[RedisBloom 2.6]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisbloom/redisbloom-2.6-release-notes.md" >}}) |
| 6.2 | [RediSearch 2.6]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisearch/redisearch-2.6-release-notes.md" >}})<br />[RedisJSON 2.4]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisjson/redisjson-2.4-release-notes.md" >}})<br />[RedisTimeSeries 1.8]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redistimeseries/redistimeseries-1.8-release-notes.md" >}})<br />[RedisBloom 2.4]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisbloom/redisbloom-2.4-release-notes.md" >}}) |

### Resolved issues

- RS124443: Fixed an error that could occur during fresh installations when attempting to set file permissions before the `redislabs` user and group were created.

- RS147692: Fixed an issue with persistence configuration and storage path handling where persistence could fail after temporary storage disruptions.

- RS160493: Improved reliability of failover operations by enhancing retry mechanisms and connection handling.

- RS161545: Fixed an issue in two-node clusters with witness disk where a freeze of the primary node could lead to a split-brain scenario where both nodes believe they are the primary node, leading to cluster instability.

- RS162828: Fixed an issue where database authentication could fail after ACL changes due to outdated access control configurations.

- RS165065: Fixed an issue with configuration updates on promoted shards after failover if the target node was temporarily unresponsive.

- RS169857: Fixed an issue where `dmcproxy` could get stuck in restart loops after VM freeze events and repeatedly run unnecessary detailed connection reports.

- RS170790: Fixed an issue where append-only files could become corrupted if the persistent disk ran out of space during write operations, causing partial or missing data at the end of the file.

- RS172012: Fixed an issue with the handling of audit logging connections that could cause high CPU utilization by `dmcproxy`.

- RS176174: Improved reliability of database upgrades by adjusting shutdown timeouts and restart handling for failed shards.

- RS177036: Fixed an issue where importing RDB files from Azure Blob Storage could fail if the files were stored in subdirectories.

- RS179774: Fixed an issue where installation could fail on systems with firewall enabled due to missing reserved ports in firewalld configuration.

- RS179834: Fixed an issue where client connections could become stuck when using sharded pub/sub commands with the OSS cluster API.

- RS177380: Fixed authorization errors that could occur due to fetching log paths before a user signed in to the Cluster Manager UI.

- RS142855: Enhanced Active-Active database creation API to support mTLS configuration during database creation, allowing client certificate authentication to be configured without requiring changes after creation.

- RS171991: Improved node bootstrapping reliability during cluster patching by increasing retry attempts for connection to the local CCS.

- RS177389: Fixed an issue where database recovery could fail with a retryable error when given an empty recovery plan.

- RS167864: Fixed an issue with the shards API that could cause temporary inconsistencies with shards' reported roles after database upgrades.

- RS180550: Fixed an issue that prevented setting up SSO when the Cluster Manager UI was exposed through an IPv6-based load balancer or gateway.

- RS176474: Fixed an issue where clusters could fail after uploading internal certificates that lacked the "TLS Web Client Authentication" option. The system now validates and rejects certificates without this required option during upload to prevent cluster failures.

## Version changes

### Supported platforms

The following table provides a snapshot of supported platforms as of this Redis Enterprise Software release. See the [supported platforms reference]({{< relref "/operate/rs/references/supported-platforms" >}}) for more details about operating system compatibility.

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

## Downloads

The following table shows the SHA256 checksums for the available packages:

| Package | SHA256 checksum (8.0.10-tba January release) |
|---------|---------------------------------------|
| Ubuntu 20 | <span class="break-all"></span> |
| Ubuntu 22 (amd64) | <span class="break-all"></span> |
| Ubuntu 22 (arm64) | <span class="break-all"></span> |
| Red Hat Enterprise Linux (RHEL) 8 | <span class="break-all"></span> |
| Red Hat Enterprise Linux (RHEL) 9 (amd64) | <span class="break-all"></span> |
| Red Hat Enterprise Linux (RHEL) 9 (arm64) | <span class="break-all"></span> |
| Amazon Linux 2 | <span class="break-all"></span> |

## Known issues

- RS155734: Endpoint availability metrics do not work as expected due to a calculation error.

## Known limitations

#### Trim ACKED not supported for Active-Active 8.4 databases

For Active-Active databases running Redis database version 8.4, the `ACKED` option is not supported for trimming commands.

#### Rolling upgrade limitation for clusters with custom or deprecated modules

Due to module handling changes introduced in Redis Enterprise Software version 8.0, upgrading a cluster that contains custom or deprecated modules, such as RedisGraph and RedisGears v2, can become stuck when adding a new node to the cluster during a rolling upgrade.

#### Module commands limitation during Active-Active database upgrades to Redis 8.0

When upgrading an Active-Active database to Redis version 8.0, you cannot use module commands until all Active-Active database instances have been upgraded. Currently, these commands are not blocked automatically.

#### Redis 8.0 database cannot be created with flash

You cannot create a Redis 8.0 database with flash storage enabled. Create a Redis 8.0 database with RAM-only storage instead, or use Redis 8.2 for flash-enabled (Redis Flex) databases.

#### Cluster Manager UI limitations

The following legacy UI features are not yet available in the new Cluster Manager UI:

- Purge an Active-Active instance.

    Use [`crdb-cli crdb purge-instance`]({{< relref "/operate/rs/references/cli-utilities/crdb-cli/crdb/purge-instance" >}}) instead.

- Search and export the log.

## Security

#### Redis Open Source security fixes compatibility

As part of Redis's commitment to security, Redis Enterprise Software implements the latest [security fixes](https://github.com/redis/redis/releases) available with [Redis Open Source](https://github.com/redis/redis). Redis Enterprise Software has already included the fixes for the relevant CVEs.

Some CVEs announced for Redis Open Source do not affect Redis Enterprise Software due to different or additional functionality available in Redis Enterprise Software that is not available in Redis Open Source.

Redis Enterprise Software 8.0.10-tba supports Redis Open Source 8.4, 8.2, 8.0, 7.4, 7.2, and 6.2. Below is the list of Redis Open Source CVEs and other security vulnerabilities fixed by version.

Redis 8.2.x:

- RedisBloom: Restore invalid filter.

- (CVE-2025-62507) A user can run the `XACKDEL` command with multiple IDs and trigger a stack buffer overflow, which can potentially lead to remote code execution.

- The `HGETEX` command can lead to a buffer overflow.

- Integer overflow in `hllPatLen`.

- RedisBloom: Cuckoo filter counter overflow.

- RedisBloom: Invalid Bloom filters can cause arbitrary memory reads and writes.

- RedisBloom: Reachable assert in `TopK_Create`

- RedisBloom: Out-of-bounds access with empty Bloom chains.

- RedisBloom: Division by zero in Cuckoo filter insertion.

- (CVE-2025-46818) An authenticated user may use a specially crafted Lua script to manipulate different LUA objects and potentially run their own code in the context of another user.

- (CVE-2025-46819) An authenticated user may use a specially crafted LUA script to read out-of-bound data or crash the server and lead to subsequent denial of service.

- (CVE-2025-46817) An authenticated user may use a specially crafted Lua script to cause an integer overflow and potentially lead to remote code execution.

- (CVE-2025-49844) An authenticated user may use a specially crafted Lua script to manipulate the garbage collector, trigger a use-after-free, and potentially lead to remote code execution.

Redis 8.0.x:

- RedisBloom: Restore invalid filter.

- The `HGETEX` command can lead to a buffer overflow.

- Integer overflow in `hllPatLen`.

- RedisBloom: Cuckoo filter counter overflow.

- RedisBloom: Invalid Bloom filters can cause arbitrary memory reads and writes.

- RedisBloom: Reachable assert in `TopK_Create`

- RedisBloom: Out-of-bounds access with empty Bloom chains.

- RedisBloom: Division by zero in Cuckoo filter insertion.

- (CVE-2025-46818) An authenticated user may use a specially crafted Lua script to manipulate different LUA objects and potentially run their own code in the context of another user.

- (CVE-2025-46819) An authenticated user may use a specially crafted LUA script to read out-of-bound data or crash the server and lead to subsequent denial of service.

- (CVE-2025-46817) An authenticated user may use a specially crafted Lua script to cause an integer overflow and potentially lead to remote code execution.

- (CVE-2025-49844) An authenticated user may use a specially crafted Lua script to manipulate the garbage collector, trigger a use-after-free, and potentially lead to remote code execution.

Redis 7.4.x:

- RedisBloom: Restore invalid filter.

- Integer overflow in `hllPatLen`.

- RedisBloom: Cuckoo filter counter overflow.

- RedisBloom: Invalid Bloom filters can cause arbitrary memory reads and writes.

- RedisBloom: Reachable assert in `TopK_Create`

- RedisBloom: Out-of-bounds access with empty Bloom chains.

- RedisBloom: Division by zero in Cuckoo filter insertion.

- (CVE-2025-46818) An authenticated user may use a specially crafted Lua script to manipulate different LUA objects and potentially run their own code in the context of another user.

- (CVE-2025-46819) An authenticated user may use a specially crafted LUA script to read out-of-bound data or crash the server and lead to subsequent denial of service.

- (CVE-2025-46817) An authenticated user may use a specially crafted Lua script to cause an integer overflow and potentially lead to remote code execution.

- (CVE-2025-49844) An authenticated user may use a specially crafted Lua script to manipulate the garbage collector, trigger a use-after-free, and potentially lead to remote code execution.

- (CVE-2025-32023) An authenticated user can use a specially crafted string to trigger a stack/heap out-of-bounds write on HyperLogLog operations, which can lead to remote code execution.

- (CVE-2025-21605) An unauthenticated client can cause unlimited growth of output buffers until the server runs out of memory or is terminated, which can lead to denial-of-service.

Redis 7.2.x:

- RedisBloom: Restore invalid filter.

- Integer overflow in `hllPatLen`.

- RedisBloom: Cuckoo filter counter overflow.

- RedisBloom: Invalid Bloom filters can cause arbitrary memory reads and writes.

- RedisBloom: Reachable assert in `TopK_Create`

- RedisBloom: Out-of-bounds access with empty Bloom chains.

- RedisBloom: Division by zero in Cuckoo filter insertion.

- (CVE-2025-46818) An authenticated user may use a specially crafted Lua script to manipulate different LUA objects and potentially run their own code in the context of another user.

- (CVE-2025-46819) An authenticated user may use a specially crafted LUA script to read out-of-bound data or crash the server and lead to subsequent denial of service.

- (CVE-2025-46817) An authenticated user may use a specially crafted Lua script to cause an integer overflow and potentially lead to remote code execution.

- (CVE-2025-49844) An authenticated user may use a specially crafted Lua script to manipulate the garbage collector, trigger a use-after-free, and potentially lead to remote code execution.

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

- RedisBloom: Restore invalid filter.

- Integer overflow in `hllPatLen`.

- RedisBloom: Cuckoo filter counter overflow.

- RedisBloom: Invalid Bloom filters can cause arbitrary memory reads and writes.

- RedisBloom: Reachable assert in `TopK_Create`

- RedisBloom: Out-of-bounds access with empty Bloom chains.

- RedisBloom: Division by zero in Cuckoo filter insertion.

- (CVE-2025-46818) An authenticated user may use a specially crafted Lua script to manipulate different LUA objects and potentially run their own code in the context of another user.

- (CVE-2025-46819) An authenticated user may use a specially crafted LUA script to read out-of-bound data or crash the server and lead to subsequent denial of service.

- (CVE-2025-46817) An authenticated user may use a specially crafted Lua script to cause an integer overflow and potentially lead to remote code execution.

- (CVE-2025-49844) An authenticated user may use a specially crafted Lua script to manipulate the garbage collector, trigger a use-after-free, and potentially lead to remote code execution.

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
