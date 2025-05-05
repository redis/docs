## Database metrics

| V1&nbsp;metric | Equivalent V2 PromQL | Description |
| --------- | :------------------- | :---------- |
| <span class="break-all">bdb_avg_latency</span> | <span class="break-all">`(sum by (db)(irate(endpoint_read_requests_latency_histogram_sum{db=""$db""}[1m]) + irate(endpoint_write_requests_latency_histogram_sum{db=""$db""}[1m]) + irate(endpoint_other_requests_latency_histogram_sum{db=""$db""}[1m])))/(sum by (db)(irate(endpoint_read_requests{db=""$db""}[1m]) + irate(endpoint_write_requests{db=""$db""}[1m]) + irate(endpoint_other_requests{db=""$db""}[1m])))/1000000`</span> | Average latency of operations on the database (seconds); returned only when there is traffic |
| <span class="break-all">bdb_avg_latency_max</span> | <span class="break-all">`avg(histogram_quantile(1, sum by (le, db) (irate(endpoint_read_requests_latency_histogram_bucket{db=""$db""}[1m]) + irate(endpoint_write_requests_latency_histogram_bucket{db=""$db""}[1m]) + irate(endpoint_other_requests_latency_histogram_bucket{db=""$db""}[1m])))) / 1000000`</span> | Highest value of average latency of operations on the database (seconds); returned only when there is traffic |
| <span class="break-all">bdb_avg_read_latency</span> | <span class="break-all">`(sum(irate(endpoint_read_requests_latency_histogram_sum{db=""$db""}[1m]))/sum(irate(endpoint_read_requests{db=""$db""}[1m])))/1000000`</span> | Average latency of read operations (seconds); returned only when there is traffic |
| <span class="break-all">bdb_avg_read_latency_max</span></span> | <span class="break-all">`histogram_quantile(1, sum by (le) (irate(endpoint_read_requests_latency_histogram_bucket{db=""$db""}[1m]))) / 1000000`</span> | Highest value of average latency of read operations (seconds); returned only when there is traffic |
| <span class="break-all">bdb_avg_write_latency</span> | <span class="break-all">`(sum(irate(endpoint_write_requests_latency_histogram_sum{db=""$db""}[1m]))/sum(irate(endpoint_write_requests{db=""$db""}[1m])))/1000000`</span> | Average latency of write operations (seconds); returned only when there is traffic |
| <span class="break-all">bdb_avg_write_latency_max</span> | <span class="break-all">`histogram_quantile(1, sum by (le) (irate(endpoint_write_requests_latency_histogram_bucket{db=""$db""}[1m]))) / 1000000`</span> | Highest value of average latency of write operations (seconds); returned only when there is traffic |
| <span class="break-all">bdb_bigstore_shard_count</span> | <span class="break-all">`sum((sum(label_replace(label_replace(namedprocess_namegroup_thread_count{groupname=~"redis-\d+", threadname=~"(speedb\|rocksdb).*"}, "redis", "$1", "groupname", "redis-(\d+)"), "driver", "$1", "threadname", "(speedb\|rocksdb).*")) by (redis, driver) > bool 0) * on (redis) group_left(db) redis_server_up) by (db, driver)`</span> | Shard count by database and by storage engine (driver - rocksdb / speedb); Only for databases with Auto Tiering enabled |
| <span class="break-all">bdb_conns</span> | <span class="break-all">`sum by (db) (endpoint_client_connections{cluster=""$cluster"", db=""$db""} - endpoint_client_disconnections{cluster=""$cluster"", db=""$db""})`</span> | Number of client connections to database |
| <span class="break-all">bdb_egress_bytes</span> | <span class="break-all">`sum by(db) (irate(endpoint_egress{db="$db"}[1m]))`</span> | Rate of outgoing network traffic from the database (bytes/sec) |
| <span class="break-all">bdb_egress_bytes_max</span> | <span class="break-all">`max_over_time (sum by(db) (irate(endpoint_egress{db="$db"}[1m]))[$__range:])`</span> | Highest value of the rate of outgoing network traffic from the database (bytes/sec) |
| <span class="break-all">bdb_evicted_objects</span> | <span class="break-all">`sum by (db) (irate(redis_server_evicted_keys{role="master"}[1m]))`</span> | Rate of key evictions from database (evictions/sec) |
| <span class="break-all">bdb_evicted_objects_max</span> | <span class="break-all">`sum by (db) (irate(redis_server_evicted_keys{role="master"}[1m]))`</span> | Highest value of the rate of key evictions from database (evictions/sec) |
| <span class="break-all">bdb_expired_objects</span> | <span class="break-all">`sum by (db) (irate(redis_server_expired_keys{role="master"}[1m]))`</span> | Rate keys expired in database (expirations/sec) |
| <span class="break-all">bdb_expired_objects_max</span> | <span class="break-all">`sum by (db) (irate(redis_server_expired_keys{role="master"}[1m]))`</span> | Highest value of the rate keys expired in database (expirations/sec) |
| <span class="break-all">bdb_fork_cpu_system</span> | <span class="break-all">`sum by (db) (irate(namedprocess_namegroup_thread_cpu_seconds_total{mode="system"}[1m]))`</span> | % cores utilization in system mode for all Redis shard fork child processes of this database |
| <span class="break-all">bdb_fork_cpu_system_max</span> | <span class="break-all">`sum by (db) (irate(namedprocess_namegroup_thread_cpu_seconds_total{mode="system"}[1m]))`</span> | Highest value of % cores utilization in system mode for all Redis shard fork child processes of this database |
| <span class="break-all">bdb_fork_cpu_user</span> | <span class="break-all">`sum by (db) (irate(namedprocess_namegroup_thread_cpu_seconds_total{mode="user"}[1m]))`</span> | % cores utilization in user mode for all Redis shard fork child processes of this database |
| <span class="break-all">bdb_fork_cpu_user_max</span> | <span class="break-all">`sum by (db) (irate(namedprocess_namegroup_thread_cpu_seconds_total{mode="user"}[1m]))`</span> | Highest value of % cores utilization in user mode for all Redis shard fork child processes of this database |
| <span class="break-all">bdb_ingress_bytes</span> | <span class="break-all">`sum by(db) (irate(endpoint_ingress{db="$db"}[1m]))`</span> | Rate of incoming network traffic to database (bytes/sec) |
| <span class="break-all">bdb_ingress_bytes_max</span> | <span class="break-all">`max_over_time (sum by(db) (irate(endpoint_ingress{db="$db"}[1m]))[$__range:])`</span> | Highest value of the rate of incoming network traffic to database (bytes/sec) |
| <span class="break-all">bdb_instantaneous_ops_per_sec</span></span> | <span class="break-all">`sum by(db) (redis_server_instantaneous_ops_per_sec)`</span> | Request rate handled by all shards of database (ops/sec) |
| <span class="break-all">bdb_main_thread_cpu_system</span> | <span class="break-all">`sum by(db) (irate(namedprocess_namegroup_thread_cpu_seconds_total{mode="system", threadname=~"redis-server.*"}[1m]))`</span> | % cores utilization in system mode for all Redis shard main threads of this database |
| <span class="break-all">bdb_main_thread_cpu_system_max</span></span> | <span class="break-all">`sum by(db) (irate(namedprocess_namegroup_thread_cpu_seconds_total{mode="system", threadname=~"redis-server.*"}[1m]))`</span> | Highest value of % cores utilization in system mode for all Redis shard main threads of this database |
| <span class="break-all">bdb_main_thread_cpu_user</span> | <span class="break-all">`sum by(irate(namedprocess_namegroup_thread_cpu_seconds_total{mode="user", threadname=~"redis-server.*"}[1m]))`</span> | % cores utilization in user mode for all Redis shard main threads of this database |
| <span class="break-all">bdb_main_thread_cpu_user_max</span></span> | <span class="break-all">`sum by(irate(namedprocess_namegroup_thread_cpu_seconds_total{mode="user", threadname=~"redis-server.*"}[1m]))`</span> | Highest value of % cores utilization in user mode for all Redis shard main threads of this database |
| <span class="break-all">bdb_mem_frag_ratio</span> | <span class="break-all">`avg(redis_server_mem_fragmentation_ratio)`</span> | RAM fragmentation ratio (RSS / allocated RAM) |
| <span class="break-all">bdb_mem_size_lua</span> | <span class="break-all">`sum by(db) (redis_server_used_memory_lua)`</span> | Redis lua scripting heap size (bytes) |
| <span class="break-all">bdb_memory_limit</span> | <span class="break-all">`sum by(db) (redis_server_maxmemory)`</span> | Configured RAM limit for the database |
| <span class="break-all">bdb_monitor_sessions_count</span> | <span class="break-all">`sum by(db) (endpoint_monitor_sessions_count)`</span> | Number of clients connected in monitor mode to the database |
| <span class="break-all">bdb_no_of_keys</span> | <span class="break-all">`sum by (db) (redis_server_db_keys{role="master"})`</span> | Number of keys in database |
| <span class="break-all">bdb_other_req</span> | <span class="break-all">`sum by(db) (irate(endpoint_other_requests{db="$db"}[1m]))`</span> | Rate of other (non read/write) requests on the database (ops/sec) |
| <span class="break-all">bdb_other_req_max</span> | <span class="break-all">`max_over_time (sum by(db) (irate(endpoint_other_requests{db="$db"}[1m]))[$__range:])`</span> | Highest value of the rate of other (non read/write) requests on the database (ops/sec) |
| <span class="break-all">bdb_other_res</span> | <span class="break-all">`sum by(db) (irate(endpoint_other_responses{db="$db"}[1m]))`</span> | Rate of other (non read/write) responses on the database (ops/sec) |
| <span class="break-all">bdb_other_res_max</span> | <span class="break-all">`max_over_time (sum by(db) (irate(endpoint_other_responses{db="$db"}[1m]))[$__range:])`</span> | Highest value of the rate of other (non read/write) responses on the database (ops/sec) |
| <span class="break-all">bdb_pubsub_channels</span> | <span class="break-all">`sum by(db) (redis_server_pubsub_channels)`</span> | Count the pub/sub channels with subscribed clients |
| <span class="break-all">bdb_pubsub_channels_max</span> | <span class="break-all">`sum by(db) (redis_server_pubsub_channels)`</span> | Highest value of count the pub/sub channels with subscribed clients |
| <span class="break-all">bdb_pubsub_patterns</span> | <span class="break-all">`sum by(db) (redis_server_pubsub_patterns)`</span> | Count the pub/sub patterns with subscribed clients |
| <span class="break-all">bdb_pubsub_patterns_max</span></span> | <span class="break-all">`sum by(db) (redis_server_pubsub_patterns)`</span> | Highest value of count the pub/sub patterns with subscribed clients |
| <span class="break-all">bdb_read_hits</span> | <span class="break-all">`sum by (db) (irate(redis_server_keyspace_read_hits{role="master"}[1m]))`</span> | Rate of read operations accessing an existing key (ops/sec) |
| <span class="break-all">bdb_read_hits_max</span> | <span class="break-all">`sum by (db) (irate(redis_server_keyspace_read_hits{role="master"}[1m]))`</span> | Highest value of the rate of read operations accessing an existing key (ops/sec) |
| <span class="break-all">bdb_read_misses</span> | <span class="break-all">`sum by (db) (irate(redis_server_keyspace_read_misses{role="master"}[1m]))`</span> | Rate of read operations accessing a non-existing key (ops/sec) |
| <span class="break-all">bdb_read_misses_max</span> | <span class="break-all">`sum by (db) (irate(redis_server_keyspace_read_misses{role="master"}[1m]))`</span> | Highest value of the rate of read operations accessing a non-existing key (ops/sec) |
| <span class="break-all">bdb_read_req</span> | <span class="break-all">`sum by (db) (irate(endpoint_read_requests{db="$db"}[1m]))`</span> | Rate of read requests on the database (ops/sec) |
| <span class="break-all">bdb_read_req_max</span> | <span class="break-all">`max_over_time (sum by(db) (irate(endpoint_read_requests{db="$db"}[1m]))[$__range:])`</span> | Highest value of the rate of read requests on the database (ops/sec) |
| <span class="break-all">bdb_read_res</span> | <span class="break-all">`sum by (db) (irate(endpoint_read_responses{"$db"}[1m]))`</span> | Rate of read responses on the database (ops/sec) |
| <span class="break-all">bdb_read_res_max</span> | <span class="break-all">`max_over_time (sum by(db) (irate(endpoint_read_responses{db="$db"}[1m]))[$__range:])`</span> | Highest value of the rate of read responses on the database (ops/sec) |
| <span class="break-all">bdb_shard_cpu_system</span> | <span class="break-all">`sum by(db) (irate(namedprocess_namegroup_thread_cpu_seconds_total{mode="system", role="master"}[1m]))`</span> | % cores utilization in system mode for all Redis shard processes of this database |
| <span class="break-all">bdb_shard_cpu_system_max<span></span> | <span class="break-all">`sum by(db) (irate(namedprocess_namegroup_thread_cpu_seconds_total{mode="system", role="master"}[1m]))`</span> | Highest value of % cores utilization in system mode for all Redis shard processes of this database |
| <span class="break-all">bdb_shard_cpu_user</span> | <span class="break-all">`sum by(db) (irate(namedprocess_namegroup_thread_cpu_seconds_total{mode="user", role="master"}[1m]))`</span> | % cores utilization in user mode for the Redis shard process |
| <span class="break-all">bdb_shard_cpu_user_max</span> | <span class="break-all">`sum by(db) (irate(namedprocess_namegroup_thread_cpu_seconds_total{mode="user", role="master"}[1m]))`</span> | Highest value of % cores utilization in user mode for the Redis shard process |
| <span class="break-all">bdb_shards_used</span> | <span class="break-all">`sum((sum(label_replace(label_replace(label_replace(namedprocess_namegroup_thread_count{groupname=~"redis-\d+"}, "redis", "$1", "groupname", "redis-(\d+)"), "shard_type", "flash", "threadname", "(bigstore).*"), "shard_type", "ram", "shard_type", "")) by (redis, shard_type) > bool 0) * on (redis) group_left(db) redis_server_up) by (db, shard_type)`</span> | Used shard count by database and by shard type (ram / flash) |
| <span class="break-all">bdb_total_connections_received</span> | <span class="break-all">`sum by(db) (irate(endpoint_client_connections{db="$db"}[1m]))`</span> | Rate of new client connections to database (connections/sec) |
| <span class="break-all">bdb_total_connections_received_max<span></span> | <span class="break-all">`max_over_time (sum by(db) (irate(endpoint_client_connections{db="$db"}[1m]))[$__range:])`</span> | Highest value of the rate of new client connections to database (connections/sec) |
| <span class="break-all">bdb_total_req</span> | <span class="break-all">`sum by (db) (irate(endpoint_read_requests{db=""$db""}[1m]) + irate(endpoint_write_requests{db=""$db""}[1m]) + irate(endpoint_other_requests{db=""$db""}[1m]))`</span> | Rate of all requests on the database (ops/sec) |
| <span class="break-all">bdb_total_req_max</span> | <span class="break-all">`max_over_time(sum by (db) (irate(endpoint_read_requests{db=""$db""}[1m]) + irate(endpoint_write_requests{db=""$db""}[1m]) + irate(endpoint_other_requests{db=""$db""}[1m])) [$__range:])`</span> | Highest value of the rate of all requests on the database (ops/sec) |
| <span class="break-all">bdb_total_res</span> | <span class="break-all">`sum by (db) (irate(endpoint_read_responses{db=""$db""}[1m]) + irate(endpoint_write_responses{db=""$db""}[1m]) + irate(endpoint_other_responses{db=""$db""}[1m]))`</span> | Rate of all responses on the database (ops/sec) |
| <span class="break-all">bdb_total_res_max</span> | <span class="break-all">`max_over_time(sum by (db) (irate(endpoint_read_responses{db=""$db""}[1m]) + irate(endpoint_write_responses{db=""$db""}[1m]) + irate(endpoint_other_responses{db=""$db""}[1m])) [$__range:])`</span> | Highest value of the rate of all responses on the database (ops/sec) |
| <span class="break-all">bdb_up</span> | <span class="break-all">`min by(db) (redis_up)`</span> | Database is up and running |
| <span class="break-all">bdb_used_memory</span> | <span class="break-all">`sum by (db) (redis_server_used_memory)`</span> | Memory used by database (in BigRedis this includes flash) (bytes) |
| <span class="break-all">bdb_write_hits</span> | <span class="break-all">`sum by (db) (irate(redis_server_keyspace_write_hits{role="master"}[1m]))`</span> | Rate of write operations accessing an existing key (ops/sec) |
| <span class="break-all">bdb_write_hits_max</span> | <span class="break-all">`sum by (db) (irate(redis_server_keyspace_write_hits{role="master"}[1m]))`</span> | Highest value of the rate of write operations accessing an existing key (ops/sec) |
| <span class="break-all">bdb_write_misses</span> | <span class="break-all">`sum by (db) (irate(redis_server_keyspace_write_misses{role="master"}[1m]))`</span> | Rate of write operations accessing a non-existing key (ops/sec) |
| <span class="break-all">bdb_write_misses_max</span> | <span class="break-all">`sum by (db) (irate(redis_server_keyspace_write_misses{role="master"}[1m]))`</span> | Highest value of the rate of write operations accessing a non-existing key (ops/sec) |
| <span class="break-all">bdb_write_req</span> | <span class="break-all">`sum by (db) (irate(endpoint_write_requests{db="$db"}[1m]))`</span> | Rate of write requests on the database (ops/sec) |
| <span class="break-all">bdb_write_req_max</span> | <span class="break-all">`max_over_time(sum by (db) (irate(endpoint_write_requests{db="$db"}[1m]))[$__range:])`</span> | Highest value of the rate of write requests on the database (ops/sec) |
| <span class="break-all">bdb_write_res</span> | <span class="break-all">`sum by(db) (irate(endpoint_write_responses{db="$db"}[1m]))`</span> | Rate of write responses on the database (ops/sec) |
| <span class="break-all">bdb_write_res_max</span> | <span class="break-all">`max_over_time(sum by (db) (irate(endpoint_write_responses{db="$db"}[1m]))[$__range:])`</span> | Highest value of the rate of write responses on the database (ops/sec) |
| no_of_expires</span> | <span class="break-all">`sum by(db) (redis_server_db_expires{role="master"})`</span> | Current number of volatile keys in the database |

## Node metrics

| V1&nbsp;metric | Equivalent V2 PromQL | Description |
| --------- | :------------------- | :---------- |
| <span class="break-all">node_available_flash</span> | <span class="break-all">`node_available_flash_bytes`</span> | Available flash in the node (bytes) |
| <span class="break-all">node_available_flash_no_overbooking</span> | <span class="break-all">`node_available_flash_no_overbooking_bytes`</span> | Available flash in the node (bytes), without taking into account overbooking |
| <span class="break-all">node_available_memory</span> | <span class="break-all">`node_available_memory_bytes`</span> | Amount of free memory in the node (bytes) that is available for database provisioning |
| <span class="break-all">node_available_memory_no_overbooking</span> | <span class="break-all">`node_available_memory_no_overbooking_bytes`</span> | Available RAM in the node (bytes) without taking into account overbooking |
| <span class="break-all">node_avg_latency</span> | <span class="break-all">`sum by (proxy) (irate(endpoint_acc_latency[1m])) / sum by (proxy) (irate(endpoint_total_started_res[1m]))`</span> | Average latency of requests handled by endpoints on the node in milliseconds; returned only when there is traffic |
| <span class="break-all">node_bigstore_free</span> | <span class="break-all">`node_bigstore_free_bytes`</span> | Sum of free space of back-end flash (used by flash database's [BigRedis]) on all cluster nodes (bytes); returned only when BigRedis is enabled |
| <span class="break-all">node_bigstore_iops</span> | <span class="break-all">`node_flash_reads_total + node_flash_writes_total`</span> | Rate of I/O operations against back-end flash for all shards which are part of a flash-based database (BigRedis) in the cluster (ops/sec); returned only when BigRedis is enabled |
| <span class="break-all">node_bigstore_kv_ops</span> | <span class="break-all">`sum by (node) (irate(redis_server_big_io_dels[1m]) + irate(redis_server_big_io_reads[1m]) + irate(redis_server_big_io_writes[1m]))`</span> | Rate of value read/write operations against back-end flash for all shards which are part of a flash-based database (BigRedis) in the cluster (ops/sec); returned only when BigRedis is enabled |
| <span class="break-all">node_bigstore_throughput</span> | <span class="break-all">`sum by (node) (irate(redis_server_big_io_read_bytes[1m]) + irate(redis_server_big_io_write_bytes[1m]))`</span> | Throughput I/O operations against back-end flash for all shards which are part of a flash-based database (BigRedis) in the cluster (bytes/sec); returned only when BigRedis is enabled |
| <span class="break-all">node_cert_expiration_seconds</span> | <span class="break-all">`node_cert_expires_in_seconds`</span> | Certificate expiration (in seconds) per given node; read more about [certificates in Redis Enterprise]({{< relref "/operate/rs/security/certificates" >}}) and [monitoring certificates]({{< relref "/operate/rs/security/certificates/monitor-certificates" >}}) |
| <span class="break-all">node_conns</span> | <span class="break-all">`sum by (node) (endpoint_client_connections)`</span> | Number of clients connected to endpoints on node |
| <span class="break-all">node_cpu_idle</span> | <span class="break-all">`avg by (node) (irate(node_cpu_seconds_total{mode="idle"}[1m]))`</span> | CPU idle time portion (0-1, multiply by 100 to get percent) |
| <span class="break-all">node_cpu_idle_max</span> | <span class="break-all">N/A</span> | Highest value of CPU idle time portion (0-1, multiply by 100 to get percent) |
| <span class="break-all">node_cpu_idle_median</span> | <span class="break-all">N/A</span> | Average value of CPU idle time portion (0-1, multiply by 100 to get percent) |
| <span class="break-all">node_cpu_idle_min</span> | <span class="break-all">N/A</span> | Lowest value of CPU idle time portion (0-1, multiply by 100 to get percent) |
| <span class="break-all">node_cpu_system</span> | <span class="break-all">`avg by (node) (irate(node_cpu_seconds_total{mode="system"}[1m]))`</span> | CPU time portion spent in the kernel (0-1, multiply by 100 to get percent) |
| <span class="break-all">node_cpu_system_max</span> | <span class="break-all">N/A</span> | Highest value of CPU time portion spent in the kernel (0-1, multiply by 100 to get percent) |
| <span class="break-all">node_cpu_system_median</span> | <span class="break-all">N/A</span> | Average value of CPU time portion spent in the kernel (0-1, multiply by 100 to get percent) |
| <span class="break-all">node_cpu_system_min</span> | <span class="break-all">N/A</span> | Lowest value of CPU time portion spent in the kernel (0-1, multiply by 100 to get percent) |
| <span class="break-all">node_cpu_user</span> | <span class="break-all">`avg by (node) (irate(node_cpu_seconds_total{mode="user"}[1m]))`</span> | CPU time portion spent by user-space processes (0-1, multiply by 100 to get percent) |
| <span class="break-all">node_cpu_user_max</span> | <span class="break-all">N/A</span> | Highest value of CPU time portion spent by user-space processes (0-1, multiply by 100 to get percent) |
| <span class="break-all">node_cpu_user_median</span> | <span class="break-all">N/A</span> | Average value of CPU time portion spent by user-space processes (0-1, multiply by 100 to get percent) |
| <span class="break-all">node_cpu_user_min</span> | <span class="break-all">N/A</span> | Lowest value of CPU time portion spent by user-space processes (0-1, multiply by 100 to get percent) |
| <span class="break-all">node_cur_aof_rewrites</span> | <span class="break-all">`sum by (cluster, node) (redis_server_aof_rewrite_in_progress)`</span> | Number of AOF rewrites that are currently performed by shards on this node |
| <span class="break-all">node_egress_bytes</span> | <span class="break-all">`irate(node_network_transmit_bytes_total{device="<interface>"}[1m])`</span> | Rate of outgoing network traffic to node (bytes/sec) |
| <span class="break-all">node_egress_bytes_max</span> | <span class="break-all">N/A</span> | Highest value of the rate of outgoing network traffic to node (bytes/sec) |
| <span class="break-all">node_egress_bytes_median</span> | <span class="break-all">N/A</span> | Average value of the rate of outgoing network traffic to node (bytes/sec) |
| <span class="break-all">node_egress_bytes_min</span> | <span class="break-all">N/A</span> | Lowest value of the rate of outgoing network traffic to node (bytes/sec) |
| <span class="break-all">node_ephemeral_storage_avail</span> | <span class="break-all">`node_ephemeral_storage_avail_bytes`</span> | Disk space available to RLEC processes on configured ephemeral disk (bytes) |
| <span class="break-all">node_ephemeral_storage_free</span> | <span class="break-all">`node_ephemeral_storage_free_bytes`</span> | Free disk space on configured ephemeral disk (bytes) |
| <span class="break-all">node_free_memory</span> | <span class="break-all">`node_memory_MemFree_bytes`</span> | Free memory in the node (bytes) |
| <span class="break-all">node_ingress_bytes</span> | <span class="break-all">`irate(node_network_receive_bytes_total{device="<interface>"}[1m])`</span> | Rate of incoming network traffic to node (bytes/sec) |
| <span class="break-all">node_ingress_bytes_max</span> | <span class="break-all">N/A</span> | Highest value of the rate of incoming network traffic to node (bytes/sec) |
| <span class="break-all">node_ingress_bytes_median</span> | <span class="break-all">N/A</span> | Average value of the rate of incoming network traffic to node (bytes/sec) |
| <span class="break-all">node_ingress_bytes_min</span> | <span class="break-all">N/A</span> | Lowest value of the rate of incoming network traffic to node (bytes/sec) |
| <span class="break-all">node_persistent_storage_avail</span> | <span class="break-all">`node_persistent_storage_avail_bytes`</span> | Disk space available to RLEC processes on configured persistent disk (bytes) |
| <span class="break-all">node_persistent_storage_free</span> | <span class="break-all">`node_persistent_storage_free_bytes`</span> | Free disk space on configured persistent disk (bytes) |
| <span class="break-all">node_provisional_flash</span> | <span class="break-all">`node_provisional_flash_bytes`</span> | Amount of flash available for new shards on this node, taking into account overbooking, max Redis servers, reserved flash, and provision and migration thresholds (bytes) |
| <span class="break-all">node_provisional_flash_no_overbooking</span> | <span class="break-all">`node_provisional_flash_no_overbooking_bytes`</span> | Amount of flash available for new shards on this node, without taking into account overbooking, max Redis servers, reserved flash, and provision and migration thresholds (bytes) |
| <span class="break-all">node_provisional_memory</span> | <span class="break-all">`node_provisional_memory_bytes`</span> | Amount of RAM that is available for provisioning to databases out of the total RAM allocated for databases |
| <span class="break-all">node_provisional_memory_no_overbooking</span> | <span class="break-all">`node_provisional_memory_no_overbooking_bytes`</span> | Amount of RAM that is available for provisioning to databases out of the total RAM allocated for databases, without taking into account overbooking |
| <span class="break-all">node_total_req</span> | <span class="break-all">`sum by (cluster, node) (irate(endpoint_total_req[1m]))`</span> | Request rate handled by endpoints on node (ops/sec) |
| <span class="break-all">node_up</span> | <span class="break-all">`node_metrics_up`</span> | Node is part of the cluster and is connected |

## Cluster metrics

| V1&nbsp;metric | Equivalent V2 PromQL | Description |
| --------- | :------------------- | :---------- |
| cluster_shards_limit | `license_shards_limit` | Total shard limit by the license by shard type (ram / flash) |

## Proxy metrics

| V1&nbsp;metric | Equivalent V2 PromQL | Description |
| --------- | :------------------- | :---------- |
| <span class="break-all">listener_acc_latency</span> | <span class="break-all">N/A</span> | Accumulative latency (sum of the latencies) of all types of commands on the database. For the average latency, divide this value by listener_total_res |
| <span class="break-all">listener_acc_latency_max</span> | <span class="break-all">N/A</span> | Highest value of accumulative latency of all types of commands on the database |
| <span class="break-all">listener_acc_other_latency</span> | <span class="break-all">N/A</span> | Accumulative latency (sum of the latencies) of commands that are a type "other" on the database. For the average latency, divide this value by listener_other_res |
| <span class="break-all">listener_acc_other_latency_max</span> | <span class="break-all">N/A</span> | Highest value of accumulative latency of commands that are a type "other" on the database |
| <span class="break-all">listener_acc_read_latency</span> | <span class="break-all">N/A</span> | Accumulative latency (sum of the latencies) of commands that are a type "read" on the database. For the average latency, divide this value by listener_read_res |
| <span class="break-all">listener_acc_read_latency_max</span> | <span class="break-all">N/A</span> | Highest value of accumulative latency of commands that are a type "read" on the database |
| <span class="break-all">listener_acc_write_latency</span> | <span class="break-all">N/A</span> | Accumulative latency (sum of the latencies) of commands that are a type "write" on the database. For the average latency, divide this value by listener_write_res |
| <span class="break-all">listener_acc_write_latency_max</span> | <span class="break-all">N/A</span> | Highest value of accumulative latency of commands that are a type "write" on the database |
| <span class="break-all">listener_auth_cmds</span> | <span class="break-all">N/A</span> | Number of memcached AUTH commands sent to the database |
| <span class="break-all">listener_auth_cmds_max</span> | <span class="break-all">N/A</span> | Highest value of the number of memcached AUTH commands sent to the database |
| <span class="break-all">listener_auth_errors</span> | <span class="break-all">N/A</span> | Number of error responses to memcached AUTH commands |
| <span class="break-all">listener_auth_errors_max</span> | <span class="break-all">N/A</span> | Highest value of the number of error responses to memcached AUTH commands |
| <span class="break-all">listener_cmd_flush</span> | <span class="break-all">N/A</span> | Number of memcached FLUSH_ALL commands sent to the database |
| <span class="break-all">listener_cmd_flush_max</span> | <span class="break-all">N/A</span> | Highest value of the number of memcached FLUSH_ALL commands sent to the database |
| <span class="break-all">listener_cmd_get</span> | <span class="break-all">N/A</span> | Number of memcached GET commands sent to the database |
| <span class="break-all">listener_cmd_get_max</span> | <span class="break-all">N/A</span> | Highest value of the number of memcached GET commands sent to the database |
| <span class="break-all">listener_cmd_set</span> | <span class="break-all">N/A</span> | Number of memcached SET commands sent to the database |
| <span class="break-all">listener_cmd_set_max</span> | <span class="break-all">N/A</span> | Highest value of the number of memcached SET commands sent to the database |
| <span class="break-all">listener_cmd_touch</span> | <span class="break-all">N/A</span> | Number of memcached TOUCH commands sent to the database |
| <span class="break-all">listener_cmd_touch_max</span> | <span class="break-all">N/A</span> | Highest value of the number of memcached TOUCH commands sent to the database |
| <span class="break-all">listener_conns</span> | <span class="break-all">N/A</span> | Number of clients connected to the endpoint |
| <span class="break-all">listener_egress_bytes</span> | <span class="break-all">N/A</span> | Rate of outgoing network traffic to the endpoint (bytes/sec) |
| <span class="break-all">listener_egress_bytes_max</span> | <span class="break-all">N/A</span> | Highest value of the rate of outgoing network traffic to the endpoint (bytes/sec) |
| <span class="break-all">listener_ingress_bytes</span> | <span class="break-all">N/A</span> | Rate of incoming network traffic to the endpoint (bytes/sec) |
| <span class="break-all">listener_ingress_bytes_max</span> | <span class="break-all">N/A</span> | Highest value of the rate of incoming network traffic to the endpoint (bytes/sec) |
| <span class="break-all">listener_last_req_time</span> | <span class="break-all">N/A</span> | Time of last command sent to the database |
| <span class="break-all">listener_last_res_time</span> | <span class="break-all">N/A</span> | Time of last response sent from the database |
| <span class="break-all">listener_max_connections_exceeded</span> | <span class="break-all">`irate(endpoint_maximal_connections_exceeded[1m])`</span> | Number of times the number of clients connected to the database at the same time has exceeded the max limit |
| <span class="break-all">listener_max_connections_exceeded_max</span> | <span class="break-all">N/A</span> | Highest value of the number of times the number of clients connected to the database at the same time has exceeded the max limit |
| <span class="break-all">listener_monitor_sessions_count</span> | <span class="break-all">N/A</span> | Number of clients connected in monitor mode to the endpoint |
| <span class="break-all">listener_other_req</span> | <span class="break-all">N/A</span> | Rate of other (non-read/write) requests on the endpoint (ops/sec) |
| <span class="break-all">listener_other_req_max</span> | <span class="break-all">N/A</span> | Highest value of the rate of other (non-read/write) requests on the endpoint (ops/sec) |
| <span class="break-all">listener_other_res</span> | <span class="break-all">N/A</span> | Rate of other (non-read/write) responses on the endpoint (ops/sec) |
| <span class="break-all">listener_other_res_max</span> | <span class="break-all">N/A</span> | Highest value of the rate of other (non-read/write) responses on the endpoint (ops/sec) |
| <span class="break-all">listener_other_started_res</span> | <span class="break-all">N/A</span> | Number of responses sent from the database of type "other" |
| <span class="break-all">listener_other_started_res_max</span> | <span class="break-all">N/A</span> | Highest value of the number of responses sent from the database of type "other" |
| <span class="break-all">listener_read_req</span> | <span class="break-all">`irate(endpoint_read_requests[1m])`</span> | Rate of read requests on the endpoint (ops/sec) |
| <span class="break-all">listener_read_req_max</span> | <span class="break-all">N/A</span> | Highest value of the rate of read requests on the endpoint (ops/sec) |
| <span class="break-all">listener_read_res</span> | <span class="break-all">`irate(endpoint_read_responses[1m])`</span> | Rate of read responses on the endpoint (ops/sec) |
| <span class="break-all">listener_read_res_max</span> | <span class="break-all">N/A</span> | Highest value of the rate of read responses on the endpoint (ops/sec) |
| <span class="break-all">listener_read_started_res</span> | <span class="break-all">N/A</span> | Number of responses sent from the database of type "read" |
| <span class="break-all">listener_read_started_res_max</span> | <span class="break-all">N/A</span> | Highest value of the number of responses sent from the database of type "read" |
| <span class="break-all">listener_total_connections_received</span> | <span class="break-all">`irate(endpoint_total_connections_received[1m])`</span> | Rate of new client connections to the endpoint (connections/sec) |
| <span class="break-all">listener_total_connections_received_max</span> | <span class="break-all">N/A</span> | Highest value of the rate of new client connections to the endpoint (connections/sec) |
| <span class="break-all">listener_total_req</span> | <span class="break-all">N/A</span> | Request rate handled by the endpoint (ops/sec) |
| <span class="break-all">listener_total_req_max</span> | <span class="break-all">N/A</span> | Highest value of the rate of all requests on the endpoint (ops/sec) |
| <span class="break-all">listener_total_res</span> | <span class="break-all">N/A</span> | Rate of all responses on the endpoint (ops/sec) |
| <span class="break-all">listener_total_res_max</span> | <span class="break-all">N/A</span> | Highest value of the rate of all responses on the endpoint (ops/sec) |
| <span class="break-all">listener_total_started_res</span> | <span class="break-all">N/A</span> | Number of responses sent from the database of all types |
| <span class="break-all">listener_total_started_res_max</span> | <span class="break-all">N/A</span> | Highest value of the number of responses sent from the database of all types |
| <span class="break-all">listener_write_req</span> | <span class="break-all">`irate(endpoint_write_requests[1m])`</span> | Rate of write requests on the endpoint (ops/sec) |
| <span class="break-all">listener_write_req_max</span> | <span class="break-all">N/A</span> | Highest value of the rate of write requests on the endpoint (ops/sec) |
| <span class="break-all">listener_write_res</span> | <span class="break-all">`irate(endpoint_write_responses[1m])`</span> | Rate of write responses on the endpoint (ops/sec) |
| <span class="break-all">listener_write_res_max</span> | <span class="break-all">N/A</span> | Highest value of the rate of write responses on the endpoint (ops/sec) |
| <span class="break-all">listener_write_started_res</span> | <span class="break-all">N/A</span> | Number of responses sent from the database of type "write" |
| <span class="break-all">listener_write_started_res_max</span> | <span class="break-all">N/A</span> | Highest value of the number of responses sent from the database of type "write" |

## Replication metrics

| V1&nbsp;metric | Equivalent V2 PromQL | Description |
| --------- | :------------------- | :---------- |
| <span class="break-all">bdb_replicaof_syncer_ingress_bytes</span> | <span class="break-all">`rate(replica_src_ingress_bytes[1m])`</span> | Rate of compressed incoming network traffic to a Replica Of database (bytes/sec) |
| <span class="break-all">bdb_replicaof_syncer_ingress_bytes_decompressed</span> | <span class="break-all">`rate(replica_src_ingress_bytes_decompressed[1m])`</span> | Rate of decompressed incoming network traffic to a Replica Of database (bytes/sec) |
| <span class="break-all">bdb_replicaof_syncer_local_ingress_lag_time</span> | <span class="break-all">`database_syncer_lag_ms{syncer_type="replicaof"}`</span> | Lag time between the source and the destination for Replica Of traffic (ms) |
| <span class="break-all">bdb_replicaof_syncer_status</span> | <span class="break-all">`database_syncer_current_status{syncer_type="replicaof"}`</span> | Syncer status for Replica Of traffic; 0 = in-sync, 1 = syncing, 2 = out of sync |
| <span class="break-all">bdb_crdt_syncer_ingress_bytes</span> | <span class="break-all">`rate(crdt_src_ingress_bytes[1m])`</span> | Rate of compressed incoming network traffic to CRDB (bytes/sec) |
| <span class="break-all">bdb_crdt_syncer_ingress_bytes_decompressed</span> | <span class="break-all">`rate(crdt_src_ingress_bytes_decompressed[1m])`</span> | Rate of decompressed incoming network traffic to CRDB (bytes/sec) |
| <span class="break-all">bdb_crdt_syncer_local_ingress_lag_time</span> | <span class="break-all">`database_syncer_lag_ms{syncer_type="crdt"}`</span> | Lag time between the source and the destination (ms) for CRDB traffic |
| <span class="break-all">bdb_crdt_syncer_status</span> | <span class="break-all">`database_syncer_current_status{syncer_type="crdt"}`</span> | Syncer status for CRDB traffic; 0 = in-sync, 1 = syncing, 2 = out of sync |

## Shard metrics

| V1&nbsp;metric | Equivalent V2 PromQL | Description |
| --------- | :------------------- | :---------- |
| <span class="break-all">redis_active_defrag_running</span> | <span class="break-all">`redis_server_active_defrag_running`</span> | Automatic memory defragmentation current aggressiveness (% cpu) |
| <span class="break-all">redis_allocator_active</span> | <span class="break-all">`redis_server_allocator_active`</span> | Total used memory, including external fragmentation |
| <span class="break-all">redis_allocator_allocated</span> | <span class="break-all">`redis_server_allocator_allocated`</span> | Total allocated memory |
| <span class="break-all">redis_allocator_resident</span> | <span class="break-all">`redis_server_allocator_resident`</span> | Total resident memory (RSS) |
| <span class="break-all">redis_aof_last_cow_size</span> | <span class="break-all">`redis_server_aof_last_cow_size`</span> | Last AOFR, CopyOnWrite memory |
| <span class="break-all">redis_aof_rewrite_in_progress</span> | <span class="break-all">`redis_server_aof_rewrite_in_progress`</span> | The number of simultaneous AOF rewrites that are in progress |
| <span class="break-all">redis_aof_rewrites</span> | <span class="break-all">`redis_server_aof_rewrites`</span> | Number of AOF rewrites this process executed |
| <span class="break-all">redis_aof_delayed_fsync</span> | <span class="break-all">`redis_server_aof_delayed_fsync`</span> | Number of times an AOF fsync caused delays in the main Redis thread (inducing latency); this can indicate that the disk is slow or overloaded |
| <span class="break-all">redis_blocked_clients</span> | <span class="break-all">`redis_server_blocked_clients`</span> | Count the clients waiting on a blocking call |
| <span class="break-all">redis_connected_clients</span> | <span class="break-all">`redis_server_connected_clients`</span> | Number of client connections to the specific shard |
| <span class="break-all">redis_connected_slaves</span> | <span class="break-all">`redis_server_connected_slaves`</span> | Number of connected replicas |
| <span class="break-all">redis_db0_avg_ttl</span> | <span class="break-all">`redis_server_db0_avg_ttl`</span> | Average TTL of all volatile keys |
| <span class="break-all">redis_db0_expires</span> | <span class="break-all">`redis_server_expired_keys`</span> | Total count of volatile keys |
| <span class="break-all">redis_db0_keys</span> | <span class="break-all">`redis_server_db0_keys`</span> | Total key count |
| <span class="break-all">redis_evicted_keys</span> | <span class="break-all">`redis_server_evicted_keys`</span> | Keys evicted so far (since restart) |
| <span class="break-all">redis_expire_cycle_cpu_milliseconds</span> | <span class="break-all">`redis_server_expire_cycle_cpu_milliseconds`</span> | The cumulative amount of time spent on active expiry cycles |
| <span class="break-all">redis_expired_keys</span> | <span class="break-all">`redis_server_expired_keys`</span> | Keys expired so far (since restart) |
| <span class="break-all">redis_forwarding_state</span> | <span class="break-all">`redis_server_forwarding_state`</span> | Shard forwarding state (on or off) |
| <span class="break-all">redis_keys_trimmed</span> | <span class="break-all">`redis_server_keys_trimmed`</span> | The number of keys that were trimmed in the current or last resharding process |
| <span class="break-all">redis_keyspace_read_hits</span> | <span class="break-all">`redis_server_keyspace_read_hits`</span> | Number of read operations accessing an existing keyspace |
| <span class="break-all">redis_keyspace_read_misses</span> | <span class="break-all">`redis_server_keyspace_read_misses`</span> | Number of read operations accessing a non-existing keyspace |
| <span class="break-all">redis_keyspace_write_hits</span> | <span class="break-all">`redis_server_keyspace_write_hits`</span> | Number of write operations accessing an existing keyspace |
| <span class="break-all">redis_keyspace_write_misses</span> | <span class="break-all">`redis_server_keyspace_write_misses`</span> | Number of write operations accessing a non-existing keyspace |
| <span class="break-all">redis_master_link_status</span> | <span class="break-all">`redis_server_master_link_status`</span> | Indicates if the replica is connected to its master |
| <span class="break-all">redis_master_repl_offset</span> | <span class="break-all">`redis_server_master_repl_offset`</span> | Number of bytes sent to replicas by the shard; calculate the throughput for a time period by comparing the value at different times |
| <span class="break-all">redis_master_sync_in_progress</span> | <span class="break-all">`redis_server_master_sync_in_progress`</span> | The master shard is synchronizing (1 true; 0 false) |
| <span class="break-all">redis_max_process_mem</span> | <span class="break-all">`redis_server_max_process_mem`</span> | Current memory limit configured by redis_mgr according to node free memory |
| <span class="break-all">redis_maxmemory</span> | <span class="break-all">`redis_server_maxmemory`</span> | Current memory limit configured by redis_mgr according to database memory limits |
| <span class="break-all">redis_mem_aof_buffer</span> | <span class="break-all">`redis_server_mem_aof_buffer`</span> | Current size of AOF buffer |
| <span class="break-all">redis_mem_clients_normal</span> | <span class="break-all">`redis_server_mem_clients_normal`</span> | Current memory used for input and output buffers of non-replica clients |
| <span class="break-all">redis_mem_clients_slaves</span> | <span class="break-all">`redis_server_mem_clients_slaves`</span> | Current memory used for input and output buffers of replica clients |
| <span class="break-all">redis_mem_fragmentation_ratio</span> | <span class="break-all">`redis_server_mem_fragmentation_ratio`</span> | Memory fragmentation ratio (1.3 means 30% overhead) |
| <span class="break-all">redis_mem_not_counted_for_evict</span> | <span class="break-all">`redis_server_mem_not_counted_for_evict`</span> | Portion of used_memory (in bytes) that's not counted for eviction and OOM error |
| <span class="break-all">redis_mem_replication_backlog</span> | <span class="break-all">`redis_server_mem_replication_backlog`</span> | Size of replication backlog |
| <span class="break-all">redis_module_fork_in_progress</span> | <span class="break-all">`redis_server_module_fork_in_progress`</span> | A binary value that indicates if there is an active fork spawned by a module (1) or not (0) |
| <span class="break-all">redis_process_cpu_system_seconds_total</span> | <span class="break-all">`namedprocess_namegroup_cpu_seconds_total{mode="system"}`</span> | Shard process system CPU time spent in seconds |
| <span class="break-all">redis_process_cpu_usage_percent</span> | <span class="break-all">`namedprocess_namegroup_cpu_seconds_total{mode=~"system\|user"}`</span> | Shard process CPU usage percentage |
| <span class="break-all">redis_process_cpu_user_seconds_total</span> | <span class="break-all">`namedprocess_namegroup_cpu_seconds_total{mode="user"}`</span> | Shard user CPU time spent in seconds |
| <span class="break-all">redis_process_main_thread_cpu_system_seconds_total</span> | <span class="break-all">`namedprocess_namegroup_thread_cpu_seconds_total{mode="system",threadname="redis-server"}`</span> | Shard main thread system CPU time spent in seconds |
| <span class="break-all">redis_process_main_thread_cpu_user_seconds_total</span> | <span class="break-all">`namedprocess_namegroup_thread_cpu_seconds_total{mode="user",threadname="redis-server"}`</span> | Shard main thread user CPU time spent in seconds |
| <span class="break-all">redis_process_max_fds</span> | <span class="break-all">`max(namedprocess_namegroup_open_filedesc)`</span> | Shard maximum number of open file descriptors |
| <span class="break-all">redis_process_open_fds</span> | <span class="break-all">`namedprocess_namegroup_open_filedesc`</span> | Shard number of open file descriptors |
| <span class="break-all">redis_process_resident_memory_bytes</span> | <span class="break-all">`namedprocess_namegroup_memory_bytes{memtype="resident"}`</span> | Shard resident memory size in bytes |
| <span class="break-all">redis_process_start_time_seconds</span> | <span class="break-all">`namedprocess_namegroup_oldest_start_time_seconds`</span> | Shard start time of the process since unix epoch in seconds |
| <span class="break-all">redis_process_virtual_memory_bytes</span> | <span class="break-all">`namedprocess_namegroup_memory_bytes{memtype="virtual"}`</span> | Shard virtual memory in bytes |
| <span class="break-all">redis_rdb_bgsave_in_progress</span> | <span class="break-all">`redis_server_rdb_bgsave_in_progress`</span> | Indication if bgsave is currently in progress |
| <span class="break-all">redis_rdb_last_cow_size</span> | <span class="break-all">`redis_server_rdb_last_cow_size`</span> | Last bgsave (or SYNC fork) used CopyOnWrite memory |
| <span class="break-all">redis_rdb_saves</span> | <span class="break-all">`redis_server_rdb_saves`</span> | Total count of bgsaves since the process was restarted (including replica fullsync and persistence) |
| <span class="break-all">redis_repl_touch_bytes</span> | <span class="break-all">`redis_server_repl_touch_bytes`</span> | Number of bytes sent to replicas as TOUCH commands by the shard as a result of a READ command that was processed; calculate the throughput for a time period by comparing the value at different times |
| <span class="break-all">redis_total_commands_processed</span> | <span class="break-all">`redis_server_total_commands_processed`</span> | Number of commands processed by the shard; calculate the number of commands for a time period by comparing the value at different times |
| <span class="break-all">redis_total_connections_received</span> | <span class="break-all">`redis_server_total_connections_received`</span> | Number of connections received by the shard; calculate the number of connections for a time period by comparing the value at different times |
| <span class="break-all">redis_total_net_input_bytes</span> | <span class="break-all">`redis_server_total_net_input_bytes`</span> | Number of bytes received by the shard; calculate the throughput for a time period by comparing the value at different times |
| <span class="break-all">redis_total_net_output_bytes</span> | <span class="break-all">`redis_server_total_net_output_bytes`</span> | Number of bytes sent by the shard; calculate the throughput for a time period by comparing the value at different times |
| <span class="break-all">redis_up</span> | <span class="break-all">`redis_server_up`</span> | Shard is up and running |
| <span class="break-all">redis_used_memory</span> | <span class="break-all">`redis_server_used_memory`</span> | Memory used by shard (in BigRedis this includes flash) (bytes) |
