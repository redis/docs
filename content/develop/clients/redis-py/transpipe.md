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
weight: 2
---

Redis lets you send a sequence of commands to the server together in a batch.
There are two types of batch that you can use:

-   **Pipelines** avoid network and processing overhead by sending several commands
    to the server together in a single communication. The server then sends back
    a single communication with all the responses. This typically improves
    performance compared to sending the commands separately. See the
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

<!-- Tested examples will replace the inline ones when they are approved. -->
<!--
{{< clients-example pipe_trans_tutorial basic_pipe Python >}}
{{< /clients-example >}}
-->
```python
import redis

r = redis.Redis(decode_responses=True)

pipe = r.pipeline()

for i in range(5):
    pipe.set(f"seat:{i}", f"#{i}")

set_5_result = pipe.execute()
print(set_5_result)  # >>> [True, True, True, True, True]

pipe = r.pipeline()

# "Chain" pipeline commands together.
get_3_result = pipe.get("seat:0").get("seat:3").get("seat:4").execute()
print(get_3_result)  # >>> ['#0', '#3', '#4']
```

## Execute a transaction

A pipeline actually executes as a transaction by default (that is to say,
all commands are executed in an uninterrupted sequence). However, if you
need to switch this behavior off, you can set the `transaction` parameter
to `False` when you create the pipeline:

```python
pipe = r.pipeline(transaction=False)
```

## Watch keys for changes

When you use transactions, you will often need to read values from the
database, process them, and then write the modified values back. Ideally,
you would want to perform the whole read-modify-write sequence atomically, without any
interruptions from other clients. However, you don't get the results from
any commands that are buffered in a transaction until the whole transaction has finished
executing. This means you can't read keys, process the data, and then write the keys back
in the same transaction. Other clients can therefore modify the values you have
read before you have the chance to write them.

Redis solves this problem by letting you watch for changes to keys in the
database just before executing a transaction. The basic stages are as
follows:

1.  Start watching the keys you are about to update.
1.  Read the data values from those keys.
1.  Perform changes to the data values.
1.  Add commands to a transaction to write the data values back.
1.  Attempt to execute the transaction.
1.  If the keys you were watching changed before the transaction started
    executing, then abort the transaction and start again from step 1.
    Otherwise, the transaction was successful and the updated data is written back.

This technique is called *optimistic locking* and works well in cases
where multiple clients might access the same data simultaneously, but
usually don't. See
[Transactions]({{< relref "/develop/interact/transactions" >}})
for more information about optimistic locking.

The example below shows how to repeatedly attempt a transaction with a watched
key until it succeeds. The code reads a string
that represents a `PATH` variable for a command shell, then appends a new
command path to the string before attempting to write it back. If the watched
key is modified by another client before writing, the transaction aborts
with a `WatchError` exception, and the loop executes again for another attempt.
Otherwise, the loop terminates successfully.

<!--
{{< clients-example pipe_trans_tutorial trans_watch Python >}}
{{< /clients-example >}}
-->
```python
r.set("shellpath", "/usr/syscmds/")

with r.pipeline() as pipe:
    # Repeat until successful.
    while True:
        try:
            # Watch the key we are about to change.
            pipe.watch("shellpath")

            # The pipeline executes commands directly (instead of
            # buffering them) from immediately after the `watch()`
            # call until we begin the transaction.
            current_path = pipe.get("shellpath")
            new_path = current_path + ":/usr/mycmds/"

            # Start the transaction, which will enable buffering
            # again for the remaining commands.
            pipe.multi()

            pipe.set("shellpath", new_path)

            pipe.execute()

            # The transaction succeeded, so break out of the loop.
            break
        except redis.WatchError:
            # The transaction failed, so continue with the next attempt.
            continue

get_path_result = r.get("shellpath")
print(get_path_result)  # >>> '/usr/syscmds/:/usr/mycmds/'
```

Because this is a common pattern, the library includes a convenience
method called `transaction()` that handles the code to watch keys,
execute the transaction, and retry if necessary. Pass
`transaction()` a function that implements your main transaction code,
and also pass the keys you want to watch. The example below implements
the same basic transaction as the previous example but this time
using `transaction()`. Note that `transaction()` can't add the `multi()`
call automatically, so you must still place this correctly in your
transaction function.

<!--
{{< clients-example pipe_trans_tutorial watch_conv_method Python >}}
{{< /clients-example >}}
*-->
```python
r.set("shellpath", "/usr/syscmds/")


def watched_sequence(pipe):
    current_path = pipe.get("shellpath")
    new_path = current_path + ":/usr/mycmds/"

    pipe.multi()

    pipe.set("shellpath", new_path)


trans_result = r.transaction(watched_sequence, "shellpath")
print(trans_result)  # True

get_path_result = r.get("shellpath")
print(get_path_result)  # >>> '/usr/syscmds/:/usr/mycmds/'
```
