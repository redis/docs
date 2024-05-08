---
Title: Cluster alert and event logs
alwaysopen: false
categories:
- docs
- operate
- rs
description: Logged cluster alerts and events
linkTitle: Cluster alerts/events
weight: 50
---

The following cluster alerts and events can appear in `syslog`.

## UI alerts

Logged alerts that appear in the UI

| Alert code name | Alert as shown in the UI | Severity | Notes |
|-----------------|--------------------------|----------|-------|
even_node_count | True high availability requires an odd number of nodes with a minimum of three nodes | true:&nbsp;warning<br />false: info |  
inconsistent_redis_sw | Not all databases are running the same source available version | true:&nbsp;warning<br />false: info |  
inconsistent_rl_sw | Not all nodes in the cluster are running the same Redis Enterprise Cluster version | true:&nbsp;warning<br />false: info |  
internal_bdb | Issues with internal cluster databases | true:&nbsp;warning<br />false: info |  
multiple_nodes_down | Multiple cluster nodes are down - this might cause data loss | true:&nbsp;warning<br />false: info |  
ram_overcommit | Cluster capacity is less than total memory allocated to its databases | true:&nbsp;error<br />false: info |  
too_few_nodes_for_replication | Database replication requires at least two nodes in cluster | true:&nbsp;warning<br />false: info |  

## UI events

Logged events that appear in the UI

| Event code name | Event as shown in the UI | Severity | Notes |
|-----------------|--------------------------|----------|-------|
| node_joined | Node joined | info |  |
| node_remove_abort_completed | Node removed | info | The remove node is a process that can fail and can also be cancelled. If cancelled, the cancellation process can succeed or fail. |
| node_remove_abort_failed | Node removed | error | The remove node is a process that can fail and can also be cancelled. If cancelled, the cancellation process can succeed or fail. |
| node_remove_completed | Node removed | info | The remove node is a process that can fail and can also be cancelled. If cancelled, the cancellation process can succeed or fail. |
| node_remove_failed | Node removed | error | The remove node is a process that can fail and can also be cancelled. If cancelled, the cancellation process can succeed or fail. |
| rebalance_abort_completed | Nodes&nbsp;rebalanced |  info | The nodes rebalance is a process that can fail and can also be cancelled. If cancelled, the cancellation process can succeed or fail. |
| rebalance_abort_failed | Nodes&nbsp;rebalanced | error | The nodes rebalance is a process that can fail and can also be cancelled. If cancelled, the cancellation process can succeed or fail. |
| rebalance_completed | Nodes&nbsp;rebalanced | info | The nodes rebalance is a process that can fail and can also be cancelled. If cancelled, the cancellation process can succeed or fail. |
| rebalance_failed | Nodes&nbsp;rebalanced | error | The nodes rebalance is a process that can fail and can also be cancelled. If cancelled, the cancellation process can succeed or fail. |

## Non-UI events

Logged events that do not appear in the UI

| Event code name | Severity | Notes |
|-----------------|----------|-------|
| cluster_updated | info | Indicates that cluster settings have been updated |
| license_added | info |  |
| license_deleted | info |  |
| license_updated | info |  |