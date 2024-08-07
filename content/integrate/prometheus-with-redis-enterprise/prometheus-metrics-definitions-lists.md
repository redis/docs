---
Title: Metrics in Prometheus
alwaysopen: false
categories:
- docs
- integrate
- rs
description: The metrics available to Prometheus.
group: observability
linkTitle: Prometheus metrics (lists)
summary: You can use Prometheus and Grafana to collect and visualize your Redis Enterprise
  Software metrics.
type: integration
weight: 45
---
The [integration with Prometheus]({{< relref "/integrate/prometheus-with-redis-enterprise/" >}})
lets you create dashboards that highlight the metrics that are important to you.

Here are the metrics available to Prometheus:

## Database metrics

**V1 metric:** `bdb_avg_latency`
- **Description:** Average latency of operations on the DB (seconds); returned only when there is traffic
- **Equivalent V2 PromQL:**
    ```promql
    sum by (bdb) (irate(endpoint_acc_latency[1m])) / sum by (bdb) (irate(endpoint_total_started_res[1m])) / 1000000
    ```

**V1 metric:** `bdb_avg_latency_max`
- **Description:** Highest value of average latency of operations on the DB (seconds); returned only when there is traffic
- **Equivalent V2 PromQL:** 
    ```promql
    sum by (bdb) (irate(endpoint_acc_latency[1m])) / sum by (bdb) (irate(endpoint_total_started_res[1m])) / 1000000
    ```

**V1 metric:** `bdb_avg_read_latency`
- **Description:** Average latency of read operations (seconds); returned only when there is traffic
- **Equivalent V2 PromQL:** 
    ```promql
    sum by (bdb) (irate(endpoint_acc_read_latency[1m])) / sum by (bdb) (irate(endpoint_total_started_res[1m])) / 1000000
    ```

**V1 metric:** `bdb_avg_read_latency_max`
- **Description:** Highest value of average latency of read operations (seconds); returned only when there is traffic
- **Equivalent V2 PromQL:** 
    ```promql
    sum by (bdb) (irate(endpoint_acc_read_latency[1m])) / sum by (bdb) (irate(endpoint_total_started_res[1m])) / 1000000
    ```

**V1 metric:** `bdb_avg_write_latency`
- **Description:** Average latency of write operations (seconds); returned only when there is traffic
- **Equivalent V2 PromQL:** 
    ```promql
    sum by (bdb) (irate(endpoint_acc_write_latency[1m])) / sum by (bdb) (irate(endpoint_total_started_res[1m])) / 1000000
    ```

**V1 metric:** `bdb_avg_write_latency_max`
- **Description:** Highest value of average latency of write operations (seconds); returned only when there is traffic
- **Equivalent V2 PromQL:** 
    ```promql
    sum by (bdb) (irate(endpoint_acc_write_latency[1m])) / sum by (bdb) (irate(endpoint_total_started_res[1m])) / 1000000
    ```

**V1 metric:** `bdb_bigstore_shard_count`
- **Description:** Shard count by database and by storage engine (driver - rocksdb / speedb); Only for databases with Auto Tiering enabled
- **Equivalent V2 PromQL:**
    ```promql
    sum(
      (sum(
        label_replace(
          label_replace(
            namedprocess_namegroup_thread_count{groupname=~"redis-\d+", threadname=~"(speedb|rocksdb).*"}, 
            "redis", "$1", "groupname", "redis-(\d+)"
          ), 
          "driver", "$1", "threadname", "(speedb|rocksdb).*"
        )
      ) by (redis, driver) > bool 0)
      * on (redis) group_left(bdb)
      redis_server_up
    ) by (bdb, driver)
    ```

**V1 metric:** `bdb_conns`
- **Description:** Number of client connections to DB
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by(bdb) (endpoint_conns)
    ```

**V1 metric:** `bdb_egress_bytes`
- **Description:** Rate of outgoing network traffic from the DB (bytes/sec)
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by(bdb) (irate(endpoint_egress_bytes[1m]))
    ```

**V1 metric:** `bdb_egress_bytes_max`
- **Description:** Highest value of rate of outgoing network traffic from the DB (bytes/sec)
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by(bdb) (irate(endpoint_egress_bytes[1m]))
    ```

**V1 metric:** `bdb_evicted_objects`
- **Description:** Rate of key evictions from DB (evictions/sec)
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by (bdb) (irate(redis_server_evicted_keys{role="master"}[1m]))
    ```

**V1 metric:** `bdb_evicted_objects_max`
- **Description:** Highest value of rate of key evictions from DB (evictions/sec)
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by (bdb) (irate(redis_server_evicted_keys{role="master"}[1m]))
    ```

**V1 metric:** `bdb_expired_objects`
- **Description:** Rate keys expired in DB (expirations/sec)
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by (bdb) (irate(redis_server_expired_keys{role="master"}[1m]))
    ```

**V1 metric:** `bdb_expired_objects_max`
- **Description:** Highest value of rate keys expired in DB (expirations/sec)
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by (bdb) (irate(redis_server_expired_keys{role="master"}[1m]))
    ```

**V1 metric:** `bdb_fork_cpu_system`
- **Description:** % cores utilization in system mode for all redis shard fork child processes of this database
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by (bdb) (irate(namedprocess_namegroup_thread_cpu_seconds_total{mode="system"}[1m]))
    ```

**V1 metric:** `bdb_fork_cpu_system_max`
- **Description:** Highest value of % cores utilization in system mode for all redis shard fork child processes of this database
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by (bdb) (irate(namedprocess_namegroup_thread_cpu_seconds_total{mode="system"}[1m]))
    ```

**V1 metric:** `bdb_fork_cpu_user`
- **Description:** % cores utilization in user mode for all redis shard fork child processes of this database
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by (bdb) (irate(namedprocess_namegroup_thread_cpu_seconds_total{mode="user"}[1m]))
    ```

**V1 metric:** `bdb_fork_cpu_user_max`
- **Description:** Highest value of % cores utilization in user mode for all redis shard fork child processes of this database
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by (bdb) (irate(namedprocess_namegroup_thread_cpu_seconds_total{mode="user"}[1m]))
    ```

**V1 metric:** `bdb_ingress_bytes`
- **Description:** Rate of incoming network traffic to DB (bytes/sec)
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by(bdb) (irate(endpoint_ingress_bytes[1m]))
    ```

**V1 metric:** `bdb_ingress_bytes_max`
- **Description:** Highest value of rate of incoming network traffic to DB (bytes/sec)
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by(bdb) (irate(endpoint_ingress_bytes[1m]))
    ```

**V1 metric:** `bdb_instantaneous_ops_per_sec`
- **Description:** Request rate handled by all shards of DB (ops/sec)
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by(bdb) (redis_server_instantaneous_ops_per_sec)
    ```

**V1 metric:** `bdb_main_thread_cpu_system`
- **Description:** % cores utilization in system mode for all redis shard main threads of this database
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by(bdb) (irate(namedprocess_namegroup_thread_cpu_seconds_total{mode="system", threadname=~"redis-server.*"}[1m]))
    ```

**V1 metric:** `bdb_main_thread_cpu_system_max`
- **Description:** Highest value of % cores utilization in system mode for all redis shard main threads of this database
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by(bdb) (irate(namedprocess_namegroup_thread_cpu_seconds_total{mode="system", threadname=~"redis-server.*"}[1m]))
    ```

**V1 metric:** `bdb_main_thread_cpu_user`
- **Description:** % cores utilization in user mode for all redis shard main threads of this database
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by(irate(namedprocess_namegroup_thread_cpu_seconds_total{mode="user", threadname=~"redis-server.*"}[1m]))
    ```

**V1 metric:** `bdb_main_thread_cpu_user_max`
- **Description:** Highest value of % cores utilization in user mode for all redis shard main threads of this database
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by(irate(namedprocess_namegroup_thread_cpu_seconds_total{mode="user", threadname=~"redis-server.*"}[1m]))
    ```

**V1 metric:** `bdb_mem_frag_ratio`
- **Description:** RAM fragmentation ratio (RSS / allocated RAM)
- **Equivalent V2 PromQL:** 
    ```promql
    avg(redis_server_mem_fragmentation_ratio)
    ```

**V1 metric:** `bdb_mem_size_lua`
- **Description:** Redis lua scripting heap size (bytes)
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by(bdb) (redis_server_used_memory_lua)
    ```

**V1 metric:** `bdb_memory_limit`
- **Description:** Configured RAM limit for the database
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by(bdb) (redis_server_maxmemory)
    ```

**V1 metric:** `bdb_monitor_sessions_count`
- **Description:** Number of client connected in monitor mode to the DB
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by(bdb) (endpoint_monitor_sessions_count)
    ```

**V1 metric:** `bdb_no_of_keys`
- **Description:** Number of keys in DB
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by (bdb) (redis_server_db_keys{role="master"})
    ```

**V1 metric:** `bdb_other_req`
- **Description:** Rate of other (non read/write) requests on DB (ops/sec)
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by(bdb) (irate(endpoint_other_req[1m]))
    ```

**V1 metric:** `bdb_other_req_max`
- **Description:** Highest value of rate of other (non read/write) requests on DB (ops/sec)
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by(bdb) (irate(endpoint_other_req[1m]))
    ```

**V1 metric:** `bdb_other_res`
- **Description:** Rate of other (non read/write) responses on DB (ops/sec)
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by(bdb) (irate(endpoint_other_res[1m]))
    ```

**V1 metric:** `bdb_other_res_max`
- **Description:** Highest value of rate of other (non read/write) responses on DB (ops/sec)
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by(bdb) (irate(endpoint_other_res[1m]))
    ```

**V1 metric:** `bdb_pubsub_channels`
- **Description:** Count the pub/sub channels with subscribed clients
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by(bdb) (redis_server_pubsub_channels)
    ```

**V1 metric:** `bdb_pubsub_channels_max`
- **Description:** Highest value of count the pub/sub channels with subscribed clients
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by(bdb) (redis_server_pubsub_channels)
    ```

**V1 metric:** `bdb_pubsub_patterns`
- **Description:** Count the pub/sub patterns with subscribed clients
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by(bdb) (redis_server_pubsub_patterns)
    ```

**V1 metric:** `bdb_pubsub_patterns_max`
- **Description:** Highest value of count the pub/sub patterns with subscribed clients
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by(bdb) (redis_server_pubsub_patterns)
    ```

**V1 metric:** `bdb_read_hits`
- **Description:** Rate of read operations accessing an existing key (ops/sec)
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by (bdb) (irate(redis_server_keyspace_read_hits{role="master"}[1m]))
    ```

**V1 metric:** `bdb_read_hits_max`
- **Description:** Highest value of rate of read operations accessing an existing key (ops/sec)
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by (bdb) (irate(redis_server_keyspace_read_hits{role="master"}[1m]))
    ```

**V1 metric:** `bdb_read_misses`
- **Description:** Rate of read operations accessing a non-existing key (ops/sec)
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by (bdb) (irate(redis_server_keyspace_read_misses{role="master"}[1m]))
    ```

**V1 metric:** `bdb_read_misses_max`
- **Description:** Highest value of rate of read operations accessing a non-existing key (ops/sec)
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by (bdb) (irate(redis_server_keyspace_read_misses{role="master"}[1m]))
    ```

**V1 metric:** `bdb_read_req`
- **Description:** Rate of read requests on DB (ops/sec)
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by (bdb) (irate(endpoint_read_req[1m]))
    ```

**V1 metric:** `bdb_read_req_max`
- **Description:** Highest value of rate of read requests on DB (ops/sec)
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by (bdb) (irate(endpoint_read_req[1m]))
    ```

**V1 metric:** `bdb_read_res`
- **Description:** Rate of read responses on DB (ops/sec)
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by(bdb) (irate(endpoint_read_res[1m]))
    ```

**V1 metric:** `bdb_read_res_max`
- **Description:** Highest value of rate of read responses on DB (ops/sec)
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by(bdb) (irate(endpoint_read_res[1m]))
    ```

**V1 metric:** `bdb_shard_cpu_system`
- **Description:** % cores utilization in system mode for all redis shard processes of this database
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by(bdb) (irate(namedprocess_namegroup_thread_cpu_seconds_total{mode="system", role="master"}[1m]))
    ```

**V1 metric:** `bdb_shard_cpu_system_max`
- **Description:** Highest value of % cores utilization in system mode for all redis shard processes of this database
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by(bdb) (irate(namedprocess_namegroup_thread_cpu_seconds_total{mode="system", role="master"}[1m]))
    ```

**V1 metric:** `bdb_shard_cpu_user`
- **Description:** % cores utilization in user mode for the redis shard process
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by(bdb) (irate(namedprocess_namegroup_thread_cpu_seconds_total{mode="user", role="master"}[1m]))
    ```

**V1 metric:** `bdb_shard_cpu_user_max`
- **Description:** Highest value of % cores utilization in user mode for the redis shard process
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by(bdb) (irate(namedprocess_namegroup_thread_cpu_seconds_total{mode="user", role="master"}[1m]))
    ```

**V1 metric:** `bdb_shards_used`
- **Description:** Used shard count by database and by shard type (ram / flash)
- **Equivalent V2 PromQL:**
    ```
    sum(
      (sum(
        label_replace(
          label_replace(
            label_replace(namedprocess_namegroup_thread_count{groupname=~"redis-\d+"}, 
                "redis", "$1", "groupname", "redis-(\d+)"),
              "shard_type", "flash", "threadname", "(bigstore).*"),
            "shard_type", "ram", "shard_type", "")
        ) by (redis, shard_type) > bool 0)
      * on (redis) group_left(bdb)
      redis_server_up
    ) by (bdb, shard_type)
    ```

**V1 metric:** `bdb_total_connections_received`
- **Description:** Rate of new client connections to DB (connections/sec)
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by(bdb) (irate(endpoint_total_connections_received[1m]))
    ```

**V1 metric:** `bdb_total_connections_received_max`
- **Description:** Highest value of rate of new client connections to DB (connections/sec)
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by(bdb) (irate(endpoint_total_connections_received[1m]))
    ```

**V1 metric:** `bdb_total_req`
- **Description:** Rate of all requests on DB (ops/sec)
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by (bdb) (irate(endpoint_total_req[1m]))
    ```

**V1 metric:** `bdb_total_req_max`
- **Description:** Highest value of rate of all requests on DB (ops/sec)
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by (bdb) (irate(endpoint_total_req[1m]))
    ```

**V1 metric:** `bdb_total_res`
- **Description:** Rate of all responses on DB (ops/sec)
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by(bdb) (irate(endpoint_total_res[1m]))
    ```

**V1 metric:** `bdb_total_res_max`
- **Description:** Highest value of rate of all responses on DB (ops/sec)
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by(bdb) (irate(endpoint_total_res[1m]))
    ```

**V1 metric:** `bdb_up`
- **Description:** Database is up and running
- **Equivalent V2 PromQL:** 
    ```promql
    min by(bdb) (redis_up)
    ```

**V1 metric:** `bdb_used_memory`
- **Description:** Memory used by db (in bigredis this includes flash) (bytes)
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by (bdb) (redis_server_used_memory)
    ```

**V1 metric:** `bdb_write_hits`
- **Description:** Rate of write operations accessing an existing key (ops/sec)
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by (bdb) (irate(redis_server_keyspace_write_hits{role="master"}[1m]))
    ```

**V1 metric:** `bdb_write_hits_max`
- **Description:** Highest value of rate of write operations accessing an existing key (ops/sec)
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by (bdb) (irate(redis_server_keyspace_write_hits{role="master"}[1m]))
    ```

**V1 metric:** `bdb_write_misses`
- **Description:** Rate of write operations accessing a non-existing key (ops/sec)
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by (bdb) (irate(redis_server_keyspace_write_misses{role="master"}[1m]))
    ```

**V1 metric:** `bdb_write_misses_max`
- **Description:** Highest value of rate of write operations accessing a non-existing key (ops/sec)
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by (bdb) (irate(redis_server_keyspace_write_misses{role="master"}[1m]))
    ```

**V1 metric:** `bdb_write_req`
- **Description:** Rate of write requests on DB (ops/sec)
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by (bdb) (irate(endpoint_write_req[1m]))
    ```

**V1 metric:** `bdb_write_req_max`
- **Description:** Highest value of rate of write requests on DB (ops/sec)
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by (bdb) (irate(endpoint_write_req[1m]))
    ```

**V1 metric:** `bdb_write_res`
- **Description:** Rate of write responses on DB (ops/sec)
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by(bdb) (irate(endpoint_write_responses[1m]))
    ```

**V1 metric:** `bdb_write_res_max`
- **Description:** Highest value of rate of write responses on DB (ops/sec)
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by(bdb) (irate(endpoint_write_responses[1m]))
    ```

**V1 metric:** `no_of_expires`
- **Description:** Current number of volatile keys in the database
- **Equivalent V2 PromQL:** 
    ```promql 
    sum by(bdb) (redis_server_db_expires{role="master"})
    ```

## Node metrics

TBA

## Cluster metrics

TBA

## Proxy metrics

TBA

## Replication metrics

TBA

## Shard metrics

TBA
