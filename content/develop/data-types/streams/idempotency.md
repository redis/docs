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
title: Idempotent message processing
weight: 10
---

In Redis 8.6, streams support idempotent message processing (at-most-once production) to prevent duplicate entries when using at-least-once delivery patterns. This feature enables reliable message submission with automatic deduplication.

Idempotent message processing ensures that handling the same message multiple times produces the same system state as handling it once.

Beginning with Redis 8.6, streams support idempotent message processing (at-most-once production) to prevent duplicate entries when producers resend messages.

Producers may need to resend messages under two scenarios:

1. Producer-Redis network issues (disconnection and reconnection).

    If a disconnection occurs after the producer executes `XADD`, but before it receives the reply, the producer has no way of knowing if that message was delivered.

1. The producer crashes and restarts.

    If the producer crashes after calling `XADD` but before receiving the reply and marking a message as delivered, after a restart, the producer has no way of knowing if that message was delivered.

In both cases, to guarantee that the message is added to the stream, the producer must call `XADD` again with the same message. Without idempotent message processing, a retry may result in a message being delivered twice. With idempotent message processing, producers can guarantee at-most-once production even under such scenarios.

A unique ID, called an idempotent ID or *iid*, is associated with each message that is added to a stream. 
There are two ways to assign iids:

1. Producers provide a unique iid for each message. An iid can be some identifier already associated with this message: a transaction ID, a counter, or a UUID.
1. Redis generates an iid based on each message’s content.

If the same message is added to the stream more than once, the same iid would need to be provided by the producer.
For (1), this is the producer’s responsibility, and for (2), Redis will calculate the same iid, as long as the message content hasn’t changed.

## Idempotency modes

Use the [`XADD`]({{< relref "/commands/xadd" >}}) command with idempotency parameters, `IDMP` or `IDMPAUTO`:

```
XADD mystream IDMP producer-1 iid-1 * field value      # producer-1 (pid) and iid-1 (iid) are provided manually
XADD mystream IDMPAUTO producer-2 * field value        # producer-2 (pid) is provided manually, Redis provides the iid
```

### Manual mode (`IDMP`)

Specify both producer ID (pid) and iid explicitly:

```
XADD mystream IDMP producer1 msg1 * field value
```

- `pid`: Unique identifier for the message producer.
- `iid`: Unique identifier for a specific message.
- Performance: Faster processing (no hash calculation).
- Control: Full control over ID generation and uniqueness.

### Automatic mode (`IDMPAUTO`)

Specify only the pid; Redis generates the iid from message content:

```
XADD mystream IDMPAUTO producer1 * field value
```

- `pid`: Unique identifier for the message producer.
- Automatic deduplication: Redis calculates an iid from field-value pairs.
- Content-based: The same content produces the same iid.
- Performance: Slightly slower due to hash calculation.

For both IDMP and IDMPAUTO, each producer application is required to use the same pid after it restarts.

For IDMP, each producer application is responsible for:

- Providing a unique iid for each entry (either globally, or just for each pid).
- Reusing the same (pid, iid) when resending a message (even after it restarts).

Here's an illustration of how message processing in Redis Streams works with and without idempotent production:

{{< image filename="images/dev/stream/stream-idempotency.png" alt="Idempotent message processing in Redis Streams" >}}

## Stream configuration

Configure idempotency settings for a stream using [`XCFGSET`]({{< relref "/commands/xcfgset" >}}):

```
XCFGSET mystream IDMP-DURATION 300 IDMP-MAXSIZE 1000
```

### Parameters

- `IDMP-DURATION`: How long (in seconds) to retain iids (1-86400 seconds, the default is 100).
- `IDMP-MAXSIZE`: The maximum number of per-producer iids to track (1-10,000 entries, the default is 100).

### Expiration behavior

Idempotent IDs are removed when either condition is met:

- Time-based: iids expire after the configured `IDMP-DURATION`.
- Capacity-based: Oldest iids are evicted when `IDMP-MAXSIZE` is reached. Redis never keeps more than `IDMP-MAXSIZE` iids per pid. In other words, `IDMP-MAXSIZE` is *stronger* than `IDMP-DURATION`.

### Determine optimal configuration values

`IDMP-DURATION` is an operational guarantee: Redis will not discard a previously sent iid for the specified duration (unless reaching `IDMP-MAXSIZE` iids for that producer).
If a producer application crashes and stops sending messages to Redis, Redis will keep each iid for `IDMP-DURATION` seconds, after which they will be discarded.
You should know how long it may take your producer application to recover from a crash and start resending messages, so you should set `IDMP-DURATION` accordingly.
If `IDMP-DURATION` is set too high, Redis will waste memory by retaining iids for a longer duration than necessary.

**Example**: if a producer crashes, it may take up to 1,000 seconds until it recovers and restarts sending messages. You should set `IDMP-DURATION` to 1000.

When a producer application retrieves an `XADD` reply from Redis, it usually marks the message as *delivered* in a transaction database or log file. 
If the application crashes, it needs to resend undelivered messages after recovering from the crash.
Since a few messages may have not been marked as delivered as a result of the crash, the application will likely resend these messages.
Using iids will allow Redis to detect such duplicate messages and filter them.
Setting `IDMP-MAXSIZE` correctly ensures that Redis retains a sufficient number of recent iids.
If `IDMP-MAXSIZE` is set too high, Redis will waste memory by retaining too many iids.
Usually this number can be very small, and often, even *one* is enough.
If your application marks messages as delivered asynchronously, you should know how long it may take from the time it retrieved a `XADD` reply from Redis until the message is marked as delivered; this duration is called *mark-delay*. `IDMP-MAXSIZE` should be set to

`mark-delay [in msec] * (messages / msec) + some margin.`

**Example**: a producer is sending 1K msgs/sec (1 msg/msec), and takes up to 80 msec to mark each message as delivered, `IDMP-MAXSIZE` should be set to `1 * 80 + margin = 100` iids.

## Producer isolation

Each producer maintains independent idempotency tracking:

```
XADD mystream IDMP producer-1 iid-1 * field value    # producer-1 is tracking
XADD mystream IDMP producer-2 iid-1 * field value    # producer-2 is tracking (independent)
```

Producers can use the same iid without conflicts, as long as long as the pids are different.

## Monitoring

Use [`XINFO STREAM`]({{< relref "/commands/xinfo-stream" >}}) to monitor idempotency metrics:

```
XINFO STREAM mystream
```

Returns additional fields when idempotency is being used:

- `idmp-duration`: Current duration setting.
- `idmp-maxsize`: Current maxsize setting.
- `pids-tracked`: The number of pids currently tracked in the stream
- `iids-tracked`: Total number of iids currently tracked.
- `iids-added`: Lifetime count of messages with idempotent IDs.
- `iids-duplicates`: Lifetime count of duplicates prevented.

## Best practices

### Producer ID selection

Use globally unique, persistent producer IDs:

- Recommended: Use short producer IDs to save memory and increase performance.
- Persistence: Use the same producer ID after restarts to maintain idempotency tracking.

### Configuration tuning

- Duration: Set based on your retry timeout patterns.
- Maxsize: Balance memory usage with deduplication window needs.
- Monitoring: Track `iids-duplicates` to verify deduplication effectiveness.

### Error handling

Handle these error conditions:

- `WRONGTYPE`: Key exists but is not a stream.
- `ERR no such key`: Stream doesn't exist (when using NOMKSTREAM).
- `ERR syntax error`: Invalid command syntax.

## Performance characteristics

Idempotency introduces minimal overhead:

- Throughput: 2-5% reduction compared to standard XADD.
- Memory: <1.5% additional memory usage.
- Latency: Negligible impact on per-operation latency.

Manual mode (IDMP) is slightly faster than automatic mode (IDMPAUTO) since it avoids hash calculations.

## Persistence

Idempotency tracking persists across Redis restarts:

- RDB/AOF: All producer-idempotent ID pairs are saved.
- Recovery: Tracking remains active after restart.
- Configuration: `IDMP-DURATION` and `IDMP-MAXSIZE` settings persist.
- Important: Executing `XCFGSET` with different `IDMP-DURATION` or `IDMP-MAXSIZE` values than the current values for a particular key clears its IDMP map.
