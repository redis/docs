---
Title: Redis Enterprise Software Release Notes 6.2.8 (October 2021)
alwaysopen: false
categories:
- docs
- operate
- rs
compatibleOSSVersion: Redis 6.2.3
description: RHEL 8 support. Set backup start time.
linkTitle: 6.2.8 (October 2021)
weight: 75
---

[Redis Enterprise Software version 6.2.8](https://redislabs.com/redis-enterprise-software/download-center/software/) is now available! 

## Features and enhancements

This version features:

- Support for Red Hat Linux Edition (RHEL) 8
- You can now set the start time for [12- and 24-hour backups]({{< relref "/operate/rs/databases/import-export/schedule-backups.md" >}}) 
- Compatibility with version of [open source Redis 6.2.3](https://github.com/redis/redis/releases/tag/6.2.3) (starting with [Redis Enterprise Software v6.2.4]({{< relref "/operate/rs/release-notes/rs-6-2-4-august-2021.md" >}}))
- Compatibility with the security fixes of the latest [open source Redis 6.2.6](https://github.com/redis/redis/releases/tag/6.2.6)
- Enhancements and bug fixes

## Version changes

### Prerequisites and notes

- You can [upgrade to v6.2.8]({{< relref "/operate/rs/installing-upgrading/upgrading" >}}) from Redis Enterprise Software v6.0 and later. 

- Refer to the [v6.2.4 release notes]({{< relref "/operate/rs/release-notes/rs-6-2-4-august-2021.md" >}}) for important notes regarding the upgrade process.

- When upgrading a cluster from Redis Enterprise 6.0.8 and earlier to 6.2.8 only, the DMC proxy might crash when proxy certificates contain additional text as comments.  Redis removes these comments during upgrade, but a change to the v6.2.8 internal upgrade action sequence might cause this problem. 


    If you plan to upgrade from a pre-6.0.8 release to 6.2.8, check whether your proxy certificate includes additional comments and manually remove them.  The change was reverted in 6.2.10.

- Upgrades from versions earlier than v6.0 are not supported.

### Product lifecycle updates

As of 31 October 2021, Redis Enterprise Software v5.6.0 is end of life (EOF).

To learn more, see the Redis Enterprise Software [product lifecycle]({{< relref "/operate/rs/installing-upgrading/product-lifecycle.md" >}}), which details the release number and the end-of-life schedule for Redis Enterprise Software.

Redis Enterprise modules have individual release numbers [and lifecycles]({{< relref "/operate/oss_and_stack/stack-with-enterprise/modules-lifecycle.md" >}}).

### Redis modules

Redis Enterprise Software v6.2.8 includes the following Redis modules:

- [RediSearch v2.0.11]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisearch/redisearch-2.0-release-notes.md" >}})
- [RedisJSON v1.0.8]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisjson/redisjson-1.0-release-notes.md" >}})
- [RedisBloom v2.2.6]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisbloom/redisbloom-2.2-release-notes.md" >}}) 
- [RedisGraph v2.4.7]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisgraph/redisgraph-2.4-release-notes.md" >}})
- [RedisTimeSeries v1.4.10]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redistimeseries/redistimeseries-1.4-release-notes.md" >}})

To learn more, see [Upgrade the module for a database]({{< relref "/operate/oss_and_stack/stack-with-enterprise/install/upgrade-module" >}}).

## Resolved issues

### User interface fixes

- RS58804 - Display an error message in case of a login attempt with an LDAP user
- RS56680 - Notify that SASLAUTHD should be disabled prior to enabling LDAP 
- RS55844 - Use the correct password and mask it on LDAP password update
- RS60877 - Fixed reset of Active-Active database compression level, in cases where the compression level wasn’t set to default, when changing any other configuration via the DB configuration page
- RS43999 - Fixed UI database configuration to allow changes when SFTP SSH key is customized
- RS59861 - Fixed the UI to display an explanation error message when password complexity does not meet requirements
- RS57734 - Fixed inaccessible UI after cluster upgrade due to missing certificate
- RS43041 - Mask secret keys for backup destination for view and edit in the UI

### Additional fixes

- RS60068 / RS59146 - Fixed unresolved endpoint due to PDNS issues
- RS52812 - Expand API wrapper to return API 405 errors as JSON/XML
- RS57666 - Fixed false shard migration message when the shard fails to bind the port
- RS57444, RS55294, RS4903 - Fixed false "backup finished successfully" message when the backup failed due to restricted access to the backup destination

### Fixes on build #53
- RS67829 - Fixed a bug that caused Modules' auxiliary field not to get replicated between the primary and the replica shards. Applicable for RediSearch, RedisGraph and RedisGears and happening only at following scenarios:
         - (A) On the destination databases of a Replica Of upon a full sync operation
         - (B) Upon import operation

## Known limitations

-RS81463 - A shard may crash when resharding an Active-Active database with Auto Tiering . Specifically, the shard will crash when volatile keys or Active-Active tombstone keys reside in Flash memory.

- RS63258 - Redis Enterprise Software 6.2.8 is not supported on RHEL 8 with FIPS enabled.

    FIPS changes system-generated keys, which can limit secure access to the cluster or the admin console via port 8443.

- RS63375 - RHEL 7 clusters cannot be directly upgraded to RHEL 8 when hosting databases using modules.

    Due to binary differences in modules between the two operating systems, you cannot directly update RHEL 7 clusters to RHEL 8 when those clusters host databases using modules.  Instead, you need to create a new cluster on RHEL 8 and then migrate existing data from your RHEL 7 cluster. This does not apply to clusters that do not use modules.

All [known limitations]({{< relref "/operate/rs/release-notes/rs-6-2-4-august-2021.md#known-limitations" >}}) from v6.2.4 have been fixed. 

### Installation limitations

Several Redis Enterprise Software installation reference files are installed to the directory `/etc/opt/redislabs/` even if you use [custom installation directories]({{< relref "/operate/rs/installing-upgrading/install/customize-install-directories" >}}).

As a workaround to install Redis Enterprise Software without using any root directories, do the following before installing Redis Enterprise Software:

1. Create all custom, non-root directories you want to use with Redis Enterprise Software.

1. Mount `/etc/opt/redislabs` to one of the custom, non-root directories.

## Known issues 

- A new command was added as part of Redis 6.2: [`XAUTOCLAIM`]({{< relref "/commands/xautoclaim" >}}). When used in an Active-Active configuration, this command may cause Redis shards to crash, potentially resulting in data loss. The issue is fixed in Redis Enterprise Software version 6.2.12. Additionally, we recommend enabling AOF persistence for all Active-Active configurations.

- The `ZRANGESTORE` command, with a special `zset-max-ziplist-entries` configuration can crash Redis 6.2. See [Redis repository 10767](https://github.com/redis/redis/pull/10767) for more details.

- RS40641 - API requests are redirected to an internal IP in case the request arrives from a node which is not the master. To avoid this issue, use [`rladmin cluster config`]({{< relref "/operate/rs/references/cli-utilities/rladmin/cluster/config" >}}) to configure `handle_redirects` or `handle_metrics_redirects`.

## Security

### Open source Redis security fix compatibility

As part of its commitment to security, Redis Enterprise Software implements the latest [security fixes](https://github.com/redis/redis/releases) available with open source Redis.

The following [open source Redis](https://github.com/redis/redis) [CVEs](https://github.com/redis/redis/security/advisories) do not affect Redis Enterprise:

- [CVE-2021-32625](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-32625) - Redis Enterprise is not impacted by the CVE that was found and fixed in open source Redis since Redis Enterprise does not implement `LCS`. Additional information about the open source Redis fix is on [the Redis GitHub page](https://github.com/redis/redis/releases) (Redis 6.2.4, Redis 6.0.14)

- [CVE-2021-32672](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-32672) - Redis Enterprise is not impacted by the CVE that was found and fixed in open source Redis because the LUA debugger is unsupported in Redis Enterprise. Additional information about the open source Redis fix is on [the Redis GitHub page](https://github.com/redis/redis/releases) (Redis 6.2.6, Redis 6.0.16)

- [CVE-2021-32675](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-32675) - Redis Enterprise is not impacted by the CVE that was found and fixed in open source Redis because the proxy in Redis Enterprise does not forward unauthenticated requests. Additional information about the open source Redis fix is on [the Redis GitHub page](https://github.com/redis/redis/releases) (Redis 6.2.6, Redis 6.0.16)

- [CVE-2021-32762](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-32762) - Redis Enterprise is not impacted by the CVE that was found and fixed in open source Redis because the memory allocator used in Redis Enterprise is not vulnerable. Additional information about the open source Redis fix is on [the Redis GitHub page](https://github.com/redis/redis/releases) (Redis 6.2.6, Redis 6.0.16)

- [CVE-2021-41099](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-41099) - Redis Enterprise is not impacted by the CVE that was found and fixed in open source Redis because the proto-max-bulk-len CONFIG is blocked in Redis Enterprise. Additional information about the open source Redis fix is on [the Redis GitHub page](https://github.com/redis/redis/releases) (Redis 6.2.6, Redis 6.0.16)

Some CVEs announced for Open Source Redis do not affect Redis Enterprise due to functionality that is either different from (or not available in) open source Redis.
