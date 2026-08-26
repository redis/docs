---
aliases:
- /develop/use-cases/rate-limiter/node-redis
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a token bucket rate limiter using Redis and Lua scripts in Node.js
linkTitle: Node.js rate limiter
title: Token bucket rate limiter with Redis and Node.js
weight: 2
---

This guide shows you how to implement a distributed token bucket rate limiter using Redis and Lua scripts in Node.js with async/await.

## Overview

Rate limiting is a critical technique for controlling the rate at which operations are performed. Common use cases include:

* Limiting API requests per user or IP address
* Preventing abuse and protecting against denial-of-service attacks
* Ensuring fair resource allocation across multiple clients
* Throttling background jobs or batch operations

The **token bucket algorithm** is a popular rate limiting approach that allows bursts of traffic while maintaining an average rate limit over time. This guide covers the Node.js implementation using the [`node-redis`]({{< relref "/develop/clients/nodejs" >}}) client library.

## How it works

The token bucket algorithm works like a bucket that holds tokens:

1. **Initialization**: The bucket starts with a maximum capacity of tokens
2. **Refill**: Tokens are added to the bucket at a constant rate (for example, 1 token per second)
3. **Consumption**: Each request consumes one token from the bucket
4. **Decision**: If tokens are available, the request is allowed; otherwise, it's denied
5. **Capacity limit**: The bucket never exceeds its maximum capacity

This approach allows for burst traffic (using accumulated tokens) while enforcing an average rate limit over time.

### Why use Redis?

Redis is ideal for distributed rate limiting because:

* **Atomic operations**: Lua scripts execute atomically, preventing race conditions
* **Shared state**: Multiple application servers can share the same rate limit counters
* **High performance**: In-memory operations provide microsecond latency
* **Automatic expiration**: Keys can be set to expire automatically (though not used in this implementation)

## The Lua script

The core of this implementation is a Lua script that runs atomically on the Redis server. This ensures that checking and updating the token bucket happens in a single operation, preventing race conditions in distributed environments.

Here's how the script works:

```lua
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local refill_interval = tonumber(ARGV[3])
local now = tonumber(ARGV[4])

-- Get current state or initialize
local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
local tokens = tonumber(bucket[1])
local last_refill = tonumber(bucket[2])

-- Initialize if this is the first request
if tokens == nil then
    tokens = capacity
    last_refill = now
end

-- Calculate token refill
local time_passed = now - last_refill
local refills = math.floor(time_passed / refill_interval)

if refills > 0 then
    tokens = math.min(capacity, tokens + (refills * refill_rate))
    last_refill = last_refill + (refills * refill_interval)
end

-- Try to consume a token
local allowed = 0
if tokens >= 1 then
    tokens = tokens - 1
    allowed = 1
end

-- Update state
redis.call('HMSET', key, 'tokens', tokens, 'last_refill', last_refill)

-- Return result: allowed (1 or 0) and remaining tokens
return {allowed, tokens}
```

### Script breakdown

1. **State retrieval**: Uses [`HMGET`]({{< relref "/commands/hmget" >}}) to fetch the current token count and last refill time from a hash
2. **Initialization**: On first use, sets tokens to full capacity
3. **Token refill calculation**: Computes how many tokens should be added based on elapsed time
4. **Capacity enforcement**: Uses `math.min()` to ensure tokens never exceed capacity
5. **Token consumption**: Decrements the token count if available
6. **State update**: Uses [`HMSET`]({{< relref "/commands/hmset" >}}) to save the new state
7. **Return value**: Returns both the decision (allowed/denied) and remaining tokens

### Why atomicity matters

Without atomic execution, race conditions could occur:

* **Double spending**: Two requests could read the same token count and both succeed when only one should
* **Lost updates**: Concurrent updates could overwrite each other's changes
* **Inconsistent state**: Token count and refill time could become desynchronized

Using [`EVAL`]({{< relref "/commands/eval" >}}) or [`EVALSHA`]({{< relref "/commands/evalsha" >}}) ensures the entire operation executes atomically, making it safe for distributed systems.

## Installation

Install the `redis` package from npm:

```bash
npm install redis
```

## Using the Node.js module

The `TokenBucket` class provides an async interface for rate limiting
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/rate-limiter/nodejs/tokenBucket.js)):

```javascript
const { createClient } = require('redis');
const { TokenBucket } = require('./tokenBucket');

// Create a Redis connection
const client = createClient({ url: 'redis://localhost:6379' });
await client.connect();

// Create a rate limiter: 10 requests per second
const limiter = new TokenBucket({
    redisClient: client,
    capacity: 10,        // Maximum burst size
    refillRate: 1,       // Add 1 token per interval
    refillInterval: 1.0  // Every 1 second
});

// Check if a request should be allowed
const { allowed, remaining } = await limiter.allow('user:123');

if (allowed) {
    console.log(`Request allowed. ${remaining} tokens remaining.`);
    // Process the request
} else {
    console.log('Request denied. Rate limit exceeded.');
    // Return 429 Too Many Requests
}

// Disconnect when done
await client.disconnect();
```

Because `node-redis` operations are asynchronous, the `allow()` method returns a Promise. Use `await` or `.then()` to handle the result.

### Configuration parameters

* **capacity**: Maximum number of tokens in the bucket (controls burst size)
* **refillRate**: Number of tokens added per refill interval
* **refillInterval**: Time in seconds between refills

For example:
* `capacity: 10, refillRate: 1, refillInterval: 1.0` allows 10 requests per second with bursts up to 10
* `capacity: 100, refillRate: 10, refillInterval: 1.0` allows 10 requests per second with bursts up to 100
* `capacity: 60, refillRate: 1, refillInterval: 60.0` allows 1 request per minute with bursts up to 60

### Rate limit keys

The `key` parameter identifies what you're rate limiting. Common patterns:

* **Per user**: `user:{userId}` - Limit each user independently
* **Per IP address**: `ip:{ipAddress}` - Limit by client IP
* **Per API endpoint**: `api:{endpoint}:{userId}` - Different limits per endpoint
* **Global**: `global:api` - Single limit shared across all requests

### Script caching with EVALSHA

The Node.js implementation uses [`EVALSHA`]({{< relref "/commands/evalsha" >}}) for optimal performance. On first use, the Lua script is loaded into Redis with `SCRIPT LOAD`, and subsequent calls use the cached SHA1 hash. If the script is evicted from the cache, the module automatically falls back to [`EVAL`]({{< relref "/commands/eval" >}}) and reloads the script.

```javascript
// The module handles script caching automatically.
// First call loads the script, subsequent calls use EVALSHA.
const result1 = await limiter.allow('user:123'); // Uses EVAL + caches
const result2 = await limiter.allow('user:123'); // Uses EVALSHA (faster)
```

## Running the demo

### Get the source files

The demo consists of two JavaScript files. Download them from the [`nodejs` source folder](https://github.com/redis/docs/tree/main/content/develop/use-cases/rate-limiter/nodejs) on GitHub, or grab them with `curl`:

```bash
mkdir rate-limiter-demo && cd rate-limiter-demo
BASE=https://raw.githubusercontent.com/redis/docs/main/content/develop/use-cases/rate-limiter/nodejs
curl -O $BASE/tokenBucket.js
curl -O $BASE/demoServer.js
```

### Start the demo server

A demonstration HTTP server is included to show the rate limiter in action
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/rate-limiter/nodejs/demoServer.js)):

```bash
# Install dependencies
npm install redis

# Run the demo server
node demoServer.js
```

The demo provides an interactive web interface where you can:

* Submit requests and see them allowed or denied in real-time
* View the current token count
* Adjust rate limit parameters dynamically
* Test different rate limiting scenarios

The demo assumes Redis is running on `localhost:6379` but you can specify a different host and port using the `--redis-host HOST` and `--redis-port PORT` command-line arguments. Visit `http://localhost:8080` in your browser to try it out.

## Response headers

It's common to include rate limit information in HTTP response headers:

```javascript
const { allowed, remaining } = await limiter.allow(`user:${userId}`);

// Add standard rate limit headers
res.set('X-RateLimit-Limit', String(limiter.capacity));
res.set('X-RateLimit-Remaining', String(Math.floor(remaining)));
res.set('X-RateLimit-Reset', String(Math.floor(Date.now() / 1000 + limiter.refillInterval)));

if (!allowed) {
    res.set('Retry-After', String(Math.ceil(limiter.refillInterval)));
    res.status(429).json({ error: 'Too Many Requests' });
    return;
}
```

## Customization

### Using with Express middleware

You can wrap the rate limiter as Express middleware for easy integration:

```javascript
function rateLimitMiddleware(limiter, keyFn) {
    return async (req, res, next) => {
        const key = keyFn(req);
        const { allowed, remaining } = await limiter.allow(key);

        res.set('X-RateLimit-Remaining', String(Math.floor(remaining)));

        if (!allowed) {
            res.status(429).json({ error: 'Rate limit exceeded' });
            return;
        }
        next();
    };
}

// Apply per-IP rate limiting
app.use(rateLimitMiddleware(limiter, (req) => `ip:${req.ip}`));
```

### Error handling

The `allow()` method may throw if the Redis connection is lost. Wrap calls in try/catch blocks for production use:

```javascript
try {
    const { allowed, remaining } = await limiter.allow('user:123');
    // Handle result
} catch (err) {
    console.error('Rate limiter error:', err);
    // Fail open or closed depending on your policy
}
```

## Alternative rate limiting algorithms

The token bucket algorithm above handles most use cases but Redis supports
other rate limiter patterns that might fit your requirements better. The table
below lists four other algorithms alongside token bucket and summarizes
their features:

| Algorithm | Memory | Accuracy | Burst behavior | Best for |
|---|---|---|---|---|
| [Token bucket](#how-it-works) | 1 key (hash) | Exact | Controlled bursts | APIs with bursty traffic |
| [Fixed window counter](#fixed-window-counter) | 1 key (string) | Approximate | 2x burst at boundaries | Simple API limits |
| [Sliding window log](#sliding-window-log) | O(n) entries | Exact | No bursts | High-value APIs, audit trails |
| [Sliding window counter](#sliding-window-counter) | 2 keys (string) | Near-exact | Smoothed boundaries | General-purpose APIs |
| [Leaky bucket (policing)](#leaky-bucket-policing) | 1 key (hash) | Exact | No bursts | Strict no-burst enforcement |

The sections below give example implementations of these other algorithms.
The three time-based algorithms call `redis.call('TIME')` inside the Lua
script to derive the current timestamp from the Redis server clock. This
eliminates clock drift when the limiter runs across multiple application
servers. The fixed window counter reads no clock: the key's TTL defines
the window.

### Fixed window counter

Counts requests within discrete, non-overlapping time intervals.
Simplest algorithm — one key per window, one `EVAL` round trip.

```javascript
const FIXED_WINDOW_SCRIPT = `
local key    = KEYS[1]
local limit  = tonumber(ARGV[1])
local window = tonumber(ARGV[2])

local count = redis.call('INCR', key)
if count == 1 then
    redis.call('EXPIRE', key, window)
end

local ttl = redis.call('PTTL', key)

if count > limit then
    return {0, ttl}
end
return {1, ttl}
`;

// Returns { allowed, retryAfterMs }. retryAfterMs is 0 when the request is allowed.
async function fixedWindowAllow(client, key, limit, windowSeconds) {
  const [allowed, ttl] = await client.eval(FIXED_WINDOW_SCRIPT, {
    keys: [key],
    arguments: [String(limit), String(windowSeconds)],
  });

  return {
    allowed: allowed === 1,
    retryAfterMs: allowed === 1 ? 0 : Number(ttl),
  };
}
```

**Trade-off**: A client can make 2x requests by sending `limit` requests
at the end of one window and `limit` requests at the start of the next.

### Sliding window log

Records the exact timestamp of every request in a sorted set.
Provides a true rolling window with no boundary bursts.

```javascript
const { randomUUID } = require("crypto");

const SLIDING_WINDOW_LOG_SCRIPT = `
local key    = KEYS[1]
local limit  = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local member = ARGV[3]

local t      = redis.call('TIME')
local now    = tonumber(t[1]) + tonumber(t[2]) / 1e6
local cutoff = now - window

redis.call('ZREMRANGEBYSCORE', key, '-inf', cutoff)

local count = redis.call('ZCARD', key)

if count < limit then
    redis.call('ZADD', key, now, member)
    redis.call('EXPIRE', key, window * 2)
    return {1, 0}
end

local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
local retry_after_ms = 0
if oldest[2] then
    retry_after_ms = math.floor((tonumber(oldest[2]) + window - now) * 1000)
end

return {0, retry_after_ms}
`;

async function slidingWindowLogAllow(client, key, limit, windowSeconds) {
  const [allowed, retryAfterMs] = await client.eval(SLIDING_WINDOW_LOG_SCRIPT, {
    keys: [key],
    arguments: [String(limit), String(windowSeconds), randomUUID()],
  });

  return { allowed: allowed === 1, retryAfterMs: Number(retryAfterMs) };
}
```

**Trade-off**: Memory grows O(n) with request volume. Not ideal for
high-volume, high-cardinality rate limiting.

### Sliding window counter

Blends two fixed-window counters using a weighted average to approximate
a true sliding window. Near-exact accuracy with the same low memory
footprint as a fixed window. The two keys use hash tags so they map
to the same slot in Redis Cluster.

```javascript
const SLIDING_WINDOW_COUNTER_SCRIPT = `
local base   = KEYS[1]
local limit  = tonumber(ARGV[1])
local window = tonumber(ARGV[2])

local t   = redis.call('TIME')
local now = tonumber(t[1]) + tonumber(t[2]) / 1e6

local window_num = math.floor(now / window)
local elapsed     = (now % window) / window

local curr_key = base .. ':' .. window_num
local prev_key = base .. ':' .. (window_num - 1)

local prev = tonumber(redis.call('GET', prev_key) or 0)
local curr = tonumber(redis.call('GET', curr_key) or 0)

local estimate = prev * (1 - elapsed) + curr

if estimate >= limit then
    return {0, 0}
end

local new_count = redis.call('INCR', curr_key)
if new_count == 1 then
    redis.call('EXPIRE', curr_key, window * 2)
end

return {1, 0}
`;

async function slidingWindowCounterAllow(client, key, limit, windowSeconds) {
  const [allowed] = await client.eval(SLIDING_WINDOW_COUNTER_SCRIPT, {
    keys: [`{${key}}`],
    arguments: [String(limit), String(windowSeconds)],
  });

  return { allowed: allowed === 1 };
}
```

**Trade-off**: The weighted estimate may let slightly more or fewer
requests through than the exact limit. Negligible for most apps.

### Leaky bucket (policing)

A virtual bucket fills with incoming requests and drains at a fixed rate.
If the bucket is full, requests are rejected immediately. This is the
policing variant — requests are allowed or denied instantly with no delay.

```javascript
const LEAKY_BUCKET_SCRIPT = `
local key       = KEYS[1]
local capacity  = tonumber(ARGV[1])
local leak_rate = tonumber(ARGV[2])

local t   = redis.call('TIME')
local now = tonumber(t[1]) + tonumber(t[2]) / 1e6

local data      = redis.call('HGETALL', key)
local level     = 0
local last_leak = now

if #data > 0 then
    for i = 1, #data, 2 do
        if data[i] == 'level' then
            level = tonumber(data[i+1])
        elseif data[i] == 'last_leak' then
            last_leak = tonumber(data[i+1])
        end
    end
end

local elapsed = now - last_leak
level = math.max(0, level - elapsed * leak_rate)

if level + 1 > capacity then
    return {0, math.floor((level + 1 - capacity) / leak_rate * 1000)}
end

level = level + 1
local ttl = math.ceil(capacity / leak_rate) + 1

redis.call('HSET', key, 'level', level, 'last_leak', now)
redis.call('EXPIRE', key, ttl)

return {1, 0}
`;

async function leakyBucketAllow(client, key, capacity, leakRate) {
  const [allowed, retryAfterMs] = await client.eval(LEAKY_BUCKET_SCRIPT, {
    keys: [key],
    arguments: [String(capacity), String(leakRate)],
  });

  return { allowed: allowed === 1, retryAfterMs: Number(retryAfterMs) };
}
```

**Trade-off**: Overflow traffic is rejected immediately. Clients must
handle `429 Too Many Requests` and retry with backoff.

## Learn more

* [EVAL command]({{< relref "/commands/eval" >}}) - Execute Lua scripts
* [EVALSHA command]({{< relref "/commands/evalsha" >}}) - Execute cached Lua scripts
* [Lua scripting]({{< relref "/develop/programmability/eval-intro" >}}) - Introduction to Redis Lua scripting
* [HMGET command]({{< relref "/commands/hmget" >}}) - Get multiple hash fields
* [HMSET command]({{< relref "/commands/hmset" >}}) - Set multiple hash fields
* [Node.js client]({{< relref "/develop/clients/nodejs" >}}) - Redis Node.js client documentation

