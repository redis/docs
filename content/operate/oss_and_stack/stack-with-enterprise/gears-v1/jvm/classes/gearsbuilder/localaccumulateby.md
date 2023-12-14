---
Title: LocalAccumulateBy
alwaysopen: false
categories:
- docs
- operate
- stack
description: Groups records and reduces each group to a single record per group locally
  on each shard.
linkTitle: localAccumulateBy
weight: 50
---

```java
public <I extends java.io.Serializable> GearsBuilder<I> localAccumulateBy​(
	gears.operations.ExtractorOperation<T> extractor, 
	gears.operations.AccumulateByOperation<T,​I> accumulator)
```

The `localAccumulateBy` function is similar to [`accumulateBy`]({{< relref "/operate/oss_and_stack/stack-with-enterprise/gears-v1/jvm/classes/gearsbuilder/accumulateby" >}}), except it performs the operation locally on each shard without moving data between shards.

On each shard, it iterates through the records in the pipe, groups them based on the provided extractor, and then reduces each group to a single record per group with the accumulator function.

The initial value of the accumulator is null.

## Parameters
 
Type parameters:

| Name | Description |
|------|-------------|
| I | The template type of the returned builder |

Function parameters:

| Name | Type | Description |
|------|------|-------------|
| accumulator | <nobr>AccumulateByOperation<T,​I></nobr> | A function with logic to update the accumulator value with each record |
| extractor | ExtractorOperation<T> | Extracts a specific value from each record |

## Returns

Returns a GearsBuilder object with a new template type.

## Example

```java
GearsBuilder.CreateGearsBuilder(reader).
   	localAccumulateBy(r->{
   		return r.getStringVal();
   	},(k, a, r)->{
   		Integer ret = null;
   		if(a == null) {
   			ret = 0;
   		}else {
   			ret = (Integer)a;
   		}
   		return ret + 1;
});
```
