---
aliases: /develop/connect/clients/client-side-caching
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
description: Server-assisted, client-side caching in Redis
linkTitle: Client-side caching
title: Client-side caching introduction
weight: 30
---

*Client-side caching* reduces network traffic between
a Redis client and the server, which generally improves performance.

By default, an [application server](https://en.wikipedia.org/wiki/Application_server)
(which sits between the user app and the database) contacts the
Redis database server through the client library for every read request.
The diagram below shows the flow of communication from the user app,
through the application server to the database and back again:

{{< image filename="images/csc/CSCNoCache.drawio.svg" >}}

When you use client-side caching, the client library
maintains a local cache of data items as it retrieves them
from the database. When the same items are needed again, the client
can satisfy the read requests from the cache instead of the database:

{{< image filename="images/csc/CSCWithCache.drawio.svg" >}}

Accessing the cache is much faster than communicating with the database over the
network and it reduces network traffic. Client-side caching reduces
the load on the database server, so you may be able to run it using less hardware
resources.

As with other forms of [caching](https://en.wikipedia.org/wiki/Cache_(computing)),
client-side caching works well in the very common use case where a small subset of the data
is accessed much more frequently than the rest of the data (according
to the [Pareto principle](https://en.wikipedia.org/wiki/Pareto_principle)).

## Updating the cache when the data changes {#tracking}

All caching systems must implement a scheme to update data in the cache
when the corresponding data changes in the main database. Redis uses an
approach called *tracking*.

When client-side caching is enabled, the Redis server remembers or *tracks* the set of keys
that each client connection has previously read. This includes cases where the client
reads data directly, as with the [`GET`]({{< relref "/commands/get" >}})
command, and also where the server calculates values from the stored data,
as with [`STRLEN`]({{< relref "/commands/strlen" >}}). When any client
writes new data to a tracked key, the server sends an invalidation message
to all clients that have accessed that key previously. This message warns
the clients that their cached copies of the data are no longer valid and the clients
will evict the stale data in response. Next time a client reads from
the same key, it will access the database directly and refresh its cache
with the updated data.

{{< note >}}If any connection from a client gets disconnected (including
one from a connection pool), then the client will flush all keys from the
client-side cache. Caching then resumes for subsequent reads from the
connections that are still active.
{{< /note >}}

The sequence diagram below shows how two clients might interact as they
access and update the same key:

{{< image filename="images/csc/CSCSeqDiagram.drawio.svg" >}}

## Which client libraries support client-side caching?

The following client libraries support CSC from the stated version onwards:

| Client | Version |
| :-- | :-- |
| [`redis-py`]({{< relref "/develop/clients/redis-py/connect#connect-using-client-side-caching" >}}) | v5.1.0 |
| [`Jedis`]({{< relref "/develop/clients/jedis/connect#connect-using-client-side-caching" >}}) | v5.2.0 |
| [`node-redis`]({{< relref "/develop/clients/nodejs/connect#connect-using-client-side-caching" >}}) | v5.1.0 |

## Which commands can cache data?

All read-only commands (with the `@read`
[ACL category]({{< relref "/operate/oss_and_stack/management/security/acl" >}}))
will use cached data, except for the following:

-   Any commands for the
    [probabilistic]({{< relref "/develop/data-types/probabilistic" >}}) and
    [time series]({{< relref "/develop/data-types/timeseries" >}}) data types.
    These types are designed to be updated frequently, which means that caching
    has little or no benefit.
-   Non-deterministic commands such as [`HRANDFIELD`]({{< relref "/commands/hrandfield" >}}),
    [`HSCAN`]({{< relref "/commands/hscan" >}}),
    and [`ZRANDMEMBER`]({{< relref "/commands/zrandmember" >}}). By design, these commands
    give different results each time they are called.
-   Redis Query Engine commands (with the `FT.*` prefix), such as
    [`FT.SEARCH`]({{< relref "commands/ft.search" >}}).

You can use the [`MONITOR`]({{< relref "/commands/monitor" >}}) command to
check the server's behavior when you are using client-side caching. Because `MONITOR` only
reports activity from the server, you should find the first cacheable
access to a key causes a response from the server. However, subsequent
accesses are satisfied by the cache, and so `MONITOR` should report no
server activity if client-side caching is working correctly.

## What data gets cached for a command?

Broadly speaking, the data from the specific response to a command invocation
gets cached after it is used for the first time. Subsets of that data
or values calculated from it are retrieved from the server as usual and
then cached separately. For example:

-   The whole string retrieved by [`GET`]({{< relref "/commands/get" >}})
    is added to the cache. Parts of the same string retrieved by
    [`SUBSTR`]({{< relref "/commands/substr" >}}) are calculated on the
    server the first time and then cached separately from the original
    string.
-   Using [`GETBIT`]({{< relref "/commands/getbit" >}}) or
    [`BITFIELD`]({{< relref "/commands/bitfield" >}}) on a string
    caches the returned values separately from the original string.
-   For composite data types accessed by keys
    ([hash]({{< relref "/develop/data-types/hashes" >}}),
    [JSON]({{< relref "/develop/data-types/json" >}}),
    [set]({{< relref "/develop/data-types/sets" >}}), and
    [sorted set]({{< relref "/develop/data-types/sorted-sets" >}})),
    the whole object is cached separately from the individual fields.
    So the results of `JSON.GET mykey $` and `JSON.GET mykey $.myfield` create
    separate entries in the cache.
-   Ranges from [lists]({{< relref "/develop/data-types/lists" >}}),
    [streams]({{< relref "/develop/data-types/streams" >}}),
    and [sorted sets]({{< relref "/develop/data-types/sorted-sets" >}})
    are cached separately from the object they form a part of. Likewise,
    subsets returned by [`SINTER`]({{< relref "/commands/sinter" >}}) and
    [`SDIFF`]({{< relref "/commands/sdiff" >}}) create separate cache entries.
-   For multi-key read commands such as [`MGET`]({{< relref "/commands/mget" >}}),
    the ordering of the keys is significant. For example `MGET name:1 name:2` is
    cached separately from `MGET name:2 name:1` because the server returns the
    values in the order you specify.
-   Boolean or numeric values calculated from data types (for example 
    [`SISMEMBER`]({{< relref "/commands/sismember" >}})) and
    [`LLEN`]({{< relref "/commands/llen" >}}) are cached separately from the
    object they refer to.

## Usage recommendations

Like any caching system, client-side caching has some limitations:

-   The cache has only a limited amount of memory available. When the limit
    is reached, the client must *evict* potentially useful items from the
    cache to make room for new ones.
-   Cache misses, tracking, and invalidation messages always add a slight
    performance penalty.

Below are some guidelines to help you use client-side caching efficiently, within these
limitations:

-   **Use a separate connection for data that is not cache-friendly**:
    Caching gives the most benefit
    for keys that are read frequently and updated infrequently. However, you
    may also have data, such as counters and scoreboards, that receives frequent
    updates. In cases like this, the performance overhead of the invalidation
    messages can be greater than the savings made by caching. Avoid this problem
    by using a separate connection *without* client-side caching for any data that is
    not cache-friendly.
-   **Estimate how many items you can cache**: The client libraries let you
    specify the maximum number of items you want to hold in the cache. You
    can calculate an estimate for this number by dividing the 
    maximum desired size of the
    cache in memory by the average size of the items you want to store
    (use the [`MEMORY USAGE`]({{< relref "/commands/memory-usage" >}})
    command to get the memory footprint of a key). For example, if you had
    10MB (or 10485760 bytes) available for the cache, and the average
    size of an item was 80 bytes, you could fit approximately
    10485760 / 80 = 131072 items in the cache. Monitor memory usage
    on your server with a realistic test load to adjust your estimate
    up or down.

    ## Reference

    The Redis server implements extra features for client-side caching that are not used by
    the main Redis clients, but may be useful for custom clients and other
    advanced applications. See
    [Client-side caching reference]({{< relref "/develop/reference/client-side-caching" >}})
    for a full technical guide to all the options available for client-side caching.
