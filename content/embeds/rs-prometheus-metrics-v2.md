## Database metrics

| Metric | Type | Unit | Description |
| :-------- | :--- | :--- | :---------- |
| <span class="break-all">endpoint_accepted_connections</span> | counter | count | Number of incoming accepted client connections |
| endpoint_client_connections | counter | count | Number of client connection establishment events |
| endpoint_client_disconnections | counter | count | Number of client disconnections initiated by the client |
| <span class="break-all">endpoint_client_connection_expired</span> | counter | count | Total number of client connections with expired TTL (Time To Live) |
| <span class="break-all">endpoint_client_establishment_failures</span> | counter | count | Number of client connections that failed to establish properly |
| <span class="break-all">endpoint_client_expiration_refresh</span> | counter | count | Number of expiration time changes of clients |
| <span class="break-all">endpoint_client_tracking_off_requests</span> | counter | count | Total number of `CLIENT TRACKING OFF` requests |
| <span class="break-all">endpoint_client_tracking_on_requests</span> | counter | count | Total number of `CLIENT TRACKING ON` requests |
| <span class="break-all">endpoint_connections_rate</span> | gauge | connections/second | The rate of incoming connections. Computed as `n_accepted / N` for the last interval where `n_accepted` is the number of accepted connections in this interval, and `N` is the interval in seconds. |
| <span class="break-all">endpoint_disconnected_cba_client</span> | counter | count | Number of certificate-based clients disconnected |
| <span class="break-all">endpoint_disconnected_ldap_client</span> | counter | count | Number of LDAP clients disconnected |
| <span class="break-all">endpoint_disconnected_user_password_client</span> | counter | count | Number of user&password clients disconnected |
| <span class="break-all">endpoint_dispatch_failures</span> | counter | count | Number of clients closed due to failure to be dispatched to workers |
| <span class="break-all">endpoint_disposed_commands_after_client_caching</span> | counter | count | Total number of client caching commands that were disposed due to misuse |
| endpoint_egress | counter | bytes | Number of egress bytes |
| endpoint_egress_pending | counter | bytes | Number of send-pending bytes |
| <span class="break-all">endpoint_egress_pending_discarded</span> | counter | bytes | Number of send-pending bytes that were discarded due to disconnection |
| <span class="break-all">endpoint_failed_cba_authentication</span> | counter | count | Number of clients that failed certificate-based authentication |
| <span class="break-all">endpoint_failed_ldap_authentication</span> | counter | count | Number of clients that failed LDAP authentication |
| <span class="break-all">endpoint_failed_user_password_authentication</span> | counter | count | Number of clients that failed user password authentication |
| endpoint_ingress | counter | bytes | Number of ingress bytes |
| <span class="break-all">endpoint_longest_pipeline_histogram</span> | histogram | count | Tracks the distribution of longest observed pipeline lengths, where a pipeline is a sequence of client commands sent without waiting for responses. |
| endpoint_other_requests | counter | count | Number of other requests |
| <span class="break-all">endpoint_other_requests_latency_histogram</span> | histogram | microseconds | Latency (in µs) histogram of other commands |
| <span class="break-all">endpoint_other_requests_latency_histogram_bucket</span> | histogram | microseconds | Latency histograms for commands other than read or write commands. Can be used to represent different latency percentiles.<br />p99.9 example:<br /><span class="break-all">`histogram_quantile(0.999, sum(rate(endpoint_other_requests_latency_histogram_bucket{cluster="$cluster", db="$db"}[$__rate_interval]) ) by (le, db))`</span> |
| endpoint_other_responses | counter | count | Number of other responses |
| <span class="break-all">endpoint_ping_failures</span> | gauge | count | Number of consecutive endpoint ping failures. Labels: endpoint_uid |
| <span class="break-all">endpoint_ping_failure_duration_seconds</span> | gauge | seconds | Duration of ongoing endpoint failures (0 when healthy). Labels: endpoint_uid |
| endpoint_proxy_disconnections | counter | count | Number of client disconnections initiated by the proxy |
| <span class="break-all">endpoint_rate_limit_ok</span> | gauge | — | Rate limit status based on the last 2 intervals.<br />0 = rate limit was recently exceeded<br />1 = rate limit was not recently exceeded |
| <span class="break-all">endpoint_rate_limit_overflows</span> | counter | count | Total number of rate limit overflows |
| endpoint_read_requests | counter | count | Number of read requests |
| <span class="break-all">endpoint_read_requests_latency_histogram</span> | histogram | microseconds | Latency (in µs) histogram of read commands |
| <span class="break-all">endpoint_read_requests_latency_histogram_bucket</span> | histogram | microseconds | Latency histograms for read commands. Can be used to represent different latency percentiles.<br />p99.9 example:<br /><span class="break-all">`histogram_quantile(0.999, sum(rate(endpoint_read_requests_latency_histogram_bucket{cluster="$cluster", db="$db"}[$__rate_interval]) ) by (le, db))`</span> |
| endpoint_read_responses | counter | count | Number of read responses |
| <span class="break-all">endpoint_successful_cba_authentication</span> | counter | count | Number of clients that successfully authenticated with certificate-based authentication |
| <span class="break-all">endpoint_successful_ldap_authentication</span> | counter | count | Number of clients that successfully authenticated with LDAP |
| <span class="break-all">endpoint_successful_user_password_authentication</span> | counter | count | Number of clients that successfully authenticated with user&password |
| endpoint_write_requests | counter | count | Number of write requests |
| <span class="break-all">endpoint_write_requests_latency_histogram</span> | histogram | microseconds | Latency (in µs) histogram of write commands |
| <span class="break-all">endpoint_write_requests_latency_histogram_bucket</span> | histogram | microseconds | Latency histograms for write commands. Can be used to represent different latency percentiles.<br />p99.9 example:<br /><span class="break-all">`histogram_quantile(0.999, sum(rate(endpoint_write_requests_latency_histogram_bucket{cluster="$cluster", db="$db"}[$__rate_interval]) ) by (le, db))`</span> |
| endpoint_write_responses | counter | count | Number of write responses |
| db_config | gauge | — | This is an information metric that holds database configuration within labels such as: db_name, db_version, db_port, tls_mode |
| db_status | gauge | — | This is a status metric that reports on various database statuses: 0 = active, 1 = active-change-pending, 2 = pending, 3 = import-pending, 4 = delete-pending, 5 = recovery, 99 = unknown |
| db_tags | gauge | — | Information metric that exposes database tags as labels; the value is always `1`. See [Database tags in metrics]({{< relref "/operate/rs/monitoring/metrics_stream_engine/db-tags-in-metrics" >}}). |

## Node metrics

| Metric | Type | Unit | Description |
| :-------- | :--- | :--- | :---------- |
| node_available_flash_bytes | gauge | bytes | Available flash in the node (bytes) |
| <span class="break-all">node_available_flash_no_overbooking_bytes</span> | gauge | bytes | Available flash in the node (bytes), without taking into account overbooking |
| <span class="break-all">node_available_memory_bytes</span> | gauge | bytes | Amount of free memory in the node (bytes) |
| <span class="break-all">node_available_memory_no_overbooking_bytes</span> | gauge | bytes | Available RAM in the node (bytes) without taking into account overbooking |
| node_bigstore_free_bytes | gauge | bytes | Sum of free space of back-end flash (used by flash database's [BigRedis]) on all cluster nodes (bytes); returned only when BigRedis is enabled |
| <span class="break-all">node_cert_expires_in_seconds</span> | gauge | seconds | Certificate expiration (in seconds) per given node; read more about [certificates in Redis Software]({{< relref "/operate/rs/security/certificates" >}}) and [monitoring certificates]({{< relref "/operate/rs/security/certificates/monitor-certificates" >}}) |
| <span class="break-all">customer_managed_ine_certificates</span> | gauge | — | Indicates whether customer-provided internode encryption certificates are in use<br />0=No<br />1=Yes |
| <span class="break-all">node_ephemeral_storage_avail_bytes</span> | gauge | bytes | Disk space available to RLEC processes on configured ephemeral disk (bytes) |
| <span class="break-all">node_ephemeral_storage_free_bytes</span> | gauge | bytes | Free disk space on configured ephemeral disk (bytes) |
| node_memory_MemFree_bytes | gauge | bytes | Free memory in the node (bytes) |
| <span class="break-all">node_persistent_storage_avail_bytes</span> | gauge | bytes | Disk space available to RLEC processes on configured persistent disk (bytes) |
| <span class="break-all">node_persistent_storage_free_bytes</span> | gauge | bytes | Free disk space on configured persistent disk (bytes) |
| <span class="break-all">node_provisional_flash_bytes</span> | gauge | bytes | Amount of flash available for new shards on this node, taking into account overbooking, max Redis servers, reserved flash, and provision and migration thresholds (bytes) |
| <span class="break-all">node_provisional_flash_no_overbooking_bytes</span> | gauge | bytes | Amount of flash available for new shards on this node, without taking into account overbooking, max Redis servers, reserved flash, and provision and migration thresholds (bytes) |
| <span class="break-all">node_provisional_memory_bytes</span> | gauge | bytes | Amount of RAM that is available for provisioning to databases out of the total RAM allocated for databases |
| <span class="break-all">node_provisional_memory_no_overbooking_bytes</span> | gauge | bytes | Amount of RAM that is available for provisioning to databases out of the total RAM allocated for databases, without taking into account overbooking |
| node_metrics_up | gauge | — | Node is part of the cluster and is connected (1 = connected, 0 = not connected) |
| <span class="break-all">dmc_ping_failures</span> | gauge | count | Number of consecutive DMC ping failures |
| <span class="break-all">dmc_ping_failure_duration_seconds</span> | gauge | seconds | Duration of ongoing DMC failures (0 when healthy) |

## Cluster metrics

| Metric | Type | Unit | Description |
| :-------- | :--- | :--- | :---------- |
| <span class="break-all">generation{node=<node_uid>}</span> | gauge | — | Current generation (state-version) number of the cluster watchdog on the specific node |
| <span class="break-all">has_quorum{node=<node_uid>, has_witness_disk=BOOL}</span> | gauge | — | Has_quorum = 1<br />No quorum = 0 |
| <span class="break-all">is_primary{node=<node_uid>}</span> | gauge | — | primary = 1<br />secondary = 0 |
| <span class="break-all">license_expiration_days</span> | gauge | days | Number of days until the license expires |
| <span class="break-all">license_shards_limit</span> | gauge | count | Total shard limit by the license by shard type (ram / flash) |
| <span class="break-all">total_live_nodes_count{node=<node_uid>}</span> | gauge | count | Number of live nodes |
| <span class="break-all">total_nodes_count{node=<node_uid>}</span> | gauge | count | Number of nodes |
| <span class="break-all">primary_selections_total{node=<node_uid>}</span> | counter | count | Monotonic counter for each selection process that started |
| users_count | gauge | count | Current number of users on the cluster |

## Replication metrics

| Metric | Type | Unit | Description |
| :-------- | :--- | :--- | :---------- |
| <span class="break-all">database_syncer_config</span> | gauge | — | Used as a placeholder for configuration labels |
| <span class="break-all">database_syncer_current_status</span> | gauge | — | Syncer status for traffic; 0 = in-sync, 1 = out of sync |
| <span class="break-all">database_syncer_dst_connectivity_state</span> | gauge | — | Destination connectivity state (1 = connected, 0 = disconnected) |
| <span class="break-all">database_syncer_dst_connectivity_state_ms</span> | gauge | milliseconds | Destination connectivity state duration |
| <span class="break-all">database_syncer_dst_lag</span> | gauge | milliseconds | Lag in milliseconds between the syncer and the destination |
| <span class="break-all">database_syncer_dst_repl_offset</span> | gauge | bytes | Offset of the last command acknowledged |
| <span class="break-all">database_syncer_flush_counter</span> | gauge | count | Number of destination flushes |
| <span class="break-all">database_syncer_ingress_bytes</span> | gauge | bytes | Number of bytes read from source shard |
| <span class="break-all">database_syncer_ingress_bytes_decompressed</span> | gauge | bytes | Number of bytes read from source shard |
| <span class="break-all">database_syncer_internal_state</span> | gauge | — | Internal state of the syncer |
| <span class="break-all">database_syncer_lag_ms</span> | gauge | milliseconds | Lag time between the source and the destination for traffic in milliseconds |
| <span class="break-all">database_syncer_rdb_size</span> | gauge | bytes | The source's RDB size in bytes to be transferred during the syncing phase |
| <span class="break-all">database_syncer_rdb_transferred</span> | gauge | bytes | Number of bytes transferred from the source's RDB during the syncing phase |
| <span class="break-all">database_syncer_src_connectivity_state</span> | gauge | — | Source connectivity state (1 = connected, 0 = disconnected) |
| <span class="break-all">database_syncer_src_connectivity_state_ms</span> | gauge | milliseconds | Source connectivity state duration |
| <span class="break-all">database_syncer_src_repl_offset</span> | gauge | bytes | Last known source offset |
| <span class="break-all">database_syncer_state</span> | gauge | — | Internal state of the shard syncer |
| <span class="break-all">database_syncer_syncer_repl_offset</span> | gauge | bytes | Offset of the last command handled by the syncer |
| <span class="break-all">database_syncer_total_requests</span> | gauge | count | Number of destination writes |
| <span class="break-all">database_syncer_total_responses</span> | gauge | count | Number of destination writes acknowledged |

## Shard metrics

| Metric | Type | Unit | Description |
| :-------- | :--- | :--- | :---------- |
| redis_server_active_defrag_running | gauge | percent | Automatic memory defragmentation current aggressiveness (% cpu) |
| redis_server_allocator_active | gauge | bytes | Total used memory, including external fragmentation |
| redis_server_allocator_allocated | gauge | bytes | Total allocated memory |
| redis_server_allocator_resident | gauge | bytes | Total resident memory (RSS) |
| redis_server_aof_last_cow_size | gauge | bytes | Last AOFR, CopyOnWrite memory |
| <span class="break-all">redis_server_aof_rewrite_in_progress</span> | gauge | — | Indicates whether an AOF rewrite is in progress (1 = in progress, 0 = otherwise) |
| redis_server_aof_rewrites | gauge | count | Number of AOF rewrites this process executed |
| redis_server_aof_delayed_fsync | gauge | count | Number of times an AOF fsync caused delays in the main Redis thread (inducing latency); this can indicate that the disk is slow or overloaded |
| redis_server_blocked_clients | gauge | count | Count the clients waiting on a blocking call |
| redis_server_connected_clients | gauge | count | Number of client connections to the specific shard |
| redis_server_connected_slaves | gauge | count | Number of connected replicas |
| redis_server_db_avg_ttl | gauge | milliseconds | Average TTL of all volatile keys |
| redis_server_db0_avg_ttl | gauge | milliseconds | Average TTL of all volatile keys. Deprecated. |
| redis_server_db_keys | gauge | count | Total key count. |
| redis_server_db0_keys | gauge | count | Total key count. Deprecated. |
| redis_server_evicted_keys | gauge | count | Keys evicted so far (since restart) |
| <span class="break-all">redis_server_expire_cycle_cpu_milliseconds</span> | gauge | milliseconds | The cumulative amount of time spent on active expiry cycles |
| redis_server_expired_keys | gauge | count | Keys expired so far since restart |
| redis_server_forwarding_state | gauge | — | Shard forwarding state (1 = on, 0 = off) |
| redis_server_hashes_items_under_1M | gauge | count | Number of hash keys with under 1 million elements |
| redis_server_hashes_items_1M_to_8M | gauge | count | Number of hash keys with an element count between 1 million and 8 million |
| redis_server_hashes_items_over_8M | gauge | count | Number of hash keys with over 8 million elements |
| redis_server_keys_trimmed | gauge | count | The number of keys that were trimmed in the current or last resharding process |
| redis_server_keyspace_read_hits | gauge | count | Number of read operations accessing an existing keyspace |
| redis_server_keyspace_read_misses | gauge | count | Number of read operations accessing a non-existing keyspace |
| redis_server_keyspace_write_hits | gauge | count | Number of write operations accessing an existing keyspace |
| <span class="break-all">redis_server_keyspace_write_misses</span> | gauge | count | Number of write operations accessing a non-existing keyspace |
| redis_server_lists_items_under_1M | gauge | count | Number of list keys with under 1 million elements |
| redis_server_lists_items_1M_to_8M | gauge | count | Number of list keys with an element count between 1 million and 8 million |
| redis_server_lists_items_over_8M | gauge | count | Number of list keys with over 8 million elements |
| redis_server_master_link_status | gauge | — | Indicates whether the replica is connected to its master (1 = up, 2 = down, 3 = none, 99 = unknown) |
| redis_server_master_repl_offset | gauge | bytes | Number of bytes sent to replicas by the shard; calculate the throughput for a time period by comparing the value at different times |
| <span class="break-all">redis_server_master_sync_in_progress</span> | gauge | — | The primary shard is synchronizing (1 true; 0 false) |
| redis_server_max_process_mem | gauge | bytes | Current memory limit configured by redis_mgr according to node free memory |
| redis_server_maxmemory | gauge | bytes | Current memory limit configured by redis_mgr according to database memory limits. <br /><br />To calculate the percent memory usage:<br /><span class="break-all">`sum by (cluster,db)(redis_server_used_memory{role="master"}) / (avg by(cluster,db)(db_memory_limit_bytes) / max by(cluster,db)(db_replication_factor))`</span> |
| redis_server_mem_aof_buffer | gauge | bytes | Current size of AOF buffer |
| redis_server_mem_clients_normal | gauge | bytes | Current memory used for input and output buffers of non-replica clients |
| redis_server_mem_clients_slaves | gauge | bytes | Current memory used for input and output buffers of replica clients |
| <span class="break-all">redis_server_mem_fragmentation_ratio</span> | gauge | ratio | Memory fragmentation ratio (1.3 means 30% overhead) |
| <span class="break-all">redis_server_mem_not_counted_for_evict</span> | gauge | bytes | Portion of used_memory (in bytes) that's not counted for eviction and OOM error |
| <span class="break-all">redis_server_mem_replication_backlog</span> | gauge | bytes | Size of replication backlog |
| <span class="break-all">redis_server_slave_buffer</span> | gauge | bytes | Reports the effective replica output buffer hard limit for a shard, derived from the database slave_buffer configuration. For slave_buffer=auto, the hard limit is calculated as used_memory * auto_slavebuf_ratio / 100, then bounded by auto_slavebuf_min and auto_slavebuf_max. |
| <span class="break-all">redis_server_module_fork_in_progress</span> | gauge | — | A binary value that indicates if there is an active fork spawned by a module (1) or not (0) |
| <span class="break-all">namedprocess_namegroup_cpu_seconds_total</span> | counter | seconds | Shard process CPU usage in seconds |
| <span class="break-all">namedprocess_namegroup_thread_cpu_seconds_total</span> | counter | seconds | Shard main thread CPU time spent in seconds |
| <span class="break-all">namedprocess_namegroup_open_filedesc</span> | gauge | count | Shard number of open file descriptors |
| <span class="break-all">namedprocess_namegroup_memory_bytes</span> | gauge | bytes | Shard memory size in bytes |
| <span class="break-all">namedprocess_namegroup_oldest_start_time_seconds</span> | gauge | timestamp seconds | Shard start time of the process since unix epoch in seconds |
| <span class="break-all">redis_server_rdb_bgsave_in_progress</span> | gauge | — | Indicates whether bgsave is currently in progress (1 = in progress, 0 = otherwise) |
| redis_server_rdb_last_cow_size | gauge | bytes | Last bgsave (or SYNC fork) used CopyOnWrite memory |
| redis_server_rdb_saves | gauge | count | Total count of bgsaves since the process was restarted (including replica fullsync and persistence) |
| redis_server_sets_items_under_1M | gauge | count | Number of set keys with under 1 million elements |
| redis_server_sets_items_1M_to_8M | gauge | count | Number of set keys with an element count between 1 million and 8 million |
| redis_server_sets_items_over_8M | gauge | count | Number of set keys with over 8 million elements |
| redis_server_repl_touch_bytes | gauge | bytes | Number of bytes sent to replicas as TOUCH commands by the shard as a result of a READ command that was processed; calculate the throughput for a time period by comparing the value at different times |
| <span class="break-all">redis_server_total_commands_processed</span> | gauge | count | Number of commands processed by the shard; calculate the number of commands for a time period by comparing the value at different times |
| <span class="break-all">redis_server_total_connections_received</span> | gauge | count | Number of connections received by the shard; calculate the number of connections for a time period by comparing the value at different times |
| redis_server_total_net_input_bytes | gauge | bytes | Number of bytes received by the shard; calculate the throughput for a time period by comparing the value at different times |
| <span class="break-all">redis_server_total_net_output_bytes</span> | gauge | bytes | Number of bytes sent by the shard; calculate the throughput for a time period by comparing the value at different times |
| redis_server_up | gauge | — | Shard is up and running (1 = up, 0 = down) |
| <span class="break-all">redis_server_strings_sizes_under_128M</span> | gauge | count | Number of string keys with a memory size under 128 megabytes |
| <span class="break-all">redis_server_strings_sizes_128M_to_512M</span> | gauge | count | Number of string keys with a memory size between 128 and 512 megabytes |
| <span class="break-all">redis_server_strings_sizes_over_512M</span> | gauge | count | Number of string keys with a memory size over 512 megabytes |
| redis_server_used_memory | gauge | bytes | Memory used by shard (in BigRedis this includes flash) (bytes) |
| redis_server_zsets_items_under_1M | gauge | count | Number of sorted set keys with under 1 million elements |
| redis_server_zsets_items_1M_to_8M | gauge | count | Number of sorted set keys with an element count between 1 million and 8 million |
| redis_server_zsets_items_over_8M | gauge | count | Number of sorted set keys with over 8 million elements |
| <span class="break-all">redis_server_search_gc_bytes_collected</span> | gauge | bytes | The total amount of memory freed by the garbage collectors from indexes in the shard's memory in bytes. <sup>[4](#tnote-4)</sup> |
| <span class="break-all">redis_server_search_bytes_collected</span> | gauge | bytes | The total amount of memory freed by the garbage collectors from indexes in the shard's memory in bytes. Deprecated in 8.0 (renamed <span class="break-all">redis_server_search_gc_bytes_collected</span>), but still available in older versions. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_gc_marked_deleted_vectors</span> | gauge | count | The number of vectors marked as deleted in the vector indexes that have not yet been cleaned. <sup>[4](#tnote-4)</sup> |
| <span class="break-all">redis_server_search_marked_deleted_vectors</span> | gauge | count | The number of vectors marked as deleted in the vector indexes that have not yet been cleaned. Deprecated in 8.0 (renamed <span class="break-all">redis_server_search_gc_marked_deleted_vectors</span>), but still available in older versions. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_gc_total_cycles</span> | gauge | count | The total number of garbage collection cycles executed. <sup>[4](#tnote-4)</sup> |
| <span class="break-all">redis_server_search_total_cycles</span> | gauge | count | The total number of garbage collection cycles executed. Deprecated in 8.0 (renamed <span class="break-all">redis_server_search_gc_total_cycles</span>), but still available in older versions. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_gc_total_docs_not_collected_by_gc</span> | gauge | count | The number of documents marked as deleted, whose memory has not yet been freed by the garbage collector. <sup>[4](#tnote-4)</sup> |
| <span class="break-all">redis_server_search_total_docs_not_collected_by_gc</span> | gauge | count | The number of documents marked as deleted, whose memory has not yet been freed by the garbage collector. Deprecated in 8.0 (renamed <span class="break-all">redis_server_search_gc_total_docs_not_collected_by_gc</span>), but still available in older versions. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_gc_total_ms_run</span> | gauge | milliseconds | The total duration of all garbage collection cycles in the shard, measured in milliseconds. <sup>[4](#tnote-4)</sup> |
| <span class="break-all">redis_server_search_total_ms_run</span> | gauge | milliseconds | The total duration of all garbage collection cycles in the shard, measured in milliseconds. Deprecated in 8.0 (renamed <span class="break-all">redis_server_search_gc_total_ms_run</span>), but still available in older versions. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_cursors_internal_idle</span> | gauge | count | The total number of coordinator cursors that are currently holding pending results in the shard. <sup>[4](#tnote-4)</sup> |
| <span class="break-all">redis_server_search_cursors_user_idle</span> | gauge | count | The total number of cursors that were explicitly requested by users, that are currently holding pending results in the shard. <sup>[4](#tnote-4)</sup> |
| redis_server_search_global_idle | gauge | count | The total number of user and internal cursors currently holding pending results in the shard. Deprecated in 8.0 (split into <span class="break-all">redis_server_search_cursors_internal_idle</span> and <span class="break-all">redis_server_search_cursors_user_idle</span>), but still available in older versions. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_cursors_internal_active</span> | gauge | count | The total number of coordinator cursors in the shard, either holding pending results or actively executing `FT.CURSOR READ`. <sup>[4](#tnote-4)</sup> |
| <span class="break-all">redis_server_search_cursors_user_active</span> | gauge | count | The total number of user cursors in the shard, either holding pending results or actively executing `FT.CURSOR READ`. <sup>[4](#tnote-4)</sup> |
| redis_server_search_global_total | gauge | count | The total number of user and internal cursors in the shard, either holding pending results or actively executing `FT.CURSOR READ`. Deprecated in 8.0 (split into <span class="break-all">redis_server_search_cursors_internal_active</span> and <span class="break-all">redis_server_search_cursors_user_active</span>), but still available in older versions. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_number_of_indexes</span> | gauge | count | Total number of indexes in the shard <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_number_of_active_indexes</span> | gauge | count | The total number of indexes running a background indexing and/or background query processing operation. Background indexing refers to vector ingestion process, or in-progress background indexer. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_total_num_docs_in_indexes</span> | gauge | count | The total number of documents currently indexed across all indexes in the shard. <sup>[2](#tnote-2)</sup> |
| <span class="break-all">redis_server_search_number_of_active_indexes_running_queries</span> | gauge | count | Total count of indexes currently running a background query process. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_number_of_active_indexes_indexing</span> | gauge | count | Total count of indexes currently undergoing a background indexing process. Background indexing refers to vector ingestion process, or in-progress background indexer. This metric is limited by the number of WORKER threads allocated for writing operations + the number of indexes. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_total_active_write_threads</span> | gauge | count | Total count of background write (indexing) processes currently running in the shard. Background indexing refers to vector ingestion process, or in-progress background indexer. This metric is limited by the number of threads allocated for writing operations. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_fields_text_Text</span> | gauge | count | The total number of `TEXT` fields across all indexes in the shard. This field appears only if its value is larger than 0. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_fields_text_Sortable</span> | gauge | count | The total number of `SORTABLE TEXT` fields across all indexes in the shard. This field appears only if its value is larger than 0. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_fields_text_NoIndex</span> | gauge | count | The total number of `NOINDEX TEXT` fields across all indexes in the shard; i.e., used for sorting only but not indexed. This field appears only if its value is larger than 0. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_fields_text_IndexErrors</span> | gauge | count | The total number of indexing failures caused by attempts to index a document containing a `TEXT` field. This field appears only if `TEXT` fields exist. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_fields_numeric_Numeric</span> | gauge | count | The total number of `NUMERIC` fields across all indexes in the shard. This field appears only if its value is larger than 0. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_fields_numeric_Sortable</span> | gauge | count | The total number of `SORTABLE NUMERIC` fields across all indexes in the shard. This field appears only if its value is larger than 0. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_fields_numeric_NoIndex</span> | gauge | count | The total number of `NOINDEX NUMERIC` fields across all indexes in the shard, which are used for sorting only but not indexed. This field appears only if its value is larger than 0. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_fields_numeric_IndexErrors</span> | gauge | count | The total number of indexing failures caused by attempts to index a document containing a `NUMERIC` field. This field appears only if `NUMERIC` fields exist. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_fields_tag_Tag</span> | gauge | count | The total number of `TAG` fields across all indexes in the shard. This field appears only if its value is larger than 0. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_fields_tag_Sortable</span> | gauge | count | The total number of `SORTABLE TAG` fields across all indexes in the shard. This field appears only if its value is larger than 0. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_fields_tag_NoIndex</span> | gauge | count | The total number of `NOINDEX TAG` fields across all indexes in the shard; i.e., used for sorting only but not indexed. This field appears only if its value is larger than 0. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_fields_tag_CaseSensitive</span> | gauge | count | The total number of `CASESENSITIVE TAG` fields across all indexes in the shard. This field appears only if its value is larger than 0. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_fields_tag_IndexErrors</span> | gauge | count | The total number of indexing failures caused by attempts to index a document containing a `TAG` field. This field appears only if `TAG` fields exist. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_fields_geo_Geo</span> | gauge | count | The total number of `GEO` fields across all indexes in the shard. This field appears only if its value is larger than 0. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_fields_geo_Sortable</span> | gauge | count | The total number of `SORTABLE GEO` fields across all indexes in the shard. This field appears only if its value is larger than 0. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_fields_geo_NoIndex</span> | gauge | count | The total number of `NOINDEX GEO` fields across all indexes in the shard; i.e., used for sorting only but not indexed. This field appears only if its value is larger than 0. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_fields_geo_IndexErrors</span> | gauge | count | The total number of indexing failures caused by attempts to index a document containing a `GEO` field. This field appears only if `GEO` fields exist. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_fields_vector_Vector</span> | gauge | count | The total number of `VECTOR` fields across all indexes in the shard. This field appears only if its value is larger than 0. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_fields_vector_Flat</span> | gauge | count | The total number of `FLAT VECTOR` fields across all indexes in the shard. This field appears only if its value is larger than 0. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_fields_vector_HNSW</span> | gauge | count | The total number of `HNSW VECTOR` fields across all indexes in the shard. This field appears only if its value is larger than 0. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_fields_vector_SVS_VAMANA</span> | gauge | count | The total number of `SVS-VAMANA VECTOR` fields across all indexes in the shard. This field appears only if its value is larger than 0. <sup>[4](#tnote-4)</sup> |
| <span class="break-all">redis_server_search_fields_vector_SVS_VAMANA_Compressed</span> | gauge | count | The total number of `SVS-VAMANA VECTOR` fields with `COMPRESSION` enabled (e.g., `LVQ8`) across all indexes in the shard. This field appears only if its value is larger than 0. <sup>[4](#tnote-4)</sup> |
| <span class="break-all">redis_server_search_fields_vector_IndexErrors</span> | gauge | count | The total number of indexing failures caused by attempts to index a document containing a `VECTOR` field. This field appears only if `VECTOR` fields exist. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_fields_geoshape_Geoshape</span> | gauge | count | The total number of `GEOSHAPE` fields across all indexes in the shard. This field appears only if its value is larger than 0. <sup>[2](#tnote-2)</sup> |
| <span class="break-all">redis_server_search_fields_geoshape_Sortable</span> | gauge | count | The total number of `SORTABLE GEOSHAPE` fields across all indexes in the shard. This field appears only if its value is larger than 0. <sup>[2](#tnote-2)</sup> |
| <span class="break-all">redis_server_search_fields_geoshape_NoIndex</span> | gauge | count | The total number of `NOINDEX GEOSHAPE` fields across all indexes in the shard; i.e., used for sorting only but not indexed. This field appears only if its value is larger than 0. <sup>[2](#tnote-2)</sup> |
| <span class="break-all">redis_server_search_fields_geoshape_IndexErrors</span> | gauge | count | The total number of indexing failures caused by attempts to index a document containing a `GEOSHAPE` field. This field appears only if `GEOSHAPE` fields exist. <sup>[2](#tnote-2)</sup> |
| <span class="break-all">redis_server_search_total_indexing_ops_text_fields</span> | gauge | count | The total number of indexing operations performed on `TEXT` fields across all indexes in the shard. <sup>[2](#tnote-2)</sup> |
| <span class="break-all">redis_server_search_total_indexing_ops_tag_fields</span> | gauge | count | The total number of indexing operations performed on `TAG` fields across all indexes in the shard. <sup>[2](#tnote-2)</sup> |
| <span class="break-all">redis_server_search_total_indexing_ops_numeric_fields</span> | gauge | count | The total number of indexing operations performed on `NUMERIC` fields across all indexes in the shard. <sup>[2](#tnote-2)</sup> |
| <span class="break-all">redis_server_search_total_indexing_ops_geo_fields</span> | gauge | count | The total number of indexing operations performed on `GEO` fields across all indexes in the shard. <sup>[2](#tnote-2)</sup> |
| <span class="break-all">redis_server_search_total_indexing_ops_geoshape_fields</span> | gauge | count | The total number of indexing operations performed on `GEOSHAPE` fields across all indexes in the shard. <sup>[2](#tnote-2)</sup> |
| <span class="break-all">redis_server_search_total_indexing_ops_vector_fields</span> | gauge | count | The total number of indexing operations performed on `VECTOR` fields across all indexes in the shard. <sup>[2](#tnote-2)</sup> |
| <span class="break-all">redis_server_search_used_memory_indexes</span> | gauge | bytes | The total memory allocated by all indexes in the shard in bytes. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_smallest_memory_index</span> | gauge | bytes | The memory usage of the index with the smallest memory usage in the shard in bytes. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_largest_memory_index</span> | gauge | bytes | The memory usage of the index with the largest memory usage in the shard in bytes. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_total_indexing_time</span> | gauge | milliseconds | The total time spent on indexing operations, excluding the background indexing of vectors in the `HNSW` graph. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_used_memory_vector_index</span> | gauge | bytes | The total memory usage of all vector indexes in the shard. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_total_queries_processed</span> | gauge | count | The total number of successful query executions (When using cursors, not counting reading from existing cursors) in the shard. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_total_query_commands</span> | gauge | count | The total number of successful query command executions (including `FT.SEARCH`, `FT.AGGREGATE`, and `FT.CURSOR READ`). <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_total_query_execution_time_ms</span> | gauge | milliseconds | The cumulative execution time of all query commands, including `FT.SEARCH`, `FT.AGGREGATE`, and `FT.CURSOR READ`, measured in ms. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_total_active_queries</span> | gauge | count | The total number of background queries currently being executed in the shard, excluding `FT.CURSOR READ`. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_errors_indexing_failures</span> | gauge | count | The total number of indexing failures recorded across all indexes in the shard. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_errors_for_index_with_max_failures</span> | gauge | count | The number of indexing failures in the index with the highest count of failures. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_OOM_indexing_failures_indexes_count</span> | gauge | count | The count of indexes that experienced out-of-memory (OOM) failures during background indexing. <sup>[2](#tnote-2)</sup> |
| <span class="break-all">redis_server_search_shard_total_query_errors_syntax</span> | gauge | count | The total number of query syntax errors occurred in the shard. <sup>[2](#tnote-2)</sup> |
| <span class="break-all">redis_server_search_shard_total_query_errors_arguments</span> | gauge | count | The total number of queries in the shard that failed due to missing or invalid arguments. <sup>[2](#tnote-2)</sup> |
| <span class="break-all">redis_server_search_shard_total_query_errors_timeout</span> | gauge | count | The total number of query timeout errors occurred in the shard (when timeout policy is 'fail'). <sup>[2](#tnote-2)</sup> |
| <span class="break-all">redis_server_search_shard_total_query_warnings_timeout</span> | gauge | count | The total number of query timeout warnings occurred in the shard (when timeout policy is 'return partial results'). <sup>[2](#tnote-2)</sup> |
| <span class="break-all">redis_server_search_shard_total_query_errors_oom</span> | gauge | count | The total number of query out-of-memory errors occurred in the shard. <sup>[4](#tnote-4)</sup> |
| <span class="break-all">redis_server_search_shard_total_query_warnings_oom</span> | gauge | count | The total number of query out-of-memory warnings occurred in the shard. <sup>[4](#tnote-4)</sup> |
| <span class="break-all">redis_server_search_shard_total_query_warnings_max_prefix_expansions</span> | gauge | count | The total number of max prefix expansion warnings occurred in the shard. <sup>[2](#tnote-2)</sup> |
| <span class="break-all">redis_server_search_coord_total_query_errors_syntax</span> | gauge | count | The total number of query syntax errors occurred at the coordinator. <sup>[2](#tnote-2)</sup> |
| <span class="break-all">redis_server_search_coord_total_query_errors_arguments</span> | gauge | count | The total number of query argument errors encountered by the shard's coordinator. <sup>[2](#tnote-2)</sup> |
| <span class="break-all">redis_server_search_coord_total_query_errors_timeout</span> | gauge | count | The total number of query timeout errors encountered by the shard's coordinator (when timeout policy is 'fail'). <sup>[2](#tnote-2)</sup> |
| <span class="break-all">redis_server_search_coord_total_query_warnings_timeout</span> | gauge | count | The total number of query timeout warnings encountered by the shard's coordinator (when timeout policy is 'return partial results'). <sup>[2](#tnote-2)</sup> |
| <span class="break-all">redis_server_search_coord_total_query_errors_oom</span> | gauge | count | The total number of query out-of-memory errors encountered by the shard's coordinator. <sup>[4](#tnote-4)</sup> |
| <span class="break-all">redis_server_search_coord_total_query_warnings_oom</span> | gauge | count | The total number of query out-of-memory warnings encountered by the shard's coordinator. <sup>[4](#tnote-4)</sup> |
| <span class="break-all">redis_server_search_coord_total_query_warnings_max_prefix_expansions</span> | gauge | count | The total number of max prefix expansion warnings encountered by the shard's coordinator. <sup>[2](#tnote-2)</sup> |
| <span class="break-all">redis_server_search_uv_threads_running_queries</span> | gauge | count | The number of I/O threads currently handling query distribution to shards in cluster environments. <sup>[2](#tnote-2)</sup> |
| <span class="break-all">redis_server_search_uv_threads_running_topology_update</span> | gauge | count | The number of UV threads currently running topology updates. <sup>[3](#tnote-3)</sup> |
| <span class="break-all">redis_server_search_active_worker_threads</span> | gauge | count | The number of active worker threads. <sup>[2](#tnote-2)</sup> |
| <span class="break-all">redis_server_search_active_coord_threads</span> | gauge | count | The number of active coordinator threads. <sup>[2](#tnote-2)</sup> |
| <span class="break-all">redis_server_search_workers_low_priority_pending_jobs</span> | gauge | count | The number of pending low-priority jobs in worker threads, such as vector background indexing, graph updates, and vector garbage collection in graph-based indexes. <sup>[2](#tnote-2)</sup> |
| <span class="break-all">redis_server_search_workers_high_priority_pending_jobs</span> | gauge | count | The number of pending high-priority jobs in worker threads, such as query execution. <sup>[2](#tnote-2)</sup> |
| <span class="break-all">redis_server_search_workers_admin_priority_pending_jobs</span> | gauge | count | The number of pending admin-priority jobs in worker threads, such as threadpool configuration changes. <sup>[3](#tnote-3)</sup> |
| <span class="break-all">redis_server_search_coord_high_priority_pending_jobs</span> | gauge | count | The number of pending jobs in the coordinator thread queue. Coordinator threads only have a high-priority queue and are primarily used for query distribution. <sup>[2](#tnote-2)</sup> |
| <span class="break-all">shard_ping_failures</span> | gauge | count | Number of consecutive ping failures for a shard. Labels: shard_uid, role |
| <span class="break-all">shard_ping_failure_duration_seconds</span> | gauge | seconds | Duration of ongoing failures (0 when healthy). Labels: shard_uid, role |

1. <a name="tnote-1"></a> Available since RediSearch 2.6.
2. <a name="tnote-2"></a> Available since RediSearch 2.8.
3. <a name="tnote-3"></a> Available since RediSearch 2.10.
4. <a name="tnote-4"></a> Available since RediSearch 8.0.
