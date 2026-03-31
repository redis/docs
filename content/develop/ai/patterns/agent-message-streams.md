---
title: "Agent message streams"
linkTitle: "Message streams"
description: "Event-driven agent coordination with persistent message history and at-most-once delivery guarantees"
weight: 15
---

## Pattern: Agent message streams

**Intent**: Enable reliable event-driven agent coordination with persistent message history, at-most-once delivery guarantees, and automatic failure recovery. This pattern provides ordered message logs that support event sourcing, multi-agent coordination, and complete audit trails.

AI agents need reliable message passing for event sourcing, multi-agent coordination, and audit trails. Traditional message queues either lose messages on consumer crash or lack idempotency guarantees (leading to duplicate processing). Pub/Sub loses messages if subscribers disconnect. Lists don't support consumer groups.

## The abstraction (developer experience)

Use Redis Streams with idempotent production for reliable agent messaging:

```python
from redis import Redis
from typing import Dict, Any, Optional, List
import json
import uuid
import time

class AgentMessageStream:
    """Reliable message stream for agent coordination with at-most-once delivery."""
    
    def __init__(self, redis_client: Redis, stream_name: str, producer_id: str):
        self.redis = redis_client
        self.stream = stream_name
        self.producer_id = producer_id  # Unique per agent instance
        
        # Configure idempotence (Redis 8.6+)
        # duration: how long to keep idempotent IDs (in seconds)
        # maxsize: max number of recent message IDs to track per producer
        try:
            self.redis.execute_command(
                'XCFGSET', stream_name,
                'DURATION', 300,  # 5 minutes
                'MAXSIZE', 1000   # Track last 1000 message IDs per producer
            )
        except Exception:
            pass  # Stream doesn't exist yet or Redis < 8.6
    
    def publish_event(
        self,
        event_type: str,
        data: Dict[str, Any],
        idempotent_id: Optional[str] = None
    ) -> str:
        """
        Publish event with at-most-once guarantee.

        Args:
            event_type: Type of event (e.g., 'agent.tool_called', 'agent.completed')
            data: Event payload
            idempotent_id: Optional unique ID for idempotency (auto-generated if None)

        Returns:
            Stream entry ID
        """
        if idempotent_id is None:
            idempotent_id = str(uuid.uuid4())

        # Redis 8.6+ idempotent production
        message = {
            'event_type': event_type,
            'data': json.dumps(data),
            'timestamp': time.time(),
            'producer_id': self.producer_id
        }

        try:
            # IDMP: producer_id + idempotent_id ensures at-most-once
            entry_id = self.redis.execute_command(
                'XADD', self.stream, 'IDMP', self.producer_id, idempotent_id, '*',
                *[item for pair in message.items() for item in pair]
            )
            return entry_id
        except Exception:
            # Fallback for Redis < 8.6 (no idempotency guarantee)
            return self.redis.xadd(self.stream, message)

    def create_consumer_group(self, group_name: str, start_from: str = '$'):
        """Create consumer group. start_from: '0' (all history) or '$' (new only)."""
        try:
            self.redis.xgroup_create(self.stream, group_name, start_from, mkstream=True)
        except Exception as e:
            if 'BUSYGROUP' not in str(e):
                raise

    def consume_events(
        self,
        group_name: str,
        consumer_name: str,
        count: int = 10,
        block_ms: int = 5000
    ) -> List[Dict[str, Any]]:
        """
        Consume events from stream using consumer group.

        Args:
            group_name: Consumer group name
            consumer_name: Unique consumer identifier
            count: Max messages to fetch
            block_ms: Block up to this many milliseconds waiting for messages

        Returns:
            List of parsed events
        """
        # Read new messages ('>') with blocking
        response = self.redis.xreadgroup(
            group_name,
            consumer_name,
            {self.stream: '>'},
            count=count,
            block=block_ms
        )

        events = []
        if response:
            for stream_name, messages in response:
                for msg_id, fields in messages:
                    event = {
                        'id': msg_id,
                        'event_type': fields.get(b'event_type', b'').decode('utf-8'),
                        'data': json.loads(fields.get(b'data', b'{}').decode('utf-8')),
                        'timestamp': float(fields.get(b'timestamp', 0)),
                        'producer_id': fields.get(b'producer_id', b'').decode('utf-8')
                    }
                    events.append(event)

        return events

    def acknowledge(self, group_name: str, *message_ids):
        """Mark messages as successfully processed."""
        if message_ids:
            self.redis.xack(self.stream, group_name, *message_ids)

    def claim_stalled_messages(
        self,
        group_name: str,
        consumer_name: str,
        min_idle_ms: int = 60000,
        count: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Claim messages stalled for more than min_idle_ms (default: 60 seconds).
        Use for failure recovery when consumers crash.
        """
        # XAUTOCLAIM: Automatically find and claim stalled messages
        result = self.redis.execute_command(
            'XAUTOCLAIM', self.stream, group_name, consumer_name,
            str(min_idle_ms), '0-0', 'COUNT', count
        )

        # Parse claimed messages
        claimed = []
        if result and len(result) > 1:
            for msg in result[1]:
                msg_id, fields = msg[0], msg[1]
                event = {
                    'id': msg_id,
                    'event_type': fields.get(b'event_type', b'').decode('utf-8'),
                    'data': json.loads(fields.get(b'data', b'{}').decode('utf-8')),
                    'timestamp': float(fields.get(b'timestamp', 0))
                }
                claimed.append(event)

        return claimed


# Example: Multi-agent task coordination
stream = AgentMessageStream(
    redis_client=Redis(host='localhost', port=6379, decode_responses=True),
    stream_name='agent:tasks',
    producer_id='agent-orchestrator-1'
)

# Agent orchestrator publishes task
task_id = 'task-123'
stream.publish_event(
    event_type='task.assigned',
    data={'task_id': task_id, 'action': 'web_search', 'query': 'Redis 8.6 features'},
    idempotent_id=task_id  # Use task_id as idempotent ID
)

# Worker agents consume tasks
stream.create_consumer_group('task-workers', start_from='$')

# Worker 1 processes tasks
events = stream.consume_events(
    group_name='task-workers',
    consumer_name='worker-1',
    count=5,
    block_ms=5000
)

for event in events:
    try:
        # Process task
        print(f"Processing {event['event_type']}: {event['data']}")
        result = execute_task(event['data'])

        # Publish result
        stream.publish_event(
            event_type='task.completed',
            data={'task_id': event['data']['task_id'], 'result': result},
            idempotent_id=f"result-{event['data']['task_id']}"
        )

        # Acknowledge
        stream.acknowledge('task-workers', event['id'])
    except Exception as e:
        print(f"Task failed: {e}")
        # Don't acknowledge - message stays in pending list

# Recovery worker claims stalled messages
stalled = stream.claim_stalled_messages(
    group_name='task-workers',
    consumer_name='recovery-worker',
    min_idle_ms=60000,  # Claim messages pending > 60 seconds
    count=10
)
```

**Why this works**: Redis Streams with IDMP (Redis 8.6+) prevent duplicate messages even when producers retry after failures. Consumer groups enable load balancing across workers. XAUTOCLAIM provides automatic failure recovery without manual intervention.

## The raw commands (machine verification)

Ground truth Redis commands for debugging and direct implementation:

```bash
# Configure idempotent production (Redis 8.6+)
XCFGSET agent:tasks DURATION 300 MAXSIZE 1000

# Publish event with idempotency
XADD agent:tasks IDMP agent-orchestrator-1 task-123 * \
  event_type "task.assigned" \
  data "{\"task_id\":\"task-123\",\"action\":\"web_search\"}" \
  timestamp "1709251234.567" \
  producer_id "agent-orchestrator-1"

# Create consumer group (start from new messages)
XGROUP CREATE agent:tasks task-workers $ MKSTREAM

# Consumer reads new messages (blocking 5 seconds)
XREADGROUP GROUP task-workers worker-1 COUNT 5 BLOCK 5000 STREAMS agent:tasks >

# Acknowledge processed messages
XACK agent:tasks task-workers 1709251234567-0

# Automatic claim of stalled messages (Redis 6.2+)
XAUTOCLAIM agent:tasks task-workers recovery-worker 60000 0-0 COUNT 10

# Manual claim (pre-6.2)
XPENDING agent:tasks task-workers - + 10
XCLAIM agent:tasks task-workers recovery-worker 60000 1709251234567-0

# Read stream from beginning (event replay)
XREAD STREAMS agent:tasks 0

# Read range of events
XRANGE agent:tasks 1709251234567-0 + COUNT 100

# Get stream info
XINFO STREAM agent:tasks
XINFO GROUPS agent:tasks
XINFO CONSUMERS agent:tasks task-workers

# Get pending messages for consumer
XPENDING agent:tasks task-workers - + 10 worker-1

# Trim stream to last 10,000 messages
XTRIM agent:tasks MAXLEN ~ 10000

# Trim by minimum ID (time-based retention)
XTRIM agent:tasks MINID 1709251234567-0
```

## Alternative: Redis 8.6 idempotent production

Redis 8.6 introduces native at-most-once delivery guarantees through idempotent message production:

**Key improvements:**

1. **IDMP (idempotent production)**: Prevents duplicate messages even when producers retry after network failures or crashes
2. **XCFGSET**: Configure idempotency settings per stream (duration and maxsize)
3. **Producer ID + Idempotent ID**: Unique combination identifies duplicate messages

**When to use IDMP:**

- **Critical agent actions**: Tool calls, API requests, database writes that must not duplicate
- **Financial operations**: Payments, transfers, billing events
- **Multi-producer scenarios**: Multiple agent instances publishing to same stream
- **Network-unreliable environments**: Cloud functions, distributed systems with retries

**Configuration guidelines:**

```bash
# duration: How long to remember idempotent IDs (in seconds)
# Set based on max crash recovery time
# Example: If agents restart within 5 minutes after crash
XCFGSET agent:tasks DURATION 300

# maxsize: Max idempotent IDs to track per producer
# Set based on: (messages/sec per producer) * (mark-as-delivered delay in sec)
# Example: 100 msg/sec * 2 sec delay = 200 IDs, use 500 with margin
XCFGSET agent:tasks MAXSIZE 500
```

**Before Redis 8.6 (no idempotency):**

You must implement application-level deduplication:

```python
def publish_with_dedup(stream, event_type, data, event_id):
    # Check if already published
    if redis.sismember(f'published:{stream}', event_id):
        return None

    # Publish
    msg_id = redis.xadd(stream, {'event_type': event_type, 'data': data})

    # Mark as published (with TTL matching expected recovery time)
    redis.setex(f'dedup:{stream}:{event_id}', 300, '1')
    redis.sadd(f'published:{stream}', event_id)
    redis.expire(f'published:{stream}', 300)

    return msg_id
```

**Redis 8.6 eliminates this complexity** - idempotency is built into Streams.

## Production patterns

### Multi-tenant isolation

Separate streams per tenant or per agent workflow:

```python
# Per-tenant streams
stream_name = f'agent:tasks:tenant_{tenant_id}'

# Per-workflow streams
stream_name = f'agent:workflow_{workflow_id}:events'

# Advantages:
# - Independent scaling and trimming policies
# - Security isolation
# - Simpler debugging (filter by tenant/workflow)
```

### Memory management and trimming

Streams grow indefinitely without trimming. Configure retention policies:

```python
# Strategy 1: Size-based (keep last N messages)
redis.xtrim('agent:tasks', maxlen=10000, approximate=True)

# Strategy 2: Time-based (keep messages from last N hours)
import time
cutoff_timestamp = int((time.time() - 3600 * 24) * 1000)  # 24 hours ago
cutoff_id = f'{cutoff_timestamp}-0'
redis.xtrim('agent:tasks', minid=cutoff_id)

# Strategy 3: Hybrid (size + time)
redis.xtrim('agent:tasks', maxlen=100000, approximate=True)
cutoff_id = f'{int((time.time() - 3600 * 72) * 1000)}-0'  # 72 hours
redis.xtrim('agent:tasks', minid=cutoff_id)
```

**Trimming options:**

- `approximate=True`: Faster trimming, may keep slightly more messages (use in production)
- `approximate=False`: Exact trimming, slower for large streams
- Run trimming in background job (cron/scheduler), not in hot path

### Consumer failure recovery

Implement monitoring for stalled messages:

```python
import schedule
import time

def recover_stalled_messages():
    """Background job: claim messages stalled > 60 seconds."""
    streams = ['agent:tasks', 'agent:results']

    for stream_name in streams:
        # Get all consumer groups
        groups = redis.execute_command('XINFO', 'GROUPS', stream_name)

        for group_info in groups:
            group_name = group_info[1]

            # Claim stalled messages
            claimed = redis.execute_command(
                'XAUTOCLAIM', stream_name, group_name, 'recovery-worker',
                '60000',  # 60 seconds
                '0-0', 'COUNT', 100
            )

            if claimed and len(claimed[1]) > 0:
                print(f'Claimed {len(claimed[1])} stalled messages from {stream_name}/{group_name}')

                # Process or re-route claimed messages
                for msg in claimed[1]:
                    handle_stalled_message(stream_name, group_name, msg)

# Run every 30 seconds
schedule.every(30).seconds.do(recover_stalled_messages)

while True:
    schedule.run_pending()
    time.sleep(1)
```

### Monitoring and observability

Track stream health metrics:

```python
def get_stream_metrics(stream_name: str, group_name: str) -> dict:
    """Get stream and consumer group metrics."""
    # Stream info
    stream_info = redis.execute_command('XINFO', 'STREAM', stream_name)
    stream_length = stream_info[1]  # Total messages

    # Consumer group info
    groups = redis.execute_command('XINFO', 'GROUPS', stream_name)
    group_data = next((g for g in groups if g[1] == group_name), None)

    if not group_data:
        return {}

    pending_count = group_data[3]  # Total pending messages
    last_delivered_id = group_data[5]  # Last delivered ID

    # Per-consumer info
    consumers = redis.execute_command('XINFO', 'CONSUMERS', stream_name, group_name)
    active_consumers = len(consumers)

    # Calculate lag (messages not yet delivered)
    lag = stream_length - pending_count

    return {
        'stream_length': stream_length,
        'pending_count': pending_count,
        'active_consumers': active_consumers,
        'lag': lag,
        'last_delivered_id': last_delivered_id
    }

# Alert if lag > threshold
metrics = get_stream_metrics('agent:tasks', 'task-workers')
if metrics['lag'] > 1000:
    alert('High stream lag detected', metrics)
if metrics['pending_count'] > 500:
    alert('Many pending messages - possible consumer failures', metrics)
```

### Event sourcing and replay

Reconstruct agent state by replaying historical events:

```python
def rebuild_agent_state(agent_id: str) -> dict:
    """Rebuild agent state from event stream."""
    stream_name = f'agent:{agent_id}:events'
    state = {'task_count': 0, 'completed': [], 'failed': []}

    # Read all events from beginning
    last_id = '0'
    while True:
        events = redis.xread({stream_name: last_id}, count=100)
        if not events:
            break

        for stream, messages in events:
            for msg_id, fields in messages:
                event_type = fields.get(b'event_type', b'').decode('utf-8')
                data = json.loads(fields.get(b'data', b'{}').decode('utf-8'))

                # Apply event to state
                if event_type == 'task.assigned':
                    state['task_count'] += 1
                elif event_type == 'task.completed':
                    state['completed'].append(data['task_id'])
                elif event_type == 'task.failed':
                    state['failed'].append(data['task_id'])

                last_id = msg_id

    return state
```

## Performance characteristics

**Throughput:**
- **Single stream**: ~100K-500K messages/sec (depends on message size and pipeline usage)
- **Consumer groups**: Scales horizontally - each consumer processes different messages
- **Blocking reads**: More efficient than polling - use `BLOCK` parameter in XREADGROUP

**Latency:**
- **Sub-millisecond** for XADD and XREADGROUP on warm streams
- **Network RTT** dominates in distributed systems - use pipelining for batch operations

**Memory usage:**
- **~200-500 bytes** per message (depends on field count and data size)
- **10M messages** ≈ 2-5 GB RAM (use XTRIM to limit growth)
- Stream metadata overhead: ~1 KB per consumer group

**Scaling patterns:**
- **Horizontal (consumer count)**: Add more consumers to consumer group for parallel processing
- **Vertical (stream count)**: Partition by tenant, workflow, or key range for independent scaling
- **Hybrid**: Combine both - multiple streams, each with multiple consumer groups

## Benefits of this pattern

**Safety (at-most-once delivery):**
- Redis 8.6 IDMP prevents duplicate messages even when producers retry after failures
- Consumer groups with acknowledgment ensure messages aren't lost on consumer crash
- XAUTOCLAIM enables automatic failure recovery without manual intervention

**Accuracy (ordered event replay):**
- Streams maintain strict insertion order via time-based IDs
- Event sourcing enables exact state reconstruction from historical events
- Range queries (XRANGE) support precise event filtering and audit trails

**Efficiency (minimal overhead):**
- Append-only log structure optimizes for write-heavy workloads
- Consumer groups eliminate need for fan-out replication (unlike Pub/Sub)
- Blocking reads reduce polling overhead and CPU usage

**Flexibility (multiple consumption patterns):**
- **Fan-out**: Multiple consumer groups read same stream independently
- **Load balancing**: Single consumer group distributes messages across workers
- **Event sourcing**: Read stream from beginning for state reconstruction
- **Hybrid**: Combine patterns - some groups for real-time processing, others for analytics

## Comparison with alternatives

| Feature | Redis Streams | Pub/Sub | Lists (LMOVE pattern) | Kafka |
|---------|---------------|---------|----------------------|-------|
| **Persistence** | Yes | No | Yes | Yes |
| **Message history** | Yes | No | No | Yes |
| **Consumer groups** | Yes | No | No | Yes |
| **At-most-once** | Yes (8.6+) | No | No | Yes (with config) |
| **Ordered delivery** | Yes | No | Yes | Yes (per partition) |
| **Failure recovery** | Built-in (XAUTOCLAIM) | Manual | Manual (LMOVE) | Built-in |
| **Latency** | Sub-ms | Sub-ms | Sub-ms | 1-10ms |
| **Setup complexity** | Low | Low | Low | High |

**When to use Redis Streams:**
- Agent coordination requiring message history
- Event sourcing architectures
- Multi-consumer scenarios with failure recovery
- Systems requiring both real-time processing and historical replay

**When to use alternatives:**
- **Pub/Sub**: Fire-and-forget notifications, no persistence needed
- **Lists**: Simple queues, single consumer, no history needed
- **Kafka**: Multi-datacenter replication, extreme throughput (millions/sec), complex windowing

## References

- [Redis Streams commands](https://redis.io/docs/latest/commands/?group=stream)
- [Redis 8.6 idempotent production](https://redis.io/blog/announcing-redis-86-performance-improvements-streams/)
- [Streams event sourcing pattern (antirez.com)](https://redis.antirez.com/fundamental/streams-event-sourcing.html)
- [Streams consumer group patterns (antirez.com)](https://redis.antirez.com/fundamental/streams-consumer-group-patterns.html)
- [Reliable queue pattern (antirez.com)](https://redis.antirez.com/fundamental/reliable-queue.html)


