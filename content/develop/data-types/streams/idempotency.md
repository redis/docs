---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- oss
- kubernetes
- clients
description: Idempotent message processing in Redis Streams
linkTitle: Idempotency
title: Idempotent Message Processing
weight: 10
---

Redis Streams support idempotent message processing to prevent duplicate entries when using at-least-once delivery patterns. This feature enables reliable message submission with automatic deduplication.

## Overview

Idempotent message processing prevents duplicate stream entries by tracking recently submitted messages per producer. When a message is resubmitted (due to network failures, retries, etc.), Redis returns the existing entry ID instead of creating a duplicate.

## Basic usage

Use the [`XADD`]({{< relref "/commands/xadd" >}}) command with idempotency parameters:

```
XADD mystream IDMP producer1 msg1 * field value
XADD mystream IDMPAUTO producer2 * field value
```

## Idempotency modes

### Manual mode (IDMP)

Specify both producer ID and idempotent ID explicitly:

```
XADD mystream IDMP producer1 msg1 * field value
```

- **producer-id**: Unique identifier for the message producer
- **idempotent-id**: Unique identifier for this specific message
- **Performance**: Faster processing (no hash calculation)
- **Control**: Full control over ID generation and uniqueness

### Automatic mode (IDMPAUTO)

Specify only the producer ID; Redis generates the idempotent ID from message content:

```
XADD mystream IDMPAUTO producer1 * field value
```

- **producer-id**: Unique identifier for the message producer  
- **Automatic deduplication**: Redis calculates idempotent ID from field-value pairs
- **Content-based**: Same content produces the same idempotent ID
- **Performance**: Slightly slower due to hash calculation

## Configuration

Configure idempotency settings using [`XCFGSET`]({{< relref "/commands/xcfgset" >}}):

```
XCFGSET mystream DURATION 300 MAXSIZE 1000
```

### Parameters

- **DURATION**: How long (in seconds) to retain idempotent IDs (1-86400 seconds, default: 100)
- **MAXSIZE**: Maximum idempotent IDs to track per producer (1-10,000 entries, default: 100)

### Expiration behavior

Idempotent IDs are removed when either condition is met:

- **Time-based**: ID expires after the configured duration
- **Capacity-based**: Oldest IDs are evicted when maxsize is reached

## Producer isolation

Each producer maintains independent idempotency tracking:

```
XADD mystream IDMP producer1 msg1 * field value    # Producer 1's tracking
XADD mystream IDMP producer2 msg1 * field value    # Producer 2's tracking (independent)
```

Producers can use the same idempotent ID without conflicts.

## Monitoring

Use [`XINFO STREAM`]({{< relref "/commands/xinfo-stream" >}}) to monitor idempotency metrics:

```
XINFO STREAM mystream
```

Returns additional fields when idempotency is configured:

- **idmp-duration**: Current duration setting
- **idmp-maxsize**: Current maxsize setting  
- **pids-tracked**: Number of active producers
- **iids-tracked**: Total idempotent IDs currently stored
- **iids-added**: Lifetime count of idempotent messages added
- **iids-duplicates**: Lifetime count of duplicates prevented

## Best practices

### Producer ID selection

Use globally unique, persistent producer IDs:

- **Recommended**: UUID v4 for global uniqueness
- **Alternative**: `hostname:process_id` or application-assigned IDs
- **Persistence**: Use the same producer ID after restarts to maintain idempotency tracking

### Configuration tuning

- **Duration**: Set based on your retry timeout patterns
- **Maxsize**: Balance memory usage with deduplication window needs
- **Monitoring**: Track `iids-duplicates` to verify deduplication effectiveness

### Error handling

Handle these error conditions:

- **WRONGTYPE**: Key exists but is not a stream
- **ERR no such key**: Stream doesn't exist (when using NOMKSTREAM)
- **ERR syntax error**: Invalid command syntax

## Performance characteristics

Idempotency introduces minimal overhead:

- **Throughput**: 2-5% reduction compared to standard XADD
- **Memory**: <1.5% additional memory usage
- **Latency**: Negligible impact on per-operation latency

Manual mode (IDMP) is slightly faster than automatic mode (IDMPAUTO) due to avoiding hash calculation.

## Persistence

Idempotency tracking persists across Redis restarts:

- **RDB/AOF**: All producer-idempotent ID pairs are saved
- **Recovery**: Tracking remains active after restart
- **Configuration**: Duration and maxsize settings persist
- **Important**: Running `XCFGSET` clears all existing tracking data
