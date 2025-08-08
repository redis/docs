---
Title: rladmin tune
alwaysopen: false
categories:
- docs
- operate
- rs
description: Configures parameters for databases, proxies, nodes, and clusters.
headerRange: '[1-2]'
linkTitle: tune
toc: 'true'
weight: $weight
---

Configures parameters for databases, proxies, nodes, and clusters.

## `tune cluster`

Configures cluster parameters.

``` sh
rladmin tune cluster
        [ repl_diskless { enabled | disabled } ]
        [ redis_provision_node_threshold <size> ]
        [ redis_migrate_node_threshold <size> ]
        [ redis_provision_node_threshold_percent <percent> ]
        [ redis_migrate_node_threshold_percent <percent> ]
        [ max_simultaneous_backups <number> ]
        [ failure_detection_sensitivity { high | low } ]
        [ watchdog_profile { cloud | local-network } ]
        [ slave_ha { enabled | disabled } ]
        [ slave_ha_grace_period <seconds> ]
        [ slave_ha_cooldown_period <seconds> ]
        [ slave_ha_bdb_cooldown_period <seconds> ]
        [ max_saved_events_per_type <value> ]
        [ metrics_exporter_expose_bdb_name { enabled | disabled } ]
        [ parallel_shards_upgrade <value> ]
        [ default_concurrent_restore_actions <value> ]
        [ show_internals { enabled | disabled } ]
        [ expose_hostnames_for_all_suffixes { enabled | disabled } ]
        [ redis_upgrade_policy { latest | major } ]
        [ default_redis_version <value> ]
        [ default_non_sharded_proxy_policy { single | all-master-shards | all-nodes } ]
        [ default_sharded_proxy_policy { single | all-master-shards | all-nodes } ]
        [ default_shards_placement { dense | sparse } ]
        [ data_internode_encryption { enabled | disabled } ]
        [ db_conns_auditing { enabled | disabled } ]
        [ acl_pubsub_default { resetchannels | allchannels } ]
        [ resp3_default { enabled | disabled } ]
        [ automatic_node_offload { enabled | disabled } ]
        [ default_tracking_table_max_keys_policy <value> ]
        [ default_oss_sharding { enabled | disabled } ]
 ]
```

### Parameters

| Parameters                             | Type/Value                        | Description                                                                                                                  |
|----------------------------------------|-----------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| acl_pubsub_default | `resetchannels`<br /> `allchannels` | Default pub/sub ACL rule for all databases in the cluster:<br />•`resetchannels` blocks access to all channels (restrictive)<br />•`allchannels` allows access to all channels (permissive) |
| automatic_node_offload | `enabled`<br />`disabled` | Define whether automatic node offload migration will take place |
| data_internode_encryption              | `enabled`<br />`disabled`       | Activates or deactivates [internode encryption]({{< relref "/operate/rs/security/encryption/internode-encryption" >}}) for new databases    |
| db_conns_auditing                      | `enabled`<br /> `disabled`      | Activates or deactivates [connection auditing]({{< relref "/operate/rs/security/audit-events" >}}) by default for new databases of a cluster                                                                  |
| default_concurrent_restore_actions     | integer<br />`all`              | Default number of concurrent actions when restoring a node from a snapshot (positive integer or "all")                         |
| default_non_sharded_proxy_policy | `single`<br /><br />`all-master-shards`<br /><br />`all-nodes` | Default [proxy policy]({{< relref "/operate/rs/databases/configure/proxy-policy" >}}) for newly created non-sharded databases' endpoints |
| default_oss_sharding | `enabled`<br />`disabled` | Default hashing policy to use for new databases. Set to `disabled` by default. This field is for future use only and should not be changed. |
| default_redis_version                  | version number                    | The default Redis database compatibility version used to create new databases.<br/><br/>  The value parameter should be a version number in the form of "x.y" where _x_ represents the major version number and _y_ represents the minor version number.  The final value corresponds to the desired version of Redis.<br/><br/>You cannot set _default_redis_version_ to a value higher than that supported by the current _redis_upgrade_policy_ value. |
| default_sharded_proxy_policy | `single`<br /><br />`all-master-shards`<br /><br />`all-nodes` | Default [proxy policy]({{< relref "/operate/rs/databases/configure/proxy-policy" >}}) for newly created sharded databases' endpoints |
| default_shards_placement | `dense`<br />`sparse` | New databases place shards according to the default [shard placement policy]({{< relref "/operate/rs/databases/memory-performance/shard-placement-policy" >}}) |
| default_tracking_table_max_keys_policy | integer (default: 1000000) | Defines the default value of the client-side caching invalidation table size for new databases. 0 makes the cache unlimited. |
| expose_hostnames_for_all_suffixes      | `enabled`<br />`disabled`       | Exposes hostnames for all DNS suffixes                                                                                       |
| failure_detection_sensitivity | `high`<br />`low` | Predefined thresholds and timeouts for failure detection (previously known as `watchdog_profile`)<br />• `high` (previously `local-network`) – high failure detection sensitivity, lower thresholds, faster failure detection and failover<br />• `low` (previously `cloud`) – low failure detection sensitivity, higher tolerance for latency variance (also called network jitter) |
| login_lockout_counter_reset_after      | time in seconds                   | Time after failed login attempt before the counter resets to 0                                                                   |
| login_lockout_duration                 | time in seconds                   | Time a locked account remains locked ( "0" means only an admin can unlock the account)                                   |
| login_lockout_threshold                | integer                           | Number of failed sign-in attempts to trigger locking a user account ("0" means never lock the account)                   |
| max_saved_events_per_type              | integer                           | Maximum number of events each type saved in CCS per object type                                                              |
| max_simultaneous_backups               | integer (default: 4)                      | Number of database backups allowed to run at the same time. Combines with `max_redis_forks` (set by [`tune node`](#tune-node)) to determine the number of shard backups allowed to run simultaneously.                                                                                  |
| metrics_exporter_expose_bdb_name       | `enabled`<br />`disabled`       | If enabled, adds a label with the database name to relevant metrics                                                          |
| parallel_shards_upgrade                | integer<br />`all`              | Number of shards upgraded in parallel during DB upgrade (positive integer or "all")                                          |
| redis_migrate_node_threshold           | size in MB                        | Memory (in MBs by default or can be specified) needed to migrate a database between nodes                                   |
| redis_migrate_node_threshold_percent   | percentage                | Memory (in percentage) needed to migrate a database between nodes                                                            |
| redis_provision_node_threshold         | size in MB                        | Memory (in MBs by default or can be specified) needed to provision a new database                                           |
| redis_provision_node_threshold_percent | percentage                | Memory (in percentage) needed to provision a new database                                                                    |
| redis_upgrade_policy                   | `latest`<br />`major`           | When you upgrade or create a new Redis database, this policy determines which version of Redis database compatibility is used.<br /><br />Supported values are:<ul><li><p>`latest`, which applies the most recent Redis compatibility update \(_effective default prior to v6.2.4_)<p></li><li>`major`, which applies the most recent major release compatibility update (_default as of v6.2.4_).</li></ul>                                                                                                                 |
| repl_diskless                          | `enabled`<br />`disabled`       | Activates or deactivates diskless replication (can be overridden per database)                                              |
| resp3_default | `enabled` <br /> `disabled` | Determines the default value of the `resp3` option upon upgrading a database to version 7.2 (defaults to `enabled`) |
| show_internals                         | `enabled`<br />`disabled`       | Controls the visibility of internal databases that are only used for the cluster's management                                |
| slave_ha                               | `enabled` <br /> `disabled`   | Activates or deactivates [replica high availability]({{< relref "/operate/rs/databases/configure/replica-ha" >}}) in the cluster<br />(enabled by default; use [`rladmin tune db`](#tune-db) to change `slave_ha` for a specific database)<br /><br />Deprecated as of Redis Enterprise Software v7.2.4. |
| slave_ha_bdb_cooldown_period           | time in seconds (default: 7200) | Time (in seconds) a database must wait after its shards are relocated by [replica high availability]({{< relref "/operate/rs/databases/configure/replica-ha" >}}) before it can go through another shard migration if another node fails (default is 2 hours) |
| slave_ha_cooldown_period               | time in seconds (default: 3600) | Time (in seconds) [replica high availability]({{< relref "/operate/rs/databases/configure/replica-ha" >}}) must wait after relocating shards due to node failure before performing another shard migration for any database in the cluster (default is 1 hour) |
| slave_ha_grace_period                  | time in seconds (default: 600) | Time (in seconds) between when a node fails and when [replica high availability]({{< relref "/operate/rs/databases/configure/replica-ha" >}}) starts relocating shards to another node      |
| watchdog_profile                       | `cloud` <br /> `local-network` | Watchdog profiles with preconfigured thresholds and timeouts (deprecated as of Redis Enterprise Software v6.4.2-69; use <span class="break-all">`failure_detection_sensitivity`</span> instead)<br />• `cloud` is suitable for common cloud environments and has a higher tolerance for latency variance (also called network jitter).<br />• `local-network` is suitable for dedicated LANs and has better failure detection and failover times. |

### Returns

Returns `Finished successfully` if the cluster configuration was changed. Otherwise, it returns an error.

Use [`rladmin info cluster`]({{< relref "/operate/rs/references/cli-utilities/rladmin/info#info-cluster" >}}) to verify the cluster configuration was changed.

### Example

``` sh
$ rladmin tune cluster slave_ha enabled
Finished successfully
$ rladmin info cluster | grep slave_ha
    slave_ha: enabled
```

## `tune db`

Configures database parameters.

``` sh
rladmin tune db { db:<id> | <name> }
        [ slave_buffer <auto | valueMB | hard:soft:time> ]
        [ client_buffer <value> ]
        [ repl_backlog <valueMB | auto> ]
        [ crdt_repl_backlog <valueMB | auto> ]
        [ repl_timeout <seconds> ]
        [ repl_diskless { enabled | disabled | default } ]
        [ master_persistence { enabled | disabled } ]
        [ maxclients <value> ]
        [ schedpolicy { cmp | mru | spread | mnp } ]
        [ max_shard_pipeline <value> ]
        [ conns <value> ]
        [ conns_type <value> ]
        [ max_client_pipeline <value> ]
        [ max_connections <value> ]
        [ max_aof_file_size <size> ]
        [ max_aof_load_time <seconds> ]
        [ oss_cluster { enabled | disabled } ]
        [ oss_cluster_api_preferred_ip_type <value> ]
        [ slave_ha { enabled | disabled } ]
        [ slave_ha_priority <value> ]
        [ skip_import_analyze { enabled | disabled } ]
        [ mkms { enabled | disabled } ]
        [ continue_on_error ]
        [ gradual_src_mode { enabled | disabled } ]
        [ gradual_sync_mode { enabled | disabled | auto } ]
        [ gradual_sync_max_shards_per_source <value> ]
        [ module_name <value> ] [ module_config_params <value> ]
        [ crdt_xadd_id_uniqueness_mode { liberal | semi-strict | strict } ]
        [ metrics_export_all { enabled | disabled } ]
        [ syncer_mode { distributed | centralized }]
        [ syncer_monitoring { enabled | disabled } ]
        [ mtls_allow_weak_hashing { enabled | disabled } ]
        [ mtls_allow_outdated_cert { enabled | disabled } ]
        [ data_internode_encryption { enabled | disabled } ]
        [ db_conns_auditing { enabled | disabled } ]
        [ resp3 { enabled | disabled } ]
        [ tracking_table_max_keys <size> ]
```

### Parameters

| Parameter                            | Type/Value                       | Description                                                                                                                           |
|--------------------------------------|----------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| db:id                                | integer                          | ID of the specified database                                                                                                          |
| name                                 | string                           | Name of the specified database                                                                                                        |
| client_buffer                        | value in MB hard:soft:time       | Redis client output buffer limits                                                                                                     |
| conns                                | integer                          | Size of internal connection pool, specified per-thread or per-shard depending on conns_type                                           |
| conns_type                           | `per-thread`<br /> `per-shard`   | Specifies connection pool size as either per-thread or per-shard                                                                      |
| continue_on_error                    |                                  | Flag that skips tuning shards that can't be reached                                                                                   |
| crdt_repl_backlog                    | value in MB<br /> `auto`         | Size of the Active-Active replication buffer                                                                                          |
| crdt_xadd_id_uniqueness_mode         | `liberal`<br /> `semi-strict`<br /> `strict` | XADD's behavior in an Active-Active database, defined as liberal, semi-strict, or strict (see descriptions below)         |
| data_internode_encryption            | `enabled`<br /> `disabled`       | Activates or deactivates [internode encryption]({{< relref "/operate/rs/security/encryption/internode-encryption" >}}) for the database               |
| db_conns_auditing                    | `enabled`<br /> `disabled`       | Activates or deactivates database [connection auditing]({{< relref "/operate/rs/security/audit-events" >}}) for a database                                                                 |
| gradual_src_mode                     | `enabled`<br /> `disabled`       | Activates or deactivates gradual sync of sources                                                                                      |
| gradual_sync_max_shards_per_source   | integer                          | Number of shards per sync source that can be replicated in parallel (positive integer)                                                |
| gradual_sync_mode                    | `enabled`<br /> `disabled`<br /> `auto` | Activates, deactivates, or automatically determines gradual sync of source shards                                              |
| master_persistence                   | `enabled`<br /> `disabled`       | If enabled, persists the primary shard in addition to replica shards in a replicated and persistent database. |
| max_aof_file_size                    | size in MB                       | Maximum size (in MB, if not specified) of [AoF]({{< relref "/glossary/_index.md#letter-a" >}}) file (minimum value is 10 GB)              |
| max_aof_load_time | time in seconds | Time limit in seconds to load a shard from an append-only file (AOF). If exceeded, an AOF rewrite is initiated to decrease future load time.<br />Minimum: 2700 seconds (45 minutes) <br />Default: 3600 seconds (1 hour) |
| max_client_pipeline                  | integer                          | Maximum commands in the proxy's pipeline per client connection (max value is 2047, default value is 200)                              |
| max_connections                      | integer                          | Maximum client connections to the database's endpoint (default value is 0, which is unlimited)                                            |
| max_shard_pipeline                   | integer                          | Maximum commands in the proxy's pipeline per shard connection (default value is 200)                                                  |
| maxclients                           | integer                          | Controls the maximum client connections between the proxy and shards (default value is 10000)                                         |
| metrics_export_all                   | `enabled`<br /> `disabled`       | Activates the exporter to expose all shard metrics                                                                                    |
| mkms                                 | `enabled`<br /> `disabled`       | Activates multi-key multi-slot commands                                                                                               |
| module_config_params | string | Configures module arguments at runtime. Enclose `module_config_params` within quotation marks. |
| module_name | `search`<br />`ReJSON`<br />`graph`<br />`timeseries`<br />`bf`<br />`rg` | The module to configure with `module_config_params` |
| mtls_allow_outdated_cert             | `enabled`<br /> `disabled`       | Activates outdated certificates in mTLS connections                                   |
| mtls_allow_weak_hashing              | `enabled`<br /> `disabled`       | Activates weak hashing (less than 2048 bits) in mTLS connections                       |
| oss_cluster                          | `enabled`<br /> `disabled`       | Activates OSS cluster API                                                                                                             |
| oss_cluster_api_preferred_ip_type    | `internal`<br /> `external`      | IP type for the endpoint and database in the OSS cluster API (default is internal)                                     |
| repl_backlog                         | size in MB<br /> `auto`          | Size of the replication buffer                                                                                        |
| repl_diskless                        | `enabled`<br /> `disabled`<br /> `default`   | Activates or deactivates diskless replication (defaults to the cluster setting)                                          |
| repl_timeout                         | time in seconds                  | Replication timeout (in seconds)                                                                                                      |
| resp3 | `enabled`<br /> `disabled` | Enables or deactivates RESP3 support (defaults to `enabled`) |
| schedpolicy                          | `cmp`<br /> `mru`<br /> `spread`<br /> `mnp` | Controls how server-side connections are used when forwarding traffic to shards                                           |
| skip_import_analyze                  | `enabled`<br /> `disabled`       | Skips the analyzing step when importing a database                                                                                    |
| slave_buffer                         | `auto`<br />value in MB<br /> hard:soft:time | Redis replica output buffer limits<br />• `auto`: dynamically adjusts the buffer limit based on the shard’s current used memory<br />• value in MB: sets the buffer limit in MB<br />• hard:soft:time: sets the hard limit (maximum buffer size in MB), soft limit in MB, and the time in seconds that the soft limit can be exceeded |
| slave_ha                             | `enabled`<br /> `disabled`       | Activates or deactivates replica high availability (defaults to the cluster setting)                                                      |
| slave_ha_priority                    | integer                          | Priority of the database in the replica high-availability mechanism                                                                           |
| syncer_mode                          | `distributed`<br /> `centralized`| Configures syncer to run in distributed or centralized mode. For distributed syncer, the DMC policy must be all-nodes or all-master-nodes |
| syncer_monitoring                    | `enabled`<br /> `disabled`       | Activates syncer monitoring                                                                                                           |
| tracking_table_max_keys | integer | The client-side caching invalidation table size. 0 makes the cache unlimited. |

| XADD behavior mode | Description |
| - | - |
| liberal | XADD succeeds with any valid ID (not recommended, allows duplicate IDs) |
| semi-strict | Allows a full ID. Partial IDs are completed with the unique database instance ID (not recommended, allows duplicate IDs). |
| strict | XADD fails if a full ID is given. Partial IDs are completed using the unique database instance ID. |

### Returns

Returns `Finished successfully` if the database configuration was changed. Otherwise, it returns an error.

Use [`rladmin info db`]({{< relref "/operate/rs/references/cli-utilities/rladmin/info#info-db" >}}) to verify the database configuration was changed.

### Example

``` sh
$ rladmin tune db db:4 repl_timeout 300
Tuning database: o
Finished successfully
$ rladmin info db db:4 | grep repl_timeout
  repl_timeout: 300 seconds
```

## `tune node`

Configures node parameters.

``` sh
tune node  { <id> | all }
     [ max_listeners <value> ]
     [ max_redis_forks <value> ]
     [ max_redis_servers <value> ]
     [ max_slave_full_syncs <value> ]
     [ quorum_only { enabled | disabled } ]
```

### Parameters

| Parameter            | Type/Value | Description                                                                                                                      |
|----------------------|------------|----------------------------------------------------------------------------------------------------------------------------------|
| id                   | integer    | ID of the specified node                                                                                                         |
| all                  |            | Configures settings for all nodes                                                                                                |
| max_listeners        | integer    | Maximum number of endpoints that may be bound to the node                                                                        |
| max_redis_forks      | integer    | Maximum number of background processes forked from shards that may exist on the node at any given time                           |
| max_redis_servers    | integer    | Maximum number of shards allowed to reside on the node                                                                           |
| max_slave_full_syncs | integer    | Maximum number of simultaneous replica full-syncs that may be running at any given time (0: Unlimited, -1: Use cluster settings) |
| quorum_only          | `enabled`<br /> `disabled` | If activated, configures the node as a [quorum-only node]({{< relref "/glossary/_index.md#letter-p" >}})                         |

### Returns

Returns `Finished successfully` if the node configuration was changed. Otherwise, it returns an error.

Use [`rladmin info node`]({{< relref "/operate/rs/references/cli-utilities/rladmin/info#info-node" >}}) to verify the node configuration was changed.

### Example

``` sh
$ rladmin tune node 3 max_redis_servers 120
Finished successfully
$ rladmin info node 3 | grep "max redis servers"
    max redis servers: 120
```

## `tune proxy`

Configures proxy parameters.

``` sh
rladmin tune proxy { <id> | all }
        [ mode { static | dynamic } ]
        [ threads <value> ]
        [ max_threads <value> ]
        [ scale_threshold <value> ]
        [ scale_duration <seconds> ]
```

### Parameters

| Parameter       | Type/Value                 | Description                                                                         |
|-----------------|----------------------------|-------------------------------------------------------------------------------------|
| id              | integer                    | ID of the specified proxy                                                           |
| all             |                            | Configures settings for all proxies                                                 |
| client_eviction | boolean (default: false) | If `true,`, enables client eviction based on `maxmemory_clients`. |
| incoming_connections_capacity | integer (default: 0) | The maximum number of concurrent incoming connections, also known as the maximum burst size. The default is 0, which means no limit. |
| incoming_connections_min_capacity | integer (default: 10) | The minimum number of free slots required before accepting new connections after an overflow. |
| incoming_connections_rate_limit | integer (default: 0) | The maximum number of incoming connections per second. The default is 0, which means no limit. |
| max_threads     | integer, (range:&nbsp;1-255) | Maximum number of threads allowed                                                   |
| mode            | `static`<br /> `dynamic` | Determines if the proxy automatically adjusts the number of threads based on load size  |
| scale_duration  | time in seconds, (range:&nbsp;10-300) | Time of scale_threshold CPU utilization before the automatic proxy automatically scales |
| scale_threshold | percentage, (range:&nbsp;50-99) | CPU utilization threshold that triggers spawning new threads                        |
| threads         | integer, (range:&nbsp;1-255) | Initial number of threads created at startup                                        |

### Returns

Returns `OK` if the proxy configuration was changed. Otherwise, it returns an error.

Use [`rladmin info proxy`]({{< relref "/operate/rs/references/cli-utilities/rladmin/info#info-proxy" >}}) to verify the proxy configuration was changed.

### Example

``` sh
$ rladmin tune proxy 2 scale_threshold 75
Configuring proxies:
  - proxy:2: ok
$ rladmin info proxy 2 | grep scale_threshold
    scale_threshold: 75 (%)
```
