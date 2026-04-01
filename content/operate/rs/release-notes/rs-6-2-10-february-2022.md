---
Title: Redis Enterprise Software Release Notes 6.2.10 (February 2022)
alwaysopen: false
categories:
- docs
- operate
- rs
compatibleOSSVersion: Redis 6.2.5, 6.0
description: Python 3 support.  RHEL 8.5 support.
linkTitle: 6.2.10 (February 2022)
weight: 75
---

[Redis Enterprise Software version 6.2.10](https://redislabs.com/redis-enterprise-software/download-center/software/) is now available! 

The following table shows the MD5 checksums for the available packages.

|Package| MD5 Checksum |
|:------|:-------------|
| Ubuntu 16 | `531cea69a58fbc1125bc5f76ba01da7f` |
| Ubuntu 18 | `ec9ac6e0111dc85605d3b98e83f50150` |
| RedHat Enterprise Linux (RHEL) 7<br/>Oracle Enterprise Linux (OL) 7 | `2f7572caab9600417ef8b4ee474d6768` |
| RedHat Enterprise Linux (RHEL) 8<br/>Oracle Enterprise Linux (OL) 8 | `377a539ee050515e1e0640dec1e04129` |
| K8s Ubuntu | `099192416a70a12790535bdcd78a6e87` |
| K8s RHEL   | `f267abe81770ddf36f022232f4c2cb2e` |

## Features and enhancements

- Upgrade the Redis Enterprise infrastructure to [Python v3.9](https://www.python.org/).

- [Red Hat Enterprise Linux (RHEL) v8.5](https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/8/html/8.5_release_notes/index) and [Red Hat Enterprise Linux (RHEL) v8.6](https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/8/html/8.6_release_notes/index) is now a [supported platform]({{< relref "/operate/rs/installing-upgrading/install/plan-deployment/supported-platforms" >}}).

- [Oracle Linux v8](https://docs.oracle.com/en/operating-systems/oracle-linux/8/) is now a [supported platform]({{< relref "/operate/rs/installing-upgrading/install/plan-deployment/supported-platforms" >}}).

- Compatibility with [open source Redis 6.2.5](https://raw.githubusercontent.com/redis/redis/6.2/00-RELEASENOTES).

- Compatibility with the [security fixes](https://github.com/redis/redis/releases/tag/6.2.6) of the latest [open source Redis 6.2.6](https://github.com/redis/redis/releases/tag/6.2.6).

- Enhancements and bug fixes.

## Version changes 

### Prerequisites and notes 

-  You can [upgrade to v6.2.10]({{< relref "/operate/rs/installing-upgrading/upgrading" >}}) from Redis Enterprise Software v6.0 and later. 

- Refer to [v6.2.4 release notes]({{< relref "/operate/rs/release-notes/rs-6-2-4-august-2021" >}}) for important notes regarding changes made to the upgrade.

- Upgrades from versions earlier than v6.0 are not supported.

- If you plan to upgrade your cluster to RHEL 8, refer to [v6.2.8 release notes]({{< relref "/operate/rs/release-notes/rs-6-2-8-october-2021" >}}) for known limitations.

- If you are using Active-Active or Active-Passive (ReplicaOf) databases and experience synchronization issues as a result of the upgrade, see RS67434 details in [Resolved issues](#resolved-issues) for help resolving the problem.

### Product lifecycle updates 

Redis Enterprise Software v6.0.x will reach end of life (EOF) on May 31, 2022.

To learn more, see the Redis Enterprise Software [product lifecycle]({{< relref "/operate/rs/installing-upgrading/product-lifecycle" >}}), which details the release number and the end-of-life schedule for Redis Enterprise Software.

For Redis modules information and lifecycle, see [Module lifecycle]({{< relref "/operate/oss_and_stack/stack-with-enterprise/modules-lifecycle" >}}).

## Redis modules 

Redis Enterprise Software v6.2.10 includes the following Redis modules:

- [RediSearch v2.2.6]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisearch" >}})
- [RedisJSON v2.0.6]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisjson" >}})
- [RedisBloom v2.2.9]({{< relref "/operate/oss_and_stack/stack-with-enterprise/bloom" >}}release-notes/)
- [RedisGraph v2.4.12]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisgraph" >}})
- [RedisTimeSeries v1.4.13]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redistimeseries" >}})

Starting with Redis Enterprise Software v6.2.10 build 121, the included modules versions are:

- [RediSearch v2.4.6]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisearch" >}})
- [RedisJSON v2.0.8]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisjson" >}})
- [RedisBloom v2.2.14]({{< relref "/operate/oss_and_stack/stack-with-enterprise/bloom" >}}release-notes/)
- [RedisGraph v2.8.12]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisgraph" >}})
- [RedisTimeSeries v1.6.9]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redistimeseries" >}})

For help upgrading a module, see [Add a module to a cluster]({{< relref "/operate/oss_and_stack/stack-with-enterprise/install/add-module-to-cluster" >}}#upgrading-the-module-for-the-database). 

## Interface enhancements

- When choosing RedisJSON, the user interface (UI) now suggests RedisSearch as well. To learn more, see the [RedisJSON preview announcement](https://redis.com/blog/redisjson-public-preview-performance-benchmarking/), which details the benefits of combining [RedisJSON](http://redisjson.io/) and [RediSearch](http://redisearch.io/).
- Adds the ability to sort the columns of the node list (RS48256).
- When creating a new geo-distributed (Active-Active) database, an endpoint port is no longer required.  The system assigns one if none if provided (RS27632).

## Additional enhancements

- Added an option to run a connectivity health check for the management layer of Active-Active databases. Run the following REST API command:

    ```sh
    GET https:/[host][:port]/v1/crdbs/<crdb_guid>/health_report
    ```

- Added TLS handshake error messages to the DMC proxy log (RS59346).

## Resolved issues 

- RS58219 - Fixes a UI error message that showed a path instead of a relevant error message.
- RS44958 - Fixes incorrect description for the graph "incoming traffic" in Active-Active (geo-distributed) database UI Metrics.
- RS66280 - Fixes the lexicographic [SORT]({{< relref "/commands/sort" >}}) command on Active-Active databases (e.g. `SORT mylist ALPHA`). The SORT command should only run on keys mapped to the same slot.
- RS64575 - Fixes a bug in the replication between primary and replica shards of a destination Active-active database in the scenario of using Replica-Of from a single to an Active-Active database, where the syncer process went down during the full sync.
- RS65370 - Adds logic to remove old syncer entries in the cluster configuration during upgrades.
- RS67434 - Version 6.2.10 fixes the mTLS handshake between the [syncer process]({{< relref "/operate/rs/databases/active-active" >}}#syncer-process) and the [proxy (DMC)](https://docs.redis.com/latest//rs/references/terminology/#proxy), where the proxy presented a leaf certificate without its full chain to the syncer. After upgrading to 6.2.10, syncer connections using invalid certificates will break the synchronization between Active-Active instances or deployments using Replica Of when TLS is enabled. To ensure certificates are valid before upgrading do the following: 

    - For Active-Active databases, run the following command from one of the clusters:
        
        `crdb-cli crdb update --crdb-guid <CRDB-GUID> --force`
         
    - For Active-Passive (Replica Of) databases: use the admin console to verify that the destination syncer has the correct certificate for the source proxy (DMC).  For details, see [Configure TLS for Replica Of]({{< relref "/operate/rs/databases/import-export/replica-of" >}}create/#configure-tls-on-replica-database).

### Issues resolved in build 96

- RS67133 - An issue in Redis Enterprise Software affected replication in replica databases using RedisGraph, RediSearch, and RedisGears in specific scenarios.  The problem appeared when importing an RDB file or while synchronizing target Active-Passive (ReplicaOf) databases. 

    This issue is fixed in Redis Enterprise Software v6.2.10-96 and RedisGraph v2.8.11.  We recommend upgrading to these versions at your earliest opportunity.  (Failure to upgrade can lead to data loss.)  
    
    Once the upgrades are complete, secondary shards might need to be restarted.  You can use `rlutil` to restart secondary shards:

    ``` sh
    rlutil redis_restart redis=<shard-id1>,<shard-id2>,...
    ```

### Issues resolved in build 100

- RS74171 - A new command was added as part of Redis 6.2: [XAUTOCLAIM]({{< relref "/commands/xautoclaim" >}}). When used in an Active-Active configuration, this command may cause Redis shards to crash, potentially resulting in data loss. The issue is fixed in Redis Enterprise Software version 6.2.12. Additionally, we recommend enabling AOF persistence for all Active-Active configurations.

### Issues resolved in build 121

- RS68668, RS72082 - Improvements for internode encryption certification rotation
- RS72304 - Avoid starting a master shard when both master and replica shards crash and the replica did not finish recovery
- RS74469 - Fix for some Redis Active-Active + Redis Streams scenarios that could lead to shard crash during backup; failure to backup

### Issues resolved in build 129

- RS77003 - Add grace time to job scheduler to allow certificate rotation in case of failure due to scheduling conflicts.
- RS71112 - Update validation during db configuration to not fail due to ports associated with nodes that are no longer in the cluster. This was done to allow db configuration during adding and removing nodes as part of load balancing.
- RS78486 - Fix known issue from 6.2.10 build 100 - When using rladmin tune db to change the replica buffer size, the command appears to succeed, but the change does not take effect. 

## Known limitations

- RS81463 - A shard may crash when resharding an Active-Active database with Auto Tiering . Specifically, the shard will crash when volatile keys or Active-Active tombstone keys reside in Flash memory.

- RS78364 - When using `rladmin tune db` to change the replica buffer size, the command appears to succeed, but the change does not take effect. This issue was introduced in build 100; it will be fixed in a future build of Redis Enterprise Software v6.2.10 and in the next release (v6.2.12).

- RS63258 - Redis Enterprise Software is not currently supported on RHEL 8 with FIPS enabled.

    FIPS changes system-generated keys, which can limit secure access to the cluster or the admin console via port 8443.

- RS63375 - RHEL 7 clusters cannot be directly upgraded to RHEL 8 when hosting databases using modules.

    Due to binary differences in modules between the two operating systems, you cannot directly update RHEL 7 clusters to RHEL 8 when those clusters host databases using modules.  Instead, you need to create a new cluster on RHEL 8 and then migrate existing data from your RHEL 7 cluster. This does not apply to clusters that do not use modules.

All [known limitations]({{< relref "/operate/rs/release-notes/rs-6-2-4-august-2021.md#known-limitations" >}}) listed in the v6.2.4 release notes have been addressed.

### Installation limitations

Several Redis Enterprise Software installation reference files are installed to the directory `/etc/opt/redislabs/` even if you use [custom installation directories]({{< relref "/operate/rs/installing-upgrading/install/customize-install-directories" >}}).

As a workaround to install Redis Enterprise Software without using any root directories, do the following before installing Redis Enterprise Software:

1. Create all custom, non-root directories you want to use with Redis Enterprise Software.

1. Mount `/etc/opt/redislabs` to one of the custom, non-root directories.

## Known issues

- The `ZRANGESTORE` command, with a special `zset-max-ziplist-entries` configuration can crash Redis 6.2. See [Redis repository 10767](https://github.com/redis/redis/pull/10767) for more details.

- RS40641 - API requests are redirected to an internal IP in case the request arrives from a node which is not the master. To avoid this issue, use [`rladmin cluster config`]({{< relref "/operate/rs/references/cli-utilities/rladmin/cluster/config" >}}) to configure `handle_redirects` or `handle_metrics_redirects`.

## Security

### Open Source Redis Security fixes compatibility

As part of Redis commitment to security, Redis Enterprise Software implements the latest [security fixes](https://github.com/redis/redis/releases) available with open source Redis. The following [Open Source Redis](https://github.com/redis/redis) [CVE’s](https://github.com/redis/redis/security/advisories) do not affect Redis Enterprise:

- [CVE-2021-32625](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-32625) - Redis Enterprise is not impacted by the CVE that was found and fixed in open source Redis since Redis Enterprise does not implement LCS. Additional information about the open source Redis fix is on [the Redis GitHub page](https://github.com/redis/redis/releases) (Redis 6.2.4, Redis 6.0.14)

- [CVE-2021-32672](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-32672) - Redis Enterprise is not impacted by the CVE that was found and fixed in open source Redis because the LUA debugger is unsupported in Redis Enterprise. Additional information about the open source Redis fix is on [the Redis GitHub page](https://github.com/redis/redis/releases) (Redis 6.2.6, Redis 6.0.16)

- [CVE-2021-32675](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-32675) - Redis Enterprise is not impacted by the CVE that was found and fixed in open source Redis because the proxy in Redis Enterprise does not forward unauthenticated requests. Additional information about the open source Redis fix is on [the Redis GitHub page](https://github.com/redis/redis/releases) (Redis 6.2.6, Redis 6.0.16)

- [CVE-2021-32762](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-32762) - Redis Enterprise is not impacted by the CVE that was found and fixed in open source Redis because the memory allocator used in Redis Enterprise is not vulnerable. Additional information about the open source Redis fix is on [the Redis GitHub page](https://github.com/redis/redis/releases) (Redis 6.2.6, Redis 6.0.16)

- [CVE-2021-41099](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-41099) - Redis Enterprise is not impacted by the CVE that was found and fixed in open source Redis because the proto-max-bulk-len CONFIG is blocked in Redis Enterprise. Additional information about the open source Redis fix is on [the Redis GitHub page](https://github.com/redis/redis/releases) (Redis 6.2.6, Redis 6.0.16)security fixes for [recent CVE’s](https://github.com/redis/redis/security/advisories). Redis Enterprise has already included the fixes for the relevant CVE’s. Some CVE’s announced for Open Source Redis do not affect Redis Enterprise due to different and additional functionality available in Redis Enterprise that is not available in Open Source Redis.

