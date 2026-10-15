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
description: Change an index's field types, prefixes, and options, and see what each query finds, with every redis-cli command and reply.
linkTitle: Interactive demo
title: Indexing interactive demo
weight: 4
---

Redis Search only finds data that's in an index. You create an index with `FT.CREATE`, which says which keys to include and how to treat each of their fields, and Redis keeps it up to date as the data changes. How you define the index decides what queries can find.

This demo starts with the data itself, the restaurants of a food delivery app, then creates an index on it and lets you change it: the field types, the keys it covers, how it handles missing and invalid values, and whether the restaurants are hashes or JSON documents. For each change, it shows the commands, the stored data, and which restaurants the query finds.

The demo runs in your browser and doesn't connect to Redis. Its commands and replies were recorded from Redis, each starting from an empty database, and they work as shown in `redis-cli`.

{{< search-index-demo >}}

## What the demo shows

1. **The data.** Each restaurant is a hash: a key whose name starts with `restaurant:`, holding named fields. Every value in a hash is a string, and Redis finds a hash by its key, not by its contents, until you index it.
2. **Field types.** `TEXT` fields match words, including other forms of each word, such as plurals. `TAG` fields match whole values. `NUMERIC` fields match ranges. A query that doesn't fit the field's type finds nothing, and with `DIALECT 2` it returns an error instead. See [Field and type options](/content/develop/ai/search-and-query/indexing/field-and-type-options.md).
3. **Which keys.** `PREFIX` decides which keys an index covers, and `FILTER` narrows them down by value. Redis indexes each later write as it happens. See [`FT.CREATE`](/content/commands/ft.create.md).
4. **Missing and bad values.** A value that doesn't fit its field's type keeps Redis from indexing the whole hash, and [`FT.INFO`](/content/commands/ft.info.md) counts the failure. `INDEXMISSING` and `INDEXEMPTY` let you query for missing and empty values. See [Index missing or empty values](/content/develop/ai/search-and-query/indexing/_index.md#index-missing-or-empty-values).
5. **Hash or JSON.** An index on JSON documents names JSON paths and gives each one a name with `AS`. Queries are the same as for hashes, but a JSON index returns whole documents as JSON, and Redis 8 doesn't support `HIGHLIGHT` on it. See [Indexing](/content/develop/ai/search-and-query/indexing/_index.md).
