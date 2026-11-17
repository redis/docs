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
hideListLinks: true
summary: Spring Data Redis integrates Redis with the Spring framework, letting you
  use Redis as a cache, session store, message broker, and stream processor, and add
  client-side failover to your connections.
type: integration
weight: 8
---

[Spring Data Redis](https://spring.io/projects/spring-data-redis) integrates Redis with the [Spring framework](https://spring.io/projects/spring-framework), letting you plug Redis into your Spring application with minimal effort. It works with the [Lettuce](/content/develop/clients/lettuce/_index.md) and [Jedis](/content/develop/clients/jedis/_index.md) clients, so Spring applications can take advantage of those clients' connection features as well as Spring's own abstractions.

## Requirements

The examples in this section use [Spring Boot](https://spring.io/projects/spring-boot) 4.1
with Spring Data Redis 4.1. Add the Spring Boot starter for Spring Data Redis to your project:

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```

The starter uses the Lettuce client by default. Spring Boot reads the connection
settings from your application properties:

```properties
spring.data.redis.host=<your-redis-host>
spring.data.redis.port=6379
```

Spring Boot creates a `RedisConnectionFactory` and a `StringRedisTemplate` for you,
and the pages in this section build on them.

## Recipes

The pages in this section describe recipes for using Redis from Spring Data Redis:

- [Use Redis with the Spring cache abstraction](/content/integrate/spring-framework-cache/cache.md) shows how to use Redis as the storage for Spring's cache abstraction, including preloading a cache at startup.
- [Use Redis data structures with Spring](/content/integrate/spring-framework-cache/data-structures.md) shows how to use `RedisTemplate` with Redis data structures, such as a sorted set for a leaderboard.
- [Publish and subscribe to messages with Spring](/content/integrate/spring-framework-cache/pub-sub.md) shows how to send and receive Redis pub/sub messages.
- [Process Redis streams with Spring](/content/integrate/spring-framework-cache/streams.md) shows how to add entries to a stream and consume them with a consumer group.
- [Store sessions with Spring Session](/content/integrate/spring-framework-cache/session.md) shows how to keep HTTP session data in Redis.
- [Client-side geographic failover](/content/integrate/spring-framework-cache/geo-failover.md) shows how to configure resilient connections that automatically fail over between Redis endpoints.
