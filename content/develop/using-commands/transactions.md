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
- aliases: /develop/interact/transactions
description: How transactions work in Redis
linkTitle: Transactions
title: Transactions
weight: 30
---

Redis Transactions allow the execution of a group of commands
in a single step, they are centered around the commands 
[`MULTI`]({{< relref "/commands/multi" >}}), [`EXEC`]({{< relref "/commands/exec" >}}), [`DISCARD`]({{< relref "/commands/discard" >}}) and [`WATCH`]({{< relref "/commands/watch" >}}).
Redis Transactions make two important guarantees:

* All the commands in a transaction are serialized and executed
sequentially. A request sent by another client will never be
served **in the middle** of the execution of a Redis Transaction.
This guarantees that the commands are executed as a single
isolated operation.

* The [`EXEC`]({{< relref "/commands/exec" >}}) command
triggers the execution of all the commands in the transaction, so
if a client loses the connection to the server in the context of a
transaction before calling the [`EXEC`]({{< relref "/commands/exec" >}}) command none of the operations
are performed, instead if the [`EXEC`]({{< relref "/commands/exec" >}}) command is called, all the
operations are performed. When using the
[append-only file]({{< relref "/operate/oss_and_stack/management/persistence#append-only-file" >}}) Redis makes sure
to use a single write(2) syscall to write the transaction on disk.
However if the Redis server crashes or is killed by the system administrator
in some hard way it is possible that only a partial number of operations
are registered. Redis will detect this condition at restart, and will exit with an error.
Using the `redis-check-aof` tool it is possible to fix the
append only file that will remove the partial transaction so that the
server can start again.

Starting with version 2.2, Redis allows for an extra guarantee to the
above two, in the form of optimistic locking in a way very similar to a
check-and-set (CAS) operation.
This is documented [later](#cas) on this page.

## Usage

A Redis Transaction is entered using the [`MULTI`]({{< relref "/commands/multi" >}}) command. The command
always replies with `OK`. At this point the user can issue multiple
commands. Instead of executing these commands, Redis will queue
them. All the commands are executed once [`EXEC`]({{< relref "/commands/exec" >}}) is called.

Calling [`DISCARD`]({{< relref "/commands/discard" >}}) instead will flush the transaction queue and will exit
the transaction.

The following example increments keys `foo` and `bar` atomically.

```
> MULTI
OK
> INCR foo
QUEUED
> INCR bar
QUEUED
> EXEC
1) (integer) 1
2) (integer) 1
```

As is clear from the session above, [`EXEC`]({{< relref "/commands/exec" >}}) returns an
array of replies, where every element is the reply of a single command
in the transaction, in the same order the commands were issued.

When a Redis connection is in the context of a [`MULTI`]({{< relref "/commands/multi" >}}) request,
all commands will reply with the string `QUEUED` (sent as a Status Reply
from the point of view of the Redis protocol). A queued command is
simply scheduled for execution when [`EXEC`]({{< relref "/commands/exec" >}}) is called.

## Errors inside a transaction

During a transaction it is possible to encounter two kind of command errors:

* A command may fail to be queued, so there may be an error before [`EXEC`]({{< relref "/commands/exec" >}}) is called.
For instance the command may be syntactically wrong (wrong number of arguments,
wrong command name, ...), or there may be some critical condition like an out of
memory condition (if the server is configured to have a memory limit using the `maxmemory` directive).
* A command may fail *after* [`EXEC`]({{< relref "/commands/exec" >}}) is called, for instance since we performed
an operation against a key with the wrong value (like calling a list operation against a string value).

Starting with Redis 2.6.5, the server will detect an error during the accumulation of commands.
It will then refuse to execute the transaction returning an error during [`EXEC`]({{< relref "/commands/exec" >}}), discarding the transaction.

> **Note for Redis < 2.6.5:** Prior to Redis 2.6.5 clients needed to detect errors occurring prior to [`EXEC`]({{< relref "/commands/exec" >}}) by checking
the return value of the queued command: if the command replies with QUEUED it was
queued correctly, otherwise Redis returns an error.
If there is an error while queueing a command, most clients
will abort and discard the transaction. Otherwise, if the client elected to proceed with the transaction
the [`EXEC`]({{< relref "/commands/exec" >}}) command would execute all commands queued successfully regardless of previous errors.

Errors happening *after* [`EXEC`]({{< relref "/commands/exec" >}}) instead are not handled in a special way:
all the other commands will be executed even if some command fails during the transaction.

This is more clear on the protocol level. In the following example one
command will fail when executed even if the syntax is right:

```
Trying 127.0.0.1...
Connected to localhost.
Escape character is '^]'.
MULTI
+OK
SET a abc
+QUEUED
LPOP a
+QUEUED
EXEC
*2
+OK
-WRONGTYPE Operation against a key holding the wrong kind of value
```

[`EXEC`]({{< relref "/commands/exec" >}}) returned two-element [bulk string reply]({{< relref "/develop/reference/protocol-spec#bulk-string-reply" >}}) where one is an `OK` code and
the other an error reply. It's up to the client library to find a
sensible way to provide the error to the user.

It's important to note that
**even when a command fails, all the other commands in the queue are processed** – Redis will _not_ stop the
processing of commands.

Another example, again using the wire protocol with `telnet`, shows how
syntax errors are reported ASAP instead:

```
MULTI
+OK
INCR a b c
-ERR wrong number of arguments for 'incr' command
```

This time due to the syntax error the bad [`INCR`]({{< relref "/commands/incr" >}}) command is not queued
at all.

## What about rollbacks?

Redis does not support rollbacks of transactions since supporting rollbacks
would have a significant impact on the simplicity and performance of Redis.

## Discarding the command queue

[`DISCARD`]({{< relref "/commands/discard" >}}) can be used in order to abort a transaction. In this case, no
commands are executed and the state of the connection is restored to
normal.

```
> SET foo 1
OK
> MULTI
OK
> INCR foo
QUEUED
> DISCARD
OK
> GET foo
"1"
```
<a name="cas"></a>

## Optimistic locking using check-and-set

[`WATCH`]({{< relref "/commands/watch" >}}) is used to provide a check-and-set (CAS) behavior to Redis
transactions.

[`WATCH`]({{< relref "/commands/watch" >}})ed keys are monitored in order to detect changes against them. If
at least one watched key is modified before the [`EXEC`]({{< relref "/commands/exec" >}}) command, the
whole transaction aborts, and [`EXEC`]({{< relref "/commands/exec" >}}) returns a [Null reply]({{< relref "/develop/reference/protocol-spec#nil-reply" >}}) to notify that
the transaction failed.

For example, imagine we have the need to atomically increment the value
of a key by 1 (let's suppose Redis doesn't have [`INCR`]({{< relref "/commands/incr" >}})).

The first try may be the following:

```
val = GET mykey
val = val + 1
SET mykey $val
```

This will work reliably only if we have a single client performing the
operation in a given time. If multiple clients try to increment the key
at about the same time there will be a race condition. For instance,
client A and B will read the old value, for instance, 10. The value will
be incremented to 11 by both the clients, and finally [`SET`]({{< relref "/commands/set" >}}) as the value
of the key. So the final value will be 11 instead of 12.

Thanks to [`WATCH`]({{< relref "/commands/watch" >}}) we are able to model the problem very well:

```
WATCH mykey
val = GET mykey
val = val + 1
MULTI
SET mykey $val
EXEC
```

Using the above code, if there are race conditions and another client
modifies the result of `val` in the time between our call to [`WATCH`]({{< relref "/commands/watch" >}}) and
our call to [`EXEC`]({{< relref "/commands/exec" >}}), the transaction will fail.

We just have to repeat the operation hoping this time we'll not get a
new race. This form of locking is called _optimistic locking_.
In many use cases, multiple clients will be accessing different keys,
so collisions are unlikely – usually there's no need to repeat the operation.

## WATCH explained

So what is [`WATCH`]({{< relref "/commands/watch" >}}) really about? It is a command that will
make the [`EXEC`]({{< relref "/commands/exec" >}}) conditional: we are asking Redis to perform
the transaction only if none of the [`WATCH`]({{< relref "/commands/watch" >}})ed keys were modified. This includes
modifications made by the client, like write commands, and by Redis itself,
like expiration or eviction. If keys were modified between when they were
[`WATCH`]({{< relref "/commands/watch" >}})ed and when the [`EXEC`]({{< relref "/commands/exec" >}}) was received, the entire transaction will be aborted
instead.

**NOTE**
* In Redis versions before 6.0.9, an expired key would not cause a transaction
to be aborted. [More on this](https://github.com/redis/redis/pull/7920)
* Commands within a transaction won't trigger the [`WATCH`]({{< relref "/commands/watch" >}}) condition since they
are only queued until the [`EXEC`]({{< relref "/commands/exec" >}}) is sent.

[`WATCH`]({{< relref "/commands/watch" >}}) can be called multiple times. Simply all the [`WATCH`]({{< relref "/commands/watch" >}}) calls will
have the effects to watch for changes starting from the call, up to
the moment [`EXEC`]({{< relref "/commands/exec" >}}) is called. You can also send any number of keys to a
single [`WATCH`]({{< relref "/commands/watch" >}}) call.

When [`EXEC`]({{< relref "/commands/exec" >}}) is called, all keys are [`UNWATCH`]({{< relref "/commands/unwatch" >}})ed, regardless of whether
the transaction was aborted or not.  Also when a client connection is
closed, everything gets [`UNWATCH`]({{< relref "/commands/unwatch" >}})ed.

It is also possible to use the [`UNWATCH`]({{< relref "/commands/unwatch" >}}) command (without arguments)
in order to flush all the watched keys. Sometimes this is useful as we
optimistically lock a few keys, since possibly we need to perform a
transaction to alter those keys, but after reading the current content
of the keys we don't want to proceed.  When this happens we just call
[`UNWATCH`]({{< relref "/commands/unwatch" >}}) so that the connection can already be used freely for new
transactions.

### Using WATCH to implement ZPOP

A good example to illustrate how [`WATCH`]({{< relref "/commands/watch" >}}) can be used to create new
atomic operations otherwise not supported by Redis is to implement ZPOP
([`ZPOPMIN`]({{< relref "/commands/zpopmin" >}}), [`ZPOPMAX`]({{< relref "/commands/zpopmax" >}}) and their blocking variants have only been added
in version 5.0), that is a command that pops the element with the lower
score from a sorted set in an atomic way. This is the simplest
implementation:

```
WATCH zset
element = ZRANGE zset 0 0
MULTI
ZREM zset element
EXEC
```

If [`EXEC`]({{< relref "/commands/exec" >}}) fails (i.e. returns a [Null reply]({{< relref "/develop/reference/protocol-spec#nil-reply" >}})) we just repeat the operation.

## Redis scripting and transactions

Something else to consider for transaction like operations in redis are
[redis scripts]({{< relref "/commands/eval" >}}) which are transactional. Everything
you can do with a Redis Transaction, you can also do with a script, and
usually the script will be both simpler and faster.
