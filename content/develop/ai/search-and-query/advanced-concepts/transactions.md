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

Redis Search commands ([`FT.SEARCH`](/content/commands/ft.search.md),
[`FT.AGGREGATE`](/content/commands/ft.aggregate.md),
[`FT.HYBRID`](/content/commands/ft.hybrid.md),
[`FT.PROFILE`](/content/commands/ft.profile.md), and
[`FT.CURSOR READ`](/content/commands/ft.cursor-read.md))
can be used inside [`MULTI`](/content/commands/multi.md)/[`EXEC`](/content/commands/exec.md)
transactions and [Lua scripts](/content/develop/programmability/lua-api.md),
but the behavior differs depending on your deployment topology.

## Standalone and single-shard deployments

Query commands inside a `MULTI`/`EXEC` block or Lua script (including when issued
through a client pipeline that wraps commands in a transaction) execute synchronously
on the main Redis thread, regardless of the
[`search-workers`](/content/develop/ai/search-and-query/administration/configuration.md#search-workers)
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

- [`FT.SEARCH`](/content/commands/ft.search.md)
- [`FT.AGGREGATE`](/content/commands/ft.aggregate.md)
- [`FT.HYBRID`](/content/commands/ft.hybrid.md)
- [`FT.PROFILE`](/content/commands/ft.profile.md)
- [`FT.CURSOR READ`](/content/commands/ft.cursor-read.md)
- [`MULTI`](/content/commands/multi.md)
- [`EXEC`](/content/commands/exec.md)
