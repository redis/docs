---
Title: rladmin upgrade
alwaysopen: false
categories:
- docs
- operate
- rs
description: Upgrades the version of a module or Redis Enterprise Software for a database.
headerRange: '[1-2]'
linkTitle: upgrade
toc: 'true'
weight: $weight
url: '/operate/rs/7.4/references/cli-utilities/rladmin/upgrade/'
---

Upgrades the version of a module or Redis Enterprise Software for a database.

## `upgrade db`

Schedules a restart of the primary and replica processes of a database and then upgrades the database to the latest version of Redis Enterprise Software.

For more information, see [Upgrade an existing Redis Software Deployment]({{< relref "/operate/rs/7.4/installing-upgrading/upgrading" >}}).

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
                [ { latest_with_modules | and module module_name <module name> version <version> module_args <arguments string> } ]
```

As of v6.2.4, the default behavior for `upgrade db` has changed.  It is now controlled by a new parameter that sets the default upgrade policy used to create new databases and to upgrade ones already in the cluster.  To learn more, see [`tune cluster default_redis_version`]({{< relref "/operate/rs/7.4/references/cli-utilities/rladmin/tune#tune-cluster" >}}).

### Parameters

| Parameters                 | Type/Value               | Description                                                                                                            |
|----------------------------|--------------------------|------------------------------------------------------------------------------------------------------------------------|
| db                         | db:\<id\> <br />name     | Database to upgrade                                                                                                    |
| and module | [upgrade module](#upgrade-module) command | Clause that allows the upgrade of a database and a specified Redis module in a single step with only one restart (can be specified multiple times)  |
| discard_data               |                          | Indicates that data will not be saved after the upgrade                                                                |
| force                      |                          | Forces upgrade and skips warnings and confirmations                                                                    |
| force_discard              |                          | Forces `discard_data` if replication or persistence is enabled                                                   |
| keep_crdt_protocol_version |                          | Keeps the current CRDT protocol version                                                                                |
| keep_redis_version       |                          | Upgrades to a new patch release, not to the latest major.minor version                                                 |
| latest_with_modules        |                          | Upgrades the Redis Enterprise Software version and all modules in the database                                                             |
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

## `upgrade module`

Upgrades Redis modules in use by a specific database.

For more information, see [Upgrade modules]({{< relref "/operate/oss_and_stack/stack-with-enterprise/install/upgrade-module" >}}).

```sh
rladmin upgrade module
        db_name { db:<id> | <name> }
        module_name <mod_name>
        version <version>
        module_args <args_str>
```

### Parameters

| Parameters                 | Type/Value               | Description                                                                                                            |
|----------------------------|--------------------------|------------------------------------------------------------------------------------------------------------------------|
| db_name                    | db:\<id\> <br />name     | Upgrade a module for the specified database                                                                                     |
| module_name                | 'ReJSON'<br />'graph'<br />'search'<br />'bf'<br />'rg'<br />'timeseries' | Redis module to upgrade                                       |
| version                    | module version number    | Upgrades the module to the specified version                                                                               |
| module_args                | 'keep_args'<br />string    | Module configuration options                                                                                                       |

For more information about module configuration options, see [Module configuration options]({{< relref "/operate/oss_and_stack/stack-with-enterprise/install/add-module-to-database#module-configuration-options" >}}).

### Returns

Returns `Done` if the upgrade completed. Otherwise, it returns an error.

### Example

```sh
$ rladmin upgrade module db_name db:8 module_name graph version 20812 module_args ""
Monitoring 21ac7659-e44c-4cc9-b243-a07922b2a6cc
active - SMUpgradeBDB init
active - SMUpgradeBDB wait_for_version
Ocompleted - SMUpgradeBDB
Done
```
