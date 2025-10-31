---
acl_categories:
- '@slow'
arguments:
- display_text: slot
  name: slot
  type: integer
- display_text: count
  name: count
  type: integer
arity: 4
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
- stale
complexity: O(N) where N is the number of requested keys
description: Returns the key names in a hash slot.
group: cluster
hidden: false
hints:
- nondeterministic_output
linkTitle: CLUSTER GETKEYSINSLOT
since: 3.0.0
summary: Returns the key names in a hash slot.
syntax_fmt: CLUSTER GETKEYSINSLOT slot count
syntax_str: count
title: CLUSTER GETKEYSINSLOT
---
The command returns an array of keys names stored in the contacted node and
hashing to the specified hash slot. The maximum number of keys to return
is specified via the `count` argument, so that it is possible for the user
of this API to batch-processing keys.

The main usage of this command is during rehashing of cluster slots from one
node to another. The way the rehashing is performed is exposed in the Redis
Cluster specification, or in a more simple to digest form, as an appendix
of the [`CLUSTER SETSLOT`]({{< relref "/commands/cluster-setslot" >}}) command documentation.

```
> CLUSTER GETKEYSINSLOT 7000 3
1) "key_39015"
2) "key_89793"
3) "key_92937"
```

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="cluster-getkeysinslot-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): an array with up to count elements.

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): an array with up to count elements.

{{< /multitabs >}}
