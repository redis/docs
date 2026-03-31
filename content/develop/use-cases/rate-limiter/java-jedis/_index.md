---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a token bucket rate limiter using Redis and Lua scripts in Java
linkTitle: Java rate limiter
title: Token bucket rate limiter with Redis and Java
weight: 4
---

This guide shows you how to implement a distributed token bucket rate limiter using Redis and Lua scripts in Java with the [`Jedis`]({{< relref "/develop/clients/jedis" >}}) client library.

## Overview

Rate limiting is a critical technique for controlling the rate at which operations are performed. Common use cases include:

* Limiting API requests per user or IP address
* Preventing abuse and protecting against denial-of-service attacks
* Ensuring fair resource allocation across multiple clients
* Throttling background jobs or batch operations

The **token bucket algorithm** is a popular rate limiting approach that allows bursts of traffic while maintaining an average rate limit over time. This guide covers the Java implementation using the [`Jedis`]({{< relref "/develop/clients/jedis" >}}) client library, taking advantage of Java's `try-with-resources` for connection management, `JedisPool` for connection pooling, and checked exceptions for error handling.

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

Add the Jedis dependency to your project:

* If you use **Maven**:

  ```xml
  <dependency>
      <groupId>redis.clients</groupId>
      <artifactId>jedis</artifactId>
      <version>5.2.0</version>
  </dependency>
  ```

* If you use **Gradle**:

  ```groovy
  implementation 'redis.clients:jedis:5.2.0'
  ```

## Using the Java class

The `TokenBucket` class provides a thread-safe interface for rate limiting
([source](TokenBucket.java)):

```java
import redis.clients.jedis.JedisPooled;

public class Main {
    public static void main(String[] args) {
        // Create a Redis connection using JedisPooled (includes built-in connection pooling)
        JedisPooled jedis = new JedisPooled("localhost", 6379);

        // Create a rate limiter: 10 requests per second
        TokenBucket limiter = new TokenBucket.Builder()
                .jedis(jedis)
                .capacity(10)        // Maximum burst size
                .refillRate(1)       // Add 1 token per interval
                .refillInterval(1.0) // Every 1 second
                .build();

        // Check if a request should be allowed
        TokenBucket.Result result = limiter.allow("user:123");

        if (result.isAllowed()) {
            System.out.printf("Request allowed. %.0f tokens remaining.%n", result.getRemaining());
            // Process the request
        } else {
            System.out.println("Request denied. Rate limit exceeded.");
            // Return 429 Too Many Requests
        }
    }
}
```

Jedis operations are synchronous and thread-safe when using `JedisPooled`, which manages a pool of connections internally. The `allow()` method returns a `Result` object containing both the decision and the remaining token count.

### Configuration parameters

* **capacity**: Maximum number of tokens in the bucket (controls burst size)
* **refillRate**: Number of tokens added per refill interval
* **refillInterval**: Time in seconds between refills

For example:
* `capacity=10, refillRate=1, refillInterval=1.0` allows 10 requests per second with bursts up to 10
* `capacity=100, refillRate=10, refillInterval=1.0` allows 10 requests per second with bursts up to 100
* `capacity=60, refillRate=1, refillInterval=60.0` allows 1 request per minute with bursts up to 60

### Rate limit keys

The `key` parameter identifies what you're rate limiting. Common patterns:

* **Per user**: `user:{userId}` - Limit each user independently
* **Per IP address**: `ip:{ipAddress}` - Limit by client IP
* **Per API endpoint**: `api:{endpoint}:{userId}` - Different limits per endpoint
* **Global**: `global:api` - Single limit shared across all requests

### Script caching with EVALSHA

The Java implementation uses [`EVALSHA`]({{< relref "/commands/evalsha" >}}) for optimal performance. On first use, the Lua script is loaded into Redis with `SCRIPT LOAD`, and subsequent calls use the cached SHA1 hash. If the script is evicted from the cache, the class automatically falls back to [`EVAL`]({{< relref "/commands/eval" >}}) and reloads the script. The script loading uses `volatile` and synchronization to ensure thread safety across multiple threads.

```java
// The class handles script caching automatically.
// First call loads the script, subsequent calls use EVALSHA.
TokenBucket.Result result1 = limiter.allow("user:123"); // Uses EVAL + caches
TokenBucket.Result result2 = limiter.allow("user:123"); // Uses EVALSHA (faster)
```

### Thread safety

The `TokenBucket` class is thread-safe. You can share a single instance across your application, including from multiple threads in a servlet container or web framework:

```java
// Create a shared limiter instance
TokenBucket limiter = new TokenBucket.Builder()
        .jedis(jedis)
        .capacity(10)
        .refillRate(1)
        .refillInterval(1.0)
        .build();

// Safe to call from multiple threads
ExecutorService executor = Executors.newFixedThreadPool(10);
for (int i = 0; i < 20; i++) {
    final int id = i;
    executor.submit(() -> {
        TokenBucket.Result result = limiter.allow("shared:resource");
        System.out.printf("thread %d: allowed=%b remaining=%.0f%n",
                id, result.isAllowed(), result.getRemaining());
    });
}
executor.shutdown();
```

## Running the demo

A demonstration HTTP server is included to show the rate limiter in action
([source](DemoServer.java)):

```bash
# Compile
javac -cp jedis-5.2.0.jar TokenBucket.java DemoServer.java

# Run the demo server
java -cp .:jedis-5.2.0.jar DemoServer
```

The demo provides an interactive web interface where you can:

* Submit requests and see them allowed or denied in real-time
* View the current token count
* Adjust rate limit parameters dynamically
* Test different rate limiting scenarios

The demo assumes Redis is running on `localhost:6379` but you can specify a different host and port using the `--redis-host HOST` and `--redis-port PORT` command-line arguments. Visit `http://localhost:8080` in your browser to try it out.

## Response headers

It's common to include rate limit information in HTTP response headers:

```java
TokenBucket.Result result = limiter.allow("user:" + userId);

// Add standard rate limit headers
response.setHeader("X-RateLimit-Limit", String.valueOf(limiter.getCapacity()));
response.setHeader("X-RateLimit-Remaining", String.valueOf((int) result.getRemaining()));
response.setHeader("X-RateLimit-Reset",
        String.valueOf(System.currentTimeMillis() / 1000 + (long) limiter.getRefillInterval()));

if (!result.isAllowed()) {
    response.setHeader("Retry-After", String.valueOf((int) limiter.getRefillInterval()));
    response.setStatus(429); // Too Many Requests
}
```

## Customization

### Using as a servlet filter

You can wrap the rate limiter as a servlet filter for use with any Java web framework:

```java
public class RateLimitFilter implements Filter {
    private TokenBucket limiter;

    @Override
    public void init(FilterConfig config) {
        JedisPooled jedis = new JedisPooled("localhost", 6379);
        limiter = new TokenBucket.Builder()
                .jedis(jedis)
                .capacity(10)
                .refillRate(1)
                .refillInterval(1.0)
                .build();
    }

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpReq = (HttpServletRequest) req;
        HttpServletResponse httpRes = (HttpServletResponse) res;

        String key = "ip:" + httpReq.getRemoteAddr();
        TokenBucket.Result result = limiter.allow(key);

        httpRes.setHeader("X-RateLimit-Remaining",
                String.valueOf((int) result.getRemaining()));

        if (!result.isAllowed()) {
            httpRes.setStatus(429);
            httpRes.getWriter().write("{\"error\": \"Rate limit exceeded\"}");
            return;
        }
        chain.doFilter(req, res);
    }
}
```

### Error handling

The `allow()` method may throw a `JedisException` if the Redis connection is lost. Wrap calls in try/catch blocks for production use:

```java
try {
    TokenBucket.Result result = limiter.allow("user:123");
    // Handle result
} catch (JedisException e) {
    System.err.println("Rate limiter error: " + e.getMessage());
    // Fail open: allow the request when Redis is unavailable
    // Or fail closed: deny the request
}
```

## Learn more

* [EVAL command]({{< relref "/commands/eval" >}}) - Execute Lua scripts
* [EVALSHA command]({{< relref "/commands/evalsha" >}}) - Execute cached Lua scripts
* [Lua scripting]({{< relref "/develop/programmability/eval-intro" >}}) - Introduction to Redis Lua scripting
* [HMGET command]({{< relref "/commands/hmget" >}}) - Get multiple hash fields
* [HMSET command]({{< relref "/commands/hmset" >}}) - Set multiple hash fields
* [Jedis client]({{< relref "/develop/clients/jedis" >}}) - Redis Java client documentation

