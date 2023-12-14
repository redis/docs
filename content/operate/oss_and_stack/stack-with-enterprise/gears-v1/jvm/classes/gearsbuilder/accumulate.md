---
Title: Accumulate
alwaysopen: false
categories:
- docs
- operate
- stack
description: Reduces many records in the pipe to a single record.
linkTitle: accumulate
weight: 50
---

```java
public <I extends java.io.Serializable> GearsBuilder<I> accumulate​(
    gears.operations.AccumulateOperation<T,​I> accumulator)

public <I extends java.io.Serializable> GearsBuilder<I> accumulate​(
    I initialValue, 
    gears.operations.AccumulateOperation<T,​I> accumulator)
```

Accumulate is a many-to-one function that iterates through the records in the pipe and reduces them to a single record.

You can provide a parameter to set the initial accumulator value. Otherwise, the initial accumulator object is null.

## Parameters
 
Type parameters:

| Name | Description |
|------|-------------|
| I | The template type of the returned builder |

Function parameters:

| Name | Type | Description |
|------|------|-------------|
| accumulator | <nobr>AccumulateOperation<T,​I></nobr> | A function with logic to update the accumulator value with each record |
| initialValue | template type I | The initial value of the accumulated object |

## Returns

Returns a GearsBuilder object with a new template type.

## Examples

Both of the following examples count the number of records in the pipeline.

Without the `initialValue` parameter:

```java
GearsBuilder.CreateGearsBuilder(reader).accumulate((a, r)->{
    Integer ret = null;
    if (a == null) {
	    ret = 1;
    } else {
	    ret = (Integer)a;
    }
    return ret + 1;
});
```

With the `initialValue` parameter set to 0:

```java
GearsBuilder.CreateGearsBuilder(reader).accumulate(0, (a, r)->{
   	return a + 1;
});
```
