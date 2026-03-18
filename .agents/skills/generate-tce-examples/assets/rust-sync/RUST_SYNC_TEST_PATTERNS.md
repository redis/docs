# Rust Sync (redis-rs) Test File Patterns

This document describes the conventions used in redis-rs synchronous documentation test files.

## Purpose

These test files serve dual purposes:
1. **Executable Rust tests** - Validate code snippets work correctly
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
use redis::Commands;
// HIDE_END

// REMOVE_START
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_run() {
// REMOVE_END
        // STEP_START connect
        let client = redis::Client::open("redis://127.0.0.1/").unwrap();
        let mut con = client.get_connection().unwrap();
        // STEP_END

        // REMOVE_START
        let _: () = redis::cmd("DEL").arg("mykey").query(&mut con).unwrap();
        // REMOVE_END

        // STEP_START string_ops
        let _: () = con.set("mykey", "Hello").unwrap();
        println!("SET mykey Hello: OK"); // >>> OK

        let value: String = con.get("mykey").unwrap();
        println!("GET mykey: {}", value); // >>> Hello
        // STEP_END

        // REMOVE_START
        assert_eq!(value, "Hello");
        let _: () = redis::cmd("DEL").arg("mykey").query(&mut con).unwrap();
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
use redis::Commands;
// HIDE_END
```

### 2. Test Module Structure (in REMOVE blocks)
```rust
// REMOVE_START
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_run() {
// REMOVE_END
        // ... code ...
// REMOVE_START
    }
}
// REMOVE_END
```

### 3. Connection Setup
```rust
// STEP_START connect
let client = redis::Client::open("redis://127.0.0.1/").unwrap();
let mut con = client.get_connection().unwrap();
// STEP_END
```

### 4. Assertions (in REMOVE blocks)
```rust
// REMOVE_START
assert_eq!(value, "Hello");
assert_eq!(count, 3);
let _: () = redis::cmd("DEL").arg("mykey").query(&mut con).unwrap();
// REMOVE_END
```

### 5. Console Output Comments
```rust
println!("SET mykey Hello: OK"); // >>> OK
println!("GET mykey: {}", value); // >>> Hello
```

### 6. Hash Operations
```rust
// Single field
let _: () = con.hset("myhash", "field1", "value1").unwrap();

// Multiple fields
let _: () = con.hset_multiple("myhash", &[
    ("field2", "value2"),
    ("field3", "value3"),
]).unwrap();

// Get operations
let value: String = con.hget("myhash", "field1").unwrap();
let all: std::collections::HashMap<String, String> = con.hgetall("myhash").unwrap();
```

### 7. Type Annotations
```rust
// Explicit type for set operations (returns nothing)
let _: () = con.set("key", "value").unwrap();

// Explicit type for get operations
let value: String = con.get("key").unwrap();
let count: i64 = con.hlen("myhash").unwrap();
```

## Directory Structure

Cargo requires test files to be in a specific location:

```
examples/rust-sync/
├── Cargo.toml
├── RUST_SYNC_TEST_PATTERNS.md
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
name = "redis_examples"
version = "0.1.0"
edition = "2021"

[dependencies]
redis = "1.0"

[dev-dependencies]
# Tests use the same redis dependency
```

## API Notes

- Use `redis::Commands` trait for convenient methods
- All operations return `RedisResult<T>`, use `.unwrap()` for examples
- Type annotations required for return values
- Connection is mutable (`&mut con`)

## See Also

- Sample template: `tests/sample_test.rs` (in this directory)
