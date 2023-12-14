---
Title: Collect
alwaysopen: false
categories:
- docs
- operate
- stack
description: Collects all records to the origin shard.
linkTitle: collect
weight: 50
---

```java
public GearsBuilder<T> collect()
```

Collects all of the records to the shard where the RedisGears job started.

## Parameters
 
None

## Returns

Returns a GearsBuilder object with the same template type as the input builder.

## Example

```java
GearsBuilder.CreateGearsBuilder(reader).collect();
```