---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- kubernetes
- clients
description: Build high-throughput event processing pipelines with Redis Streams
linkTitle: Event pipelines with Streams
title: How do I build an event pipeline with Redis Streams?
weight: 1
---

## Problem

You need to build a real-time event processing system that can:

- Ingest events from multiple sources at high throughput
- Maintain event history for replay and debugging
- Route events to multiple downstream consumers
- Handle backpressure when consumers can't keep up
- Provide durability guarantees for critical events

Traditional message queues may not provide the combination of speed, durability, and flexibility you need.

## Solution overview

Redis Streams provides an append-only log data structure optimized for event processing. Each stream acts like a durable message queue with:

- **Automatic ID generation** - Events are timestamped and ordered
- **Multiple consumers** - Fan out events to many readers
- **Consumer groups** - Distribute work across parallel consumers
- **Persistence** - Events survive restarts
- **Trimming strategies** - Control memory usage with retention policies

**Architecture:**

```
┌─────────────┐
│  Producer 1 │──┐
└─────────────┘  │
                 │    ┌──────────────────────────────┐
┌─────────────┐  │    │   Redis Stream               │
│  Producer 2 │──┼───▶│  events:orders               │
└─────────────┘  │    │  ┌────┬────┬────┬────┬────┐ │
                 │    │  │ E1 │ E2 │ E3 │ E4 │ E5 │ │
┌─────────────┐  │    │  └────┴────┴────┴────┴────┘ │
│  Producer N │──┘    └──────────────────────────────┘
└─────────────┘              │         │         │
                             │         │         │
                             ▼         ▼         ▼
                      ┌───────────┐ ┌───────────┐ ┌───────────┐
                      │Consumer 1 │ │Consumer 2 │ │Consumer N │
                      └───────────┘ └───────────┘ └───────────┘
                           │             │             │
                           ▼             ▼             ▼
                      ┌─────────────────────────────────────┐
                      │    Downstream Processing            │
                      │  (Database, Analytics, Webhooks)    │
                      └─────────────────────────────────────┘
```

## Prerequisites

Before implementing this pattern, review:

- [Redis Streams]({{< relref "/develop/data-types/streams" >}}) - Core Streams documentation
- [Pipelining]({{< relref "/develop/using-commands/pipelining" >}}) - Batch operations for performance
- [Client libraries]({{< relref "/develop/clients" >}}) - Language-specific Streams support

## Implementation

### Step 1: Add events to a stream

Use `XADD` to append events to a stream. Redis generates a unique, monotonically increasing ID for each event.

{{< clients-example stream_tutorial xadd >}}
> XADD events:orders * order_id 12345 customer_id 67890 amount 99.99 status pending
"1692632086370-0"
> XADD events:orders * order_id 12346 customer_id 67891 amount 149.99 status pending
"1692632094485-0"
{{< /clients-example >}}

The `*` tells Redis to auto-generate the ID. The ID format is `<millisecondsTime>-<sequenceNumber>`.

**Python example:**

```python
import redis

r = redis.Redis(host='localhost', port=6379, decode_responses=True)

# Add a single event
event_id = r.xadd('events:orders', {
    'order_id': '12345',
    'customer_id': '67890',
    'amount': '99.99',
    'status': 'pending'
})
print(f"Event added with ID: {event_id}")
```

**Node.js example:**

```javascript
import { createClient } from 'redis';

const client = await createClient()
  .on('error', err => console.log('Redis Client Error', err))
  .connect();

// Add a single event
const eventId = await client.xAdd('events:orders', '*', {
  order_id: '12345',
  customer_id: '67890',
  amount: '99.99',
  status: 'pending'
});
console.log(`Event added with ID: ${eventId}`);
```

### Step 2: Read events from a stream

Use `XREAD` to read events. You can read from a specific ID or block waiting for new events.

{{< clients-example stream_tutorial xread_block >}}
> XREAD COUNT 100 BLOCK 300 STREAMS events:orders $
(nil)
{{< /clients-example >}}

The `$` means "read only new events". Use `0` to read from the beginning.

**Python example:**

```python
# Read new events, blocking for up to 1 second
events = r.xread({'events:orders': '$'}, count=10, block=1000)

for stream_name, messages in events:
    for message_id, data in messages:
        print(f"Event {message_id}: {data}")
```

**Node.js example:**

```javascript
// Read new events, blocking for up to 1 second
const events = await client.xRead(
  { key: 'events:orders', id: '$' },
  { COUNT: 10, BLOCK: 1000 }
);

if (events) {
  for (const { name, messages } of events) {
    for (const { id, message } of messages) {
      console.log(`Event ${id}:`, message);
    }
  }
}
```

### Step 3: Implement retention policies

Control stream memory usage with `XTRIM`. You can trim by length or by time.

```redis
# Keep only the last 10,000 events
XTRIM events:orders MAXLEN ~ 10000

# Keep only events from the last hour (approximate)
XTRIM events:orders MINID ~ <timestamp>
```

**Python example:**

```python
# Trim to keep last 10,000 events (approximate)
r.xtrim('events:orders', maxlen=10000, approximate=True)
```

You can also configure trimming automatically with `XADD`:

```python
# Add event and trim in one operation
r.xadd('events:orders', 
       {'order_id': '12347', 'status': 'pending'},
       maxlen=10000,
       approximate=True)
```

### Step 4: Handle high-throughput ingestion

For high-throughput scenarios, use pipelining to batch multiple `XADD` commands:

**Python example:**

```python
pipe = r.pipeline()
for i in range(1000):
    pipe.xadd('events:orders', {
        'order_id': str(i),
        'timestamp': str(time.time())
    })
# Execute all commands at once
results = pipe.execute()
```

## Redis Cloud setup

When deploying to Redis Cloud:

1. **Choose appropriate memory limits** - Streams can grow large; monitor memory usage
2. **Configure eviction policy** - Use `noeviction` to prevent data loss
3. **Enable persistence** - Use AOF for durability
4. **Monitor stream length** - Set up alerts for unbounded growth

Example Redis Cloud configuration:

- **Memory**: Start with 1GB, scale based on retention needs
- **Eviction**: `noeviction`
- **Persistence**: AOF every second
- **Alerts**: Stream length > 1M entries

## Common pitfalls

1. **Unbounded stream growth** - Always implement trimming strategies
2. **Blocking forever** - Use timeouts with `XREAD BLOCK`
3. **Not handling connection failures** - Implement retry logic
4. **Ignoring backpressure** - Monitor consumer lag
5. **Using wrong ID format** - Let Redis auto-generate IDs with `*`

## Related patterns

- [Consumer groups for parallel processing]({{< relref "/develop/patterns/ingestion/consumer-groups" >}}) - Scale event processing
- [Exactly-once processing]({{< relref "/develop/patterns/ingestion/exactly-once-processing" >}}) - Guarantee message processing
- [Streams vs Pub/Sub]({{< relref "/develop/patterns/messaging/streams-vs-pubsub" >}}) - Choose the right messaging pattern

## More information

- [Redis Streams documentation]({{< relref "/develop/data-types/streams" >}})
- [XADD command]({{< relref "/commands/xadd" >}})
- [XREAD command]({{< relref "/commands/xread" >}})
- [XTRIM command]({{< relref "/commands/xtrim" >}})
- [Pipelining guide]({{< relref "/develop/using-commands/pipelining" >}})

