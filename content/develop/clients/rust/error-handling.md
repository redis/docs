---
title: Error handling
description: Learn how to handle errors when using redis-rs
linkTitle: Error handling
scope: implementation
relatedPages:
- /develop/clients/error-handling
topics:
- error-handling
- resilience
weight: 50
---

redis-rs uses **Result types** following Rust's idiomatic error handling pattern. Code examples in the documentation often omit error handling for brevity,
but it is essential in production code.
This page explains how redis-rs's error handling works and how to apply
some common error handling patterns. For an overview of error types and handling
strategies, see [Error handling]({{< relref "/develop/clients/error-handling" >}}).

## Error handling in Rust

In Rust, functions return errors using the `Result<T, E>` type. You can check for errors explicitly with code like the following:

```rust
use redis::Commands;

let client = redis::Client::open("redis://127.0.0.1/")?;
let mut con = client.get_connection()?;

match con.get::<_, String>("key") {
    Ok(value) => println!("Value: {}", value),
    Err(e) => {
        // Handle the error
        eprintln!("Error: {}", e);
    }
}
```

## Error types

redis-rs provides a `RedisError` type with various error kinds. Common error kinds include:

| Error Kind | When it occurs | Recoverable | Recommended action |
|---|---|---|---|
| `ErrorKind::Io` | Network or I/O error | ✅ | Retry with backoff or fall back to alternative |
| `ErrorKind::AuthenticationFailed` | Invalid credentials | ❌ | Fix credentials and fail |
| `ErrorKind::UnexpectedReturnType` | Type mismatch | ❌ | Fix the command or type conversion |
| `ErrorKind::Server` | Redis server error response | ⚠️ | Check specific server error; some are retryable |
| `ErrorKind::Parse` | Failed to parse server response | ❌ | Report as a bug |

See [Categories of errors]({{< relref "/develop/clients/error-handling#categories-of-errors" >}})
for a more detailed discussion of these errors and their causes.

## Applying error handling patterns

The [Error handling]({{< relref "/develop/clients/error-handling" >}}) overview
describes four main patterns. The sections below show how to implement them in
redis-rs:

### Pattern 1: Fail fast

Return the error immediately if it represents an unrecoverable situation (see
[Pattern 1: Fail fast]({{< relref "/develop/clients/error-handling#pattern-1-fail-fast" >}})
for a full description):

```rust
use redis::{Commands, RedisResult};

fn get_value(con: &mut redis::Connection, key: &str) -> RedisResult<String> {
    // Using ? operator to propagate errors immediately
    let value: String = con.get(key)?;
    Ok(value)
}
```

### Pattern 2: Graceful degradation

Check for specific errors and fall back to an alternative (see
[Pattern 2: Graceful degradation]({{< relref "/develop/clients/error-handling#pattern-2-graceful-degradation" >}})
for a full description):

```rust
use redis::{Commands, ErrorKind};

fn get_with_fallback(
    con: &mut redis::Connection,
    key: &str,
) -> Result<String, Box<dyn std::error::Error>> {
    match con.get::<_, String>(key) {
        Ok(value) => Ok(value),
        Err(e) => {
            if e.kind() == ErrorKind::Io {
                // Network error, use fallback
                log::warn!("Cache unavailable, using database");
                database_get(key)
            } else {
                Err(Box::new(e))
            }
        }
    }
}
```

### Pattern 3: Retry with backoff

Retry on temporary errors such as timeouts (see
[Pattern 3: Retry with backoff]({{< relref "/develop/clients/error-handling#pattern-3-retry-with-backoff" >}})
for a full description):

```rust
use redis::{Commands, ErrorKind};
use std::thread;
use std::time::Duration;

fn get_with_retry(
    con: &mut redis::Connection,
    key: &str,
    max_attempts: u32,
) -> redis::RedisResult<String> {
    let mut delay = Duration::from_millis(100);
    
    for attempt in 0..max_attempts {
        match con.get::<_, String>(key) {
            Ok(value) => return Ok(value),
            Err(e) => {
                if attempt < max_attempts - 1 && e.kind() == ErrorKind::Io {
                    thread::sleep(delay);
                    delay *= 2; // Exponential backoff
                    continue;
                }
                return Err(e);
            }
        }
    }
    
    unreachable!()
}
```

### Pattern 4: Log and continue

Log non-critical errors and continue (see
[Pattern 4: Log and continue]({{< relref "/develop/clients/error-handling#pattern-4-log-and-continue" >}})
for a full description):

```rust
use redis::{Commands, ErrorKind};

fn cache_value(con: &mut redis::Connection, key: &str, value: &str) {
    if let Err(e) = con.set_ex::<_, _, _, ()>(key, value, 3600) {
        if e.kind() == ErrorKind::Io {
            log::warn!("Failed to cache {}, continuing without cache", key);
            // Application continues normally
        } else {
            log::error!("Unexpected error caching {}: {}", key, e);
        }
    }
}
```

## Async error handling

Error handling works the same way when you use async/await with redis-rs,
as shown in the example below:

```rust
use redis::AsyncCommands;

async fn get_with_fallback_async(
    con: &mut redis::aio::MultiplexedConnection,
    key: &str,
) -> Result<String, Box<dyn std::error::Error>> {
    match con.get::<_, String>(key).await {
        Ok(value) => Ok(value),
        Err(e) => {
            if e.kind() == redis::ErrorKind::Io {
                log::warn!("Cache unavailable");
                database_get_async(key).await
            } else {
                Err(Box::new(e))
            }
        }
    }
}
```

## See also

- [Error handling]({{< relref "/develop/clients/error-handling" >}})
- [redis-rs documentation](https://docs.rs/redis/latest/redis/)

