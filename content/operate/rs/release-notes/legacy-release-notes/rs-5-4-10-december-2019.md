---
Title: Redis Enterprise Software Release Notes 5.4.10 (December 2019)
alwaysopen: false
categories:
- docs
- operate
- rs
description: null
linkTitle: 5.4.10 (December 2019)
weight: 83
---

[Redis Enterprise Software (RS) 5.4.10](https://redislabs.com/redis-enterprise/software/downloads/#downloads) is now available.
This release includes an improved synchronization mechanism for Active-Active Redis and Replica-of, several enhancements, and bug fixes.

## Overview

Follow these [instructions](https://docs.redis.com/latest/rs/installing-upgrading/upgrading/) for upgrading to RS 5.4.10 from RS 5.0 and above.

## New features

### Synchronization mechanism in Active-Active Redis and Replica-of

RS 5.4.10 incorporates the improved [Redis synchronization mechanism](https://docs.redis.com/latest/rs/databases/active-active#syncer-process) ([PSYNC2](https://redis.io/topics/replication)) for Active-Active Redis (CRDB) and Replica-of.

As a result, failure scenarios in any A-A replica (and the source database of Replica-of), require only partial synchronization between the cross-region replicas instead of full synchronization that can be costly in time and bandwidth.

### RS on RHEL 7 supports OpenSSL 1.0.2 and up

To keep RS secure and keep our internal libraries up-to-date, starting from RS 5.4.10 our RHEL 7 installations require a minimum of OpenSSL 1.0.2.

When you install or upgrade RS 5.4.10 on RHEL 7 with older version of OpenSLL, the installation fails with the error:

```sh
Error: Package: redislabs-5.4.10-1.rhel7.x86_64 (/redislabs-5.4.10-1.rhel7.x86_64)
        Requires: libcrypto.so.10(OPENSSL_1.0.2)(64bit)
```

If you see this error, upgrade to OpenSSL 1.0.2 or higher before you install RS.

## Additional capabilities

- The following new GA releases of Redis Modules are bundled in RS 5.4.10:
    - RedisBloom, version 2.0.3
    - RedisSearch, version 1.4.18
    - RedisJson, version 1.0.4
    - RedisGraph, version 1.2.2
    - RedisTimeSeries, version 1.0.3
- Version 5.0.5 of Redis OSS, along with a fix to a corruption related to the HyperLogLog (that is part of [Redis 5.0.6](https://raw.githubusercontent.com/antirez/redis/5.0/00-RELEASENOTES)) are merged into RS 5.4.10.
- Using REST API, you can retrieve various license details such as activation date, expiration date,and the number of licensed shards. To get these details, run:

    `curl -v -u <user>:<password> https://localhost:9443/v1/license`

- Updated PDNS version from 4.1.5 to 4.1.13.

## Information

- End of Life (EOL) for Redis Enterprise Software 5.4, as well as for Redis Modules and previous RS versions, can be found [here](https://docs.redis.com/latest/rs/installing-upgrading/product-lifecycle).
- Google Chrome browser on macOS Catalina requires self-signed certificate generated after June 2019 to include the extendedKeyUsage field in order to connect to the RS admin console.
    If you use a self-signed certificate that does not include this field, [update the self-signed certificate](https://docs.redis.com/latest/rs/administering/cluster-operations/updating-certificates).
- When you upgrade an Active-Active Redis with active AOF from version RS 5.4.2 or lower to version RS 5.4.4 or higher:
    - If replication is enabled, you must run the BGREWRITEAOF command on all replica shards after the upgrade.
    - If replication is not enabled, you must run the BGREWRITEAOF command on all shards after the upgrade.

## Important fixes

- The titles of the ‘rladmin status nodes’ command output were updated from ‘RAM’ to ‘FREE_RAM’ (the amount of RAM in the node that is currently not used) and from ‘AVAILABLE_RAM’ to ‘PROVISIONAL_RAM’ (the amount of RAM in the node that can be provisioned).
- RS31492 - Upgraded dependent libraries: [python-cryptography to version 2.7](https://github.com/redislabsdev/Redis-Enterprise/pull/4209/commits/3b5a408696b91a0b545f670ce35bb920d5a4beb4); [NGINX to version 1.16.0](https://github.com/redislabsdev/Redis-Enterprise/pull/4209/commits/4ab171d4467bd91c6b38cec81da3c52a6113a787); [PyYaml to version 5.1.2](https://github.com/redislabsdev/Redis-Enterprise/pull/4209/commits/11e814ae0d14c85b248bc7451edbbbcb71f3858f); [python-requests to version 2.22.0](https://github.com/redislabsdev/Redis-Enterprise/pull/4209/commits/0e2ab74b4e2b2dc9872a86fbdb5593f5354eb103); [urllib3 to version 1.25.3](https://github.com/redislabsdev/Redis-Enterprise/pull/4209/commits/038e44163d7dc1fed4e3b67cb252a84583c2f44a)
- RS31187 - Upgraded the internal Python interpreter to version 2.7.16
- RS33042 - Fixed Support Package to contain complete SLOWLOG information
- RS32699 - Avoided unnecessary restart and failover of Redis processes when Active-Active database is upgraded
- RS32061 - Improved support of the Redis WAIT command
- RS31759 - Fixed failure during database import
- RS31747 - Fixed failure in upgrade from version 5.0.0-31 to 5.4.6-11
- RS30063 - Fixed the upgrade process when WatchdogAPI fails to bind to its port
- RS31477 - Fixed wrong calculation of node’s ‘AVAILABLE_RAM’ (‘PROVISIONAL_RAM’) as displayed the output of ‘rladmin status nodes’ command
- RS30165 - Fixed failover scenario that did not take place during node restart
- RS29250 - REST API documentation was updated to include the SFTP and Mount Point backup/export options
- RS27327 - Improved the backup timing when using the database parameter of ‘backup_interval_offset’ through the REST API
- RS33883 - HCSAN command in Active-Active Redis updated to return Integer instead of a String.
- Fixed a limitation so Redis 5 and Redis 4 can be selected as the Redis version to use CRDB and RoF

## Known limitations

### Upgrade

- [RS 5.4.2]({{< relref "/operate/rs/release-notes/legacy-release-notes/rs-5-4-2-april-2019.md" >}}) introduced new Active-Active Redis (CRDB) capabilities
    that improve its compatibility with open source Redis.
    Now the string data-type in Active-Active Redis (CRDB) is implicitly and dynamically typed, just like open source Redis.
    To use the new capabilities on nodes that are upgraded from version RS 5.4.2 or lower,
    you must [upgrade the CRDB protocol]({{< relref "/operate/rs/installing-upgrading/upgrading#upgrading-crdbs" >}}).
- Before you upgrade a database with RediSearch Module to Redis 5.0,
    you must [upgrade the RediSearch Module](https://docs.redis.com/latest/modules/install/upgrade-module) to version 1.4.2 or above.
- Node upgrade fails if the SSL certificates were configured in version 5.0.2 or above
    by manually updating the certificates on the disk instead of [updating them through the API](https://docs.redis.com/latest/rs/administering/cluster-operations/updating-certificates).
    For assistance with this issue, [contact Redis support](https://redislabs.com/company/support/).
- We recommend that you test module upgrade commands in a test environment before you upgrade modules in a production environment.
    The module upgrade arguments are not validated during the upgrade process and incorrect arguments can cause unexpected downtime.
- Starting from RS 5.4.2, to preserve the current Redis major.minor version during database upgrade you must use the `keep_redis_version` option instead of `keep_current_version`.

### Cluster API

- The API for removing a node is updated in RS 5.4.2 or higher. The API call must include json data and the "Content-Type: application/json" header. For example:

    `curl -X POST -H "Content-Type: application/json" -i -k -u user@redislabs.com:password https://localhost:9443/v1/nodes/3/actions/remove --data "{}"`

### Discovery service

- For [Redis Sentinel (Discovery Service)]({{< relref "/operate/rs/databases/durability-ha/discovery-service.md" >}}), every database name must be unique across the cluster.

### Redis commands

- The capability of disabling specific Redis commands does not work on commands specific to Redis Modules.
- The CLIENT ID command cannot guarantee incremental IDs between clients that connect to different nodes under multi proxy policies.
- CLIENT UNBLOCK command is not supported in RS 5.4 and above
- Starting from RS 5.4.2 and after upgrading the CRDB, TYPE command for string data-type in CRDBs return "string" (OSS Redis standard).
