---
title: Index and search data in Flex databases
alwaysopen: false
bannerText: Redis Search on Flex is currently in preview. Features and behavior are subject to change.
categories:
- docs
- operate
- rs
description: Store Redis Search indexes on flash in Flex databases on Redis Software.
hideListLinks: true
linkTitle: Index and search
weight: 40
---

Redis Search on Flex stores search indexes on flash in a [Flex database](/content/operate/rs/flex/_index.md), so large indexes don't need to fit in RAM. You use the same [Redis Search](/content/develop/ai/search-and-query/_index.md) commands and client libraries as you do with an in-memory database.

> [!NOTE]
> Redis Search on Flex is in preview and supports a subset of Redis Search features. See [Supported features](#supported-features) and [Limitations](#limitations).

## Requirements

To use Redis Search on Flex, you need:

- Redis Software cluster version 8.2.6 or later, with [flash storage enabled](/content/operate/rs/flex/get-started.md#setup-cluster-flash)

- Redis database version 8.8 or later

- A new Flex database. You can turn on Redis Search on Flex only when you create the database. You can't add it to an existing Flex database or turn it off later.

## Create a database with Redis Search on Flex

To create a Flex database with Redis Search on Flex, send a [create database](/content/operate/rs/references/rest-api/requests/bdbs/_index.md#post-bdbs-v1) REST API request with `bigstore` and `search_on_bigstore` set to `true`:

```sh
POST /v1/bdbs
{
    "name": "<database-name>",
    "memory_size": <memory-limit-in-bytes>,
    "bigstore": true,
    "redis_version": "8.8",
    "search_on_bigstore": true
}
```

After you create the database, create indexes with [`FT.CREATE`](/content/commands/ft.create.md) and query them with [`FT.SEARCH`](/content/commands/ft.search.md).

## Supported features

Redis Search on Flex supports:

- HASH documents, and JSON documents without multi-value fields

- `TEXT`, `TAG`, `NUMERIC`, `GEO`, and `VECTOR` fields

- `HNSW` vector indexes with `FLOAT32` and `FLOAT16` vectors. When you create an `HNSW` vector field, you must set the `M`, `EF_CONSTRUCTION`, `EF_RUNTIME`, and `RERANK` attributes. `RERANK` accepts `TRUE` or `FALSE`.

- Loading fields from the keyspace with the `SORTBY` and `RETURN` options of `FT.SEARCH`

## Limitations

Redis Search on Flex doesn't support some Redis Search commands, field types, and options. If you use one of them, the command returns an error.

### Commands

Redis Search on Flex doesn't support:

- [`FT.ALTER`](/content/commands/ft.alter.md). To change an index schema, drop the index and create it again.

- [`FT.HYBRID`](/content/commands/ft.hybrid.md) and [`FT.TAGVALS`](/content/commands/ft.tagvals.md).

- The `DD` option of [`FT.DROPINDEX`](/content/commands/ft.dropindex.md).

- Cursors, including [`FT.CURSOR READ`](/content/commands/ft.cursor-read.md), [`FT.CURSOR DEL`](/content/commands/ft.cursor-del.md), and the `WITHCURSOR` option of `FT.AGGREGATE`.

- Synonyms: `FT.SYNUPDATE` and `FT.SYNDUMP`.

- Spell check and dictionaries: `FT.SPELLCHECK`, `FT.DICTADD`, `FT.DICTDEL`, and `FT.DICTDUMP`.

- Autocomplete suggestions: `FT.SUGADD`, `FT.SUGGET`, `FT.SUGDEL`, and `FT.SUGLEN`.

### Field types and index options

Redis Search on Flex doesn't support:

- `GEOSHAPE` fields.

- `FLAT` and `SVS-VAMANA` vector indexes. Use `HNSW` instead.

- `FLOAT64`, `BFLOAT16`, `INT8`, and `UINT8` vectors. Use `FLOAT32` or `FLOAT16` instead.

- The `WITHSUFFIXTRIE` option on `TEXT` and `TAG` fields.

- The `NOINDEX`, `SORTABLE`, and `UNF` field options.

- `FT.CREATE` options other than `ON`, `PREFIX`, `FILTER`, `LANGUAGE`, `LANGUAGE_FIELD`, `SCORE`, `SCORE_FIELD`, `STOPWORDS`, and `SKIPINITIALSCAN`.

### Query options

Redis Search on Flex doesn't support:

- Prefix, suffix, infix, and wildcard queries on `TAG` fields.

- The `SUMMARIZE`, `HIGHLIGHT`, `WITHOUTCOUNT`, `SLOP`, and `INORDER` options of `FT.SEARCH`.

- `DIALECT 4`.

- The `HAMMING` scorer, which requires document payloads.

Filtered vector queries must set a [filter mode](/content/develop/ai/search-and-query/vectors/_index.md#filter-mode) with `HYBRID_POLICY`. Redis Search on Flex doesn't select one automatically.

### Behavior differences

- Hash field expiration isn't reflected in the index or in query results.

- In `FT.AGGREGATE`, numeric values from fields that aren't in the index schema sort as strings. To sort them numerically, convert them with `APPLY to_number(@<field>)`.

### Database limitations

The following database limitations also apply:

- [Active-Active databases](/content/operate/rs/databases/active-active/_index.md) are not supported.

- [Replica Of](/content/operate/rs/databases/import-export/replica-of/_index.md) and [import](/content/operate/rs/databases/import-export/import-data.md) work only from another Flex database.

- Cold restart isn't supported for keys stored on flash. Use [database replication](/content/operate/rs/databases/durability-ha/replication.md) for high availability.

## Plan memory and performance

Redis Search on Flex keeps some index data in RAM, even when the index is stored on flash. Plan for more RAM than a Flex database of the same size without search indexes. The number of indexes, the number of fields in each index, your query patterns, and your read and write mix all affect how much RAM and CPU you need.

The [RAM-to-flash ratio](/content/operate/rs/flex/plan.md#ram-to-flash-ratio) affects search performance the same way it affects other Flex workloads. More RAM increases throughput and lowers latency.

Configure the [query performance factor](/content/operate/oss_and_stack/stack-with-enterprise/search/query-performance-factor.md) for databases that use Redis Search on Flex. Reading index data from flash adds latency, and the query performance factor offsets it by running queries on more CPUs.
