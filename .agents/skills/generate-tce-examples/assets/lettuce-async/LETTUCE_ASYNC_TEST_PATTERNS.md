# Lettuce Async Test File Patterns

This document describes the conventions used in Lettuce async documentation test files.

## Purpose

These test files serve dual purposes:
1. **Executable JUnit 5 tests** - Validate code snippets work correctly
2. **Documentation source** - Code is extracted for redis.io documentation

## File Locations

- **Original tests**: `/path/to/lettuce/src/test/java/io/redis/examples/async/*.java`
- **Sample template**: `src/test/java/io/redis/examples/async/SampleTest.java` (in this directory)

## Marker Reference

| Marker | Purpose |
|--------|---------|
| `// EXAMPLE: <name>` | Identifies example name (matches docs folder) |
| `// HIDE_START` / `// HIDE_END` | Code hidden from docs but still executed |
| `// REMOVE_START` / `// REMOVE_END` | Code completely removed from docs |
| `// STEP_START <name>` / `// STEP_END` | Named section for targeted doc inclusion |

## File Structure Template

```java
// EXAMPLE: example_name
package io.redis.examples.async;

import io.lettuce.core.*;
import io.lettuce.core.api.async.RedisAsyncCommands;
import io.lettuce.core.api.StatefulRedisConnection;

// REMOVE_START
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END

import java.util.*;
import java.util.concurrent.CompletableFuture;

public class SampleTest {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisAsyncCommands<String, String> asyncCommands = connection.async();

            // REMOVE_START
            asyncCommands.del("mykey").get();
            // REMOVE_END

            // STEP_START operation_name
            CompletableFuture<String> setFuture = asyncCommands.set("mykey", "Hello")
                .toCompletableFuture();

            CompletableFuture<String> result = setFuture
                .thenCompose(res -> {
                    System.out.println(res); // >>> OK
                    return asyncCommands.get("mykey").toCompletableFuture();
                })
                .thenApply(value -> {
                    System.out.println(value); // >>> Hello
                    return value;
                });

            result.join();
            // STEP_END

            // REMOVE_START
            assertThat(result.join()).isEqualTo("Hello");
            // REMOVE_END
        } finally {
            redisClient.shutdown();
        }
    }
}
```

## Key Patterns

### 1. Connection Setup
```java
RedisClient redisClient = RedisClient.create("redis://localhost:6379");

try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
    RedisAsyncCommands<String, String> asyncCommands = connection.async();
    // ... operations
} finally {
    redisClient.shutdown();
}
```

### 2. CompletableFuture Chaining
```java
CompletableFuture<Void> chain = asyncCommands.set("key", "value")
    .toCompletableFuture()
    .thenCompose(res -> asyncCommands.get("key").toCompletableFuture())
    .thenAccept(value -> System.out.println(value));

chain.join(); // Wait for completion
```

### 3. Assertions (in REMOVE blocks)
```java
// REMOVE_START
assertThat(result.join()).isEqualTo("Hello");
assertThat(map).hasSize(3);
asyncCommands.del("mykey").get();
// REMOVE_END
```

### 4. Hash Operations
```java
// Multiple fields
Map<String, String> fields = new HashMap<>();
fields.put("field1", "value1");
fields.put("field2", "value2");

CompletableFuture<Long> setHash = asyncCommands.hset("myhash", fields)
    .toCompletableFuture();

// Get operations
CompletableFuture<String> getField = asyncCommands.hget("myhash", "field1")
    .toCompletableFuture();

CompletableFuture<Map<String, String>> getAll = asyncCommands.hgetall("myhash")
    .toCompletableFuture();
```

### 5. Parallel Execution
```java
CompletableFuture.allOf(future1, future2, future3).join();
```

## Directory Structure

Maven requires test files to be in a specific directory structure:

```
examples/lettuce-async/
├── pom.xml
├── LETTUCE_ASYNC_TEST_PATTERNS.md
└── src/
    └── test/
        └── java/
            └── io/
                └── redis/
                    └── examples/
                        └── async/
                            └── SampleTest.java
```

## Running Tests

```bash
# Run all tests
mvn test

# Run specific test class
mvn test -Dtest=SampleTest

# Run specific method
mvn test -Dtest=SampleTest#run
```

## Maven pom.xml (Minimal)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>io.redis.examples</groupId>
    <artifactId>lettuce-async-examples</artifactId>
    <version>1.0-SNAPSHOT</version>

    <properties>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <dependencies>
        <dependency>
            <groupId>io.lettuce</groupId>
            <artifactId>lettuce-core</artifactId>
            <version>7.4.0.RELEASE</version>
        </dependency>
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <version>5.10.0</version>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.assertj</groupId>
            <artifactId>assertj-core</artifactId>
            <version>3.24.0</version>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-surefire-plugin</artifactId>
                <version>3.2.5</version>
            </plugin>
        </plugins>
    </build>
</project>
```

## See Also

- Sample template: `src/test/java/io/redis/examples/async/SampleTest.java` (in this directory)
- Hash commands: `/path/to/lettuce/src/test/java/io/redis/examples/async/HashExample.java`
