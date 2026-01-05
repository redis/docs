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
description: Track unique visitors and cardinality at scale with HyperLogLog
linkTitle: Unique counting
title: How do I track unique visitors with HyperLogLog?
weight: 2
---

## Problem

You need to count unique items at scale:

- Track unique visitors per page/day/month
- Count distinct users across multiple events
- Calculate cardinality of large sets
- Minimize memory usage (millions of unique items)
- Merge counts from multiple sources

Storing every unique ID in a set becomes prohibitively expensive at scale.

## Solution overview

Redis HyperLogLog provides probabilistic cardinality estimation with:

- **Fixed memory** - Only 12KB per HyperLogLog regardless of cardinality
- **High accuracy** - Standard error of 0.81%
- **Mergeable** - Combine multiple HyperLogLogs with PFMERGE
- **Fast operations** - O(1) for add and count

Trade-off: Approximate counts (not exact) but extremely memory-efficient.

**Architecture:**

```
┌──────────────────────────────────────────────────────────┐
│         HyperLogLog Unique Counting                      │
└──────────────────────────────────────────────────────────┘

Traditional Set Approach (Exact but expensive):
┌────────────────────────────────────────────────────────┐
│ SET unique:visitors                                    │
│ ┌────────────────────────────────────────────────────┐ │
│ │ user_1, user_2, user_3, ..., user_1000000          │ │
│ │ Memory: ~50MB for 1M users                         │ │
│ └────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘

HyperLogLog Approach (Approximate but efficient):
┌────────────────────────────────────────────────────────┐
│ HYPERLOGLOG unique:visitors                            │
│ ┌────────────────────────────────────────────────────┐ │
│ │ [Probabilistic data structure]                     │ │
│ │ Memory: 12KB for ANY number of users               │ │
│ │ Accuracy: ±0.81% error                             │ │
│ └────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘

Example: Daily Unique Visitors
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ HLL:2024-01  │  │ HLL:2024-02  │  │ HLL:2024-03  │
│ Count: 1.2M  │  │ Count: 1.5M  │  │ Count: 1.8M  │
│ Memory: 12KB │  │ Memory: 12KB │  │ Memory: 12KB │
└──────────────┘  └──────────────┘  └──────────────┘
       │                 │                 │
       └─────────────────┴─────────────────┘
                         │
                    PFMERGE
                         │
                         ▼
              ┌──────────────────────┐
              │ HLL:2024-Q1          │
              │ Count: 3.1M unique   │
              │ (deduplicated)       │
              │ Memory: 12KB         │
              └──────────────────────┘

Operations:
  PFADD hll:visitors user_123    - Add user
  PFCOUNT hll:visitors           - Get count
  PFMERGE hll:total hll:day1 ... - Merge counts

Memory Savings:
  1M users: 50MB (set) vs 12KB (HLL) = 99.98% reduction
  1B users: 50GB (set) vs 12KB (HLL) = 99.9999% reduction
```

## Prerequisites

Before implementing this pattern, review:

- [Probabilistic data structures]({{< relref "/develop/data-types/probabilistic" >}}) - HyperLogLog documentation
- [Sets]({{< relref "/develop/data-types/sets" >}}) - Alternative for small cardinalities
- [Sorted sets]({{< relref "/develop/data-types/sorted-sets" >}}) - For time-based unique counts

## Implementation

### Step 1: Track unique visitors

Use PFADD to add items to a HyperLogLog.

**Python example:**

```python
import redis

r = redis.Redis(host='localhost', port=6379, decode_responses=True)

def track_visitor(page, user_id):
    """Track a unique visitor to a page"""
    key = f"visitors:{page}"
    r.pfadd(key, user_id)

# Track some visitors
track_visitor("/home", "user:123")
track_visitor("/home", "user:456")
track_visitor("/home", "user:123")  # Duplicate - won't increase count
track_visitor("/home", "user:789")

# Get unique visitor count
count = r.pfcount("visitors:/home")
print(f"Unique visitors to /home: {count}")
# Output: 3 (user:123, user:456, user:789)
```

**Node.js example:**

```javascript
import { createClient } from 'redis';

const client = await createClient().connect();

async function trackVisitor(page, userId) {
  const key = `visitors:${page}`;
  await client.pfAdd(key, userId);
}

// Track visitors
await trackVisitor('/home', 'user:123');
await trackVisitor('/home', 'user:456');
await trackVisitor('/home', 'user:123');  // Duplicate

// Get count
const count = await client.pfCount('visitors:/home');
console.log(`Unique visitors: ${count}`);
```

### Step 2: Track unique visitors by time period

Organize HyperLogLogs by date for time-based analytics.

**Python example:**

```python
from datetime import datetime, date

def track_daily_visitor(page, user_id, visit_date=None):
    """Track unique visitor for a specific day"""
    if visit_date is None:
        visit_date = date.today()
    
    # Create key with date
    key = f"visitors:{page}:{visit_date.isoformat()}"
    r.pfadd(key, user_id)
    
    # Set expiry (e.g., keep 90 days of data)
    r.expire(key, 90 * 86400)

# Track visitors for today
today = date.today()
track_daily_visitor("/products", "user:123", today)
track_daily_visitor("/products", "user:456", today)
track_daily_visitor("/products", "user:123", today)  # Duplicate

# Get today's unique visitors
count = r.pfcount(f"visitors:/products:{today.isoformat()}")
print(f"Unique visitors today: {count}")
```

### Step 3: Merge counts from multiple sources

Use PFMERGE to combine HyperLogLogs.

**Python example:**

```python
def get_weekly_unique_visitors(page, start_date, days=7):
    """Get unique visitors across multiple days"""
    from datetime import timedelta
    
    # Collect keys for each day
    daily_keys = []
    for i in range(days):
        day = start_date + timedelta(days=i)
        daily_keys.append(f"visitors:{page}:{day.isoformat()}")
    
    # Merge into temporary key
    temp_key = f"visitors:{page}:week:{start_date.isoformat()}"
    r.pfmerge(temp_key, *daily_keys)
    
    # Get merged count
    count = r.pfcount(temp_key)
    
    # Clean up temporary key
    r.delete(temp_key)
    
    return count

# Get unique visitors for last 7 days
from datetime import date, timedelta
today = date.today()
start = today - timedelta(days=6)
weekly_count = get_weekly_unique_visitors("/products", start, days=7)
print(f"Unique visitors (7 days): {weekly_count}")
```

**Permanent merged counts:**

```python
def create_monthly_summary(page, year, month):
    """Create permanent monthly unique visitor count"""
    import calendar
    
    # Get all days in month
    _, num_days = calendar.monthrange(year, month)
    daily_keys = []
    
    for day in range(1, num_days + 1):
        day_date = date(year, month, day)
        daily_keys.append(f"visitors:{page}:{day_date.isoformat()}")
    
    # Merge into monthly key
    monthly_key = f"visitors:{page}:{year}-{month:02d}"
    r.pfmerge(monthly_key, *daily_keys)
    
    return r.pfcount(monthly_key)

# Create January 2024 summary
monthly_count = create_monthly_summary("/products", 2024, 1)
print(f"Unique visitors in January: {monthly_count}")
```

### Step 4: Track unique events across multiple dimensions

Use HyperLogLog for multi-dimensional analytics.

**Python example:**

```python
def track_event(event_type, user_id, properties=None):
    """Track unique users for an event with multiple dimensions"""
    properties = properties or {}
    
    # Track overall unique users for event
    r.pfadd(f"events:{event_type}:users", user_id)
    
    # Track by additional dimensions
    if 'country' in properties:
        r.pfadd(f"events:{event_type}:country:{properties['country']}", user_id)
    
    if 'device' in properties:
        r.pfadd(f"events:{event_type}:device:{properties['device']}", user_id)
    
    if 'campaign' in properties:
        r.pfadd(f"events:{event_type}:campaign:{properties['campaign']}", user_id)

# Track events
track_event("purchase", "user:123", {"country": "US", "device": "mobile"})
track_event("purchase", "user:456", {"country": "UK", "device": "desktop"})
track_event("purchase", "user:123", {"country": "US", "device": "mobile"})  # Duplicate

# Get counts by dimension
total = r.pfcount("events:purchase:users")
us_users = r.pfcount("events:purchase:country:US")
mobile_users = r.pfcount("events:purchase:device:mobile")

print(f"Total unique purchasers: {total}")
print(f"US purchasers: {us_users}")
print(f"Mobile purchasers: {mobile_users}")
```

### Step 5: A/B testing with HyperLogLog

Track unique users per variant.

**Python example:**

```python
def track_experiment_user(experiment_id, variant, user_id):
    """Track user in A/B test variant"""
    key = f"experiment:{experiment_id}:variant:{variant}"
    r.pfadd(key, user_id)

def get_experiment_results(experiment_id, variants):
    """Get unique user counts for all variants"""
    results = {}
    for variant in variants:
        key = f"experiment:{experiment_id}:variant:{variant}"
        results[variant] = r.pfcount(key)
    return results

# Track users in A/B test
experiment = "homepage_redesign"
track_experiment_user(experiment, "control", "user:123")
track_experiment_user(experiment, "control", "user:456")
track_experiment_user(experiment, "variant_a", "user:789")
track_experiment_user(experiment, "variant_a", "user:123")

# Get results
results = get_experiment_results(experiment, ["control", "variant_a"])
print(f"Experiment results: {results}")
# Output: {'control': 2, 'variant_a': 2}
```

### Step 6: Combining HyperLogLog with other data types

Use HyperLogLog alongside other structures for rich analytics.

**Python example:**

```python
def track_page_view(page, user_id, session_id):
    """Track page view with both total and unique counts"""
    today = date.today().isoformat()
    
    # Track unique visitors (HyperLogLog)
    r.pfadd(f"unique:visitors:{page}:{today}", user_id)
    
    # Track total page views (counter)
    r.incr(f"total:views:{page}:{today}")
    
    # Track unique sessions (HyperLogLog)
    r.pfadd(f"unique:sessions:{page}:{today}", session_id)

def get_page_analytics(page, day):
    """Get comprehensive page analytics"""
    day_str = day.isoformat()
    
    return {
        "unique_visitors": r.pfcount(f"unique:visitors:{page}:{day_str}"),
        "total_views": int(r.get(f"total:views:{page}:{day_str}") or 0),
        "unique_sessions": r.pfcount(f"unique:sessions:{page}:{day_str}")
    }

# Track some views
today = date.today()
track_page_view("/products", "user:123", "session:abc")
track_page_view("/products", "user:123", "session:abc")  # Same user, same session
track_page_view("/products", "user:456", "session:def")

# Get analytics
analytics = get_page_analytics("/products", today)
print(f"Analytics: {analytics}")
# Output: {'unique_visitors': 2, 'total_views': 3, 'unique_sessions': 2}
```

## Redis Cloud setup

When deploying HyperLogLog to Redis Cloud:

1. **Fixed memory** - Each HyperLogLog uses exactly 12KB
2. **Set expiry** - Use EXPIRE for time-based data
3. **Batch operations** - Use pipelining for multiple PFADD calls
4. **Monitor accuracy** - Understand 0.81% standard error
5. **Consider alternatives** - Use sets for small cardinalities (<10K items)

Example configuration:
- **Memory per HLL**: 12KB fixed
- **Accuracy**: ±0.81% standard error
- **Use case**: >10K unique items
- **TTL**: Set based on retention needs

## Common pitfalls

1. **Using for small sets** - Sets are better for <10K items
2. **Expecting exact counts** - HyperLogLog is probabilistic
3. **Not setting TTL** - Old HyperLogLogs accumulate
4. **Merging too many** - Accuracy decreases with many merges
5. **Wrong data type** - Can't retrieve individual items

## Related patterns

- [Sliding windows]({{< relref "/develop/patterns/analytics/sliding-windows" >}}) - Time-based counting
- [Real-time aggregations]({{< relref "/develop/patterns/analytics/real-time-aggregations" >}}) - Complex analytics
- [Event pipelines]({{< relref "/develop/patterns/ingestion/streams-event-pipeline" >}}) - Ingest events

## More information

- [Probabilistic data structures]({{< relref "/develop/data-types/probabilistic" >}})
- [PFADD command]({{< relref "/commands/pfadd" >}})
- [PFCOUNT command]({{< relref "/commands/pfcount" >}})
- [PFMERGE command]({{< relref "/commands/pfmerge" >}})
- [Sets documentation]({{< relref "/develop/data-types/sets" >}})

