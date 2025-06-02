---
acl_categories:
- '@fast'
- '@connection'
arity: 1
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
- fast
complexity: O(1)
description: Signals that a cluster client is following an -ASK redirect.
group: cluster
hidden: false
linkTitle: ASKING
since: 3.0.0
summary: Signals that a cluster client is following an -ASK redirect.
syntax_fmt: ASKING
syntax_str: ''
title: ASKING
---
When a cluster client receives an `-ASK` redirect, the `ASKING` command is sent to the target node followed by the command which was redirected.
This is normally done automatically by cluster clients.

If an `-ASK` redirect is received during a transaction, only one ASKING command needs to be sent to the target node before sending the complete transaction to the target node.

See [ASK redirection in the Redis Cluster Specification]({{< relref "/operate/oss_and_stack/reference/cluster-spec#ask-redirection" >}}) for details.
