---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a token bucket rate limiter using Redis and Lua scripts in Rust
linkTitle: Rust rate limiter
title: Token bucket rate limiter with Redis and Rust
weight: 8
---

This guide shows you how to implement a distributed token bucket rate limiter using Redis and Lua scripts in Rust with the [`redis-rs`]({{< relref "/develop/clients/rust" >}}) client library.

## Overview

Rate limiting is a critical technique for controlling the rate at which operations are performed. Common use cases include:

* Limiting API requests per user or IP address
* Preventing abuse and protecting against denial-of-service attacks
* Ensuring fair resource allocation across multiple clients
* Throttling background jobs or batch operations

The **token bucket algorithm** is a popular rate limiting approach that allows bursts of traffic while maintaining an average rate limit over time. This guide covers the Rust implementation using the [`redis-rs`]({{< relref "/develop/clients/rust" >}}) client library, taking advantage of Rust's type safety, ownership model, and zero-cost abstractions.

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

Add the `redis` crate to your `Cargo.toml`:

```toml
[dependencies]
redis = "0.24"
```

For async support, enable the `tokio-comp` or `async-std-comp` feature:

```toml
[dependencies]
redis = { version = "0.24", features = ["tokio-comp"] }
tokio = { version = "1", features = ["full"] }
```

## Using the Rust module

The `TokenBucket` struct provides a type-safe interface for rate limiting
([source](token_bucket.rs)):

```rust
use redis::{Client, Commands, RedisResult};

fn main() -> RedisResult<()> {
    // Create a Redis connection
    let client = Client::open("redis://localhost:6379/")?;
    let mut con = client.get_connection()?;

    // Create a rate limiter: 10 requests per second
    let limiter = TokenBucket::new(
        10,   // capacity: Maximum burst size
        1.0,  // refill_rate: Add 1 token per interval
        1.0,  // refill_interval: Every 1 second
    );

    // Check if a request should be allowed
    let result = limiter.allow(&mut con, "user:123")?;

    if result.allowed {
        println!("Request allowed. {} tokens remaining.", result.remaining);
        // Process the request
    } else {
        println!("Request denied. Rate limit exceeded.");
        // Return 429 Too Many Requests
    }

    Ok(())
}
```

Rust's `Result` type provides compile-time error handling, ensuring all Redis errors are handled explicitly. The `TokenBucket` struct owns its configuration, leveraging Rust's ownership model to prevent data races.

### Configuration parameters

* **capacity**: Maximum number of tokens in the bucket (controls burst size)
* **refill_rate**: Number of tokens added per refill interval (as `f64`)
* **refill_interval**: Time in seconds between refills (as `f64`)

For example:
* `capacity: 10, refill_rate: 1.0, refill_interval: 1.0` allows 10 requests per second with bursts up to 10
* `capacity: 100, refill_rate: 10.0, refill_interval: 1.0` allows 10 requests per second with bursts up to 100
* `capacity: 60, refill_rate: 1.0, refill_interval: 60.0` allows 1 request per minute with bursts up to 60

### Rate limit keys

The `key` parameter identifies what you're rate limiting. Common patterns:

* **Per user**: `user:{user_id}` - Limit each user independently
* **Per IP address**: `ip:{ip_address}` - Limit by client IP
* **Per API endpoint**: `api:{endpoint}:{user_id}` - Different limits per endpoint
* **Global**: `global:api` - Single limit shared across all requests

### Script caching with EVALSHA

The Rust implementation uses [`EVALSHA`]({{< relref "/commands/evalsha" >}}) for optimal performance. The script is loaded once with `SCRIPT LOAD`, and subsequent calls use the cached SHA1 hash. If the script is evicted, the module automatically falls back to [`EVAL`]({{< relref "/commands/eval" >}}) and reloads it:

```rust
// The module handles script caching automatically.
// First call loads the script, subsequent calls use EVALSHA.
let result1 = limiter.allow(&mut con, "user:123")?; // Uses EVAL + caches
let result2 = limiter.allow(&mut con, "user:123")?; // Uses EVALSHA (faster)
```

### Thread safety with Arc and Mutex

For concurrent access across threads, wrap the connection in `Arc<Mutex<>>`:

```rust
use std::sync::{Arc, Mutex};
use std::thread;

let client = Client::open("redis://localhost:6379/")?;
let connection = Arc::new(Mutex::new(client.get_connection()?));

let limiter = TokenBucket::new(10, 1.0, 1.0);

let handles: Vec<_> = (0..10)
    .map(|i| {
        let con = Arc::clone(&connection);
        let limiter = limiter.clone();
        thread::spawn(move || {
            let mut con = con.lock().unwrap();
            match limiter.allow(&mut *con, "shared:resource") {
                Ok(result) => {
                    println!("Thread {}: allowed={}, remaining={}",
                             i, result.allowed, result.remaining);
                }
                Err(e) => eprintln!("Thread {}: error: {}", i, e),
            }
        })
    })
    .collect();

for handle in handles {
    handle.join().unwrap();
}
```

## Running the demo

A demonstration HTTP server is included to show the rate limiter in action
([source](demo_server.rs)):

```bash
# Install dependencies
cargo build

# Run the demo server
cargo run --bin demo
```

The demo provides an interactive web interface where you can:

* Submit requests and see them allowed or denied in real-time
* View the current token count
* Adjust rate limit parameters dynamically
* Test different rate limiting scenarios

The demo assumes Redis is running on `localhost:6379` but you can specify a different host using the `REDIS_URL` environment variable. Visit `http://localhost:8080` in your browser to try it out.

## Response headers

It's common to include rate limit information in HTTP response headers. Here's an example using a hypothetical web framework:

```rust
use std::time::{SystemTime, UNIX_EPOCH};

fn handle_request(
    limiter: &TokenBucket,
    con: &mut Connection,
    user_id: &str,
) -> Result<Response, Error> {
    let result = limiter.allow(con, &format!("user:{}", user_id))?;

    let mut response = Response::new();

    // Add standard rate limit headers
    response.headers.insert(
        "X-RateLimit-Limit",
        limiter.capacity.to_string(),
    );
    response.headers.insert(
        "X-RateLimit-Remaining",
        result.remaining.floor().to_string(),
    );

    let reset_time = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() + limiter.refill_interval as u64;
    response.headers.insert(
        "X-RateLimit-Reset",
        reset_time.to_string(),
    );

    if !result.allowed {
        response.status = 429; // Too Many Requests
        response.headers.insert(
            "Retry-After",
            limiter.refill_interval.floor().to_string(),
        );
        return Ok(response);
    }

    // Process the request
    Ok(response)
}
```

## Customization

### Using with async/await

For async web frameworks like `actix-web` or `axum`, use the async version of the Redis client:

```rust
use redis::aio::Connection;

async fn rate_limit_check(
    limiter: &TokenBucket,
    con: &mut Connection,
    key: &str,
) -> redis::RedisResult<RateLimitResult> {
    limiter.allow_async(con, key).await
}

// Example with axum
use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
};

async fn handle_request(
    State(app_state): State<AppState>,
) -> impl IntoResponse {
    let mut con = app_state.redis_pool.get().await.unwrap();

    match app_state.limiter.allow_async(&mut con, "user:123").await {
        Ok(result) if result.allowed => {
            (StatusCode::OK, "Request processed")
        }
        Ok(_) => {
            (StatusCode::TOO_MANY_REQUESTS, "Rate limit exceeded")
        }
        Err(e) => {
            eprintln!("Redis error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, "Service unavailable")
        }
    }
}
```

### Error handling strategies

The `allow` method returns a `RedisResult`, which you should handle based on your requirements. Decide whether to fail open (allow requests) or fail closed (deny requests) when Redis is unavailable:

```rust
// Fail open: allow requests when Redis is unavailable
let allowed = match limiter.allow(&mut con, "user:123") {
    Ok(result) => result.allowed,
    Err(e) => {
        eprintln!("Rate limiter error: {}. Failing open.", e);
        true // Allow the request
    }
};

// Or fail closed: deny requests when Redis is unavailable
let allowed = match limiter.allow(&mut con, "user:123") {
    Ok(result) => result.allowed,
    Err(e) => {
        eprintln!("Rate limiter error: {}. Failing closed.", e);
        false // Deny the request
    }
};
```

### Using with connection pools

For production use, maintain a connection pool rather than creating connections per request:

```rust
use r2d2_redis::{r2d2, RedisConnectionManager};

// Create a connection pool
let manager = RedisConnectionManager::new("redis://localhost:6379")?;
let pool = r2d2::Pool::builder()
    .max_size(15)
    .build(manager)?;

let limiter = TokenBucket::new(10, 1.0, 1.0);

// Use the pool
let mut con = pool.get()?;
let result = limiter.allow(&mut *con, "user:123")?;
```

### Custom token consumption

To consume multiple tokens per request, modify the Lua script or call `allow` multiple times:

```rust
// Reserve 5 tokens for a batch operation
let mut tokens_acquired = 0;
for _ in 0..5 {
    match limiter.allow(&mut con, "batch:operation")? {
        result if result.allowed => tokens_acquired += 1,
        _ => break,
    }
}

if tokens_acquired == 5 {
    println!("Batch operation allowed");
} else {
    println!("Not enough tokens. Acquired: {}", tokens_acquired);
}
```

## Learn more

* [EVAL command]({{< relref "/commands/eval" >}}) - Execute Lua scripts
* [EVALSHA command]({{< relref "/commands/evalsha" >}}) - Execute cached Lua scripts
* [Lua scripting]({{< relref "/develop/programmability/eval-intro" >}}) - Introduction to Redis Lua scripting
* [HMGET command]({{< relref "/commands/hmget" >}}) - Get multiple hash fields
* [HMSET command]({{< relref "/commands/hmset" >}}) - Set multiple hash fields
* [Rust client]({{< relref "/develop/clients/rust" >}}) - Redis Rust client documentation


