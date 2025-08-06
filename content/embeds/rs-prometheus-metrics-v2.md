## Database metrics

| Metric | Type | Description |
| :-------- | :--- | :---------- |
| <span class="break-all">endpoint_client_connections</span> | counter | Number of client connection establishment events |
| <span class="break-all">endpoint_client_disconnections</span> | counter | Number of client disconnections initiated by the client |
| <span class="break-all">endpoint_client_connection_expired</span> | counter | Total number of client connections with expired TTL (Time To Live) |
| <span class="break-all">endpoint_client_establishment_failures</span> | counter | Number of client connections that failed to establish properly |
| <span class="break-all">endpoint_client_expiration_refresh</span> | counter | Number of expiration time changes of clients |
| <span class="break-all">endpoint_client_tracking_off_requests</span> | counter | Total number of `CLIENT TRACKING OFF` requests |
| <span class="break-all">endpoint_client_tracking_on_requests</span> | counter | Total number of `CLIENT TRACKING ON` requests |
| <span class="break-all">endpoint_disconnected_cba_client</span> | counter | Number of certificate-based clients disconnected |
| <span class="break-all">endpoint_disconnected_ldap_client</span> | counter | Number of LDAP clients disconnected |
| <span class="break-all">endpoint_disconnected_user_password_client</span> | counter | Number of user&password clients disconnected |
| <span class="break-all">endpoint_disposed_commands_after_client_caching</span> | counter | Total number of client caching commands that were disposed due to misuse |
| <span class="break-all">endpoint_egress</span> | counter | Number of egress bytes |
| <span class="break-all">endpoint_egress_pending</span> | counter | Number of send-pending bytes |
| <span class="break-all">endpoint_egress_pending_discarded</span> | counter | Number of send-pending bytes that were discarded due to disconnection |
| <span class="break-all">endpoint_failed_cba_authentication</span> | counter | Number of clients that failed certificate-based authentication |
| <span class="break-all">endpoint_failed_ldap_authentication</span> | counter | Number of clients that failed LDAP authentication |
| <span class="break-all">endpoint_failed_user_password_authentication</span> | counter | Number of clients that failed user password authentication |
| <span class="break-all">endpoint_ingress</span> | counter | Number of ingress bytes |
| <span class="break-all">endpoint_longest_pipeline_histogram</span> | counter | Tracks the distribution of longest observed pipeline lengths, where a pipeline is a sequence of client commands sent without waiting for responses. |
| <span class="break-all">endpoint_other_requests</span> | counter | Number of other requests |
| <span class="break-all">endpoint_other_requests_latency_histogram</span> | histogram | Latency (in µs) histogram of other commands |
| <span class="break-all">endpoint_other_requests_latency_histogram_bucket</span> | histogram | Latency histograms for commands other than read or write commands. Can be used to represent different latency percentiles.<br />p99.9 example:<br /><span class="break-all">`histogram_quantile(0.999, sum(rate(endpoint_other_requests_latency_histogram_bucket{cluster="$cluster", db="$db"}[$__rate_interval]) ) by (le, db))`</span> |
| <span class="break-all">endpoint_other_responses</span> | counter | Number of other responses |
| <span class="break-all">endpoint_proxy_disconnections</span> | counter | Number of client disconnections initiated by the proxy |
| <span class="break-all">endpoint_read_requests</span> | counter | Number of read requests |
| <span class="break-all">endpoint_read_requests_latency_histogram</span> | histogram | Latency (in µs) histogram of read commands |
| <span class="break-all">endpoint_read_requests_latency_histogram_bucket</span> | histogram | Latency histograms for read commands. Can be used to represent different latency percentiles.<br />p99.9 example:<br /><span class="break-all">`histogram_quantile(0.999, sum(rate(endpoint_read_requests_latency_histogram_bucket{cluster="$cluster", db="$db"}[$__rate_interval]) ) by (le, db))`</span> |
| <span class="break-all">endpoint_read_responses</span> | counter | Number of read responses |
| <span class="break-all">endpoint_successful_cba_authentication</span> | counter | Number of clients that successfully authenticated with certificate-based authentication |
| <span class="break-all">endpoint_successful_ldap_authentication</span> | counter | Number of clients that successfully authenticated with LDAP |
| <span class="break-all">endpoint_successful_user_password_authentication</span> | counter | Number of clients that successfully authenticated with user&password |
| <span class="break-all">endpoint_write_requests</span> | counter | Number of write requests |
| <span class="break-all">endpoint_write_requests_latency_histogram</span> | histogram | Latency (in µs) histogram of write commands |
| <span class="break-all">endpoint_write_requests_latency_histogram_bucket</span> | histogram | Latency histograms for write commands. Can be used to represent different latency percentiles.<br />p99.9 example:<br /><span class="break-all">`histogram_quantile(0.999, sum(rate(endpoint_write_requests_latency_histogram_bucket{cluster="$cluster", db="$db"}[$__rate_interval]) ) by (le, db))`</span> |
| <span class="break-all">endpoint_write_responses</span> | counter | Number of write responses |
| <span class="break-all">proxy_connections_rate</span> | gauge | The rate of incoming connections. Computed as `n_accepted / N` for the last interval where `n_accepted` is the number of accepted connections in this interval, and `N` is the interval in seconds. |
| <span class="break-all">proxy_rate_limit_ok</span> | gauge | Rate limit status based on the last 2 intervals.<br />0 = rate limit was recently exceeded<br />1 = rate limit was not recently exceeded |
| <span class="break-all">proxy_rate_limit_overflows</span> | counter | Total number of rate limit overflows |

## Node metrics

| Metric | Type |Description |
| :-------- | :--- | :---------- |
| <span class="break-all">node_available_flash_bytes</span> | gauge | Available flash in the node (bytes) |
| <span class="break-all">node_available_flash_no_overbooking_bytes</span> | gauge | Available flash in the node (bytes), without taking into account overbooking |
| <span class="break-all">node_available_memory_bytes</span> | gauge | Amount of free memory in the node (bytes) that is available for database provisioning |
| <span class="break-all">node_available_memory_no_overbooking_bytes</span> | gauge | Available RAM in the node (bytes) without taking into account overbooking |
| <span class="break-all">node_bigstore_free_bytes</span> | gauge | Sum of free space of back-end flash (used by flash database's [BigRedis]) on all cluster nodes (bytes); returned only when BigRedis is enabled |
| <span class="break-all">node_cert_expires_in_seconds</span> | gauge | Certificate expiration (in seconds) per given node; read more about [certificates in Redis Enterprise]({{< relref "/operate/rs/security/certificates" >}}) and [monitoring certificates]({{< relref "/operate/rs/security/certificates/monitor-certificates" >}}) |
| <span class="break-all">node_ephemeral_storage_avail_bytes</span> | gauge | Disk space available to RLEC processes on configured ephemeral disk (bytes) |
| <span class="break-all">node_ephemeral_storage_free_bytes</span> | gauge | Free disk space on configured ephemeral disk (bytes) |
| <span class="break-all">node_memory_MemFree_bytes</span> | gauge | Free memory in the node (bytes) |
| <span class="break-all">node_persistent_storage_avail_bytes</span> | gauge | Disk space available to RLEC processes on configured persistent disk (bytes) |
| <span class="break-all">node_persistent_storage_free_bytes</span> | gauge | Free disk space on configured persistent disk (bytes) |
| <span class="break-all">node_provisional_flash_bytes</span> | gauge | Amount of flash available for new shards on this node, taking into account overbooking, max Redis servers, reserved flash, and provision and migration thresholds (bytes) |
| <span class="break-all">node_provisional_flash_no_overbooking_bytes</span> | gauge | Amount of flash available for new shards on this node, without taking into account overbooking, max Redis servers, reserved flash, and provision and migration thresholds (bytes) |
| <span class="break-all">node_provisional_memory_bytes</span> | gauge | Amount of RAM that is available for provisioning to databases out of the total RAM allocated for databases |
| <span class="break-all">node_provisional_memory_no_overbooking_bytes</span> | gauge | Amount of RAM that is available for provisioning to databases out of the total RAM allocated for databases, without taking into account overbooking |
| <span class="break-all">node_metrics_up</span> | gauge | Node is part of the cluster and is connected |

## Cluster metrics

| Metric | Type | Description |
| :-------- | :--- | :---------- |
| <span class="break-all">generation{cluster_wd=<node_uid>}</span> | gauge| Generation number of the specific cluster_wd|
| <span class="break-all">has_qourum{cluster_wd=<node_uid>, has_witness_disk=BOOL}</span> | gauge| Has_qourum = 1<br />No quorum = 0 |
| <span class="break-all">is_primary{cluster_wd=<node_uid>}</span> | gauge| primary = 1<br />secondary = 0 |
| <span class="break-all">license_expiration_days</span> | gauge | Number of days until the license expires |
| <span class="break-all">license_shards_limit</span> | gauge | Total shard limit by the license by shard type (ram / flash) |
| <span class="break-all">total_live_nodes_count{cluster_wd=<node_uid>}</span> | gauge| Number of live nodes|
| <span class="break-all">total_node_count{cluster_wd=<node_uid>}</span> | gauge| Number of nodes |
| <span class="break-all">total_primary_selection_ended{cluster_wd=<node_uid>}</span> | counter | Monotonic counter for each selection process that ended |
| <span class="break-all">total_primary_selections{cluster_wd=<node_uid>}</span> | counter | Monotonic counter for each selection process that started|

## Replication metrics

| Metric | Type | Description |
| :-------- | :--- | :---------- |
| <span class="break-all">database_syncer_config</span> | gauge | Used as a placeholder for configuration labels |
| <span class="break-all">database_syncer_current_status</span> | gauge | Syncer status for traffic; 0 = in-sync, 2 = out of sync |
| <span class="break-all">database_syncer_dst_connectivity_state</span> | gauge | Destination connectivity state |
| <span class="break-all">database_syncer_dst_connectivity_state_ms</span> | gauge | Destination connectivity state duration |
| <span class="break-all">database_syncer_dst_lag</span> | gauge | Lag in milliseconds between the syncer and the destination |
| <span class="break-all">database_syncer_dst_repl_offset</span> | gauge | Offset of the last command acknowledged |
| <span class="break-all">database_syncer_flush_counter</span> | gauge | Number of destination flushes |
| <span class="break-all">database_syncer_ingress_bytes</span> | gauge | Number of bytes read from source shard |
| <span class="break-all">database_syncer_ingress_bytes_decompressed</span> | gauge | Number of bytes read from source shard |
| <span class="break-all">database_syncer_internal_state</span> | gauge | Internal state of the syncer |
| <span class="break-all">database_syncer_lag_ms</span> | gauge | Lag time between the source and the destination for traffic in milliseconds |
| <span class="break-all">database_syncer_rdb_size</span> | gauge | The source's RDB size in bytes to be transferred during the syncing phase |
| <span class="break-all">database_syncer_rdb_transferred</span> | gauge | Number of bytes transferred from the source's RDB during the syncing phase |
| <span class="break-all">database_syncer_src_connectivity_state</span> | gauge | Source connectivity state |
| <span class="break-all">database_syncer_src_connectivity_state_ms</span> | gauge | Source connectivity state duration |
| <span class="break-all">database_syncer_src_repl_offset</span> | gauge | Last known source offset |
| <span class="break-all">database_syncer_state</span> | gauge | Internal state of the shard syncer |
| <span class="break-all">database_syncer_syncer_repl_offset</span> | gauge | Offset of the last command handled by the syncer |
| <span class="break-all">database_syncer_total_requests</span> | gauge | Number of destination writes |
| <span class="break-all">database_syncer_total_responses</span> | gauge | Number of destination writes acknowledged |

## Shard metrics

| Metric | Description |
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
| <span class="break-all">redis_server_db_avg_ttl</span> | Average TTL of all volatile keys |
| <span class="break-all">redis_server_db0_avg_ttl</span> | Average TTL of all volatile keys. Deprecated. |
| <span class="break-all">redis_server_db_keys</span> | Total key count. |
| <span class="break-all">redis_server_db0_keys</span> | Total key count. Deprecated. |
| <span class="break-all">redis_server_evicted_keys</span> | Keys evicted so far (since restart) |
| <span class="break-all">redis_server_expire_cycle_cpu_milliseconds</span> | The cumulative amount of time spent on active expiry cycles |
| <span class="break-all">redis_server_expired_keys</span> | Keys expired so far since restart |
| <span class="break-all">redis_server_forwarding_state</span> | Shard forwarding state (on or off) |
| <span class="break-all">redis_server_hashes_items_under_1M</span> | Number of hash keys with under 1 million elements |
| <span class="break-all">redis_server_hashes_items_1M_to_8M</span> | Number of hash keys with an element count between 1 million and 8 million |
| <span class="break-all">redis_server_hashes_items_over_8M</span> | Number of hash keys with over 8 million elements |
| <span class="break-all">redis_server_keys_trimmed</span> | The number of keys that were trimmed in the current or last resharding process |
| <span class="break-all">redis_server_keyspace_read_hits</span> | Number of read operations accessing an existing keyspace |
| <span class="break-all">redis_server_keyspace_read_misses</span> | Number of read operations accessing a non-existing keyspace |
| <span class="break-all">redis_server_keyspace_write_hits</span> | Number of write operations accessing an existing keyspace |
| <span class="break-all">redis_server_keyspace_write_misses</span> | Number of write operations accessing a non-existing keyspace |
| <span class="break-all">redis_server_lists_items_under_1M</span> | Number of list keys with under 1 million elements |
| <span class="break-all">redis_server_lists_items_1M_to_8M</span> | Number of list keys with an element count between 1 million and 8 million |
| <span class="break-all">redis_server_lists_items_over_8M</span> | Number of list keys with over 8 million elements |
| <span class="break-all">redis_server_master_link_status</span> | Indicates if the replica is connected to its master |
| <span class="break-all">redis_server_master_repl_offset</span> | Number of bytes sent to replicas by the shard; calculate the throughput for a time period by comparing the value at different times |
| <span class="break-all">redis_server_master_sync_in_progress</span> | The primary shard is synchronizing (1 true; 0 false) |
| <span class="break-all">redis_server_max_process_mem</span> | Current memory limit configured by redis_mgr according to node free memory |
| <span class="break-all">redis_server_maxmemory</span> | Current memory limit configured by redis_mgr according to database memory limits |
| <span class="break-all">redis_server_mem_aof_buffer</span> | Current size of AOF buffer |
| <span class="break-all">redis_server_mem_clients_normal</span> | Current memory used for input and output buffers of non-replica clients |
| <span class="break-all">redis_server_mem_clients_slaves</span> | Current memory used for input and output buffers of replica clients |
| <span class="break-all">redis_server_mem_fragmentation_ratio</span> | Memory fragmentation ratio (1.3 means 30% overhead) |
| <span class="break-all">redis_server_mem_not_counted_for_evict</span> | Portion of used_memory (in bytes) that's not counted for eviction and OOM error |
| <span class="break-all">redis_server_mem_replication_backlog</span> | Size of replication backlog |
| <span class="break-all">redis_server_module_fork_in_progress</span> | A binary value that indicates if there is an active fork spawned by a module (1) or not (0) |
| <span class="break-all">namedprocess_namegroup_cpu_seconds_total</span> | Shard process CPU usage in seconds |
| <span class="break-all">namedprocess_namegroup_thread_cpu_seconds_total</span> | Shard main thread CPU time spent in seconds |
| <span class="break-all">namedprocess_namegroup_open_filedesc</span> | Shard number of open file descriptors |
| <span class="break-all">namedprocess_namegroup_memory_bytes</span> | Shard memory size in bytes |
| <span class="break-all">namedprocess_namegroup_oldest_start_time_seconds</span> | Shard start time of the process since unix epoch in seconds |
| <span class="break-all">redis_server_rdb_bgsave_in_progress</span> | Indication if bgsave is currently in progress |
| <span class="break-all">redis_server_rdb_last_cow_size</span> | Last bgsave (or SYNC fork) used CopyOnWrite memory |
| <span class="break-all">redis_server_rdb_saves</span> | Total count of bgsaves since the process was restarted (including replica fullsync and persistence) |
| <span class="break-all">redis_server_sets_items_under_1M</span> | Number of set keys with under 1 million elements |
| <span class="break-all">redis_server_sets_items_1M_to_8M</span> | Number of set keys with an element count between 1 million and 8 million |
| <span class="break-all">redis_server_sets_items_over_8M</span> | Number of set keys with over 8 million elements |
| <span class="break-all">redis_server_repl_touch_bytes</span> | Number of bytes sent to replicas as TOUCH commands by the shard as a result of a READ command that was processed; calculate the throughput for a time period by comparing the value at different times |
| <span class="break-all">redis_server_total_commands_processed</span> | Number of commands processed by the shard; calculate the number of commands for a time period by comparing the value at different times |
| <span class="break-all">redis_server_total_connections_received</span> | Number of connections received by the shard; calculate the number of connections for a time period by comparing the value at different times |
| <span class="break-all">redis_server_total_net_input_bytes</span> | Number of bytes received by the shard; calculate the throughput for a time period by comparing the value at different times |
| <span class="break-all">redis_server_total_net_output_bytes</span> | Number of bytes sent by the shard; calculate the throughput for a time period by comparing the value at different times |
| <span class="break-all">redis_server_up</span> | Shard is up and running |
| <span class="break-all">redis_server_strings_sizes_under_128M</span> | Number of string keys with a memory size under 128 megabytes |
| <span class="break-all">redis_server_strings_sizes_128M_to_512M</span> | Number of string keys with a memory size between 128 and 512 megabytes |
| <span class="break-all">redis_server_strings_sizes_over_512M</span> | Number of string keys with a memory size over 512 megabytes |
| <span class="break-all">redis_server_used_memory</span> | Memory used by shard (in BigRedis this includes flash) (bytes) |
| <span class="break-all">redis_server_zsets_items_under_1M</span> | Number of sorted set keys with under 1 million elements |
| <span class="break-all">redis_server_zsets_items_1M_to_8M</span> | Number of sorted set keys with an element count between 1 million and 8 million |
| <span class="break-all">redis_server_zsets_items_over_8M</span> | Number of sorted set keys with over 8 million elements |
| <span class="break-all">redis_server_search_gc_bytes_collected</span> | The total amount of memory freed by the garbage collectors from indexes in the shard's memory in bytes. <sup>[3](#tnote-3)</sup> |
| <span class="break-all">redis_server_search_bytes_collected</span> | The total amount of memory freed by the garbage collectors from indexes in the shard's memory in bytes. Deprecated in 8.0 (renamed redis_server_search_gc_bytes_collected), but still available in older versions. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_gc_marked_deleted_vectors</span> | The number of vectors marked as deleted in the vector indexes that have not yet been cleaned. <sup>[3](#tnote-3)</sup> |
| <span class="break-all">redis_server_search_marked_deleted_vectors</span> | The number of vectors marked as deleted in the vector indexes that have not yet been cleaned. Deprecated in 8.0 (renamed redis_server_search_gc_marked_deleted_vectors), but still available in older versions. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_gc_total_cycles</span> | The total number of garbage collection cycles executed. <sup>[3](#tnote-3)</sup> |
| <span class="break-all">redis_server_search_total_cycles</span> | The total number of garbage collection cycles executed. Deprecated in 8.0 (renamed redis_server_search_gc_total_cycles), but still available in older versions. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_gc_total_docs_not_collected_by_gc</span> | The number of documents marked as deleted, whose memory has not yet been freed by the garbage collector. <sup>[3](#tnote-3)</sup> |
| <span class="break-all">redis_server_search_total_docs_not_collected_by_gc</span> | The number of documents marked as deleted, whose memory has not yet been freed by the garbage collector. Deprecated in 8.0 (renamed redis_server_search_gc_total_docs_not_collected_by_gc), but still available in older versions. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_gc_total_ms_run</span> | The total duration of all garbage collection cycles in the shard, measured in milliseconds. <sup>[3](#tnote-3)</sup> |
| <span class="break-all">redis_server_search_total_ms_run</span> | The total duration of all garbage collection cycles in the shard, measured in milliseconds. Deprecated in 8.0 (renamed redis_server_search_gc_total_ms_run), but still available in older versions. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_cursors_internal_idle</span> | The total number of coordinator cursors that are currently holding pending results in the shard. <sup>[3](#tnote-3)</sup> |
| <span class="break-all">redis_server_search_cursors_user_idle</span> | The total number of cursors that were explicitly requested by users, that are currently holding pending results in the shard. <sup>[3](#tnote-3)</sup> |
| <span class="break-all">redis_server_search_global_idle</span> | The total number of user and internal cursors currently holding pending results in the shard. Deprecated in 8.0 (split into redis_server_search_cursors_internal_idle and redis_server_search_cursors_user_idle), but still available in older versions. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_cursors_internal_active</span> | The total number of coordinator cursors in the shard, either holding pending results or actively executing `FT.CURSOR READ`. <sup>[3](#tnote-3)</sup> |
| <span class="break-all">redis_server_search_cursors_user_active</span> | The total number of user cursors in the shard, either holding pending results or actively executing `FT.CURSOR READ`. <sup>[3](#tnote-3)</sup> |
| <span class="break-all">redis_server_search_global_total</span> | The total number of user and internal cursors in the shard, either holding pending results or actively executing `FT.CURSOR READ`. Deprecated in 8.0 (split into redis_server_search_cursors_internal_active and redis_server_search_cursors_user_active), but still available in older versions. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_number_of_indexes</span> | Total number of indexes in the shard <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_number_of_active_indexes</span> | The total number of indexes running a background indexing and/or background query processing operation. Background indexing refers to vector ingestion process, or in-progress background indexer. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_number_of_active_indexes_running_queries</span> | Total count of indexes currently running a background query process. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_number_of_active_indexes_indexing</span> | Total count of indexes currently undergoing a background indexing process. Background indexing refers to vector ingestion process, or in-progress background indexer. This metric is limited by the number of WORKER threads allocated for writing operations + the number of indexes. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_total_active_write_threads</span> | Total count of background write (indexing) processes currently running in the shard. Background indexing refers to vector ingestion process, or in-progress background indexer. This metric is limited by the number of threads allocated for writing operations. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_fields_text_Text</span> | The total number of `TEXT` fields across all indexes in the shard. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_fields_text_Sortable</span> | The total number of `SORTABLE TEXT` fields across all indexes in the shard. This field appears only if its value is larger than 0. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_fields_text_NoIndex</span> | The total number of `NOINDEX TEXT` fields across all indexes in the shard; i.e., used for sorting only but not indexed. This field appears only if its value is larger than 0. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_fields_numeric_Numeric</span> | The total number of `NUMERIC` fields across all indexes in the shard. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_fields_numeric_Sortable</span> | The total number of `SORTABLE NUMERIC` fields across all indexes in the shard. This field appears only if its value is larger than 0. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_fields_numeric_NoIndex</span> | The total number of `NOINDEX NUMERIC` fields across all indexes in the shard, which are used for sorting only but not indexed. This field appears only if its value is larger than 0. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_fields_tag_Tag</span> | The total number of `TAG` fields across all indexes in the shard. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_fields_tag_Sortable</span> | The total number of `SORTABLE TAG` fields across all indexes in the shard. This field appears only if its value is larger than 0. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_fields_tag_NoIndex</span> | The total number of `NOINDEX TAG` fields across all indexes in the shard; i.e., used for sorting only but not indexed. This field appears only if its value is larger than 0. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_fields_tag_CaseSensitive</span> | The total number of `CASESENSITIVE TAG` fields across all indexes in the shard. This field appears only if its value is larger than 0. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_fields_geo_Geo</span> | The total number of `GEO` fields across all indexes in the shard. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_fields_geo_Sortable</span> | The total number of `SORTABLE GEO` fields across all indexes in the shard. This field appears only if its value is larger than 0. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_fields_geo_NoIndex</span> | The total number of `NOINDEX GEO` fields across all indexes in the shard; i.e., used for sorting only but not indexed. This field appears only if its value is larger than 0. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_fields_vector_Vector</span> | The total number of `VECTOR` fields across all indexes in the shard. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_fields_vector_Flat</span> | The total number of `FLAT VECTOR` fields across all indexes in the shard. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_fields_vector_HNSW</span> | The total number of `HNSW VECTOR` fields across all indexes in the shard. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_fields_geoshape_Geoshape</span> | The total number of `GEOSHAPE` fields across all indexes in the shard. <sup>[2](#tnote-2)</sup> |
| <span class="break-all">redis_server_search_fields_geoshape_Sortable</span> | The total number of `SORTABLE GEOSHAPE` fields across all indexes in the shard. This field appears only if its value is larger than 0. <sup>[2](#tnote-2)</sup> |
| <span class="break-all">redis_server_search_fields_geoshape_NoIndex</span> | The total number of `NOINDEX GEOSHAPE` fields across all indexes in the shard; i.e., used for sorting only but not indexed. This field appears only if its value is larger than 0. <sup>[2](#tnote-2)</sup> |
| <span class="break-all">redis_server_search_fields_<field>_IndexErrors</span> | The total number of indexing failures caused by attempts to index a document containing `<field>` field. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_used_memory_indexes</span> | The total memory allocated by all indexes in the shard in bytes. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_smallest_memory_index</span> | The memory usage of the index with the smallest memory usage in the shard in bytes. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_largest_memory_index</span> | The memory usage of the index with the largest memory usage in the shard in bytes. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_total_indexing_time</span> | The total time spent on indexing operations, excluding the background indexing of vectors in the `HNSW` graph. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_used_memory_vector_index</span> | The total memory usage of all vector indexes in the shard. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_global_idle</span> | The total number of user and internal cursors currently holding pending results in the shard. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_global_total</span> | The total number of user and internal cursors in the shard, either holding pending results or actively executing `FT.CURSOR READ`. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_bytes_collected</span> | The total amount of memory freed by the garbage collectors from indexes in the shard memory in bytes. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_total_cycles</span> | The total number of garbage collection cycles executed <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_total_ms_run</span> | The total duration of all garbage collection cycles in the shard, measured in milliseconds. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_total_docs_not_collected_by_gc</span> | The number of documents marked as deleted whose memory has not yet been freed by the garbage collector. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_marked_deleted_vectors</span> | The number of vectors marked as deleted in the vector indexes that have not yet been cleaned. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_total_queries_processed</span> | The total number of successful query executions (When using cursors, not counting reading from existing cursors) in the shard. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_total_query_commands</span> | The total number of successful query command executions (including `FT.SEARCH`, `FT.AGGREGATE`, and `FT.CURSOR READ`). <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_total_query_execution_time_ms</span> | The cumulative execution time of all query commands, including `FT.SEARCH`, `FT.AGGREGATE`, and `FT.CURSOR READ`, measured in ms. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_total_active_queries</span> | The total number of background queries currently being executed in the shard, excluding `FT.CURSOR READ`. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_errors_indexing_failures</span> | The total number of indexing failures recorded across all indexes in the shard. <sup>[1](#tnote-1)</sup> |
| <span class="break-all">redis_server_search_errors_for_index_with_max_failures</span> | The number of indexing failures in the index with the highest count of failures. <sup>[1](#tnote-1)</sup> |

1. <a name="tnote-1"></a> Available since RediSearch 2.6.
2. <a name="tnote-2"></a> Available since RediSearch 2.8.
3. <a name="tnote-3"></a> Available since RediSearch 8.0.
