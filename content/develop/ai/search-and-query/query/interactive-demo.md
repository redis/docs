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

The demo runs in your browser and doesn't connect to Redis. Its commands and replies were recorded from Redis, and each command works as shown once you load the data and indexes into your own database. See [Try it yourself](#try-it-yourself). The restaurants and orders are the same sample data as the [Redis Iris interactive demo](/content/develop/ai/context-engine/concepts/interactive-demo.md).

{{< search-demo >}}

## What the demo shows

1. **The data.** Each restaurant is a hash. An index, created with [`FT.CREATE`](/content/commands/ft.create.md), tells Redis Search which fields to search and how. See [Indexing](/content/develop/ai/search-and-query/indexing/_index.md).
2. **Full-text search.** [`FT.SEARCH`](/content/commands/ft.search.md) finds words in `TEXT` fields, including other forms of each word, such as plurals. It also handles exact phrases, prefixes, fuzzy matches, and the `|`, `-`, and `@field:` operators. `HIGHLIGHT` marks the words that matched. See [Full-text search](/content/develop/ai/search-and-query/query/full-text.md).
3. **Filter and sort.** `TAG` and `NUMERIC` fields take exact conditions, and conditions side by side must all match. `SORTBY` orders the matches. See [Exact match queries](/content/develop/ai/search-and-query/query/exact-match.md) and [Range queries](/content/develop/ai/search-and-query/query/range.md).
4. **Aggregate.** [`FT.AGGREGATE`](/content/commands/ft.aggregate.md) groups the matching orders with `GROUPBY` and reduces each group with `REDUCE`, here with `COUNT`, `SUM`, and `AVG`. See [Aggregation queries](/content/develop/ai/search-and-query/query/aggregation.md).
5. **Location.** A `GEO` field holds a point, and a radius query finds the points within a given distance of a spot. A `GEOSHAPE` field holds a shape, such as a delivery zone, and `CONTAINS` finds the shapes that contain a point. See [Geospatial queries](/content/develop/ai/search-and-query/query/geo-spatial.md).

## Try it yourself

You can run the demo's queries against your own Redis database. First, load the sample data and the three indexes with the setup commands. Then copy a query from the demo with its **Copy** button, and run it.

You need Redis Open Source 8.0 or later, or Redis Stack 7.2 or later. Use an empty database, such as a free [Redis Cloud](/content/operate/rc/rc-quickstart.md) database. The setup adds 19 hashes, with keys that start with `restaurant:` and `order:`, and three indexes.

The setup is 31 commands. Copy them from the tab for the tool you use:

{{< multitabs id="search-demo-setup"
    tab1="Redis Insight"
    tab2="redis-cli" >}}

```text
{{% embed-code "search-demo/setup.redis" %}}
```

-tab-sep-

```bash
redis-cli -h <host> -p <port> <<'EOF'
{{% embed-code "search-demo/setup.redis" %}}
EOF
```

{{< /multitabs >}}

### Redis Insight

1. Connect to your database in [Redis Insight](/content/develop/tools/insight/_index.md), and open **Workbench**.
2. Paste the commands from the **Redis Insight** tab into the editor, and run them.
3. Copy a query from the demo, paste it into Workbench, and run it. Workbench returns the same results as the demo, though it can lay them out as a table rather than as `redis-cli` prints them.

### redis-cli

1. Paste the command from the **redis-cli** tab into a terminal, and replace `<host>` and `<port>` with your database's. If your database needs a username and password, add `--user <username> --pass <password>` after the port.
2. Run the command. It loads all 31 setup commands at once.
3. Connect with `redis-cli -h <host> -p <port>`, add `--user <username> --pass <password>` if you used them in step 1, copy a query from the demo, and run it. The reply is the same as the demo's **The output**.

### Clean up

To remove the sample data and the indexes, run these commands:

```text
FT.DROPINDEX idx:places
FT.DROPINDEX idx:restaurants DD
FT.DROPINDEX idx:orders DD
```

`DD` deletes an index's hashes along with the index. `idx:places` covers the same restaurant hashes as `idx:restaurants`, so drop it first, without `DD`.
