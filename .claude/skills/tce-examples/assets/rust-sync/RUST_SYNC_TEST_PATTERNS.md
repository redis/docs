# Rust Sync (redis-rs) Test File Patterns

This document describes the conventions used in redis-rs synchronous documentation test files.

## Purpose

These test files serve dual purposes:
1. **Executable Rust tests** - Validate code snippets work correctly
2. **Documentation source** - Code is extracted for redis.io documentation

## File Locations

- **Sample template**: `sample_test.rs` (in this directory)
- **Generated examples**: must go in the project's `tests/` subdirectory
  (e.g. `rust-sync/tests/cmds_hash.rs`), never the project root — Cargo only
  discovers integration tests there.

## Marker Reference

| Marker | Purpose |
|--------|---------|
| `// EXAMPLE: <name>` | Identifies example name (matches docs folder) |
| `// HIDE_START` / `// HIDE_END` | Code hidden from docs but still executed |
| `// REMOVE_START` / `// REMOVE_END` | Code completely removed from docs |
| `// STEP_START <name>` / `// STEP_END` | Named section for targeted doc inclusion |

Every `*_START` marker must have a matching `*_END`. An unclosed anchor makes the
build abort the example, which then silently produces no output.

The `BINDER_ID` marker is valid for every language but is not used for Rust
examples — none of the published Rust examples set it.

## What the Build Strips Automatically

This matters for Rust, because it means the test scaffolding does **not** need
marker wrapping:

| Construct | Stripped from docs? |
|-----------|---------------------|
| `#[cfg(test)]` | ✅ Yes — automatic |
| `#[test]` | ✅ Yes — automatic |
| `#[tokio::test]` | ✅ Yes — automatic |
| `mod <name>_tests {` | ❌ No — appears in docs |
| `use redis::Commands;` | ❌ No — appears in docs |
| Closing `}` braces | ❌ No — appear in docs |

The three attributes are removed by the build's test-marker pass, so leave them
unmarked. Do **not** wrap the module in `REMOVE_START`/`REMOVE_END` — the
published examples deliberately show `mod ... { use redis::Commands; ... }` so
readers can see the imports.

## File Structure Template

```rust
// EXAMPLE: example_name
#[cfg(test)]
mod example_name_tests {
    use redis::Commands;
    use std::collections::HashMap;

    #[test]
    fn run() {
        let mut r = match redis::Client::open("redis://127.0.0.1") {
            Ok(client) => match client.get_connection() {
                Ok(conn) => conn,
                Err(e) => {
                    println!("Failed to connect to Redis: {e}");
                    return;
                }
            },
            Err(e) => {
                println!("Failed to create Redis client: {e}");
                return;
            }
        };

        // REMOVE_START
        // Clean up any existing data before tests
        let _: Result<i32, _> = r.del("mykey");
        // REMOVE_END

        // STEP_START operation_name
        match r.set("mykey", "Hello") {
            Ok(res1) => {
                let res1: String = res1;
                println!("{res1}"); // >>> OK
                // REMOVE_START
                assert_eq!(res1, "OK");
                // REMOVE_END
            }
            Err(e) => println!("Error: {e}"),
        }

        match r.get("mykey") {
            Ok(res2) => {
                let res2: String = res2;
                println!("{res2}"); // >>> Hello
                // REMOVE_START
                assert_eq!(res2, "Hello");
                // REMOVE_END
            }
            Err(e) => println!("Error: {e}"),
        }
        // STEP_END

        // REMOVE_START
        let _: Result<i32, _> = r.del("mykey");
        // REMOVE_END
    }
}
```

## Key Patterns

### 1. Module and Imports (unmarked)

The module wrapper and its imports are part of the published example. Name the
module after the example, suffixed with `_tests`:

```rust
#[cfg(test)]
mod cmds_hash_tests {
    use redis::Commands;
    use std::collections::HashMap;  // only when the example needs it
```

### 2. Test Function

Always named `run`, always `#[test]`:

```rust
    #[test]
    fn run() {
```

### 3. Connection Setup (unmarked, not a step)

The connection cascade is shown in the docs but is not wrapped in a
`STEP_START` block — steps begin at the first Redis command. It returns early
rather than panicking, so a missing server skips the example instead of failing
the suite:

```rust
let mut r = match redis::Client::open("redis://127.0.0.1") {
    Ok(client) => match client.get_connection() {
        Ok(conn) => conn,
        Err(e) => {
            println!("Failed to connect to Redis: {e}");
            return;
        }
    },
    Err(e) => {
        println!("Failed to create Redis client: {e}");
        return;
    }
};
```

The connection variable is named `r`.

### 4. Command Results: `match`, not `unwrap()`

Every command is handled with `match` (or `if let Ok(...)` when there is no
assertion to make), binding a numbered result variable. Bind the concrete type
on the first line of the `Ok` arm — this is how redis-rs is told what to
deserialize into:

```rust
match r.hget("myhash", "field1") {
    Ok(res5) => {
        let res5: String = res5;
        println!("{res5}"); // >>> value1
        // REMOVE_START
        assert_eq!(res5, "value1");
        // REMOVE_END
    }
    Err(e) => println!("Error: {e}"),
}
```

Avoid `.unwrap()` in the visible example code.

### 5. Assertions (in REMOVE blocks)

Assertions live inside the `Ok` arm, wrapped in `REMOVE_START`/`REMOVE_END`, so
they execute in tests but never appear in the docs:

```rust
// REMOVE_START
assert_eq!(res6.get("field1"), Some(&"value1".to_string()));
// REMOVE_END
```

### 6. Console Output Comments

Print the bound variable and annotate the real output. Never hardcode a literal
in the `println!` just to make the comment true:

```rust
println!("{res1}");              // >>> OK
println!("{:?}", res6.get("field1")); // >>> Some("value1")
```

### 7. Cleanup (in REMOVE blocks)

Use the typed-discard form of `del`, not raw `redis::cmd`:

```rust
// REMOVE_START
let _: Result<i32, _> = r.del("mykey");
let _: Result<i32, _> = r.del(&["bike:1", "bike:1:stats"]);
// REMOVE_END
```

### 8. Hash Operations

```rust
// Single field — returns the number of new fields
match r.hset("myhash", "field1", "value1") {
    Ok(res) => { let res: i32 = res; println!("{res}"); } // >>> 1
    Err(e) => println!("Error: {e}"),
}

// Multiple fields — returns "OK"
let hash_fields = vec![("field2", "value2"), ("field3", "value3")];
match r.hset_multiple("myhash", &hash_fields) {
    Ok(res) => { let res: String = res; println!("{res}"); } // >>> OK
    Err(e) => println!("Error: {e}"),
}

// Get all
match r.hgetall("myhash") {
    Ok(res) => {
        let res: HashMap<String, String> = res;
        println!("{:?}", res.get("field1")); // >>> Some("value1")
    }
    Err(e) => println!("Error: {e}"),
}
```

Note that `hset` returns an integer count while `hset_multiple` returns the
status string `OK` — a common source of wrong output comments.

## Directory Structure

Cargo requires integration tests to live under `tests/`:

```
examples/rust-sync/
├── Cargo.toml
├── RUST_SYNC_TEST_PATTERNS.md
├── sample_test.rs          # this template (reference only)
└── tests/
    └── cmds_hash.rs        # generated examples go here
```

## Running Tests

```bash
# Build and fetch dependencies
cargo build

# Run all tests
cargo test

# Run a single example's test
cargo test run

# Run with output visible
cargo test -- --nocapture
```

Because every example's test function is named `run`, `cargo test run` matches
all of them; use `cargo test --test cmds_hash` to target one file.

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

- Use the `redis::Commands` trait for convenient methods
- All operations return `RedisResult<T>`; handle with `match`, not `.unwrap()`
- Type annotations are required so redis-rs knows what to deserialize into
- The connection is mutable (`let mut r`)

## See Also

- Sample template: `sample_test.rs` (in this directory)
- Async counterpart: `../rust-async/RUST_ASYNC_TEST_PATTERNS.md`
