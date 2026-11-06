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
complexity: O(1)
description: Forgets about watched keys of a transaction.
group: transactions
hidden: false
linkTitle: UNWATCH
railroad_diagram: /images/railroad/unwatch.svg
since: 2.2.0
summary: Forgets about watched keys of a transaction.
syntax_fmt: UNWATCH
title: UNWATCH
---
Flushes all the previously watched keys for a [transaction](/content/develop/using-commands/transactions.md).

If you call [`EXEC`](/content/commands/exec.md) or [`DISCARD`](/content/commands/discard.md), there's no need to manually call `UNWATCH`.

## Redis Software and Redis Cloud compatibility

{{< command-compatibility >}}

## Return information

{{< multitabs id="unwatch-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

{{< /multitabs >}}
