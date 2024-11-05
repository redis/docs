---
Title: Prometheus metrics v2
alwaysopen: false
categories:
- docs
- integrate
- rs
description: V2 metrics available to Prometheus as of Redis Enterprise Software version 7.8.0.
group: observability
linkTitle: Prometheus metrics v2
summary: V2 metrics available to Prometheus as of Redis Enterprise Software version 7.8.0.
type: integration
weight: 45
---

You can [integrate Redis Enterprise Software with Prometheus and Grafana]({{<relref "/integrate/prometheus-with-redis-enterprise/">}}) to create dashboards for important metrics.

The v2 metrics in the following tables are available as of Redis Enterprise Software version 7.8.0. For help transitioning from v1 metrics to v2 PromQL, see [Prometheus v1 metrics and equivalent v2 PromQL]({{<relref "/integrate/prometheus-with-redis-enterprise/prometheus-metrics-v1-to-v2">}}).

## Node metrics

| V2 metric | Description |
| :-------- | :---------- |
| <span class="break-all">node_available_flash_bytes</span> | Available flash in the node (bytes) |
| <span class="break-all">node_available_flash_no_overbooking_bytes</span> | Available flash in the node (bytes), without taking into account overbooking |
| <span class="break-all">node_available_memory_bytes</span> | Amount of free memory in the node (bytes) that is available for database provisioning |
| <span class="break-all">node_available_memory_no_overbooking_bytes</span> | Available RAM in the node (bytes) without taking into account overbooking |
| <span class="break-all">node_bigstore_free_bytes</span> | Sum of free space of back-end flash (used by flash database's [BigRedis]) on all cluster nodes (bytes); returned only when BigRedis is enabled |
| <span class="break-all">node_cert_expires_in_seconds</span> | Certificate expiration (in seconds) per given node; read more about [certificates in Redis Enterprise]({{< relref "/operate/rs/security/certificates" >}}) and [monitoring certificates]({{< relref "/operate/rs/security/certificates/monitor-certificates" >}}) |
| <span class="break-all">node_ephemeral_storage_avail_bytes</span> | Disk space available to RLEC processes on configured ephemeral disk (bytes) |
| <span class="break-all">node_ephemeral_storage_free_bytes</span> | Free disk space on configured ephemeral disk (bytes) |
| <span class="break-all">node_memory_MemFree_bytes</span> | Free memory in the node (bytes) |
| <span class="break-all">node_persistent_storage_avail_bytes</span> | Disk space available to RLEC processes on configured persistent disk (bytes) |
| <span class="break-all">node_persistent_storage_free_bytes</span> | Free disk space on configured persistent disk (bytes) |
| <span class="break-all">node_provisional_flash_bytes</span> | Amount of flash available for new shards on this node, taking into account overbooking, max Redis servers, reserved flash, and provision and migration thresholds (bytes) |
| <span class="break-all">node_provisional_flash_no_overbooking_bytes</span> | Amount of flash available for new shards on this node, without taking into account overbooking, max Redis servers, reserved flash, and provision and migration thresholds (bytes) |
| <span class="break-all">node_provisional_memory_bytes</span> | Amount of RAM that is available for provisioning to databases out of the total RAM allocated for databases |
| <span class="break-all">node_provisional_memory_no_overbooking_bytes</span> | Amount of RAM that is available for provisioning to databases out of the total RAM allocated for databases, without taking into account overbooking |
| <span class="break-all">node_metrics_up</span> | Node is part of the cluster and is connected |

## Cluster metrics

| V2 metric | Description |
| :-------- | :---------- |
| license_shards_limit | Total shard limit by the license by shard type (ram / flash) |

## Cluster watchdog metrics

| V2 metric | Type | Description |
| :-------- | :--- | :---------- |
| <span class="break-all">generation{cluster_wd=<node_uid>}</span> | gauge| Generation number of the specific cluster_wd|
| <span class="break-all">has_qourum{cluster_wd=<node_uid>, has_witness_disk=BOOL}</span> | gauge| Has_qourum = 1<br />No quorum = 0 |
| <span class="break-all">is_primary{cluster_wd=<node_uid>}</span> | gauge| primary = 1<br />secondary = 0 |
| <span class="break-all">total_live_nodes_count{cluster_wd=<node_uid>}</span> | gauge| Number of live nodes|
| <span class="break-all">total_node_count{cluster_wd=<node_uid>}</span> | gauge| Number of nodes |
| <span class="break-all">total_primary_selection_ended{cluster_wd=<node_uid>}</span> | counter | Monotonic counter for each selection process that ended |
| <span class="break-all">total_primary_selections{cluster_wd=<node_uid>}</span> | counter | Monotonic counter for each selection process that started|

## Latency histogram metrics

| V2 metric | Description |
| :-------- | :---------- |
| <span class="break-all">endpoint_other_requests_latency_histogram_bucket</span> | Latency histograms for commands other than read or write commands. Can be used to represent different latency percentiles.<br />p99.9 example:<br /><span class="break-all">`histogram_quantile(0.999, sum(rate(endpoint_other_requests_latency_histogram_bucket{cluster="$cluster", db="$db"}[$__rate_interval]) ) by (le, db))`</span> |
| <span class="break-all">endpoint_read_requests_latency_histogram_bucket</span> | Latency histograms for read commands. Can be used to represent different latency percentiles.<br />p99.9 example:<br /><span class="break-all">`histogram_quantile(0.999, sum(rate(endpoint_read_requests_latency_histogram_bucket{cluster="$cluster", db="$db"}[$__rate_interval]) ) by (le, db))`</span> |
| <span class="break-all">endpoint_write_requests_latency_histogram_bucket</span> | Latency histograms for write commands. Can be used to represent different latency percentiles.<br />p99.9 example:<br /><span class="break-all">`histogram_quantile(0.999, sum(rate(endpoint_write_requests_latency_histogram_bucket{cluster="$cluster", db="$db"}[$__rate_interval]) ) by (le, db))`</span> |

## Replication metrics

| V2 metric | Description |
| :-------- | :---------- |
| <span class="break-all">database_syncer_lag_ms</span> | Lag time between the source and the destination for traffic (ms) |
| <span class="break-all">database_syncer_current_status</span> | Syncer status for traffic; 0 = in-sync, 1 = syncing, 2 = out of sync |

## Shard metrics

| V2 metric | Description |
| :-------- | :---------- |
| <span class="break-all">redis_server_active_defrag_running</span> | Automatic memory defragmentation current aggressiveness (% cpu) |
| <span class="break-all">redis_server_allocator_active</span> | Total used memory, including external fragmentation |
| <span class="break-all">redis_server_allocator_allocated</span> | Total allocated memory |
| <span class="break-all">redis_server_allocator_resident</span> | Total resident memory (RSS) |
| <span class="break-all">redis_server_aof_last_cow_size</span> | Last AOFR, CopyOnWrite memory |
| <span class="break-all">redis_server_aof_rewrite_in_progress</span> | The number of simultaneous AOF rewrites that are in progress |
| <span class="break-all">redis_server_aof_rewrites</span> | Number of AOF rewrites this process executed |
| <span class="break-all">redis_server_aof_delayed_fsync</span> | Number of times an AOF fsync caused delays in the main Redis thread (inducing latency); this can indicate that the disk is slow or overloaded |
| <span class="break-all">redis_server_blocked_clients</span> | Count the clients waiting on a blocking call |
| <span class="break-all">redis_server_connected_clients</span> | Number of client connections to the specific shard |
| <span class="break-all">redis_server_connected_slaves</span> | Number of connected replicas |
| <span class="break-all">redis_server_db0_avg_ttl</span> | Average TTL of all volatile keys |
| <span class="break-all">redis_server_expired_keys</span> | Total count of volatile keys |
| <span class="break-all">redis_server_db0_keys</span> | Total key count |
| <span class="break-all">redis_server_evicted_keys</span> | Keys evicted so far (since restart) |
| <span class="break-all">redis_server_expire_cycle_cpu_milliseconds</span> | The cumulative amount of time spent on active expiry cycles |
| <span class="break-all">redis_server_expired_keys</span> | Keys expired so far (since restart) |
| <span class="break-all">redis_server_forwarding_state</span> | Shard forwarding state (on or off) |
| <span class="break-all">redis_server_keys_trimmed</span> | The number of keys that were trimmed in the current or last resharding process |
| <span class="break-all">redis_server_keyspace_read_hits</span> | Number of read operations accessing an existing keyspace |
| <span class="break-all">redis_server_keyspace_read_misses</span> | Number of read operations accessing a non-existing keyspace |
| <span class="break-all">redis_server_keyspace_write_hits</span> | Number of write operations accessing an existing keyspace |
| <span class="break-all">redis_server_keyspace_write_misses</span> | Number of write operations accessing a non-existing keyspace |
| <span class="break-all">redis_server_master_link_status</span> | Indicates if the replica is connected to its master |
| <span class="break-all">redis_server_master_repl_offset</span> | Number of bytes sent to replicas by the shard; calculate the throughput for a time period by comparing the value at different times |
| <span class="break-all">redis_server_master_sync_in_progress</span> | The master shard is synchronizing (1 true | 0 false) |
| <span class="break-all">redis_server_max_process_mem</span> | Current memory limit configured by redis_mgr according to node free memory |
| <span class="break-all">redis_server_maxmemory</span> | Current memory limit configured by redis_mgr according to database memory limits |
| <span class="break-all">redis_server_mem_aof_buffer</span> | Current size of AOF buffer |
| <span class="break-all">redis_server_mem_clients_normal</span> | Current memory used for input and output buffers of non-replica clients |
| <span class="break-all">redis_server_mem_clients_slaves</span> | Current memory used for input and output buffers of replica clients |
| <span class="break-all">redis_server_mem_fragmentation_ratio</span> | Memory fragmentation ratio (1.3 means 30% overhead) |
| <span class="break-all">redis_server_mem_not_counted_for_evict</span> | Portion of used_memory (in bytes) that's not counted for eviction and OOM error |
| <span class="break-all">redis_server_mem_replication_backlog</span> | Size of replication backlog |
| <span class="break-all">redis_server_module_fork_in_progress</span> | A binary value that indicates if there is an active fork spawned by a module (1) or not (0) |
| <span class="break-all">namedprocess_namegroup_cpu_seconds_total</span> | Shard process CPU usage percentage |
| <span class="break-all">namedprocess_namegroup_thread_cpu_seconds_total</span> | Shard main thread CPU time spent in seconds |
| <span class="break-all">namedprocess_namegroup_open_filedesc</span> | Shard number of open file descriptors |
| <span class="break-all">namedprocess_namegroup_memory_bytes</span> | Shard memory size in bytes |
| <span class="break-all">namedprocess_namegroup_oldest_start_time_seconds</span> | Shard start time of the process since unix epoch in seconds |
| <span class="break-all">redis_server_rdb_bgsave_in_progress</span> | Indication if bgsave is currently in progress |
| <span class="break-all">redis_server_rdb_last_cow_size</span> | Last bgsave (or SYNC fork) used CopyOnWrite memory |
| <span class="break-all">redis_server_rdb_saves</span> | Total count of bgsaves since the process was restarted (including replica fullsync and persistence) |
| <span class="break-all">redis_server_repl_touch_bytes</span> | Number of bytes sent to replicas as TOUCH commands by the shard as a result of a READ command that was processed; calculate the throughput for a time period by comparing the value at different times |
| <span class="break-all">redis_server_total_commands_processed</span> | Number of commands processed by the shard; calculate the number of commands for a time period by comparing the value at different times |
| <span class="break-all">redis_server_total_connections_received</span> | Number of connections received by the shard; calculate the number of connections for a time period by comparing the value at different times |
| <span class="break-all">redis_server_total_net_input_bytes</span> | Number of bytes received by the shard; calculate the throughput for a time period by comparing the value at different times |
| <span class="break-all">redis_server_total_net_output_bytes</span> | Number of bytes sent by the shard; calculate the throughput for a time period by comparing the value at different times |
| <span class="break-all">redis_server_up</span> | Shard is up and running |
| <span class="break-all">redis_server_used_memory</span> | Memory used by shard (in BigRedis this includes flash) (bytes) |
