---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a Redis-backed session store in Rust with redis-rs
linkTitle: Rust session store
title: Redis session store with Rust
weight: 8
---

This guide shows you how to implement a Redis-backed session store in Rust with [`redis-rs`]({{< relref "/develop/clients/rust" >}}). The module includes both synchronous and asynchronous APIs, and the demo server uses the async path so you can see the session lifecycle end to end.

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
2. The server generates a random session ID with Rust's `rand` support in `getrandom`
3. The server stores session data in Redis under `session:{id}`
4. The server sends a `sid` cookie containing only the session ID
5. Later requests read the cookie, load the hash from Redis, and refresh the TTL
6. Logging out deletes the Redis key and clears the cookie

Because the cookie only contains an opaque identifier, the browser never receives the actual session data. That stays in Redis.

## The Rust session store

The `RedisSessionStore` struct wraps the basic session operations
([source](session_store.rs)).

### Synchronous usage

```rust
use redis::Client;
use std::collections::HashMap;

fn main() -> redis::RedisResult<()> {
    let client = Client::open("redis://localhost:6379/")?;
    let mut con = client.get_connection()?;

    let store = RedisSessionStore::new("session:", 1800)?;

    let session_id = store.create_session(
        &mut con,
        &HashMap::from([
            ("username".to_string(), "andrew".to_string()),
            ("page_views".to_string(), "0".to_string()),
        ]),
        None,
    )?;

    let session = store.get_session(&mut con, &session_id, true)?;
    if let Some(session) = session {
        println!("{}", session["username"]);
    }

    let _ = store.increment_field(&mut con, &session_id, "page_views", 1)?;
    let _ = store.delete_session(&mut con, &session_id)?;
    Ok(())
}
```

### Asynchronous usage

```rust
use redis::{AsyncCommands, Client};
use std::collections::HashMap;

#[tokio::main]
async fn main() -> redis::RedisResult<()> {
    let client = Client::open("redis://localhost:6379/")?;
    let mut con = client.get_async_connection().await?;

    let store = RedisSessionStore::new("session:", 1800)?;

    let session_id = store
        .create_session_async(
            &mut con,
            &HashMap::from([
                ("username".to_string(), "andrew".to_string()),
                ("page_views".to_string(), "0".to_string()),
            ]),
            None,
        )
        .await?;

    let session = store.get_session_async(&mut con, &session_id, true).await?;
    if let Some(session) = session {
        println!("{}", session["username"]);
    }

    let _ = store
        .increment_field_async(&mut con, &session_id, "page_views", 1)
        .await?;
    let _ = store.delete_session_async(&mut con, &session_id).await?;
    Ok(())
}
```

This mirrors the Rust client docs, where it is common to offer both sync and async examples.

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

The `create_session()` and `create_session_async()` methods generate a random session ID, write the initial hash fields, and set the TTL:

```rust
pub fn create_session(
    &self,
    con: &mut impl redis::ConnectionLike,
    data: &HashMap<String, String>,
    ttl: Option<usize>,
) -> RedisResult<String> {
    let session_id = self.create_session_id();
    let key = self.session_key(&session_id);
    let now = self.timestamp();
    let session_ttl = self.normalize_ttl(ttl)?;

    let payload = self.session_payload(data, &now, session_ttl);
    let payload_pairs = Self::hash_pairs(&payload);

    let _: () = con.hset_multiple(&key, &payload_pairs)?;
    let _: bool = con.expire(&key, session_ttl as i64)?;
    Ok(session_id)
}
```

When the application reads a session, it refreshes the configured TTL so active users stay logged in:

```rust
pub async fn get_session_async<C>(
    &self,
    con: &mut C,
    session_id: &str,
    refresh_ttl: bool,
) -> RedisResult<Option<HashMap<String, String>>>
where
    C: redis::aio::ConnectionLike + Send,
{
    let key = self.session_key(session_id);
    let session: HashMap<String, String> = con.hgetall(&key).await?;
    if !self.is_valid_session(&session) {
        return Ok(None);
    }

    if !refresh_ttl {
        return Ok(Some(session));
    }

    let session_ttl = self.normalize_ttl(Some(session["session_ttl"].parse()?))?;
    let _: usize = con.hset(&key, "last_accessed_at", self.timestamp()).await?;
    let _: bool = con.expire(&key, session_ttl as i64).await?;

    let refreshed: HashMap<String, String> = con.hgetall(&key).await?;
    Ok(self.is_valid_session(&refreshed).then_some(refreshed))
}
```

This is a simple and effective pattern for many apps. For more complex requirements, you might add separate metadata keys, rotate session IDs after login, or store less frequently accessed data elsewhere.

## Installation

Add the crates you need to `Cargo.toml`:

```toml
[dependencies]
redis = { version = "0.24", features = ["tokio-comp"] }
tokio = { version = "1", features = ["full"] }
axum = "0.7"
serde = { version = "1.0", features = ["derive"] }
time = { version = "0.3", features = ["formatting"] }
```

If you only need the synchronous API, you can omit the async server dependencies and the Tokio feature.

## Running the demo

A local demo server is included to show the session store in action
([source](demo_server.rs)):

```bash
cargo build
cargo run --bin demo_server
```

The demo uses `axum` with an async Redis connection and exposes a small interactive page where you can:

* Start a session with a username
* Choose a short TTL and watch the session expire
* See the Redis-backed session data rendered in the browser
* Increment a page-view counter stored in Redis
* Change the active session TTL from the page
* Log out and delete the session

The demo assumes Redis is running on `localhost:6379`, but you can override that with `REDIS_URL`. After starting the server, visit `http://localhost:8080`.

## Cookie handling

The browser cookie should contain only the session ID:

```rust
headers.insert(
    header::SET_COOKIE,
    HeaderValue::from_str(&format!(
        "sid={}; Path=/; HttpOnly; SameSite=Lax",
        session_id
    ))?,
);
```

Avoid storing user profiles, roles, or other sensitive session data directly in cookies. Keep that information in Redis and let the cookie act only as a lookup token.

## Production usage

This guide uses a deliberately small local demo so you can focus on the Redis session pattern. In production, you will usually want to harden the cookie, session lifecycle, and deployment details around it.

### Secure the session cookie

Set cookie attributes that match your deployment and threat model:

* Keep `HttpOnly` enabled so browser JavaScript cannot read the session cookie
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

This example keeps everything explicit so you can see the Redis session pattern clearly. In a real app, you will often wrap the same Redis operations behind middleware for axum, actix-web, Rocket, or another Rust web framework.

## Next steps

You now have a complete Redis-backed session example in Rust using `redis-rs`. From here you can:

* Adapt the store to your web framework
* Add session ID rotation or absolute expiration
* Store additional lightweight session metadata in the same Redis hash
* Reuse the same Redis deployment across multiple application instances

For more Redis data modeling patterns, see:

* [Session store overview]({{< relref "/develop/use-cases/session-store" >}})
* [Rust client guide]({{< relref "/develop/clients/rust" >}})
* [Redis data types]({{< relref "/develop/data-types" >}})
