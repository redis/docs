---
Title: Redis Enterprise Software release notes 7.6.0-tba (August 2024)
alwaysopen: false
categories:
- docs
- operate
- rs
compatibleOSSVersion: Redis 7.4.0
description: Cluster Manager UI enhancements for node actions, database tags, and database configuration. Log rotation based on both size and time. Module management enhancements.
linkTitle: 7.6.0-tba (August 2024)
weight: 90
---

​[​Redis Enterprise Software version 7.6.0](https://redis.com/redis-enterprise-software/download-center/software/) is now available!

## Highlights

This version offers:

- Cluster Manager UI enhancements for node actions, database tags, and database configuration

- Log rotation based on both size and time

- Module management enhancements

## New in this release

### New features

- TBA

### Enhancements

- New Cluster Manager UI enhancements:

    - Perform node actions from the **Nodes** screen to verify nodes, set a node as primary or secondary, remove nodes, and manage node alert settings.

    - Categorize databases with custom tags. When you add new tags to a database, the keys and values already used by existing tags will appear as suggestions.

    - Moved several settings on the database configuration screen:
    
        - The eviction setting now appears in the **Capacity** section.

        - **High availability** and **Durability** have separate sections.

- Added support for [log rotation]({{<relref "/operate/rs/clusters/logging/log-security#log-rotation">}}) based on both size and time.

#### Redis module feature sets

Redis Enterprise comes packaged with several modules. As of version 7.6.0, Redis Enterprise includes three feature sets, compatible with different Redis database versions.

The following table shows which Redis modules are compatible with each Redis database version included in this release.

| Redis database version | Compatible Redis modules |
|------------------------|--------------------------|
| 7.4 | [RediSearch 2.10.5]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisearch/redisearch-2.10-release-notes.md" >}})<br />[RedisJSON 2.8.3]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisjson/redisjson-2.8-release-notes.md" >}})<br />[RedisTimeSeries 1.12.2]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redistimeseries/redistimeseries-1.12-release-notes.md" >}})<br />[RedisBloom 2.8.2]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisbloom/redisbloom-2.8-release-notes.md" >}}) |
| 7.2 | [RediSearch 2.8.14]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisearch/redisearch-2.8-release-notes.md" >}})<br />[RedisJSON 2.6.10]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisjson/redisjson-2.6-release-notes.md" >}})<br />[RedisTimeSeries 1.10.12]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redistimeseries/redistimeseries-1.10-release-notes.md" >}})<br />[RedisBloom 2.6.13]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisbloom/redisbloom-2.6-release-notes.md" >}}) |
| 6.2 | [RediSearch 2.6.19]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisearch/redisearch-2.6-release-notes.md" >}})<br />[RedisJSON 2.4.9]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisjson/redisjson-2.4-release-notes.md" >}})<br />[RedisTimeSeries 1.8.13]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redistimeseries/redistimeseries-1.8-release-notes.md" >}})<br />[RedisBloom 2.4.10]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisbloom/redisbloom-2.4-release-notes.md" >}})<br />[RedisGraph v2.10.15]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisgraph/redisgraph-2.10-release-notes.md" >}})<sup>[1](#module-note-1)</sup>  |

1. <a name="module-note-1"></a>RedisGraph end-of-life has been announced and will be removed in a future release. See the [RedisGraph end-of-life announcement](https://redis.io/blog/redisgraph-eol/) for more details.

### Resolved issues

- TBA

## Version changes

### Product lifecycle updates

#### End-of-life policy extension

The end-of-life policy for Redis Enterprise Software versions 6.2 and later has been extended to 24 months after the formal release of the subsequent major version. For the updated end-of-life schedule, see the [Redis Enterprise Software product lifecycle]({{<relref "/operate/rs/installing-upgrading/product-lifecycle">}}).

#### Supported upgrade paths

Redis Enterprise Software versions 6.2.4 and 6.2.8 do not support direct upgrades beyond version 7.4.x. Versions 6.2.10, 6.2.12, and 6.2.18 are part of the [upgrade path]({{<relref "/operate/rs/installing-upgrading/upgrading/upgrade-cluster#supported-upgrade-paths">}}). To upgrade from 6.2.4 or 6.2.8 to versions later than 7.4.x, an intermediate upgrade is required.

The next major Redis Enterprise Software release will still bundle Redis database version 6.2 and allow database upgrades from Redis database version 6.2 to 7.x.

See the [Redis Enterprise Software product lifecycle]({{<relref "/operate/rs/installing-upgrading/product-lifecycle">}}) for more information about release numbers.

### Deprecations

#### API deprecations

- Deprecated `background_op` field from BDB REST API object. Use [`GET /v1/actions/bdb/<bdb_uid>`]({{<relref "/operate/rs/references/rest-api/requests/actions/bdb">}}) instead.

#### Legacy UI deprecation

The legacy UI is deprecated in favor of the new Cluster Manager UI and will be removed in a future release.

#### Redis 6.0 database deprecation

Redis database version 6.0 is deprecated as of Redis Enterprise Software version 7.4.2 and will be removed in a future release.

To prepare for the future removal of Redis 6.0:

- For Redis Enterprise 6.2.* clusters, upgrade Redis 6.0 databases to Redis 6.2. See the [Redis 6.2 release notes](https://raw.githubusercontent.com/redis/redis/6.2/00-RELEASENOTES) for the list of changes.

- For Redis Enterprise 7.2.4 and 7.4.2 clusters, upgrade Redis 6.0 databases to Redis 7.2. Before you upgrade your databases, see the list of [Redis 7.2 breaking changes]({{< relref "/operate/rs/release-notes/rs-7-2-4-releases/rs-7-2-4-52#redis-72-breaking-changes" >}}) and update any applications that connect to your database to handle these changes.

### Upcoming changes

#### Default image change for Redis Enterprise Software containers

Starting with version 7.6, Redis Enterprise Software containers with the image tag `x.y.z-build` will be based on RHEL instead of Ubuntu.

This change will only affect you if you use containers outside the official [Redis Enterprise for Kubernetes]({{<relref "/operate/kubernetes">}}) product and use Ubuntu-specific commands.

To use Ubuntu-based images after this change, you can specify the operating system suffix in the image tag. For example, use the image tag `7.4.2-216.focal` instead of `7.4.2-216`.

### Supported platforms

The following table provides a snapshot of supported platforms as of this Redis Enterprise Software release. See the [supported platforms reference]({{< relref "/operate/rs/references/supported-platforms" >}}) for more details about operating system compatibility.

<span title="Check mark icon">&#x2705;</span> Supported – The platform is supported for this version of Redis Enterprise Software and Redis Stack modules.

<span title="Warning icon" class="font-serif">:warning:</span> Deprecation warning – The platform is still supported for this version of Redis Enterprise Software, but support will be removed in a future release.

| Redis Software<br />major versions | 7.6 | 7.4 | 7.2 | 6.4 | 6.2 |
|---------------------------------|:-----:|:-----:|:-----:|:-----:|:-----:|
| **Release date** | Aug 2024 | Feb 2024 | Aug 2023 | Feb 2023 | Aug 2021 |
| [**End-of-life date**]({{< relref "/operate/rs/installing-upgrading/product-lifecycle#endoflife-schedule" >}}) | Determined after<br />next major release | TBA | Feb 2026 | Aug 2025 | Feb 2025 |
| **Platforms** | | | | | |
| RHEL 9 &<br />compatible distros<sup>[1](#table-note-1)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – | – | – |
| RHEL 8 &<br />compatible distros<sup>[1](#table-note-1)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| RHEL 7 &<br />compatible distros<sup>[1](#table-note-1)</sup> | – | – | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Ubuntu 20.04<sup>[2](#table-note-2)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – |
| Ubuntu 18.04<sup>[2](#table-note-2)</sup> | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Ubuntu 16.04<sup>[2](#table-note-2)</sup> | – | – | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Amazon Linux 2 | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – |
| Amazon Linux 1 | – | – | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Kubernetes<sup>[3](#table-note-3)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Docker<sup>[4](#table-note-4)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |

1. <a name="table-note-1" style="display: block; height: 80px; margin-top: -80px;"></a>The RHEL-compatible distributions CentOS, CentOS Stream, Alma, and Rocky are supported if they have full RHEL compatibility. Oracle Linux running the Red Hat Compatible Kernel (RHCK) is supported, but the Unbreakable Enterprise Kernel (UEK) is not supported.

2. <a name="table-note-2" style="display: block; height: 80px; margin-top: -80px;"></a>The server version of Ubuntu is recommended for production installations. The desktop version is only recommended for development deployments.

3. <a name="table-note-3" style="display: block; height: 80px; margin-top: -80px;"></a>See the [Redis Enterprise for Kubernetes documentation]({{< relref "/operate/kubernetes/reference/supported_k8s_distributions" >}}) for details about support per version and Kubernetes distribution.

4. <a name="table-note-4" style="display: block; height: 80px; margin-top: -80px;"></a>
[Docker images]({{< relref "/operate/rs/installing-upgrading/quickstarts/docker-quickstart" >}}) of Redis Enterprise Software are certified for development and testing only.

## Downloads

The following table shows the SHA256 checksums for the available packages:

| Package | SHA256 checksum (7.6.0-tba Aug release) |
|---------|---------------------------------------|
| Ubuntu 18 | <span class="break-all"></span> |
| Ubuntu 20 | <span class="break-all"></span> |
| Red Hat Enterprise Linux (RHEL) 8 | <span class="break-all"></span> |
| Red Hat Enterprise Linux (RHEL) 9 | <span class="break-all"></span> |
| Amazon Linux 2 | <span class="break-all"></span> |

## Known issues

- TBA

## Known limitations

#### New Cluster Manager UI limitations

The following legacy UI features are not yet available in the new Cluster Manager UI:

- Purge an Active-Active instance.

    Use [`crdb-cli crdb purge-instance`]({{< relref "/operate/rs/references/cli-utilities/crdb-cli/crdb/purge-instance" >}}) instead.

- Search and export the log.

#### RedisGraph prevents upgrade to RHEL 9 

You cannot upgrade from a prior RHEL version to RHEL 9 if the Redis Enterprise cluster contains a RedisGraph module, even if unused by any database. The [RedisGraph module has reached End-of-Life](https://redis.com/blog/redisgraph-eol/) and is completely unavailable in RHEL 9.

## Security

#### Open source Redis security fixes compatibility

As part of Redis's commitment to security, Redis Enterprise Software implements the latest [security fixes](https://github.com/redis/redis/releases) available with [open source Redis](https://github.com/redis/redis). Redis Enterprise has already included the fixes for the relevant CVEs.

Some CVEs announced for open source Redis do not affect Redis Enterprise due to different or additional functionality available in Redis Enterprise that is not available in open source Redis.

Redis Enterprise 7.6.0-tba supports open source Redis 7.2, 6.2, and 6.0. Below is the list of open source Redis CVEs fixed by version.

Redis 7.2.x:

- (CVE-2023-41056) In some cases, Redis may incorrectly handle resizing of memory buffers, which can result in incorrect accounting of buffer sizes and lead to heap overflow and potential remote code execution.

- (CVE-2023-41053) Redis does not correctly identify keys accessed by `SORT_RO` and, as a result, may grant users executing this command access to keys that are not explicitly authorized by the ACL configuration. (Redis 7.2.1)

Redis 7.0.x:

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

Redis 6.0.x:

- (CVE-2022-24834) A specially crafted Lua script executing in Redis can trigger a heap overflow in the cjson and cmsgpack libraries, and result in heap corruption and potentially remote code execution. The problem exists in all versions of Redis with Lua scripting support, starting from 2.6, and affects only authenticated and authorized users. (Redis 6.0.20)

- (CVE-2023-28856) Authenticated users can use the `HINCRBYFLOAT` command to create an invalid hash field that will crash Redis on access. (Redis 6.0.19)

- (CVE-2023-25155) Specially crafted `SRANDMEMBER`, `ZRANDMEMBER`, and `HRANDFIELD` commands can trigger an integer overflow, resulting in a runtime assertion and termination of the Redis server process. (Redis 6.0.18)

- (CVE-2022-36021) String matching commands (like `SCAN` or `KEYS`) with a specially crafted pattern to trigger a denial-of-service attack on Redis can cause it to hang and consume 100% CPU time. (Redis 6.0.18)

- (CVE-2022-35977) Integer overflow in the Redis `SETRANGE` and `SORT`/`SORT_RO` commands can drive Redis to OOM panic. (Redis 6.0.17)
