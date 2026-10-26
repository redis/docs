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
description: Run full-text, filter, and aggregation queries on a food delivery app's restaurants and orders, and see each redis-cli command and reply.
linkTitle: Interactive demo
title: Query interactive demo
weight: 11
---

Redis Search lets you query data through an index you create. This demo uses restaurant and order data from a food delivery app, stored as hashes. It starts by showing the data and a possible index. Next, three kinds of queries are demonstrated: full-text search, filter and sort, and aggregation. For each query, it shows the command, the matching data, and the exact reply.

The demo runs in your browser and doesn't connect to Redis. Its commands and replies were recorded from Redis, and each command works as shown in `redis-cli` once you create the indexes and add the data. The restaurants and orders are the same sample data as the [Context Retriever interactive demo](/content/develop/ai/context-engine/context-retriever/interactive-demo.md).

{{< search-demo >}}

## What the demo shows

1. **The data.** Each restaurant is a hash. An index, created with [`FT.CREATE`](/content/commands/ft.create.md), tells Redis Search which fields to search and how. See [Indexing](/content/develop/ai/search-and-query/indexing/_index.md).
2. **Full-text search.** [`FT.SEARCH`](/content/commands/ft.search.md) finds words in `TEXT` fields, including other forms of each word, such as plurals. It also handles exact phrases, prefixes, fuzzy matches, and the `|`, `-`, and `@field:` operators. `HIGHLIGHT` marks the words that matched. See [Full-text search](/content/develop/ai/search-and-query/query/full-text.md).
3. **Filter and sort.** `TAG` and `NUMERIC` fields take exact conditions, and conditions side by side must all match. `SORTBY` orders the matches. See [Exact match queries](/content/develop/ai/search-and-query/query/exact-match.md) and [Range queries](/content/develop/ai/search-and-query/query/range.md).
4. **Aggregate.** [`FT.AGGREGATE`](/content/commands/ft.aggregate.md) groups the matching orders with `GROUPBY` and reduces each group with `REDUCE`, here with `COUNT`, `SUM`, and `AVG`. See [Aggregation queries](/content/develop/ai/search-and-query/query/aggregation.md).
