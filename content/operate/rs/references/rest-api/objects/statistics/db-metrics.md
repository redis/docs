---
Title: DB metrics
alwaysopen: false
categories:
- docs
- operate
- rs
description: Documents the DB metrics used with Redis Enterprise Software REST API
  calls.
linkTitle: DB metrics
weight: $weight
---

{{<banner-article>}}
The v1 statistics REST API endpoints are deprecated as of Redis Enterprise Software version 7.22. Use the [metrics stream engine for monitoring v2]({{< relref "/operate/rs/monitoring/metrics_stream_engine" >}}) instead for real-time monitoring and metrics collection.
{{</banner-article>}}

| Metric name | Type | Description |
|-------------|------|-------------|
| avg_latency | float | Average latency of operations on the DB (microseconds). Only returned when there is traffic. |
| avg_other_latency | float | Average latency of other (non read/write) operations (microseconds). Only returned when there is traffic. |
| avg_read_latency | float | Average latency of read operations (microseconds). Only returned when there is traffic. |
| avg_write_latency | float | Average latency of write operations (microseconds). Only returned when there is traffic. |
| big_del_flash | float | Rate of key deletes for keys on flash (BigRedis) (key access/sec). Only returned when BigRedis is enabled. |
| big_del_ram | float | Rate of key deletes for keys in RAM (BigRedis) (key access/sec); this includes write misses (new keys created). Only returned when BigRedis is enabled. |
| big_fetch_flash | float | Rate of key reads/updates for keys on flash (BigRedis) (key access/sec). Only returned when BigRedis is enabled. |
| big_fetch_ram | float | Rate of key reads/updates for keys in RAM (BigRedis) (key access/sec). Only returned when BigRedis is enabled. |
| big_io_ratio_flash | float | Rate of key operations on flash. Can be used to compute the ratio of I/O operations (key access/sec). Only returned when BigRedis is enabled. |
| big_io_ratio_redis | float | Rate of Redis operations on keys. Can be used to compute the ratio of I/O operations (key access/sec). Only returned when BigRedis is enabled. |
| big_write_flash | float | Rate of key writes for keys on flash (BigRedis) (key access/sec). Only returned when BigRedis is enabled. |
| big_write_ram | float | Rate of key writes for keys in RAM (BigRedis) (key access/sec); this includes write misses (new keys created). Only returned when BigRedis is enabled. |
| bigstore_io_dels | float | Rate of key deletions from flash (key access/sec). Only returned when BigRedis is enabled. |
| bigstore_io_read_bytes | float | Throughput of I/O read operations against backend flash |for all shards of the DB (BigRedis) (bytes/sec). Only returned when BigRedis is enabled. |
| bigstore_io_reads | float | Rate of key reads from flash (key access/sec). Only returned when BigRedis is enabled. |
| bigstore_io_write_bytes | float | Throughput of I/O write operations against backend flash |for all shards of the DB (BigRedis) (bytes/sec). Only returned when BigRedis is enabled. |
| bigstore_io_writes | float | Rate of key writes from flash (key access/sec). Only returned when BigRedis is enabled. |
| bigstore_iops | float | Rate of I/O operations against backend flash for all shards of the DB (BigRedis) (ops/sec). Only returned when BigRedis is enabled. |
| bigstore_kv_ops | float | Rate of value read/write/del operations against backend flash for all shards of the DB (BigRedis) (key access/sec). Only returned when BigRedis is enabled |
| bigstore_objs_flash | float | Value count on flash (BigRedis). Only returned when BigRedis is enabled. |
| bigstore_objs_ram | float | Value count in RAM (BigRedis). Only returned when BigRedis is enabled. |
| bigstore_throughput | float | Throughput of I/O operations against backend flash for all shards of the DB (BigRedis) (bytes/sec). Only returned when BigRedis is enabled. |
| conns | float | Number of client connections to the DB’s endpoints |
| disk_frag_ratio | float | Flash fragmentation ratio (used/required). Only returned when BigRedis is enabled. |
| egress_bytes | float | Rate of outgoing network traffic to the DB’s endpoint (bytes/sec) |
| evicted_objects | float | Rate of key evictions from DB (evictions/sec) |
| expired_objects | float | Rate keys expired in DB (expirations/sec) |
| fork_cpu_system | float | % cores utilization in system mode for all Redis shard fork child processes of this database |
| fork_cpu_user | float | % cores utilization in user mode for all Redis shard fork child processes of this database |
| ingress_bytes | float | Rate of incoming network traffic to the DB’s endpoint (bytes/sec) |
| instantaneous_ops_per_sec | float | Request rate handled by all shards of the DB (ops/sec) |
| last_req_time | date, ISO_8601 format | Last request time received to the DB (ISO format 2015-07-05T22:16:18Z). Returns 1/1/1970 when unavailable. |
| last_res_time | date, ISO_8601 format | Last response time received from DB (ISO format 2015-07-05T22:16:18Z). Returns 1/1/1970 when unavailable. |
| main_thread_cpu_system | float | % cores utilization in system mode for all Redis shard main threads of this database |
| main_thread_cpu_user | float | % cores utilization in user mode for all Redis shard main threads of this database |
| mem_frag_ratio | float | RAM fragmentation ratio (RSS/allocated RAM) |
| mem_not_counted_for_evict | float | Portion of used_memory (in bytes) not counted for eviction and OOM errors |
| mem_size_lua | float | Redis Lua scripting heap size (bytes) |
| monitor_sessions_count | float | Number of client connected in monitor mode to the DB |
| no_of_expires | float | Number of volatile keys in the DB |
| no_of_keys | float | Number of keys in the DB |
| other_req | float | Rate of other (non read/write) requests on DB (ops/sec) |
| other_res | float | Rate of other (non read/write) responses on DB (ops/sec) |
| pubsub_channels | float | Count the pub/sub channels with subscribed clients |
| pubsub_patterns | float | Count the pub/sub patterns with subscribed clients |
| ram_overhead | float | Non values RAM overhead (BigRedis) (bytes). Only returned when BigRedis is enabled. |
| read_hits | float | Rate of read operations accessing an existing key (ops/sec) |
| read_misses | float | Rate of read operations accessing a nonexistent key (ops/sec) |
| read_req | float | Rate of read requests on DB (ops/sec) |
| read_res | float | Rate of read responses on DB (ops/sec) |
| shard_cpu_system | float | % cores utilization in system mode for all Redis shard processes of this database |
| shard_cpu_user | float | % cores utilization in user mode for the Redis shard process |
| total_connections_received | float | Rate of new client connections to the DB (connections/sec) |
| total_req | float | Rate of all requests on DB (ops/sec) |
| total_res | float | Rate of all responses on DB (ops/sec) |
| used_bigstore | float | Flash used by DB (BigRedis) (bytes). Only returned when BigRedis is enabled. |
| used_memory | float | Memory used by DB (in BigRedis this includes flash) (bytes) |
| used_ram | float | RAM used by DB (BigRedis) (bytes). Only returned when BigRedis is enabled. |
| write_hits | float | Rate of write operations accessing an existing key (ops/sec) |
| write_misses | float | Rate of write operations accessing a nonexistent key (ops/sec) |
| write_req | float | Rate of write requests on DB (ops/sec) |
| write_res | float | Rate of write responses on DB (ops/sec) |