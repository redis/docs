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
since: 3.0.0
summary: Advances the cluster config epoch.
syntax_fmt: CLUSTER BUMPEPOCH
syntax_str: ''
title: CLUSTER BUMPEPOCH
---
Advances the cluster config epoch.

The `CLUSTER BUMPEPOCH` command triggers an increment to the cluster's config epoch from the connected node. The epoch will be incremented if the node's config epoch is zero, or if it is less than the cluster's greatest epoch.

**Note:** config epoch management is performed internally by the cluster, and relies on obtaining a consensus of nodes. The `CLUSTER BUMPEPOCH` attempts to increment the config epoch **WITHOUT** getting the consensus, so using it may violate the "last failover wins" rule. Use it with caution.
