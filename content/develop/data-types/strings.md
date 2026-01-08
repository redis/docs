---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- kubernetes
- clients
description: 'Introduction to Redis strings

  '
linkTitle: Strings
title: Redis Strings
weight: 10
---

Redis strings store sequences of bytes, including text, serialized objects, and binary arrays.
As such, strings are the simplest type of value you can associate with
a Redis key.
They're often used for caching, but they support additional functionality that lets you implement counters and perform bitwise operations, too.

Since Redis keys are strings, when we use the string type as a value too,
we are mapping a string to another string. The string data type is useful
for a number of use cases, like caching HTML fragments or pages.

{{< clients-example set="set_tutorial" step="set_get" description="Foundational: Set and retrieve string values using SET and GET (overwrites existing values)" >}}
    > SET bike:1 Deimos
    OK
    > GET bike:1
    "Deimos"
{{< /clients-example >}}

As you can see using the [`SET`]({{< relref "/commands/set" >}}) and the [`GET`]({{< relref "/commands/get" >}}) commands are the way we set
and retrieve a string value. Note that [`SET`]({{< relref "/commands/set" >}}) will replace any existing value
already stored into the key, in the case that the key already exists, even if
the key is associated with a non-string value. So [`SET`]({{< relref "/commands/set" >}}) performs an assignment.

Values can be strings (including binary data) of every kind, for instance you
can store a jpeg image inside a value. A value can't be bigger than 512 MB.

The [`SET`]({{< relref "/commands/set" >}}) command has interesting options, that are provided as additional
arguments. For example, I may ask [`SET`]({{< relref "/commands/set" >}}) to fail if the key already exists,
or the opposite, that it only succeed if the key already exists:

{{< clients-example set="set_tutorial" step="setnx_xx" description="Conditional SET operations: Use NX and XX options to control key existence when you need atomic compare-and-set behavior" difficulty="intermediate" >}}
    > set bike:1 bike nx
    (nil)
    > set bike:1 bike xx
    OK
{{< /clients-example >}}

There are a number of other commands for operating on strings. For example
the [`GETSET`]({{< relref "/commands/getset" >}}) command sets a key to a new value, returning the old value as the
result. You can use this command, for example, if you have a
system that increments a Redis key using [`INCR`]({{< relref "/commands/incr" >}})
every time your web site receives a new visitor. You may want to collect this
information once every hour, without losing a single increment.
You can [`GETSET`]({{< relref "/commands/getset" >}}) the key, assigning it the new value of "0" and reading the
old value back.

The ability to set or retrieve the value of multiple keys in a single
command is also useful for reduced latency. For this reason there are
the [`MSET`]({{< relref "/commands/mset" >}}) and [`MGET`]({{< relref "/commands/mget" >}}) commands:

{{< clients-example set="set_tutorial" step="mset" description="Set and retrieve multiple values using MSET and MGET when you need to reduce round trips to the server" >}}
    > mset bike:1 "Deimos" bike:2 "Ares" bike:3 "Vanth"
    OK
    > mget bike:1 bike:2 bike:3
    1) "Deimos"
    2) "Ares"
    3) "Vanth"
{{< /clients-example >}}

When [`MGET`]({{< relref "/commands/mget" >}}) is used, Redis returns an array of values.

## Strings as counters
Even if strings are the basic values of Redis, there are interesting operations
you can perform with them. For instance, one is atomic increment:

{{< clients-example set="set_tutorial" step="incr" description="Atomic counters: Increment string values using INCR and INCRBY when you need thread-safe operations (initializes to 0 if key doesn't exist)" >}}
    > set total_crashes 0
    OK
    > incr total_crashes
    (integer) 1
    > incrby total_crashes 10
    (integer) 11
{{< /clients-example >}}

The [`INCR`]({{< relref "/commands/incr" >}}) command parses the string value as an integer,
increments it by one, and finally sets the obtained value as the new value.
There are other similar commands like [`INCRBY`]({{< relref "/commands/incrby" >}}),
[`DECR`]({{< relref "/commands/decr" >}}) and [`DECRBY`]({{< relref "/commands/decrby" >}}). Internally it's
always the same command, acting in a slightly different way.

What does it mean that INCR is atomic?
That even multiple clients issuing INCR against
the same key will never enter into a race condition. For instance, it will never
happen that client 1 reads "10", client 2 reads "10" at the same time, both
increment to 11, and set the new value to 11. The final value will always be
12 and the read-increment-set operation is performed while all the other
clients are not executing a command at the same time.


## Limits

By default, a single Redis string can be a maximum of 512 MB.

## Basic commands

### Getting and setting Strings

* [`SET`]({{< relref "/commands/set" >}}) stores a string value.
* [`SETNX`]({{< relref "/commands/setnx" >}}) stores a string value only if the key doesn't already exist. Useful for implementing locks.
* [`GET`]({{< relref "/commands/get" >}}) retrieves a string value.
* [`MGET`]({{< relref "/commands/mget" >}}) retrieves multiple string values in a single operation.

### Managing counters

* [`INCR`]({{< relref "/commands/incr" >}}) atomically increments counters stored at a given key by 1.
* [`INCRBY`]({{< relref "/commands/incrby" >}}) atomically increments (and decrements when passing a negative number) counters stored at a given key.
* Another command exists for floating point counters: [`INCRBYFLOAT`]({{< relref "/commands/incrbyfloat" >}}).

### Bitwise operations

To perform bitwise operations on a string, see the [bitmaps data type]({{< relref "/develop/data-types/bitmaps" >}}) docs.

See the [complete list of string commands]({{< relref "/commands/" >}}?group=string).

## Performance

Most string operations are O(1), which means they're highly efficient.
However, be careful with the [`SUBSTR`]({{< relref "/commands/substr" >}}), [`GETRANGE`]({{< relref "/commands/getrange" >}}), and [`SETRANGE`]({{< relref "/commands/setrange" >}}) commands, which can be O(n).
These random-access string commands may cause performance issues when dealing with large strings.

## Alternatives

If you're storing structured data as a serialized string, you may also want to consider Redis [hashes]({{< relref "/develop/data-types/hashes" >}}) or [JSON]({{< relref "/develop/data-types/json/" >}}).

## Learn more

* [Redis Strings Explained](https://www.youtube.com/watch?v=7CUt4yWeRQE) is a short, comprehensive video explainer on Redis strings.
* [Redis University's RU101](https://university.redis.com/courses/ru101/) covers Redis strings in detail.
