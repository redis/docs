---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- kubernetes
- clients
description: Patterns for efficient data modeling with JSON, hashes, and indexes
linkTitle: Data modeling
title: Data modeling patterns
weight: 50
---

Data modeling patterns help you structure data efficiently in Redis using JSON documents, hashes, sorted sets, and indexes. These patterns show you how to model entities, relationships, and time-series data for optimal performance.

## When to use these patterns

Use data modeling patterns when you need to:

- Model complex entities as JSON documents
- Ensure consistency across multiple keys
- Query data by multiple attributes
- Store and query time-series data
- Optimize for read or write performance
- Handle relationships between entities

## Available patterns

### [JSON document modeling](json-documents/)

Structure entities as JSON documents with Redis JSON. Learn schema design, relationship modeling, and denormalization strategies.

**Key concepts:** JSON.SET, JSON.GET, JSONPath, schema design

### [Atomic multi-key operations](atomic-operations/)

Ensure consistency across multiple keys using transactions, Lua scripts, or Redis Functions. Learn when to use each approach.

**Key concepts:** MULTI/EXEC, WATCH, Lua scripts, Redis Functions

### [Secondary indexes](secondary-indexes/)

Query data by multiple attributes using manual indexes or Redis Search. Learn index design and maintenance strategies.

**Key concepts:** Sorted sets, sets, FT.CREATE, composite indexes

### [Time-series data](time-series/)

Model time-series data efficiently using sorted sets or RedisTimeSeries. Learn retention, downsampling, and aggregation strategies.

**Key concepts:** Sorted sets, TS.ADD, TS.RANGE, retention policies

## Prerequisites

Before working with these patterns, familiarize yourself with:

- [JSON data type]({{< relref "/develop/data-types/json" >}}) - Store and manipulate JSON
- [Hashes]({{< relref "/develop/data-types/hashes" >}}) - Object storage
- [Sorted sets]({{< relref "/develop/data-types/sorted-sets" >}}) - Ordered collections
- [Transactions]({{< relref "/develop/using-commands/transactions" >}}) - Atomic operations
- [Redis Functions]({{< relref "/develop/programmability/functions-intro" >}}) - Server-side logic

## Common use cases

- **User profiles** - Store user data as JSON documents
- **Product catalogs** - Model products with searchable attributes
- **Session storage** - Store session data with TTL
- **Shopping carts** - Atomic cart operations
- **Metrics and monitoring** - Time-series metrics storage
- **Social graphs** - Model relationships between users

## Related patterns

- [JSON document queries]({{< relref "/develop/patterns/queries/json-document-queries" >}}) - Query JSON documents
- [Real-time aggregations]({{< relref "/develop/patterns/analytics/real-time-aggregations" >}}) - Aggregate time-series data
- [Distributed locks]({{< relref "/develop/patterns/messaging/distributed-locks" >}}) - Coordinate multi-key updates

## More information

- [JSON documentation]({{< relref "/develop/data-types/json" >}})
- [Data types overview]({{< relref "/develop/data-types" >}})
- [Transactions guide]({{< relref "/develop/using-commands/transactions" >}})
- [Redis Functions]({{< relref "/develop/programmability/functions-intro" >}})
- [Key naming conventions]({{< relref "/develop/using-commands/keyspace" >}})

