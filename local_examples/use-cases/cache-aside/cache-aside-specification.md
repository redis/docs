# Cache-Aside Pattern Tutorial Specification

**Document Type:** Language-Neutral Specification  
**Target Audience:** AI agents and developers implementing the cache-aside tutorial  
**Style Guide:** Google Developer Documentation Style Guide  
**Last Updated:** 2025-10-27

---

## 1. Tutorial Objectives and Learning Outcomes

### Primary Objectives

Readers will understand and implement the cache-aside pattern using Redis as the caching layer. By completing this tutorial, readers will:

- Understand the cache-aside pattern's role in distributed systems and when to apply it
- Implement a working cache-aside system with Redis
- Handle cache invalidation, TTL management, and eviction policies
- Monitor cache performance and optimize based on metrics
- Recognize common pitfalls and apply best practices

### Learning Outcomes

Upon completion, readers will be able to:

1. **Explain** the cache-aside pattern and its advantages over other caching strategies
2. **Implement** basic cache-aside logic: check cache, fetch on miss, store with TTL
3. **Design** cache invalidation strategies for data consistency
4. **Configure** Redis TTL and eviction policies appropriately
5. **Measure** cache performance using hit/miss ratios and latency metrics
6. **Troubleshoot** common cache-aside issues and apply mitigation strategies

---

## 2. Conceptual Overview of the Cache-Aside Pattern

### Definition

The cache-aside pattern (also called "lazy loading") is a caching strategy where:

- The application is responsible for managing both the cache and the underlying data store
- On data requests, the application first checks the cache
- On cache miss, the application fetches from the data store and populates the cache
- The cache is not updated on writes to the data store; instead, invalidation or TTL handles consistency

### Pattern Flow Diagram

```
Request for Data
    ↓
Check Redis Cache
    ↓
    ├─ Cache Hit → Return cached value
    │
    └─ Cache Miss
        ↓
        Fetch from Data Store
        ↓
        Store in Redis with TTL
        ↓
        Return value
```

### Why Cache-Aside?

- **Simplicity:** Application controls the logic; no special cache infrastructure required
- **Flexibility:** Different data types can have different TTLs and invalidation strategies
- **Resilience:** Cache failures don't break the application (falls back to data store)
- **Efficiency:** Only frequently accessed data is cached

### When to Use Cache-Aside

- Read-heavy workloads with infrequent writes
- Data that can tolerate brief staleness
- Heterogeneous data with varying access patterns
- Systems where cache failures must not cause application failures

### When NOT to Use Cache-Aside

- Write-heavy workloads (use write-through or write-behind instead)
- Data requiring strict consistency guarantees
- Small datasets that fit entirely in memory

### Comparison with Other Caching Patterns

| Aspect | Cache-Aside | Write-Through | Write-Behind |
|--------|-------------|---------------|--------------|
| **Consistency** | Eventual | Strong | Eventual |
| **Write Latency** | Low | High | Low |
| **Read Latency** | Variable (hit/miss) | Low | Low |
| **Complexity** | Low | Medium | High |
| **Data Loss Risk** | Low | None | High |
| **Cache Invalidation** | Manual or TTL | Automatic | Automatic |
| **Best For** | Read-heavy workloads | Consistency-critical systems | Write-heavy workloads |
| **Example Use Case** | User profiles, product catalogs | Financial transactions | Event logging, analytics |

**Decision Framework:**
- Choose **Cache-Aside** when reads are frequent and some staleness is acceptable
- Choose **Write-Through** when consistency is critical and writes are infrequent
- Choose **Write-Behind** when writes are frequent and some data loss is acceptable

---

## 2.5 Concrete Example: User Profile Caching

### Scenario

A web application needs to fetch user profiles frequently. The application serves 1000 requests per second, with 80% being read requests for user profiles.

**System Configuration:**
- Data Store: PostgreSQL database (100ms latency per query)
- Cache: Redis (1ms latency per operation)
- Cache TTL: 300 seconds
- Cache Key Format: `user:{user_id}`

### Timeline: First 350 Seconds

**Request 1 (t=0ms): Fetch user:123**
```
1. Check Redis: MISS (key doesn't exist)
2. Query PostgreSQL: 100ms
3. Store in Redis: 1ms
4. Return to client: 101ms total
5. Cache state: {user:123: {id: 123, name: "Alice", email: "alice@example.com"}}
```

**Request 2 (t=50ms): Fetch user:123**
```
1. Check Redis: HIT (1ms)
2. Return cached value immediately
3. Total latency: 1ms
4. Speedup: 100x faster than Request 1
```

**Requests 3-100 (t=50ms to t=5000ms): Fetch user:123**
```
- All hit cache
- Average latency: 1ms per request
- Total time for 98 requests: ~98ms
- Without cache: ~9800ms
- Time saved: 9702ms (99% reduction)
```

**Request 101 (t=300.1s): Fetch user:123 (after TTL expiration)**
```
1. Check Redis: MISS (TTL expired at t=300s)
2. Query PostgreSQL: 100ms
3. Store in Redis: 1ms
4. Return to client: 101ms total
5. Cache refreshed for next 300 seconds
```

### Performance Comparison

| Metric | Without Cache | With Cache (Hit) | With Cache (Miss) |
|--------|---------------|-----------------|-------------------|
| **Latency** | 100ms | 1ms | 101ms |
| **Throughput** | 10 req/sec | 1000 req/sec | 10 req/sec |
| **Database Load** | 1000 queries/sec | ~3 queries/sec | ~3 queries/sec |
| **Speedup** | 1x | 100x | 1x |

### Key Insights

1. **Cache Hit Ratio Impact:** With 80% hit ratio, average latency = (0.8 × 1ms) + (0.2 × 101ms) = 21.2ms
2. **Database Load Reduction:** From 1000 queries/sec to ~200 queries/sec (80% reduction)
3. **Scalability:** Can serve 1000 req/sec with cache vs. 10 req/sec without
4. **Cost Savings:** Fewer database queries = lower database costs

---

## 3. Step-by-Step Implementation Guide (Language-Agnostic)

### Step 1: Project Setup

**Objectives:**
- Establish Redis connectivity
- Create a mock data source
- Configure basic parameters

**Requirements:**
- Redis instance running (local or Docker)
- Redis client library for target language
- Mock data source (in-memory dictionary or file)
- Configuration for TTL (recommended: 60 seconds for demo)

**Pseudocode:**
```
Initialize Redis connection
  - Host: localhost (or configurable)
  - Port: 6379 (or configurable)
  - Connection pool: enabled

Create mock data source
  - Simulate slow responses (add 100-500ms delay)
  - Provide lookup method: get_data(key) → value

Define configuration
  - CACHE_TTL = 60 seconds
  - CACHE_KEY_PREFIX = "cache:"
```

### Step 2: Implement Basic Cache-Aside Logic

**Objectives:**
- Implement the core cache-aside flow
- Demonstrate cache hits and misses
- Show performance improvement

**Pseudocode:**
```
function get_cached_data(key):
  cache_key = CACHE_KEY_PREFIX + key
  
  // Check cache
  cached_value = redis.get(cache_key)
  if cached_value is not null:
    return cached_value  // Cache hit
  
  // Cache miss: fetch from data store
  value = data_store.get(key)
  
  // Store in cache with TTL
  redis.set(cache_key, value, ex=CACHE_TTL)
  
  return value
```

**Key Considerations:**
- Use appropriate serialization (JSON, MessagePack, etc.)
- Handle null/missing values explicitly
- Log cache hits and misses for monitoring
- Consider error handling for Redis connection failures

### Step 3: Implement Cache Invalidation

**Objectives:**
- Handle data updates correctly
- Maintain cache consistency
- Demonstrate invalidation strategies

**Pseudocode:**
```
function update_data(key, new_value):
  // Update data store
  data_store.update(key, new_value)
  
  // Invalidate cache
  cache_key = CACHE_KEY_PREFIX + key
  redis.delete(cache_key)
  
  return success

function delete_data(key):
  // Delete from data store
  data_store.delete(key)
  
  // Invalidate cache
  cache_key = CACHE_KEY_PREFIX + key
  redis.delete(cache_key)
  
  return success
```

**Invalidation Strategies:**
- **Immediate invalidation:** Delete cache on every write (simplest, most consistent)
- **TTL-based:** Rely on automatic expiration (simpler, allows brief staleness)
- **Hybrid:** Combine immediate invalidation for critical data with TTL for non-critical data

### Step 3.5: Distributed Invalidation (Multi-Instance Systems)

**Objectives (for distributed systems):**
- Coordinate cache invalidation across multiple application instances
- Ensure consistency in multi-instance deployments
- Prevent stale data across the system

**Scenario:** Multiple application instances (A, B, C) share the same Redis cache

**Pseudocode:**
```
// Instance A updates data and publishes invalidation
function update_data_distributed(key, new_value):
  // Update data store
  data_store.update(key, new_value)

  // Publish invalidation message to all instances
  redis.publish("cache:invalidation", key)

  return success

// All instances subscribe to invalidation channel
function subscribe_to_invalidations():
  subscriber = redis.subscribe("cache:invalidation")

  for message in subscriber:
    key = message.data
    cache_key = CACHE_KEY_PREFIX + key
    redis.delete(cache_key)
    log("Invalidated: " + key)
```

**Benefits:**
- All instances invalidate cache simultaneously
- No central coordination needed
- Automatic propagation of invalidations
- Ensures consistency across distributed system

**Alternative: Event-Driven Invalidation**
```
// Use message queue (RabbitMQ, Kafka) for invalidation events
function on_data_updated(event):
  key = event.entity_id
  cache_key = CACHE_KEY_PREFIX + key
  redis.delete(cache_key)
```

### Step 4: Configure TTL and Eviction

**Objectives:**
- Understand TTL behavior
- Configure Redis eviction policies
- Balance memory usage and performance

**TTL Configuration:**
```
// Set TTL when storing
redis.set(cache_key, value, ex=60)  // 60 seconds

// Or set separately
redis.expire(cache_key, 60)

// Check remaining TTL
ttl = redis.ttl(cache_key)  // Returns seconds remaining
```

**Eviction Policy Configuration:**
```
// Redis configuration (redis.conf or command)
maxmemory 256mb
maxmemory-policy allkeys-lru

// Recommended policies:
// - allkeys-lru: Evict least recently used keys (general purpose)
// - allkeys-lfu: Evict least frequently used keys (working set optimization)
// - volatile-lru: Evict only keys with TTL set (mixed cache/persistent data)
```

### Step 5: Add Monitoring and Metrics

**Objectives:**
- Track cache performance
- Identify optimization opportunities
- Validate caching effectiveness

**Metrics to Track:**
```
- Cache hits: Count of successful cache retrievals
- Cache misses: Count of data store fetches
- Hit ratio: hits / (hits + misses)
- Average response time (with cache vs. without)
- Memory usage: Monitor Redis memory consumption
```

**Implementation Pattern:**
```
function get_cached_data_with_metrics(key):
  cache_key = CACHE_KEY_PREFIX + key
  
  cached_value = redis.get(cache_key)
  if cached_value is not null:
    metrics.increment("cache_hits")
    return cached_value
  
  metrics.increment("cache_misses")
  value = data_store.get(key)
  redis.set(cache_key, value, ex=CACHE_TTL)
  
  return value
```

---

## 4. Common Pitfalls and Gotchas

### 4.1 Cache Stampede (Thundering Herd)

**Problem:** When a popular cached item expires, multiple concurrent requests hit the data store simultaneously, overwhelming it.

**Real-World Impact:**
- Popular item expires at t=300s
- 1000 concurrent requests arrive at t=300.1s
- All 1000 hit database simultaneously
- Database latency increases from 100ms to 5000ms (50x increase)
- Cascading failures in dependent services
- User-facing latency: 5+ seconds instead of 1ms

**Symptoms:**
- Sudden spike in data store load when cache expires
- Temporary performance degradation (10-50x latency increase)
- Potential data store timeout or failure
- Cache hit ratio drops to 0% momentarily

**Detection Metrics:**
- Alert if database query count spikes > 10x baseline
- Alert if cache hit ratio drops below 50% for > 1 minute
- Monitor for synchronized expiration patterns in logs

**Mitigation Strategies:**
- **Probabilistic early expiration:** Refresh cache before TTL expires (e.g., at 80% of TTL)
- **Locking:** Use Redis locks to ensure only one request fetches from data store
- **Longer TTL:** Increase TTL for popular items (300s → 3600s)
- **Cache warming:** Proactively refresh cache before expiration
- **Staggered TTL:** Add random jitter to TTL to prevent synchronized expiration

**Example (Pseudocode):**
```
function get_cached_data_with_lock(key):
  cache_key = CACHE_KEY_PREFIX + key
  lock_key = "lock:" + key

  cached_value = redis.get(cache_key)
  if cached_value is not null:
    return cached_value

  // Try to acquire lock
  if redis.set(lock_key, "1", nx=true, ex=5):
    try:
      value = data_store.get(key)
      redis.set(cache_key, value, ex=CACHE_TTL)
      return value
    finally:
      redis.delete(lock_key)
  else:
    // Another request is fetching; wait and retry
    sleep(100ms)
    return get_cached_data_with_lock(key)
```

### 4.2 Cache Invalidation Timing Issues

**Problem:** Data is updated in the data store but the cache is not invalidated, or invalidation happens before the update completes.

**Real-World Impact:**
- User updates profile in database
- Cache not invalidated immediately
- Other users see stale profile for up to 5 minutes (TTL duration)
- Critical data inconsistency in financial or healthcare systems
- Compliance violations (GDPR right to be forgotten)

**Symptoms:**
- Stale data served from cache after updates
- Inconsistent state between cache and data store
- Race conditions in distributed systems
- User complaints about data not updating

**Detection Metrics:**
- Monitor for cache-database divergence
- Track time between update and cache invalidation
- Alert if invalidation fails silently

**Mitigation Strategies:**
- **Atomic operations:** Ensure update and invalidation are atomic or ordered
- **Versioning:** Include version numbers in cached data
- **Event-driven invalidation:** Use message queues or Pub/Sub for distributed invalidation
- **Shorter TTL:** Reduce maximum staleness window (60s → 10s for critical data)
- **Write-through for critical data:** Cache updates immediately on write

### 4.3 Unbounded Cache Growth

**Problem:** Cache keys accumulate without TTL, consuming all available memory.

**Real-World Impact:**
- Cache grows from 1GB to 10GB over 1 month
- Redis runs out of memory
- Eviction policy starts removing important data
- Cache hit ratio drops from 80% to 20%
- Application performance degrades significantly
- Potential Redis crash and service outage

**Symptoms:**
- Redis memory usage grows indefinitely
- Eviction policy triggers unexpectedly
- Performance degradation over time
- Cache hit ratio declining

**Detection Metrics:**
- Alert if memory usage > 80% of maxmemory
- Alert if eviction rate > 100 keys/sec
- Monitor for keys without TTL: `redis-cli --scan --pattern "*" | xargs redis-cli ttl`

**Mitigation Strategies:**
- **Always set TTL:** Never store cache data without expiration
- **Monitor memory:** Track Redis memory usage and set alerts
- **Configure maxmemory:** Set Redis maxmemory limit and eviction policy
- **Regular audits:** Review cache key patterns for missing TTLs
- **Implement key expiration checks:** Validate TTL on every cache write

### 4.4 Serialization and Deserialization Overhead

**Problem:** Complex serialization formats or large objects cause performance degradation.

**Real-World Impact:**
- JSON serialization: 10ms per object
- MessagePack serialization: 1ms per object
- Uncompressed 1MB object: 1MB network transfer
- Compressed 1MB object: 100KB network transfer
- Cache hit latency: 10ms (serialization) vs. 1ms (efficient format)
- Effective speedup: 10x instead of 100x

**Symptoms:**
- Cache lookup slower than expected (5-10ms instead of 1ms)
- High CPU usage during serialization
- Network bandwidth issues with large cached values
- Cache hit ratio high but latency still poor

**Detection Metrics:**
- Measure serialization time: `time_serialize + time_deserialize`
- Monitor network bandwidth for cache operations
- Alert if cache hit latency > 5ms

**Mitigation Strategies:**
- **Choose efficient serialization:** Use JSON (readable), MessagePack (efficient), or Protocol Buffers (compact)
- **Compress large values:** Use gzip or similar for objects > 1KB
- **Cache smaller units:** Cache individual fields instead of entire objects
- **Benchmark:** Measure serialization overhead and optimize
- **Use binary formats:** Prefer MessagePack over JSON for performance-critical paths

### 4.5 Incorrect Error Handling

**Problem:** Redis connection failures or timeouts cause application failures instead of graceful fallback.

**Real-World Impact:**
- Redis goes down for maintenance
- Application crashes instead of falling back to database
- 100% of requests fail instead of 0% (cache hit ratio)
- Service outage instead of graceful degradation
- User-facing errors instead of slower but working service

**Symptoms:**
- Application crashes when Redis is unavailable
- Cascading failures in distributed systems
- Poor user experience during cache outages
- Error logs filled with Redis connection errors

**Detection Metrics:**
- Monitor Redis connection errors
- Alert if error rate > 1% of requests
- Track fallback rate (requests served from data store)

**Mitigation Strategies:**
- **Graceful degradation:** Fall back to data store on cache errors
- **Connection pooling:** Use connection pools with retry logic
- **Timeouts:** Set appropriate timeouts for cache operations (1-5 seconds)
- **Circuit breaker:** Implement circuit breaker pattern for Redis failures
- **Monitoring:** Log all cache errors for debugging

**Example (Pseudocode):**
```
function get_cached_data_with_fallback(key):
  cache_key = CACHE_KEY_PREFIX + key

  try:
    cached_value = redis.get(cache_key)
    if cached_value is not null:
      return cached_value
  except RedisException as e:
    // Redis unavailable; log and continue to data store
    log.warn("Cache error: " + e.message)
    metrics.increment("cache_errors")

  // Fetch from data store
  value = data_store.get(key)

  // Try to cache, but don't fail if Redis is down
  try:
    redis.set(cache_key, value, ex=CACHE_TTL)
  except RedisException:
    // Silently fail; application still works
    pass
  
  return value
```

### 4.6 Inconsistent TTL Across Keys

**Problem:** Different cache keys have different TTLs, leading to unpredictable staleness and inconsistent behavior.

**Real-World Impact:**
- User profile cached for 300s, preferences cached for 60s
- User updates preferences but sees old profile
- Inconsistent state causes bugs in dependent systems
- Difficult to debug and reason about data freshness

**Symptoms:**
- Some data appears stale while other data is fresh
- Difficult to reason about data freshness
- Unexpected behavior in dependent systems
- Inconsistent results in related queries

**Detection Metrics:**
- Audit cache keys: `redis-cli --scan --pattern "*" | xargs redis-cli ttl`
- Alert if TTL variance > 50% for related keys
- Monitor for inconsistency patterns in logs

**Mitigation Strategies:**
- **Standardize TTL:** Use consistent TTL for related data (e.g., all user data = 300s)
- **Document TTL strategy:** Clearly document why different TTLs are used
- **Audit TTLs:** Regularly review and update TTL values
- **Use configuration:** Centralize TTL configuration for easy updates
- **Group related data:** Cache related items with same TTL

### 4.7 Missing Null Value Handling

**Problem:** Null or missing values from the data store are not cached, causing repeated lookups.

**Real-World Impact:**
- User requests non-existent user ID (e.g., user:999999)
- Cache miss, database query executed
- Database returns null
- Next request for same ID: cache miss again
- 1000 requests for non-existent IDs = 1000 database queries
- Database load increases 10x for missing data

**Symptoms:**
- Repeated cache misses for non-existent data
- Unnecessary data store load
- Performance degradation for missing data
- Database query logs filled with "not found" queries

**Detection Metrics:**
- Monitor cache miss rate for non-existent keys
- Alert if database "not found" queries > 10% of total
- Track repeated lookups for same missing key

**Mitigation Strategies:**
- **Cache null values:** Store a sentinel value (e.g., "NULL") with shorter TTL (30s)
- **Bloom filters:** Use Bloom filters to quickly identify non-existent data
- **Explicit tracking:** Maintain a set of known missing keys
- **Shorter TTL for nulls:** Expire null values faster than real data

**Example (Pseudocode):**
```
function get_cached_data_with_null_handling(key):
  cache_key = CACHE_KEY_PREFIX + key

  cached_value = redis.get(cache_key)
  if cached_value is not null:
    if cached_value == "NULL_SENTINEL":
      return null
    return cached_value

  value = data_store.get(key)

  if value is null:
    // Cache the null value with shorter TTL (30s vs 300s)
    redis.set(cache_key, "NULL_SENTINEL", ex=30)
  else:
    redis.set(cache_key, value, ex=CACHE_TTL)

  return value
```

---

## 5. Redis-Specific Advantages for Cache-Aside

### 5.1 Performance Characteristics

**Sub-millisecond Latency:**
- Redis operations typically complete in < 1ms
- In-memory storage eliminates disk I/O
- Optimized C implementation for speed
- Suitable for latency-sensitive applications

**High Throughput:**
- Handles 100,000+ operations per second on modest hardware
- Single-threaded design eliminates lock contention
- Pipelining support for batch operations
- Scales horizontally with clustering

### 5.2 Data Structure Support

**Strings (Primary for Cache-Aside):**
- Efficient storage for serialized objects
- Atomic operations (GET, SET, GETSET)
- Bit operations for flags and counters

**Hashes:**
- Store related fields together (e.g., user profile)
- Efficient partial updates without full serialization
- Reduces memory overhead for structured data

**Lists, Sets, Sorted Sets:**
- Cache complex data structures directly
- Avoid serialization/deserialization overhead
- Enable efficient queries on cached data

### 5.3 TTL and Expiration

**Automatic Key Expiration:**
- Set TTL at write time: `SET key value EX seconds`
- Separate expiration: `EXPIRE key seconds`
- Check remaining TTL: `TTL key`
- No application-level expiration logic needed

**Expiration Accuracy:**
- Redis checks expiration lazily (on access) and actively (background task)
- Ensures expired keys don't consume memory indefinitely
- Configurable expiration sampling rate

### 5.4 Atomic Operations

**Compare-and-Swap (CAS):**
- `SET key value NX` (set if not exists)
- `SET key value XX` (set if exists)
- Enables lock-free cache stampede prevention

**Increment/Decrement:**
- `INCR`, `DECR` for atomic counters
- Useful for cache hit/miss metrics
- No race conditions in distributed systems

**Transactions:**
- `MULTI`/`EXEC` for multi-command atomicity
- Ensures consistency across multiple operations
- Useful for complex invalidation logic

### 5.5 Memory Efficiency

**Compact Storage:**
- Optimized internal representation
- Minimal overhead per key-value pair
- Efficient encoding for different data types

**Eviction Policies:**
- LRU (Least Recently Used): Evict least-accessed keys
- LFU (Least Frequently Used): Evict least-popular keys
- Random: Simple, predictable eviction
- TTL-based: Evict only keys with expiration set

**Memory Monitoring:**
- `INFO memory` command for memory statistics
- `MEMORY USAGE key` for per-key memory consumption
- Helps identify memory leaks and optimize cache size

### 5.6 Pub/Sub for Distributed Invalidation

**Multi-Instance Cache Invalidation:**
- Publish invalidation messages to channels
- Multiple application instances subscribe and invalidate locally
- Ensures consistency across distributed systems

**Example Pattern:**
```
// Instance A updates data
UPDATE data_store SET value = X WHERE id = 123
PUBLISH cache:invalidation "user:123"

// Instances B, C, D receive message
SUBSCRIBE cache:invalidation
// On message: DEL cache:user:123
```

### 5.7 Persistence Options

**RDB (Snapshots):**
- Periodic snapshots for recovery
- Useful for cache warming after restarts
- Reduces cold start latency

**AOF (Append-Only File):**
- Durability for critical cache data
- Enables point-in-time recovery
- Trade-off: Performance vs. durability

---

## 6. Best Practices and Recommendations

### 6.1 Cache Key Design

**Use Consistent Naming:**
- Prefix keys by data type: `user:123`, `product:456`, `session:abc`
- Include version numbers for schema changes: `user:v2:123`
- Use lowercase and hyphens for readability

**Example Patterns:**
```
user:{user_id}
product:{product_id}:{version}
session:{session_id}
cache:computed:{query_hash}
```

### 6.2 TTL Strategy

**Recommended Approach:**
- **Short-lived data** (user sessions): 5-15 minutes
- **Medium-lived data** (product info): 1-4 hours
- **Long-lived data** (reference data): 24 hours or longer
- **Critical data** (prices, inventory): 1-5 minutes

**Avoid:**
- No TTL (unbounded growth)
- Extremely short TTL (< 1 second, causes cache stampede)
- Extremely long TTL (> 7 days, stale data risk)

### 6.3 Error Handling

**Always Implement Fallback:**
- Cache failures should not break the application
- Fall back to data store on Redis errors
- Log errors for monitoring and debugging

**Connection Management:**
- Use connection pooling
- Set appropriate timeouts (e.g., 100-500ms)
- Implement retry logic with exponential backoff

### 6.4 Monitoring and Observability

**Key Metrics:**
- Cache hit ratio (target: > 80% for well-tuned cache)
- Cache miss ratio
- Average response time (with and without cache)
- Redis memory usage
- Eviction rate

**Logging:**
- Log cache misses for frequently accessed keys
- Log cache invalidations for debugging
- Log Redis connection errors

### 6.5 Testing Strategy

**Unit Tests:**
- Test cache hit/miss logic
- Test invalidation logic
- Test error handling and fallback

**Integration Tests:**
- Test with real Redis instance
- Test TTL expiration
- Test eviction policies

**Performance Tests:**
- Measure cache hit/miss performance
- Benchmark serialization overhead
- Test cache stampede scenarios

### 6.6 Security Considerations

**Data Sensitivity Classification:**

1. **Public Data** (no encryption needed)
   - Product catalogs
   - Public user profiles
   - Reference data
   - Example: `product:123 → {name: "Widget", price: 9.99}`

2. **Internal Data** (encryption recommended)
   - User preferences
   - Session data
   - Computed results
   - Example: `session:abc123 → {user_id: 123, permissions: [...]}`

3. **Sensitive Data** (encryption required)
   - Passwords (never cache)
   - API tokens and secrets
   - Payment information
   - PII (Personally Identifiable Information)
   - Example: Never cache `password:user123`

**Encryption Strategy:**
- Use Redis encryption at rest (Redis Enterprise)
- Use TLS for Redis connections in production
- Encrypt sensitive values before caching: `redis.set(key, encrypt(value))`
- Use separate Redis instances for sensitive data
- Implement key rotation for encryption keys

**Access Control:**
- Use Redis ACLs to restrict access by user/role
- Restrict Redis access to application servers only
- Use VPCs or firewalls to isolate Redis
- Audit Redis access logs regularly

**Compliance Considerations:**
- **GDPR:** Implement "right to be forgotten" by invalidating cache on user deletion
- **HIPAA:** Encrypt all cached health data
- **PCI-DSS:** Never cache full credit card numbers
- **SOC 2:** Maintain audit logs for cache access

**Example: Sensitive Data Handling**
```
// DON'T: Cache sensitive data unencrypted
redis.set("user:123:password", user.password)  // WRONG!

// DO: Encrypt sensitive data
encrypted_token = encrypt(api_token, encryption_key)
redis.set("user:123:token", encrypted_token, ex=3600)

// DO: Use separate Redis instance for sensitive data
sensitive_redis = redis.Redis(host="secure-redis.internal")
sensitive_redis.set("payment:123", encrypted_payment_info)
```

---

## 7. Troubleshooting Guide

### Problem: Cache Hit Ratio is Low (< 50%)

**Possible Causes:**
1. TTL too short → Increase TTL (60s → 300s)
2. Cache size too small → Increase Redis maxmemory
3. Eviction policy wrong → Use LRU instead of random
4. Keys not consistent → Standardize key format
5. Cache not being used → Verify cache-aside logic

**Diagnostic Steps:**
```
1. Check hit ratio: redis-cli INFO stats | grep hits
2. Check memory: redis-cli INFO memory | grep used_memory
3. Check eviction: redis-cli CONFIG GET maxmemory-policy
4. Check key patterns: redis-cli SCAN 0 MATCH "cache:*" COUNT 100
5. Check TTL: redis-cli --scan --pattern "cache:*" | xargs redis-cli ttl
```

**Solution:**
```
// Increase TTL
redis.set(cache_key, value, ex=300)  // 300s instead of 60s

// Increase Redis memory
redis-cli CONFIG SET maxmemory 1gb

// Use LRU eviction
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

### Problem: Memory Usage Keeps Growing

**Possible Causes:**
1. Keys without TTL → Add TTL to all keys
2. Eviction policy not working → Check maxmemory setting
3. Memory leak in application → Check for unbounded data structures
4. Large values being cached → Compress or split values

**Diagnostic Steps:**
```
1. Check memory: redis-cli INFO memory
2. Check keys without TTL: redis-cli --scan --pattern "*" | xargs redis-cli ttl | grep -c "^-1$"
3. Check largest keys: redis-cli --bigkeys
4. Check memory per key: redis-cli --scan --pattern "*" | xargs redis-cli MEMORY USAGE
```

**Solution:**
```
// Ensure all keys have TTL
redis.set(cache_key, value, ex=300)

// Set maxmemory limit
redis-cli CONFIG SET maxmemory 512mb

// Remove keys without TTL
redis-cli --scan --pattern "*" | xargs redis-cli ttl | grep "^-1$" | xargs redis-cli del
```

### Problem: Latency is High (> 10ms)

**Possible Causes:**
1. Serialization overhead → Use efficient format (MessagePack)
2. Large values → Compress or split values
3. Network latency → Check Redis connection
4. Redis overloaded → Check CPU and memory usage

**Diagnostic Steps:**
```
1. Measure serialization time
2. Check Redis latency: redis-cli --latency
3. Check Redis CPU: redis-cli INFO stats | grep instantaneous_ops_per_sec
4. Check network: ping redis-host
```

**Solution:**
```
// Use efficient serialization
import msgpack
serialized = msgpack.packb(value)  // Faster than JSON

// Compress large values
import gzip
compressed = gzip.compress(json.dumps(value).encode())

// Reduce value size
// Cache individual fields instead of entire objects
```

### Problem: Data is Stale

**Possible Causes:**
1. TTL too long → Reduce TTL (3600s → 300s)
2. Cache not invalidated on update → Implement invalidation
3. Invalidation failing silently → Add error handling
4. Multiple instances not coordinated → Use Pub/Sub

**Diagnostic Steps:**
```
1. Check TTL: redis-cli ttl cache:key
2. Check invalidation logs
3. Compare cache vs. database values
4. Check for invalidation errors
```

**Solution:**
```
// Reduce TTL for critical data
redis.set(cache_key, value, ex=60)  // 60s for critical data

// Implement invalidation
redis.delete(cache_key)

// Use Pub/Sub for distributed invalidation
redis.publish("cache:invalidation", key)
```

### Problem: Redis Connection Errors

**Possible Causes:**
1. Redis down → Check Redis status
2. Connection timeout → Increase timeout
3. Connection pool exhausted → Increase pool size
4. Network issues → Check network connectivity

**Diagnostic Steps:**
```
1. Check Redis: redis-cli ping
2. Check connection: telnet redis-host 6379
3. Check logs: redis-cli INFO stats
4. Check network: ping redis-host
```

**Solution:**
```
// Increase timeout
redis.Redis(host='localhost', socket_timeout=5)

// Increase connection pool
pool = redis.ConnectionPool(max_connections=20)

// Implement fallback
try:
    value = redis.get(key)
except redis.ConnectionError:
    value = data_store.get(key)
```

---

## 7. Implementation Checklist

- [ ] Redis instance running and accessible
- [ ] Redis client library installed and configured
- [ ] Mock data source created with simulated latency
- [ ] Basic cache-aside logic implemented
- [ ] Cache invalidation logic implemented
- [ ] TTL configured for all cache keys
- [ ] Eviction policy configured
- [ ] Error handling and fallback implemented
- [ ] Metrics collection implemented
- [ ] Monitoring and alerting configured
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Performance tests completed
- [ ] Documentation updated
- [ ] Code reviewed and approved

---

## 8. Success Criteria

The tutorial is successful when readers can:

1. Explain the cache-aside pattern and its trade-offs
2. Implement cache-aside logic in their chosen language
3. Configure Redis TTL and eviction policies
4. Handle cache invalidation correctly
5. Monitor cache performance and identify issues
6. Troubleshoot common cache-aside problems
7. Apply best practices to their own applications

