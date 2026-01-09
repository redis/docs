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
description: Scale event processing with consumer groups for parallel processing
linkTitle: Consumer groups
title: How do I implement consumer groups for parallel processing?
weight: 2
---

## Problem

You need to scale event processing by:

- Distributing work across multiple consumer processes
- Ensuring each event is processed by only one consumer in the group
- Handling consumer failures without losing events
- Monitoring consumer lag and pending messages
- Balancing load across consumers automatically

A single consumer reading from a stream can become a bottleneck as event volume grows.

## Solution overview

Redis Streams consumer groups provide automatic load balancing across multiple consumers. Each consumer in a group receives different messages, and Redis tracks which messages have been delivered and acknowledged.

Key features:
- **Automatic distribution** - Redis assigns messages to different consumers
- **Pending entries list** - Track unacknowledged messages per consumer
- **Failure recovery** - Claim abandoned messages from failed consumers
- **Multiple groups** - Different consumer groups can process the same stream independently

**Architecture:**

```
                    ┌──────────────────────────────────┐
                    │      Redis Stream                │
                    │      events:orders               │
                    │  ┌────┬────┬────┬────┬────┬────┐│
                    │  │ E1 │ E2 │ E3 │ E4 │ E5 │ E6 ││
                    │  └────┴────┴────┴────┴────┴────┘│
                    └──────────────────────────────────┘
                              │           │
                    ┌─────────┴───────┐   │
                    │                 │   │
                    ▼                 ▼   ▼
        ┌─────────────────────┐  ┌─────────────────────┐
        │  Consumer Group A   │  │  Consumer Group B   │
        │  (Analytics)        │  │  (Notifications)    │
        ├─────────────────────┤  ├─────────────────────┤
        │ ┌─────────────────┐ │  │ ┌─────────────────┐ │
        │ │ Consumer A1     │ │  │ │ Consumer B1     │ │
        │ │ Reads: E1, E4   │ │  │ │ Reads: E1, E3   │ │
        │ └─────────────────┘ │  │ └─────────────────┘ │
        │ ┌─────────────────┐ │  │ ┌─────────────────┐ │
        │ │ Consumer A2     │ │  │ │ Consumer B2     │ │
        │ │ Reads: E2, E5   │ │  │ │ Reads: E2, E4   │ │
        │ └─────────────────┘ │  │ └─────────────────┘ │
        │ ┌─────────────────┐ │  │ ┌─────────────────┐ │
        │ │ Consumer A3     │ │  │ │ Consumer B3     │ │
        │ │ Reads: E3, E6   │ │  │ │ Reads: E5, E6   │ │
        │ └─────────────────┘ │  │ └─────────────────┘ │
        └─────────────────────┘  └─────────────────────┘
         Load balanced within      Load balanced within
         group (no duplicates)     group (no duplicates)
```

## Prerequisites

Before implementing this pattern, review:

- [Redis Streams]({{< relref "/develop/data-types/streams" >}}) - Consumer groups section
- [Event pipelines with Streams]({{< relref "/develop/patterns/ingestion/streams-event-pipeline" >}}) - Basic Streams usage
- [Client libraries]({{< relref "/develop/clients" >}}) - Language-specific consumer group support

## Implementation

### Step 1: Create a consumer group

Create a consumer group for a stream. The group tracks the last delivered message ID.

{{< clients-example stream_tutorial consumer_group_create >}}
> XGROUP CREATE race:france france_riders $ MKSTREAM
OK
{{< /clients-example >}}

The `$` means start consuming from new messages. Use `0` to process all existing messages.

**Python example:**

```python
import redis

r = redis.Redis(host='localhost', port=6379, decode_responses=True)

# Create consumer group (creates stream if it doesn't exist)
try:
    r.xgroup_create('events:orders', 'order_processors', id='$', mkstream=True)
    print("Consumer group created")
except redis.ResponseError as e:
    if "BUSYGROUP" in str(e):
        print("Consumer group already exists")
    else:
        raise
```

**Node.js example:**

```javascript
import { createClient } from 'redis';

const client = await createClient()
  .on('error', err => console.log('Redis Client Error', err))
  .connect();

// Create consumer group
try {
  await client.xGroupCreate('events:orders', 'order_processors', '$', {
    MKSTREAM: true
  });
  console.log('Consumer group created');
} catch (err) {
  if (err.message.includes('BUSYGROUP')) {
    console.log('Consumer group already exists');
  } else {
    throw err;
  }
}
```

### Step 2: Read messages as a consumer

Each consumer reads messages using `XREADGROUP` with a unique consumer name.

{{< clients-example stream_tutorial consumer_group_read >}}
> XREADGROUP GROUP france_riders Alice COUNT 1 STREAMS race:france >
1) 1) "race:france"
   2) 1) 1) "1692632086370-0"
         2) 1) "rider"
            2) "Castilla"
            3) "speed"
            4) "30.2"
{{< /clients-example >}}

The `>` means "give me new messages not yet delivered to any consumer in this group".

**Python example:**

```python
import time

consumer_name = "worker-1"

while True:
    # Read up to 10 messages, block for 1 second if none available
    messages = r.xreadgroup(
        groupname='order_processors',
        consumername=consumer_name,
        streams={'events:orders': '>'},
        count=10,
        block=1000
    )
    
    if not messages:
        continue
    
    for stream_name, stream_messages in messages:
        for message_id, data in stream_messages:
            try:
                # Process the message
                print(f"Processing order {data['order_id']}")
                process_order(data)
                
                # Acknowledge successful processing
                r.xack('events:orders', 'order_processors', message_id)
                
            except Exception as e:
                print(f"Error processing {message_id}: {e}")
                # Message remains in pending list for retry
```

**Node.js example:**

```javascript
const consumerName = 'worker-1';

while (true) {
  const messages = await client.xReadGroup(
    'order_processors',
    consumerName,
    [{ key: 'events:orders', id: '>' }],
    { COUNT: 10, BLOCK: 1000 }
  );
  
  if (!messages) continue;
  
  for (const { name, messages: streamMessages } of messages) {
    for (const { id, message } of streamMessages) {
      try {
        // Process the message
        console.log(`Processing order ${message.order_id}`);
        await processOrder(message);
        
        // Acknowledge successful processing
        await client.xAck('events:orders', 'order_processors', id);
        
      } catch (err) {
        console.error(`Error processing ${id}:`, err);
        // Message remains in pending list for retry
      }
    }
  }
}
```

### Step 3: Handle pending messages

Check for pending messages that weren't acknowledged (due to consumer failures).

```redis
# See pending messages for the group
XPENDING events:orders order_processors

# See detailed pending messages for a specific consumer
XPENDING events:orders order_processors - + 10 worker-1
```

**Python example:**

```python
# Check pending messages for this consumer
pending = r.xpending_range(
    'events:orders',
    'order_processors',
    min='-',
    max='+',
    count=10,
    consumername=consumer_name
)

for msg in pending:
    message_id = msg['message_id']
    idle_time = msg['time_since_delivered']
    
    # If message has been pending for more than 60 seconds, reprocess it
    if idle_time > 60000:  # milliseconds
        messages = r.xreadgroup(
            groupname='order_processors',
            consumername=consumer_name,
            streams={'events:orders': message_id},
            count=1
        )
        # Process and acknowledge
```

### Step 4: Claim abandoned messages

Claim messages from failed consumers using `XAUTOCLAIM` (Redis 6.2+).

```python
# Automatically claim messages idle for more than 60 seconds
claimed = r.xautoclaim(
    'events:orders',
    'order_processors',
    consumer_name,
    min_idle_time=60000,  # 60 seconds in milliseconds
    start_id='0-0',
    count=10
)

for message_id, data in claimed[1]:
    # Process claimed message
    process_order(data)
    r.xack('events:orders', 'order_processors', message_id)
```

## Redis Cloud setup

When deploying consumer groups to Redis Cloud:

1. **Scale consumers horizontally** - Add more consumer processes as load increases
2. **Monitor pending entries** - Alert when pending list grows too large
3. **Set idle timeouts** - Claim messages after reasonable timeout (e.g., 60s)
4. **Use unique consumer names** - Include hostname or process ID
5. **Handle rebalancing** - Consumers can join/leave dynamically

Example configuration:
- **Consumers**: Start with 3-5, scale based on lag
- **Block timeout**: 1000ms (1 second)
- **Batch size**: 10-100 messages per read
- **Claim timeout**: 60000ms (60 seconds)

## Common pitfalls

1. **Not acknowledging messages** - Always call `XACK` after successful processing
2. **Ignoring pending messages** - Implement periodic pending message checks
3. **Using same consumer name** - Each consumer instance needs a unique name
4. **No failure recovery** - Implement `XAUTOCLAIM` or manual claiming
5. **Creating group multiple times** - Handle `BUSYGROUP` error gracefully

## Related patterns

- [Event pipelines with Streams]({{< relref "/develop/patterns/ingestion/streams-event-pipeline" >}}) - Basic Streams usage
- [Exactly-once processing]({{< relref "/develop/patterns/ingestion/exactly-once-processing" >}}) - Guarantee message processing
- [Workflows with Redis Functions]({{< relref "/develop/patterns/messaging/workflows-with-functions" >}}) - Orchestrate processing

## More information

- [Redis Streams documentation]({{< relref "/develop/data-types/streams" >}})
- [XGROUP command]({{< relref "/commands/xgroup" >}})
- [XREADGROUP command]({{< relref "/commands/xreadgroup" >}})
- [XACK command]({{< relref "/commands/xack" >}})
- [XPENDING command]({{< relref "/commands/xpending" >}})
- [XAUTOCLAIM command]({{< relref "/commands/xautoclaim" >}})

