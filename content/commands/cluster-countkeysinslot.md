---
acl_categories:
- '@slow'
arguments:
- display_text: slot
  name: slot
  type: integer
arity: 3
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
complexity: O(1)
description: Returns the number of keys in a hash slot.
group: cluster
hidden: false
linkTitle: CLUSTER COUNTKEYSINSLOT
railroad_diagram: /images/railroad/cluster-countkeysinslot.svg
since: 3.0.0
summary: Returns the number of keys in a hash slot.
syntax_fmt: CLUSTER COUNTKEYSINSLOT slot
syntax_str: ''
title: CLUSTER COUNTKEYSINSLOT
---
Returns the number of keys in the specified Redis Cluster hash slot. The
command only queries the local data set, so contacting a node
that is not serving the specified hash slot will always result in a count of
zero being returned.

```
> CLUSTER COUNTKEYSINSLOT 7000
(integer) 50341
```

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="cluster-countkeysinslot-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): The number of keys in the specified hash slot, or an error if the hash slot is invalid.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): The number of keys in the specified hash slot, or an error if the hash slot is invalid.

{{< /multitabs >}}
