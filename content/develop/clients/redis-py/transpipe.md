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
    [Pipelining]({{< relref "/develop/use/pipelining" >}}) page for more
    information.
-   **Transactions** guarantee that all the included commands will execute
    to completion without being interrupted by commands from other clients.
    See the [Transactions]({{< relref "/develop/interact/transactions" >}})
    page for more information.

## Execute a pipeline

To execute commands in a pipeline, you first create a pipeline object
and then add commands to it using methods that resemble the standard
command methods (for example, `set()` and `get()`). The commands are
buffered in the pipeline and only execute when you call the `execute()`
method on the pipeline object. This method returns a list that contains
the results from all the commands in order.

Note that the command methods for a pipeline always return the original
pipeline object, so you can "chain" several commands together, as the
example below shows:

{{< clients-example pipe_trans_tutorial basic_pipe Python >}}
{{< /clients-example >}}

## Execute a transaction

A pipeline actually executes as a transaction by default (that is to say,
all commands are executed in an uninterrupted sequence). However, if you
need to switch this behavior off, you can set the `transaction` parameter
to `False` when you create the pipeline:

```python
pipe = r.pipeline(transaction=False)
```

## Watch keys for changes

Redis supports *optimistic locking* to avoid inconsistent updates
to different keys. The basic idea is to watch for changes to any
keys that you use in a transaction while you are are processing the
updates. If the watched keys do change, you must restart the updates
with the latest data from the keys. See
[Transactions]({{< relref "/develop/interact/transactions" >}})
for more information about optimistic locking.

The example below shows how to repeatedly attempt a transaction with a watched
key until it succeeds. The code reads a string
that represents a `PATH` variable for a command shell, then appends a new
command path to the string before attempting to write it back. If the watched
key is modified by another client before writing, the transaction aborts
with a `WatchError` exception, and the loop executes again for another attempt.
Otherwise, the loop terminates successfully.

{{< clients-example pipe_trans_tutorial trans_watch Python >}}
{{< /clients-example >}}

Because this is a common pattern, the library includes a convenience
method called `transaction()` that handles the code to watch keys,
execute the transaction, and retry if necessary. Pass
`transaction()` a function that implements your main transaction code,
and also pass the keys you want to watch. The example below implements
the same basic transaction as the previous example but this time
using `transaction()`. Note that `transaction()` can't add the `multi()`
call automatically, so you must still place this correctly in your
transaction function.

{{< clients-example pipe_trans_tutorial watch_conv_method Python >}}
{{< /clients-example >}}
