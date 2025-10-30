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
complexity: O(1)
description: Forgets about watched keys of a transaction.
group: transactions
hidden: false
linkTitle: UNWATCH
since: 2.2.0
summary: Forgets about watched keys of a transaction.
syntax_fmt: UNWATCH
syntax_str: ''
title: UNWATCH
---
Flushes all the previously watched keys for a [transaction][tt].

[tt]: /develop/interact/transactions

If you call [`EXEC`]({{< relref "/commands/exec" >}}) or [`DISCARD`]({{< relref "/commands/discard" >}}), there's no need to manually call `UNWATCH`.

## Return information

{{< multitabs id="unwatch-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

{{< /multitabs >}}
