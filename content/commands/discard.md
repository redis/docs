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

## Return information

{{< multitabs id="discard-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

{{< /multitabs >}}
