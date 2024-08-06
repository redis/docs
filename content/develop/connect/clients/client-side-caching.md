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
description: 'Server-assisted, client-side caching in Redis'
linkTitle: Client-side caching
title: Client-side caching in Redis
weight: 20
---

*Client-side caching (CSC)* is a technique to allow faster communication
between a Redis client and the server.

By default, an [application server](https://en.wikipedia.org/wiki/Application_server)
(which sits between the user app and the database) contacts the
Redis database server using the client library for every read request.
The diagram below shows the flow of communication from the user app,
through the application server to the database and back again:

{{< image filename="images/CSCNoCache.drawio.svg" >}}

When you use CSC, the client library
maintains its own local cache of data objects as it retrieves them
from the database. When the same objects are needed again, the client
can satisfy the read requests from the cache instead of the database:

{{< image filename="images/CSCWithCache.drawio.svg" >}}

Accessing the cache is much faster than communicating with the database over the
network. Also, this technique reduces the load on the database server, so you may
be able to run it using fewer nodes.

As with other forms of [caching](https://en.wikipedia.org/wiki/Cache_(computing)),
CSC works well in the typical use case where a small subset of the data
gets used much more frequently than the rest of the data (according
to the [Pareto principle](https://en.wikipedia.org/wiki/Pareto_principle)).

## Updating the cache when the data changes

All caching systems must implement a scheme to update data in the cache
when the corresponding data changes in the main database. Redis uses an
approach called *tracking*.

When CSC is enabled, the Redis server remembers or *tracks* the set of keys
that each client has previously read. This includes cases where the client
reads data directly, as with the [`GET`]({{< relref "/commands/get" >}})
command, and also where the server calculates values from the stored data,
as with [`STRLEN`]({{< relref "/commands/strlen" >}}). When any client
writes new data to a tracked key, the server sends an invalidation message
to all clients that have accessed that key previously. This message warns
the clients that their cached copies of the data are no longer valid and the clients
will evict the stale data in response. Next time a client reads from
the same key, it will access the database directly and refresh its cache
with the updated data.

## Which commands can cache data?

All read-only commands (with the `@read`
[ACL category]({{< relref "/operate/oss_and_stack/management/security/acl" >}}))
will use cached data, except for the following:

-   Any commands for
    [probabilistic data types]({{< relref "/develop/data-types/probabilistic" >}}).
    These types are designed to be updated frequently, which means that caching
    them gives little or no benefit.
-   Non-deterministic commands (such as [`HSCAN`({{< relref "/commands/hscan" >}}))
    and [`ZRANDMEMBER`]({{< relref "/commands/zrandmember" >}}). By design, these commands
    give different results each time they are called.
-   Search and query commands (with the `FT.*` prefix), such as
    [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}).

You should also note that multi-key read commands such as
[`MGET`]({{< relref "/commands/mget" >}}) *do* cache data correctly but the
ordering of the keys is significant. For example `MGET name:1 name:2` is
cached separately from `MGET name:2 name:1` because the server retrieves the
values in the order you specify.

You can use the [`MONITOR`]({{< relref "/commands/monitor" >}}) command to
check the server's behavior when you are using CSC. Because `MONITOR` only
reports activity from the server, you should find that the first cacheable
access to a key causes a response from the server. However, subsequent
accesses are satisfied by the cache, and so `MONITOR` should report no
server activity.

## Enabling CSC

Use the [`CLIENT TRACKING`]({{< relref "/commands/client-tracking" >}})
command to enable CSC from [`redis-cli`]({{< relref "/develop/connect/cli" >}}).
You can also enable CSC when you connect to a server from one of the Redis
client libraries.
