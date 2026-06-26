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
description: A guided, end-to-end tour of search and query in Redis, from data modeling to vector and hybrid search.
linkTitle: Search and query tutorial
stack: true
title: Search and query tutorial
aliases:
- /get-started/search-tutorial/
weight: 5
---

This tutorial is a guided, hands-on tour of [Redis Search]({{< relref "/develop/ai/search-and-query" >}}). If you have never used Redis before, you are in the right place. You will start with a small dataset and, step by step, build up to running the same kinds of searches that power product catalogs, recommendation systems, and AI applications.

By the end, you will be able to:

1. **[Model your data]({{< relref "/develop/get-started/search-tutorial/data-modeling" >}})** &mdash; decide how to store records in Redis so they can be searched, and understand the trade-offs between hashes and JSON documents.
2. **[Create an index]({{< relref "/develop/get-started/search-tutorial/indexing" >}})** &mdash; tell Redis which fields to index and how, so queries are fast.
3. **[Search and filter]({{< relref "/develop/get-started/search-tutorial/search" >}})** &mdash; find and return exactly the records you want with `FT.SEARCH`.
4. **[Aggregate]({{< relref "/develop/get-started/search-tutorial/aggregation" >}})** &mdash; group and summarize your data with `FT.AGGREGATE`.
5. **[Search by meaning]({{< relref "/develop/get-started/search-tutorial/vector-search" >}})** &mdash; run vector and hybrid searches to find records by semantic similarity.

Each page builds on the previous one and ends with a link to the next step, so you can follow the whole tutorial in order.

## The example: a product catalog

Throughout the tutorial you will work with a small **online store catalog**. Each record is a product with a name, brand, category, free-text description, price, customer rating, and other attributes:

```json
{
  "name": "Aurora AcousticPro Headphones",
  "brand": "Aurora",
  "category": "Audio",
  "description": "Over-ear wireless headphones with active noise cancelling ...",
  "price": 199.99,
  "rating": 4.6,
  "review_count": 1284,
  "stock": 42,
  "release_year": 2024,
  "features": ["wireless", "noise-cancelling", "bluetooth", "over-ear"]
}
```

This kind of data is a good fit for search because people want to query it in many different ways: by keyword ("wireless headphones"), by filter (under $100, in the Audio category), by summary (average price per category), and increasingly by meaning ("something for listening to music on a run").

## Prerequisites

You need a running Redis instance that includes Redis Search and the JSON data type. The easiest options are:

- **Redis Cloud** &mdash; create a [free account](https://redis.io/try-free/). A free database comes with all the Redis Open Source features, including Redis Search and JSON.
- **Local install** &mdash; follow the [install guide]({{< relref "/operate/oss_and_stack/install/install-stack/" >}}) to run Redis Open Source on your own machine.

{{% alert title="Note" color="info" %}}
The vector and hybrid search examples in the [last step]({{< relref "/develop/get-started/search-tutorial/vector-search" >}}) use features that require **Redis 8.8 or later**. The earlier steps work on any recent version of Redis with Redis Search.
{{% /alert %}}

## Choose your tool

You can follow along using whichever tool you prefer. Every example in this tutorial is shown for each of them:

- **`redis-cli`** &mdash; the command-line client included with Redis. It is the quickest way to try commands and see raw results. This is the default tab in every code example.
- **[Redis Insight]({{< relref "/develop/tools/insight" >}})** &mdash; a free graphical tool for Redis. Its [Search workspace]({{< relref "/develop/tools/insight/search-workspace" >}}) lets you browse indexes and run full-text, vector, and hybrid queries in a schema-aware editor. If you prefer to see your data and results visually, this is a great choice.
- **A client library** &mdash; for real applications you will use Redis from your programming language of choice. Each example includes tabs for languages such as Python and Node.js.

Throughout the tutorial, look for **"Try it in Redis Insight"** tips that show how to run the same query in the graphical editor.

## Connect

First, connect to your Redis database. The following example connects with `redis-cli` to a server running on `localhost` (`-h 127.0.0.1`) and listening on the default port (`-p 6379`):

{{< clients-example set="search_tutorial" step="connect" description="Foundational: Connect to a Redis server with redis-cli using host and port parameters" difficulty="beginner" >}}
> redis-cli -h 127.0.0.1 -p 6379
{{< /clients-example >}}

<br/>
{{% alert title="Tip" color="warning" %}}
If you are using Redis Cloud, copy the connection details from your database's configuration page. A Cloud connection string has the form `host:port`, for example `redis-16379.c283.us-east-1-4.ec2.cloud.redislabs.com:16379`. You also need the database username and password, which you can pass to your client or supply with the [AUTH command]({{< relref "/commands/auth" >}}) after connecting.
{{% /alert %}}

## Next steps

Ready to begin? Start with [data modeling]({{< relref "/develop/get-started/search-tutorial/data-modeling" >}}) to learn how to store your records so Redis can search them.
