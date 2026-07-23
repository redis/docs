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

With Lettuce, you pipeline commands by buffering them on the client and then
flushing them to the server together. The synchronous and asynchronous APIs do
this by temporarily disabling auto-flushing with `setAutoFlushCommands()` and
then calling `flushCommands()`; each buffered command returns a `RedisFuture`
that you can inspect after the batch is flushed. The reactive API pipelines
commands by composing the corresponding `Mono` and `Flux` publishers:

{{< clients-example set="pipe_trans_tutorial" step="basic_pipe" lang_filter="Lettuce-Sync,Java-Async,Java-Reactive" description="Foundational: Batch multiple Lettuce commands and flush them to the server together" difficulty="beginner" >}}
{{< /clients-example >}}

## Execute a transaction

Lettuce transactions use the Redis `MULTI` and `EXEC` commands. Commands issued
between `multi()` and `exec()` are queued on the server and only run when
`exec()` completes. The return value from `exec()` is a `TransactionResult`
that contains the results in order:

{{< clients-example set="pipe_trans_tutorial" step="basic_trans" lang_filter="Lettuce-Sync,Java-Async,Java-Reactive" description="Foundational: Use MULTI and EXEC with Lettuce to execute multiple commands atomically" difficulty="beginner" >}}
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

{{< clients-example set="pipe_trans_tutorial" step="trans_watch" lang_filter="Lettuce-Sync,Java-Async,Java-Reactive" description="Optimistic locking: Use WATCH with EXEC and check whether Lettuce discarded the transaction" difficulty="intermediate" >}}
{{< /clients-example >}}
