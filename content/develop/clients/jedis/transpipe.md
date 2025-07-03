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
weight: 5
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
buffered in the pipeline and only execute when you call the `sync()`
method on the pipeline object.

The main difference with the pipeline commands is that they return
`Response<Type>` objects, where `Type` is the return type of the
standard command method. A `Response` object contains a valid result
only after the pipeline has finished executing. You can access the
result using the `Response` object's `get()` method.

{{< clients-example pipe_trans_tutorial basic_pipe Java-Sync >}}
{{< /clients-example >}}

## Execute a transaction

A transaction works in a similar way to a pipeline. Create a
transaction object with the `multi()` command, call command methods
on that object, and then call the transaction object's 
`exec()` method to execute it. You can access the results
from commands in the transaction using `Response` objects, as
you would with a pipeline. However, the `exec()` method also
returns a `List<Object>` value that contains all the result
values in the order the commands were executed (see
[Watch keys for changes](#watch-keys-for-changes) below for
an example that uses the results list).

{{< clients-example pipe_trans_tutorial basic_trans Java-Sync >}}
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
Note that you should call read-only commands for the watched keys synchronously on
the usual client object (called `jedis` in our examples) but you still call commands
for the transaction on the transaction object.

For production usage, you would generally call code like the following in
a loop to retry it until it succeeds or else report or log the failure.

{{< clients-example pipe_trans_tutorial trans_watch Java-Sync >}}
{{< /clients-example >}}
