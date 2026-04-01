# Jedis Test File Patterns

This document describes the conventions used in Jedis documentation test files.

## Purpose

These test files serve dual purposes:
1. **Executable JUnit 5 tests** - Validate code snippets work correctly
2. **Documentation source** - Code is extracted for redis.io documentation

## File Locations

- **Original tests**: `/path/to/jedis/src/test/java/io/redis/examples/*.java`
- **Sample template**: `src/test/java/io/redis/examples/SampleTest.java` (in this directory)

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
// REMOVE_START
package io.redis.examples;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
// REMOVE_END

// HIDE_START
import redis.clients.jedis.RedisClient;

import java.util.HashMap;
import java.util.Map;
// HIDE_END

public class SampleTest {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        // HIDE_START
        RedisClient jedis = RedisClient.create("redis://localhost:6379");
        // HIDE_END

        // REMOVE_START
        jedis.del("mykey");
        // REMOVE_END

        // STEP_START operation_name
        String res = jedis.set("mykey", "Hello");
        System.out.println(res); // >>> OK

        String value = jedis.get("mykey");
        System.out.println(value); // >>> Hello
        // STEP_END

        // REMOVE_START
        assertEquals("OK", res);
        assertEquals("Hello", value);
        jedis.del("mykey");
        jedis.close();
        // REMOVE_END
    }
}
```

## Key Patterns

### 1. Package and Imports
```java
// REMOVE_START
package io.redis.examples;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
// REMOVE_END

// HIDE_START
import redis.clients.jedis.UnifiedJedis;
import java.util.HashMap;
import java.util.Map;
// HIDE_END
```

### 2. Connection Setup (in HIDE block)
```java
// HIDE_START
RedisClient jedis = RedisClient.create("redis://localhost:6379");
// HIDE_END
```

### 3. Assertions (in REMOVE blocks)
```java
// REMOVE_START
assertEquals("OK", res);
assertEquals("Hello", value);
assertEquals(3, map.size());
jedis.del("mykey");
jedis.close();
// REMOVE_END
```

### 4. Console Output Comments
```java
System.out.println(res); // >>> OK
System.out.println(value); // >>> Hello
System.out.println(map);
// >>> {field1=value1, field2=value2}
```

### 5. Hash Operations
```java
// Single field
jedis.hset("myhash", "field1", "value1");

// Multiple fields
Map<String, String> fields = new HashMap<>();
fields.put("field2", "value2");
fields.put("field3", "value3");
jedis.hset("myhash", fields);

// Get operations
String value = jedis.hget("myhash", "field1");
Map<String, String> all = jedis.hgetAll("myhash");
```

## Directory Structure

Maven requires test files to be in a specific directory structure:

```
examples/jedis/
├── pom.xml
├── JEDIS_TEST_PATTERNS.md
└── src/
    └── test/
        └── java/
            └── io/
                └── redis/
                    └── examples/
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
    <artifactId>jedis-examples</artifactId>
    <version>1.0-SNAPSHOT</version>

    <properties>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <dependencies>
        <dependency>
            <groupId>redis.clients</groupId>
            <artifactId>jedis</artifactId>
            <version>7.3.0</version>
        </dependency>
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <version>5.10.0</version>
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

- Sample template: `src/test/java/io/redis/examples/SampleTest.java` (in this directory)
- Hash commands: `/path/to/jedis/src/test/java/io/redis/examples/CmdsHashExample.java`
