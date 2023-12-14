---
Title: Count
alwaysopen: false
categories:
- docs
- operate
- stack
description: Counts the number of records in the pipe.
linkTitle: count
weight: 50
---

```java
public GearsBuilder<java.lang.Integer> count()
```

Counts the number of records in the pipe and returns the total as a single record.

## Parameters
 
None

## Returns

Returns a GearsBuilder object with a new template type of `Integer`.

## Example

```java
GearsBuilder.CreateGearsBuilder(reader).count();
```