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
description: Iterate through results from `SCAN`, `HSCAN`, etc.
linkTitle: Scan iteration
title: Scan iteration
weight: 60
---

Redis has a small family of related commands that retrieve
keys and, in some cases, their associated values:

-   [`SCAN`]({{< relref "/commands/scan" >}}) retrieves keys
    from the main Redis keyspace.
-   [`HSCAN`]({{< relref "/commands/hscan" >}}) retrieves keys and optionally,
    their values from a
    [hash]({{< relref "/develop/data-types/hashes" >}}) object.
-   [`SSCAN`]({{< relref "/commands/sscan" >}}) retrieves keys from a
    [set]({{< relref "/develop/data-types/sets" >}}) object.
-   [`ZSCAN`]({{< relref "/commands/zscan" >}}) retrieves keys and their score values from a
    [sorted set]({{< relref "/develop/data-types/sorted-sets" >}}) object.

These commands can potentially return large numbers of results, so Redis
provides a paging mechanism to access the results in small, separate batches.
With the basic commands, you must maintain a cursor value in your code
to keep track of the current page. As a convenient alternative, `redis-py`
also lets you access the results using an
[iterator](https://docs.python.org/3/glossary.html#term-iterable).
This handles the paging transparently, so you simply need to process
the items it returns one-by-one in a `for` loop or pass the iterator
object itself in place of a
[sequence](https://docs.python.org/3/glossary.html#term-sequence).

Each of the commands has its own equivalent iterator. The following example shows
how to use a `SCAN` iterator on the Redis keyspace. Note that, as with the `SCAN`
command, the results are not sorted into any particular order, . Also, you
can pass `match`, `count`, and `_type` parameters to `scan_iter()` to constrain
the set of keys it returns (see the [`SCAN`]({{< relref "/commands/scan" >}})
command page for examples). 

```py
import redis

r = redis.Redis(decode_responses=True)

r.set("key:1", "a")
r.set("key:2", "b")
r.set("key:3", "c")
r.set("key:4", "d")
r.set("key:5", "e")

for key in r.scan_iter():
    print(f"Key: {key}, value: {r.get(key)}")
# >>> Key: key:1, value: a
# >>> Key: key:4, value: d
# >>> Key: key:3, value: c
# >>> Key: key:2, value: b
# >>> Key: key:5, value: e
```

The iterators for the other commands are also named with `_iter()` after
the name of the basic command (`hscan_iter()`, `sscan_iter()`, and `zscan_iter()`).
They work in a similar way to `scan_iter()` except that you must pass a
key to identify the object you want to scan. The example below shows how to
iterate through the items in a sorted set using `zscan_iter()`.

```py
r.zadd("battles", mapping={
    "hastings": 1066,
    "agincourt": 1415,
    "trafalgar": 1805,
    "somme": 1916,
})

for item in r.zscan_iter("battles"):
    print(f"Key: {item[0]}, value: {int(item[1])}")
# >>> Key: hastings, value: 1066
# >>> Key: agincourt, value: 1415
# >>> Key: trafalgar, value: 1805
# >>> Key: somme, value: 1916
```

Note that in this case, the item returned by the iterator is a
[tuple](https://docs.python.org/3/tutorial/datastructures.html#tuples-and-sequences)
with two elements for the key and score. By default, `hscan_iter()`
also returns a 2-tuple for the key and value, but you can
pass a value of `True` for the `no_values` parameter to retrieve just
the keys:

```py
r.hset("details", mapping={
    "name": "Mr Benn",
    "address": "52 Festive Road",
    "hobbies": "Cosplay"
})

for key in r.hscan_iter("details", no_values=True):
    print(f"Key: {key}, value: {r.hget("details", key)}")
# >>> Key: name, value: Mr Benn
# >>> Key: address, value: 52 Festive Road
# >>> Key: hobbies, value: Cosplay
```
