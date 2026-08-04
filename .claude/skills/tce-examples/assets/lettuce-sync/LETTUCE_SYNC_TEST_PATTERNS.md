# Lettuce Sync Test File Patterns

This document describes the conventions used in Lettuce **synchronous** documentation test
files. For the other two Lettuce flavours see `../lettuce-async/` and `../lettuce-reactive/`.

## Purpose

These test files serve dual purposes:
1. **Executable JUnit tests** - Validate code snippets work correctly
2. **Documentation source** - Code is extracted for redis.io documentation

## File Locations

- **Staging**: `local_examples/<set>/lettuce-sync/*.java`
  (also the older `local_examples/client-specific/lettuce-sync/`)
- **Upstream**: `lettuce` repo, `src/test/java/io/redis/examples/sync/`
- **Sample template**: `SampleTest.java` (in this directory)
- **Package**: `io.redis.examples.sync` — must match the directory, and differs from the
  async (`...async`) and reactive (`...reactive`) packages

## Marker Reference

| Marker | Purpose |
|--------|---------|
| `// EXAMPLE: <name>` | Identifies example name (matches docs folder) |
| `// BINDER_ID <id>` | Optional identifier for online code runners |
| `// HIDE_START` / `// HIDE_END` | Code hidden from docs but still executed |
| `// REMOVE_START` / `// REMOVE_END` | Code completely removed from docs |
| `// STEP_START <name>` / `// STEP_END` | Named section for targeted doc inclusion |

## File Structure Template

```java
// EXAMPLE: example_name
package io.redis.examples.sync;

import io.lettuce.core.*;
import io.lettuce.core.api.sync.RedisCommands;
import io.lettuce.core.api.StatefulRedisConnection;

// REMOVE_START
import org.junit.jupiter.api.Test;
// REMOVE_END
// REMOVE_START
import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END

public class CmdsHashExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisCommands<String, String> syncCommands = connection.sync();

            // STEP_START step_name
            String res1 = syncCommands.set("mykey", "Hello");
            System.out.println(res1); // >>> OK
            // STEP_END

        // HIDE_START
        } finally {
            redisClient.shutdown();
        }
        // HIDE_END
    }
}
```

## Key Patterns

### 1. Values return directly — no futures

This is the whole point of the sync flavour, and why it reads best in docs. Compare:

```java
// sync
String res = syncCommands.set("mykey", "Hello");

// async — same call, wrapped
CompletableFuture<String> res = asyncCommands.set("mykey", "Hello").toCompletableFuture();
```

Don't import `CompletableFuture` or chain `thenCompose` in a sync example. If you catch
yourself doing that, you're porting the async example rather than writing the sync one.

### 2. Class name must end in `Example`

Surefire's default includes only match `*Test` / `*Tests`. Both the portable and fidelity
poms therefore add an explicit `<include>**/*Example.java</include>`. A class named anything
else runs **zero tests and the build still exits 0** — a false green. The Java wrappers now
fail on a zero test count, but the naming rule is what prevents the situation.

(The template in this directory is called `SampleTest.java` precisely so it is *not* picked
up as a real example. Run it with `mvn test -Dtest=SampleTest` if you want to see it work.)

### 3. `hset` returns boolean, `hmset` returns String

A common porting mistake, because redis-py returns a count for both:

```java
boolean created = syncCommands.hset("myhash", "field1", "value1");  // true only if NEW
String  ok      = syncCommands.hmset("myhash", fields);             // "OK"
```

An `hset` that updates an existing field returns `false`, not `true` — say so in the output
comment when the example overwrites a field.

### 4. `hgetall` ordering is not guaranteed

`Map` iteration order isn't stable, so a bare `System.out.println(map)` can print a different
order between runs and the `>>>` comment becomes a lie. Wrap in a `TreeMap` when the output
comment needs to be deterministic:

```java
Map<String, String> res = syncCommands.hgetall("myhash");
System.out.println(new TreeMap<>(res));
// >>> {field1=value1, field2=value2, field3=value3}
```

Note Java's `Map.toString()` form is `{k=v, k=v}` — no quotes, `=` not `=>`. Output comments
are published verbatim, so it must match what Java actually prints.

### 5. Numeric replies are `long`

`hincrby`, `incr`, `zadd` and friends return `long` (or `Long`). Assert with the `L` suffix
or AssertJ compares against the wrong boxed type:

```java
long res = syncCommands.hincrby("bike:1:stats", "rides", 1);
assertThat(res).isEqualTo(1L);
```

### 6. Shut the client down, not just the connection

`try`-with-resources closes the `StatefulRedisConnection`, but `RedisClient` holds the event
loop group and needs `shutdown()` or the JVM hangs at the end of the test. Put it in a
`finally` inside a `HIDE` block.

## Running Tests

```bash
# Via the harness
build/example-test-harness/run.sh --fidelity cmds_hash lettuce-sync
build/example-test-harness/run.sh cmds_hash lettuce-sync            # portable

# Directly, from the fidelity dir
cd tmp/clients/examples/lettuce-sync && mvn test
```

`SampleTest.java` in this directory has been compiled and run against **lettuce-core 7.4.0**
on Redis 8.10; its `>>>` comments are the real observed output.

> Note: the portable harness pins lettuce-core **6.5.5.RELEASE** while fidelity pins
> **7.4.0.RELEASE**. See the "Known divergence" section of
> `.claude/skills/tce-examples/reference/testing.md` — a Java example can pass in one mode and
> fail in the other until that's reconciled.

## See Also

- `../lettuce-async/LETTUCE_ASYNC_TEST_PATTERNS.md` — the `CompletableFuture` flavour
- `../lettuce-reactive/LETTUCE_REACTIVE_TEST_PATTERNS.md` — the `Mono`/`Flux` flavour
- `build/example-test-harness/clients.tsv` — filename convention and paths
- `for-ais-only/tcedocs/SPECIFICATION.md` — full marker semantics
