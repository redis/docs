---
acl_categories:
- '@admin'
- '@slow'
- '@dangerous'
arity: 2
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
complexity: O(1)
description: Advances the cluster config epoch.
group: cluster
hidden: false
hints:
- nondeterministic_output
linkTitle: CLUSTER BUMPEPOCH
railroad_diagram: /images/railroad/cluster-bumpepoch.svg
since: 3.0.0
summary: Advances the cluster config epoch.
syntax_fmt: CLUSTER BUMPEPOCH
title: CLUSTER BUMPEPOCH
---
Advances the cluster config epoch.

The `CLUSTER BUMPEPOCH` command triggers an increment to the cluster's config epoch from the connected node. The epoch will be incremented if the node's config epoch is zero, or if it is less than the cluster's greatest epoch.

**Note:** config epoch management is performed internally by the cluster, and relies on obtaining a consensus of nodes. The `CLUSTER BUMPEPOCH` attempts to increment the config epoch **WITHOUT** getting the consensus, so using it may violate the "last failover wins" rule. Use it with caution.

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="cluster-bumpepoch-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): `BUMPED` if the epoch was incremented.
* [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): `STILL` if the node already has the greatest configured epoch in the cluster.

-tab-sep-

One of the following:
* [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): `BUMPED` if the epoch was incremented.
* [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): `STILL` if the node already has the greatest configured epoch in the cluster.

{{< /multitabs >}}
