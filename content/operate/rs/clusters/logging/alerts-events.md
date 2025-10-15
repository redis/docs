---
Title: Alerts and events
alwaysopen: false
categories:
- docs
- operate
- rs
description: Logged alerts and events
linkTitle: Alerts and events
weight: 50
---

The following alerts and events can appear in `syslog` and the Cluster Manager UI logs.

## Alerts

| Alert | UI message | Severity | Notes |
|-------|------------|----------|-------|
| aof_slow_disk_io | Redis performance is degraded as a result of disk I/O limits | True: error, False: info | Node alert |
| authentication_err | Error authenticating with the source database | error | BDB event |
| backup_delayed | Periodic backup has been delayed for longer than `<threshold>` minutes | True: warning, False: info | BDB alert; Has threshold parameter in the data section of the log entry |
| cpu_utilization | CPU utilization has reached `<threshold>`% | True: warning, False: info | Node alert; Has global_threshold parameter in the key/value section of the log entry |
| even_node_count | True high availability requires an odd number of nodes | True: warning, False: info | Cluster alert |
| ephemeral_storage | Ephemeral storage has reached `<threshold>`% of its capacity | True: warning, False: info | Node alert; Has global_threshold parameter in the key/value section of the log entry |
| free_flash | Flash storage has reached `<threshold>`% of its capacity | True: warning, False: info | Node alert; Has global_threshold parameter in the key/value section of the log entry |
| high_latency | Latency is higher than `<threshold>` milliseconds | True: warning, False: info | BDB alert; Has threshold parameter in the key/value section of the log entry |
| high_syncer_lag | Sync lag is higher than `<threshold>` seconds | True: warning, False: info | BDB alert; Has threshold parameter in the key/value section of the log entry |
| high_throughput | Throughput is higher than `<threshold>` RPS (requests per second) | True: warning, False: info | BDB alert; Has threshold parameter in the key/value section of the log entry |
| inconsistent_redis_sw | Not all databases are running the same open source version | True: warning, False: info | Cluster alert |
| inconsistent_rl_sw | Not all nodes in the cluster are running the same Redis Labs Enterprise Cluster version | True: warning, False: info | Cluster alert |
| insufficient_disk_aofrw | Node has insufficient disk space for AOF rewrite | True: error, False: info | Node alert |
| memory | Node memory has reached `<threshold>`% of its capacity | True: warning, False: info | Node alert; Has global_threshold parameter in the key/value section of the log entry |
| multiple_nodes_down | Multiple cluster nodes are down - this might cause data loss | True: warning, False: info | Cluster alert |
| net_throughput | Network throughput has reached `<threshold>` MB/s | True: warning, False: info | Node alert; Has global_threshold parameter in the key/value section of the log entry |
| ocsp_query_failed | Failed querying OCSP server | True: error, False: info | Cluster alert |
| ocsp_status_revoked | OCSP status revoked | True: error, False: info | Cluster alert |
| persistent_storage | Persistent storage has reached `<threshold>`% of its capacity | True: warning, False: info | Node alert; Has global_threshold parameter in the key/value section of the log entry |
| ram_dataset_overhead | RAM Dataset overhead in a shard has reached `<threshold>`% of its RAM limit | True: warning, False: info | BDB alert; Has threshold parameter in the key/value section of the log entry |
| ram_overcommit | Cluster capacity is less than total memory allocated to its databases | True: error, False: info | Cluster alert |
| ram_values | Percent of values in a shard's RAM is lower than `<threshold>`% of its key count | True: warning, False: info | BDB alert; Has threshold parameter in the key/value section of the log entry |
| shard_num_ram_values | Number of values in a shard's RAM is lower than `<threshold>` values | True: warning, False: info | BDB alert; Has threshold parameter in the key/value section of the log entry |
| size | Dataset size has reached `<threshold>`% of the memory limit | True: warning, False: info | BDB alert; Has threshold parameter in the key/value section of the log entry |
| syncer_connection_error | Syncer connection error | error | BDB alert |
| syncer_general_error | Syncer general error | error | BDB alert |
| too_few_nodes_for_replication | Database replication requires at least two nodes in cluster | True: warning, False: info | Cluster alert |

## Events

| Event | UI message | Severity | Notes |
|-------|------------|----------|-------|
| backup_failed | Backup failed | error | BDB event |
| backup_started | Backup started | info | BDB event |
| backup_succeeded | Backup succeeded | info | BDB event |
| bdb_created | Database created | info | BDB event |
| bdb_deleted | Database deleted | info | BDB event |
| bdb_updated | Database updated | info | BDB event; Indicates that a BDB configuration has been updated |
| checks_error | Node checks error | error | Node event; Indicates that one or more node checks have failed |
| cluster_updated | Cluster settings updated | info | Cluster event; Indicates that cluster settings have been updated |
| compression_unsup_err | Compression not supported by sync destination | error | BDB event |
| crossslot_err | Sharded destination does not support operation executed on source | error | BDB event |
| export_failed | Export failed | error | BDB event |
| export_started | Export started | info | BDB event |
| export_succeeded | Export succeeded | info | BDB event |
| import_failed | Import failed | error | BDB event |
| import_started | Import started | info | BDB event |
| import_succeeded | Import succeeded | info | BDB event |
| license_added | License added | info | Cluster event |
| license_deleted | License deleted | info | Cluster event |
| license_updated | License updated | info | Cluster event |
| node_abort_remove_request | Node abort remove request | info | Node event |
| node_joined | Node joined | info | Cluster event |
| node_operation_failed | Node operation failed | error | Cluster event |
| node_remove_abort_completed | Node remove abort completed | info | Cluster event; The remove node is a process that can fail and can also be aborted. If aborted, the abort can succeed or fail |
| node_remove_abort_failed | Node remove abort failed | error | Cluster event; The remove node is a process that can fail and can also be aborted. If aborted, the abort can succeed or fail |
| node_remove_completed | Node removed | info | Cluster event; The remove node is a process that can fail and can also be aborted. If aborted, the abort can succeed or fail |
| node_remove_failed | Node removed | error | Cluster event; The remove node is a process that can fail and can also be aborted. If aborted, the abort can succeed or fail |
| node_remove_request | Node remove request | info | Node event |
| user_created | User created | info | User event |
| user_deleted | User deleted | info | User event |
| user_updated | User updated | info | User event; Indicates that a user configuration has been updated |
