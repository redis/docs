---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a token bucket rate limiter using Redis and Lua scripts in Go
linkTitle: Go rate limiter
title: Token bucket rate limiter with Redis and Go
weight: 3
---

This guide shows you how to implement a distributed token bucket rate limiter using Redis and Lua scripts in Go with the [`go-redis`]({{< relref "/develop/clients/go" >}}) client library.

## Overview

Rate limiting is a critical technique for controlling the rate at which operations are performed. Common use cases include:

* Limiting API requests per user or IP address
* Preventing abuse and protecting against denial-of-service attacks
* Ensuring fair resource allocation across multiple clients
* Throttling background jobs or batch operations

The **token bucket algorithm** is a popular rate limiting approach that allows bursts of traffic while maintaining an average rate limit over time. This guide covers the Go implementation using the [`go-redis`]({{< relref "/develop/clients/go" >}}) client library, taking advantage of Go's `context.Context` for cancellation and timeouts, explicit error handling, and goroutine safety.

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

Install the `go-redis` package:

```bash
go get github.com/redis/go-redis/v9
```

## Using the Go package

The `TokenBucket` struct provides a concurrency-safe interface for rate limiting
([source](token_bucket.go)):

```go
package main

import (
    "context"
    "fmt"
    "log"

    "github.com/redis/go-redis/v9"
)

func main() {
    ctx := context.Background()

    // Create a Redis connection
    rdb := redis.NewClient(&redis.Options{
        Addr: "localhost:6379",
    })

    // Create a rate limiter: 10 requests per second
    limiter := NewTokenBucket(TokenBucketConfig{
        RedisClient:    rdb,
        Capacity:       10,  // Maximum burst size
        RefillRate:     1,   // Add 1 token per interval
        RefillInterval: 1.0, // Every 1 second
    })

    // Check if a request should be allowed
    allowed, remaining, err := limiter.Allow(ctx, "user:123")
    if err != nil {
        log.Fatalf("rate limiter error: %v", err)
    }

    if allowed {
        fmt.Printf("Request allowed. %.0f tokens remaining.\n", remaining)
        // Process the request
    } else {
        fmt.Println("Request denied. Rate limit exceeded.")
        // Return 429 Too Many Requests
    }
}
```

Go's `context.Context` is passed to every call, allowing you to set deadlines and handle cancellation. The `Allow` method returns an explicit `error` value following Go conventions.

### Configuration parameters

* **Capacity**: Maximum number of tokens in the bucket (controls burst size)
* **RefillRate**: Number of tokens added per refill interval
* **RefillInterval**: Time in seconds between refills

For example:
* `Capacity: 10, RefillRate: 1, RefillInterval: 1.0` allows 10 requests per second with bursts up to 10
* `Capacity: 100, RefillRate: 10, RefillInterval: 1.0` allows 10 requests per second with bursts up to 100
* `Capacity: 60, RefillRate: 1, RefillInterval: 60.0` allows 1 request per minute with bursts up to 60

### Rate limit keys

The `key` parameter identifies what you're rate limiting. Common patterns:

* **Per user**: `user:{userID}` - Limit each user independently
* **Per IP address**: `ip:{ipAddress}` - Limit by client IP
* **Per API endpoint**: `api:{endpoint}:{userID}` - Different limits per endpoint
* **Global**: `global:api` - Single limit shared across all requests

### Script caching with EVALSHA

The Go implementation uses [`EVALSHA`]({{< relref "/commands/evalsha" >}}) for optimal performance. On first use, the Lua script is loaded into Redis with `SCRIPT LOAD`, and subsequent calls use the cached SHA1 hash. If the script is evicted from the cache, the module automatically falls back to [`EVAL`]({{< relref "/commands/eval" >}}) and reloads the script. The script loading is protected with a `sync.Once` to ensure thread safety across goroutines.

```go
// The package handles script caching automatically.
// First call loads the script, subsequent calls use EVALSHA.
allowed1, remaining1, _ := limiter.Allow(ctx, "user:123") // Uses EVAL + caches
allowed2, remaining2, _ := limiter.Allow(ctx, "user:123") // Uses EVALSHA (faster)
```

### Goroutine safety

The `TokenBucket` struct is safe for concurrent use from multiple goroutines. You can share a single limiter instance across your application:

```go
limiter := NewTokenBucket(TokenBucketConfig{
    RedisClient:    rdb,
    Capacity:       10,
    RefillRate:     1,
    RefillInterval: 1.0,
})

// Safe to call from multiple goroutines
var wg sync.WaitGroup
for i := 0; i < 20; i++ {
    wg.Add(1)
    go func(id int) {
        defer wg.Done()
        allowed, remaining, err := limiter.Allow(ctx, "shared:resource")
        if err != nil {
            log.Printf("goroutine %d: error: %v", id, err)
            return
        }
        log.Printf("goroutine %d: allowed=%v remaining=%.0f", id, allowed, remaining)
    }(i)
}
wg.Wait()
```

## Running the demo

A demonstration HTTP server is included to show the rate limiter in action
([source](demo_server.go)):

```bash
# Install dependencies
go get github.com/redis/go-redis/v9

# Run the demo server
go run demo_server.go token_bucket.go
```

The demo provides an interactive web interface where you can:

* Submit requests and see them allowed or denied in real-time
* View the current token count
* Adjust rate limit parameters dynamically
* Test different rate limiting scenarios

The demo assumes Redis is running on `localhost:6379` but you can specify a different host and port using the `--redis-host` and `--redis-port` command-line arguments. Visit `http://localhost:8080` in your browser to try it out.

## Response headers

It's common to include rate limit information in HTTP response headers:

```go
allowed, remaining, err := limiter.Allow(ctx, fmt.Sprintf("user:%s", userID))
if err != nil {
    http.Error(w, "Internal Server Error", http.StatusInternalServerError)
    return
}

// Add standard rate limit headers
w.Header().Set("X-RateLimit-Limit", strconv.Itoa(limiter.Capacity))
w.Header().Set("X-RateLimit-Remaining", strconv.FormatFloat(remaining, 'f', 0, 64))
w.Header().Set("X-RateLimit-Reset", strconv.FormatInt(time.Now().Add(
    time.Duration(limiter.RefillInterval*float64(time.Second))).Unix(), 10))

if !allowed {
    w.Header().Set("Retry-After", strconv.FormatFloat(limiter.RefillInterval, 'f', 0, 64))
    http.Error(w, "Too Many Requests", http.StatusTooManyRequests)
    return
}
```

## Customization

### Using as HTTP middleware

You can wrap the rate limiter as HTTP middleware for use with the standard library or any compatible router:

```go
func RateLimitMiddleware(limiter *TokenBucket, keyFn func(*http.Request) string) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            key := keyFn(r)
            allowed, remaining, err := limiter.Allow(r.Context(), key)
            if err != nil {
                http.Error(w, "Internal Server Error", http.StatusInternalServerError)
                return
            }

            w.Header().Set("X-RateLimit-Remaining", strconv.FormatFloat(remaining, 'f', 0, 64))

            if !allowed {
                http.Error(w, "Rate limit exceeded", http.StatusTooManyRequests)
                return
            }
            next.ServeHTTP(w, r)
        })
    }
}

// Apply per-IP rate limiting
mux := http.NewServeMux()
handler := RateLimitMiddleware(limiter, func(r *http.Request) string {
    return fmt.Sprintf("ip:%s", r.RemoteAddr)
})(mux)
```

### Error handling

The `Allow` method returns an error if the Redis connection is lost. Decide whether to fail open (allow requests) or fail closed (deny requests) based on your requirements:

```go
allowed, remaining, err := limiter.Allow(ctx, "user:123")
if err != nil {
    log.Printf("rate limiter error: %v", err)
    // Fail open: allow the request when Redis is unavailable
    allowed = true
    // Or fail closed: deny the request
    // allowed = false
}
```

### Using with context timeouts

Go's `context.Context` lets you set deadlines for rate limit checks, which is useful when you don't want a slow Redis connection to block request processing:

```go
// Set a 100ms timeout for the rate limit check
ctx, cancel := context.WithTimeout(r.Context(), 100*time.Millisecond)
defer cancel()

allowed, remaining, err := limiter.Allow(ctx, "user:123")
if err != nil {
    // Context deadline exceeded or Redis error
    log.Printf("rate limit check timed out: %v", err)
    allowed = true // fail open
}
```

## Learn more

* [EVAL command]({{< relref "/commands/eval" >}}) - Execute Lua scripts
* [EVALSHA command]({{< relref "/commands/evalsha" >}}) - Execute cached Lua scripts
* [Lua scripting]({{< relref "/develop/programmability/eval-intro" >}}) - Introduction to Redis Lua scripting
* [HMGET command]({{< relref "/commands/hmget" >}}) - Get multiple hash fields
* [HMSET command]({{< relref "/commands/hmset" >}}) - Set multiple hash fields
* [Go client]({{< relref "/develop/clients/go" >}}) - Redis Go client documentation
