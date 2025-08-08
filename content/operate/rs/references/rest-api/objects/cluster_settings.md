---
Title: Cluster settings object
alwaysopen: false
categories:
- docs
- operate
- rs
description: An object for cluster resource management settings
linkTitle: cluster_settings
weight: $weight
---

Cluster resources management policy

| Name | Type/Value | Description |
|------|------------|-------------|
| acl_pubsub_default | `resetchannels`<br /> `allchannels` | Default pub/sub ACL rule for all databases in the cluster:<br />•`resetchannels` blocks access to all channels (restrictive)<br />•`allchannels` allows access to all channels (permissive) |
| auto_recovery | boolean (default:&nbsp;false) | Defines whether to use automatic recovery after shard failure |
| automatic_node_offload | boolean (default:&nbsp;true) | Defines whether the cluster will automatically migrate shards from a node, in case the node is overbooked |
| bigstore_migrate_node_threshold | integer | Minimum free memory (excluding reserved memory) allowed on a node before automatic migration of shards from it to free more memory |
| bigstore_migrate_node_threshold_p | integer | Minimum free memory (excluding reserved memory) allowed on a node before automatic migration of shards from it to free more memory |
| bigstore_provision_node_threshold | integer | Minimum free memory (excluding reserved memory) allowed on a node before new shards can no longer be added to it |
| bigstore_provision_node_threshold_p | integer | Minimum free memory (excluding reserved memory) allowed on a node before new shards can no longer be added to it |
| data_internode_encryption | boolean | Enable/deactivate encryption of the data plane internode communication |
| db_conns_auditing | boolean | [Audit connections]({{< relref "/operate/rs/security/audit-events" >}}) for new databases by default if set to true. |
| default_bigstore_version | **`1`**<br />`2` | Determines the default value of new databases' `bigstore_version`:<br />• `1` for Auto Tiering (Redis on Flash version 1). Default version.<br/>• `2` for Redis Flex (Redis on Flash version 2) on databases that support it. Can only be used with the `speedb` driver. |
| default_concurrent_restore_actions | integer | Default number of restore actions allowed at the same time. Set to 0 to allow any number of simultaneous restore actions. |
| default_fork_evict_ram | boolean | If true, the bdbs should evict data from RAM to ensure successful replication or persistence |
| default_non_sharded_proxy_policy | `single`<br /><br />`all-master-shards`</nobr><br /><br />`all-nodes` | Default proxy_policy for newly created non-sharded databases' endpoints |
| default_oss_sharding | boolean (default: false) | Default hashing policy to use for new databases. This field is for future use only and should not be changed. |
| default_oss_cluster | boolean (default: false) | Default `oss_cluster` setting for new databases. Enables the OSS Cluster API if `true`, or turns it off if `false`. |
| default_provisioned_redis_version | string | Default Redis version |
| default_sharded_proxy_policy | `single`<br /><br />`all-master-shards`<br /><br />`all-nodes` | Default proxy_policy for newly created sharded databases' endpoints |
| default_shards_placement | `dense`<br />`sparse` | Default shards_placement for a newly created databases |
| default_tracking_table_max_keys_policy | integer (default: 1000000) | Defines the default value of the client-side caching invalidation table size for new databases. 0 makes the cache unlimited. |
| endpoint_rebind_propagation_grace_time | integer | Time to wait between the addition and removal of a proxy |
| expose_hostnames_for_all_suffixes | boolean (default: false) | If true, enables exposing hostnames for non-default DNS suffixes |
| failure_detection_sensitivity | `high`<br />`low` | Predefined thresholds and timeouts for failure detection (previously known as <span class="break-all">`watchdog_profile`</span>)<br />• `high` (previously `local-network`) – high failure detection sensitivity, lower thresholds, faster failure detection and failover<br />• `low` (previously `cloud`) – low failure detection sensitivity, higher tolerance for latency variance (also called network jitter) |
| hide_user_data_from_log | boolean (default: false) | Set to `true` to enable the `hide-user-data-from-log` Redis configuration setting, which avoids logging user data |
| login_lockout_counter_reset_after | integer | Number of seconds that must elapse between failed sign in attempts before the lockout counter is reset to 0. |
| login_lockout_duration | integer | Duration (in secs) of account lockout. If set to 0, the account lockout will persist until released by an admin. |
| login_lockout_threshold | integer | Number of failed sign in attempts allowed before locking a user account |
| max_redis_forks | integer (default: 0) | Maximum number of background processes forked from shards that can exist on the node at any given time. 0 means unlimited. |
| max_saved_events_per_type | integer | Maximum saved events per event type |
| max_simultaneous_backups | integer (default: 4) | Maximum number of backup processes allowed at the same time |
| metrics_exporter_expose_bdb_name | boolean (default: false) | If true, adds a label with the database name to relevant metrics |
| parallel_shards_upgrade | integer | Maximum number of shards to upgrade in parallel |
| max_slave_full_syncs | integer (default: 0) | Maximum number of simultaneous replica full syncs that can run at any given time. 0 means unlimited. |
| persistence_cleanup_scan_interval | string | [CRON expression](https://en.wikipedia.org/wiki/Cron#CRON_expression) that defines the Redis cleanup schedule |
| persistent_node_removal | boolean | When removing a node, wait for persistence files to be created for all migrated shards |
| rack_aware | boolean | Cluster operates in a rack-aware mode |
| redis_migrate_node_threshold | integer | Minimum free memory (excluding reserved memory) allowed on a node before automatic migration of shards from it to free more memory |
| redis_migrate_node_threshold_p | integer | Minimum free memory (excluding reserved memory) allowed on a node before automatic migration of shards from it to free more memory |
| redis_provision_node_threshold | integer | Minimum free memory (excluding reserved memory) allowed on a node before new shards can no longer be added to it |
| redis_provision_node_threshold_p | integer | Minimum free memory (excluding reserved memory) allowed on a node before new shards can no longer be added to it |
| redis_upgrade_policy | **`major`** <br />`latest` | Create/upgrade Redis Enterprise software on databases in the cluster by compatibility with major versions or latest versions of Redis Open Source |
| resp3_default | boolean (default:&nbsp;true) | Determines the default value of the `resp3` option upon upgrading a database to version 7.2 |
| shards_overbooking | boolean | If true, all databases' memory_size is ignored during shards placement |
| show_internals | boolean | Show internal databases (and their shards and endpoints) REST APIs |
| slave_ha | boolean | Enable the replica high-availability mechanism. Deprecated as of Redis Enterprise Software v7.2.4. |
| slave_ha_bdb_cooldown_period | integer | Time in seconds between runs of the replica high-availability mechanism on different nodes on the same database |
| slave_ha_cooldown_period | integer | Time in seconds between runs of the replica high-availability mechanism on different nodes on the same database |
| slave_ha_grace_period | integer | Time in seconds between a node failure and when the replica high-availability mechanism starts relocating shards |
