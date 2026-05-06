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

`StackExchange.Redis` pipelines commands by using its asynchronous command
methods. Start the operations without waiting for each one immediately, then
wait for their tasks after you have queued the commands. The multiplexer sends
the requests as soon as possible and processes the responses when they arrive.
See the StackExchange.Redis
[Pipelines and Multiplexers](https://stackexchange.github.io/StackExchange.Redis/PipelinesMultiplexers.html)
page for more information.

{{< clients-example set="pipe_trans_tutorial" step="basic_pipe" lang_filter="C#-Async (SE.Redis)" description="Foundational: Use pipelines to batch multiple commands together and reduce network round trips" difficulty="beginner" >}}
{{< /clients-example >}}

## Execute a transaction

A transaction queues commands on an `ITransaction` object that you create with
`CreateTransaction()`. Call async command methods on that object, then call
`Execute()` or `ExecuteAsync()` to attempt the transaction. The queued command
tasks complete after the transaction executes.

{{< clients-example set="pipe_trans_tutorial" step="basic_trans" lang_filter="C#-Async (SE.Redis)" description="Foundational: Use transactions to execute multiple commands atomically without interruption from other clients" difficulty="beginner" >}}
{{< /clients-example >}}

## Watch keys for changes

Redis supports *optimistic locking* to avoid inconsistent updates
to different keys. The basic idea is to watch for changes to any
keys that you use in a transaction while you are are processing the
updates. If the watched keys do change, you must restart the updates
with the latest data from the keys. See
[Transactions]({{< relref "develop/using-commands/transactions" >}})
for more information about optimistic locking.

The approach to optimistic locking that other clients use
(adding the [`WATCH`]({{< relref "/commands/watch" >}}) command
explicitly to a transaction) doesn't work well with the
[multiplexing]({{< relref "/develop/clients/pools-and-muxing" >}})
system that `StackExchange.Redis` uses.
Instead, `StackExchange.Redis` relies on conditional execution of commands
to get a similar effect.

Use the `AddCondition()` method to abort a transaction if a particular
condition doesn't hold throughout its execution. If the transaction
does abort then the `Execute()` method returns a `false` value,
but otherwise returns `true`.

For example, the `KeyNotExists` condition aborts the transaction
if a specified key exists or is added by another client while the
transaction executes:

{{< clients-example set="pipe_trans_tutorial" step="trans_watch" lang_filter="C#-Async (SE.Redis)" description="Optimistic locking: Use conditions to monitor keys for changes and abort transactions when conflicts occur" difficulty="intermediate" >}}
{{< /clients-example >}}

You can also use a `When` condition on certain individual commands to
specify that they only execute when a certain condition holds
(for example, the command does not change an existing key).
See
[Conditional execution]({{< relref "/develop/clients/dotnet/condexec" >}})
for a full description of transaction and command conditions.
