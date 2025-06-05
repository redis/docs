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
description: Understand how `NRedisStack` uses conditional execution
linkTitle: Conditional execution
title: Conditional execution
weight: 60
---

Most Redis client libraries use transactions with the
[`WATCH`]({{< relref "/commands/watch" >}}) command as the main way to prevent
two clients writing to the same key at once (see [Transactions]({{< relref "/develop/interact/transactions" >}}) for more information). Unfortunately, this approach is
difficult to use explicitly in `NRedisStack`. Its
[multiplexing]({{< relref "/develop/clients/pools-and-muxing" >}}) system
is highly efficient and convenient but can also cause bad interactions
when different connections use watched transactions at the same time.

Instead, `NRedisStack` relies more heavily on conditional execution. This comes
in two basic forms, `When` conditions and transaction conditions, both of which
are explained in the sections below.

## `When` conditions

Several commands have variants that only execute if the key they change
already exists (or alternatively, if it doesn't already exist). For
example, the [`SET`]({{< relref "/commands/set" >}}) command has the
variants [`SETEX`]({{< relref "/commands/setex" >}}) (set when the key exists),
and [`SETNX`]({{< relref "/commands/setnx" >}}) (set when the key doesn't exist).

Instead of providing the different variants of these commands, `NRedisStack`
lets you add a `When` condition to the basic command to access its variants.
The following example demonstrates this for the
[`HashSet()`]({{< relref "/commands/hset" >}}) command.

<!-- < clients-example pipe_trans_tutorial when_condition "C#" >}}
< /clients-example >}} -->

```csharp
bool resp7 = db.HashSet("Details", "SerialNumber", "12345");
Console.WriteLine(resp7); // >>> true

db.HashSet("Details", "SerialNumber", "12345A", When.NotExists);
string resp8 = db.HashGet("Details", "SerialNumber");
Console.WriteLine(resp8); // >>> 12345

db.HashSet("Details", "SerialNumber", "12345A");
string resp9 = db.HashGet("Details", "SerialNumber");
Console.WriteLine(resp9); // >>> 12345A
```

The available conditions are `When.Exists`, `When.NotExists`, and the default
`When.Always`.

## Transaction conditions

`NRedisStack` also supports a more extensive set of conditions that you
can add to transactions. They are implemented internally using
[`WATCH`]({{< relref "/commands/watch" >}}) commands in a way that is
guaranteed to be safe, without interactions between different clients.
Although conditions don't provide exactly the same behavior as
explicit `WATCH` commands, they are convenient to use and execute
efficiently.

The example below shows how to use the `AddCondition()` method on
a transaction to let it run only if a specified hash key does not
already exist. See
[Pipelines and transactions]({{< relref "/develop/clients/dotnet/transpipe" >}})
for more information about transactions.

<!--< clients-example pipe_trans_tutorial trans_watch "C#" >}}
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

The table below describes the full set of conditions you can add to
a transaction. Note that you can add more than one condition to the
same transaction if necessary.

| Condition | Description |
| :-- | :-- |
| `HashEqual` | Enforces that the given hash-field must have the specified value. |
| `HashExists` | Enforces that the given hash-field must exist. |
| `HashNotEqual` | Enforces that the given hash-field must not have the specified value. |
| `HashNotExists` | Enforces that the given hash-field must not exist. |
| `KeyExists` | Enforces that the given key must exist. |
| `KeyNotExists` | Enforces that the given key must not exist. |
| `ListIndexEqual` | Enforces that the given list index must have the specified value. |
| `ListIndexExists` | Enforces that the given list index must exist. |
| `ListIndexNotEqual` | Enforces that the given list index must not have the specified value. |
| `ListIndexNotExists` | Enforces that the given list index must not exist. |
| `StringEqual` | Enforces that the given key must have the specified value. |
| `StringNotEqual` | Enforces that the given key must not have the specified value. |
| `HashLengthEqual` | Enforces that the given hash length is a certain value. |
| `HashLengthLessThan` | Enforces that the given hash length is less than a certain value. |
| `HashLengthGreaterThan` | Enforces that the given hash length is greater than a certain value. |
| `StringLengthEqual` | Enforces that the given string length is a certain value. |
| `StringLengthLessThan` | Enforces that the given string length is less than a certain value. |
| `StringLengthGreaterThan` | Enforces that the given string length is greater than a certain value. |
| `ListLengthEqual` | Enforces that the given list length is a certain value. |
| `ListLengthLessThan` | Enforces that the given list length is less than a certain value. |
| `ListLengthGreaterThan` | Enforces that the given list length is greater than a certain value. |
| `SetLengthEqual` | Enforces that the given set cardinality is a certain value. |
| `SetLengthLessThan` | Enforces that the given set cardinality is less than a certain value. |
| `SetLengthGreaterThan` | Enforces that the given set cardinality is greater than a certain value. |
| `SetContains` | Enforces that the given set contains a certain member. |
| `SetNotContains` | Enforces that the given set does not contain a certain member. |
| `SortedSetLengthEqual` | Enforces that the given sorted set cardinality is a certain value. |
| `SortedSetLengthEqual` | Enforces that the given sorted set contains a certain number of members with scores in the given range. |
| `SortedSetLengthLessThan` | Enforces that the given sorted set cardinality is less than a certain value. |
| `SortedSetLengthLessThan` | Enforces that the given sorted set contains less than a certain number of members with scores in the given range. |
| `SortedSetLengthGreaterThan` | Enforces that the given sorted set cardinality is greater than a certain value. |
| `SortedSetLengthGreaterThan` | Enforces that the given sorted set contains more than a certain number of members with scores in the given range. |
| `SortedSetContains` | Enforces that the given sorted set contains a certain member. |
| `SortedSetNotContains` | Enforces that the given sorted set does not contain a certain member. |
| `SortedSetEqual` | Enforces that the given sorted set member must have the specified score. |
| `SortedSetNotEqual` | Enforces that the given sorted set member must not have the specified score. |
| `SortedSetScoreExists` | Enforces that the given sorted set must have the given score. |
| `SortedSetScoreNotExists` | Enforces that the given sorted set must not have the given score. |
| `SortedSetScoreExists` | Enforces that the given sorted set must have the specified count of the given score. |
| `SortedSetScoreNotExists` | Enforces that the given sorted set must not have the specified count of the given score. |
| `StreamLengthEqual` | Enforces that the given stream length is a certain value. |
| `StreamLengthLessThan` | Enforces that the given stream length is less than a certain value. |
| `StreamLengthGreaterThan` | Enforces that the given stream length is greater than a certain value. |
