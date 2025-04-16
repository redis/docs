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
description: Details about query syntax, aggregation, scoring, and other search and
  query options
linkTitle: Advanced concepts
title: Advanced concepts
weight: 7
---

Redis Community Edition supports the following Redis Query Engine features. This article provides you an overview.

## Indexing features

* Secondary indexing
* Vector indexing
* Index on [JSON]({{< relref "/develop/data-types/json/" >}}) documents
* Full-text indexing of multiple fields in a document
* Incremental indexing without performance loss
* Document deletion and updating with index garbage collection


## Query features

* Multi-field queries
* Query on [JSON]({{< relref "/develop/data-types/json/" >}}) documents
* [Aggregation]({{< relref "/develop/interact/search-and-query/advanced-concepts/aggregations" >}})
* Boolean queries with AND, OR, and NOT operators between subqueries
* Optional query clauses
* Retrieval of full document contents or only their IDs
* Exact phrase search and slop-based search
* Numeric filters and ranges
* Geo-filtering using Redis [geo commands]({{< relref "/commands/" >}}?group=geo)
* [Vector search]({{< relref "/develop/ai/vector-fields" >}})


## Full-text search features

* [Prefix-based searches]({{< relref "/develop/interact/search-and-query/query/#prefix-matching" >}})
* Field weights
* [Auto-complete]({{< relref "develop/interact/search-and-query/administration/overview#auto-complete" >}}) and fuzzy prefix suggestions
* [Stemming]({{< relref "/develop/interact/search-and-query/advanced-concepts/stemming" >}})-based query expansion for [many languages]({{< relref "develop/interact/search-and-query/advanced-concepts/stemming#supported-languages" >}}) using [Snowball](http://snowballstem.org/)
* Support for custom functions for query expansion and scoring (see [Extensions]({{< relref "/develop/interact/search-and-query/administration/extensions" >}}))
* Unicode support (UTF-8 input required)
* Document ranking

## Cluster support

The Redis Query Engine features of Redis Community Edition are also available for distributed databases that can scale to billions of documents and hundreds of servers.

## Supported platforms
Redis Community Edition is developed and tested on Linux and macOS on x86_64 CPUs.

Atom CPUs are not supported.

<br/>
