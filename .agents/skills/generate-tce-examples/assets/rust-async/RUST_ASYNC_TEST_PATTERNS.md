# Rust Async (redis-rs) Test File Patterns

This document describes the conventions used in redis-rs asynchronous documentation test files.

## Purpose

These test files serve dual purposes:
1. **Executable Rust async tests** - Validate code snippets work correctly
2. **Documentation source** - Code is extracted for redis.io documentation

## File Locations

- **Sample template**: `tests/sample_test.rs` (in this directory)

## Marker Reference

| Marker | Purpose |
|--------|---------|
| `// EXAMPLE: <name>` | Identifies example name (matches docs folder) |
| `// HIDE_START` / `// HIDE_END` | Code hidden from docs but still executed |
| `// REMOVE_START` / `// REMOVE_END` | Code completely removed from docs |
| `// STEP_START <name>` / `// STEP_END` | Named section for targeted doc inclusion |

## File Structure Template

```rust
// EXAMPLE: example_name

// HIDE_START
use redis::AsyncCommands;
// HIDE_END

// REMOVE_START
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_run() {
// REMOVE_END
        // STEP_START connect
        let client = redis::Client::open("redis://127.0.0.1/").unwrap();
        let mut con = client.get_multiplexed_async_connection().await.unwrap();
        // STEP_END

        // REMOVE_START
        let _: () = redis::cmd("DEL").arg("mykey").query_async(&mut con).await.unwrap();
        // REMOVE_END

        // STEP_START string_ops
        let _: () = con.set("mykey", "Hello").await.unwrap();
        println!("SET mykey Hello: OK"); // >>> OK

        let value: String = con.get("mykey").await.unwrap();
        println!("GET mykey: {}", value); // >>> Hello
        // STEP_END

        // REMOVE_START
        assert_eq!(value, "Hello");
        let _: () = redis::cmd("DEL").arg("mykey").query_async(&mut con).await.unwrap();
// REMOVE_END
// REMOVE_START
    }
}
// REMOVE_END
```

## Key Patterns

### 1. Imports (in HIDE block)
```rust
// HIDE_START
use redis::AsyncCommands;
// HIDE_END
```

### 2. Async Test Structure (in REMOVE blocks)
```rust
// REMOVE_START
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_run() {
// REMOVE_END
        // ... async code ...
// REMOVE_START
    }
}
// REMOVE_END
```

### 3. Async Connection Setup
```rust
// STEP_START connect
let client = redis::Client::open("redis://127.0.0.1/").unwrap();
let mut con = client.get_multiplexed_async_connection().await.unwrap();
// STEP_END
```

### 4. Async Operations
```rust
// All operations use .await
let _: () = con.set("key", "value").await.unwrap();
let value: String = con.get("key").await.unwrap();
```

### 5. Assertions (in REMOVE blocks)
```rust
// REMOVE_START
assert_eq!(value, "Hello");
let _: () = redis::cmd("DEL").arg("mykey").query_async(&mut con).await.unwrap();
// REMOVE_END
```

### 6. Hash Operations (Async)
```rust
// Single field
let _: () = con.hset("myhash", "field1", "value1").await.unwrap();

// Multiple fields
let _: () = con.hset_multiple("myhash", &[
    ("field2", "value2"),
    ("field3", "value3"),
]).await.unwrap();

// Get operations
let value: String = con.hget("myhash", "field1").await.unwrap();
let all: std::collections::HashMap<String, String> = con.hgetall("myhash").await.unwrap();
```

### 7. Raw Commands (Async)
```rust
let _: () = redis::cmd("DEL")
    .arg("key1")
    .arg("key2")
    .query_async(&mut con)
    .await
    .unwrap();
```

## Sync vs Async Comparison

| Aspect | Sync | Async |
|--------|------|-------|
| Import | `use redis::Commands;` | `use redis::AsyncCommands;` |
| Test attr | `#[test]` | `#[tokio::test]` |
| Connection | `get_connection()` | `get_multiplexed_async_connection().await` |
| Operations | `con.set(...).unwrap()` | `con.set(...).await.unwrap()` |
| Raw cmd | `.query(&mut con)` | `.query_async(&mut con).await` |

## Directory Structure

Cargo requires test files to be in a specific location:

```
examples/rust-async/
├── Cargo.toml
├── RUST_ASYNC_TEST_PATTERNS.md
└── tests/
    └── sample_test.rs
```

## Running Tests

```bash
# Build and fetch dependencies
cargo build

# Run all tests
cargo test

# Run specific test
cargo test test_run

# Run with output
cargo test -- --nocapture
```

## Cargo.toml

```toml
[package]
name = "redis_examples_async"
version = "0.1.0"
edition = "2021"

[dependencies]
redis = { version = "1.0", features = ["tokio-comp"] }
tokio = { version = "1", features = ["full"] }

[dev-dependencies]
# Tests use the same dependencies
```

## API Notes

- Use `redis::AsyncCommands` trait for convenient async methods
- Requires `tokio-comp` feature in redis crate
- Use `get_multiplexed_async_connection()` for async connection
- All operations require `.await`

## See Also

- Sample template: `tests/sample_test.rs` (in this directory)
