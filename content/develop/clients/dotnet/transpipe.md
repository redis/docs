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
and then add commands to it using methods that resemble the *asynchronous*
versions of the standard command methods
(for example, `StringSetAsync()` and `StringGetAsync()`). The commands are
buffered in the pipeline and only execute when you call the `Execute()`
method on the pipeline object.

<!-- < clients-example pipe_trans_tutorial basic_pipe "C#" >}}
< /clients-example >}} -->

```csharp
var pipeline = new Pipeline(db);
        
for (int i = 0; i < 5; i++) {
    pipeline.Db.StringSetAsync($"seat:{i}", $"#{i}");
}
pipeline.Execute();

var resp1 = db.StringGet("seat:0");
Console.WriteLine(resp1); // >>> #0

var resp2 = db.StringGet("seat:3");
Console.WriteLine(resp2); // >>> #3

var resp3 = db.StringGet("seat:4");
Console.WriteLine(resp2); // >>> #4
```

## Execute a transaction

A transaction works in a similar way to a pipeline. Create an
instance of the `Transaction` class, call async command methods
on that object, and then call the transaction object's 
`Execute()` method to execute it.

<!-- < clients-example pipe_trans_tutorial basic_trans "C#" >}}
< /clients-example >}}-->

```csharp
var trans = new Transaction(db);

trans.Db.StringIncrementAsync("counter:1", 1);
trans.Db.StringIncrementAsync("counter:2", 2);
trans.Db.StringIncrementAsync("counter:3", 3);

trans.Execute();

var resp4 = db.StringGet("counter:1");
Console.WriteLine(resp4); // >>> 1

var resp5 = db.StringGet("counter:2");
Console.WriteLine(resp5); // >>> 2

var resp6 = db.StringGet("counter:3");
Console.WriteLine(resp6);  // >>> 3
```

## Watch keys for changes

Redis supports *optimistic locking* to avoid inconsistent updates
to different keys. The basic idea is to watch for changes to any
keys that you use in a transaction while you are are processing the
updates. If the watched keys do change, you must restart the updates
with the latest data from the keys. See
[Transactions]({{< relref "/develop/interact/transactions" >}})
for more information about optimistic locking.

The approach to optimistic locking that other clients use
(adding the [`WATCH`]({{< relref "/commands/watch" >}}) command
explicitly to a transaction) doesn't work well with the
[multiplexing]({{< relref "/develop/clients/pools-and-muxing" >}})
system that `NRedisStack` uses.
Instead, `NRedisStack` relies on conditional execution of commands
to get a similar effect.

Use the `AddCondition()` method to abort a transaction if a particular
condition doesn't hold throughout its execution. If the transaction
does abort then the `Execute()` method returns a `false` value,
but otherwise returns `true`.

For example, the `KeyNotExists` condition aborts the transaction
if a specified key exists or is added by another client while the
transaction executes:

<!-- < clients-example pipe_trans_tutorial trans_watch "C#" >}}
< /clients-example >}} -->

```csharp
var watchedTrans = new Transaction(db);

watchedTrans.AddCondition(Condition.KeyNotExists("customer:39182"));

watchedTrans.Db.HashSetAsync(
    "customer:39182",
    new HashEntry[]{
        new HashEntry("name", "David"),
        new HashEntry("age", "27")
    }
);

bool succeeded = watchedTrans.Execute();
Console.WriteLine(succeeded); // >>> true
```

You can also use a `When` condition on certain individual commands to
specify that they only execute when a certain condition holds
(for example, the command does not change an existing key).
See
[Conditional execution]({{< relref "/develop/clients/dotnet/condexec" >}})
for a full description of transaction and command conditions.
