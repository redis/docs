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
  use Redis as a cache and add client-side failover to your connections.
type: integration
weight: 8
---

[Spring Data Redis](https://spring.io/projects/spring-data-redis) integrates Redis with the [Spring framework](https://spring.io/projects/spring-framework), letting you plug Redis into your Spring application with minimal effort. It works with the [Lettuce]({{< relref "/develop/clients/lettuce" >}}) and [Jedis]({{< relref "/develop/clients/jedis" >}}) clients, so Spring applications can take advantage of those clients' connection features as well as Spring's own abstractions.

The pages in this section describe recipes for using Redis from Spring Data Redis:

- [Use Redis with the Spring cache abstraction]({{< relref "/integrate/spring-framework-cache/cache" >}}) shows how to use Redis as the storage for Spring's cache abstraction.
- [Client-side geographic failover]({{< relref "/integrate/spring-framework-cache/geo-failover" >}}) shows how to configure resilient connections that automatically fail over between Redis endpoints.
- [Use JSON documents with Spring Data Redis]({{< relref "/integrate/spring-framework-cache/json" >}}) shows how to store, retrieve, and update JSON documents with the template-based JSON API.
