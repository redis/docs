---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a Redis-backed session store in Node.js with node-redis
linkTitle: node-redis example (Node.js)
title: Redis session store with node-redis
weight: 2
---

This guide shows you how to implement a Redis-backed session store in Node.js with [`node-redis`]({{< relref "/develop/clients/nodejs" >}}). It includes a small local web server built with Node's standard `http` module so you can see the session lifecycle end to end.

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
2. The server generates a random session ID with Node's `crypto` module
3. The server stores session data in Redis under `session:{id}`
4. The server sends a `sid` cookie containing only the session ID
5. Later requests read the cookie, load the hash from Redis, and refresh the TTL
6. Logging out deletes the Redis key and clears the cookie

Because the cookie only contains an opaque identifier, the browser never receives the actual session data. That stays in Redis.

## The Node.js session store

The `RedisSessionStore` class wraps the basic session operations
([source](sessionStore.js)):

```javascript
const { createClient } = require("redis");
const { RedisSessionStore } = require("./sessionStore");

async function main() {
  const client = createClient({ url: "redis://localhost:6379" });
  await client.connect();

  const store = new RedisSessionStore({ redisClient: client, ttl: 1800 });

  const sessionId = await store.createSession({
    username: "andrew",
    page_views: "0",
  });

  const session = await store.getSession(sessionId);
  console.log(session.username);

  await store.incrementField(sessionId, "page_views");
  await store.deleteSession(sessionId);
  await client.disconnect();
}

main().catch(console.error);
```

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

```javascript
async createSession(data = {}, ttl = undefined) {
  const sessionId = randomBytes(32).toString("base64url");
  const key = this._sessionKey(sessionId);
  const now = this._timestamp();
  const sessionTtl = this._normalizeTtl(ttl);

  const payload = {};
  for (const [field, value] of Object.entries(data)) {
    if (!RESERVED_SESSION_FIELDS.has(field)) {
      payload[field] = String(value);
    }
  }

  payload.created_at = now;
  payload.last_accessed_at = now;
  payload.session_ttl = String(sessionTtl);

  await this.redis.multi().hSet(key, payload).expire(key, sessionTtl).exec();
  return sessionId;
}
```

When the application reads a session, it refreshes the configured TTL so active users stay logged in:

```javascript
async getSession(sessionId, refreshTtl = true) {
  const key = this._sessionKey(sessionId);
  const session = await this.redis.hGetAll(key);
  if (!this._isValidSession(session)) {
    return null;
  }

  if (!refreshTtl) {
    return session;
  }

  const sessionTtl = this._normalizeTtl(session.session_ttl);
  const now = this._timestamp();
  const [, , refreshedSession] = await this.redis
    .multi()
    .hSet(key, { last_accessed_at: now })
    .expire(key, sessionTtl)
    .hGetAll(key)
    .exec();

  return this._isValidSession(refreshedSession) ? refreshedSession : null;
}
```

This is a simple and effective pattern for many apps. For more complex requirements, you might add separate metadata keys, rotate session IDs after login, or store less frequently accessed data elsewhere.

## Prerequisites

Before running the demo, make sure that:

* Redis is running and accessible. By default, the demo connects to `localhost:6379`.
* The `redis` package is installed:

```bash
npm install redis
```

If your Redis server is running elsewhere, start the demo with `--redis-host` and `--redis-port`.

## Running the demo

A local demo server is included to show the session store in action
([source](demoServer.js)):

```bash
node demoServer.js
```

The demo server uses Node's standard library for HTTP handling:

* [`http`](https://nodejs.org/api/http.html) for the web server
* [`url`](https://nodejs.org/api/url.html) for request parsing
* [`crypto`](https://nodejs.org/api/crypto.html) for generating opaque session IDs

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

```javascript
res.setHeader(
  "Set-Cookie",
  "sid=" + encodeURIComponent(sessionId) + "; Path=/; HttpOnly; SameSite=Lax"
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

This example keeps everything explicit so you can see the Redis session pattern clearly. In a real app, you will often wrap the same Redis operations behind middleware for Express, Fastify, Next.js, or another framework.

## Next steps

You now have a complete Redis-backed session example in Node.js using `node-redis`. From here you can:

* Adapt the store to your web framework
* Add session ID rotation or absolute expiration
* Store additional lightweight session metadata in the same Redis hash
* Reuse the same Redis deployment across multiple application instances

For more Redis data modeling patterns, see:

* [Session store overview]({{< relref "/develop/use-cases/session-store" >}})
* [node-redis guide]({{< relref "/develop/clients/nodejs" >}})
* [Redis data types]({{< relref "/develop/data-types" >}})
