---
aliases:
- /develop/interact/search-and-query/advanced-concepts
- /develop/interact/search-and-query/advanced-concepts/
- /interact/search-and-query/advanced-concepts/
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
description: Details about query syntax, aggregation, scoring, and other search and
  query options
linkTitle: Search concepts
title: Search concepts
weight: 7
---

Redis Open Source supports the following Redis Search features. This article provides you an overview.

## Indexing features

* Secondary indexing
* Vector indexing
* Index on [JSON](/content/develop/data-types/json/_index.md) documents
* Full-text indexing of multiple fields in a document
* Incremental indexing without performance loss
* Document deletion and updating with index garbage collection


## Query features

* Multi-field queries
* Query on [JSON](/content/develop/data-types/json/_index.md) documents
* [Aggregation](/content/develop/ai/search-and-query/advanced-concepts/aggregations.md)
* Boolean queries with AND, OR, and NOT operators between subqueries
* Optional query clauses
* Retrieval of full document contents or only their IDs
* Exact phrase search and slop-based search
* Numeric filters and ranges
* Geo-filtering using Redis [geo commands](/commands/?group=geo)
* [Vector search](/content/develop/ai/search-and-query/vectors/_index.md)
* [Key and field expiration behavior](/content/develop/ai/search-and-query/advanced-concepts/expiration.md)
* [Search commands in MULTI/EXEC transactions and Lua scripts](/content/develop/ai/search-and-query/advanced-concepts/transactions.md)


## Full-text search features

* [Prefix-based searches](/content/develop/ai/search-and-query/query/_index.md#prefix-matching)
* Field weights
* [Auto-complete](/content/develop/ai/search-and-query/administration/overview.md#auto-complete) and fuzzy prefix suggestions
* [Stemming](/content/develop/ai/search-and-query/advanced-concepts/stemming.md)-based query expansion for [many languages](/content/develop/ai/search-and-query/advanced-concepts/stemming.md#supported-languages) using [Snowball](http://snowballstem.org/)
* Support for custom functions for query expansion and scoring (see [Extensions](/content/develop/ai/search-and-query/administration/extensions.md))
* Unicode support (UTF-8 input required)
* Document ranking

## Cluster support

The Redis Search features of Redis Open Source are also available for distributed databases that can scale to billions of documents and hundreds of servers.

## Supported platforms
Redis Open Source is developed and tested on Linux and macOS on x86_64 CPUs.

Atom CPUs are not supported.

<br/>