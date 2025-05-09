---
Title: Shard metrics
alwaysopen: false
categories:
- docs
- operate
- rs
description: Documents the shard metrics used with Redis Enterprise Software REST
  API calls.
linkTitle: shard metrics
weight: $weight
url: '/operate/rs/7.8/references/rest-api/objects/statistics/shard-metrics/'
---

| Metric name | Type | Description |
|-------------|------|-------------|
| aof_rewrite_inprog | float | The number of simultaneous AOF rewrites that are in progress |
| avg_ttl | float | Estimated average time to live of a random key (msec) |
| big_del_flash | float | Rate of key deletes for keys on flash (BigRedis) (key access/sec). Only returned when BigRedis is enabled. |
| big_del_ram | float | Rate of key deletes for keys in RAM (BigRedis) (key access/sec); this includes write misses (new keys created). Only returned when BigRedis is enabled. |
| big_fetch_flash | float | Rate of key reads/updates for keys on flash (BigRedis) (key access/sec). Only returned when BigRedis is enabled. |
| big_fetch_ram | float | Rate of key reads/updates for keys in RAM (BigRedis) (key access/sec). Only returned when BigRedis is enabled. |
| big_io_ratio_flash | float | Rate of key operations on flash. Can be used to compute the ratio of I/O operations (key access/sec). Only returned when BigRedis is enabled. |
| big_io_ratio_redis | float | Rate of Redis operations on keys. Can be used to compute the ratio of I/O operations) (key access/sec). Only returned when BigRedis is enabled. |
| big_write_flash | float | Rate of key writes for keys on flash (BigRedis) (key access/sec). Only returned when BigRedis is enabled. |
| big_write_ram | float | Rate of key writes for keys in RAM (BigRedis) (key access/sec); this includes write misses (new keys created). Only returned when BigRedis is enabled. |
| bigstore_io_dels | float | Rate of key deletions from flash (key access/sec). Only returned when BigRedis is enabled. |
| bigstore_io_read_bytes | float | Throughput of I/O read operations against backend flash for all shards of the DB (BigRedis) (bytes/sec). Only returned when BigRedis is enabled. |
| bigstore_io_reads | float | Rate of key reads from flash (key access/sec). Only returned when BigRedis is enabled. |
| bigstore_io_write_bytes | float | Throughput of I/O write operations against backend flash for all shards of the DB (BigRedis) (bytes/sec). Only returned when BigRedis is enabled. |
| bigstore_io_writes | float | Rate of key writes from flash (key access/sec). Only returned when BigRedis is enabled. |
| bigstore_iops | float | Rate of I/O operations against backend flash for all shards of the DB (BigRedis) (ops/sec). Only returned when BigRedis is enabled. |
| bigstore_kv_ops | float | Rate of value read/write/del operations against backend flash for all shards of the DB (BigRedis) (key access/sec). Only returned when BigRedis is enabled. |
| bigstore_objs_flash | float | Key count on flash (BigRedis). Only returned when BigRedis is enabled. |
| bigstore_objs_ram | float | Key count in RAM (BigRedis). Only returned when BigRedis is enabled. |
| bigstore_throughput | float | Throughput of I/O operations against backend flash for all shards of the DB (BigRedis) (bytes/sec). Only returned when BigRedis is enabled. |
| blocked_clients | float | Count the clients waiting on a blocking call |
| connected_clients | float | Number of client connections to the specific shard |
| disk_frag_ratio | float | Flash fragmentation ratio (used/required). Only returned when BigRedis is enabled. |
| evicted_objects | float | Rate of key evictions from DB (evictions/sec) |
| expired_objects | float | Rate keys expired in DB (expirations/sec) |
| fork_cpu_system | float | % cores utilization in system mode for the Redis shard fork child process |
| fork_cpu_user | float | % cores utilization in user mode for the Redis shard fork child process |
| last_save_time | float | Time of the last RDB save |
| main_thread_cpu_system | float | % cores utilization in system mode for the Redis shard main thread |
| main_thread_cpu_user | float | % cores utilization in user mode for the Redis shard main thread |
| mem_frag_ratio | float | RAM fragmentation ratio (RSS/allocated RAM) |
| mem_not_counted_for_evict | float | Portion of used_memory (in bytes) not counted for eviction and OOM errors |
| mem_size_lua | float | Redis Lua scripting heap size (bytes) |
| no_of_expires | float | Number of volatile keys on the shard |
| no_of_keys | float | Number of keys in DB |
| pubsub_channels | float | Count the pub/sub channels with subscribed clients |
| pubsub_patterns | float | Count the pub/sub patterns with subscribed clients |
| rdb_changes_since_last_save | float | Count changes since last RDB save |
| read_hits | float | Rate of read operations accessing an existing key (ops/sec) |
| read_misses | float | Rate of read operations accessing a nonexistent key (ops/sec) |
| shard_cpu_system | float | % cores utilization in system mode for the Redis shard process |
| shard_cpu_user | float | % cores utilization in user mode for the Redis shard process |
| total_req | float | Rate of operations on DB (ops/sec) |
| used_memory | float | Memory used by shard (in BigRedis this includes flash) (bytes) |
| used_memory_peak | float | The largest amount of memory used by this shard (bytes) |
| used_memory_rss | float | Resident set size of this shard (bytes) |
| write_hits | float | Rate of write operations accessing an existing key (ops/sec) |
| write_misses | float | Rate of write operations accessing a nonexistent key (ops/sec) |
