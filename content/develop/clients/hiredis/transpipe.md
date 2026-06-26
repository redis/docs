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
weight: 20
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

There is no command to explicitly start a pipeline with `hiredis`,
but if you issue a command with the `redisAppendCommand()` function,
it will be added to an output buffer without being sent
immediately to the server.

There is also an input buffer that receives replies from
commands. If you call `redisGetReply()` when the input buffer is empty,
it will first send any commands that are queued in the output buffer and
then wait for replies to arrive in the input buffer. It will then return
the first reply only.

If you then make subsequent `redisGetReply()` calls, they will
find the input buffer is not empty, but still has replies
queued from previous commands. In this case, `redisGetReply()`
will just remove and return replies from the input buffer
until it is empty again.

The example below shows how to use `redisAppendCommand()`
and `redisGetReply()` together:

```c
redisAppendCommand(c, "SET fruit:0 Apple");
redisAppendCommand(c, "SET fruit:1 Banana");
redisAppendCommand(c, "SET fruit:2 Cherry");

redisAppendCommand(c, "GET fruit:0");
redisAppendCommand(c, "GET fruit:1");
redisAppendCommand(c, "GET fruit:2");


redisReply *reply;

// Iterate once for each of the six commands in the
// pipeline.
for (int i = 0; i < 6; ++i) {
    redisGetReply(c, (void**) &reply);

    // If an error occurs, the context object will
    // contain an error code and/or an error string.
    if (reply->type == REDIS_REPLY_ERROR) {
        printf("Error: %s", c->errstr);
    } else {
        printf("%s\n", reply->str);
    }

    freeReplyObject(reply);
}
// >>> OK
// >>> OK
// >>> OK
// >>> Apple
// >>> Banana
// >>> Cherry
```

`redisAppendCommand()` has the same call signature as `redisCommand()` except that
it doesn't return a `redisReply`. There is also a `redisAppendCommandArgv()`
function that is analogous to `redisCommandArgv()` (see
[Issue commands]({{< relref "/develop/clients/hiredis/issue-commands" >}})
for more information).

`redisGetReply()` receives the usual
context pointer and a pointer to a `redisReply` pointer (which you
must cast to `void**`). After `redisGetReply()` returns,
the reply pointer will point to the `redisReply` object returned by
the queued command (see
[Handle command replies]({{< relref "/develop/clients/hiredis/handle-replies" >}})
for more information). 

Call `redisGetReply()` once for each command that you added to the pipeline.
You should check for errors after each call and free each reply object
when you have finished processing it, as in the example above.

## Transactions

`hiredis` doesn't provide any special API to handle transactions, but
you can implement them yourself using the [`MULTI`]({{< relref "/commands/multi" >}}),
[`EXEC`]({{< relref "/commands/exec" >}}), and [`WATCH`]({{< relref "/commands/watch" >}})
commands as you would from [`redis-cli`]({{< relref "/develop/tools/cli" >}}).
See [Transactions]({{< relref "develop/using-commands/transactions" >}})
for more information.
