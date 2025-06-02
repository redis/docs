---
acl_categories:
- '@admin'
- '@slow'
- '@dangerous'
arguments:
- arguments:
  - display_text: start-slot
    name: start-slot
    type: integer
  - display_text: end-slot
    name: end-slot
    type: integer
  multiple: true
  name: range
  type: block
arity: -4
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
command_flags:
- admin
- stale
- no_async_loading
complexity: O(N) where N is the total number of the slots between the start slot and
  end slot arguments.
description: Assigns new hash slot ranges to a node.
group: cluster
hidden: false
linkTitle: CLUSTER ADDSLOTSRANGE
since: 7.0.0
summary: Assigns new hash slot ranges to a node.
syntax_fmt: CLUSTER ADDSLOTSRANGE start-slot end-slot [start-slot end-slot ...]
syntax_str: ''
title: CLUSTER ADDSLOTSRANGE
---
The `CLUSTER ADDSLOTSRANGE` is similar to the [`CLUSTER ADDSLOTS`]({{< relref "/commands/cluster-addslots" >}}) command in that they both assign hash slots to nodes.

The difference between the two commands is that [`CLUSTER ADDSLOTS`]({{< relref "/commands/cluster-addslots" >}}) takes a list of slots to assign to the node, while `CLUSTER ADDSLOTSRANGE` takes a list of slot ranges (specified by start and end slots) to assign to the node.

## Example

To assign slots 1 2 3 4 5 to the node, the [`CLUSTER ADDSLOTS`]({{< relref "/commands/cluster-addslots" >}}) command is:

    > CLUSTER ADDSLOTS 1 2 3 4 5
    OK

The same operation can be completed with the following `CLUSTER ADDSLOTSRANGE` command:

    > CLUSTER ADDSLOTSRANGE 1 5
    OK


## Usage in Redis Cluster

This command only works in cluster mode and is useful in the following Redis Cluster operations:

1. To create a new cluster, `CLUSTER ADDSLOTSRANGE` is used to initially set up master nodes splitting the available hash slots among them.
2. In order to fix a broken cluster where certain slots are unassigned.
