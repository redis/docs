---
name: generate-tce-examples
description: Generate tabbed code examples (TCEs) for Redis commands across all supported client languages
---

# Generate Tabbed Code Examples (TCEs)

This skill helps you create multi-language examples for a given sequence of Redis commands for a particular command page. The objective is to create examples in each supported language in a single iteration.

## When to Use This Skill

Use this skill after the `extract-redis-cli-examples` skill has identified CLI examples that need TCE implementations. This skill:
- Creates new example files or adds to existing ones
- Implements examples across all 10+ client languages
- Ensures correct use of TCE markers and client-specific APIs
- Validates implementations against a checklist

## Dual Folder Workspace

The workspace has two primary directories at the root level:

```
.../
├── clients/    # Client library repos and example files
└── docs/       # Documentation repository (current workspace)
```

### Client Library Repos (`clients/`)

Contains one directory for each Redis client GitHub repo (useful for API research):

```
clients/
├── NRedisStack      # C# client
├── StackExchange.Redis  # C# client (alternative)
├── go-redis         # Go client
├── ioredis          # Node.js client (alternative)
├── jedis            # Java client (sync)
├── lettuce          # Java client (async/reactive)
├── node-redis       # Node.js client (primary)
├── predis           # PHP client
├── redis-py         # Python client
└── redis-rs         # Rust client
```

### Example Test Directories (`clients/examples/`)

New or modified examples should be placed here for testing:

| Client | Directory |
|--------|-----------|
| C# (NRedisStack) | `clients/examples/NRedisStack/`* |
| Go (go-redis) | `clients/examples/go-redis/` |
| JavaScript (ioredis) | `clients/examples/ioredis/` |
| Java (Jedis) | `clients/examples/jedis/src/test/java/io/redis/examples/` |
| Java (Lettuce-async) | `clients/examples/lettuce-async/src/test/java/io/redis/examples/async/` |
| Java (Lettuce-reactive) | `clients/examples/lettuce-reactive/src/test/java/io/redis/examples/reactive/` |
| JavaScript (node-redis) | `clients/examples/node-redis/` |
| PHP (predis) | `clients/examples/predis/` |
| Python (redis-py) | `clients/examples/redis-py/` |
| Rust (async) | `clients/examples/rust-async/tests/` |
| Rust (sync) | `clients/examples/rust-sync/tests/` |

\* Note: the NRedisStack client examples directory given above is actually a clone of the redis/NRedisStack repo.
Tests go in the tests/Doc directory. There may already be existing tests there, but they can be overwritten by new examples.

### Command-API Mapping (`docs/data/command-api-mapping/`)

Contains JSON files mapping Redis commands to client APIs. Use these to find the correct method signatures:

```bash
cat data/command-api-mapping/HSET.json | jq '.api_calls.redis_py'
```

## Command Groups

TCEs are organized by command group. The group determines:
1. Which existing file to add to (or create)
2. The file naming convention per language

### Group List

| Group | Description |
|-------|-------------|
| `bf` | Bloom filter commands |
| `bitmap` | Bitfield and bitmap commands |
| `cf` | Cuckoo filter commands |
| `cluster` | Redis cluster commands |
| `cms` | Count-min sketch commands |
| `connection` | Connection commands |
| `generic` | Generic commands (apply to all key types) |
| `geo` | Geospatial commands |
| `hash` | Hash commands |
| `hyperloglog` | HyperLogLog commands |
| `json` | JSON module commands |
| `list` | List commands |
| `pubsub` | Pub/sub commands |
| `scripting` | Lua scripting commands |
| `search` | Search module commands |
| `server` | Server commands |
| `set` | Set commands |
| `sorted-set` | Sorted set commands |
| `stream` | Stream commands |
| `string` | String commands |
| `suggestion` | Suggestion commands |
| `tdigest` | T-digest commands |
| `timeseries` | Time series commands |
| `topk` | Top-k commands |
| `transactions` | Transaction commands |
| `vector_set` | Vector set commands |

### Finding a Command's Group

Check the Hugo frontmatter in the command's markdown file:

```bash
grep "^group:" content/commands/hset.md
# Output: group: hash
```

### File Naming by Group

For a group like `generic`, these are the file naming conventions:

| Client | File Name |
|--------|-----------|
| C# (NRedisStack) | `CmdsGenericExample.cs` |
| Go (go-redis) | `cmds_generic_test.go` |
| JavaScript (ioredis) | `cmds-generic.js` |
| Java (Jedis) | `CmdsGenericExample.java` |
| Java (Lettuce) | `CmdsGenericExample.java` |
| JavaScript (node-redis) | `cmds-generic.js` |
| PHP (predis) | `CmdGenericTest.php` |
| Python (redis-py) | `cmds_generic.py` |
| Rust | `cmds_generic.rs` |

**Pattern**: Replace `generic` with the group name, using the appropriate case convention:
- **PascalCase**: Java, C# (e.g., `CmdsHashExample.java`)
- **snake_case**: Python, Go, Rust (e.g., `cmds_hash.py`)
- **kebab-case**: JavaScript (e.g., `cmds-hash.js`)
- **PascalCase + singular**: PHP (e.g., `CmdHashTest.php`)


## Locating Existing Examples

Before creating new examples, check if implementations already exist. **This is critical to avoid overwriting existing steps.**

### Understanding the Three-Tier File Locations

| Location | Purpose | Lifecycle |
|----------|---------|-----------|
| `../clients/examples/<client>/` | **Testing area** - Write new/modified examples here for testing | Temporary; cleared after testing |
| `local_examples/<group>/<client>/` | **Staging area** - Tested examples pending merge to client repos. These files have MORE steps than client repo versions. | Semi-permanent; until merged |
| Client repos (e.g., `../redis-py/doctests/`) | **Source of truth** - Merged/official examples | Permanent |

**Example lifecycle for adding `hmget` step to redis-py:**
1. `local_examples/cmds_hash/redis-py/cmds_hash.py` has pending steps (`hdel`, `hexpire`)
2. Copy to `../clients/examples/redis-py/cmds_hash.py`, add `hmget`, test it
3. Once testing passes, update `local_examples/` with the tested file
4. Eventually, `local_examples/` gets merged to `../redis-py/doctests/`

### 1. Check `local_examples/` First (Staging Area)

This is where pending extensions live. **Always check here first** to get the most complete version:

```bash
find local_examples -name "cmds_hash*" -o -name "CmdsHash*"
# Example result: local_examples/cmds_hash/redis-py/cmds_hash.py
```

If the file exists here, it contains all pending changes. Use this as your base.

### 2. Check Client Repo Doc Tests (Source of Truth)

If the file does NOT exist in `local_examples/`, check the client repo:

| Client | Location |
|--------|----------|
| NRedisStack (C#) | `../NRedisStack/tests/Doc/` |
| go-redis (Go) | `../go-redis/doctests/` |
| ioredis (JavaScript) | No doc tests yet |
| jedis (Java) | `../jedis/src/test/java/io/redis/examples/` |
| lettuce (Java) | `../lettuce/src/test/java/io/redis/examples/async/` and `.../reactive/` |
| node-redis (JavaScript) | `../node-redis/doctests/` |
| predis (PHP) | No doc tests yet |
| redis-py (Python) | `../redis-py/doctests/` |
| redis-rs (Rust) | No doc tests yet |

### 3. Output to `clients/examples/` (Testing Area)

New or modified examples should be written to `../clients/examples/` for testing:

```bash
# Directory structure mirrors client repo structure
../clients/examples/redis-py/cmds_hash.py
../clients/examples/go-redis/cmds_hash_test.go
../clients/examples/jedis/src/test/java/io/redis/examples/CmdsHashExample.java
```

> **⚠️ WARNING**: Always copy the most complete version (from `local_examples/` or client repo) to `clients/examples/` before adding new steps. Creating a fresh file will lose existing steps!

## Order of Operations

### Step 1: Locate Existing Examples

**IMPORTANT**: Before creating any new files, you MUST check for existing examples:

1. **Check `local_examples/` first** - The staging area with pending extensions:
   ```bash
   find local_examples -name "*cmds_hash*" -o -name "*CmdsHash*"
   # Example: local_examples/cmds_hash/redis-py/cmds_hash.py
   ```

2. **Check client repo doc tests** - The source of truth for merged examples:
   ```bash
   # Example for go-redis
   ls ../go-redis/doctests/cmds_hash_test.go 2>/dev/null

   # Example for redis-py
   ls ../redis-py/doctests/cmds_hash.py 2>/dev/null
   ```

**Decision Tree:**

| Scenario | Action |
|----------|--------|
| File exists in `local_examples/` | Copy to `../clients/examples/`, add the new step, test |
| File exists in client repo but NOT in `local_examples/` | Copy from client repo to `../clients/examples/`, add the new step, test |
| File does NOT exist in either location | Create new file in `../clients/examples/` using templates in `assets/` |

> **Note on ioredis and hiredis**: These clients typically don't have existing doc test examples in the client repos or `local_examples/`. When adding steps for these clients, you will usually need to create a new file from scratch using the templates in `assets/ioredis/` and `assets/hiredis/`. This is expected behavior.

### Adding Examples to Existing Sets

Sometimes you need to add examples for a subset of clients rather than all of them. Common scenarios:

| Scenario | Action |
|----------|--------|
| New client added to supported list | Add examples for the new client only, matching existing step names/structure |
| Client was skipped previously | Backfill the missing client, matching existing implementations |
| Client implementation was broken | Fix or recreate the specific client's example |

**Key principles:**
1. **Match existing step names exactly** - If other clients have `scan1`, `scan2`, use those same names
2. **Match the example structure** - Follow the same Redis command sequence as existing implementations
3. **Only create missing pieces** - Don't regenerate clients that already have working examples
4. **Implement ALL existing steps** - When adding a new client to an existing group (e.g., adding ioredis to `cmds_generic`), implement all steps that exist for other clients, not just a subset

**Example: Adding ioredis to an existing cmds_hash set:**

```bash
# Step 1: Check what step names exist in other clients
grep "STEP_START" ../clients/examples/redis-py/cmds_hash.py
# Output: STEP_START hset, STEP_START hget, STEP_START hmget

# Step 2: Create ioredis implementation with the same steps
# (use assets/ioredis/sample_test.js as template, implement hset, hget, hmget steps)

# Step 3: Test the new implementation
cd ../clients/examples/ioredis && ./run.sh cmds-hash.js
```

**Example: Adding `hmget` step to redis-py (file exists in local_examples):**

```bash
# Step 1: Check if file exists in local_examples/
ls local_examples/cmds_hash/redis-py/cmds_hash.py
# Found! This file has pending extensions (hdel, hexpire, etc.)

# Step 2: Copy to clients/examples/ for testing
mkdir -p ../clients/examples/redis-py
cp local_examples/cmds_hash/redis-py/cmds_hash.py ../clients/examples/redis-py/

# Step 3: Add the new hmget step to the copied file
# (use str-replace-editor to add STEP_START hmget ... STEP_END block)

# Step 4: Test the example
# (run tests in ../clients/examples/redis-py/)
```

**Example: Adding step when file only exists in client repo:**

```bash
# Step 1: Check local_examples/ - not found
ls local_examples/cmds_hash/go-redis/cmds_hash_test.go 2>/dev/null

# Step 2: Check client repo - found!
ls ../go-redis/doctests/cmds_hash_test.go

# Step 3: Copy to clients/examples/ for testing
mkdir -p ../clients/examples/go-redis
cp ../go-redis/doctests/cmds_hash_test.go ../clients/examples/go-redis/

# Step 4: Add the new step to the copied file
# (use str-replace-editor to add STEP_START hmget ... STEP_END block)

# Step 5: Test the example
```

This ensures you preserve ALL existing steps when adding new ones.

### Step 2: Map Client APIs

Use the command-API mapping files to find correct method signatures:

```bash
# For HMGET command
cat data/command-api-mapping/HMGET.json | jq '.api_calls'
```

This shows the method name, parameters, and return types for each client.

### Step 3: Write the Code

Follow the conventions in `for-ais-only/tcedocs/SPECIFICATION.md` and the `*_TEST_PATTERNS.md` files in each asset directory.

**Key TCE Markers:**

| Marker | Purpose |
|--------|---------|
| `// EXAMPLE: <name>` | Example identifier (first line) |
| `// STEP_START <name>` | Begin named code section |
| `// STEP_END` | End named code section |
| `// HIDE_START/HIDE_END` | Code hidden but executed |
| `// REMOVE_START/REMOVE_END` | Code removed from docs (tests, cleanup) |

**Step Naming Convention:**

- For command pages with a **single example**: use the command name (e.g., `hmget`, `lpush`)
- For command pages with **multiple examples**: use numbered names (e.g., `scan1`, `scan2`, `scan3`)
- Keep step names lowercase and concise

**Code Structure Pattern:**

```
[EXAMPLE marker]
[HIDE block: imports, connection setup]
[REMOVE block: pre-test cleanup]
[STEP block: actual example code with output comments]
[REMOVE block: assertions]
[REMOVE block: post-test cleanup]
[HIDE block: disconnect/close]
```

### Step 4: Validate

Use this checklist before completing:

- [ ] All 10 client examples implemented
- [ ] Client-specific method signatures used correctly (from API mapping)
- [ ] TCE markers properly placed
- [ ] Expected output comments included (`// >>> value`)
- [ ] Assertions wrapped in REMOVE blocks
- [ ] Cleanup code wrapped in REMOVE blocks
- [ ] Return values match expected patterns

## Canonical Examples (Assets)

The `assets/` directory contains reference implementations for each client:

```
.agent/skills/generate-tce-examples/assets/
├── go-redis/
│   ├── GO_REDIS_TEST_PATTERNS.md
│   └── sample_test.go
├── hiredis/
│   └── ...
├── ioredis/
│   ├── IOREDIS_TEST_PATTERNS.md
│   └── sample_test.js
├── jedis/
│   ├── JEDIS_TEST_PATTERNS.md
│   └── src/test/java/...
├── lettuce-async/
│   └── ...
├── lettuce-reactive/
│   └── ...
├── node-redis/
│   ├── NODE_REDIS_TEST_PATTERNS.md
│   └── sample_test.js
├── nredisstack/
│   ├── NREDISSTACK_TEST_PATTERNS.md
│   └── nredisstack_sample_test.cs
├── predis/
│   ├── PREDIS_TEST_PATTERNS.md
│   └── SampleTest.php
├── redis-py/
│   ├── REDIS_PY_TEST_PATTERNS.md
│   └── sample_test.py
├── rust-async/
│   └── ...
└── rust-sync/
    └── ...
```

**Always consult** the `*_TEST_PATTERNS.md` file for each language before writing code.

## Client Language Quick Reference

### Python (redis-py)

```python
# EXAMPLE: cmds_hash
import redis

# HIDE_START
r = redis.Redis(decode_responses=True)
# HIDE_END

# REMOVE_START
r.delete("myhash")
# REMOVE_END

# STEP_START hmget
r.hset("myhash", mapping={"field1": "value1", "field2": "value2"})
result = r.hmget("myhash", ["field1", "field2", "nofield"])
print(result)  # >>> ['value1', 'value2', None]
# STEP_END

# REMOVE_START
assert result == ['value1', 'value2', None]
r.delete("myhash")
# REMOVE_END
```

### Node.js (node-redis)

```javascript
// EXAMPLE: cmds_hash
// HIDE_START
import assert from 'node:assert';
import { createClient } from 'redis';

const client = createClient();
await client.connect();
// HIDE_END

// REMOVE_START
await client.del('myhash');
// REMOVE_END

// STEP_START hmget
await client.hSet('myhash', { field1: 'value1', field2: 'value2' });
const result = await client.hmGet('myhash', ['field1', 'field2', 'nofield']);
console.log(result); // >>> ['value1', 'value2', null]
// STEP_END

// REMOVE_START
assert.deepEqual(result, ['value1', 'value2', null]);
await client.del('myhash');
// REMOVE_END

// HIDE_START
await client.quit();
// HIDE_END
```


### Java (Jedis)

```java
// EXAMPLE: cmds_hash
// HIDE_START
import redis.clients.jedis.RedisClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
// HIDE_END

public class CmdsHashExample {
    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        // HIDE_START
        RedisClient jedis = RedisClient.create("redis://localhost:6379");
        // HIDE_END

        // REMOVE_START
        jedis.del("myhash");
        // REMOVE_END

        // STEP_START hmget
        jedis.hset("myhash", "field1", "value1");
        jedis.hset("myhash", "field2", "value2");
        List<String> result = jedis.hmget("myhash", "field1", "field2", "nofield");
        System.out.println(result); // >>> [value1, value2, null]
        // STEP_END

        // REMOVE_START
        assertEquals(Arrays.asList("value1", "value2", null), result);
        jedis.del("myhash");
        // REMOVE_END

        // HIDE_START
        jedis.close();
        // HIDE_END
    }
}
```

### Go (go-redis)

```go
// EXAMPLE: cmds_hash
package example_commands_test

import (
    "context"
    "fmt"

    "github.com/redis/go-redis/v9"
)

func ExampleClient_hmget() {
    ctx := context.Background()

    rdb := redis.NewClient(&redis.Options{
        Addr: "localhost:6379",
    })

    // REMOVE_START
    rdb.Del(ctx, "myhash")
    // REMOVE_END

    // STEP_START hmget
    rdb.HSet(ctx, "myhash", "field1", "value1", "field2", "value2")
    result, err := rdb.HMGet(ctx, "myhash", "field1", "field2", "nofield").Result()
    if err != nil {
        panic(err)
    }
    fmt.Println(result) // >>> [value1 value2 <nil>]
    // STEP_END

    // REMOVE_START
    rdb.Del(ctx, "myhash")
    // REMOVE_END
}
```

### C# (NRedisStack)

```csharp
// EXAMPLE: cmds_hash
// BINDER_ID csharp-sample

using NRedisStack;
using NRedisStack.RedisStackCommands;
using StackExchange.Redis;
// REMOVE_START
using NRedisStack.Tests;
// REMOVE_END

// REMOVE_START
namespace Doc;

[Collection("DocsTests")]
// REMOVE_END
public class CmdsHashExample
// REMOVE_START
: AbstractNRedisStackTest, IDisposable
// REMOVE_END
{
    // REMOVE_START
    public CmdsHashExample(RedisFixture fixture) : base(fixture) { }

    [Fact]
    public void run()
    {
        SkipIfTargetConnectionDoesNotExist();
        var muxer = GetConnection();
        var db = GetCleanDatabase(muxer);
        // REMOVE_END

        // STEP_START hmget
        db.HashSet("myhash", new HashEntry[] {
            new HashEntry("field1", "value1"),
            new HashEntry("field2", "value2")
        });
        RedisValue[] result = db.HashGet("myhash", new RedisValue[] { "field1", "field2", "nofield" });
        Console.WriteLine(string.Join(", ", result)); // >>> value1, value2,
        // STEP_END

        // REMOVE_START
        Assert.Equal(new RedisValue[] { "value1", "value2", RedisValue.Null }, result);
        db.KeyDelete("myhash");
        // REMOVE_END

        // HIDE_START
        muxer.Close();
        // HIDE_END
    }
}
```

### PHP (Predis)

```php
// EXAMPLE: cmds_hash
<?php
// BINDER_ID php-sample

use PHPUnit\Framework\TestCase;
use Predis\Client as PredisClient;

class CmdHashTest
// REMOVE_START
extends TestCase
// REMOVE_END
{
    public function testHmget(): void
    {
        $redis = new PredisClient([
            'scheme' => 'tcp',
            'host'   => '127.0.0.1',
            'port'   => 6379,
        ]);

        // REMOVE_START
        $redis->del('myhash');
        // REMOVE_END

        // STEP_START hmget
        $redis->hset('myhash', 'field1', 'value1');
        $redis->hset('myhash', 'field2', 'value2');
        $result = $redis->hmget('myhash', ['field1', 'field2', 'nofield']);
        echo json_encode($result) . PHP_EOL; // >>> ["value1","value2",null]
        // STEP_END

        // REMOVE_START
        $this->assertEquals(['value1', 'value2', null], $result);
        $redis->del('myhash');
        // REMOVE_END
    }
}
```

### Rust (Sync)

> **IMPORTANT**: Rust test files must be placed in the `tests/` subdirectory (e.g., `rust-sync/tests/cmds_hash.rs`), NOT in the project root.

```rust
// EXAMPLE: cmds_hash
// File: tests/cmds_hash.rs
#[cfg(test)]
mod cmds_hash_tests {
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
        let _: Result<i32, _> = r.del("myhash");
        // REMOVE_END

        // STEP_START hmget
        let _: i32 = r.hset("myhash", "field1", "value1").unwrap();
        let _: i32 = r.hset("myhash", "field2", "value2").unwrap();

        match r.hmget::<_, _, Vec<Option<String>>>("myhash", &["field1", "field2", "nofield"]) {
            Ok(result) => {
                println!("{:?}", result); // >>> [Some("value1"), Some("value2"), None]
                // REMOVE_START
                assert_eq!(result, vec![Some("value1".to_string()), Some("value2".to_string()), None]);
                // REMOVE_END
            }
            Err(e) => println!("Error: {e}"),
        }
        // STEP_END

        // REMOVE_START
        let _: Result<i32, _> = r.del("myhash");
        // REMOVE_END
    }
}
```

### Rust (Async)

> **IMPORTANT**: Rust test files must be placed in the `tests/` subdirectory (e.g., `rust-async/tests/cmds_hash.rs`), NOT in the project root.

```rust
// EXAMPLE: cmds_hash
// File: tests/cmds_hash.rs
#[cfg(test)]
mod cmds_hash_tests {
    use redis::AsyncCommands;

    #[tokio::test]
    async fn run() {
        let client = match redis::Client::open("redis://127.0.0.1") {
            Ok(client) => client,
            Err(e) => {
                println!("Failed to create Redis client: {e}");
                return;
            }
        };

        let mut r = match client.get_multiplexed_async_connection().await {
            Ok(conn) => conn,
            Err(e) => {
                println!("Failed to connect to Redis: {e}");
                return;
            }
        };

        // REMOVE_START
        let _: Result<i32, _> = r.del("myhash").await;
        // REMOVE_END

        // STEP_START hmget
        let _: i32 = r.hset("myhash", "field1", "value1").await.unwrap();
        let _: i32 = r.hset("myhash", "field2", "value2").await.unwrap();

        match r.hmget::<_, _, Vec<Option<String>>>("myhash", &["field1", "field2", "nofield"]).await {
            Ok(result) => {
                println!("{:?}", result); // >>> [Some("value1"), Some("value2"), None]
                // REMOVE_START
                assert_eq!(result, vec![Some("value1".to_string()), Some("value2".to_string()), None]);
                // REMOVE_END
            }
            Err(e) => println!("Error: {e}"),
        }
        // STEP_END

        // REMOVE_START
        let _: Result<i32, _> = r.del("myhash").await;
        // REMOVE_END
    }
}
```

## Key Reference Files

| File | Purpose |
|------|---------|
| `for-ais-only/tcedocs/README.md` | Overview of TCE system |
| `for-ais-only/tcedocs/SPECIFICATION.md` | Complete technical specification |
| `for-ais-only/tcedocs/CLI_COMMAND_EXTRACTION_QUICK_REFERENCE.md` | CLI parsing rules |
| `config.toml` | Client configuration and display order |
| `data/examples.json` | Existing example implementations |
| `data/command-api-mapping/*.json` | Client API mappings per command |

## Tips

1. **Check API mappings first** - Don't guess method names; use the JSON files
2. **Match existing patterns** - If `cmds_hash` exists, follow its structure exactly
3. **Test incrementally** - Implement 2-3 languages, test, then continue
4. **Output comments matter** - `// >>> value` comments are extracted for documentation
5. **Use proper types** - Check return types in API mappings for correct variable types
6. **Clean up keys** - Always delete test keys in REMOVE blocks before and after