---
LinkTitle: JSON support
Title: Use JSON documents with Spring Data Redis
alwaysopen: false
categories:
- docs
- integrate
- stack
- oss
- rs
- rc
- oss
- client
description: Store, retrieve, and update JSON documents from a Spring Data Redis
  application.
group: framework
summary: Spring Data Redis provides a template-based, fluent API for working with
  Redis JSON documents, including path-based updates and type-specific operations.
type: integration
weight: 30
bannerText: JSON support in Spring Data Redis is not yet released and the API is subject to change. This page is based on the in-progress pull request [spring-data-redis#3390](https://github.com/spring-projects/spring-data-redis/pull/3390) and will be updated when the feature ships.
relatedPages:
- /develop/data-types/json
- /develop/data-types/json/path
- /develop/clients/lettuce
- /develop/clients/jedis
---

Spring Data Redis lets you work with
[JSON]({{< relref "/develop/data-types/json" >}}) documents through a
template-based, fluent API. This builds on the underlying
[Lettuce]({{< relref "/develop/clients/lettuce" >}}) and
[Jedis]({{< relref "/develop/clients/jedis" >}}) clients, so your Spring
application can store, retrieve, and update JSON documents without dropping
down to the low-level command API.

The JSON API serializes your own Java objects to and from JSON using a
dedicated serializer, and supports [JSON path]({{< relref "/develop/data-types/json/path" >}})
expressions so you can read and update parts of a document without
transferring the whole thing.

## Requirements

To use the JSON support, you need:

- A Redis server with the JSON capability, such as
  [Redis Open Source]({{< relref "/operate/oss_and_stack/" >}}) 8 or later,
  or [Redis Stack]({{< relref "/operate/oss_and_stack/install/install-stack/" >}}).
- The Lettuce or Jedis client on your classpath (Spring Data Redis works with
  either).
- A JSON library. The examples below use
  [Jackson](https://github.com/FasterXML/jackson), which Spring Data Redis
  uses by default for JSON serialization.

## Set up

Add Spring Data Redis to your build. For Maven, edit your `pom.xml`:

```xml
<dependency>
    <groupId>org.springframework.data</groupId>
    <artifactId>spring-data-redis</artifactId>
    <!-- Use the first release that includes JSON support. -->
    <version>{version}</version>
</dependency>
```

For Gradle, add the following to your `build.gradle`:

```groovy
implementation 'org.springframework.data:spring-data-redis:{version}'
```

Configure a `RedisJsonTemplate` bean, backed by your existing connection
factory and a `JacksonRedisJsonSerializer` for the document values. Use
`StringRedisJsonTemplate` if you want `String` keys and values without any
extra configuration:

```java
@Configuration
public class RedisJsonConfig {

    @Bean
    public RedisJsonTemplate<String, User> redisJsonTemplate(
            RedisConnectionFactory connectionFactory) {

        RedisJsonTemplate<String, User> template = new RedisJsonTemplate<>();
        template.setConnectionFactory(connectionFactory);
        template.setKeySerializer(RedisSerializer.string());
        template.setJsonSerializer(new JacksonRedisJsonSerializer<>(User.class));
        template.afterPropertiesSet();
        return template;
    }
}
```

The examples below use a simple `User` type:

```java
public class User {
    private String name;
    private int age;
    private String city;
    private List<String> interests;

    // Constructors, getters, and setters omitted.
}
```

## Store and retrieve a document

Use the `value()` spec to work with a whole document. Call `set()` to store an
object as a JSON document, and `get()` to read it back:

```java
User user = new User("Paul", 42, "London", List.of("golf", "coding"));

// Store the object as a JSON document at the key "user:1".
jsonTemplate.value("user:1").set(user);

// Read the whole document back as a User object.
JsonResult<User> result = jsonTemplate.value("user:1").get();
User stored = result.getValue();
```

## Work with JSON paths

Pass a [JSON path]({{< relref "/develop/data-types/json/path" >}}) to `path()`
to target part of a document instead of the whole thing. This lets you read or
update a single field without rewriting the entire object.

```java
// Update just the "city" field.
jsonTemplate.value("user:1").path("$.city").set("Manchester");

// Set a field only if it does not already exist.
jsonTemplate.value("user:1").path("$.nickname").setIfAbsent("Paulie");

// Read a specific path.
JsonResult<String> city = jsonTemplate.value("user:1").paths("$.city");
```

## Update arrays

Use the `array()` spec for array fields. You can append elements, read the
current length, trim the array to a range, or find the index of a value:

```java
// Append a value to the "interests" array.
jsonTemplate.array("user:1").path("$.interests").append("cycling");

// Get the length of the array.
List<Long> lengths = jsonTemplate.array("user:1").path("$.interests").length();

// Find the index of a value.
List<Long> index = jsonTemplate.array("user:1").path("$.interests").indexOf("golf");

// Keep only the first two elements.
jsonTemplate.array("user:1").path("$.interests").trim(0, 1);
```

## Update strings

Use the `string()` spec to append to string fields and read their length:

```java
// Append to a string field.
jsonTemplate.string("user:1").path("$.name").append(" Jones");

// Get the length of the string.
List<Long> nameLength = jsonTemplate.string("user:1").path("$.name").length();
```

## Toggle booleans

Use the `bool()` spec to flip boolean fields between `true` and `false`:

```java
// Flip the "active" flag.
List<Boolean> newValues = jsonTemplate.bool("user:1").path("$.active").toggle();
```

## Merge into a document

Use `mergeWith()` to merge new data into an existing document, following the
[JSON merge]({{< relref "/commands/json.merge" >}}) semantics. Fields in the
supplied object are added or overwritten, and setting a field to `null`
removes it:

```java
// Merge in a partial object to update several fields at once.
Map<String, Object> changes = Map.of("city", "Leeds", "age", 43);
jsonTemplate.value("user:1").mergeWith(changes);
```

## Further reading

- [Redis JSON data type]({{< relref "/develop/data-types/json" >}})
- [JSON path syntax]({{< relref "/develop/data-types/json/path" >}})
- [Spring Data Redis reference documentation](https://docs.spring.io/spring-data/redis/reference/)
