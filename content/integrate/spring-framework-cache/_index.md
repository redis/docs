---
LinkTitle: Spring Data Redis
Title: Spring Data Redis
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
description: Plug Redis into your Spring application with minimal effort
group: framework
summary: Spring Data Redis implements the Spring framework's cache abstraction for Redis, which allows you to plug Redis into your Spring application with minimal effort.
type: integration
weight: 8
---

Spring Data Redis implements the Spring framework's cache abstraction for Redis, which allows you to plug Redis into your Spring application with minimal effort.

Spring's cache abstraction applies cache-aside to methods, reducing executions by storing and reusing results. When a method is invoked, the abstraction checks if it's been called with the same arguments before. If so, it returns the cached result. If not, it invokes the method, caches the result, and returns it. This way, costly methods are invoked less often. Further details are in the [Spring cache abstraction documentation](https://docs.spring.io/spring-framework/reference/integration/cache.html).

## Get started

In a nutshell, you need to perform the following steps to use Redis as your cache storage:

1. [Configure the cache storage](https://docs.spring.io/spring-framework/reference/integration/cache/store-configuration.html) by using the [Redis cache manager](https://docs.spring.io/spring-data/redis/reference/redis/redis-cache.html) that is part of Spring Data.
2. Annotate a repository with your `@CacheConfig`.
3. Use the `@Cachable` annotation on a repository method to cache the results of that method.

Here is an example:

```
@CacheConfig("books")
public class BookRepositoryImpl implements BookRepository {

    @Cacheable
    public Book findBook(ISBN isbn) {...}
}
```

## Further readings

Please read the Spring framework's documentation to learn more about how to use the Redis cache abstraction for Spring:

* [Spring cache abstraction](https://docs.spring.io/spring-framework/reference/integration/cache.html)
* [Spring cache store configuration](https://docs.spring.io/spring-framework/reference/integration/cache/store-configuration.html)
* [Spring Data Redis Cache](https://docs.spring.io/spring-data/redis/reference/redis/redis-cache.html)