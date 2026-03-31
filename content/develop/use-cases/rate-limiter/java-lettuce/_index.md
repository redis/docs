---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a token bucket rate limiter using Redis and Lua scripts in Java with Lettuce
linkTitle: Java rate limiter (Lettuce)
title: Token bucket rate limiter with Redis and Java (Lettuce)
weight: 5
---

This guide shows you how to implement a distributed token bucket rate limiter using Redis and Lua scripts in Java with the [`Lettuce`]({{< relref "/develop/clients/lettuce" >}}) client library.

## Overview

Rate limiting is a critical technique for controlling the rate at which operations are performed. Common use cases include:

* Limiting API requests per user or IP address
* Preventing abuse and protecting against denial-of-service attacks
* Ensuring fair resource allocation across multiple clients
* Throttling background jobs or batch operations

The **token bucket algorithm** is a popular rate limiting approach that allows bursts of traffic while maintaining an average rate limit over time. This guide covers the Java implementation using the [`Lettuce`]({{< relref "/develop/clients/lettuce" >}}) client library, taking advantage of Lettuce's `RedisClient` for connection management, `StatefulRedisConnection` for multiplexed connections, and support for both synchronous and asynchronous command execution.

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

Add the Lettuce dependency to your project:

* If you use **Maven**:

  ```xml
  <dependency>
      <groupId>io.lettuce</groupId>
      <artifactId>lettuce-core</artifactId>
      <version>6.7.1.RELEASE</version>
  </dependency>
  ```

* If you use **Gradle**:

  ```groovy
  implementation 'io.lettuce:lettuce-core:6.7.1.RELEASE'
  ```

### Lettuce vs Jedis

Unlike [`Jedis`]({{< relref "/develop/clients/jedis" >}}), which uses a connection pool (`JedisPool`) with one thread per connection, Lettuce uses a single `RedisClient` with multiplexed connections through `StatefulRedisConnection`. This means:

* **No connection pool needed**: A single connection handles multiple concurrent requests
* **Thread-safe by default**: The `StatefulRedisConnection` and its command interfaces are thread-safe
* **Sync, async, and reactive**: You can choose the execution model that fits your application

## Using the Java class

The `TokenBucket` class provides a thread-safe interface for rate limiting
([source](TokenBucket.java)):

```java
import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;

public class Main {
    public static void main(String[] args) {
        // Create a Redis client and connection
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");
        StatefulRedisConnection<String, String> connection = redisClient.connect();

        // Create a rate limiter: 10 requests per second
        TokenBucket limiter = new TokenBucket(10, 1, 1.0, connection.sync());

        // Check if a request should be allowed
        TokenBucket.RateLimitResult result = limiter.allow("user:123");

        if (result.allowed()) {
            System.out.printf("Request allowed. %.0f tokens remaining.%n", result.remaining());
            // Process the request
        } else {
            System.out.println("Request denied. Rate limit exceeded.");
            // Return 429 Too Many Requests
        }

        // Clean up
        connection.close();
        redisClient.shutdown();
    }
}
```

Note that Lettuce takes a `StatefulRedisConnection` directly rather than a connection pool. The connection is multiplexed, so a single connection can safely handle concurrent requests from multiple threads. The `allow()` method returns a `RateLimitResult` record containing both the decision and the remaining token count.

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

The Java implementation uses [`EVALSHA`]({{< relref "/commands/evalsha" >}}) for optimal performance. On first use, the Lua script is loaded into Redis using Lettuce's `scriptLoad()` command, and subsequent calls use the cached SHA1 hash. If the script is evicted from the cache, the class automatically falls back to [`EVAL`]({{< relref "/commands/eval" >}}) and reloads the script. The script SHA is computed once on first use and cached for subsequent calls.

```java
// The class handles script caching automatically.
// First call loads the script, subsequent calls use EVALSHA.
TokenBucket.RateLimitResult result1 = limiter.allow("user:123"); // Uses EVAL + caches
TokenBucket.RateLimitResult result2 = limiter.allow("user:123"); // Uses EVALSHA (faster)
```

### Thread safety

The `TokenBucket` class is thread-safe because Lettuce's `StatefulRedisConnection` is inherently thread-safe and multiplexes commands over a single connection. You can share a single instance across your application:

```java
// Create shared resources
RedisClient redisClient = RedisClient.create("redis://localhost:6379");
StatefulRedisConnection<String, String> connection = redisClient.connect();
TokenBucket limiter = new TokenBucket(10, 1, 1.0, connection.sync());

// Safe to call from multiple threads
ExecutorService executor = Executors.newFixedThreadPool(10);
for (int i = 0; i < 20; i++) {
    final int id = i;
    executor.submit(() -> {
        TokenBucket.RateLimitResult result = limiter.allow("shared:resource");
        System.out.printf("thread %d: allowed=%b remaining=%.0f%n",
                id, result.allowed(), result.remaining());
    });
}
executor.shutdown();

// Clean up when done
connection.close();
redisClient.shutdown();
```

### Asynchronous usage

Unlike Jedis, Lettuce supports asynchronous command execution. While the `TokenBucket` class uses synchronous commands internally, you can easily adapt the pattern for async usage with Lettuce's async API:

```java
import io.lettuce.core.api.async.RedisAsyncCommands;
import io.lettuce.core.ScriptOutputType;

RedisAsyncCommands<String, String> asyncCommands = connection.async();

// Execute the Lua script asynchronously
RedisFuture<List<Long>> future = asyncCommands.evalsha(
        scriptSha,
        ScriptOutputType.MULTI,
        new String[]{"user:123"},
        String.valueOf(capacity),
        String.valueOf(refillRate),
        String.valueOf(refillInterval),
        String.valueOf(System.currentTimeMillis() / 1000.0)
);

// Process the result when ready
future.thenAccept(result -> {
    boolean allowed = result.get(0) == 1L;
    System.out.println("Allowed: " + allowed);
});
```

## Running the demo

A demonstration HTTP server is included to show the rate limiter in action
([source](DemoServer.java)):

```bash
# Compile
javac -cp lettuce-core-6.7.1.RELEASE.jar TokenBucket.java DemoServer.java

# Run the demo server
java -cp .:lettuce-core-6.7.1.RELEASE.jar DemoServer
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
int capacity = 10;
double refillInterval = 1.0;
RedisClient redisClient = RedisClient.create("redis://localhost:6379");
StatefulRedisConnection<String, String> connection = redisClient.connect();
TokenBucket limiter = new TokenBucket(capacity, 1, refillInterval, connection.sync());

TokenBucket.RateLimitResult result = limiter.allow("user:" + userId);

// Add standard rate limit headers
response.setHeader("X-RateLimit-Limit", String.valueOf(capacity));
response.setHeader("X-RateLimit-Remaining", String.valueOf((int) result.remaining()));
response.setHeader("X-RateLimit-Reset",
        String.valueOf(System.currentTimeMillis() / 1000 + (long) refillInterval));

if (!result.allowed()) {
    response.setHeader("Retry-After", String.valueOf((int) refillInterval));
    response.setStatus(429); // Too Many Requests
}
```

## Customization

### Using as a servlet filter

You can wrap the rate limiter as a servlet filter for use with any Java web framework:

```java
public class RateLimitFilter implements Filter {
    private RedisClient redisClient;
    private StatefulRedisConnection<String, String> connection;
    private TokenBucket limiter;

    @Override
    public void init(FilterConfig config) {
        redisClient = RedisClient.create("redis://localhost:6379");
        connection = redisClient.connect();
        limiter = new TokenBucket(10, 1, 1.0, connection.sync());
    }

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpReq = (HttpServletRequest) req;
        HttpServletResponse httpRes = (HttpServletResponse) res;

        String key = "ip:" + httpReq.getRemoteAddr();
        TokenBucket.RateLimitResult result = limiter.allow(key);

        httpRes.setHeader("X-RateLimit-Remaining",
                String.valueOf((int) result.remaining()));

        if (!result.allowed()) {
            httpRes.setStatus(429);
            httpRes.getWriter().write("{\"error\": \"Rate limit exceeded\"}");
            return;
        }
        chain.doFilter(req, res);
    }

    @Override
    public void destroy() {
        if (connection != null) connection.close();
        if (redisClient != null) redisClient.shutdown();
    }
}
```

Note that unlike the Jedis version, the Lettuce servlet filter includes a `destroy()` method to properly shut down the `RedisClient` and close the connection. This is important because Lettuce manages its own event loop threads that need to be cleaned up.

### Error handling

The `allow()` method may throw a `RedisException` if the Redis connection is lost. Wrap calls in try/catch blocks for production use:

```java
import io.lettuce.core.RedisException;

try {
    TokenBucket.RateLimitResult result = limiter.allow("user:123");
    // Handle result
} catch (RedisException e) {
    System.err.println("Rate limiter error: " + e.getMessage());
    // Fail open: allow the request when Redis is unavailable
    // Or fail closed: deny the request
}
```

Lettuce also supports automatic reconnection by default. If the connection to Redis is temporarily lost, Lettuce will attempt to reconnect and replay queued commands, providing better resilience than Jedis out of the box.

## Learn more

* [EVAL command]({{< relref "/commands/eval" >}}) - Execute Lua scripts
* [EVALSHA command]({{< relref "/commands/evalsha" >}}) - Execute cached Lua scripts
* [Lua scripting]({{< relref "/develop/programmability/eval-intro" >}}) - Introduction to Redis Lua scripting
* [HMGET command]({{< relref "/commands/hmget" >}}) - Get multiple hash fields
* [HMSET command]({{< relref "/commands/hmset" >}}) - Set multiple hash fields
* [Lettuce client]({{< relref "/develop/clients/lettuce" >}}) - Redis Lettuce client documentation
