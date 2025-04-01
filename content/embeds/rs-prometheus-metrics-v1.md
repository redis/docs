
The following tables include the v1 metrics available to Prometheus.

## Database metrics

| Metric | Description |
| ------ | :------ |
| bdb_avg_latency | Average latency of operations on the database (seconds); returned only when there is traffic |
| bdb_avg_latency_max | Highest value of average latency of operations on the database (seconds); returned only when there is traffic |
| bdb_avg_read_latency | Average latency of read operations (seconds); returned only when there is traffic |
| bdb_avg_read_latency_max | Highest value of average latency of read operations (seconds); returned only when there is traffic |
| bdb_avg_write_latency | Average latency of write operations (seconds); returned only when there is traffic |
| bdb_avg_write_latency_max | Highest value of average latency of write operations (seconds); returned only when there is traffic |
| bdb_bigstore_shard_count | Shard count by database and by storage engine (driver - rocksdb / speedb); Only for databases with Auto Tiering enabled |
| bdb_conns | Number of client connections to the database |
| bdb_egress_bytes | Rate of outgoing network traffic from the database (bytes/sec) |
| bdb_egress_bytes_max | Highest value of the rate of outgoing network traffic from the database (bytes/sec) |
| bdb_evicted_objects | Rate of key evictions from database (evictions/sec) |
| bdb_evicted_objects_max | Highest value of the rate of key evictions from database (evictions/sec) |
| bdb_expired_objects | Rate keys expired in database (expirations/sec) |
| bdb_expired_objects_max | Highest value of the rate keys expired in database (expirations/sec) |
| bdb_fork_cpu_system | % cores utilization in system mode for all Redis shard fork child processes of this database |
| bdb_fork_cpu_system_max | Highest value of % cores utilization in system mode for all Redis shard fork child processes of this database |
| bdb_fork_cpu_user | % cores utilization in user mode for all Redis shard fork child processes of this database |
| bdb_fork_cpu_user_max | Highest value of % cores utilization in user mode for all Redis shard fork child processes of this database |
| bdb_ingress_bytes | Rate of incoming network traffic to the database (bytes/sec) |
| bdb_ingress_bytes_max | Highest value of the rate of incoming network traffic to the database (bytes/sec) |
| bdb_instantaneous_ops_per_sec | Request rate handled by all shards of database (ops/sec) |
| bdb_main_thread_cpu_system | % cores utilization in system mode for all Redis shard main threads of this database |
| bdb_main_thread_cpu_system_max | Highest value of % cores utilization in system mode for all Redis shard main threads of this database |
| bdb_main_thread_cpu_user | % cores utilization in user mode for all Redis shard main threads of this database |
| bdb_main_thread_cpu_user_max | Highest value of % cores utilization in user mode for all Redis shard main threads of this database |
| bdb_mem_frag_ratio | RAM fragmentation ratio (RSS / allocated RAM) |
| bdb_mem_size_lua | Redis lua scripting heap size (bytes) |
| bdb_memory_limit | Configured RAM limit for the database |
| bdb_monitor_sessions_count | Number of clients connected in monitor mode to the database |
| bdb_no_of_keys | Number of keys in database |
| bdb_other_req | Rate of other (non read/write) requests on the database (ops/sec) |
| bdb_other_req_max | Highest value of the rate of other (non read/write) requests on the database (ops/sec) |
| bdb_other_res | Rate of other (non read/write) responses on the database (ops/sec) |
| bdb_other_res_max | Highest value of the rate of other (non read/write) responses on the database (ops/sec) |
| bdb_pubsub_channels | Count the pub/sub channels with subscribed clients |
| bdb_pubsub_channels_max | Highest value of count the pub/sub channels with subscribed clients |
| bdb_pubsub_patterns | Count the pub/sub patterns with subscribed clients |
| bdb_pubsub_patterns_max | Highest value of count the pub/sub patterns with subscribed clients |
| bdb_read_hits | Rate of read operations accessing an existing key (ops/sec) |
| bdb_read_hits_max | Highest value of the rate of read operations accessing an existing key (ops/sec) |
| bdb_read_misses | Rate of read operations accessing a non-existing key (ops/sec) |
| bdb_read_misses_max | Highest value of the rate of read operations accessing a non-existing key (ops/sec) |
| bdb_read_req | Rate of read requests on the database (ops/sec) |
| bdb_read_req_max | Highest value of the rate of read requests on the database (ops/sec) |
| bdb_read_res | Rate of read responses on the database (ops/sec) |
| bdb_read_res_max | Highest value of the rate of read responses on the database (ops/sec) |
| bdb_shard_cpu_system | % cores utilization in system mode for all redis shard processes of this database |
| bdb_shard_cpu_system_max | Highest value of % cores utilization in system mode for all Redis shard processes of this database |
| bdb_shard_cpu_user | % cores utilization in user mode for the redis shard process |
| bdb_shard_cpu_user_max | Highest value of % cores utilization in user mode for the Redis shard process |
| bdb_shards_used | Used shard count by database and by shard type (ram / flash) |
| bdb_total_connections_received | Rate of new client connections to the database (connections/sec) |
| bdb_total_connections_received_max | Highest value of the rate of new client connections to the database (connections/sec) |
| bdb_total_req | Rate of all requests on the database (ops/sec) |
| bdb_total_req_max | Highest value of the rate of all requests on the database (ops/sec) |
| bdb_total_res | Rate of all responses on the database (ops/sec) |
| bdb_total_res_max | Highest value of the rate of all responses on the database (ops/sec) |
| bdb_up | Database is up and running |
| bdb_used_memory | Memory used by the database (in BigRedis this includes flash) (bytes) |
| bdb_write_hits | Rate of write operations accessing an existing key (ops/sec) |
| bdb_write_hits_max | Highest value of the rate of write operations accessing an existing key (ops/sec) |
| bdb_write_misses | Rate of write operations accessing a non-existing key (ops/sec) |
| bdb_write_misses_max | Highest value of the rate of write operations accessing a non-existing key (ops/sec) |
| bdb_write_req | Rate of write requests on the database (ops/sec) |
| bdb_write_req_max | Highest value of the rate of write requests on the database (ops/sec) |
| bdb_write_res | Rate of write responses on the database (ops/sec) |
| bdb_write_res_max | Highest value of the rate of write responses on the database (ops/sec) |
| no_of_expires | Current number of volatile keys in the database |

## Node metrics

| Metric | Description |
| ------ | :------ |
| node_available_flash | Available flash in the node (bytes) |
| node_available_flash_no_overbooking | Available flash in the node (bytes), without taking into account overbooking |
| node_available_memory | Amount of free memory in the node (bytes) that is available for database provisioning |
| node_available_memory_no_overbooking | Available ram in the node (bytes) without taking into account overbooking |
| node_avg_latency | Average latency of requests handled by endpoints on the node in milliseconds; returned only when there is traffic |
| node_bigstore_free | Sum of free space of back-end flash (used by flash database's BigRedis) on all cluster nodes (bytes); returned only when BigRedis is enabled |
| node_bigstore_iops | Rate of i/o operations against back-end flash for all shards which are part of a flash-based database (BigRedis) in the cluster (ops/sec); returned only when BigRedis is enabled |
| node_bigstore_kv_ops | Rate of value read/write operations against back-end flash for all shards which are part of a flash-based database (BigRedis) in the cluster (ops/sec); returned only when BigRedis is enabled |
| node_bigstore_throughput | Throughput i/o operations against back-end flash for all shards which are part of a flash-based database (BigRedis) in the cluster (bytes/sec); returned only when BigRedis is enabled |
| node_cert_expiration_seconds | Certificate expiration (in seconds) per given node; read more about [certificates in Redis Enterprise]({{< relref "/operate/rs/security/certificates" >}}) and [monitoring certificates]({{< relref "/operate/rs/security/certificates/monitor-certificates" >}}) |
| node_conns | Number of clients connected to endpoints on node |
| node_cpu_idle | CPU idle time portion (0-1, multiply by 100 to get percent) |
| node_cpu_idle_max | Highest value of CPU idle time portion (0-1, multiply by 100 to get percent) |
| node_cpu_idle_median | Average value of CPU idle time portion (0-1, multiply by 100 to get percent) |
| node_cpu_idle_min | Lowest value of CPU idle time portion (0-1, multiply by 100 to get percent) |
| node_cpu_system | CPU time portion spent in the kernel (0-1, multiply by 100 to get percent) |
| node_cpu_system_max | Highest value of CPU time portion spent in the kernel (0-1, multiply by 100 to get percent) |
| node_cpu_system_median | Average value of CPU time portion spent in the kernel (0-1, multiply by 100 to get percent) |
| node_cpu_system_min | Lowest value of CPU time portion spent in the kernel (0-1, multiply by 100 to get percent) |
| node_cpu_user | CPU time portion spent by users-pace processes (0-1, multiply by 100 to get percent) |
| node_cpu_user_max | Highest value of CPU time portion spent by users-pace processes (0-1, multiply by 100 to get percent) |
| node_cpu_user_median | Average value of CPU time portion spent by users-pace processes (0-1, multiply by 100 to get percent) |
| node_cpu_user_min | Lowest value of CPU time portion spent by users-pace processes (0-1, multiply by 100 to get percent) |
| node_cur_aof_rewrites | Number of aof rewrites that are currently performed by shards on this node |
| node_egress_bytes | Rate of outgoing network traffic to node (bytes/sec) |
| node_egress_bytes_max | Highest value of the rate of outgoing network traffic to node (bytes/sec) |
| node_egress_bytes_median | Average value of the rate of outgoing network traffic to node (bytes/sec) |
| node_egress_bytes_min | Lowest value of the rate of outgoing network traffic to node (bytes/sec) |
| node_ephemeral_storage_avail | Disk space available to RLEC processes on configured ephemeral disk (bytes) |
| node_ephemeral_storage_free | Free disk space on configured ephemeral disk (bytes) |
| node_free_memory | Free memory in the node (bytes) |
| node_ingress_bytes | Rate of incoming network traffic to node (bytes/sec) |
| node_ingress_bytes_max | Highest value of the rate of incoming network traffic to node (bytes/sec) |
| node_ingress_bytes_median | Average value of the rate of incoming network traffic to node (bytes/sec) |
| node_ingress_bytes_min | Lowest value of the rate of incoming network traffic to node (bytes/sec) |
| node_persistent_storage_avail | Disk space available to RLEC processes on configured persistent disk (bytes) |
| node_persistent_storage_free | Free disk space on configured persistent disk (bytes) |
| node_provisional_flash | Amount of flash available for new shards on this node, taking into account overbooking, max Redis servers, reserved flash and provision and migration thresholds (bytes) |
| node_provisional_flash_no_overbooking | Amount of flash available for new shards on this node, without taking into account overbooking, max Redis servers, reserved flash and provision and migration thresholds (bytes) |
| node_provisional_memory | Amount of RAM that is available for provisioning to databases out of the total RAM allocated for databases |
| node_provisional_memory_no_overbooking | Amount of RAM that is available for provisioning to databases out of the total RAM allocated for databases, without taking into account overbooking |
| node_total_req | Request rate handled by endpoints on node (ops/sec) |
| node_up | Node is part of the cluster and is connected |

## Cluster metrics

| Metric | Description |
| ------ | :------ |
| cluster_shards_limit | Total shard limit by the license by shard type (ram / flash) |


## Proxy metrics

| Metric | Description |
| ------ | :------ |
| listener_acc_latency | Accumulative latency (sum of the latencies) of all types of commands on the database. For the average latency, divide this value by listener_total_res |
| listener_acc_latency_max | Highest value of accumulative latency of all types of commands on the database |
| listener_acc_other_latency | Accumulative latency (sum of the latencies) of commands that are the type "other" on the database. For the average latency, divide this value by listener_other_res |
| listener_acc_other_latency_max | Highest value of accumulative latency of commands that are the type "other" on the database |
| listener_acc_read_latency | Accumulative latency (sum of the latencies) of commands that are the type "read" on the database. For the average latency, divide this value by listener_read_res |
| listener_acc_read_latency_max | Highest value of accumulative latency of commands that are the type "read" on the database |
| listener_acc_write_latency | Accumulative latency (sum of the latencies) of commands that are the type "write" on the database. For the average latency, divide this value by listener_write_res |
| listener_acc_write_latency_max | Highest value of accumulative latency of commands that are the type "write" on the database |
| listener_auth_cmds | Number of memcached AUTH commands sent to the database |
| listener_auth_cmds_max | Highest value of the number of memcached AUTH commands sent to the database |
| listener_auth_errors | Number of error responses to memcached AUTH commands  |
| listener_auth_errors_max | Highest value of the number of error responses to memcached AUTH commands  |
| listener_cmd_flush | Number of memcached FLUSH_ALL commands sent to the database |
| listener_cmd_flush_max | Highest value of the number of memcached FLUSH_ALL commands sent to the database |
| listener_cmd_get | Number of memcached GET commands sent to the database |
| listener_cmd_get_max | Highest value of the number of memcached GET commands sent to the database |
| listener_cmd_set | Number of memcached SET commands sent to the database |
| listener_cmd_set_max | Highest value of the number of memcached SET commands sent to the database |
| listener_cmd_touch | Number of memcached TOUCH commands sent to the database |
| listener_cmd_touch_max | Highest value of the number of memcached TOUCH commands sent to the database |
| listener_conns | Number of clients connected to the endpoint |
| listener_egress_bytes | Rate of outgoing network traffic to the endpoint (bytes/sec) |
| listener_egress_bytes_max | Highest value of the rate of outgoing network traffic to the endpoint (bytes/sec) |
| listener_ingress_bytes | Rate of incoming network traffic to the endpoint (bytes/sec) |
| listener_ingress_bytes_max | Highest value of the rate of incoming network traffic to the endpoint (bytes/sec) |
| listener_last_req_time | Time of last command sent to the database |
| listener_last_res_time | Time of last response sent from the database |
| listener_max_connections_exceeded | Number of times the Number of clients connected to the database at the same time has exeeded the max limit |
| listener_max_connections_exceeded_max | Highest value of the number of times the Number of clients connected to the database at the same time has exeeded the max limit |
| listener_monitor_sessions_count | Number of client connected in monitor mode to the endpoint |
| listener_other_req | Rate of other (non read/write) requests on the endpoint (ops/sec) |
| listener_other_req_max | Highest value of the rate of other (non read/write) requests on the endpoint (ops/sec) |
| listener_other_res | Rate of other (non read/write) responses on the endpoint (ops/sec) |
| listener_other_res_max | Highest value of the rate of other (non read/write) responses on the endpoint (ops/sec) |
| listener_other_started_res | Number of responses sent from the database of type "other" |
| listener_other_started_res_max | Highest value of the number of responses sent from the database of type "other" |
| listener_read_req | Rate of read requests on the endpoint (ops/sec) |
| listener_read_req_max | Highest value of the rate of read requests on the endpoint (ops/sec) |
| listener_read_res | Rate of read responses on the endpoint (ops/sec) |
| listener_read_res_max | Highest value of the rate of read responses on the endpoint (ops/sec) |
| listener_read_started_res | Number of responses sent from the database of type "read" |
| listener_read_started_res_max | Highest value of the number of responses sent from the database of type "read" |
| listener_total_connections_received | Rate of new client connections to the endpoint (connections/sec) |
| listener_total_connections_received_max | Highest value of the rate of new client connections to the endpoint (connections/sec) |
| listener_total_req | Request rate handled by the endpoint (ops/sec) |
| listener_total_req_max | Highest value of the rate of all requests on the endpoint (ops/sec) |
| listener_total_res | Rate of all responses on the endpoint (ops/sec) |
| listener_total_res_max | Highest value of the rate of all responses on the endpoint (ops/sec) |
| listener_total_started_res | Number of responses sent from the database of all types |
| listener_total_started_res_max | Highest value of the number of responses sent from the database of all types |
| listener_write_req | Rate of write requests on the endpoint (ops/sec) |
| listener_write_req_max | Highest value of the rate of write requests on the endpoint (ops/sec) |
| listener_write_res | Rate of write responses on the endpoint (ops/sec) |
| listener_write_res_max | Highest value of the rate of write responses on the endpoint (ops/sec) |
| listener_write_started_res | Number of responses sent from the database of type "write" |
| listener_write_started_res_max | Highest value of the number of responses sent from the database of type "write" |

## Replication metrics

| Metric | Description |
| ------ | :------ |
| bdb_replicaof_syncer_ingress_bytes | Rate of compressed incoming network traffic to a Replica Of database (bytes/sec) |
| bdb_replicaof_syncer_ingress_bytes_decompressed | Rate of decompressed incoming network traffic to a Replica Of database (bytes/sec) |
| bdb_replicaof_syncer_local_ingress_lag_time | Lag time between the source and the destination for Replica Of traffic (ms) |
| bdb_replicaof_syncer_status | Syncer status for Replica Of traffic; 0 = in-sync, 1 = syncing, 2 = out of sync |
| bdb_crdt_syncer_ingress_bytes | Rate of compressed incoming network traffic to CRDB (bytes/sec) |
| bdb_crdt_syncer_ingress_bytes_decompressed | Rate of decompressed incoming network traffic to CRDB (bytes/sec) |
| bdb_crdt_syncer_local_ingress_lag_time | Lag time between the source and the destination (ms) for CRDB traffic |
| bdb_crdt_syncer_status | Syncer status for CRDB traffic; 0 = in-sync, 1 = syncing, 2 = out of sync |

## Shard metrics

| Metric | Description |
| ------ | :------ |
| redis_active_defrag_running | Automatic memory defragmentation current aggressiveness (% cpu) |
| redis_allocator_active | Total used memory, including external fragmentation |
| redis_allocator_allocated | Total allocated memory |
| redis_allocator_resident | Total resident memory (RSS) |
| redis_aof_last_cow_size | Last AOFR, CopyOnWrite memory |
| redis_aof_rewrite_in_progress | The number of simultaneous AOF rewrites that are in progress |
| redis_aof_rewrites | Number of AOF rewrites this process executed |
| redis_aof_delayed_fsync | Number of times an AOF fsync caused delays in the Redis main thread (inducing latency); this can indicate that the disk is slow or overloaded |
| redis_blocked_clients | Count the clients waiting on a blocking call |
| redis_connected_clients | Number of client connections to the specific shard |
| redis_connected_slaves | Number of connected replicas |
| redis_db0_avg_ttl | Average TTL of all volatile keys |
| redis_db0_expires | Total count of volatile keys |
| redis_db0_keys | Total key count |
| redis_evicted_keys | Keys evicted so far (since restart) |
| redis_expire_cycle_cpu_milliseconds | The cumulative amount of time spent on active expiry cycles |
| redis_expired_keys | Keys expired so far (since restart) |
| redis_forwarding_state | Shard forwarding state (on or off) |
| redis_keys_trimmed | The number of keys that were trimmed in the current or last resharding process |
| redis_keyspace_read_hits | Number of read operations accessing an existing keyspace |
| redis_keyspace_read_misses | Number of read operations accessing an non-existing keyspace |
| redis_keyspace_write_hits | Number of write operations accessing an existing keyspace |
| redis_keyspace_write_misses | Number of write operations accessing an non-existing keyspace |
| redis_master_link_status | Indicates if the replica is connected to its master |
| redis_master_repl_offset | Number of bytes sent to replicas by the shard; calculate the throughput for a time period by comparing the value at different times |
| redis_master_sync_in_progress | The primary shard is synchronizing (1 true; 0 false) |
| redis_max_process_mem | Current memory limit configured by redis_mgr according to node free memory |
| redis_maxmemory | Current memory limit configured by redis_mgr according to database memory limits |
| redis_mem_aof_buffer | Current size of AOF buffer |
| redis_mem_clients_normal | Current memory used for input and output buffers of non-replica clients |
| redis_mem_clients_slaves | Current memory used for input and output buffers of replica clients |
| redis_mem_fragmentation_ratio | Memory fragmentation ratio (1.3 means 30% overhead) |
| redis_mem_not_counted_for_evict | Portion of used_memory (in bytes) that's not counted for eviction and OOM error |
| redis_mem_replication_backlog | Size of replication backlog |
| redis_module_fork_in_progress | A binary value that indicates if there is an active fork spawned by a module (1) or not (0) |
| redis_process_cpu_system_seconds_total | Shard process system CPU time spent in seconds |
| redis_process_cpu_usage_percent | Shard process cpu usage precentage |
| redis_process_cpu_user_seconds_total | Shard user CPU time spent in seconds |
| redis_process_main_thread_cpu_system_seconds_total | Shard main thread system CPU time spent in seconds |
| redis_process_main_thread_cpu_user_seconds_total | Shard main thread user CPU time spent in seconds |
| redis_process_max_fds | Shard maximum number of open file descriptors |
| redis_process_open_fds | Shard number of open file descriptors |
| redis_process_resident_memory_bytes | Shard resident memory size in bytes |
| redis_process_start_time_seconds | Shard start time of the process since unix epoch in seconds |
| redis_process_virtual_memory_bytes | Shard virtual memory in bytes |
| redis_rdb_bgsave_in_progress | Indication if bgsave is currently in progress |
| redis_rdb_last_cow_size | Last bgsave (or SYNC fork) used CopyOnWrite memory |
| redis_rdb_saves | Total count of bgsaves since process was restarted (including replica fullsync and persistence) |
| redis_repl_touch_bytes | Number of bytes sent to replicas as TOUCH commands by the shard as a result of a READ command that was processed; calculate the throughput for a time period by comparing the value at different times |
| redis_total_commands_processed | Number of commands processed by the shard; calculate the number of commands for a time period by comparing the value at different times |
| redis_total_connections_received | Number of connections received by the shard; calculate the number of connections for a time period by comparing the value at different times |
| redis_total_net_input_bytes | Number of bytes received by the shard; calculate the throughput for a time period by comparing the value at different times |
| redis_total_net_output_bytes | Number of bytes sent by the shard; calculate the throughput for a time period by comparing the value at different times |
| redis_up | Shard is up and running |
| redis_used_memory | Memory used by shard (in BigRedis this includes flash) (bytes) |
