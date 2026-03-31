---
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

## Installation

Install the `redis` package from npm:

```bash
npm install redis
```

## Using the Node.js module

The `TokenBucket` class provides an async interface for rate limiting
([source](token_bucket.js)):

```javascript
import { createClient } from 'redis';
import { TokenBucket } from './token_bucket.js';

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

A demonstration Express server is included to show the rate limiter in action
([source](demo_server.js)):

```bash
# Install dependencies
npm install redis express

# Run the demo server
node demo_server.js
```

The demo provides an interactive web interface where you can:

* Submit requests and see them allowed or denied in real-time
* View the current token count
* Adjust rate limit parameters dynamically
* Test different rate limiting scenarios

The demo assumes Redis is running on `localhost:6379` but you can easily change the host and port by setting the `REDIS_URL` environment variable. Visit `http://localhost:8080` in your browser to try it out.

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

## Learn more

* [EVAL command]({{< relref "/commands/eval" >}}) - Execute Lua scripts
* [EVALSHA command]({{< relref "/commands/evalsha" >}}) - Execute cached Lua scripts
* [Lua scripting]({{< relref "/develop/programmability/eval-intro" >}}) - Introduction to Redis Lua scripting
* [HMGET command]({{< relref "/commands/hmget" >}}) - Get multiple hash fields
* [HMSET command]({{< relref "/commands/hmset" >}}) - Set multiple hash fields
* [Node.js client]({{< relref "/develop/clients/nodejs" >}}) - Redis Node.js client documentation

