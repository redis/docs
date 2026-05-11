---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a Redis-backed session store in C#/.NET with StackExchange.Redis
linkTitle: StackExchange.Redis example (C#/.NET)
title: Redis session store with C#/.NET
weight: 5
---

This guide shows you how to implement a Redis-backed session store in .NET with [`StackExchange.Redis`]({{< relref "/develop/clients/dotnet" >}}). It includes a small local web server built with ASP.NET Core minimal APIs so you can see the session lifecycle end to end.

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
2. The server generates a random session ID with `RandomNumberGenerator`
3. The server stores session data in Redis under `session:{id}`
4. The server sends a `sid` cookie containing only the session ID
5. Later requests read the cookie, load the hash from Redis, and refresh the TTL
6. Logging out deletes the Redis key and clears the cookie

Because the cookie only contains an opaque identifier, the browser never receives the actual session data. That stays in Redis.

## The .NET session store

The `RedisSessionStore` class wraps the basic session operations
([source](RedisSessionStore.cs)):

```csharp
using StackExchange.Redis;

var redis = ConnectionMultiplexer.Connect("localhost:6379");
var db = redis.GetDatabase();

var store = new RedisSessionStore(db: db, ttl: 1800);

var sessionId = store.CreateSession(new Dictionary<string, string>
{
    ["username"] = "andrew",
    ["page_views"] = "0"
});

var session = store.GetSession(sessionId);
Console.WriteLine(session?["username"]);

store.IncrementField(sessionId, "page_views");
store.DeleteSession(sessionId);
```

The class uses `IDatabase` from StackExchange.Redis, so you can share a single connection multiplexer across your application and inject the database where you need it.

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

The `CreateSession()` method generates a random session ID, writes the initial hash fields, and sets the TTL:

```csharp
public string CreateSession(
    IDictionary<string, string>? data = null,
    int? ttl = null)
{
    var sessionId = CreateSessionId();
    var key = SessionKey(sessionId);
    var now = Timestamp();
    var sessionTtl = NormalizeTtl(ttl);

    var payload = new Dictionary<string, string>();
    if (data is not null)
    {
        foreach (var (field, value) in data)
        {
            if (!ReservedSessionFields.Contains(field))
            {
                payload[field] = value;
            }
        }
    }

    payload["created_at"] = now;
    payload["last_accessed_at"] = now;
    payload["session_ttl"] = sessionTtl.ToString();

    var batch = _db.CreateBatch();
    _ = batch.HashSetAsync(key, payload.Select(entry => new HashEntry(entry.Key, entry.Value)).ToArray());
    _ = batch.KeyExpireAsync(key, TimeSpan.FromSeconds(sessionTtl));
    batch.Execute();

    return sessionId;
}
```

When the application reads a session, it refreshes the configured TTL so active users stay logged in:

```csharp
public Dictionary<string, string>? GetSession(string sessionId, bool refreshTtl = true)
{
    var key = SessionKey(sessionId);
    var session = ReadSession(key);
    if (!IsValidSession(session))
    {
        return null;
    }

    if (!refreshTtl)
    {
        return session;
    }

    var sessionTtl = NormalizeTtl(int.Parse(session["session_ttl"]));
    var now = Timestamp();

    var batch = _db.CreateBatch();
    _ = batch.HashSetAsync(key, new[] { new HashEntry("last_accessed_at", now) });
    _ = batch.KeyExpireAsync(key, TimeSpan.FromSeconds(sessionTtl));
    var refreshedTask = batch.HashGetAllAsync(key);
    batch.Execute();

    var refreshed = ToDictionary(refreshedTask.GetAwaiter().GetResult());
    return IsValidSession(refreshed) ? refreshed : null;
}
```

This is a simple and effective pattern for many apps. For more complex requirements, you might add separate metadata keys, rotate session IDs after login, or store less frequently accessed data elsewhere.

## Prerequisites

Before running the demo, make sure that:

* Redis is running and accessible. By default, the demo connects to `localhost:6379`.
* The StackExchange.Redis package is installed:

```bash
dotnet add package StackExchange.Redis
```

If your Redis server is running elsewhere, start the demo with `--redis-host` and `--redis-port`.

## Running the demo

A local demo server is included to show the session store in action
([source](Program.cs)):

```bash
dotnet run
```

The demo server uses ASP.NET Core minimal APIs and exposes a small interactive page where you can:

* Start a session with a username
* Choose a short TTL and watch the session expire
* See the Redis-backed session data rendered in the browser
* Increment a page-view counter stored in Redis
* Change the active session TTL from the page
* Log out and delete the session

After starting the server, visit `http://localhost:8080`.

## Cookie handling

The browser cookie should contain only the session ID:

```csharp
context.Response.Cookies.Append("sid", sessionId, new CookieOptions
{
    HttpOnly = true,
    Path = "/",
    SameSite = SameSiteMode.Lax
});
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

This example keeps everything explicit so you can see the Redis session pattern clearly. In a real app, you will often wrap the same Redis operations behind middleware for ASP.NET Core, MVC, or another .NET web framework.

## Next steps

You now have a complete Redis-backed session example in .NET using StackExchange.Redis. From here you can:

* Adapt the store to your web framework
* Add session ID rotation or absolute expiration
* Store additional lightweight session metadata in the same Redis hash
* Reuse the same Redis deployment across multiple application instances

For more Redis data modeling patterns, see:

* [Session store overview]({{< relref "/develop/use-cases/session-store" >}})
* [.NET client guide]({{< relref "/develop/clients/dotnet" >}})
* [Redis data types]({{< relref "/develop/data-types" >}})
