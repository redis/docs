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
description: How Redis Search commands behave inside MULTI/EXEC transactions and Lua scripts
linkTitle: Search in transactions
title: Search commands in MULTI/EXEC transactions and Lua scripts
weight: 36
---

Redis Search commands ([`FT.SEARCH`]({{< relref "/commands/ft.search" >}}),
[`FT.AGGREGATE`]({{< relref "/commands/ft.aggregate" >}}),
[`FT.HYBRID`]({{< relref "/commands/ft.hybrid" >}}),
[`FT.PROFILE`]({{< relref "/commands/ft.profile" >}}), and
[`FT.CURSOR READ`]({{< relref "/commands/ft.cursor-read" >}}))
can be used inside [`MULTI`]({{< relref "/commands/multi" >}})/[`EXEC`]({{< relref "/commands/exec" >}})
transactions and [Lua scripts]({{< relref "/develop/programmability/lua-api" >}}),
but the behavior differs depending on your deployment topology.

## Standalone and single-shard deployments

Redis Search commands inside a `MULTI`/`EXEC` block or a Lua script execute synchronously
on the main Redis thread, regardless of the
[`search-workers`]({{< relref "/develop/ai/search-and-query/administration/configuration#search-workers" >}})
setting.

The worker thread pool is bypassed in this context because Redis transactions
require all commands to complete sequentially without yielding to other clients.
As a result, queries inside transactions do not benefit from the parallelism
provided by `search-workers > 0`, but they execute correctly and return results
as expected.

## Multi-shard deployments (OSS Cluster and Redis Software with multiple shards)

Redis Search commands inside a `MULTI`/`EXEC` block or a Lua script are rejected with
the following error:

```
Cannot perform FT.SEARCH: Cannot block
```

This is because the coordinator must fan out the query to multiple shards and
collect results asynchronously, which is incompatible with the sequential
execution model of transactions. This limitation applies regardless of the
`search-workers` setting.

## Related commands

- [`FT.SEARCH`]({{< relref "/commands/ft.search" >}})
- [`FT.AGGREGATE`]({{< relref "/commands/ft.aggregate" >}})
- [`FT.HYBRID`]({{< relref "/commands/ft.hybrid" >}})
- [`FT.PROFILE`]({{< relref "/commands/ft.profile" >}})
- [`FT.CURSOR READ`]({{< relref "/commands/ft.cursor-read" >}})
- [`MULTI`]({{< relref "/commands/multi" >}})
- [`EXEC`]({{< relref "/commands/exec" >}})
