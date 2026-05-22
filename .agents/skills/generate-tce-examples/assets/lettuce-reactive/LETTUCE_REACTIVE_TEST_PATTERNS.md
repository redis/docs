# Lettuce Reactive Test File Patterns

This document describes the conventions used in Lettuce reactive documentation test files.

## Purpose

These test files serve dual purposes:
1. **Executable JUnit 5 tests** - Validate code snippets work correctly
2. **Documentation source** - Code is extracted for redis.io documentation

## File Locations

- **Original tests**: `/path/to/lettuce/src/test/java/io/redis/examples/reactive/*.java`
- **Sample template**: `src/test/java/io/redis/examples/reactive/SampleTest.java` (in this directory)

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
package io.redis.examples.reactive;

import io.lettuce.core.*;
import io.lettuce.core.api.reactive.RedisReactiveCommands;
import io.lettuce.core.api.StatefulRedisConnection;

// REMOVE_START
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END

import reactor.core.publisher.Mono;

import java.util.*;

public class SampleTest {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisReactiveCommands<String, String> reactiveCommands = connection.reactive();

            // REMOVE_START
            reactiveCommands.del("mykey").block();
            // REMOVE_END

            // STEP_START operation_name
            Mono<String> setKey = reactiveCommands.set("mykey", "Hello").doOnNext(res -> {
                System.out.println(res); // >>> OK
            });

            setKey.block();

            Mono<String> getKey = reactiveCommands.get("mykey").doOnNext(value -> {
                System.out.println(value); // >>> Hello
                // REMOVE_START
                assertThat(value).isEqualTo("Hello");
                // REMOVE_END
            });

            getKey.block();
            // STEP_END
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
    RedisReactiveCommands<String, String> reactiveCommands = connection.reactive();
    // ... operations
} finally {
    redisClient.shutdown();
}
```

### 2. Mono with doOnNext
```java
Mono<String> operation = reactiveCommands.set("key", "value").doOnNext(result -> {
    System.out.println(result); // >>> OK
});

operation.block(); // Execute and wait
```

### 3. flatMap Chaining
```java
Mono<Void> chain = reactiveCommands.hincrby("stats", "count", 1)
    .doOnNext(result -> System.out.println(result)) // >>> 1
    .flatMap(v -> reactiveCommands.hincrby("stats", "count", 1))
    .doOnNext(result -> System.out.println(result)) // >>> 2
    .then();

chain.block();
```

### 4. Parallel Execution
```java
Mono.when(mono1, mono2, mono3).block();
```

### 5. Collecting Results
```java
Mono<List<KeyValue<String, String>>> getAll = reactiveCommands.hgetall("myhash")
    .collectList()
    .doOnNext(result -> {
        System.out.println(result);
        // >>> [KeyValue[field1, value1], KeyValue[field2, value2]]
    });

getAll.block();
```

### 6. Hash Operations
```java
Map<String, String> fields = new HashMap<>();
fields.put("field1", "value1");
fields.put("field2", "value2");

Mono<Long> setHash = reactiveCommands.hset("myhash", fields).doOnNext(result -> {
    System.out.println(result); // >>> 2
});

setHash.block();
```

## Project Reactor Types

| Type | Description |
|------|-------------|
| `Mono<T>` | 0 or 1 element |
| `Flux<T>` | 0 to N elements |
| `doOnNext()` | Side effect on each element |
| `flatMap()` | Transform and flatten |
| `then()` | Complete without value |
| `block()` | Subscribe and wait |

## Directory Structure

Maven requires test files to be in a specific directory structure:

```
examples/lettuce-reactive/
├── pom.xml
├── LETTUCE_REACTIVE_TEST_PATTERNS.md
└── src/
    └── test/
        └── java/
            └── io/
                └── redis/
                    └── examples/
                        └── reactive/
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
    <artifactId>lettuce-reactive-examples</artifactId>
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
            <groupId>io.projectreactor</groupId>
            <artifactId>reactor-core</artifactId>
            <version>3.5.0</version>
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

- Sample template: `src/test/java/io/redis/examples/reactive/SampleTest.java` (in this directory)
- Hash commands: `/path/to/lettuce/src/test/java/io/redis/examples/reactive/HashExample.java`
