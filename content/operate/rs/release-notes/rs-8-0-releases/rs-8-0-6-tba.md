---
Title: Redis Enterprise Software release notes 8.0.6-tba (December 2025)
alwaysopen: false
categories:
- docs
- operate
- rs
compatibleOSSVersion: Redis 8.2.1, 8.0.2, 7.4.3, 7.2.7, 6.2.13
description: Single sign-on for the Cluster Manager UI. Slot migration API. Error reports for Replica Of migration status. Automatically download and install user-defined modules during bootstrapping.
linkTitle: 8.0.6-tba (December 2025)
weight: 88
---

​[​Redis Enterprise Software version 8.0.6](https://redis.io/downloads/#Redis_Software) is now available! This release includes API enhancements that warranted a new minor version instead of a maintenance release for version 8.0.2. However, you can upgrade from 8.0.2 to 8.0.6 without issue.

## Highlights

This version offers:

- Single sign-on for the Cluster Manager UI

- Slot migration API

- Error reports for Replica Of migration status

- Automatically download and install user-defined modules during bootstrapping

## New in this release

### New features

#### Single sign-on for the Cluster Manager UI {#sso}

Redis Enterprise Software now supports IdP-initiated and SP-initiated single sign-on (SSO) with SAML (Security Assertion Markup Language) 2.0 for the Cluster Manager UI.

When SSO is activated:

- Users can sign in to the Redis Enterprise Software Cluster Manager UI using their identity provider (IdP) instead of usernames and passwords.

- Optionally, you can enforce SSO for the cluster, which means non-admin users can no longer sign in with their previous usernames and passwords and must use SSO instead.

- With just-in-time (JIT) user provisioning, Redis Enterprise Software automatically creates a user account the first time a new user signs in with SSO.

For more information and setup instructions, see [SAML single sign-on]({{<relref "/operate/rs/security/access-control/saml-sso">}}).

Known limitation: You cannot change the default service provider address using the Cluster Manager UI. You can only change this address using a REST API request.

#### Slot migration API

New database actions allow you to migrate and cancel slot migrations between Redis instances (shards) within a database. See the REST API references for [migrate slots]({{<relref "/operate/rs/references/rest-api/requests/bdbs/actions/migrate_slots">}}) and [cancel slot migrations]({{<relref "/operate/rs/references/rest-api/requests/bdbs/actions/cancel_migrate_slots">}}) for details.

### Enhancements

- Added error report to Replica Of [migration status]({{<relref "/operate/rs/references/rest-api/requests/migrations">}}) REST API responses.

- Added support for automatically downloading and installing user-defined modules during bootstrap operations. You can now specify `user_defined_modules` in [bootstrap requests]({{<relref "/operate/rs/references/rest-api/requests/bootstrap#post-bootstrap">}}) for `create_cluster`, `join_cluster`, and `recover_cluster` actions. See [Add user-defined modules during bootstrapping]({{<relref "/operate/oss_and_stack/stack-with-enterprise/install/add-module-to-cluster#bootstrap-user-defined-module">}}) for details.

### Redis database versions

Redis Enterprise Software version 8.0.6 includes five Redis database versions: 8.2.1, 8.0.2, 7.4.3, 7.2.7, and 6.2.13.

The [default Redis database version]({{<relref "/operate/rs/databases/configure/db-defaults#database-version">}}) is 8.2.

### Redis feature sets

Redis Enterprise Software includes multiple feature sets, compatible with different Redis database versions.

The following table shows which Redis modules are compatible with each Redis database version included in this release.

| Redis database version | Compatible Redis modules |
|------------------------|--------------------------|
| 8.2 | RediSearch 8.2<br />RedisJSON 8.2<br />RedisTimeSeries 8.2<br />RedisBloom 8.2<br />See [What's new in Redis 8.2]({{<relref "/develop/whats-new/8-2">}}) and [Redis Open Source 8.2 release notes]({{<relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisce/redisos-8.2-release-notes">}}) |
| 8.0 | RediSearch 8.0<br />RedisJSON 8.0<br />RedisTimeSeries 8.0<br />RedisBloom 8.0<br />See [What's new in Redis 8.0]({{<relref "/develop/whats-new/8-0">}}) and [Redis Open Source 8.0 release notes]({{<relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisce/redisos-8.0-release-notes">}}) |
| 7.4 | [RediSearch 2.10]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisearch/redisearch-2.10-release-notes.md" >}})<br />[RedisJSON 2.8]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisjson/redisjson-2.8-release-notes.md" >}})<br />[RedisTimeSeries 1.12]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redistimeseries/redistimeseries-1.12-release-notes.md" >}})<br />[RedisBloom 2.8]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisbloom/redisbloom-2.8-release-notes.md" >}}) |
| 7.2 | [RediSearch 2.8]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisearch/redisearch-2.8-release-notes.md" >}})<br />[RedisJSON 2.6]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisjson/redisjson-2.6-release-notes.md" >}})<br />[RedisTimeSeries 1.10]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redistimeseries/redistimeseries-1.10-release-notes.md" >}})<br />[RedisBloom 2.6]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisbloom/redisbloom-2.6-release-notes.md" >}}) |
| 6.2 | [RediSearch 2.6]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisearch/redisearch-2.6-release-notes.md" >}})<br />[RedisJSON 2.4]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisjson/redisjson-2.4-release-notes.md" >}})<br />[RedisTimeSeries 1.8]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redistimeseries/redistimeseries-1.8-release-notes.md" >}})<br />[RedisBloom 2.4]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisbloom/redisbloom-2.4-release-notes.md" >}}) |

### Resolved issues

- RS131972: Fixed an issue where creating an ACL that contains a line break in the Cluster Manager UI could cause shard migration to fail due to ACL errors.

- RS140424: Fixed an issue where configuration changes initiated topology updates even if the topology did not change.

- RS144636: Improved support package generation to collect available database information even when some data collection steps fail.

- RS162503: Fixed an issue where force-removed Active-Active database instances could not be re-added as participating members without purging.

- RS155782: Improved logs and added validation to ensure operations are properly queued and prevent stuck state machines.

- RS167151: Improved reliability of node removal operations by increasing retry attempts for failover and reshard operations.

- RS167280: Fixed an issue where a subset of shards on a restarted node could fail to start due to temporary connection issues.

- RS172813: Improved logging for Active-Active database failover scenarios to provide better visibility into data recovery processes.

- RS173195: Fixed an issue where cluster operations could fail when attempting to communicate with unreachable nodes.

- RS174154: Fixed an issue where EntraID authentication service was not properly enabled despite being configured and running.

- RS174819: Fixed an issue where duplicate syncers could spawn on the same node.

- RS176400: Fixed an issue where Google Cloud Storage backup locations could be set to the incorrect type when configured in the Cluster Manager UI.

- RS165983: Fixed an issue where an incorrect value was printed for `region_name` in the event log.

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

| Package | SHA256 checksum (8.0.6-tba December release) |
|---------|---------------------------------------|
| Ubuntu 20 | <span class="break-all"></span> |
| Ubuntu 22 (amd64) | <span class="break-all"></span> |
| Ubuntu 22 (arm64) | <span class="break-all"></span> |
| Red Hat Enterprise Linux (RHEL) 8 | <span class="break-all"></span> |
| Red Hat Enterprise Linux (RHEL) 9 | <span class="break-all"></span> |
| Amazon Linux 2 | <span class="break-all"></span> |

## Known issues

- RS155734: Endpoint availability metrics do not work as expected due to a calculation error.

## Known limitations

#### Cannot change SP address for SSO in the Cluster Manager UI

You cannot change the default service provider address using the Cluster Manager UI. You can only change this address using a REST API request.

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

Redis Enterprise Software 8.0.6-tba supports Redis Open Source 8.2, 8.0, 7.4, 7.2, and 6.2. Below is the list of Redis Open Source CVEs and other security vulnerabilities fixed by version.

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
