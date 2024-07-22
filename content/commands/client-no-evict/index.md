---
acl_categories:
- '@admin'
- '@slow'
- '@dangerous'
- '@connection'
arguments:
- arguments:
  - display_text: 'on'
    name: 'on'
    token: 'ON'
    type: pure-token
  - display_text: 'off'
    name: 'off'
    token: 'OFF'
    type: pure-token
  name: enabled
  type: oneof
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
- admin
- noscript
- loading
- stale
complexity: O(1)
description: Sets the client eviction mode of the connection.
group: connection
hidden: false
linkTitle: CLIENT NO-EVICT
since: 7.0.0
summary: Sets the client eviction mode of the connection.
syntax_fmt: CLIENT NO-EVICT <ON | OFF>
syntax_str: ''
title: CLIENT NO-EVICT
---
The `CLIENT NO-EVICT` command sets the [client eviction]({{< relref "/develop/reference/clients" >}}#client-eviction) mode for the current connection.

When turned on and client eviction is configured, the current connection will be excluded from the client eviction process even if we're above the configured client eviction threshold.

When turned off, the current client will be re-included in the pool of potential clients to be evicted (and evicted if needed).

See [client eviction]({{< relref "/develop/reference/clients" >}}#client-eviction) for more details.
