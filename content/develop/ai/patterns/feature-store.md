---
title: "Real-time feature stores for AI agents"
linkTitle: "Feature stores"
description: "Serve pre-computed features and embeddings with sub-millisecond latency"
weight: 120
---

## Pattern: Real-time feature store

**Intent**: Serve pre-computed ML features, embeddings, and user signals to AI agents with sub-millisecond latency. This pattern eliminates the need for agents to recompute expensive features on every request.

Feature stores decouple feature engineering (offline batch jobs) from feature serving (online inference). This enables agents to make decisions based on fresh, complex features without computation bottlenecks.

## The abstraction (developer experience)

Use Featureform to define features declaratively and serve them from Redis with automatic versioning and consistency.

```python
import featureform as ff

# Connect to Redis as the online store
redis_online = ff.register_redis(
    name="redis-online",
    host="localhost",
    port=6379,
    description="Real-time feature serving for AI agents"
)

# Register a feature set
@ff.entity
class User:
    user_embedding = ff.Feature(
        variant="v1",
        type=ff.Vector,
        dimensions=768,
        description="User behavior embedding for recommendations"
    )

    purchase_intent_score = ff.Feature(
        variant="v1",
        type=ff.Float32,
        description="Real-time purchase intent score (0-1)"
    )

    last_session_timestamp = ff.Feature(
        variant="v1",
        type=ff.Int64,
        description="Unix timestamp of last user activity"
    )

# Serve features to your AI agent
features = ff.FeatureClient()

def get_user_context(user_id):
    """Retrieve all features for a user in one call"""
    return features.features(
        [
            ("user_embedding", "v1"),
            ("purchase_intent_score", "v1"),
            ("last_session_timestamp", "v1")
        ],
        {"user": user_id}
    )

# Agent uses features for decision-making
user_features = get_user_context("user123")
embedding = user_features["user_embedding"]
intent_score = user_features["purchase_intent_score"]

if intent_score > 0.7:
    recommend_products(user_id, embedding)
```

**Why this works**: Featureform handles schema evolution, point-in-time correctness, and fallback logic. Agents don't write brittle feature retrieval code or manage feature versioning.

## The raw commands (machine verification)

If Featureform fails or you need to debug, use these exact Redis commands to verify the feature store state.

### Verify that features are being written

```bash
# Check if user features exist (Featureform stores features as Hashes)
HGETALL feature:user:user123:v1
```

**Expected output**:
```
1) "user_embedding"
2) "<binary_vector_blob>"
3) "purchase_intent_score"
4) "0.85"
5) "last_session_timestamp"
6) "1706648400"
```

### Retrieve specific feature values

```bash
# Get a single feature (what Featureform does internally for partial lookups)
HGET feature:user:user123:v1 purchase_intent_score

# Get multiple features atomically (batch retrieval)
HMGET feature:user:user123:v1 purchase_intent_score last_session_timestamp
```

### Check feature freshness

```bash
# Featureform tracks feature update timestamps
HGET feature:user:user123:v1:meta last_update

# Check TTL for stale feature eviction
TTL feature:user:user123:v1
```

### Verify feature versioning

```bash
# List all versions of a feature for a user
KEYS feature:user:user123:*

# Compare v1 vs v2 (during schema migration)
HGET feature:user:user123:v1 purchase_intent_score
HGET feature:user:user123:v2 purchase_intent_score
```

## Alternative: Direct Redis implementation (no dependencies)

For simple feature stores without Featureform's schema management, use Redis Hashes directly.

### Store features in a Hash

```bash
# Store all user features in a single Hash (fast O(1) retrieval)
HSET user:features:user123
  embedding <binary_vector>
  intent_score 0.85
  last_session 1706648400
  EX 86400  # 24-hour TTL
```

### Python example with direct Redis

```python
import redis
import json
import numpy as np
import time

r = redis.Redis(decode_responses=True)

def store_user_features(user_id, embedding, intent_score, last_session):
    """Store all features atomically in a Hash"""
    key = f"user:features:{user_id}"

    r.hset(key, mapping={
        "embedding": embedding.tobytes().hex(),  # Binary to hex for storage
        "intent_score": str(intent_score),
        "last_session": str(last_session),
        "version": "v1",
        "updated_at": int(time.time())
    })

    r.expire(key, 86400)  # 24-hour TTL

def get_user_features(user_id):
    """Retrieve all features in one roundtrip"""
    key = f"user:features:{user_id}"
    features = r.hgetall(key)

    if not features:
        return None  # Cache miss - load from data warehouse

    # Decode embedding from hex
    embedding_bytes = bytes.fromhex(features["embedding"])
    embedding = np.frombuffer(embedding_bytes, dtype=np.float32)

    return {
        "embedding": embedding,
        "intent_score": float(features["intent_score"]),
        "last_session": int(features["last_session"]),
        "version": features["version"]
    }
```

**Trade-offs vs Featureform**:

| Aspect | Featureform | Direct Redis Hashes |
|--------|-------------|---------------------|
| Schema versioning | Automatic | Manual |
| Point-in-time correctness | Built-in | Custom logic |
| Multi-source joins | Yes | No |
| Learning curve | Higher | Lower |
| Dependencies | Python client | redis-py only |

## Production patterns

### Batch retrieval for multiple users

When you serve recommendations to a batch of users, retrieve features in parallel:

```python
# Pipeline for multi-user retrieval
pipe = r.pipeline()
user_ids = ["user123", "user456", "user789"]

for user_id in user_ids:
    pipe.hgetall(f"user:features:{user_id}")

# Execute all HGETALL commands in parallel
results = pipe.execute()
```

**Performance**: 1000 users in ~5ms vs 1000 sequential roundtrips (~1 second).

### Feature backfill pattern

When you deploy a new feature, backfill existing users without blocking production:

```python
def backfill_new_feature(user_ids, batch_size=1000):
    """Incrementally backfill a new feature version"""
    for i in range(0, len(user_ids), batch_size):
        batch = user_ids[i:i+batch_size]

        # Compute features for batch (offline)
        new_features = compute_features_batch(batch)

        # Write to Redis with new version key
        pipe = r.pipeline()
        for user_id, features in zip(batch, new_features):
            pipe.hset(f"user:features:{user_id}:v2", mapping=features)
        pipe.execute()

        time.sleep(0.1)  # Rate limit to avoid overwhelming Redis
```

### Fallback strategy for missing features

Handle cache misses gracefully:

```python
def get_features_with_fallback(user_id):
    # Try Redis first (hot path)
    features = r.hgetall(f"user:features:{user_id}")

    if features:
        return features

    # Fallback to data warehouse (cold path)
    features = fetch_from_warehouse(user_id)

    # Warm the cache for next time (async write-back)
    asyncio.create_task(
        r.hset(f"user:features:{user_id}", mapping=features)
    )

    return features
```

### Memory management

Estimate memory usage:

- **768-dim float32 embedding**: 3KB
- **10 scalar features**: ~200 bytes
- **Redis Hash overhead**: ~100 bytes
- **Total per user**: ~3.3KB

For 10 million users: **~33GB**

**Optimization strategies**:
1. **Quantize embeddings**: Convert float32 → int8 (4x compression, minimal accuracy loss)
2. **Use TTL aggressively**: Remove inactive users after 30 days
3. **Partition by shard**: Distribute users across Redis cluster shards

### Monitor feature staleness

Track feature age to detect pipeline failures:

```python
def check_feature_freshness(user_id, max_age_seconds=3600):
    """Alert if features are stale"""
    updated_at = r.hget(f"user:features:{user_id}", "updated_at")

    if not updated_at:
        return False  # Missing

    age = int(time.time()) - int(updated_at)

    if age > max_age_seconds:
        logger.warning(f"Stale features for {user_id}: {age}s old")
        return False

    return True
```

## Use Cases

✅ **Best for**:
- **Real-time recommendations**: Serve user/item embeddings for similarity matching
- **Fraud detection**: Aggregate features like transaction velocity, device fingerprints
- **Personalization**: User preferences, intent scores, behavioral signals
- **A/B testing**: Feature flags and experiment assignments

❌ **Not suitable for**:
- **Rarely-accessed features**: Store cold data in S3/data warehouse instead
- **Highly dynamic features**: Use Redis Streams for event-driven updates
- **Very large feature sets**: Features with >100 fields should be split into multiple Hashes

## Performance characteristics

| Operation | Latency | Throughput |
|-----------|---------|------------|
| HGETALL (single user) | <1ms | 50K ops/sec |
| HMGET (3 features) | <0.5ms | 100K ops/sec |
| Pipeline (100 users) | ~5ms | 20K users/sec |
| Feature update (HSET) | <1ms | 80K ops/sec |

**Comparison to alternatives**:
- **PostgreSQL**: 10-50ms per query (10-50x slower)
- **DynamoDB**: 2-5ms per query (2-5x slower)
- **In-memory cache**: Similar speed but no persistence

## Benefits of this pattern

1. **Safety**: Featureform prevents agents from writing incorrect feature joins or serving training/serving skew. It enforces schema contracts and handles version migrations.

2. **Accuracy**: The raw commands (HGETALL, HMGET) let agents verify that features are being written to Redis with correct values and timestamps. This verification is critical when you debug questions like "why isn't my model seeing the new feature?"

3. **Efficiency**:
   - Sub-millisecond feature serving eliminates the #1 bottleneck in agent decision loops
   - Batch retrieval (pipelines) enables serving 1000s of users in <10ms
   - Memory-efficient Hashes store 10M users in ~33GB

4. **Flexibility**: This pattern shows **two paths**:
   - **Featureform** - Enterprise-grade schema management, point-in-time correctness, multi-source joins
   - **Direct Redis** - Simpler for small teams, no external dependencies, full control

5. **Production-Ready**:
   - TTL-based eviction prevents unbounded growth
   - Pipeline support for batch serving
   - Fallback logic handles cache misses gracefully
   - Staleness monitoring detects pipeline failures

## When to use Featureform vs direct Redis

**Use Featureform when**:
- Multiple teams share features and you need schema governance
- Features come from diverse sources (Snowflake, S3, Kafka)
- Point-in-time correctness is critical and training/serving skew matters
- You need automatic feature backfilling

**Use direct Redis when**:
- You have simple feature pipelines with a single data source
- You need full control over serialization and storage layout
- You prefer minimal dependencies
- Features are ephemeral with short TTL and no historical queries

## References

- [Featureform overview]({{< relref "/develop/ai/featureform/overview" >}})
- [Featureform quickstart]({{< relref "/develop/ai/featureform/quickstart" >}})
- [Redis Hashes documentation](https://redis.io/docs/latest/commands/hash/)
- [Memory optimization patterns (antirez.com)](https://redis.antirez.com/fundamental/memory-optimization.md)
- [Write-through caching pattern (antirez.com)](https://redis.antirez.com/fundamental/write-through.md)
- Production feature store deployments at recommendation systems and fraud detection platforms


