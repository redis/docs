---
Title: ShardsIDReader
alwaysopen: false
categories:
- docs
- operate
- stack
description: Gets the shard ID for each shard in a database.
linkTitle: ShardsIDReader
weight: 60
---

The `ShardsIDReader` creates a single record on each shard that represents the current shard's ID.
 
Use this reader when you want to run an operation on each shard in the database.

## Parameters

None

## Output records

Creates a record for each shard with the shard's cluster identifier.

## Example

```java
ShardsIDReader reader = new ShardsIDReader();
```