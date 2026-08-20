# hiredis Test File Patterns

This document describes the conventions used in hiredis (C) documentation test files.

## Purpose

These test files serve dual purposes:
1. **Executable C programs** - Validate code snippets work correctly
2. **Documentation source** - Code is extracted for redis.io documentation

## File Locations

- **Sample template**: `sample_test.c` (in this directory)

## Marker Reference

| Marker | Purpose |
|--------|---------|
| `// EXAMPLE: <name>` | Identifies example name (matches docs folder) |
| `// BINDER_ID <id>` | Optional identifier for online code runners |
| `// HIDE_START` / `// HIDE_END` | Code hidden from docs but still executed |
| `// REMOVE_START` / `// REMOVE_END` | Code completely removed from docs |
| `// STEP_START <name>` / `// STEP_END` | Named section for targeted doc inclusion |

## File Structure Template

```c
// EXAMPLE: example_name

// STEP_START includes
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <hiredis/hiredis.h>
// STEP_END

int main(int argc, char **argv) {
    // STEP_START connect
    redisContext *c = redisConnect("127.0.0.1", 6379);

    if (c == NULL || c->err) {
        if (c) {
            printf("Connection error: %s\n", c->errstr);
            redisFree(c);
        } else {
            printf("Connection error: can't allocate redis context\n");
        }
        return 1;
    }

    printf("Connected to Redis\n");
    // STEP_END

    // REMOVE_START
    redisReply *del_reply = redisCommand(c, "DEL mykey");
    freeReplyObject(del_reply);
    // REMOVE_END

    // STEP_START string_ops
    redisReply *reply;

    reply = redisCommand(c, "SET %s %s", "mykey", "Hello");
    printf("SET mykey Hello: %s\n", reply->str); // >>> OK
    freeReplyObject(reply);

    reply = redisCommand(c, "GET %s", "mykey");
    printf("GET mykey: %s\n", reply->str); // >>> Hello
    // REMOVE_START
    if (strcmp(reply->str, "Hello") != 0) {
        printf("ASSERTION FAILED\n");
    }
    // REMOVE_END
    freeReplyObject(reply);
    // STEP_END

    // STEP_START disconnect
    redisFree(c);
    printf("Disconnected from Redis\n");
    // STEP_END

    return 0;
}
```

## Key Patterns

### 0. CHECK_REPLY — mandatory, and the reason C examples are testable at all

**A C example has no assertion framework, so the harness can only see the process exit
code.** hiredis returns an *error reply* (a valid `redisReply` with
`type == REDIS_REPLY_ERROR`) for a malformed command rather than failing the call, and it
does not abort. Without a guard, an example can send a broken command, print a wrong value
and still exit 0 — a green run that proves nothing. That happened for real in DOC-6968:
`redisCommand(c, "SET mykey \"Hello World\"")` split on whitespace (hiredis does **not**
honour CLI-style quoting — bind a value containing spaces with `%s`), the server answered
`ERR syntax error`, and the sweep still reported PASS.

So every C example defines this macro in a `REMOVE` block after the includes, and calls it
after **every** `redisCommand`, also inside a `REMOVE` block, so the published snippet stays
plain `redisCommand`:

```c
// REMOVE_START
#define CHECK_REPLY(r) do { \
    if ((r) == NULL || (r)->type == REDIS_REPLY_ERROR) { \
        printf("REDIS ERROR: %s\n", (r) ? (r)->str : "no reply from server"); \
        return 1; \
    } \
} while (0)
// REMOVE_END

reply = redisCommand(c, "SET mykey %s", "Hello World");
// REMOVE_START
CHECK_REPLY(reply);
// REMOVE_END
```

Note why a cheaper check is not enough: scanning the program's output for `ERR` misses the
common case, because `printf("%lld", reply->integer)` on an error reply prints **`0`**, not
the error text. The guard has to sit at the call site.

Value assertions in these files must also `return 1`, not merely `printf("ASSERTION
FAILED")` — otherwise they cannot fail the harness either.

### 1. Includes
```c
// STEP_START includes
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <hiredis/hiredis.h>
// STEP_END
```

### 2. Connection Setup
```c
// STEP_START connect
redisContext *c = redisConnect("127.0.0.1", 6379);

if (c == NULL || c->err) {
    if (c) {
        printf("Connection error: %s\n", c->errstr);
        redisFree(c);
    } else {
        printf("Connection error: can't allocate redis context\n");
    }
    return 1;
}
// STEP_END
```

### 3. Executing Commands
```c
redisReply *reply;

// String command with format specifiers
reply = redisCommand(c, "SET %s %s", "mykey", "Hello");
printf("Result: %s\n", reply->str);
freeReplyObject(reply);

// Integer result
reply = redisCommand(c, "HSET %s %s %s", "myhash", "field1", "value1");
printf("Fields added: %lld\n", reply->integer);
freeReplyObject(reply);
```

### 4. Assertions (in REMOVE blocks)
```c
// REMOVE_START
if (strcmp(reply->str, "Hello") != 0) {
    printf("ASSERTION FAILED: Expected 'Hello', got '%s'\n", reply->str);
}
// REMOVE_END
```

### 5. Array Results (HGETALL)
```c
reply = redisCommand(c, "HGETALL %s", "myhash");
printf("HGETALL myhash:\n");
for (size_t i = 0; i < reply->elements; i += 2) {
    printf("  %s: %s\n", reply->element[i]->str, reply->element[i+1]->str);
}
freeReplyObject(reply);
```

### 6. Cleanup
```c
// STEP_START disconnect
redisFree(c);
printf("Disconnected from Redis\n");
// STEP_END
```

## Reply Types

| Type | Field | Description |
|------|-------|-------------|
| `REDIS_REPLY_STRING` | `reply->str` | String value |
| `REDIS_REPLY_INTEGER` | `reply->integer` | Integer value |
| `REDIS_REPLY_ARRAY` | `reply->elements`, `reply->element[i]` | Array of replies |
| `REDIS_REPLY_STATUS` | `reply->str` | Status string (OK) |
| `REDIS_REPLY_NIL` | - | NULL value |

## Building and Running

```bash
# Compile
cc sample_test.c -L/usr/local/lib -lhiredis -o sample_test

# Or with pkg-config
cc sample_test.c $(pkg-config --cflags --libs hiredis) -o sample_test

# Run
./sample_test
```

## Memory Management

**Important**: Always free reply objects to avoid memory leaks:
```c
redisReply *reply = redisCommand(c, "GET key");
// ... use reply ...
freeReplyObject(reply);  // Always free!
```

This applies to cleanup commands inside REMOVE blocks too, even though their
result is never read — bind the reply and free it rather than discarding the
return value of `redisCommand`:

```c
// REMOVE_START
redisReply *del_reply = redisCommand(c, "DEL mykey");
freeReplyObject(del_reply);
// REMOVE_END
```

## Installing hiredis

```bash
# macOS
brew install hiredis

# Ubuntu/Debian
apt-get install libhiredis-dev

# From source
git clone https://github.com/redis/hiredis.git
cd hiredis
make && sudo make install
```

## See Also

- Sample template: `sample_test.c` (in this directory)
- hiredis repo: https://github.com/redis/hiredis
