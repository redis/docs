---
Title: Run
alwaysopen: false
categories:
- docs
- operate
- stack
description: Runs the pipeline of functions immediately.
linkTitle: run
weight: 50
---

```java
public void run()

public void run​(boolean jsonSerialize, boolean collect)
```

Runs the pipeline of functions immediately upon execution. It will only run once.

## Parameters

| Name | Type | Description |
|------|------|-------------|
| collect | boolean | Whether or not to collect the results from the entire cluster before returning them |
| jsonSerialize | boolean | Whether or not to serialize the results to JSON before returning them |

## Returns

None

## Example

```java
GearsBuilder.CreateGearsBuilder(reader).run();
```