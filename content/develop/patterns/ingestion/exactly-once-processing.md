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
description: Achieve reliable message processing with idempotency and Redis Functions
linkTitle: Exactly-once processing
title: How do I achieve exactly-once processing?
weight: 3
---

## Problem

You need to guarantee that each event is processed exactly once, even when:

- Consumers crash and restart
- Network failures cause retries
- Messages are redelivered from pending lists
- Multiple consumers might receive the same message

Processing the same event twice can cause serious issues like duplicate charges, double inventory updates, or inconsistent state.

## Solution overview

Exactly-once processing requires combining multiple techniques:

1. **Idempotency keys** - Unique identifiers to detect duplicate processing
2. **Atomic operations** - Use Redis Functions or Lua scripts for atomic check-and-process
3. **Deduplication tracking** - Store processed message IDs with TTL
4. **Stream acknowledgments** - Only acknowledge after successful processing

Redis Functions provide the best approach for exactly-once semantics by executing atomic operations server-side.

**Architecture:**

```
┌──────────────────────────────────────────────────────────┐
│         Exactly-Once Processing Pattern                  │
└──────────────────────────────────────────────────────────┘

Event arrives: {id: "evt_123", amount: 100}
     │
     ▼
┌─────────────────────────────────────────────────────┐
│  1. Check if already processed                      │
│     GET processed:evt_123                           │
│     ┌──────────────────────────────────────┐        │
│     │ Deduplication Set                    │        │
│     │ processed:evt_123 = "done" (TTL 24h) │        │
│     └──────────────────────────────────────┘        │
└─────────────────────────────────────────────────────┘
     │
     ├─── Already processed? ───┐
     │                          │
     ▼ NO                       ▼ YES
┌──────────────────────┐   ┌──────────────┐
│ 2. Process Event     │   │ Skip & ACK   │
│    (Atomic)          │   └──────────────┘
│                      │
│ Redis Function:      │
│ ┌────────────────┐   │
│ │ if not exists  │   │
│ │   process()    │   │
│ │   mark done    │   │
│ │   return ok    │   │
│ │ else           │   │
│ │   return skip  │   │
│ └────────────────┘   │
└──────────────────────┘
     │
     ▼
┌──────────────────────┐
│ 3. Mark Processed    │
│    SET processed:    │
│    evt_123 "done"    │
│    EX 86400          │
└──────────────────────┘
     │
     ▼
┌──────────────────────┐
│ 4. ACK to Stream     │
│    XACK stream       │
│    group msg_id      │
└──────────────────────┘

Result: Event processed exactly once, even with:
  - Consumer crashes
  - Network retries
  - Duplicate messages
```

## Prerequisites

Before implementing this pattern, review:

- [Redis Functions]({{< relref "/develop/programmability/functions-intro" >}}) - Server-side atomic operations
- [Consumer groups]({{< relref "/develop/patterns/ingestion/consumer-groups" >}}) - Reliable message delivery
- [Transactions]({{< relref "/develop/using-commands/transactions" >}}) - MULTI/EXEC for atomicity
- [Lua scripting]({{< relref "/develop/programmability/eval-intro" >}}) - Alternative to Functions

## Implementation

### Approach 1: Idempotency keys with SET NX

The simplest approach uses `SET NX` to track processed messages.

**Python example:**

```python
import redis
import json

r = redis.Redis(host='localhost', port=6379, decode_responses=True)

def process_message_idempotent(message_id, data):
    # Create idempotency key
    idempotency_key = f"processed:{message_id}"
    
    # Try to set the key (only succeeds if not already processed)
    # Set TTL to prevent unbounded growth
    was_set = r.set(idempotency_key, '1', nx=True, ex=86400)  # 24 hour TTL
    
    if not was_set:
        print(f"Message {message_id} already processed, skipping")
        return False
    
    try:
        # Process the message
        process_order(data)
        return True
    except Exception as e:
        # If processing fails, delete the idempotency key to allow retry
        r.delete(idempotency_key)
        raise

# Consumer loop
consumer_name = "worker-1"
while True:
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
            if process_message_idempotent(message_id, data):
                # Only acknowledge if successfully processed
                r.xack('events:orders', 'order_processors', message_id)
```

**Node.js example:**

```javascript
async function processMessageIdempotent(messageId, data) {
  const idempotencyKey = `processed:${messageId}`;
  
  // Try to set the key (only succeeds if not already processed)
  const wasSet = await client.set(idempotencyKey, '1', {
    NX: true,
    EX: 86400  // 24 hour TTL
  });
  
  if (!wasSet) {
    console.log(`Message ${messageId} already processed, skipping`);
    return false;
  }
  
  try {
    // Process the message
    await processOrder(data);
    return true;
  } catch (err) {
    // If processing fails, delete the idempotency key to allow retry
    await client.del(idempotencyKey);
    throw err;
  }
}
```

### Approach 2: Redis Functions for atomic processing

Redis Functions provide true atomicity by executing check-and-process operations server-side.

**Register a Redis Function:**

```lua
#!lua name=orderprocessing

local function process_order_once(keys, args)
    local idempotency_key = keys[1]
    local order_key = keys[2]
    local order_data = args[1]
    
    -- Check if already processed
    if redis.call('EXISTS', idempotency_key) == 1 then
        return {ok = false, reason = 'already_processed'}
    end
    
    -- Mark as processed (with TTL)
    redis.call('SETEX', idempotency_key, 86400, '1')
    
    -- Process the order atomically
    redis.call('JSON.SET', order_key, '$', order_data)
    
    -- Update inventory, counters, etc.
    redis.call('HINCRBY', 'inventory', 'product_123', -1)
    redis.call('INCR', 'orders:count')
    
    return {ok = true}
end

redis.register_function('process_order_once', process_order_once)
```

**Call the function from Python:**

```python
# Load the function library (do this once at startup)
with open('orderprocessing.lua', 'r') as f:
    function_code = f.read()
    r.function_load(function_code, replace=True)

# Process messages
for stream_name, stream_messages in messages:
    for message_id, data in stream_messages:
        idempotency_key = f"processed:{message_id}"
        order_key = f"order:{data['order_id']}"
        order_json = json.dumps(data)
        
        # Call the function atomically
        result = r.fcall(
            'process_order_once',
            2,  # number of keys
            idempotency_key,
            order_key,
            order_json
        )
        
        if result['ok']:
            # Acknowledge only if processed successfully
            r.xack('events:orders', 'order_processors', message_id)
        else:
            print(f"Skipped duplicate: {message_id}")
            # Still acknowledge to remove from pending list
            r.xack('events:orders', 'order_processors', message_id)
```

### Approach 3: Application-level idempotency keys

For business-level deduplication, use application-specific idempotency keys.

**Python example:**

```python
def process_with_business_key(message_id, data):
    # Use business-level idempotency key (e.g., order ID + action)
    business_key = f"order:{data['order_id']}:action:{data['action']}"
    
    # Try to acquire lock with SET NX
    acquired = r.set(business_key, message_id, nx=True, ex=3600)
    
    if not acquired:
        # Check if this exact message was the one that acquired the lock
        existing_message_id = r.get(business_key)
        if existing_message_id == message_id:
            # This message already processed successfully
            return True
        else:
            # Different message for same business operation
            print(f"Duplicate business operation: {business_key}")
            return False
    
    try:
        # Process the order
        process_order(data)
        return True
    except Exception as e:
        # Release lock on failure to allow retry
        r.delete(business_key)
        raise
```

### Approach 4: Combining Streams with deduplication

Use Stream message IDs as natural idempotency keys.

```python
def process_stream_with_dedup(stream_key, group_name, consumer_name):
    while True:
        messages = r.xreadgroup(
            groupname=group_name,
            consumername=consumer_name,
            streams={stream_key: '>'},
            count=10,
            block=1000
        )
        
        if not messages:
            continue
        
        pipe = r.pipeline()
        for stream_name, stream_messages in messages:
            for message_id, data in stream_messages:
                idempotency_key = f"processed:{stream_key}:{message_id}"
                
                # Check and set in pipeline
                pipe.set(idempotency_key, '1', nx=True, ex=86400)
        
        # Execute all checks atomically
        results = pipe.execute()
        
        # Process only new messages
        idx = 0
        for stream_name, stream_messages in messages:
            for message_id, data in stream_messages:
                if results[idx]:  # SET NX succeeded
                    try:
                        process_order(data)
                        r.xack(stream_key, group_name, message_id)
                    except Exception as e:
                        # Delete idempotency key to allow retry
                        r.delete(f"processed:{stream_key}:{message_id}")
                        print(f"Error processing {message_id}: {e}")
                else:
                    # Already processed, just acknowledge
                    r.xack(stream_key, group_name, message_id)
                idx += 1
```

## Redis Cloud setup

When deploying exactly-once processing to Redis Cloud:

1. **Choose appropriate TTL** - Balance memory usage vs deduplication window
2. **Monitor idempotency key count** - Alert on unexpected growth
3. **Use Redis Functions** - Preferred for atomic operations
4. **Enable persistence** - Ensure idempotency keys survive restarts
5. **Set memory limits** - Prevent unbounded idempotency key growth

Example configuration:
- **Idempotency TTL**: 24-72 hours (based on retry window)
- **Memory**: Account for idempotency keys in sizing
- **Persistence**: AOF for durability
- **Eviction**: `noeviction` to prevent key loss

## Common pitfalls

1. **No TTL on idempotency keys** - Causes unbounded memory growth
2. **Not handling processing failures** - Delete idempotency key on failure to allow retry
3. **Wrong idempotency key** - Use message ID or business key, not timestamp
4. **Acknowledging before processing** - Always process first, then acknowledge
5. **Not using atomic operations** - Race conditions can cause duplicates

## Related patterns

- [Consumer groups]({{< relref "/develop/patterns/ingestion/consumer-groups" >}}) - Reliable message delivery
- [Event pipelines with Streams]({{< relref "/develop/patterns/ingestion/streams-event-pipeline" >}}) - Basic Streams usage
- [Atomic operations]({{< relref "/develop/patterns/data-modeling/atomic-operations" >}}) - Multi-key consistency
- [Workflows with Redis Functions]({{< relref "/develop/patterns/messaging/workflows-with-functions" >}}) - Orchestrate processing

## More information

- [Redis Functions documentation]({{< relref "/develop/programmability/functions-intro" >}})
- [Lua scripting guide]({{< relref "/develop/programmability/eval-intro" >}})
- [SET command]({{< relref "/commands/set" >}}) - NX option for idempotency
- [XACK command]({{< relref "/commands/xack" >}}) - Acknowledge messages
- [Transactions guide]({{< relref "/develop/using-commands/transactions" >}})

