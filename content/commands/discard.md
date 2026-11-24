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
compatibility:
  software:
    standard: supported
    active_active: supported
  cloud:
    standard: supported
    active_active: supported
complexity: O(N), when N is the number of queued commands
description: Discards a transaction.
group: transactions
hidden: false
linkTitle: DISCARD
railroad_diagram: /images/railroad/discard.svg
since: 2.0.0
summary: Discards a transaction.
syntax_fmt: DISCARD
title: DISCARD
---
Flushes all previously queued commands in a [transaction](/content/develop/using-commands/transactions.md) and restores the
connection state to normal.

If [`WATCH`](/content/commands/watch.md) was used, `DISCARD` unwatches all keys watched by the connection.

## Redis Software and Redis Cloud compatibility

{{< command-compatibility >}}

## Return information

{{< multitabs id="discard-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

{{< /multitabs >}}
