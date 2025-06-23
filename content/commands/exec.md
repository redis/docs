---
acl_categories:
- '@slow'
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
- skip_slowlog
complexity: Depends on commands in the transaction
description: Executes all commands in a transaction.
group: transactions
hidden: false
linkTitle: EXEC
since: 1.2.0
summary: Executes all commands in a transaction.
syntax_fmt: EXEC
syntax_str: ''
title: EXEC
---
Executes all previously queued commands in a [transaction][tt] and restores the
connection state to normal.

[tt]: /develop/interact/transactions

When using [`WATCH`]({{< relref "/commands/watch" >}}), `EXEC` will execute commands only if the watched keys were
not modified, allowing for a [check-and-set mechanism][ttc].

[ttc]: /develop/interact/transactions#cas

## Return information

{{< multitabs id="exec-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Array reply](../../develop/reference/protocol-spec#arrays): each element being the reply to each of the commands in the atomic transaction.
* [Nil reply](../../develop/reference/protocol-spec#bulk-strings): the transaction was aborted because a `WATCH`ed key was touched.

-tab-sep-

One of the following:
* [Array reply](../../develop/reference/protocol-spec#arrays): each element being the reply to each of the commands in the atomic transaction.
* [Null reply](../../develop/reference/protocol-spec#nulls): the transaction was aborted because a `WATCH`ed key was touched.

{{< /multitabs >}}
