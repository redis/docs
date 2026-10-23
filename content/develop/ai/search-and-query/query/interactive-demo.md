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
description: Run full-text, filter, aggregation, and location queries on a food delivery app's restaurants and orders, and see each redis-cli command and reply.
linkTitle: Interactive demo
title: Query interactive demo
weight: 11
---

Redis Search lets you query data through an index you create. This demo uses restaurant and order data from a food delivery app, stored as hashes. It starts by showing the data and a possible index. Next, four kinds of queries are demonstrated: full-text search, filter and sort, aggregation, and location. For each query, it shows the command, the matching data, and the exact reply.

The demo runs in your browser and doesn't connect to Redis. Its commands and replies were recorded from Redis, and each command works as shown once you load the data and indexes into your own database. See [Try it yourself](#try-it-yourself). The restaurants and orders are the same sample data as the [Context Retriever interactive demo](/content/develop/ai/context-engine/context-retriever/interactive-demo.md).

{{< search-demo >}}

## What the demo shows

1. **The data.** Each restaurant is a hash. An index, created with [`FT.CREATE`](/content/commands/ft.create.md), tells Redis Search which fields to search and how. See [Indexing](/content/develop/ai/search-and-query/indexing/_index.md).
2. **Full-text search.** [`FT.SEARCH`](/content/commands/ft.search.md) finds words in `TEXT` fields, including other forms of each word, such as plurals. It also handles exact phrases, prefixes, fuzzy matches, and the `|`, `-`, and `@field:` operators. `HIGHLIGHT` marks the words that matched. See [Full-text search](/content/develop/ai/search-and-query/query/full-text.md).
3. **Filter and sort.** `TAG` and `NUMERIC` fields take exact conditions, and conditions side by side must all match. `SORTBY` orders the matches. See [Exact match queries](/content/develop/ai/search-and-query/query/exact-match.md) and [Range queries](/content/develop/ai/search-and-query/query/range.md).
4. **Aggregate.** [`FT.AGGREGATE`](/content/commands/ft.aggregate.md) groups the matching orders with `GROUPBY` and reduces each group with `REDUCE`, here with `COUNT`, `SUM`, and `AVG`. See [Aggregation queries](/content/develop/ai/search-and-query/query/aggregation.md).
5. **Location.** A `GEO` field holds a point, and a radius query finds the points within a given distance of a spot. A `GEOSHAPE` field holds a shape, such as a delivery zone, and `CONTAINS` finds the shapes that contain a point. See [Geospatial queries](/content/develop/ai/search-and-query/query/geo-spatial.md).

## Try it yourself

You can run the demo's queries against your own Redis database. First, load the sample data and the three indexes with the setup file. Then copy a query from the demo with its **Copy** button, and run it.

You need Redis Open Source 8.0 or later, or Redis Stack 7.2 or later. Use an empty database, such as a free [Redis Cloud](/content/operate/rc/rc-quickstart.md) database. The setup adds 19 hashes, with keys that start with `restaurant:` and `order:`, and three indexes.

{{< static-download "Download the setup file" "code/search-demo/setup.redis" >}}, or copy its 31 commands:

```text
{{% embed-code "search-demo/setup.redis" %}}
```

### Redis Insight

1. Connect to your database in [Redis Insight](/content/develop/tools/insight/_index.md), and open **Workbench**.
2. Paste the setup commands into the editor, and run them. To load the file instead, go to **Browser**, select **Bulk actions** > **Upload Data**, and upload `setup.redis`.
3. Copy a query from the demo, paste it into Workbench, and run it. Workbench returns the same results as the demo, though it can lay them out as a table rather than as `redis-cli` prints them.

### redis-cli

1. Load the setup file:

    ```bash
    redis-cli -h <host> -p <port> < setup.redis
    ```

    If your database needs a username and password, add `--user <username> --pass <password>`.

2. Copy a query from the demo, and run it in `redis-cli`. The reply is the same as the demo's **The output**.

### Clean up

To remove the sample data and the indexes, run these commands:

```text
FT.DROPINDEX idx:places
FT.DROPINDEX idx:restaurants DD
FT.DROPINDEX idx:orders DD
```

`DD` deletes an index's hashes along with the index. `idx:places` covers the same restaurant hashes as `idx:restaurants`, so drop it first, without `DD`.
