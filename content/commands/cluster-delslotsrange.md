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
description: Sets hash slot ranges as unbound for a node.
group: cluster
hidden: false
linkTitle: CLUSTER DELSLOTSRANGE
since: 7.0.0
summary: Sets hash slot ranges as unbound for a node.
syntax_fmt: CLUSTER DELSLOTSRANGE start-slot end-slot [start-slot end-slot ...]
syntax_str: ''
title: CLUSTER DELSLOTSRANGE
---
The `CLUSTER DELSLOTSRANGE` command is similar to the [`CLUSTER DELSLOTS`]({{< relref "/commands/cluster-delslots" >}}) command in that they both remove hash slots from the node.
The difference is that [`CLUSTER DELSLOTS`]({{< relref "/commands/cluster-delslots" >}}) takes a list of hash slots to remove from the node, while `CLUSTER DELSLOTSRANGE` takes a list of slot ranges (specified by start and end slots) to remove from the node.

## Example

To remove slots 1 2 3 4 5 from the node, the [`CLUSTER DELSLOTS`]({{< relref "/commands/cluster-delslots" >}}) command is:

    > CLUSTER DELSLOTS 1 2 3 4 5
    OK

The same operation can be completed with the following `CLUSTER DELSLOTSRANGE` command:

    > CLUSTER DELSLOTSRANGE 1 5
    OK

However, note that:

1. The command only works if all the specified slots are already associated with the node.
2. The command fails if the same slot is specified multiple times.
3. As a side effect of the command execution, the node may go into *down* state because not all hash slots are covered.

## Usage in Redis Cluster

This command only works in cluster mode and may be useful for
debugging and in order to manually orchestrate a cluster configuration
when a new cluster is created. It is currently not used by `redis-cli`,
and mainly exists for API completeness.

## Return information

{{< multitabs id="cluster-delslotsrange-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK` if the command was successful. Otherwise an error is returned.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK` if the command was successful. Otherwise an error is returned.

{{< /multitabs >}}
