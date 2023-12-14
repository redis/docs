---
Title: Map
alwaysopen: false
categories:
- docs
- operate
- stack
description: Maps records one-to-one.
linkTitle: map
weight: 50
---

```java
public <I extends java.io.Serializable> GearsBuilder<I> map​(
	gears.operations.MapOperation<T,​I> mapper)
```

Maps each input record in the pipe to an output record, one-to-one.

## Parameters
 
Type parameters:

| Name | Description |
|------|-------------|
| I | The template type of the returned builder |

Function parameters:

| Name | Type | Description |
|------|------|-------------|
| mapper | <nobr>MapOperation<T,​I></nobr> | For each input record, returns a new output record |

## Returns

Returns a GearsBuilder object with a new template type.

## Example

Map each record to its string value:

```java
GearsBuilder.CreateGearsBuilder(reader).
 		map(r->{
    		return r.getStringVal();
});
```
