---
Title: rladmin verify
alwaysopen: false
categories:
- docs
- operate
- rs
description: Prints verification reports for the cluster.
headerRange: '[1-2]'
linkTitle: verify
toc: 'true'
weight: $weight
url: '/operate/rs/7.22/references/cli-utilities/rladmin/verify/'
---

Prints verification reports for the cluster.

## `verify balance`

Prints a balance report that displays all of the unbalanced endpoints or nodes in the cluster.

```sh
rladmin verify balance [ node <ID> ]
```

The [proxy policy]({{< relref "/operate/rs/7.22/databases/configure/proxy-policy#proxy-policies" >}}) determines which nodes or endpoints to report as unbalanced.

A node is unbalanced if:
- `all-nodes` proxy policy and the node has no endpoint

An endpoint is unbalanced in the following cases:
- `single` proxy policy and one of the following is true:  
    - Shard placement is [`sparse`]({{< relref "/operate/rs/7.22/databases/memory-performance/shard-placement-policy.md#sparse-shard-placement-policy" >}}) and none of the master shards are on the node
    - Shard placement is [`dense`]({{< relref "/operate/rs/7.22/databases/memory-performance/shard-placement-policy.md#dense-shard-placement-policy" >}}) and some master shards are on a different node from the endpoint
- `all-master-shards` proxy policy and one of the following is true:  
    - None of the master shards are on the node
    - Some master shards are on a different node from the endpoint

### Parameters

| Parameter | Type/Value | Description |
|-----------|------------|-------------|
| node | integer | Specify a node ID to return a balance table for that node only (optional) |

### Returns

Returns a table of unbalanced endpoints and nodes in the cluster.

### Examples

Verify all nodes:

```sh
$ rladmin verify balance       
The table presents all of the unbalanced endpoints/nodes in the cluster
BALANCE:
NODE:ID  DB:ID  NAME  ENDPOINT:ID  PROXY_POLICY  LOCAL SHARDS   TOTAL SHARDS
```

Verify a specific node:

```sh
$ rladmin verify balance node 1
The table presents all of the unbalanced endpoints/nodes in the cluster
BALANCE:
NODE:ID  DB:ID  NAME  ENDPOINT:ID  PROXY_POLICY  LOCAL SHARDS   TOTAL SHARDS
```

## `verify rack_aware`

Verifies that the cluster complies with the rack awareness policy and reports any discovered rack collisions, if [rack-zone awareness]({{< relref "/operate/rs/7.22/clusters/configure/rack-zone-awareness" >}}) is enabled.

```sh
rladmin verify rack_aware
```

### Parameters

None

### Returns

Returns whether the cluster is rack aware. If rack awareness is enabled, it returns any rack collisions.

### Example

```sh
$ rladmin verify rack_aware

Cluster policy is not configured for rack awareness.
```
