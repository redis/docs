---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a Redis-backed session store in Java with Jedis
linkTitle: Java session store
title: Redis session store with Java and Jedis
weight: 4
---

This guide shows you how to implement a Redis-backed session store in Java with [`Jedis`]({{< relref "/develop/clients/jedis" >}}). It includes a small local web server built with Java's built-in `HttpServer` so you can see the session lifecycle end to end.

## Overview

Session storage is a common Redis use case for web applications. Instead of keeping session state in local process memory, you store it in Redis and send the browser only an opaque session ID in a cookie.

That gives you:

* Shared sessions across multiple app servers
* Automatic expiration using Redis TTLs
* Fast reads and updates for small pieces of per-user state
* A clean separation between browser cookies and server-side session data

In this example, each session is stored as a Redis hash with a key like `session:{session_id}`. The hash holds lightweight fields such as the username, page view count, timestamps, and the configured session TTL. The key also has an expiration so inactive sessions are removed automatically.

## How it works

The flow looks like this:

1. A user submits a login form
2. The server generates a random session ID with Java's `SecureRandom`
3. The server stores session data in Redis under `session:{id}`
4. The server sends a `sid` cookie containing only the session ID
5. Later requests read the cookie, load the hash from Redis, and refresh the TTL
6. Logging out deletes the Redis key and clears the cookie

Because the cookie only contains an opaque identifier, the browser never receives the actual session data. That stays in Redis.

## The Java session store

The `RedisSessionStore` class wraps the basic session operations
([source](RedisSessionStore.java)):

```java
import java.util.Map;
import redis.clients.jedis.JedisPool;

public class Main {
    public static void main(String[] args) {
        JedisPool jedisPool = new JedisPool("localhost", 6379);
        RedisSessionStore store = new RedisSessionStore(jedisPool, "session:", 1800);

        String sessionId = store.createSession(Map.of(
                "username", "andrew",
                "page_views", "0"
        ), null);

        Map<String, String> session = store.getSession(sessionId, true);
        System.out.println(session.get("username"));

        store.incrementField(sessionId, "page_views", 1);
        store.deleteSession(sessionId);
        jedisPool.close();
    }
}
```

Jedis operations are synchronous, and `JedisPool` gives you safe connection reuse across requests.

### Data model

Each session is stored in a Redis hash:

```text
session:abc123...
  username = andrew
  page_views = 3
  session_ttl = 15
  created_at = 2026-04-02T12:34:56+00:00
  last_accessed_at = 2026-04-02T12:40:10+00:00
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
public String createSession(Map<String, String> data, Integer ttl) {
    String sessionId = randomSessionId();
    String key = sessionKey(sessionId);
    String now = timestamp();
    int sessionTtl = normalizeTtl(ttl);

    Map<String, String> payload = new HashMap<>();
    if (data != null) {
        for (Map.Entry<String, String> entry : data.entrySet()) {
            if (!RESERVED_SESSION_FIELDS.contains(entry.getKey())) {
                payload.put(entry.getKey(), String.valueOf(entry.getValue()));
            }
        }
    }

    payload.put("created_at", now);
    payload.put("last_accessed_at", now);
    payload.put("session_ttl", String.valueOf(sessionTtl));

    try (Jedis jedis = jedisPool.getResource()) {
        Pipeline pipeline = jedis.pipelined();
        pipeline.hset(key, payload);
        pipeline.expire(key, sessionTtl);
        pipeline.sync();
    }

    return sessionId;
}
```

When the application reads a session, it refreshes the configured TTL so active users stay logged in:

```java
public Map<String, String> getSession(String sessionId, boolean refreshTtl) {
    String key = sessionKey(sessionId);

    try (Jedis jedis = jedisPool.getResource()) {
        Map<String, String> session = jedis.hgetAll(key);
        if (!isValidSession(session)) {
            return null;
        }

        if (!refreshTtl) {
            return session;
        }

        int sessionTtl = normalizeTtl(Integer.valueOf(session.get("session_ttl")));
        Pipeline pipeline = jedis.pipelined();
        pipeline.hset(key, "last_accessed_at", timestamp());
        pipeline.expire(key, sessionTtl);
        Response<Map<String, String>> refreshed = pipeline.hgetAll(key);
        pipeline.sync();

        return isValidSession(refreshed.get()) ? refreshed.get() : null;
    }
}
```

This is a simple and effective pattern for many apps. For more complex requirements, you might add separate metadata keys, rotate session IDs after login, or store less frequently accessed data elsewhere.

## Prerequisites

Before running the demo, make sure that:

* Redis is running and accessible. By default, the demo connects to `localhost:6379`.
* Jedis is available in your project:

* If you use **Maven**:

  ```xml
  <dependency>
      <groupId>redis.clients</groupId>
      <artifactId>jedis</artifactId>
      <version>5.2.0</version>
  </dependency>
  ```

* If you use **Gradle**:

  ```groovy
  implementation 'redis.clients:jedis:5.2.0'
  ```

If your Redis server is running elsewhere, start the demo with `--redis-host` and `--redis-port`.

## Running the demo

A local demo server is included to show the session store in action
([source](DemoServer.java)):

```bash
javac -cp jedis-5.2.0.jar RedisSessionStore.java DemoServer.java
java -cp .:jedis-5.2.0.jar DemoServer
```

The demo server uses standard Java libraries for HTTP handling:

* [`com.sun.net.httpserver.HttpServer`](https://docs.oracle.com/en/java/javase/21/docs/api/jdk.httpserver/com/sun/net/httpserver/HttpServer.html) for the web server
* [`java.net.HttpCookie`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/net/HttpCookie.html) style cookie parsing and headers
* [`java.net.URLDecoder`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/net/URLDecoder.html) for form decoding

It exposes a small interactive page where you can:

* Start a session with a username
* Choose a short TTL and watch the session expire
* See the Redis-backed session data rendered in the browser
* Increment a page-view counter stored in Redis
* Change the active session TTL from the page
* Log out and delete the session

After starting the server, visit `http://localhost:8080`.

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

This example keeps everything explicit so you can see the Redis session pattern clearly. In a real app, you will often wrap the same Redis operations behind middleware for Spring MVC, Spring Boot, Micronaut, or another Java web framework.

## Next steps

You now have a complete Redis-backed session example in Java using Jedis. From here you can:

* Adapt the store to your web framework
* Add session ID rotation or absolute expiration
* Store additional lightweight session metadata in the same Redis hash
* Reuse the same Redis deployment across multiple application instances

For more Redis data modeling patterns, see:

* [Session store overview]({{< relref "/develop/use-cases/session-store" >}})
* [Jedis guide]({{< relref "/develop/clients/jedis" >}})
* [Redis data types]({{< relref "/develop/data-types" >}})
