---
Title: AccumulateBy
alwaysopen: false
categories:
- docs
- operate
- stack
description: Groups records and reduces each group to a single record per group.
linkTitle: accumulateBy
weight: 50
---

```java
public <I extends java.io.Serializable> GearsBuilder<I> accumulateBy​(
	gears.operations.ExtractorOperation<T> extractor, 
	gears.operations.AccumulateByOperation<T,​I> accumulator)

public <I extends java.io.Serializable> GearsBuilder<I> accumulateBy​(
	gears.operations.ValueInitializerOperation<I> valueInitializer, 
	gears.operations.ExtractorOperation<T> extractor, 
	gears.operations.AccumulateByOperation<T,​I> accumulator)
```

Iterates through the records in the pipe, groups them based on the provided extractor, and then reduces each group to a single record per group with the accumulator function.

The initial value of the accumulator is null unless you provide a value initializer operation as a parameter.

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
| valueInitializer | ValueInitializerOperation<I> | Whenever the accumulated value is null, use this function to initialize it |

## Returns

Returns a GearsBuilder object with a new template type.

## Examples

Both of the following examples count the number of unique values.

Without the `valueInitializer` parameter:

```java
GearsBuilder.CreateGearsBuilder(reader).
   	accumulateBy(r->{
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

With the `valueInitializer` parameter:

```java
GearsBuilder.CreateGearsBuilder(reader).
    	accumulateBy(()->{
   		return 0;
   	},r->{
   		return r.getStringVal();
   	},(k, a, r)->{
   		return a + 1;
   	});
```
