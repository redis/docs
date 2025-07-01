---
Title: Cluster metrics
alwaysopen: false
categories:
- docs
- operate
- rs
description: Documents the cluster metrics used with Redis Enterprise Software REST
  API calls.
linkTitle: cluster metrics
weight: $weight
url: '/operate/rs/7.8/references/rest-api/objects/statistics/cluster-metrics/'
---

| Metric name | Type | Description |
|-------------|------|-------------|
| available_flash | float | Sum of available flash in all nodes (bytes) |
| available_memory | float | Sum of available memory in all nodes (bytes) |
| avg_latency | float | Average latency of requests handled by all cluster endpoints (micro-sec); returned only when there is traffic |
| bigstore_free | float | Sum of free space of backend flash (used by flash DB's BigRedis) on all cluster nodes (bytes); only returned when BigRedis is enabled |
| bigstore_iops | float | Rate of I/O operations against backend flash for all shards which are part of a flash-based DB (BigRedis) in the cluster (ops/sec); returned only when BigRedis is enabled |
| bigstore_kv_ops | float | Rate of value read/write operations against back-end flash for all shards which are part of a flash based DB (BigRedis) in cluster (ops/sec); only returned when BigRedis is enabled |
| bigstore_throughput | float | Throughput I/O operations against backend flash for all shards which are part of a flash-based DB (BigRedis) in the cluster (bytes/sec); only returned when BigRedis is enabled |
| conns | float | Total number of clients connected to all cluster endpoints |
| cpu_idle | float | CPU idle time portion, the value is weighted between all nodes based on number of cores in each node (0-1, multiply by 100 to get percent) |
| cpu_system | float | CPU time portion spent in kernel on the cluster, the value is weighted between all nodes based on number of cores in each node (0-1, multiply by 100 to get percent) |
| cpu_user | float | CPU time portion spent by users-pace processes on the cluster. The value is weighted between all nodes based on number of cores in each node (0-1, multiply by 100 to get percent). |
| egress_bytes | float | Sum of rate of outgoing network traffic on all cluster nodes (bytes/sec) |
| ephemeral_storage_avail | float | Sum of disk space available to Redis Enterprise processes on configured ephemeral disk on all cluster nodes (bytes) |
| ephemeral_storage_free | float | Sum of free disk space on configured ephemeral disk on all cluster nodes (bytes) |
| free_memory | float | Sum of free memory in all cluster nodes (bytes) |
| ingress_bytes | float | Sum of rate of incoming network traffic on all cluster nodes (bytes/sec) |
| persistent_storage_avail | float | Sum of disk space available to Redis Enterprise processes on configured persistent disk on all cluster nodes (bytes) |
| persistent_storage_free | float | Sum of free disk space on configured persistent disk on all cluster nodes (bytes) |
| provisional_flash | float | Sum of provisional flash in all nodes (bytes) |
| provisional_memory | float | Sum of provisional memory in all nodes (bytes) |
| total_req | float | Request rate handled by all endpoints on the cluster (ops/sec) |
