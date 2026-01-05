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
description: Model time-series data efficiently with sorted sets or RedisTimeSeries
linkTitle: Time-series data
title: How do I model time-series data?
weight: 4
---

## Problem

You need to store and query time-series data:

- IoT sensor readings over time
- Application metrics and monitoring data
- Stock prices or financial data
- User activity logs
- System performance metrics

You need efficient storage, querying by time range, and automatic retention policies.

## Solution overview

Redis provides two approaches for time-series data:

1. **Sorted sets** - Simple, flexible, good for moderate volumes
2. **RedisTimeSeries** - Purpose-built module for high-volume time-series

Choose based on data volume, query patterns, and feature requirements.

**Architecture:**

```
┌──────────────────────────────────────────────────────────┐
│         Time-Series Data Storage                         │
└──────────────────────────────────────────────────────────┘

1. SORTED SETS (Simple Approach)
┌────────────────────────────────────────────────────────┐
│ Store metrics with timestamp as score                  │
│ ┌──────────────────────────────────────────────────┐  │
│ │ ZADD metrics:cpu:server1                         │  │
│ │   1703001600000 "45.2"                           │  │
│ │   1703001660000 "48.7"                           │  │
│ │   1703001720000 "52.1"                           │  │
│ │   1703001780000 "49.3"                           │  │
│ └──────────────────────────────────────────────────┘  │
│         │                                              │
│         ▼                                              │
│ ┌──────────────────────────────────────────────────┐  │
│ │ Sorted Set: metrics:cpu:server1                  │  │
│ │ ┌──────────────────────────────────────────────┐ │  │
│ │ │ Timestamp (score) | Value (member)          │ │  │
│ │ ├───────────────────┼─────────────────────────┤ │  │
│ │ │ 1703001600000     | 45.2                    │ │  │
│ │ │ 1703001660000     | 48.7                    │ │  │
│ │ │ 1703001720000     | 52.1                    │ │  │
│ │ │ 1703001780000     | 49.3                    │ │  │
│ │ └──────────────────────────────────────────────┘ │  │
│ └──────────────────────────────────────────────────┘  │
│                                                        │
│  Query by time range:                                 │
│  ZRANGEBYSCORE metrics:cpu:server1                    │
│    1703001600000 1703001800000                        │
│                                                        │
│  Cleanup old data:                                    │
│  ZREMRANGEBYSCORE metrics:cpu:server1                 │
│    0 1703000000000  (remove data older than cutoff)   │
│                                                        │
│  ✓ Simple, flexible                                   │
│  ✓ Good for moderate volumes (<100K points)           │
│  ✗ No automatic downsampling                          │
│  ✗ No built-in aggregations                           │
└────────────────────────────────────────────────────────┘

2. REDISTIMESERIES (Purpose-Built Module)
┌────────────────────────────────────────────────────────┐
│ Create time-series with retention and labels          │
│ ┌──────────────────────────────────────────────────┐  │
│ │ TS.CREATE metrics:cpu:server1                    │  │
│ │   RETENTION 86400000  (24 hours)                 │  │
│ │   LABELS server server1 metric cpu               │  │
│ └──────────────────────────────────────────────────┘  │
│         │                                              │
│         ▼                                              │
│ ┌──────────────────────────────────────────────────┐  │
│ │ Add samples:                                     │  │
│ │ TS.ADD metrics:cpu:server1 1703001600000 45.2   │  │
│ │ TS.ADD metrics:cpu:server1 1703001660000 48.7   │  │
│ │ TS.ADD metrics:cpu:server1 * 52.1  (auto-time)  │  │
│ └──────────────────────────────────────────────────┘  │
│         │                                              │
│         ▼                                              │
│ ┌──────────────────────────────────────────────────┐  │
│ │ Time-Series Storage                              │  │
│ │ ┌──────────────────────────────────────────────┐ │  │
│ │ │ Compressed chunks (efficient storage)        │ │  │
│ │ │ Automatic retention policy                   │ │  │
│ │ │ Downsampling rules                           │ │  │
│ │ └──────────────────────────────────────────────┘ │  │
│ └──────────────────────────────────────────────────┘  │
│                                                        │
│  Query with aggregation:                              │
│  TS.RANGE metrics:cpu:server1                         │
│    1703001600000 1703088000000                        │
│    AGGREGATION avg 3600000  (hourly averages)         │
│                                                        │
│  Multi-series query:                                  │
│  TS.MRANGE 1703001600000 1703088000000                │
│    FILTER metric=cpu                                  │
│    GROUPBY server REDUCE avg                          │
│                                                        │
│  Downsampling (automatic):                            │
│  TS.CREATERULE metrics:cpu:server1                    │
│    metrics:cpu:server1:hourly                         │
│    AGGREGATION avg 3600000                            │
│                                                        │
│  ✓ Automatic retention                                │
│  ✓ Built-in aggregations (avg, sum, min, max, etc.)  │
│  ✓ Downsampling rules                                 │
│  ✓ Compressed storage                                 │
│  ✓ Label-based queries                                │
│  ✓ High performance (millions of samples/sec)         │
└────────────────────────────────────────────────────────┘

Example: Multi-Resolution Storage
┌────────────────────────────────────────────────────────┐
│                                                        │
│  Raw data (1-minute resolution, 24h retention)        │
│  ┌──────────────────────────────────────────────────┐ │
│  │ metrics:cpu:server1                              │ │
│  │ [45.2][48.7][52.1][49.3]... (1440 points/day)    │ │
│  └──────────────────────────────────────────────────┘ │
│         │                                              │
│         │ TS.CREATERULE (auto-downsample)              │
│         ▼                                              │
│  Hourly averages (1-hour resolution, 30d retention)   │
│  ┌──────────────────────────────────────────────────┐ │
│  │ metrics:cpu:server1:hourly                       │ │
│  │ [48.8][51.2][47.9]... (720 points/month)         │ │
│  └──────────────────────────────────────────────────┘ │
│         │                                              │
│         │ TS.CREATERULE (auto-downsample)              │
│         ▼                                              │
│  Daily averages (1-day resolution, 1y retention)      │
│  ┌──────────────────────────────────────────────────┐ │
│  │ metrics:cpu:server1:daily                        │ │
│  │ [49.5][50.1][48.7]... (365 points/year)          │ │
│  └──────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  Decision Matrix                        │
├─────────────────────┬──────────────┬────────────────────┤
│ Feature             │ Sorted Sets  │ RedisTimeSeries    │
├─────────────────────┼──────────────┼────────────────────┤
│ Setup complexity    │ Simple       │ Requires module    │
│ Data volume         │ <100K points │ Millions of points │
│ Retention policy    │ Manual       │ Automatic          │
│ Downsampling        │ Manual       │ Automatic          │
│ Aggregations        │ Manual       │ Built-in           │
│ Compression         │ None         │ Yes                │
│ Label queries       │ No           │ Yes                │
│ Performance         │ Good         │ Excellent          │
└─────────────────────┴──────────────┴────────────────────┘

Recommendation: Use RedisTimeSeries for production
time-series workloads. Use sorted sets for simple cases
or when you can't install modules.
```

## Prerequisites

Before implementing this pattern, review:

- [Sorted sets]({{< relref "/develop/data-types/sorted-sets" >}}) - Sorted set documentation
- [RedisTimeSeries]({{< relref "/develop/data-types/timeseries" >}}) - Time-series module
- [Sliding windows]({{< relref "/develop/patterns/analytics/sliding-windows" >}}) - Time-based analytics

## Implementation

### Step 1: Time-series with sorted sets

Use sorted sets for simple time-series data.

**Python example:**

```python
import redis
import time
import json

r = redis.Redis(host='localhost', port=6379, decode_responses=True)

def add_metric(metric_name, value, timestamp=None):
    """Add a time-series data point"""
    if timestamp is None:
        timestamp = time.time()
    
    key = f"ts:{metric_name}"
    
    # Store value as JSON with timestamp as score
    data = json.dumps({"value": value, "timestamp": timestamp})
    r.zadd(key, {data: timestamp})
    
    # Optional: Trim to keep last 24 hours
    one_day_ago = timestamp - 86400
    r.zremrangebyscore(key, '-inf', one_day_ago)

# Add temperature readings
add_metric("sensor:temp:room1", 22.5)
time.sleep(1)
add_metric("sensor:temp:room1", 22.7)
time.sleep(1)
add_metric("sensor:temp:room1", 22.3)

# Query last hour
one_hour_ago = time.time() - 3600
now = time.time()
readings = r.zrangebyscore(f"ts:sensor:temp:room1", one_hour_ago, now)

for reading in readings:
    data = json.loads(reading)
    print(f"Temp: {data['value']}°C at {data['timestamp']}")
```

**Simpler approach (value only):**

```python
def add_simple_metric(metric_name, value, timestamp=None):
    """Add metric with value as member, timestamp as score"""
    if timestamp is None:
        timestamp = time.time()
    
    key = f"ts:{metric_name}"
    
    # Use timestamp as both score and part of member for uniqueness
    member = f"{timestamp}:{value}"
    r.zadd(key, {member: timestamp})

def get_metrics_range(metric_name, start_time, end_time):
    """Get metrics in time range"""
    key = f"ts:{metric_name}"
    results = r.zrangebyscore(key, start_time, end_time, withscores=True)
    
    metrics = []
    for member, timestamp in results:
        _, value = member.split(':', 1)
        metrics.append({
            "timestamp": timestamp,
            "value": float(value)
        })
    
    return metrics
```

### Step 2: Aggregated time-series

Store pre-aggregated data at different granularities.

**Python example:**

```python
def add_metric_with_rollups(metric_name, value, timestamp=None):
    """Add metric and create rollups at different granularities"""
    if timestamp is None:
        timestamp = time.time()
    
    from datetime import datetime
    dt = datetime.fromtimestamp(timestamp)
    
    pipe = r.pipeline()
    
    # Raw data (1-second granularity)
    pipe.zadd(f"ts:{metric_name}:raw", {f"{timestamp}:{value}": timestamp})
    
    # 1-minute rollup
    minute_key = dt.strftime("%Y-%m-%d-%H-%M")
    pipe.zadd(f"ts:{metric_name}:1min", {f"{minute_key}:{value}": timestamp})
    
    # 1-hour rollup
    hour_key = dt.strftime("%Y-%m-%d-%H")
    pipe.zadd(f"ts:{metric_name}:1hour", {f"{hour_key}:{value}": timestamp})
    
    # 1-day rollup
    day_key = dt.strftime("%Y-%m-%d")
    pipe.zadd(f"ts:{metric_name}:1day", {f"{day_key}:{value}": timestamp})
    
    pipe.execute()

def get_aggregated_metrics(metric_name, granularity, start_time, end_time):
    """Get metrics at specific granularity"""
    key = f"ts:{metric_name}:{granularity}"
    results = r.zrangebyscore(key, start_time, end_time, withscores=True)
    
    # Group by time bucket and calculate average
    from collections import defaultdict
    buckets = defaultdict(list)
    
    for member, timestamp in results:
        bucket, value = member.rsplit(':', 1)
        buckets[bucket].append(float(value))
    
    aggregated = []
    for bucket, values in sorted(buckets.items()):
        aggregated.append({
            "bucket": bucket,
            "avg": sum(values) / len(values),
            "min": min(values),
            "max": max(values),
            "count": len(values)
        })
    
    return aggregated
```

### Step 3: RedisTimeSeries (recommended for high volume)

Use RedisTimeSeries module for production time-series workloads.

**Python example:**

```python
# Requires redis-py with timeseries support
from redis.commands.timeseries import TimeSeries

# Create time series
r.ts().create(
    "ts:sensor:temp:room1",
    retention_msecs=86400000,  # 24 hours
    labels={"sensor_id": "room1", "type": "temperature", "unit": "celsius"}
)

# Add samples
import time
r.ts().add("ts:sensor:temp:room1", int(time.time() * 1000), 22.5)
time.sleep(1)
r.ts().add("ts:sensor:temp:room1", int(time.time() * 1000), 22.7)
time.sleep(1)
r.ts().add("ts:sensor:temp:room1", int(time.time() * 1000), 22.3)

# Query range
now = int(time.time() * 1000)
one_hour_ago = now - (3600 * 1000)
samples = r.ts().range("ts:sensor:temp:room1", one_hour_ago, now)

for timestamp, value in samples:
    print(f"Temp: {value}°C at {timestamp}")

# Aggregated query
aggregated = r.ts().range(
    "ts:sensor:temp:room1",
    one_hour_ago,
    now,
    aggregation_type="avg",
    bucket_size_msec=60000  # 1-minute buckets
)

for timestamp, avg_value in aggregated:
    print(f"Avg temp: {avg_value}°C for minute starting at {timestamp}")
```

**Create with downsampling rules:**

```python
# Create source time series
r.ts().create(
    "ts:sensor:temp:raw",
    retention_msecs=3600000,  # 1 hour for raw data
    labels={"sensor": "temp", "resolution": "raw"}
)

# Create aggregated time series
r.ts().create(
    "ts:sensor:temp:1min",
    retention_msecs=86400000,  # 24 hours
    labels={"sensor": "temp", "resolution": "1min"}
)

r.ts().create(
    "ts:sensor:temp:1hour",
    retention_msecs=2592000000,  # 30 days
    labels={"sensor": "temp", "resolution": "1hour"}
)

# Create downsampling rules
r.ts().createrule(
    "ts:sensor:temp:raw",
    "ts:sensor:temp:1min",
    aggregation_type="avg",
    bucket_size_msec=60000
)

r.ts().createrule(
    "ts:sensor:temp:raw",
    "ts:sensor:temp:1hour",
    aggregation_type="avg",
    bucket_size_msec=3600000
)

# Add to raw series - automatically aggregates to others
r.ts().add("ts:sensor:temp:raw", "*", 22.5)
```

### Step 4: Multi-metric queries

Query multiple time series together.

**RedisTimeSeries example:**

```python
# Create multiple sensors
for room in ["room1", "room2", "room3"]:
    r.ts().create(
        f"ts:sensor:temp:{room}",
        labels={"type": "temperature", "room": room}
    )
    
    # Add sample data
    r.ts().add(f"ts:sensor:temp:{room}", "*", 20 + hash(room) % 5)

# Query all temperature sensors
now = int(time.time() * 1000)
one_hour_ago = now - (3600 * 1000)

results = r.ts().mrange(
    one_hour_ago,
    now,
    filters=["type=temperature"]
)

for key, labels, samples in results:
    room = labels['room']
    if samples:
        latest_value = samples[-1][1]
        print(f"{room}: {latest_value}°C")

# Aggregated multi-query
results = r.ts().mrange(
    one_hour_ago,
    now,
    filters=["type=temperature"],
    aggregation_type="avg",
    bucket_size_msec=300000  # 5-minute buckets
)
```

### Step 5: Retention and compaction

Implement data retention policies.

**Sorted sets approach:**

```python
def cleanup_old_data(metric_name, retention_seconds):
    """Remove data older than retention period"""
    cutoff = time.time() - retention_seconds
    key = f"ts:{metric_name}"
    
    removed = r.zremrangebyscore(key, '-inf', cutoff)
    return removed

# Cleanup data older than 7 days
removed = cleanup_old_data("sensor:temp:room1", 7 * 86400)
print(f"Removed {removed} old samples")

# Scheduled cleanup
def scheduled_cleanup():
    """Run periodic cleanup"""
    import schedule
    
    def cleanup_job():
        metrics = r.keys("ts:*:raw")
        for metric in metrics:
            cleanup_old_data(metric.replace("ts:", "").replace(":raw", ""), 86400)
    
    schedule.every().hour.do(cleanup_job)
    
    while True:
        schedule.run_pending()
        time.sleep(60)
```

**RedisTimeSeries approach:**

```python
# Retention is automatic with RedisTimeSeries
r.ts().create(
    "ts:sensor:temp",
    retention_msecs=604800000,  # 7 days
    duplicate_policy="last"  # Keep last value for duplicate timestamps
)

# Compaction rules automatically handle downsampling
r.ts().createrule(
    "ts:sensor:temp",
    "ts:sensor:temp:hourly",
    aggregation_type="avg",
    bucket_size_msec=3600000
)
```

### Step 6: Querying and analysis

Perform analysis on time-series data.

**Python example:**

```python
def calculate_statistics(metric_name, start_time, end_time):
    """Calculate statistics for time range"""
    metrics = get_metrics_range(metric_name, start_time, end_time)
    
    if not metrics:
        return None
    
    values = [m['value'] for m in metrics]
    
    return {
        "count": len(values),
        "min": min(values),
        "max": max(values),
        "avg": sum(values) / len(values),
        "first": values[0],
        "last": values[-1]
    }

# Get statistics
stats = calculate_statistics("sensor:temp:room1", time.time() - 3600, time.time())
print(f"Stats: {stats}")

# Detect anomalies
def detect_anomalies(metric_name, threshold_std_dev=2):
    """Detect values outside normal range"""
    import statistics
    
    now = time.time()
    one_day_ago = now - 86400
    metrics = get_metrics_range(metric_name, one_day_ago, now)
    
    values = [m['value'] for m in metrics]
    mean = statistics.mean(values)
    std_dev = statistics.stdev(values)
    
    anomalies = []
    for m in metrics:
        z_score = abs((m['value'] - mean) / std_dev)
        if z_score > threshold_std_dev:
            anomalies.append({
                "timestamp": m['timestamp'],
                "value": m['value'],
                "z_score": z_score
            })
    
    return anomalies
```

## Redis Cloud setup

When deploying time-series to Redis Cloud:

1. **Choose the right approach** - Sorted sets for simple, RedisTimeSeries for production
2. **Set retention policies** - Prevent unbounded growth
3. **Use downsampling** - Store aggregated data for long-term retention
4. **Monitor memory** - Time-series data grows quickly
5. **Consider sharding** - Distribute high-volume metrics

Example configuration:
- **Sorted sets**: Good for <1M points per metric
- **RedisTimeSeries**: Optimized for billions of points
- **Retention**: 1 hour raw, 1 day minutely, 30 days hourly
- **Memory**: ~16 bytes per sample (RedisTimeSeries)

## Common pitfalls

1. **No retention policy** - Unbounded memory growth
2. **Wrong granularity** - Too fine-grained for long retention
3. **Not using downsampling** - Storing all raw data forever
4. **Missing cleanup** - Old data accumulates
5. **Inefficient queries** - Querying too much data at once

## Related patterns

- [Sliding windows]({{< relref "/develop/patterns/analytics/sliding-windows" >}}) - Time-based counting
- [Real-time aggregations]({{< relref "/develop/patterns/analytics/real-time-aggregations" >}}) - Analytics
- [Secondary indexes]({{< relref "/develop/patterns/data-modeling/secondary-indexes" >}}) - Index by time

## More information

- [RedisTimeSeries]({{< relref "/develop/data-types/timeseries" >}})
- [Sorted sets]({{< relref "/develop/data-types/sorted-sets" >}})
- [TS.CREATE command]({{< relref "/commands/ts.create" >}})
- [TS.ADD command]({{< relref "/commands/ts.add" >}})
- [TS.RANGE command]({{< relref "/commands/ts.range" >}})
- [TS.MRANGE command]({{< relref "/commands/ts.mrange" >}})

