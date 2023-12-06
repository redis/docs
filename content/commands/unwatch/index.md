---
acl_categories:
- '@fast'
- '@transaction'
arity: 1
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

[tt]: /topics/transactions

If you call [`EXEC`](/commands/exec) or [`DISCARD`](/commands/discard), there's no need to manually call `UNWATCH`.
