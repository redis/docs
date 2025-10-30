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
description: Starts a transaction.
group: transactions
hidden: false
linkTitle: MULTI
since: 1.2.0
summary: Starts a transaction.
syntax_fmt: MULTI
syntax_str: ''
title: MULTI
---
Marks the start of a [transaction][tt] block.
Subsequent commands will be queued for atomic execution using [`EXEC`]({{< relref "/commands/exec" >}}).

[tt]: /develop/interact/transactions

## Return information

{{< multitabs id="multi-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

{{< /multitabs >}}
