# go-redis Test File Patterns

This document describes the conventions used in go-redis documentation test files.

## Purpose

These test files serve dual purposes:
1. **Executable Go tests** - Validate code snippets work correctly
2. **Documentation source** - Code is extracted for redis.io documentation

## File Locations

- **Original tests**: `/path/to/go-redis/doctests/*_test.go`
- **Sample template**: `/path/to/docs/for-ais-only/examples/go-redis/sample_test.go`

## Marker Reference

| Marker | Purpose |
|--------|---------|
| `// EXAMPLE: <name>` | Identifies example name (matches docs folder) |
| `// HIDE_START` / `// HIDE_END` | Code hidden from docs but still executed |
| `// REMOVE_START` / `// REMOVE_END` | Code completely removed from docs |
| `// STEP_START <name>` / `// STEP_END` | Named section for targeted doc inclusion |

## File Structure Template (Testable Examples)

Go uses "Testable Examples" with `// Output:` comments for verification:

```go
// EXAMPLE: example_name
// HIDE_START
package example_commands_test

import (
    "context"
    "fmt"

    "github.com/redis/go-redis/v9"
)
// HIDE_END

func ExampleClient_operation_name() {
    ctx := context.Background()

    rdb := redis.NewClient(&redis.Options{
        Addr:     "localhost:6379",
        Password: "",
        DB:       0,
    })

    // REMOVE_START
    rdb.Del(ctx, "mykey")
    // REMOVE_END

    // STEP_START operation_name
    res, err := rdb.Set(ctx, "mykey", "Hello", 0).Result()
    if err != nil {
        panic(err)
    }
    fmt.Println(res) // >>> OK

    value, err := rdb.Get(ctx, "mykey").Result()
    if err != nil {
        panic(err)
    }
    fmt.Println(value) // >>> Hello
    // STEP_END

    // Output:
    // OK
    // Hello
}
```

## Key Patterns

### 1. Package and Imports (in HIDE block)
```go
// HIDE_START
package example_commands_test

import (
    "context"
    "fmt"

    "github.com/redis/go-redis/v9"
)
// HIDE_END
```

### 2. Client Setup
```go
ctx := context.Background()

rdb := redis.NewClient(&redis.Options{
    Addr:     "localhost:6379",
    Password: "",
    DB:       0,
})
```

### 3. Testable Example Function Naming
```go
// Function name format: Example<Type>_<method>
func ExampleClient_hset() { ... }
func ExampleClient_hget() { ... }
func ExampleClient_string_ops() { ... }
```

### 4. Output Verification
```go
fmt.Println(res) // >>> OK

// Output:
// OK
// Hello
// value1
```

### 5. Hash Operations
```go
// Single field
rdb.HSet(ctx, "myhash", "field1", "value1")

// Multiple fields
rdb.HSet(ctx, "myhash",
    "field2", "value2",
    "field3", "value3",
)

// Map
bike := map[string]interface{}{
    "model": "Deimos",
    "brand": "Ergonom",
}
rdb.HSet(ctx, "bike:1", bike)

// Get operations
value, _ := rdb.HGet(ctx, "myhash", "field1").Result()
all, _ := rdb.HGetAll(ctx, "myhash").Result()
```

### 6. Error Handling
```go
res, err := rdb.Set(ctx, "key", "value", 0).Result()
if err != nil {
    panic(err)
}
```

## Setup

```bash
cd examples/go-redis
go mod tidy
```

## Running Tests

```bash
# Run all tests
go test -v

# Run specific example
go test -v -run ExampleClient_hset

# Run with race detection
go test -race -v
```

## go.mod

```go
module redis_examples

go 1.21

require github.com/redis/go-redis/v9 v9.7.0
```

## API Notes

- All methods require `context.Context` as first parameter
- Methods return `*redis.StatusCmd`, `*redis.StringCmd`, etc.
- Use `.Result()` to get value and error
- Expiration: use `0` for no expiration, or `time.Duration`

## See Also

- Sample template: `/path/to/docs/for-ais-only/examples/go-redis/sample_test.go`
- Hash commands: `/path/to/go-redis/doctests/cmds_hash_test.go`
- String commands: `/path/to/go-redis/doctests/cmds_string_test.go`
