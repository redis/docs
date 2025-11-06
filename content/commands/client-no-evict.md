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

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="client-no-evict-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

One of the following:

* [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}): `OK` if the command was successful.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: wrong number of or invalid arguments. 

-tab-sep-

One of the following:

* [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}): `OK` if the command was successful.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: wrong number of or invalid arguments.

{{< /multitabs >}}
