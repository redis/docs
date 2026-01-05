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
description: Implement time-based analytics and rate limiting with sorted sets
linkTitle: Sliding windows
title: How do I implement sliding window counters?
weight: 1
---

## Problem

You need to track metrics in sliding time windows:

- Count events in the last N minutes/hours/days
- Implement rate limiting (e.g., 100 requests per minute)
- Calculate rolling averages or trends
- Remove old data automatically
- Query metrics for any time range

Fixed time windows (hourly, daily) don't provide real-time insights and can have boundary issues.

## Solution overview

Redis sorted sets provide efficient sliding window counters by using timestamps as scores:

1. **Add events** - Use ZADD with timestamp as score
2. **Count in window** - Use ZCOUNT to count events in time range
3. **Remove old data** - Use ZREMRANGEBYSCORE to trim old events
4. **Query ranges** - Use ZRANGE to retrieve events in window

Sorted sets maintain O(log N) performance for all operations.

**Architecture:**

```
Time: ────────────────────────────────────────────────▶
      10:00   10:05   10:10   10:15   10:20   10:25

┌─────────────────────────────────────────────────────┐
│  Sorted Set: api:requests:user123                   │
│                                                      │
│  Score (timestamp)    Member (event_id)             │
│  ─────────────────    ──────────────                │
│  1699876800          event_001                      │
│  1699876805          event_002                      │
│  1699876810          event_003                      │
│  1699876815          event_004                      │
│  1699876820          event_005                      │
│  1699876825          event_006                      │
└─────────────────────────────────────────────────────┘
         │                                    │
         │◀──── 5 minute window ─────────────▶│
         │                                    │
         │                                    │
    Old events                           Current time
    (removed)                            (10:25)

Operations:
  ZADD    - Add new event with timestamp
  ZCOUNT  - Count events in [10:20, 10:25]
  ZREMRANGEBYSCORE - Remove events before 10:20
  ZRANGE  - Get events in window

Result: Real-time sliding window metrics
```

## Prerequisites

Before implementing this pattern, review:

- [Sorted sets]({{< relref "/develop/data-types/sorted-sets" >}}) - Sorted set documentation
- [Time-series data]({{< relref "/develop/data-types/timeseries" >}}) - RedisTimeSeries alternative
- [Pipelining]({{< relref "/develop/using-commands/pipelining" >}}) - Batch operations

## Implementation

### Step 1: Track events with timestamps

Add events to a sorted set using timestamps as scores.

**Python example:**

```python
import redis
import time

r = redis.Redis(host='localhost', port=6379, decode_responses=True)

def track_event(user_id, event_type="request"):
    """Track an event for a user"""
    key = f"events:{user_id}:{event_type}"
    timestamp = time.time()
    
    # Add event with timestamp as score
    # Use timestamp + random suffix as member for uniqueness
    event_id = f"{timestamp}:{id(object())}"
    r.zadd(key, {event_id: timestamp})
    
    return timestamp

# Track some events
for i in range(5):
    track_event("user:123", "api_call")
    time.sleep(0.1)
```

**Node.js example:**

```javascript
import { createClient } from 'redis';

const client = await createClient().connect();

async function trackEvent(userId, eventType = 'request') {
  const key = `events:${userId}:${eventType}`;
  const timestamp = Date.now() / 1000;  // Convert to seconds
  
  // Add event with timestamp as score
  const eventId = `${timestamp}:${Math.random()}`;
  await client.zAdd(key, { score: timestamp, value: eventId });
  
  return timestamp;
}
```

### Step 2: Count events in sliding window

Count events in the last N seconds using ZCOUNT.

**Python example:**

```python
def count_events_in_window(user_id, window_seconds, event_type="request"):
    """Count events in the last N seconds"""
    key = f"events:{user_id}:{event_type}"
    now = time.time()
    window_start = now - window_seconds
    
    # Count events in time range
    count = r.zcount(key, window_start, now)
    
    return count

# Count events in last 60 seconds
count = count_events_in_window("user:123", window_seconds=60)
print(f"Events in last 60 seconds: {count}")

# Count events in last 5 minutes
count = count_events_in_window("user:123", window_seconds=300)
print(f"Events in last 5 minutes: {count}")
```

**Node.js example:**

```javascript
async function countEventsInWindow(userId, windowSeconds, eventType = 'request') {
  const key = `events:${userId}:${eventType}`;
  const now = Date.now() / 1000;
  const windowStart = now - windowSeconds;
  
  // Count events in time range
  const count = await client.zCount(key, windowStart, now);
  
  return count;
}

// Count events in last 60 seconds
const count = await countEventsInWindow('user:123', 60);
console.log(`Events in last 60 seconds: ${count}`);
```

### Step 3: Implement rate limiting

Check if user has exceeded rate limit before allowing action.

**Python example:**

```python
def check_rate_limit(user_id, max_requests, window_seconds):
    """Check if user is within rate limit"""
    key = f"ratelimit:{user_id}"
    now = time.time()
    window_start = now - window_seconds
    
    # Use pipeline for atomic operations
    pipe = r.pipeline()
    
    # Remove old events outside window
    pipe.zremrangebyscore(key, '-inf', window_start)
    
    # Count current events in window
    pipe.zcount(key, window_start, now)
    
    # Add current request
    pipe.zadd(key, {f"{now}:{id(object())}": now})
    
    # Set expiry to window size (cleanup)
    pipe.expire(key, window_seconds)
    
    results = pipe.execute()
    current_count = results[1]
    
    # Check if within limit (before adding current request)
    if current_count >= max_requests:
        # Remove the request we just added
        r.zpopmax(key)
        return False, current_count
    
    return True, current_count + 1

# Check rate limit: 10 requests per minute
allowed, count = check_rate_limit("user:123", max_requests=10, window_seconds=60)

if allowed:
    print(f"Request allowed ({count}/10)")
    # Process request
else:
    print(f"Rate limit exceeded ({count}/10)")
    # Return 429 Too Many Requests
```

**Simplified rate limiting:**

```python
def simple_rate_limit(user_id, max_requests, window_seconds):
    """Simpler rate limiting approach"""
    key = f"ratelimit:{user_id}"
    now = time.time()
    window_start = now - window_seconds
    
    # Clean old entries and count in one pipeline
    pipe = r.pipeline()
    pipe.zremrangebyscore(key, '-inf', window_start)
    pipe.zcard(key)
    results = pipe.execute()
    
    current_count = results[1]
    
    if current_count >= max_requests:
        return False
    
    # Add new request
    r.zadd(key, {f"{now}": now})
    r.expire(key, window_seconds)
    
    return True
```

### Step 4: Calculate rolling metrics

Calculate averages, percentiles, or trends over sliding windows.

**Python example:**

```python
def get_rolling_average(metric_key, window_seconds):
    """Calculate average value in sliding window"""
    now = time.time()
    window_start = now - window_seconds
    
    # Get all values in window
    values = r.zrangebyscore(metric_key, window_start, now, withscores=True)
    
    if not values:
        return 0
    
    # Extract scores (values) and calculate average
    scores = [float(score) for _, score in values]
    return sum(scores) / len(scores)

# Track response times
def track_response_time(endpoint, response_time_ms):
    """Track response time for an endpoint"""
    key = f"metrics:response_time:{endpoint}"
    timestamp = time.time()
    
    # Store response time as score
    r.zadd(key, {f"{timestamp}": response_time_ms})
    
    # Keep only last hour of data
    one_hour_ago = timestamp - 3600
    r.zremrangebyscore(key, '-inf', one_hour_ago)

# Track some response times
track_response_time("/api/users", 45.2)
track_response_time("/api/users", 52.1)
track_response_time("/api/users", 38.7)

# Get average response time for last 5 minutes
avg = get_rolling_average("metrics:response_time:/api/users", window_seconds=300)
print(f"Average response time (5 min): {avg:.2f}ms")
```

### Step 5: Query time ranges

Retrieve events or metrics for specific time ranges.

**Python example:**

```python
def get_events_in_range(user_id, start_time, end_time, event_type="request"):
    """Get all events in a time range"""
    key = f"events:{user_id}:{event_type}"
    
    # Get events with scores (timestamps)
    events = r.zrangebyscore(key, start_time, end_time, withscores=True)
    
    return [(event, timestamp) for event, timestamp in events]

# Get events from last hour
one_hour_ago = time.time() - 3600
now = time.time()
events = get_events_in_range("user:123", one_hour_ago, now)

print(f"Found {len(events)} events in last hour")
```

### Step 6: Multiple time windows

Track metrics across multiple time windows simultaneously.

**Python example:**

```python
def track_with_multiple_windows(user_id, event_type="request"):
    """Track event across multiple time windows"""
    now = time.time()
    event_id = f"{now}:{id(object())}"
    
    # Track in multiple windows
    windows = {
        "1min": 60,
        "5min": 300,
        "1hour": 3600,
        "1day": 86400
    }
    
    pipe = r.pipeline()
    for window_name, window_seconds in windows.items():
        key = f"events:{user_id}:{event_type}:{window_name}"
        pipe.zadd(key, {event_id: now})
        pipe.zremrangebyscore(key, '-inf', now - window_seconds)
        pipe.expire(key, window_seconds * 2)  # Cleanup
    
    pipe.execute()

def get_counts_all_windows(user_id, event_type="request"):
    """Get counts for all time windows"""
    now = time.time()
    windows = {
        "1min": 60,
        "5min": 300,
        "1hour": 3600,
        "1day": 86400
    }
    
    counts = {}
    for window_name, window_seconds in windows.items():
        key = f"events:{user_id}:{event_type}:{window_name}"
        counts[window_name] = r.zcard(key)
    
    return counts

# Track event
track_with_multiple_windows("user:123")

# Get counts
counts = get_counts_all_windows("user:123")
print(f"Counts: {counts}")
# Output: {'1min': 5, '5min': 23, '1hour': 145, '1day': 1250}
```

## Redis Cloud setup

When deploying sliding windows to Redis Cloud:

1. **Set appropriate TTLs** - Prevent unbounded growth
2. **Clean old data regularly** - Use ZREMRANGEBYSCORE
3. **Monitor memory usage** - Sorted sets grow with events
4. **Use pipelining** - Batch cleanup and count operations
5. **Consider RedisTimeSeries** - For high-volume time-series data

Example configuration:
- **TTL**: 2x window size for safety
- **Cleanup frequency**: Every operation or periodic background job
- **Memory**: ~100 bytes per event (depends on member size)
- **Max window size**: Based on event rate and memory limits

## Common pitfalls

1. **Not removing old data** - Causes unbounded memory growth
2. **Using wrong time units** - Ensure consistent seconds/milliseconds
3. **Not using pipeline** - Multiple operations should be batched
4. **Missing TTL** - Keys never expire without explicit TTL
5. **Non-unique members** - Use timestamp + unique suffix for members

## Related patterns

- [Time-series data]({{< relref "/develop/patterns/data-modeling/time-series" >}}) - Alternative approaches
- [Unique counting]({{< relref "/develop/patterns/analytics/unique-counting" >}}) - HyperLogLog for cardinality
- [Event pipelines]({{< relref "/develop/patterns/ingestion/streams-event-pipeline" >}}) - Ingest events

## More information

- [Sorted sets documentation]({{< relref "/develop/data-types/sorted-sets" >}})
- [ZADD command]({{< relref "/commands/zadd" >}})
- [ZCOUNT command]({{< relref "/commands/zcount" >}})
- [ZREMRANGEBYSCORE command]({{< relref "/commands/zremrangebyscore" >}})
- [ZRANGEBYSCORE command]({{< relref "/commands/zrangebyscore" >}})
- [RedisTimeSeries]({{< relref "/develop/data-types/timeseries" >}})

