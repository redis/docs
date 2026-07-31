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

To execute commands in a pipeline with `redis-rb`, call `pipelined()` and queue
commands in the block. Redis executes them as a batch and `pipelined()` returns
the results in order:

{{< clients-example set="pipe_trans_tutorial" step="basic_pipe" lang_filter="Ruby" description="Foundational: Use pipelined to batch multiple commands together and reduce network round trips" difficulty="beginner" >}}
{{< /clients-example >}}

## Execute a transaction

Transactions use `multi()`. Commands queued inside the block run atomically
when the block finishes, and `multi()` returns the results in order:

{{< clients-example set="pipe_trans_tutorial" step="basic_trans" lang_filter="Ruby" description="Foundational: Use multi to execute multiple commands atomically without interruption from other clients" difficulty="beginner" >}}
{{< /clients-example >}}

## Watch keys for changes

Redis supports *optimistic locking* to avoid inconsistent updates to keys that
several clients may modify at the same time. The basic idea is to watch for
changes to any keys that you use in a transaction while you are preparing the
update. If the watched keys do change, the transaction returns `nil` and you
must retry using the latest value from Redis. See
[Transactions]({{< relref "develop/using-commands/transactions" >}})
for more information about optimistic locking.

The example below watches a key, reads its current value, and then updates it
inside `multi()`:

{{< clients-example set="pipe_trans_tutorial" step="trans_watch" lang_filter="Ruby" description="Optimistic locking: Use watch with multi and retry when another client modifies the watched key" difficulty="intermediate" >}}
{{< /clients-example >}}
