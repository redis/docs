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
scope: example
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

To execute commands in a pipeline, create a pipeline object with
[`pipeline()`](https://github.com/predis/predis) and then add commands to it
using methods that resemble the standard command methods (for example,
`set()` and `get()`). The commands are buffered in the pipeline and only
execute when you call the `execute()` method on the pipeline object. This
method returns an array containing the results from all the commands in order.

The command methods for a pipeline always return the original pipeline object,
so you can chain several commands together. You can also pass a callback to
`pipeline()` and let Predis execute the batch automatically when the callback
returns, as the example below shows:

{{< clients-example set="pipe_trans_tutorial" step="basic_pipe" lang_filter="PHP" description="Foundational: Use pipelines to batch multiple commands together and reduce network round trips" difficulty="beginner" >}}
{{< /clients-example >}}

## Execute a transaction

A transaction works in a similar way to a pipeline, but all the queued commands
execute atomically. With Predis, you can create a transaction by calling
`transaction()` and adding commands in a callback. Predis wraps those commands
with `MULTI` and `EXEC` automatically:

{{< clients-example set="pipe_trans_tutorial" step="basic_trans" lang_filter="PHP" description="Basic transaction: Execute commands atomically using transaction() to group related writes" difficulty="beginner" >}}
{{< /clients-example >}}

## Watch keys for changes

Redis supports *optimistic locking* to avoid inconsistent updates to keys that
several clients may modify at the same time. The basic idea is to watch for
changes to any keys that you use in a transaction while you are preparing the
update. If the watched keys do change, you must restart the update using the
latest value from Redis. See
[Transactions]({{< relref "develop/using-commands/transactions" >}})
for more information about optimistic locking.

The example below reads a string that represents a `PATH` variable for a
command shell, appends a new command path, and then writes it back inside a
transaction. The `cas` option enables check-and-set behavior, `watch` tells
Predis which key to monitor for changes, and `retry` lets Predis retry the
transaction automatically if another client changes the watched key before
`EXEC` runs:

{{< clients-example set="pipe_trans_tutorial" step="trans_watch" lang_filter="PHP" description="Optimistic locking: Use WATCH with a CAS transaction to retry updates when another client modifies the key" difficulty="intermediate" >}}
{{< /clients-example >}}
