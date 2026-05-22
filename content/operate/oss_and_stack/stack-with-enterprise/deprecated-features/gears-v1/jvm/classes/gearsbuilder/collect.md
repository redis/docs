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
aliases:
- "/operate/oss_and_stack/stack-with-enterprise/gears-v1/jvm/classes/gearsbuilder/collect/"
bannerText: Redis Gears is a deprecated feature that is not recommended or supported
  for new users.
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