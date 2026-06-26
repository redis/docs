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
weight: 50
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

To execute commands in a pipeline, you first create a pipeline object
and then add commands to it using methods that resemble the standard
command methods (for example, `set()` and `get()`). The commands are
buffered in the pipeline and only execute when you call the `exec()`
method on the pipeline object. If you need the results from the
commands, use the `query()` method, which returns
the results from all the commands in order.

Note that the command methods for a pipeline always return the original
pipeline object, so you can "chain" several commands together, as the
example below shows:

{{< clients-example set="pipe_trans_tutorial" step="basic_pipe" lang_filter="Rust-Sync" description="Foundational: Use pipelines to batch multiple commands together and reduce network round trips" difficulty="beginner" >}}
{{< /clients-example >}}

## Execute a transaction

You can execute a simple transaction by adding the `atomic()` method to a pipeline.

{{< clients-example set="pipe_trans_tutorial" step="basic_trans" lang_filter="Rust-Sync" description="Foundational: Use transactions to execute multiple commands atomically without interruption from other clients" difficulty="beginner" >}}
{{< /clients-example >}}

## Watch keys for changes

Redis supports *optimistic locking* to avoid inconsistent updates
to different keys. The basic idea is to watch for changes to any
keys that you use in a transaction while you are processing the
updates. If the watched keys do change, you must restart the updates
with the latest data from the keys. See
[Transactions]({{< relref "develop/using-commands/transactions" >}})
for more information about optimistic locking.

The example below shows how to use the `transaction()` function to
automatically retry a transaction when watched keys are modified.
Pass the list of keys you want to watch and a closure representing the transaction.
The closure receives the original connection and a pipeline as parameters.
Use the connection to read the latest values from the watched keys,
but always use the pipeline to add all the commands that make up the watched transaction.
If the watched keys are modified during the transaction, the `transaction()` function
automatically retries the transaction until it succeeds.

{{< clients-example set="pipe_trans_tutorial" step="trans_watch" lang_filter="Rust-Sync" description="Optimistic locking: Monitor keys for changes and retry the transaction when conflicts occur" difficulty="intermediate" >}}
{{< /clients-example >}}

