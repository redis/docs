---
acl_categories:
- '@slow'
- '@dangerous'
arguments:
- display_text: section
  multiple: true
  name: section
  optional: true
  type: string
arity: -1
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- oss
- kubernetes
- clients
command_flags:
- loading
- stale
complexity: O(1)
description: Returns information and statistics about the server.
group: server
hidden: false
hints:
- nondeterministic_output
- request_policy:all_shards
- response_policy:special
history:
- - 7.0.0
  - Added support for taking multiple section arguments.
linkTitle: INFO
since: 1.0.0
summary: Returns information and statistics about the server.
syntax_fmt: INFO [section [section ...]]
syntax_str: ''
title: INFO
---
The `INFO` command returns information and statistics about the server in a
format that is simple to parse by computers and easy to read by humans.

The optional parameter can be used to select a specific section of information:

*   `server`: General information about the Redis server
*   `clients`: Client connections section
*   `memory`: Memory consumption related information
*   `persistence`: RDB and AOF related information
*   `threads`: I/O threads information
*   `stats`: General statistics
*   `replication`: Master/replica replication information
*   `cpu`: CPU consumption statistics
*   `commandstats`: Redis command statistics
*   `latencystats`: Redis command latency percentile distribution statistics
*   `sentinel`: Redis Sentinel section (only applicable to Sentinel instances)
*   `cluster`: Redis Cluster section
*   `modules`: Modules section
*   `keyspace`: Database related statistics
*   `errorstats`: Redis error statistics

It can also take the following values:

*   `all`: Return all sections (excluding module generated ones)
*   `default`: Return only the default set of sections
*   `everything`: Includes `all` and `modules`

When no parameter is provided, the `default` option is assumed.

{{< clients-example cmds_servermgmt info >}}
INFO
{{< /clients-example >}}

Give these commands a try in the interactive console:

{{% redis-cli %}}
INFO
{{% /redis-cli %}}


## Notes

Please note depending on the version of Redis some of the fields have been
added or removed. A robust client application should therefore parse the
result of this command by skipping unknown properties, and gracefully handle
missing fields.

Here is the description of fields for Redis >= 2.4.


Here is the meaning of all fields in the **server** section:

*   `redis_version`: Version of the Redis server
*   `redis_git_sha1`:  Git SHA1
*   `redis_git_dirty`: Git dirty flag
*   `redis_build_id`: The build id
*   `redis_mode`: The server's mode ("standalone", "sentinel" or "cluster")
*   `os`: Operating system hosting the Redis server
*   `arch_bits`: Architecture (32 or 64 bits)
*   `multiplexing_api`: Event loop mechanism used by Redis
*   `atomicvar_api`: Atomicvar API used by Redis
*   `gcc_version`: Version of the GCC compiler used to compile the Redis server
*   `process_id`: PID of the server process
*   `process_supervised`: Supervised system ("upstart", "systemd", "unknown" or "no")
*   `run_id`: Random value identifying the Redis server (to be used by Sentinel
     and Cluster)
*   `tcp_port`: TCP/IP listen port
*   `server_time_usec`: Epoch-based system time with microsecond precision
*   `uptime_in_seconds`: Number of seconds since Redis server start
*   `uptime_in_days`: Same value expressed in days
*   `hz`: The server's current frequency setting
*   `configured_hz`: The server's configured frequency setting
*   `lru_clock`: Clock incrementing every minute, for LRU management
*   `executable`: The path to the server's executable
*   `config_file`: The path to the config file
*   `io_threads_active`: Flag indicating if I/O threads are active
*   `shutdown_in_milliseconds`: The maximum time remaining for replicas to catch up the replication before completing the shutdown sequence.
    This field is only present during shutdown.

Here is the meaning of all fields in the **clients** section:

*   `connected_clients`: Number of client connections (excluding connections
     from replicas)
*   `cluster_connections`: An approximation of the number of sockets used by the
     cluster's bus
*   `maxclients`: The value of the `maxclients` configuration directive. This is
    the upper limit for the sum of `connected_clients`, `connected_slaves` and
    `cluster_connections`.
*   `client_recent_max_input_buffer`: Biggest input buffer among current client connections
*   `client_recent_max_output_buffer`: Biggest output buffer among current client connections
*   `blocked_clients`: Number of clients pending on a blocking call ([`BLPOP`]({{< relref "/commands/blpop" >}}),
     [`BRPOP`]({{< relref "/commands/brpop" >}}), [`BRPOPLPUSH`]({{< relref "/commands/brpoplpush" >}}), [`BLMOVE`]({{< relref "/commands/blmove" >}}), [`BZPOPMIN`]({{< relref "/commands/bzpopmin" >}}), [`BZPOPMAX`]({{< relref "/commands/bzpopmax" >}}))
*   `tracking_clients`: Number of clients being tracked ([`CLIENT TRACKING`]({{< relref "/commands/client-tracking" >}}))
*   `pubsub_clients`: Number of clients in pubsub mode ([`SUBSCRIBE`]({{< relref "/commands/subscribe" >}}), [`PSUBSCRIBE`]({{< relref "/commands/psubscribe" >}}), [`SSUBSCRIBE`]({{< relref "/commands/ssubscribe" >}})). Added in Redis 7.4
*   `watching_clients`: Number of clients in watching mode ([`WATCH`]({{< relref "/commands/watch" >}})). Added in Redis 7.4
*   `clients_in_timeout_table`: Number of clients in the clients timeout table
*   `total_watched_keys`: Number of watched keys. Added in Redis 7.4.
*   `total_blocking_keys`: Number of blocking keys. Added in Redis 7.2.
*   `total_blocking_keys_on_nokey`: Number of blocking keys that one or more clients that would like to be unblocked when the key is deleted. Added in Redis 7.2.

Here is the meaning of all fields in the **memory** section:

*   `used_memory`: Total number of bytes allocated by Redis using its
     allocator (either standard **libc**, **jemalloc**, or an alternative
     allocator such as [**tcmalloc**][hcgcpgp])
*   `used_memory_human`: Human readable representation of previous value
*   `used_memory_rss`: Number of bytes that Redis allocated as seen by the
     operating system (a.k.a resident set size). This is the number reported by
     tools such as `top(1)` and `ps(1)`
*   `used_memory_rss_human`: Human readable representation of previous value
*   `used_memory_peak`: Peak memory consumed by Redis (in bytes)
*   `used_memory_peak_human`: Human readable representation of previous value
*   `used_memory_peak_time`: Time when peak memory was recorded
*   `used_memory_peak_perc`: The percentage of `used_memory` out of `used_memory_peak`
*   `used_memory_overhead`: The sum in bytes of all overheads that the server
     allocated for managing its internal data structures
*   `used_memory_startup`: Initial amount of memory consumed by Redis at startup
     in bytes
*   `used_memory_dataset`: The size in bytes of the dataset
     (`used_memory_overhead` subtracted from `used_memory`)
*   `used_memory_dataset_perc`: The percentage of `used_memory_dataset` out of
     the net memory usage (`used_memory` minus `used_memory_startup`)
*   `total_system_memory`: The total amount of memory that the Redis host has
*   `total_system_memory_human`: Human readable representation of previous value
*   `used_memory_lua`: Number of bytes used by the Lua engine for EVAL scripts. Deprecated in Redis 7.0, renamed to `used_memory_vm_eval`
*   `used_memory_vm_eval`: Number of bytes used by the script VM engines for EVAL framework (not part of used_memory). Added in Redis 7.0
*   `used_memory_lua_human`: Human readable representation of previous value. Deprecated in Redis 7.0
*   `used_memory_scripts_eval`: Number of bytes overhead by the EVAL scripts (part of used_memory). Added in Redis 7.0
*   `number_of_cached_scripts`: The number of EVAL scripts cached by the server. Added in Redis 7.0
*   `number_of_functions`: The number of functions. Added in Redis 7.0
*   `number_of_libraries`: The number of libraries. Added in Redis 7.0
*   `used_memory_vm_functions`: Number of bytes used by the script VM engines for Functions framework (not part of used_memory). Added in Redis 7.0
*   `used_memory_vm_total`: `used_memory_vm_eval` + `used_memory_vm_functions` (not part of used_memory). Added in Redis 7.0
*   `used_memory_vm_total_human`: Human readable representation of previous value.
*   `used_memory_functions`: Number of bytes overhead by Function scripts (part of used_memory). Added in Redis 7.0
*   `used_memory_scripts`: `used_memory_scripts_eval` + `used_memory_functions` (part of used_memory). Added in Redis 7.0
*   `used_memory_scripts_human`: Human readable representation of previous value
*   `maxmemory`: The value of the `maxmemory` configuration directive
*   `maxmemory_human`: Human readable representation of previous value
*   `maxmemory_policy`: The value of the `maxmemory-policy` configuration
     directive
*   `mem_fragmentation_ratio`: Ratio between `used_memory_rss` and `used_memory`.
    Note that this doesn't only includes fragmentation, but also other process overheads (see the `allocator_*` metrics), and also overheads like code, shared libraries, stack, etc.
*   `mem_fragmentation_bytes`: Delta between `used_memory_rss` and `used_memory`.
    Note that when the total fragmentation bytes is low (few megabytes), a high ratio (e.g. 1.5 and above) is not an indication of an issue.
*   `allocator_frag_ratio:`: Ratio between `allocator_active` and `allocator_allocated`. This is the true (external) fragmentation metric (not `mem_fragmentation_ratio`).
*   `allocator_frag_bytes` Delta between `allocator_active` and `allocator_allocated`. See note about `mem_fragmentation_bytes`.
*   `allocator_rss_ratio`: Ratio between `allocator_resident` and `allocator_active`. This usually indicates pages that the allocator can and probably will soon release back to the OS.
*   `allocator_rss_bytes`: Delta between `allocator_resident` and `allocator_active`
*   `rss_overhead_ratio`: Ratio between `used_memory_rss` (the process RSS) and `allocator_resident`. This includes RSS overheads that are not allocator or heap related.
*   `rss_overhead_bytes`: Delta between `used_memory_rss` (the process RSS) and `allocator_resident`
*   `allocator_allocated`: Total bytes allocated form the allocator, including internal-fragmentation. Normally the same as `used_memory`.
*   `allocator_active`: Total bytes in the allocator active pages, this includes external-fragmentation.
*   `allocator_resident`: Total bytes resident (RSS) in the allocator, this includes pages that can be released to the OS (by [`MEMORY PURGE`]({{< relref "/commands/memory-purge" >}}), or just waiting).
*   `allocator_muzzy`: Total bytes of 'muzzy' memory (RSS) in the allocator. Muzzy memory is memory that has been freed, but not yet fully returned to the operating system. It can be reused immediately when needed or reclaimed by the OS when system pressure increases.
*   `mem_not_counted_for_evict`: Used memory that's not counted for key eviction. This is basically transient replica and AOF buffers.
*   `mem_clients_slaves`: Memory used by replica clients - Starting Redis 7.0, replica buffers share memory with the replication backlog, so this field can show 0 when replicas don't trigger an increase of memory usage.
*   `mem_clients_normal`: Memory used by normal clients
*   `mem_cluster_links`: Memory used by links to peers on the cluster bus when cluster mode is enabled.
*   `mem_cluster_slot_migration_output_buffer`: Memory usage of the migration client's output buffer. Redis writes incoming changes to this buffer during the migration process.
*   `mem_cluster_slot_migration_input_buffer`: Memory usage of the accumulated replication stream buffer on the importing node.
*   `mem_cluster_slot_migration_input_buffer_peak`: Peak accumulated repl buffer size on the importing side.
*   `mem_aof_buffer`: Transient memory used for AOF and AOF rewrite buffers
*   `mem_replication_backlog`: Memory used by replication backlog
*   `mem_total_replication_buffers`: Total memory consumed for replication buffers - Added in Redis 7.0.
*   `mem_allocator`: Memory allocator, chosen at compile time.
*   `mem_overhead_db_hashtable_rehashing`: Temporary memory overhead of database dictionaries currently being rehashed - Added in 7.4.
*   `active_defrag_running`: When `activedefrag` is enabled, this indicates whether defragmentation is currently active, and the CPU percentage it intends to utilize.
*   `lazyfree_pending_objects`: The number of objects waiting to be freed (as a
     result of calling [`UNLINK`]({{< relref "/commands/unlink" >}}), or [`FLUSHDB`]({{< relref "/commands/flushdb" >}}) and [`FLUSHALL`]({{< relref "/commands/flushall" >}}) with the **ASYNC**
     option)
*   `lazyfreed_objects`: The number of objects that have been lazy freed.

Ideally, the `used_memory_rss` value should be only slightly higher than
`used_memory`.
When rss >> used, a large difference may mean there is (external) memory fragmentation, which can be evaluated by checking
`allocator_frag_ratio`, `allocator_frag_bytes`.
When used >> rss, it means part of Redis memory has been swapped off by the
operating system: expect some significant latencies.

Because Redis does not have control over how its allocations are mapped to
memory pages, high `used_memory_rss` is often the result of a spike in memory
usage.

When Redis frees memory, the memory is given back to the allocator, and the
allocator may or may not give the memory back to the system. There may be
a discrepancy between the `used_memory` value and memory consumption as
reported by the operating system. It may be due to the fact memory has been
used and released by Redis, but not given back to the system. The
`used_memory_peak` value is generally useful to check this point.

Additional introspective information about the server's memory can be obtained
by referring to the [`MEMORY STATS`]({{< relref "/commands/memory-stats" >}}) command and the [`MEMORY DOCTOR`]({{< relref "/commands/memory-doctor" >}}).

Here is the meaning of all fields in the **persistence** section:

*   `loading`: Flag indicating if the load of a dump file is on-going
*   `async_loading`: Currently loading replication data-set asynchronously while serving old data. This means `repl-diskless-load` is enabled and set to `swapdb`. Added in Redis 7.0.
*   `current_cow_peak`: The peak size in bytes of copy-on-write memory
     while a child fork is running
*   `current_cow_size`: The size in bytes of copy-on-write memory
     while a child fork is running
*   `current_cow_size_age`: The age, in seconds, of the `current_cow_size` value.
*   `current_fork_perc`: The percentage of progress of the current fork process. For AOF and RDB forks it is the percentage of `current_save_keys_processed` out of `current_save_keys_total`.
*   `current_save_keys_processed`: Number of keys processed by the current save operation
*   `current_save_keys_total`: Number of keys at the beginning of the current save operation 
*   `rdb_changes_since_last_save`: Number of changes since the last dump
*   `rdb_bgsave_in_progress`: Flag indicating a RDB save is on-going
*   `rdb_last_save_time`: Epoch-based timestamp of last successful RDB save
*   `rdb_last_bgsave_status`: Status of the last RDB save operation
*   `rdb_last_bgsave_time_sec`: Duration of the last RDB save operation in
     seconds
*   `rdb_current_bgsave_time_sec`: Duration of the on-going RDB save operation
     if any
*   `rdb_last_cow_size`: The size in bytes of copy-on-write memory during
     the last RDB save operation
*   `rdb_last_load_keys_expired`: Number of volatile keys deleted during the last RDB loading. Added in Redis 7.0.
*   `rdb_last_load_keys_loaded`: Number of keys loaded during the last RDB loading. Added in Redis 7.0.
*   `aof_enabled`: Flag indicating AOF logging is activated
*   `aof_rewrite_in_progress`: Flag indicating a AOF rewrite operation is
     on-going
*   `aof_rewrite_scheduled`: Flag indicating an AOF rewrite operation
     will be scheduled once the on-going RDB save is complete.
*   `aof_last_rewrite_time_sec`: Duration of the last AOF rewrite operation in
     seconds
*   `aof_current_rewrite_time_sec`: Duration of the on-going AOF rewrite
     operation if any
*   `aof_last_bgrewrite_status`: Status of the last AOF rewrite operation
*   `aof_last_write_status`: Status of the last write operation to the AOF
*   `aof_last_cow_size`: The size in bytes of copy-on-write memory during
     the last AOF rewrite operation
*   `module_fork_in_progress`: Flag indicating a module fork is on-going
*   `module_fork_last_cow_size`: The size in bytes of copy-on-write memory
     during the last module fork operation
*   `aof_rewrites`: Number of AOF rewrites performed since startup
*   `rdb_saves`: Number of RDB snapshots performed since startup

`rdb_changes_since_last_save` refers to the number of operations that produced
some kind of changes in the dataset since the last time either [`SAVE`]({{< relref "/commands/save" >}}) or
[`BGSAVE`]({{< relref "/commands/bgsave" >}}) was called.

If AOF is activated, these additional fields will be added:

*   `aof_current_size`: AOF current file size
*   `aof_base_size`: AOF file size on latest startup or rewrite
*   `aof_pending_rewrite`: Flag indicating an AOF rewrite operation
     will be scheduled once the on-going RDB save is complete.
*   `aof_buffer_length`: Size of the AOF buffer
*   `aof_rewrite_buffer_length`: Size of the AOF rewrite buffer. Note this field was removed in Redis 7.0
*   `aof_pending_bio_fsync`: Number of fsync pending jobs in background I/O
     queue
*   `aof_delayed_fsync`: Delayed fsync counter

If a load operation is on-going, these additional fields will be added:

*   `loading_start_time`: Epoch-based timestamp of the start of the load
     operation
*   `loading_total_bytes`: Total file size
*   `loading_rdb_used_mem`: The memory usage of the server that had generated
    the RDB file at the time of the file's creation
*   `loading_loaded_bytes`: Number of bytes already loaded
*   `loading_loaded_perc`: Same value expressed as a percentage
*   `loading_eta_seconds`: ETA in seconds for the load to be complete

The **threads** section provides statistics on I/O threads.
 The statistics are the number of assigned clients,
 the number of read events processed, and the number of write events processed.
 Added in Redis 8.0.

For each I/O thread, the following line is added:

*   `io_thread_XXX`: `clients=XXX,reads=XXX,writes=XXX`

Here is the meaning of all fields in the **stats** section:

*   `total_connections_received`: Total number of connections accepted by the
     server
*   `total_commands_processed`: Total number of commands processed by the server
*   `instantaneous_ops_per_sec`: Number of commands processed per second
*   `total_net_input_bytes`: The total number of bytes read from the network
*   `total_net_output_bytes`: The total number of bytes written to the network
*   `total_net_repl_input_bytes`: The total number of bytes read from the network for replication purposes
*   `total_net_repl_output_bytes`: The total number of bytes written to the network for replication purposes
*   `instantaneous_input_kbps`: The network's read rate per second in KB/sec
*   `instantaneous_output_kbps`: The network's write rate per second in KB/sec
*   `instantaneous_input_repl_kbps`: The network's read rate per second in KB/sec for replication purposes
*   `instantaneous_output_repl_kbps`: The network's write rate per second in KB/sec for replication purposes
*   `rejected_connections`: Number of connections rejected because of
     `maxclients` limit
*   `sync_full`: The number of full resyncs with replicas
*   `sync_partial_ok`: The number of accepted partial resync requests
*   `sync_partial_err`: The number of denied partial resync requests
*   `expired_subkeys`: The number of hash field expiration events
*   `expired_keys`: Total number of key expiration events
*   `expired_stale_perc`: The percentage of keys probably expired
*   `expired_time_cap_reached_count`: The count of times that active expiry cycles have stopped early
*   `expire_cycle_cpu_milliseconds`: The cumulative amount of time spent on active expiry cycles
*   `evicted_keys`: Number of evicted keys due to `maxmemory` limit
*   `evicted_clients`: Number of evicted clients due to `maxmemory-clients` limit. Added in Redis 7.0.
*   `evicted_scripts`: Number of evicted EVAL scripts due to LRU policy, see [`EVAL`]({{< relref "/commands/eval" >}}) for more details. Added in Redis 7.4.
*   `total_eviction_exceeded_time`:  Total time `used_memory` was greater than `maxmemory` since server startup, in milliseconds
*   `current_eviction_exceeded_time`: The time passed since `used_memory` last rose above `maxmemory`, in milliseconds
*   `keyspace_hits`: Number of successful lookup of keys in the main dictionary
*   `keyspace_misses`: Number of failed lookup of keys in the main dictionary
*   `pubsub_channels`: Global number of pub/sub channels with client
     subscriptions
*   `pubsub_patterns`: Global number of pub/sub pattern with client
     subscriptions
*   `pubsubshard_channels`: Global number of pub/sub shard channels with client subscriptions. Added in Redis 7.0.3
*   `latest_fork_usec`: Duration of the latest fork operation in microseconds
*   `total_forks`: Total number of fork operations since the server start
*   `migrate_cached_sockets`: The number of sockets open for [`MIGRATE`]({{< relref "/commands/migrate" >}}) purposes
*   `slave_expires_tracked_keys`: The number of keys tracked for expiry purposes
     (applicable only to writable replicas)
*   `active_defrag_hits`: Number of value reallocations performed by active the
     defragmentation process
*   `active_defrag_misses`: Number of aborted value reallocations started by the
     active defragmentation process
*   `active_defrag_key_hits`: Number of keys that were actively defragmented
*   `active_defrag_key_misses`: Number of keys that were skipped by the active
     defragmentation process
*   `total_active_defrag_time`: Total time memory fragmentation was over the limit, in milliseconds
*   `current_active_defrag_time`: The time passed since memory fragmentation last was over the limit, in milliseconds
*   `tracking_total_keys`: Number of keys being tracked by the server
*   `tracking_total_items`: Number of items, that is the sum of clients number for
     each key, that are being tracked
*   `tracking_total_prefixes`: Number of tracked prefixes in server's prefix table
    (only applicable for broadcast mode)
*   `unexpected_error_replies`: Number of unexpected error replies, that are types
    of errors from an AOF load or replication
*   `total_error_replies`: Total number of issued error replies, that is the sum of
    rejected commands (errors prior command execution) and
    failed commands (errors within the command execution)
*   `dump_payload_sanitizations`: Total number of dump payload deep integrity validations (see `sanitize-dump-payload` config).
*   `total_reads_processed`: Total number of read events processed
*   `total_writes_processed`: Total number of write events processed
*   `io_threaded_reads_processed`: Number of read events processed by I/O threads
*   `io_threaded_writes_processed`: Number of write events processed by I/O threads
*   `client_query_buffer_limit_disconnections`: Total number of disconnections due to client reaching query buffer limit
*   `client_output_buffer_limit_disconnections`: Total number of disconnections due to client reaching output buffer limit
*   `reply_buffer_shrinks`: Total number of output buffer shrinks
*   `reply_buffer_expands`: Total number of output buffer expands
*   `eventloop_cycles`: Total number of eventloop cycles
*   `eventloop_duration_sum`: Total time spent in the eventloop in microseconds (including I/O and command processing)
*   `eventloop_duration_cmd_sum`: Total time spent on executing commands in microseconds
*   `instantaneous_eventloop_cycles_per_sec`: Number of eventloop cycles per second
*   `instantaneous_eventloop_duration_usec`: Average time spent in a single eventloop cycle in microseconds
*   `acl_access_denied_auth`: Number of authentication failures
*   `acl_access_denied_cmd`: Number of commands rejected because of access denied to the command
*   `acl_access_denied_key`: Number of commands rejected because of access denied to a key
*   `acl_access_denied_channel`: Number of commands rejected because of access denied to a channel 

Here is the meaning of all fields in the **replication** section:

*   `role`: Value is "master" if the instance is replica of no one, or "slave" if the instance is a replica of some master instance.
     Note that a replica can be master of another replica (chained replication).
*   `master_failover_state`: The state of an ongoing failover, if any.
*   `master_replid`: The replication ID of the Redis server.
*   `master_replid2`: The secondary replication ID, used for PSYNC after a failover.
*   `master_repl_offset`: The server's current replication offset
*   `second_repl_offset`: The offset up to which replication IDs are accepted
*   `repl_backlog_active`: Flag indicating replication backlog is active
*   `repl_backlog_size`: Total size in bytes of the replication backlog buffer
*   `repl_backlog_first_byte_offset`: The master offset of the replication
     backlog buffer
*   `repl_backlog_histlen`: Size in bytes of the data in the replication backlog
     buffer

If the instance is a replica, these additional fields are provided:

*   `master_host`: Host or IP address of the master
*   `master_port`: Master listening TCP port
*   `master_link_status`: Status of the link (up/down)
*   `master_last_io_seconds_ago`: Number of seconds since the last interaction
     with master
*   `master_sync_in_progress`: Indicate the master is syncing to the replica
*   `slave_read_repl_offset`: The read replication offset of the replica instance.
*   `slave_repl_offset`: The replication offset of the replica instance
*   `slave_priority`: The priority of the instance as a candidate for failover
*   `slave_read_only`: Flag indicating if the replica is read-only
*   `replica_announced`: Flag indicating if the replica is announced by Sentinel.

If a SYNC operation is on-going, these additional fields are provided:

*   `master_sync_total_bytes`: Total number of bytes that need to be 
    transferred. this may be 0 when the size is unknown (for example, when
    the `repl-diskless-sync` configuration directive is used)
*   `master_sync_read_bytes`: Number of bytes already transferred
*   `master_sync_left_bytes`: Number of bytes left before syncing is complete
    (may be negative when `master_sync_total_bytes` is 0)
*   `master_sync_perc`: The percentage `master_sync_read_bytes` from 
    `master_sync_total_bytes`, or an approximation that uses
    `loading_rdb_used_mem` when `master_sync_total_bytes` is 0
*   `master_sync_last_io_seconds_ago`: Number of seconds since last transfer I/O
     during a SYNC operation

If the link between master and replica is down, an additional field is provided:

*   `master_link_down_since_seconds`: Number of seconds since the link is down

The following field is always provided:

*   `connected_slaves`: Number of connected replicas

If the server is configured with the `min-slaves-to-write` (or starting with Redis 5 with the `min-replicas-to-write`) directive, an additional field is provided:

*   `min_slaves_good_slaves`: Number of replicas currently considered good

For each replica, the following line is added:

*   `slaveXXX`: id, IP address, port, state, offset, lag

Here is the meaning of all fields in the **cpu** section:

*   `used_cpu_sys`: System CPU consumed by the Redis server, which is the sum of system CPU consumed by all threads of the server process (main thread and background threads)
*   `used_cpu_user`: User CPU consumed by the Redis server, which is the sum of user CPU consumed by all threads of the server process (main thread and background threads)
*   `used_cpu_sys_children`: System CPU consumed by the background processes
*   `used_cpu_user_children`: User CPU consumed by the background processes
*   `used_cpu_sys_main_thread`: System CPU consumed by the Redis server main thread
*   `used_cpu_user_main_thread`: User CPU consumed by the Redis server main thread

The **commandstats** section provides statistics based on the command type,
 including the number of calls that reached command execution (not rejected),
 the total CPU time consumed by these commands, the average CPU consumed
 per command execution, the number of rejected calls
 (errors prior command execution), and the number of failed calls
 (errors within the command execution).

For each command type, the following line is added:

*   `cmdstat_XXX`: `calls=XXX,usec=XXX,usec_per_call=XXX,rejected_calls=XXX,failed_calls=XXX`

The **latencystats** section provides latency percentile distribution statistics based on the command type.

 By default, the exported latency percentiles are the p50, p99, and p999.
 If you need to change the exported percentiles, use `CONFIG SET latency-tracking-info-percentiles "50.0 99.0 99.9"`.

 This section requires the extended latency monitoring feature to be enabled (by default it's enabled).
 If you need to enable it, use `CONFIG SET latency-tracking yes`.

For each command type, the following line is added:

*   `latency_percentiles_usec_XXX: p<percentile 1>=<percentile 1 value>,p<percentile 2>=<percentile 2 value>,...`

The **errorstats** section enables keeping track of the different errors that occurred within Redis, 
 based upon the reply error prefix ( The first word after the "-", up to the first space. Example: `ERR` ).

For each error type, the following line is added:

*   `errorstat_XXX`: `count=XXX`

If the server detects that this section was flooded with an excessive number of errors, it will be disabled, show a single `ERRORSTATS_DISABLED` error, and print the errors to the server log.
This can be reset by `CONFIG RESETSTAT`.

The **sentinel** section is only available in Redis Sentinel instances. It consists of the following fields:

*   `sentinel_masters`: Number of Redis masters monitored by this Sentinel instance
*   `sentinel_tilt`: A value of 1 means this sentinel is in TILT mode
*   `sentinel_tilt_since_seconds`: Duration in seconds of current TILT, or -1 if not TILTed. Added in Redis 7.0.0
*   `sentinel_total_tilt`: The number of times this sentinel has been in TILT mode since running.
*   `sentinel_running_scripts`: The number of scripts this Sentinel is currently executing
*   `sentinel_scripts_queue_length`: The length of the queue of user scripts that are pending execution
*   `sentinel_simulate_failure_flags`: Flags for the `SENTINEL SIMULATE-FAILURE` command
    
The **cluster** section contains a single fields:

*   `cluster_enabled`: Indicates whether Redis cluster is enabled.

The **modules** section contains additional information about loaded modules if the modules provide it. The field part of property lines in this section are always prefixed with the module's name.

_Redis Query Engine fields_

*   `search_gc_bytes_collected`: The total amount of memory freed by the garbage collectors from indexes in the shard's memory in bytes. <sup>[3](#tnote-3)</sup>
*   `search_bytes_collected`: The total amount of memory freed by the garbage collectors from indexes in the shard's memory in bytes. Deprecated in 8.0 (renamed `search_gc_bytes_collected`), but still available in older versions. <sup>[1](#tnote-1)</sup>
*   `search_gc_marked_deleted_vectors`: The number of vectors marked as deleted in the vector indexes that have not yet been cleaned. <sup>[3](#tnote-3)</sup>
*   `search_marked_deleted_vectors`: The number of vectors marked as deleted in the vector indexes that have not yet been cleaned. Deprecated in 8.0 (renamed `search_gc_marked_delete_vectors`), but still available in older versions. <sup>[1](#tnote-1)</sup>
*   `search_gc_total_cycles`: The total number of garbage collection cycles executed. <sup>[3](#tnote-3)</sup>
*   `search_total_cycles`: The total number of garbage collection cycles executed. Deprecated in 8.0 (renamed `search_gc_total_cycles`), but still available in older versions. <sup>[1](#tnote-1)</sup>
*   `search_gc_total_docs_not_collected_by_gc`: The number of documents marked as deleted, whose memory has not yet been freed by the garbage collector. <sup>[3](#tnote-3)</sup>
*   `search_total_docs_not_collected_by_gc`: The number of documents marked as deleted, whose memory has not yet been freed by the garbage collector. Deprecated in 8.0 (renamed `search_gc_total_docs_not_collected`), but still available in older versions. <sup>[1](#tnote-1)</sup>
*   `search_gc_total_ms_run`: The total duration of all garbage collection cycles in the shard, measured in milliseconds. <sup>[3](#tnote-3)</sup>
*   `search_total_ms_run`: The total duration of all garbage collection cycles in the shard, measured in milliseconds. Deprecated in 8.0 (renamed `search_gc_total_ms_run`), but still available in older versions. <sup>[1](#tnote-1)</sup>

*   `search_cursors_internal_idle`: The total number of coordinator cursors that are currently holding pending results in the shard. <sup>[3](#tnote-3)</sup>
*   `search_cursors_user_idle`: The total number of cursors that were explicitly requested by users, that are currently holding pending results in the shard. <sup>[3](#tnote-3)</sup>
*   `search_global_idle`: The total number of user and internal cursors currently holding pending results in the shard. Deprecated in 8.0 (split into `search_cursors_internal_idle` and `search_cursors_user_idle`) but still available in older versions. <sup>[1](#tnote-1)</sup>
*   `search_cursors_internal_active`: The total number of coordinator cursors in the shard, either holding pending results or actively executing `FT.CURSOR READ`. <sup>[3](#tnote-3)</sup>
*   `search_cursors_user_active`: The total number of user cursors in the shard, either holding pending results or actively executing `FT.CURSOR READ`. <sup>[3](#tnote-3)</sup>
*   `search_global_total`: The total number of user and internal cursors in the shard, either holding pending results or actively executing `FT.CURSOR READ`. Deprecated in 8.0 (split into `search_cursors_internal_active` and `search_cursors_user_active`), but still available in older versions. <sup>[1](#tnote-1)</sup>
*   `search_number_of_indexes`: The total number of indexes in the shard. <sup>[1](#tnote-1)</sup>
*   `search_number_of_active_indexes`: The total number of indexes running a background indexing and/or background query processing operation. Background indexing refers to vector ingestion process, or in-progress background indexer. <sup>[1](#tnote-1)</sup>
*   `search_number_of_active_indexes_running_queries`: The total count of indexes currently running a background query process. <sup>[1](#tnote-1)</sup>
*   `search_number_of_active_indexes_indexing`: The total count of indexes currently undergoing a background indexing process. Background indexing refers to a vector ingestion process, or an in-progress background indexer. This metric is limited by the number of WORKER threads allocated for writing operations plus the number of indexes. <sup>[1](#tnote-1)</sup>
*   `search_total_active_write_threads`: The total count of background write (indexing) processes currently running in the shard. Background indexing refers to a vector ingestion process, or an in-progress background indexer. This metric is limited by the number of threads allocated for writing operations. <sup>[1](#tnote-1)</sup>
*   `search_fields_text_Text`: The total number of `TEXT` fields across all indexes in the shard. <sup>[1](#tnote-1)</sup>
*   `search_fields_text_Sortable`: The total number of `SORTABLE TEXT` fields across all indexes in the shard. This field appears only if its value is larger than 0. <sup>[1](#tnote-1)</sup>
*   `search_fields_text_NoIndex`: The total number of `NOINDEX TEXT` fields across all indexes in the shard, which are used for sorting only but not indexed. This field appears only if its value is larger than 0. <sup>[1](#tnote-1)</sup>
*   `search_fields_numeric_Numeric`: The total number of `NUMERIC` fields across all indexes in the shard. <sup>[1](#tnote-1)</sup>
*   `search_fields_numeric_Sortable`: The total number of `SORTABLE NUMERIC` fields across all indexes in the shard. This field appears only if its value is larger than 0. <sup>[1](#tnote-1)</sup>
*   `search_fields_numeric_NoIndex`: The total number of `NOINDEX NUMERIC` fields across all indexes in the shard; i.e., used for sorting only but not indexed. This field appears only if its value is larger than 0. <sup>[1](#tnote-1)</sup>
*   `search_fields_tag_Tag`: The total number of `TAG` fields across all indexes in the shard. <sup>[1](#tnote-1)</sup>
*   `search_fields_tag_Sortable`: The total number of `SORTABLE TAG` fields across all indexes in the shard. This field appears only if its value is larger than 0. <sup>[1](#tnote-1)</sup>
*   `search_fields_tag_NoIndex`: The total number of `NOINDEX TAG` fields across all indexes in the shard; i.e., used for sorting only but not indexed. This field appears only if its value is larger than 0. <sup>[1](#tnote-1)</sup>
*   `search_fields_tag_CaseSensitive`: The total number of `CASESENSITIVE TAG` fields across all indexes in the shard. This field appears only if its value is larger than 0. <sup>[1](#tnote-1)</sup>
*   `search_fields_geo_Geo`: The total number of `GEO` fields across all indexes in the shard. <sup>[1](#tnote-1)</sup>
*   `search_fields_geo_Sortable`: The total number of `SORTABLE GEO` fields across all indexes in the shard. This field appears only if its value is larger than 0. <sup>[1](#tnote-1)</sup>
*   `search_fields_geo_NoIndex`: The total number of `NOINDEX GEO` fields across all indexes in the shard; i.e., used for sorting only but not indexed. This field appears only if its value is larger than 0. <sup>[1](#tnote-1)</sup>
*   `search_fields_vector_Vector`: The total number of `VECTOR` fields across all indexes in the shard. <sup>[1](#tnote-1)</sup>
*   `search_fields_vector_Flat`: The total number of `FLAT VECTOR` fields across all indexes in the shard. <sup>[1](#tnote-1)</sup>
*   `search_fields_vector_HNSW`: The total number of `HNSW VECTOR` fields across all indexes in the shard. <sup>[1](#tnote-1)</sup>
*   `search_fields_geoshape_Geoshape`: The total number of `GEOSHAPE` fields across all indexes in the shard. <sup>[2](#tnote-2)</sup>
*   `search_fields_geoshape_Sortable`: The total number of `SORTABLE GEOSHAPE` fields across all indexes in the shard. This field appears only if its value is larger than 0. <sup>[2](#tnote-2)</sup>
*   `search_fields_geoshape_NoIndex`: The total number of `NOINDEX GEOSHAPE` fields across all indexes in the shard; i.e., used for sorting only but not indexed. This field appears only if its value is larger than 0. <sup>[2](#tnote-2)</sup>
*   `search_fields_<field>_IndexErrors`: The total number of indexing failures caused by attempts to index a document containing <field> field. <sup>[1](#tnote-1)</sup>
*   `search_used_memory_vector_index`: The total memory usage of all vector indexes in the shard. <sup>[1](#tnote-1)</sup>
*   `search_used_memory_indexes`: The estimated total memory allocated by all indexes in the shard in bytes (including vector indexes memory accounted in `search_used_memory_vector_index`). <sup>[1](#tnote-1)</sup>
*   `search_used_memory_indexes_human`: The estimated total memory allocated by all indexes in the shard in MB. <sup>[1](#tnote-1)</sup>
*   `search_smallest_memory_index`: The estimated memory usage of the index with the smallest memory usage in the shard in bytes. <sup>[1](#tnote-1)</sup>
*   `search_smallest_memory_index_human`: The estimated memory usage of the index with the smallest memory usage in the shard in MB. <sup>[1](#tnote-1)</sup>
*   `search_largest_memory_index`: The estimated memory usage of the index with the largest memory usage in the shard in bytes. <sup>[1](#tnote-1)</sup>
*   `search_largest_memory_index_human`: The estimated memory usage of the index with the largest memory usage in the shard in MB. <sup>[1](#tnote-1)</sup>
*   `search_total_indexing_time`: The total time spent on indexing operations, excluding the background indexing of vectors in the HNSW graph. <sup>[1](#tnote-1)</sup>
*   `search_bytes_collected`: The total amount of memory freed by the garbage collectors from indexes in the shard memory in bytes. <sup>[1](#tnote-1)</sup>
*   `search_total_cycles`: The total number of garbage collection cycles executed. <sup>[1](#tnote-1)</sup>
*   `search_total_ms_run`: The total duration of all garbage collection cycles in the shard, measured in milliseconds. <sup>[1](#tnote-1)</sup>
*   `search_total_docs_not_collected_by_gc`: The number of documents marked as deleted whose memory has not yet been freed by the garbage collector. <sup>[1](#tnote-1)</sup>
*   `search_marked_deleted_vectors`: The number of vectors marked as deleted in the vector indexes that have not yet been cleaned. <sup>[1](#tnote-1)</sup>
*   `search_total_queries_processed`: The total number of successful query executions (When using cursors, not counting reading from existing cursors) in the shard. <sup>[1](#tnote-1)</sup>
*   `search_total_query_commands`: The total number of successful query command executions (including `FT.SEARCH`, `FT.AGGREGATE`, and `FT.CURSOR READ`). <sup>[1](#tnote-1)</sup>
*   `search_total_query_execution_time_ms`: The cumulative execution time of all query commands, including `FT.SEARCH`, `FT.AGGREGATE`, and `FT.CURSOR` READ, measured in ms. <sup>[1](#tnote-1)</sup>
*   `search_total_active_queries`: The total number of background queries currently being executed in the shard, excluding `FT.CURSOR READ`. <sup>[1](#tnote-1)</sup>
*   `search_errors_indexing_failures`: The total number of indexing failures recorded across all indexes in the shard. <sup>[1](#tnote-1)</sup>
*   `search_errors_for_index_with_max_failures`: The number of indexing failures in the index with the highest count of failures. <sup>[1](#tnote-1)</sup>

1. <a name="tnote-1"></a> Available in RediSearch 2.6.
2. <a name="tnote-2"></a> Available in RediSearch 2.8.
3. <a name="tnote-3"></a> Available in RediSearch 8.0.

The **keyspace** section provides statistics on the main dictionary of each database.
The statistics are the number of keys, and the number of keys with an expiration.

For each database, the following line is added:

*   `dbXXX`: `keys=XXX,expires=XXX,avg_ttl=XXX,subexpiry=XXX`

The **keysizes** section provides detailed statistics on the distribution of key sizes for each data type (strings, lists, sets, hashes, and sorted sets) within the dataset. The distribution is tracked using a base-2 logarithmic histogram.

Here's sample output from a two-database instance of Redis:

```
# Keysizes
db0_distrib_strings_sizes:2=1,4=1,8=1,16=1,32=1,64=1,128=1,256=1,512=1,1K=1,2K=1,4K=1,8K=1,16K=1,32K=1,64K=1,128K=1,256K=1,512K=1,1M=1
db0_distrib_lists_items:1=1,2=1,4=1,8=1,16=1,32=1,64=1,128=1,256=1,512=1,1K=1,2K=1,4K=1,8K=1,16K=1,32K=1,64K=1
db0_distrib_sets_items:1=1,2=1,4=1,8=1,16=1,32=1,64=1,128=1,256=1,512=1,1K=1,2K=1,4K=1,8K=1,16K=1,32K=1,64K=1
db0_distrib_zsets_items:1=1,2=1,4=1,8=1,16=1,32=1,64=1,128=1,256=1,512=1,1K=1,2K=1,4K=1,8K=1,16K=1,32K=1,64K=1
db0_distrib_hashes_items:1=1,2=1,4=1,8=1,16=1,32=1,64=1,128=1,256=1,512=1,1K=1,2K=1,4K=1,8K=1,16K=1,32K=1
db1_distrib_strings_sizes:2=1,4=1,8=1,16=1,32=1,64=1,128=1,256=1,512=1,1K=1,2K=1,4K=1,8K=1,16K=1,32K=1,64K=1,128K=1,256K=1,512K=1,1M=1
db1_distrib_lists_items:1=1,2=1,4=1,8=1,16=1,32=1,64=1,128=1,256=1,512=1,1K=1,2K=1,4K=1,8K=1,16K=1,32K=1,64K=1
db1_distrib_sets_items:1=1,2=1,4=1,8=1,16=1,32=1,64=1,128=1,256=1,512=1,1K=1,2K=1,4K=1,8K=1,16K=1,32K=1,64K=1
db1_distrib_zsets_items:1=1,2=1,4=1,8=1,16=1,32=1,64=1,128=1,256=1,512=1,1K=1,2K=1,4K=1,8K=1,16K=1,32K=1,64K=1
db1_distrib_hashes_items:1=1,2=1,4=1,8=1,16=1,32=1,64=1,128=1,256=1,512=1,1K=1,2K=1,4K=1,8K=1,16K=1,32K=1
```

The **debug** section contains experimental metrics, which might change or get removed in future versions.
It won't be included when `INFO` or `INFO ALL` are called, and it is returned only when `INFO DEBUG` is used.

*   `eventloop_duration_aof_sum`: Total time spent on flushing AOF in eventloop in microseconds.
*   `eventloop_duration_cron_sum`: Total time consumption of cron in microseconds (including serverCron and beforeSleep, but excluding IO and AOF flushing).
*   `eventloop_duration_max`: The maximal time spent in a single eventloop cycle in microseconds.
*   `eventloop_cmd_per_cycle_max`: The maximal number of commands processed in a single eventloop cycle.
*   `allocator_allocated_lua`: Total bytes allocated from the allocator specifically for Lua, including internal-fragmentation.
*   `allocator_active_lua`: Total bytes in the allocator active pages specifically for Lua, including external-fragmentation.
*   `allocator_resident_lua`: Total bytes resident (RSS) in the allocator specifically for Lua. This includes pages that can be released to the OS (by `MEMORY PURGE`, or just waiting).
*   `allocator_frag_bytes_lua`: Delta between `allocator_active_lua` and `allocator_allocated_lua`.

[hcgcpgp]: http://code.google.com/p/google-perftools/

**A note about the word slave used in this man page**: Starting with Redis 5, if not for backward compatibility, the Redis project no longer uses the word slave. Unfortunately in this command the word slave is part of the protocol, so we'll be able to remove such occurrences only when this API will be naturally deprecated.

**Modules generated sections**: Starting with Redis 6, modules can inject their information into the `INFO` command. These are excluded by default even when the `all` argument is provided (it will include a list of loaded modules but not their generated info fields). To get these you must use either the `modules` argument or `everything`.

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | In Redis Enterprise, `INFO` returns a different set of fields than Redis Open Source.<br />Not supported for [scripts]({{<relref "/develop/programmability">}}). |

Note: key memory usage is different on Redis Software or Redis Cloud active-active databases than on non-active-active databases. This is because memory usage includes some amount of CRDB overhead.

Additionally, for JSON keys, Redis implements a "shared string" mechanism to save memory when the same JSON field names or field values of type string are used more than once (either inter-key or intra-key).
In such cases, instead of storing the field names or values many times, Redis stores them only once. This mechanism is not in place for active-active databases.

On non-active-active databases, `INFO` (Memory > used_memory) reports that the shared memory is counted, but only once for all keys. On active-active databases, there is no shared memory, so if strings are repeated, they are stored multiple times.

**Example**

Suppose you have ten JSON keys, and each key has 5KB of unique content and 5KB of shared content.

For non-active-active databases, `INFO` (used_memory) would report (10 keys * 5KB) + 5KB ~= 55KB. The last term, "+ 5KB", is the size of the shared content.

For active-active databases, `INFO` (used_memory) would report 10 keys * 20KB ~= 200KB. This number includes some amount of CRDB overhead per JSON key.

## Return information

{{< multitabs id="info-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): a map of info fields, one field per line in the form of `<field>:<value>` where the value can be a comma separated map like `<key>=<val>`. Also contains section header lines starting with `#` and blank lines.
Lines can contain a section name (starting with a `#` character) or a property. All the properties are in the form of `field:value` terminated by `\r\n`.

-tab-sep-

[Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): a map of info fields, one field per line in the form of `<field>:<value>` where the value can be a comma separated map like `<key>=<val>`. Also contains section header lines starting with `#` and blank lines.
Lines can contain a section name (starting with a `#` character) or a property. All the properties are in the form of `field:value` terminated by `\r\n`.

{{< /multitabs >}}
