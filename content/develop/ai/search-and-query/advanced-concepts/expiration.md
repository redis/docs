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
description: How the Redis Query Engine handles expiring keys and hash fields
linkTitle: Key and field expiration
title: Key and field expiration behavior
weight: 34
---

The Redis Query Engine behavior with expiring keys and hash fields has been enhanced starting with Redis 8 to provide more consistent and predictable results.

## Key expiration

### Expiration times

**Before Redis 8**: Expiration times were not taken into account when computing the result set.

**Redis 8 and later**: The query engine returns only documents that are valid (not expired) at the time when the query or cursor read started.

### Active expiration

Active expiration can affect the number of results returned. For example, if a user requests 100 documents but 10 are actively expired during query execution, only 90 documents will be returned.

**Note**: This behavior did not change in Redis 8 - active expiration has always affected result counts.

### Passive expiration

**Before Redis 8**: A query could return `nil` as a document name in the result set for a key that was passively expired.

**Redis 8 and later**: Only valid document names will be returned. Passively expired keys are filtered out from the result set.

## Field expiration

Field expiration was introduced in Redis 7.4 and provides fine-grained control over hash field lifecycles.

### Expiration times

**Before Redis 8**: Field expiration times were not taken into account when computing the result set.

**Redis 8 and later**: The query engine returns only documents that are valid (fields not expired) at the time when the query or cursor read started.

### Active expiration

Similar to key expiration, active field expiration can affect the number of results returned. If fields that match query criteria are actively expired during execution, fewer results will be returned than requested.

**Note**: This behavior did not change in Redis 8 - active expiration has always affected result counts.

### Passive expiration

**Before Redis 8**: The query engine could return documents without fields that were passively expired, even if the expired field caused the document to match the query. This behavior depended to some degree on the `SORTABLE` keyword usage.

**Redis 8 and later**: Documents will return with all fields that existed when the query or cursor read started. Passively expired fields are handled consistently.

## Best practices

* **Consistent timing**: Be aware that query results are based on the state at query start time, not when individual documents are processed.

* **Result count expectations**: Be aware that when you use expiring keys or fields, the actual number of results may be less than you expected due to active expiration during the execution of the query.

* **Field-level expiration**: Use hash field expiration (available since Redis 7.4) for fine-grained control over document field lifecycles without affecting the entire document.

* **Query planning**: Consider expiration patterns when designing queries, especially for time-sensitive applications where expired data should not appear in results.

## Related commands

The following commands are directly related to key and field expiration:

- [`EXPIRE`]({{< relref "/commands/expire" >}}) - Set expiration time for keys
- [`HEXPIRE`]({{< relref "/commands/hexpire" >}}) - Set expiration time for hash fields
- [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}) - Search queries affected by expiration behavior
- [`FT.AGGREGATE`]({{< relref "/commands/ft.aggregate" >}}) - Aggregation queries affected by expiration behavior
