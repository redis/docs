---
Title: GearsBuilder
alwaysopen: false
categories:
- docs
- operate
- stack
description: Creates a RedisGears pipeline of operations to transform data.
linkTitle: GearsBuilder
toc: 'false'
weight: 60
---

The `GearsBuilder` class allows you to create a pipeline of RedisGears functions that transform data.

It requires a reader to supply data to the pipe.

To create a `GearsBuilder` object, follow this example code:

```java
BaseReader reader = ...; // Initialize the reader
builder = GearsBuilder.CreateGearsBuilder(reader);
```

## Functions

