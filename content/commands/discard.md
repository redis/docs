---
acl_categories:
- '@fast'
- '@transaction'
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
- noscript
- loading
- stale
- fast
- allow_busy
complexity: O(N), when N is the number of queued commands
description: Discards a transaction.
group: transactions
hidden: false
linkTitle: DISCARD
railroad_diagram: /images/railroad/discard.svg
since: 2.0.0
summary: Discards a transaction.
syntax_fmt: DISCARD
syntax_str: ''
title: DISCARD
---
Flushes all previously queued commands in a [transaction][tt] and restores the
connection state to normal.

[tt]: /develop/interact/transactions

If [`WATCH`]({{< relref "/commands/watch" >}}) was used, `DISCARD` unwatches all keys watched by the connection.

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="discard-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

{{< /multitabs >}}
