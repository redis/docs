---
LinkTitle: Cache abstraction
Title: Use Redis with the Spring cache abstraction
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
description: Plug Redis into your Spring application as a cache with minimal effort
group: framework
summary: Spring Data Redis implements the Spring framework's cache abstraction for
  Redis, which allows you to plug Redis into your Spring application with minimal
  effort.
type: integration
weight: 10
---

Spring Data Redis implements the Spring framework's cache abstraction for Redis, which allows you to plug Redis into your Spring application with minimal effort.

Spring's cache abstraction applies cache-aside to methods, reducing executions by storing and reusing results. When a method is invoked, the abstraction checks if it's been called with the same arguments before. If so, it returns the cached result. If not, it invokes the method, caches the result, and returns it. This way, costly methods are invoked less often. Further details are in the [Spring cache abstraction documentation](https://docs.spring.io/spring-framework/reference/integration/cache.html).

## Get started

To use Redis as your cache storage:

1. Enable caching with `@EnableCaching` on a configuration class.
2. Use the `@Cacheable` annotation on a method to cache its results.

With Spring Boot and the [starter](/content/integrate/spring-framework-cache/_index.md#requirements),
Spring creates a `RedisCacheManager` for you when you set `spring.cache.type=redis`.

```java
@Service
public class BookService {
    @Cacheable(cacheNames = "books", key = "#isbn")
    public Book findBook(String isbn) {
        return loadBookFromDatabase(isbn); // runs only on a cache miss
    }
}
```

Spring Data Redis stores each entry under a key of the form `<cache-name>::<key>`.
In this example, the book with ISBN `1` is stored under `books::1`.

The default cache configuration can store only `String` and `byte[]` values. A method
that returns any other type fails with `Cannot serialize value of type ... without a
serializer` until you [configure a serializer](#configure-the-cache-manager).

## Configure the cache manager

To set the time to live (TTL), a key prefix, or the value serializer, define a
`RedisCacheManager` bean. This example sets a 10-minute default TTL and a `myapp:`
key prefix for all caches, and gives the `books` cache its own 1-minute TTL and a
JSON serializer:

```java
@Configuration
public class CacheConfig {
    @Bean
    RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration defaults = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10))
                .prefixCacheNameWith("myapp:")
                .disableCachingNullValues();

        RedisCacheConfiguration booksConfig = defaults
                .entryTtl(Duration.ofMinutes(1))
                .serializeValuesWith(SerializationPair.fromSerializer(
                        new JacksonJsonRedisSerializer<>(Book.class)));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaults)
                .withInitialCacheConfigurations(Map.of("books", booksConfig))
                .build();
    }
}
```

With this configuration, `findBook("1")` stores the entry under `myapp:books::1`
with a TTL of 60 seconds, and the value is readable JSON:
`{"isbn":"1","title":"Title 1"}`.

> [!NOTE]
> Use a typed `JacksonJsonRedisSerializer` for each cache, as in the example.
> `GenericJacksonJsonRedisSerializer` adds type information only for non-final
> classes, so a final class such as a Java record comes back from the cache as a map
> and fails with a `ClassCastException`.

## Update and evict entries

Use `@CachePut` to update an entry whenever a method runs, and `@CacheEvict` to remove
an entry:

```java
@CachePut(cacheNames = "books", key = "#book.isbn")
public Book updateBook(Book book) {
    return saveBookToDatabase(book);
}

@CacheEvict(cacheNames = "books", key = "#isbn")
public void deleteBook(String isbn) {
    deleteBookFromDatabase(isbn);
}
```

## Preload a cache at startup

To fill a cache before the first request, write the entries in an `ApplicationRunner`.
This is the [prefetch cache](/content/develop/use-cases/prefetch-cache/_index.md)
pattern with Spring:

```java
@Component
public class Preloader implements ApplicationRunner {
    private final CacheManager cacheManager;

    Preloader(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    @Override
    public void run(ApplicationArguments args) {
        Cache cache = cacheManager.getCache("books");
        for (Book book : loadAllBooks()) {
            cache.put(book.isbn(), book);
        }
    }
}
```

Calls to `findBook` for a preloaded ISBN then return the cached entry without running
the method.

## Further readings

Please read the Spring framework's documentation to learn more about how to use the Redis cache abstraction for Spring:

* [Spring cache abstraction](https://docs.spring.io/spring-framework/reference/integration/cache.html)
* [Spring cache store configuration](https://docs.spring.io/spring-framework/reference/integration/cache/store-configuration.html)
* [Spring Data Redis Cache](https://docs.spring.io/spring-data/redis/reference/redis/redis-cache.html)
