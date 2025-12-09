---
acl_categories:
- '@admin'
- '@slow'
- '@dangerous'
arguments:
- display_text: slot
  multiple: true
  name: slot
  type: integer
arity: -3
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
complexity: O(N) where N is the total number of hash slot arguments
description: Sets hash slots as unbound for a node.
group: cluster
hidden: false
linkTitle: CLUSTER DELSLOTS
railroad_diagram: /images/railroad/cluster-delslots.svg
since: 3.0.0
summary: Sets hash slots as unbound for a node.
syntax_fmt: CLUSTER DELSLOTS slot [slot ...]
syntax_str: ''
title: CLUSTER DELSLOTS
---
In Redis Cluster, each node keeps track of which master is serving
a particular hash slot.

The `CLUSTER DELSLOTS` command asks a particular Redis Cluster node to
forget which master is serving the hash slots specified as arguments.

In the context of a node that has received a `CLUSTER DELSLOTS` command and
has consequently removed the associations for the passed hash slots,
we say those hash slots are *unbound*. Note that the existence of
unbound hash slots occurs naturally when a node has not been
configured to handle them (something that can be done with the
[`CLUSTER ADDSLOTS`]({{< relref "/commands/cluster-addslots" >}}) command) and if it has not received any information about
who owns those hash slots (something that it can learn from heartbeat
or update messages).

If a node with unbound hash slots receives a heartbeat packet from
another node that claims to be the owner of some of those hash
slots, the association is established instantly. Moreover, if a
heartbeat or update message is received with a configuration epoch
greater than the node's own, the association is re-established.

However, note that:

1. The command only works if all the specified slots are already
associated with some node.
2. The command fails if the same slot is specified multiple times.
3. As a side effect of the command execution, the node may go into
*down* state because not all hash slots are covered.

## Example

The following command removes the association for slots 5000 and
5001 from the node receiving the command:

    > CLUSTER DELSLOTS 5000 5001
    OK

## Usage in Redis Cluster

This command only works in cluster mode and may be useful for
debugging and in order to manually orchestrate a cluster configuration
when a new cluster is created. It is currently not used by `redis-cli`,
and mainly exists for API completeness.

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="cluster-delslots-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK` if the command was successful. Otherwise an error is returned.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK` if the command was successful. Otherwise an error is returned.

{{< /multitabs >}}
