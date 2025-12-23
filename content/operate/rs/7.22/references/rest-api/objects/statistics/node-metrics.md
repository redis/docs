---
Title: Node metrics
alwaysopen: false
categories:
- docs
- operate
- rs
description: Documents the node metrics used with Redis Enterprise Software REST API
  calls.
linkTitle: node metrics
weight: $weight
url: '/operate/rs/7.22/references/rest-api/objects/statistics/node-metrics/'
---

{{<banner-article>}}
The v1 statistics REST API endpoints are deprecated as of Redis Enterprise Software version 7.22. Use the [metrics stream engine for monitoring v2]({{< relref "/operate/rs/7.22/monitoring/metrics_stream_engine" >}}) instead for real-time monitoring and metrics collection.
{{</banner-article>}}

| Metric name | Type | Description |
|-------------|------|-------------|
| available_flash | float | Available flash on the node (bytes) |
| available_memory | float | Available RAM on the node (bytes) |
| avg_latency | float | Average latency of requests handled by endpoints on the node (micro-sec); returned only when there is traffic |
| bigstore_free | float | Free space of backend flash (used by flash DB's BigRedis) (bytes); returned only when BigRedis is enabled |
| bigstore_iops | float | Rate of I/O operations against backend flash for all shards which are part of a flash-based DB (BigRedis) on the node (ops/sec); returned only when BigRedis is enabled |
| bigstore_kv_ops | float | Rate of value read/write operations against backend flash for all shards which are part of a flash-based DB (BigRedis) on the node (ops/sec); returned only when BigRedis is enabled |
| bigstore_throughput | float | Throughput of I/O operations against backend flash for all shards which are part of a flash-based DB (BigRedis) on the node (bytes/sec); returned only when BigRedis is enabled |
| conns | float | Number of clients connected to endpoints on the node |
| cpu_idle | float | CPU idle time portion (0-1, multiply by 100 to get percent) |
| cpu_system | float | CPU time portion spent in kernel (0-1, multiply by 100 to get percent) |
| cpu_user | float | CPU time portion spent by users-pace processes (0-1, multiply by 100 to get percent) |
| cur_aof_rewrites | float | Number of current AOF rewrites by shards on this node |
| egress_bytes | float | Rate of outgoing network traffic to the node (bytes/sec) |
| ephemeral_storage_avail | float | Disk space available to Redis Enterprise processes on configured ephemeral disk (bytes) |
| ephemeral_storage_free | float | Free disk space on configured ephemeral disk (bytes) |
| free_memory | float | Free memory on the node (bytes) |
| ingress_bytes | float | Rate of incoming network traffic to the node (bytes/sec) |
| persistent_storage_avail | float | Disk space available to Redis Enterprise processes on configured persistent disk (bytes) |
| persistent_storage_free | float | Free disk space on configured persistent disk (bytes) |
| provisional_flash | float | Amount of flash available for new shards on this node, taking into account overbooking, max Redis servers, reserved flash, and provision and migration thresholds (bytes) |
| provisional_memory | float | Amount of RAM available for new shards on this node, taking into account overbooking, max Redis servers, reserved memory, and provision and migration thresholds (bytes) |
| total_req | float | Request rate handled by endpoints on the node (ops/sec) |
