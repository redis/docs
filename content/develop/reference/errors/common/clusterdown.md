---
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
description: The cluster can't serve the command because a hash slot has no working node.
linkTitle: CLUSTERDOWN
title: CLUSTERDOWN error
weight: 24
error:
  prefix: CLUSTERDOWN
  message: CLUSTERDOWN The cluster is down
  match:
  - Hash slot not served
  - The cluster is down
  - ClusterDownError
---

A Redis cluster returns this error when it can't serve your command. The message has two versions:

```
CLUSTERDOWN Hash slot not served
CLUSTERDOWN The cluster is down
```

- `Hash slot not served` means that no node serves the key's hash slot. This happens when some slots were never assigned to a node, for example, in a cluster you haven't finished setting up.
- `The cluster is down` means that the cluster is in a failed state. By default, a cluster stops serving commands when any hash slot has no working node. For example, this happens when a primary node fails and has no replica to take its place.

In redis-py, this error is `ClusterDownError: The cluster is down` or `ClusterDownError: Hash slot not served`.

## Example

After a primary with no replica fails, the other nodes stop serving commands, even for their own keys:

```
> GET foo
(error) CLUSTERDOWN The cluster is down
```

## How to fix it

1. Check the state of the cluster with [`CLUSTER INFO`](/content/commands/cluster-info.md). `cluster_state:fail` means the cluster is down. `cluster_slots_assigned` shows how many of the 16384 slots have a node.
1. Find the failed nodes with [`CLUSTER NODES`](/content/commands/cluster-nodes.md). A failed node has `fail` in its flags.
1. Bring the failed node back, or move its slots to working nodes. If slots were never assigned, assign them. `redis-cli --cluster create` assigns all the slots when it creates a cluster.

To keep the cluster working when a primary fails, give each primary at least one replica. A replica then takes its primary's place.

Two settings change what a cluster does when some slots have no working node:

- `cluster-require-full-coverage no` lets nodes keep serving the slots that still have a working node.
- `cluster-allow-reads-when-down yes` lets nodes serve reads while the cluster is in a failed state. Writes then get `CLUSTERDOWN The cluster is down and only accepts read commands`.

See [Redis Cluster configuration parameters](/content/operate/oss_and_stack/management/scaling.md#redis-cluster-configuration-parameters).
