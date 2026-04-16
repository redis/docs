---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a Redis-backed session store in Java with Lettuce
linkTitle: Java session store (Lettuce)
title: Redis session store with Java (Lettuce)
weight: 5
---

This guide shows you how to implement a Redis-backed session store in Java with [`Lettuce`]({{< relref "/develop/clients/lettuce" >}}). It includes both asynchronous and reactive store APIs, plus a small local demo server built on Java's built-in `HttpServer`.

## Overview

Session storage is a common Redis use case for web applications. Instead of keeping session state in local process memory, you store it in Redis and send the browser only an opaque session ID in a cookie.

That gives you:

* Shared sessions across multiple app servers
* Automatic expiration using Redis TTLs
* Fast reads and updates for small pieces of per-user state
* A clean separation between browser cookies and server-side session data

In this example, each session is stored as a Redis hash with a key like `session:{session_id}`. The hash holds lightweight fields such as the username, page view count, timestamps, and the configured session TTL. The key also has an expiration so inactive sessions are removed automatically.

## Why async and reactive

For Lettuce, we generally show asynchronous and reactive APIs rather than a synchronous API:

* Async with `RedisAsyncCommands` works well for standard Java applications using `CompletableFuture`
* Reactive with `RedisReactiveCommands` is a good fit when you are already using Reactor
* For synchronous Java session-store examples, we recommend [Jedis]({{< relref "/develop/use-cases/session-store/java-jedis" >}})

## How it works

The flow looks like this:

1. A user submits a login form
2. The server generates a random session ID with `SecureRandom`
3. The server stores session data in Redis under `session:{id}`
4. The server sends a `sid` cookie containing only the session ID
5. Later requests read the cookie, load the hash from Redis, and refresh the TTL
6. Logging out deletes the Redis key and clears the cookie

Because the cookie only contains an opaque identifier, the browser never receives the actual session data. That stays in Redis.

## The Lettuce session stores

The async and reactive session store classes wrap the basic session operations:

* Async API: [AsyncSessionStore.java](AsyncSessionStore.java)
* Reactive API: [ReactiveSessionStore.java](ReactiveSessionStore.java)

### Async usage

```java
import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import java.util.Map;

RedisClient redisClient = RedisClient.create("redis://localhost:6379");
StatefulRedisConnection<String, String> connection = redisClient.connect();

AsyncSessionStore store = new AsyncSessionStore(connection.async(), "session:", 1800);

store.createSession(Map.of(
        "username", "andrew",
        "page_views", "0"
), null)
    .thenCompose(sessionId -> store.getSession(sessionId, true))
    .thenAccept(session -> {
        if (session != null) {
            System.out.println(session.get("username"));
        }
    })
    .join();

connection.close();
redisClient.shutdown();
```

### Reactive usage

```java
import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import java.util.Map;

RedisClient redisClient = RedisClient.create("redis://localhost:6379");
StatefulRedisConnection<String, String> connection = redisClient.connect();

ReactiveSessionStore store = new ReactiveSessionStore(connection.reactive(), "session:", 1800);

store.createSession(Map.of(
        "username", "andrew",
        "page_views", "0"
), null)
    .flatMap(sessionId -> store.getSession(sessionId, true))
    .doOnNext(session -> System.out.println(session.get("username")))
    .block();

connection.close();
redisClient.shutdown();
```

## Data model

Each session is stored in a Redis hash:

```text
session:abc123...
  username = andrew
  page_views = 3
  session_ttl = 15
  created_at = 2026-04-08T12:34:56Z
  last_accessed_at = 2026-04-08T12:40:10Z
```

The implementation uses:

* [`HSET`]({{< relref "/commands/hset" >}}) to create and update session fields
* [`HGETALL`]({{< relref "/commands/hgetall" >}}) to load the session
* [`HINCRBY`]({{< relref "/commands/hincrby" >}}) to update counters
* [`EXPIRE`]({{< relref "/commands/expire" >}}) to implement sliding expiration
* [`DEL`]({{< relref "/commands/del" >}}) to remove a session on logout

The store treats `created_at`, `last_accessed_at`, and `session_ttl` as reserved internal fields, so caller-provided session data cannot overwrite them.

## Session store implementation

The `createSession()` method generates a random session ID, writes the initial hash fields, and sets the TTL:

```java
public CompletableFuture<String> createSession(Map<String, String> data, Integer ttl) {
    String sessionId = createSessionId();
    String key = sessionKey(sessionId);
    String now = timestamp();
    int sessionTtl = normalizeTtl(ttl);

    Map<String, String> payload = sessionPayload(data, now, sessionTtl);

    return commands.hset(key, payload)
            .toCompletableFuture()
            .thenCompose(ignore -> commands.expire(key, sessionTtl).toCompletableFuture())
            .thenApply(ignore -> sessionId);
}
```

When the application reads a session, it refreshes the configured TTL so active users stay logged in:

```java
public CompletableFuture<Map<String, String>> getSession(String sessionId, boolean refreshTtl) {
    String key = sessionKey(sessionId);

    return commands.hgetall(key).toCompletableFuture().thenCompose(session -> {
        if (!isValidSession(session)) {
            return CompletableFuture.completedFuture(null);
        }
        if (!refreshTtl) {
            return CompletableFuture.completedFuture(session);
        }

        int sessionTtl = normalizeTtl(Integer.parseInt(session.get("session_ttl")));
        return commands.hset(key, "last_accessed_at", timestamp()).toCompletableFuture()
                .thenCompose(ignore -> commands.expire(key, sessionTtl).toCompletableFuture())
                .thenCompose(ignore -> commands.hgetall(key).toCompletableFuture())
                .thenApply(refreshed -> isValidSession(refreshed) ? refreshed : null);
    });
}
```

This is a simple and effective pattern for many apps. For more complex requirements, you might add separate metadata keys, rotate session IDs after login, or store less frequently accessed data elsewhere.

## Installation

Add Lettuce to your project:

* If you use **Maven**:

  ```xml
  <dependency>
      <groupId>io.lettuce</groupId>
      <artifactId>lettuce-core</artifactId>
      <version>6.7.1.RELEASE</version>
  </dependency>
  ```

* If you use **Gradle**:

  ```groovy
  implementation 'io.lettuce:lettuce-core:6.7.1.RELEASE'
  ```

## Running the demo

A local demo server is included to show the session store in action
([source](DemoServer.java)):

```bash
javac -cp lettuce-core-6.7.1.RELEASE.jar AsyncSessionStore.java DemoServer.java
java -cp .:lettuce-core-6.7.1.RELEASE.jar DemoServer
```

The demo uses the async Lettuce API and exposes a small interactive page where you can:

* Start a session with a username
* Choose a short TTL and watch the session expire
* See the Redis-backed session data rendered in the browser
* Increment a page-view counter stored in Redis
* Change the active session TTL from the page
* Log out and delete the session

The demo assumes Redis is running on `localhost:6379`, but you can override that with `--redis-host` and `--redis-port`. After starting the server, visit `http://localhost:8080`.

## Cookie handling

The browser cookie should contain only the session ID:

```java
exchange.getResponseHeaders().add(
        "Set-Cookie",
        "sid=" + sessionId + "; Path=/; HttpOnly; SameSite=Lax"
);
```

Avoid storing user profiles, roles, or other sensitive session data directly in cookies. Keep that information in Redis and let the cookie act only as a lookup token.

## Production usage

This guide uses a deliberately small local demo so you can focus on the Redis session pattern. In production, you will usually want to harden the cookie, session lifecycle, and deployment details around it.

### Secure the session cookie

Set cookie attributes that match your deployment and threat model:

* Keep `HttpOnly` enabled so JavaScript cannot read the session cookie
* Use the `Secure` attribute when serving your app over HTTPS
* Choose an appropriate `SameSite` policy for your login flow and cross-site behavior

### Keep session data lightweight

Redis-backed sessions work best when each session stores small, frequently accessed values:

* Usernames, IDs, and feature flags are a good fit
* Large profiles, document blobs, or activity feeds should usually live elsewhere
* Consider storing only references if the session needs to point to larger data

### Handle expiration deliberately

Sliding expiration is convenient, but it also defines how long a hijacked cookie remains useful. For production apps, consider:

* Shorter inactivity TTLs for sensitive applications
* Separate absolute expiration limits for long-lived sessions
* Session ID rotation after login or privilege changes

### Use a framework integration where appropriate

This example keeps everything explicit so you can see the Redis session pattern clearly. In a real app, you will often wrap the same Redis operations behind middleware for Spring WebFlux, Vert.x, Micronaut, or another Java framework using non-blocking I/O.

## Next steps

You now have Redis-backed session examples in Java using both Jedis and Lettuce. From here you can:

* Choose Jedis for synchronous apps or Lettuce for async/reactive apps
* Add session ID rotation or absolute expiration
* Store additional lightweight session metadata in the same Redis hash
* Reuse the same Redis deployment across multiple application instances

For more Redis data modeling patterns, see:

* [Session store overview]({{< relref "/develop/use-cases/session-store" >}})
* [Lettuce guide]({{< relref "/develop/clients/lettuce" >}})
* [Jedis session store]({{< relref "/develop/use-cases/session-store/java-jedis" >}})
