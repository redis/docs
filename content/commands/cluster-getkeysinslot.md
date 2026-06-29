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
railroad_diagram: /images/railroad/cluster-getkeysinslot.svg
since: 3.0.0
summary: Returns the key names in a hash slot.
syntax_fmt: CLUSTER GETKEYSINSLOT slot count
title: CLUSTER GETKEYSINSLOT
---

The command returns key names stored on the contacted node that hash to the specified `slot`. Use the `count` argument to limit the number of keys returned, which lets you process keys in batches.

This command is mainly used when you reshard cluster slots from one node to another. For details, see the [Redis Cluster specification]({{< relref "/operate/oss_and_stack/reference/cluster-spec" >}}) or the appendix in the [`CLUSTER SETSLOT`]({{< relref "/commands/cluster-setslot" >}}) documentation.

{{< note >}}During atomic slot migration operations (available since Redis 8.4.0), keys being imported or trimmed will be filtered out from the results.
{{< /note >}}

## Required arguments

<details open><summary><code>slot</code></summary>

The hash slot to return key names from.

</details>

<details open><summary><code>count</code></summary>

The maximum number of key names to return.

</details>

## Examples

```
> CLUSTER GETKEYSINSLOT 7000 3
1) "key_39015"
2) "key_89793"
3) "key_92937"
```

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
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
