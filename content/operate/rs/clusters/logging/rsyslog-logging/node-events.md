---
Title: Node alert and event logs
alwaysopen: false
categories:
- docs
- operate
- rs
description: Logged node alerts and events
linkTitle: Node alerts/events
weight: 50
---

The following node alerts and events can appear in `syslog`.

## UI alerts

Logged alerts that appear in the UI

| Alert code name | Alert as shown in the UI | Severity | Notes |
|-----------------|--------------------------|----------|-------|
aof_slow_disk_io | Redis performance is degraded as result of disk I/O limits | true:&nbsp;error<br />false: info | 
cpu_utilization | CPU utilization has reached <threshold>% | true:&nbsp;warning<br />false: info | Has global_threshold parameter in the key/value section of the log entry.
ephemeral_storage | Ephemeral storage has reached <threshold>% of its capacity | true:&nbsp;warning<br />false: info | Has global_threshold parameter in the key/value section of the log entry. |
failed | Node failed | critical |  
free_flash | Flash storage has reached <threshold>% of its capacity | true:&nbsp;warning<br />false: info | Has global_threshold parameter in the key/value section of the log entry.
insufficient_disk_aofrw | Node has insufficient disk space for AOF rewrite | true:&nbsp;error<br />false: info |  
memory | Node memory has reached <threshold>% of its capacity | true:&nbsp;warning<br />false: info | Has global_threshold parameter in the key/value section of the log entry. |
net_throughput | Network throughput has reached <threshold>MB/s | true:&nbsp;warning<br />false: info | Has global_threshold parameter in the key/value section of the log entry. |
persistent_storage | Persistent storage has reached <threshold>% of its capacity | true:&nbsp;warning<br />false: info | Has global_threshold parameter in the key/value section of the log entry. |

## Non-UI events

Logged events that do not appear in the UI

| Event code name | Severity | Notes |
|-----------------|----------|-------|
| checks_error | error | Indicates that one or more node checks have failed |
| node_abort_remove_request | info |  |
| node_remove_request | info |  |