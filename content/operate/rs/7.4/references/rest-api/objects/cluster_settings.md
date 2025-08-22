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
url: '/operate/rs/7.4/references/rest-api/objects/cluster_settings/'
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
| db_conns_auditing | boolean | [Audit connections]({{< relref "/operate/rs/7.4/security/audit-events" >}}) for new databases by default if set to true. |
| default_concurrent_restore_actions | integer | Default number of restore actions allowed at the same time. Set to 0 to allow any number of simultaneous restore actions. |
| default_fork_evict_ram | boolean | If true, the bdbs should evict data from RAM to ensure successful replication or persistence |
| default_non_sharded_proxy_policy | `single`<br /><br />`all-master-shards`</nobr><br /><br />`all-nodes` | Default proxy_policy for newly created non-sharded databases' endpoints |
| default_provisioned_redis_version | string | Default Redis version |
| default_sharded_proxy_policy | `single`<br /><br />`all-master-shards`<br /><br />`all-nodes` | Default proxy_policy for newly created sharded databases' endpoints |
| default_shards_placement | `dense`<br />`sparse` | Default shards_placement for a newly created databases |
| diskless_repl | `yes`<br />`no` (default: `yes`) | If `yes`, enables the default Redis diskless replication mechanism |
| endpoint_rebind_propagation_grace_time | integer | Time to wait between the addition and removal of a proxy |
| evict_node_use_free_memory | boolean | When evicting a node, use the free memory instead of the provisional memory to check if the shards from the old node fit on the new one |
| expose_hostnames_for_all_suffixes | boolean (default: false) | If true, enables exposing hostnames for non-default DNS suffixes |
| failure_detection_sensitivity | `high`<br />`low` | Predefined thresholds and timeouts for failure detection (previously known as <span class="break-all">`watchdog_profile`</span>)<br />• `high` (previously `local-network`) – high failure detection sensitivity, lower thresholds, faster failure detection and failover<br />• `low` (previously `cloud`) – low failure detection sensitivity, higher tolerance for latency variance (also called network jitter) |
| hide_user_data_from_log | boolean (default: false) | Set to `true` to enable the `hide-user-data-from-log` Redis configuration setting, which avoids logging user data |
| login_lockout_counter_reset_after | integer | Number of seconds that must elapse between failed sign in attempts before the lockout counter is reset to 0. |
| login_lockout_duration | integer | Duration (in secs) of account lockout. If set to 0, the account lockout will persist until released by an admin. |
| login_lockout_threshold | integer | Number of failed sign in attempts allowed before locking a user account |
| master_healthcheck_api_auth | boolean (default: true) | Defines if authentication is required by the local `master_healthcheck` API |
| max_redis_forks | integer (default: 0) | Maximum number of background processes forked from shards that can exist on the node at any given time. 0 means unlimited. |
| max_saved_events_per_type | integer | Maximum saved events per event type |
| max_slave_full_syncs | integer (default: 0) | Maximum number of simultaneous replica full syncs that can run at any given time. 0 means unlimited. |
| max_simultaneous_backups | integer (default: 4) | Maximum number of backup processes allowed at the same time |
| oss_cluster_api_preferred_endpoint_type | `ip`<br />`hostname` (default: ip) | Determines the default endpoint type in the OSS Cluster API for new endpoints |
| oss_cluster_api_preferred_ip_type | `internal`<br />`external` (default: internal) | Determines the default IP type in the OSS Cluster API for new endpoints |
| parallel_shards_upgrade | integer | Maximum number of shards to upgrade in parallel |
| persistence_cleanup_grace_time | integer | Time in seconds before an unmodified file is considered to be stale and to be removed by persistence cleanup |
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
| show_metrics_during_state_machine | boolean | Show metrics during state machine operations |
| slave_ha | boolean | Enable the replica high-availability mechanism. Deprecated as of Redis Enterprise Software v7.2.4. |
| slave_ha_bdb_cooldown_period | integer | Time in seconds between runs of the replica high-availability mechanism on different nodes on the same database |
| slave_ha_cooldown_period | integer | Time in seconds between runs of the replica high-availability mechanism on different nodes on the same database |
| slave_ha_grace_period | integer | Time in seconds between a node failure and when the replica high-availability mechanism starts relocating shards |
| slow_log_max_len | integer (default: 1024) | Set max slow log entries in debug info |
