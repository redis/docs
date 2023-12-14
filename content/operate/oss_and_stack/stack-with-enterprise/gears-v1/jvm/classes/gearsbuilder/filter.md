---
Title: Filter
alwaysopen: false
categories:
- docs
- operate
- stack
description: Filters out records in the pipe based on a given condition.
linkTitle: filter
weight: 50
---

```java
public GearsBuilder<T> filter​(
    gears.operations.FilterOperation<T> filter)
```

Filters out records in the pipe based on a given condition.

The filter operation should contain a conditional statement and return a boolean for each record:
- If `true`, the record will continue through the pipe. 
- If `false`, it filters out the record.

## Parameters

| Name | Type | Description |
|------|------|-------------|
| filter | FilterOperation<T> | A function that checks a condition for each record in the pipe. Returns a boolean. |

## Returns

Returns a GearsBuilder object with the same template type as the input builder.

## Example

Get all records that contain the substring "person:":

```java
GearsBuilder.CreateGearsBuilder(reader).
    filter(r->{
        return r.getKey().contains("person:");
});
```