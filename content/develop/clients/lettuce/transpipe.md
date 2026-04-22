---
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
description: Learn how to use Redis pipelines and transactions
linkTitle: Pipelines/transactions
title: Pipelines and transactions
weight: 40
---

Redis lets you send a sequence of commands to the server together in a batch.
There are two types of batch that you can use:

-   **Pipelines** avoid network and processing overhead by sending several commands
    to the server together in a single communication. The server then sends back
    a single communication with all the responses. See the
    [Pipelining]({{< relref "/develop/using-commands/pipelining" >}}) page for more
    information.
-   **Transactions** guarantee that all the included commands will execute
    to completion without being interrupted by commands from other clients.
    See the [Transactions]({{< relref "develop/using-commands/transactions" >}})
    page for more information.

## Execute a pipeline

With Lettuce, pipelining is usually done by temporarily disabling auto-flushing
on the connection. Commands are then buffered on the client until you call
`flushCommands()`. The asynchronous API returns `RedisFuture` objects for each
buffered command, which you can inspect after the batch is flushed:

{{< clients-example set="pipe_trans_tutorial" step="basic_pipe" lang_filter="Lettuce-Sync" description="Foundational: Batch multiple Lettuce commands by disabling auto-flush and flushing them together" difficulty="beginner" >}}
{{< /clients-example >}}

## Execute a transaction

Lettuce transactions use the Redis `MULTI` and `EXEC` commands directly.
After calling `multi()`, the queued commands return `null` immediately because
Redis only executes them when you call `exec()`. The return value from `exec()`
is a `TransactionResult` that contains the actual results in order:

{{< clients-example set="pipe_trans_tutorial" step="basic_trans" lang_filter="Lettuce-Sync" description="Foundational: Use MULTI and EXEC with Lettuce to execute multiple commands atomically" difficulty="beginner" >}}
{{< /clients-example >}}

## Watch keys for changes

Redis supports *optimistic locking* to avoid inconsistent updates to keys that
several clients may modify at the same time. The basic idea is to watch for
changes to any keys that you use in a transaction while you are preparing the
update. If the watched keys do change, Redis discards the transaction and you
must retry using the latest value from Redis. See
[Transactions]({{< relref "develop/using-commands/transactions" >}})
for more information about optimistic locking.

The example below watches a key, reads its current value, queues an update
inside `MULTI`, and then checks `TransactionResult.wasDiscarded()` after
`EXEC`:

{{< clients-example set="pipe_trans_tutorial" step="trans_watch" lang_filter="Lettuce-Sync" description="Optimistic locking: Use WATCH with EXEC and check whether Lettuce discarded the transaction" difficulty="intermediate" >}}
{{< /clients-example >}}
