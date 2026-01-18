---
Title: rladmin upgrade
alwaysopen: false
categories:
- docs
- operate
- rs
description: Upgrades a database's Redis version and modules.
headerRange: '[1-2]'
linkTitle: upgrade
toc: 'true'
weight: $weight
---

## `upgrade db`

Schedules a restart of the primary and replica processes of a database and then upgrades the database to the latest version of Redis.

For more information, see [Upgrade an existing Redis Software Deployment]({{< relref "/operate/rs/installing-upgrading/upgrading" >}}).

```sh
rladmin upgrade db { db:<id> | <name> }
                [ preserve_roles ]
                [ keep_redis_version ]
                [ discard_data ]
                [ force_discard ]
                [ parallel_shards_upgrade ]
                [ keep_crdt_protocol_version ]
                [ redis_version <version> ]
                [ force ]
                [ and module module_name <module name> version <version> module_args <arguments string> ]
```

As of v6.2.4, the default behavior for `upgrade db` has changed.  It is now controlled by a new parameter that sets the default upgrade policy used to create new databases and to upgrade ones already in the cluster.  To learn more, see [`tune cluster default_redis_version`]({{< relref "/operate/rs/references/cli-utilities/rladmin/tune#tune-cluster" >}}).

As of Redis Enterprise Software version 7.8.2, `upgrade db` will always upgrade modules.

### Parameters

| Parameters                 | Type/Value               | Description                                                                                                            |
|----------------------------|--------------------------|------------------------------------------------------------------------------------------------------------------------|
| db                         | db:\<id\> <br />name     | Database to upgrade                                                                                                    |
| and module | [upgrade module](#upgrade-module) command | Clause that allows the upgrade of a database and a specified Redis module in a single step with only one restart (can be specified multiple times). Deprecated as of Redis Enterprise Software v7.8.2.  |
| discard_data               |                          | Indicates that data will not be saved after the upgrade                                                                |
| force                      |                          | Forces upgrade and skips warnings and confirmations                                                                    |
| force_discard              |                          | Forces `discard_data` if replication or persistence is enabled                                                   |
| keep_crdt_protocol_version |                          | Keeps the current CRDT protocol version                                                                                |
| keep_redis_version       |                          | Upgrades to a new patch release, not to the latest major.minor version. Deprecated as of Redis Enterprise Software v7.8.2. To upgrade modules without upgrading the Redis database version, set `redis_version` to the current Redis database version instead. |
| parallel_shards_upgrade    | integer <br />'all'        | Maximum number of shards to upgrade all at once                                                                        |
| preserve_roles             |                          | Performs an additional failover to guarantee the shards' roles are preserved                                             |
| redis_version              | Redis version            | Upgrades the database to the specified version instead of the latest version                                               |

### Returns

Returns `Done` if the upgrade completed. Otherwise, it returns an error.

### Example

```sh
$ rladmin upgrade db db:5
Monitoring e39c8e87-75f9-4891-8c86-78cf151b720b
active - SMUpgradeBDB init
active - SMUpgradeBDB check_slaves
.active - SMUpgradeBDB prepare
active - SMUpgradeBDB stop_forwarding
oactive - SMUpgradeBDB start_wd
active - SMUpgradeBDB wait_for_version
.completed - SMUpgradeBDB
Done
```
