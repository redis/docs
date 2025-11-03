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

{{< note>}}During atomic slot migration operations (available since Redis 8.4.0), keys being imported or trimmed will be filtered out from the results.
{{< /note >}}

```
> CLUSTER COUNTKEYSINSLOT 7000
(integer) 50341
```

## Return information

{{< multitabs id="cluster-countkeysinslot-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): The number of keys in the specified hash slot, or an error if the hash slot is invalid.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): The number of keys in the specified hash slot, or an error if the hash slot is invalid.

{{< /multitabs >}}
