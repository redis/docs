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
description: Choose the right messaging pattern for your use case
linkTitle: Streams vs Pub/Sub
title: When should I use Streams vs Pub/Sub?
weight: 1
---

## Problem

You need to choose between Redis Streams and Pub/Sub for messaging:

- When do I need message persistence vs fire-and-forget?
- How do I handle consumers that go offline?
- Should I use consumer groups or channel subscriptions?
- What about message history and replay?
- Which is better for my throughput requirements?

Choosing the wrong pattern can lead to message loss or unnecessary complexity.

## Solution overview

Redis provides two messaging patterns with different trade-offs:

**Pub/Sub** - Fire-and-forget messaging:
- No persistence - messages lost if no subscribers
- Real-time delivery to active subscribers
- Simple channel-based routing
- Minimal memory overhead

**Streams** - Persistent message log:
- Messages persisted in append-only log
- Consumer groups for load balancing
- Message history and replay capability
- Acknowledgment and pending message tracking

**Architecture:**

```
┌──────────────────────────────────────────────────────────┐
│              PUB/SUB vs STREAMS                          │
└──────────────────────────────────────────────────────────┘

PUB/SUB (Fire-and-forget)
┌────────────────┐
│   Publisher    │
└────────┬───────┘
         │ PUBLISH channel "message"
         ▼
┌─────────────────────────────────────────┐
│  Redis Channel (No Storage)             │
│  ┌───────────────────────────────────┐  │
│  │ Message broadcast immediately     │  │
│  │ No history, no persistence        │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
         │         │         │
         ▼         ▼         ▼
    ┌────────┐ ┌────────┐ ┌────────┐
    │ Sub 1  │ │ Sub 2  │ │ Sub 3  │
    │ Active │ │ Active │ │ Offline│ ✗ Lost
    └────────┘ └────────┘ └────────┘
    ✓ Received ✓ Received

Use cases:
  - Real-time notifications
  - Live dashboards
  - Chat applications
  - Cache invalidation

STREAMS (Persistent log)
┌────────────────┐
│   Producer     │
└────────┬───────┘
         │ XADD stream * field value
         ▼
┌─────────────────────────────────────────┐
│  Redis Stream (Persistent)              │
│  ┌───────────────────────────────────┐  │
│  │ [E1][E2][E3][E4][E5]              │  │
│  │ Stored, ordered, replayable       │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
         │         │         │
         ▼         ▼         ▼
    ┌────────┐ ┌────────┐ ┌────────┐
    │ Cons 1 │ │ Cons 2 │ │ Cons 3 │
    │ E1, E4 │ │ E2, E5 │ │ Offline│
    └────────┘ └────────┘ └────────┘
    ✓ ACK      ✓ ACK      ⏳ Pending
                          (Can claim later)

Use cases:
  - Event sourcing
  - Task queues
  - Audit logs
  - Data pipelines

┌─────────────────────────────────────────────────────────┐
│                  Decision Matrix                        │
├─────────────────────────┬───────────┬───────────────────┤
│ Feature                 │  Pub/Sub  │     Streams       │
├─────────────────────────┼───────────┼───────────────────┤
│ Persistence             │    ✗      │        ✓          │
│ Message history         │    ✗      │        ✓          │
│ Consumer groups         │    ✗      │        ✓          │
│ Acknowledgments         │    ✗      │        ✓          │
│ Replay capability       │    ✗      │        ✓          │
│ Memory overhead         │   Low     │     Medium        │
│ Latency                 │  <1ms     │      <5ms         │
│ Guaranteed delivery     │    ✗      │        ✓          │
└─────────────────────────┴───────────┴───────────────────┘
```

## Prerequisites

Before implementing this pattern, review:

- [Pub/Sub documentation]({{< relref "/develop/data-types/pubsub" >}}) - Pub/Sub basics
- [Streams documentation]({{< relref "/develop/data-types/streams" >}}) - Streams basics
- [Event pipelines]({{< relref "/develop/patterns/ingestion/streams-event-pipeline" >}}) - Streams patterns
- [Consumer groups]({{< relref "/develop/patterns/ingestion/consumer-groups" >}}) - Consumer group patterns

## Decision guide

### Use Pub/Sub when:

1. **Fire-and-forget messaging** - Don't need message persistence
2. **Real-time notifications** - Broadcast to active subscribers
3. **Simple fan-out** - Same message to multiple subscribers
4. **Low latency critical** - Minimal overhead required
5. **Ephemeral data** - Messages have no value after delivery

**Examples:**
- Live notifications (user logged in, new comment)
- Cache invalidation signals
- Real-time dashboards
- Chat messages (if history not needed)
- System alerts

### Use Streams when:

1. **Message persistence** - Need to store messages
2. **Consumer groups** - Load balance across workers
3. **Message history** - Replay or audit messages
4. **Guaranteed delivery** - Track acknowledgments
5. **Offline consumers** - Consumers can catch up

**Examples:**
- Event sourcing
- Task queues
- Order processing
- Audit logs
- IoT sensor data
- Chat with history

## Implementation

### Pub/Sub example

**Python publisher:**

```python
import redis

r = redis.Redis(host='localhost', port=6379, decode_responses=True)

# Publish message
r.publish('notifications', 'User logged in')
r.publish('cache:invalidate', 'user:123')
```

**Python subscriber:**

```python
# Subscribe to channels
pubsub = r.pubsub()
pubsub.subscribe('notifications', 'cache:invalidate')

# Listen for messages
for message in pubsub.listen():
    if message['type'] == 'message':
        channel = message['channel']
        data = message['data']
        print(f"Received on {channel}: {data}")
```

**Pattern matching:**

```python
# Subscribe to pattern
pubsub.psubscribe('cache:*')

for message in pubsub.listen():
    if message['type'] == 'pmessage':
        pattern = message['pattern']
        channel = message['channel']
        data = message['data']
        print(f"Matched {pattern} on {channel}: {data}")
```

### Streams example

**Python producer:**

```python
# Add message to stream
message_id = r.xadd('events:orders', {
    'order_id': '12345',
    'customer_id': '67890',
    'amount': '99.99'
})

print(f"Added message: {message_id}")
```

**Python consumer with consumer group:**

```python
# Create consumer group
try:
    r.xgroup_create('events:orders', 'processors', id='0', mkstream=True)
except redis.ResponseError:
    pass  # Group already exists

# Read messages
while True:
    messages = r.xreadgroup(
        groupname='processors',
        consumername='worker-1',
        streams={'events:orders': '>'},
        count=10,
        block=1000
    )
    
    for stream_name, stream_messages in messages:
        for message_id, data in stream_messages:
            # Process message
            print(f"Processing: {data}")
            
            # Acknowledge
            r.xack('events:orders', 'processors', message_id)
```

## Comparison table

| Feature | Pub/Sub | Streams |
|---------|---------|---------|
| **Persistence** | No | Yes |
| **Message history** | No | Yes |
| **Replay** | No | Yes |
| **Consumer groups** | No | Yes |
| **Acknowledgments** | No | Yes |
| **Offline consumers** | Messages lost | Can catch up |
| **Memory usage** | Minimal | Grows with messages |
| **Latency** | Lower | Slightly higher |
| **Ordering** | Per channel | Per stream |
| **Pattern matching** | Yes | No |
| **Max throughput** | Very high | High |

## Hybrid approach

Use both for different purposes in the same application.

**Python example:**

```python
def process_order(order_data):
    """Process order using both Streams and Pub/Sub"""
    
    # 1. Store in Stream for persistence and processing
    message_id = r.xadd('events:orders', order_data)
    
    # 2. Publish notification for real-time updates
    r.publish('notifications:orders', f"New order: {order_data['order_id']}")
    
    # 3. Invalidate cache
    r.publish('cache:invalidate', f"user:{order_data['customer_id']}")
    
    return message_id

# Process order
order = {
    'order_id': '12345',
    'customer_id': '67890',
    'amount': '99.99'
}
process_order(order)
```

## Migration strategies

### From Pub/Sub to Streams

When you need to add persistence to existing Pub/Sub:

```python
def publish_with_persistence(channel, message):
    """Publish to both Pub/Sub and Streams"""
    # Publish for real-time subscribers
    r.publish(channel, message)
    
    # Also store in Stream
    stream_key = f"stream:{channel}"
    r.xadd(stream_key, {'data': message})
    
    # Trim to keep last 1000 messages
    r.xtrim(stream_key, maxlen=1000, approximate=True)
```

### From Streams to Pub/Sub

When you realize you don't need persistence:

```python
def stream_to_pubsub_bridge():
    """Bridge Stream messages to Pub/Sub"""
    last_id = '0-0'
    
    while True:
        messages = r.xread({'events:orders': last_id}, count=10, block=1000)
        
        for stream_name, stream_messages in messages:
            for message_id, data in stream_messages:
                # Publish to Pub/Sub
                r.publish('orders', str(data))
                last_id = message_id
```

## Performance considerations

### Pub/Sub performance

```python
# High-throughput publishing
pipe = r.pipeline()
for i in range(1000):
    pipe.publish('channel', f'message-{i}')
pipe.execute()
```

### Streams performance

```python
# Batch add to Stream
pipe = r.pipeline()
for i in range(1000):
    pipe.xadd('events', {'data': f'message-{i}'})
pipe.execute()

# Trim regularly to control memory
r.xtrim('events', maxlen=10000, approximate=True)
```

## Redis Cloud setup

### Pub/Sub configuration

- **No persistence** - Messages not stored
- **Memory** - Minimal (only active subscriptions)
- **Scaling** - Subscribers can be on different nodes
- **Monitoring** - Use PUBSUB NUMSUB to track subscribers

### Streams configuration

- **Persistence** - Messages stored in memory
- **Memory** - Plan for message retention (trim strategy)
- **Scaling** - Consumer groups distribute load
- **Monitoring** - Use XINFO to track lag and pending messages

## Common pitfalls

1. **Using Pub/Sub for critical messages** - Messages lost if no subscribers
2. **Not trimming Streams** - Unbounded memory growth
3. **Mixing patterns incorrectly** - Use each for its strengths
4. **Not handling reconnection** - Pub/Sub loses messages during disconnect
5. **Ignoring consumer lag** - Streams can accumulate unprocessed messages

## Related patterns

- [Event pipelines]({{< relref "/develop/patterns/ingestion/streams-event-pipeline" >}}) - Streams for events
- [Consumer groups]({{< relref "/develop/patterns/ingestion/consumer-groups" >}}) - Parallel processing
- [Distributed locks]({{< relref "/develop/clients/patterns/distributed-locks" >}}) - Coordination

## More information

- [Pub/Sub documentation]({{< relref "/develop/data-types/pubsub" >}})
- [Streams documentation]({{< relref "/develop/data-types/streams" >}})
- [PUBLISH command]({{< relref "/commands/publish" >}})
- [SUBSCRIBE command]({{< relref "/commands/subscribe" >}})
- [XADD command]({{< relref "/commands/xadd" >}})
- [XREADGROUP command]({{< relref "/commands/xreadgroup" >}})

