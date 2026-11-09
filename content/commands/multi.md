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
description: Starts a transaction.
group: transactions
hidden: false
linkTitle: MULTI
railroad_diagram: /images/railroad/multi.svg
since: 1.2.0
summary: Starts a transaction.
syntax_fmt: MULTI
title: MULTI
---
> [!NOTE]
> This command's behavior varies in clustered Redis environments. See the [multi-key operations](/content/develop/using-commands/multi-key-operations.md) page for more information.


Marks the start of a [transaction](/content/develop/using-commands/transactions.md) block.
Subsequent commands will be queued for atomic execution using [`EXEC`](/content/commands/exec.md).

## Redis Software and Redis Cloud compatibility

{{< command-compatibility >}}

## Return information

{{< multitabs id="multi-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

{{< /multitabs >}}
