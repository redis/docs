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

To execute commands in a pipeline, you first create a pipeline object
and then add commands to it using methods that resemble the standard
command methods (for example, `Set()` and `Get()`). The commands are
buffered in the pipeline and only execute when you call the `Exec()`
method on the pipeline object.

The main difference with the pipeline commands is that their return
values contain a valid result only after the pipeline has finished executing.
You can access the result using the `Val()` method instead of
`Result()` (note that errors are reported by the `Exec()` method rather
than by the individual commands).

{{< clients-example set="pipe_trans_tutorial" step="basic_pipe" lang_filter="Go" description="Basic pipeline: Execute multiple commands in a single batch using Pipeline and Exec" difficulty="beginner" >}}
{{< /clients-example >}}

You can also create a pipeline using the `Pipelined()` method.
This executes pipeline commands in a callback function that you
provide and calls `Exec()` automatically after it returns:

{{< clients-example set="pipe_trans_tutorial" step="basic_pipe_pipelined" lang_filter="Go" description="Pipeline with callback: Use Pipelined method for automatic execution of batched commands" difficulty="beginner" >}}
{{< /clients-example >}}

## Execute a transaction

A transaction works in a similar way to a pipeline. Create a
transaction object with the `TxPipeline()` method, call command methods
on that object, and then call the transaction object's
`Exec()` method to execute it. You can access the results
from commands in the transaction after it completes using the
`Val()` method.

{{< clients-example set="pipe_trans_tutorial" step="basic_trans" lang_filter="Go" description="Basic transaction: Execute commands atomically using TxPipeline to ensure consistency" difficulty="beginner" >}}
{{< /clients-example >}}

There is also a `TxPipelined()` method that works in a similar way
to `Pipelined()`, described above:

{{< clients-example set="pipe_trans_tutorial" step="basic_trans_txpipelined" lang_filter="Go" description="Transaction with callback: Use TxPipelined for automatic atomic execution with callback syntax" difficulty="beginner" >}}
{{< /clients-example >}}

## Watch keys for changes

Redis supports *optimistic locking* to avoid inconsistent updates
to different keys. The basic idea is to watch for changes to any
keys that you use in a transaction while you are are processing the
updates. If the watched keys do change, you must restart the updates
with the latest data from the keys. See
[Transactions]({{< relref "develop/using-commands/transactions" >}})
for more information about optimistic locking.

The code below reads a string
that represents a `PATH` variable for a command shell, then appends a new
command path to the string before attempting to write it back. If the watched
key is modified by another client before writing, the transaction aborts.
The `Watch()` method receives a callback function where you execute the
commands you want to watch. In the body of this callback, you can execute
read-only commands before the transaction using the usual client object
(called `rdb` in our examples) and receive an immediate result. Start the
transaction itself by calling `TxPipeline()` or `TxPipelined()` on the
`Tx` object passed to the callback. `Watch()` also receives one or more
`string` parameters after the callback that represent the keys you want
to watch.

For production usage, you would generally call code like the following in
a loop to retry it until it succeeds or else report or log the failure:

{{< clients-example set="pipe_trans_tutorial" step="trans_watch" lang_filter="Go" description="Optimistic locking: Watch keys for changes and retry transactions when watched keys are modified" difficulty="advanced" >}}
{{< /clients-example >}}
