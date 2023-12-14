---
Title: StreamReader
alwaysopen: false
categories:
- docs
- operate
- stack
description: Reads Redis stream data.
linkTitle: StreamReader
weight: 60
---

Reads Redis stream data.

## Parameters

| Name | Type | Default value | Description |
|------|------|---------------|-------------|
| batchSize | integer | 1 | The number of new messages that will cause the functions to run |
| duration | integer | 0 | How many seconds to wait before execution, regardless of batch size |
| failurePolicy | FailurePolicy | FailurePolicy.CONTINUE | How to handle execution failure (CONTINUE/ABORT/RETRY) |
| failureRetryInterval | integer | 5000 | The number of seconds to wait before retrying |
| pattern | string | "\*" (match all keys) | The pattern of keys that store streams |
| startId | string | "0-0" | Start reading from this stream ID |
| trimStream | boolean | true | Whether or not to trim the stream |

## Output records

Creates a record for each message in the input stream.

Each record is a `HashMap<String, Object>` with the following fields:

| Name | Type | Description |
|------|------|-------------|
| id | string | The message's ID |
| key | string | The stream key name |
| value | HashMap<String, byte[]> | The message's data |

## Examples

The following example creates a `StreamReader` with default values:

```java
StreamReader reader = new StreamReader();
```

To change the parameter values for a `StreamReader`, use their setter methods:

```java
StreamReader reader = new StreamReader();
// Get streams for keys that match "weather"
reader.setPattern("weather");
// Run RedisGears functions after every 10 messages
reader.setBatchSize(10);
```
