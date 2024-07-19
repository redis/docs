---
Title: Database alert and event logs
alwaysopen: false
categories:
- docs
- operate
- rs
description: Logged database alerts and events
linkTitle: Database alerts/events
weight: 50
---

The following database (BDB) alerts and events can appear in `syslog`.

## UI alerts

Logged alerts that appear in the UI

| Alert code name | Alert as shown in the UI | Severity | Notes |
|-----------------|--------------------------|----------|-------|
| backup_delayed | Periodic backup has been delayed for longer than `<threshold>` minutes | true:&nbsp;warning<br />false: info | Has threshold parameter in the data section of the log entry.
| high_latency | Latency is higher than `<threshold>` milliseconds | true:&nbsp;warning<br />false: info | Has threshold parameter in the key/value section of the log entry.
| high_syncer_lag | Replica of - sync lag is higher than `<threshold>` seconds | true:&nbsp;warning<br />false: info | Has threshold parameter in the key/value section of the log entry.
| high_throughput | Throughput is higher than `<threshold>` RPS (requests per second) | true:&nbsp;warning<br />false: info | Has threshold parameter in the key/value section of the log entry.
| low_throughput | Throughput is lower than `<threshold>` RPS (requests per second) | true:&nbsp;warning<br />false: info | Has threshold parameter in the key/value section of the log entry.
| ram_dataset_overhead | RAM Dataset overhead in a shard has reached `<threshold>`% of its RAM limit | true:&nbsp;warning<br />false: info | Has threshold parameter in the key/value section of the log entry.
| ram_values | Percent of values in a shard’s RAM is lower than `<threshold>`% of its key count | true:&nbsp;warning<br />false: info | Has threshold parameter in the key/value section of the log entry.
| shard_num_ram_values | Number of values in a shard’s RAM is lower than `<threshold>` values | true:&nbsp;warning<br />false: info | Has threshold parameter in the key/value section of the log entry.
| size | Dataset size has reached `<threshold>`% of the memory limit | true:&nbsp;warning<br />false: info | Has threshold parameter in the key/value section of the log entry.
| syncer_connection_error | Replica of - database unable to sync with source | error |  
| syncer_general_error | Replica of - database unable to sync with source | error |  

## Non-UI events

Logged events that do not appear in the UI

| Event code name | Severity | Notes |
|-----------------|----------|-------|
| authentication_err | error | Replica of - Error authenticating with the source database |
| backup_failed | error |  |
| backup_started | info |  |
| backup_succeeded | info |  |
| bdb_created | info |  |
| bdb_deleted | info |  |
| bdb_updated | info | Indicates that a BDB configuration has been updated |
| compression_unsup_err | error | Replica of - Compression not supported by sync destination |
| crossslot_err | error | Replica of - Sharded destination does not support operation executed on source |
| export_failed | error |  |
| export_started | info |  |
| export_succeeded | info |  |
| import_failed | error |  |
| import_started | info |  |
| import_succeeded | info |  |
| oom_err | error | Replica of - Replication source/target out of memory |