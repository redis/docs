---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a Redis-backed session store in Python with redis-py
linkTitle: redis-py example (Python)
title: Redis session store with redis-py
weight: 1
---

This guide shows you how to implement a Redis-backed session store in Python with [`redis-py`]({{< relref "/develop/clients/redis-py" >}}). It includes a small local web server built with the Python standard library so you can see the session lifecycle end to end.

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
2. The server generates a random session ID with Python's `secrets` module
3. The server stores session data in Redis under `session:{id}`
4. The server sends a `sid` cookie containing only the session ID
5. Later requests read the cookie, load the hash from Redis, and refresh the TTL
6. Logging out deletes the Redis key and clears the cookie

Because the cookie only contains an opaque identifier, the browser never receives the actual session data. That stays in Redis.

## The Python session store

The `RedisSessionStore` class wraps the basic session operations
([source](session_store.py)):

```python
import redis
from session_store import RedisSessionStore

r = redis.Redis(host="localhost", port=6379, decode_responses=True)
store = RedisSessionStore(redis_client=r, ttl=1800)

session_id = store.create_session(
    {
        "username": "andrew",
        "page_views": "0",
    }
)

session = store.get_session(session_id)
print(session["username"])

store.increment_field(session_id, "page_views")
store.delete_session(session_id)
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
* [`TTL`]({{< relref "/commands/ttl" >}}) to read the remaining session lifetime

The store defines `created_at`, `last_accessed_at`, and `session_ttl` as `RESERVED_SESSION_FIELDS` so caller-provided session data cannot overwrite them.

## Session store implementation

The `create_session()` method generates a random session ID, writes the initial hash fields, and sets the TTL:

```python
def create_session(
    self,
    data: Optional[dict[str, str]] = None,
    ttl: Optional[int] = None,
) -> str:
    session_id = secrets.token_urlsafe(32)
    key = self._session_key(session_id)
    now = self._timestamp()
    session_ttl = self._normalize_ttl(ttl)

    payload = {}
    if data:
        payload.update(
            {
                field: str(value)
                for field, value in data.items()
                if field not in RESERVED_SESSION_FIELDS
            }
        )
    payload.update(
        {
            "created_at": now,
            "last_accessed_at": now,
            "session_ttl": str(session_ttl),
        }
    )

    # Pipeline sends HSET and EXPIRE together so the key never exists without a TTL.
    pipeline = self.redis.pipeline()
    pipeline.hset(key, mapping=payload)
    pipeline.expire(key, session_ttl)
    pipeline.execute()
    return session_id
```

When the application reads a session, it uses a `WATCH`/`MULTI`/`EXEC` block to refresh the TTL atomically. If another client modifies the key between the read and the update, `WatchError` is raised and the operation retries from the start:

```python
def get_session(
    self,
    session_id: str,
    refresh_ttl: bool = True,
) -> Optional[dict[str, str]]:
    key = self._session_key(session_id)

    with self.redis.pipeline() as pipeline:
        while True:
            try:
                # WATCH causes the transaction to abort if another client
                # modifies the key before the MULTI/EXEC block completes.
                pipeline.watch(key)
                session = self._load_session_data(pipeline, key)
                if session is None:
                    pipeline.unwatch()
                    return None

                session_ttl = self._normalize_ttl(int(session["session_ttl"]))

                if not refresh_ttl:
                    pipeline.unwatch()
                    return session

                now = self._timestamp()
                pipeline.multi()
                pipeline.hset(key, mapping={"last_accessed_at": now})
                pipeline.expire(key, session_ttl)
                pipeline.hgetall(key)
                _, _, refreshed_session = pipeline.execute()

                if not refreshed_session or not RESERVED_SESSION_FIELDS.issubset(refreshed_session):
                    return None

                return refreshed_session
            except redis.WatchError:
                # Another client modified the key; retry from the start.
                continue
```

The `increment_field()` method uses [`HINCRBY`]({{< relref "/commands/hincrby" >}}) to atomically increment a numeric field and also refreshes `last_accessed_at` and the TTL in the same `WATCH`/`MULTI`/`EXEC` block:

```python
def increment_field(
    self,
    session_id: str,
    field: str,
    amount: int = 1,
) -> Optional[int]:
    key = self._session_key(session_id)

    with self.redis.pipeline() as pipeline:
        while True:
            try:
                pipeline.watch(key)
                session = self._load_session_data(pipeline, key)
                if session is None:
                    pipeline.unwatch()
                    return None

                session_ttl = self._normalize_ttl(int(session["session_ttl"]))

                pipeline.multi()
                pipeline.hincrby(key, field, amount)
                pipeline.hset(key, mapping={"last_accessed_at": self._timestamp()})
                pipeline.expire(key, session_ttl)
                new_value, _, _ = pipeline.execute()
                return int(new_value)
            except redis.WatchError:
                continue
```

The `delete_session()` method removes the session hash from Redis when the user logs out and returns `True` if a key was deleted, `False` if it did not exist:

```python
def delete_session(self, session_id: str) -> bool:
    return self.redis.delete(self._session_key(session_id)) == 1
```

The `update_session()` method writes new values to arbitrary session fields and refreshes the TTL. Reserved fields are silently excluded. It returns `False` if the session does not exist:

```python
def update_session(self, session_id: str, data: dict[str, str]) -> bool:
    key = self._session_key(session_id)

    payload = {
        field: str(value)
        for field, value in data.items()
        if field not in RESERVED_SESSION_FIELDS
    }

    with self.redis.pipeline() as pipeline:
        while True:
            try:
                pipeline.watch(key)
                session = self._load_session_data(pipeline, key)
                if session is None:
                    pipeline.unwatch()
                    return False

                if not payload:
                    pipeline.unwatch()
                    return True

                session_ttl = self._normalize_ttl(int(session["session_ttl"]))
                payload["last_accessed_at"] = self._timestamp()

                pipeline.multi()
                pipeline.hset(key, mapping=payload)
                pipeline.expire(key, session_ttl)
                pipeline.execute()
                return True
            except redis.WatchError:
                continue
```

The `set_session_ttl()` method replaces the stored `session_ttl` field and calls `EXPIRE` with the new value immediately, so the change takes effect on the running session without waiting for the next request:

```python
def set_session_ttl(self, session_id: str, ttl: int) -> bool:
    key = self._session_key(session_id)
    session_ttl = self._normalize_ttl(ttl)

    with self.redis.pipeline() as pipeline:
        while True:
            try:
                pipeline.watch(key)
                session = self._load_session_data(pipeline, key)
                if session is None:
                    pipeline.unwatch()
                    return False

                pipeline.multi()
                pipeline.hset(
                    key,
                    mapping={
                        "session_ttl": str(session_ttl),
                        "last_accessed_at": self._timestamp(),
                    },
                )
                pipeline.expire(key, session_ttl)
                pipeline.execute()
                return True
            except redis.WatchError:
                continue
```

The `get_ttl()` method returns the remaining lifetime of a session in seconds, read directly from Redis using [`TTL`]({{< relref "/commands/ttl" >}}):

```python
def get_ttl(self, session_id: str) -> int:
    return int(self.redis.ttl(self._session_key(session_id)))
```

This is a simple and effective pattern for many apps. For more complex requirements, you might add separate metadata keys, rotate session IDs after login, or store less frequently accessed data elsewhere. Multi-device session tracking — tracking all sessions per user in a Redis Set so you can implement logout-all — is outside the scope of this guide.

## Prerequisites

Before running the demo, make sure that:

* Redis is running and accessible. By default, the demo connects to `localhost:6379`.
* The `redis` Python package is installed:

```bash
pip install redis
```

If your Redis server is running elsewhere, start the demo with `--redis-host` and `--redis-port`.

## Running the demo

A local demo server is included to show the session store in action
([source](demo_server.py)):

```bash
python demo_server.py
```

The demo server uses only Python standard library features for HTTP handling:

* [`http.server`](https://docs.python.org/3/library/http.server.html) for the web server
* [`http.cookies`](https://docs.python.org/3/library/http.cookies.html) for cookie parsing and response cookies
* [`urllib.parse`](https://docs.python.org/3/library/urllib.parse.html) for form decoding

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

```python
cookie = SimpleCookie()
cookie["sid"] = session_id
cookie["sid"]["path"] = "/"
cookie["sid"]["httponly"] = True
cookie["sid"]["samesite"] = "Lax"
```

Avoid storing user profiles, roles, or other sensitive session data directly in cookies. Keep that information in Redis and let the cookie act only as a lookup token.

## Production usage

This guide uses a deliberately small local demo so you can focus on the Redis session pattern. In production, you will usually want to harden the cookie, session lifecycle, and deployment details around it.

### Secure the session cookie

Set cookie attributes that match your deployment and threat model:

* Keep `HttpOnly` enabled so JavaScript cannot read the session cookie
* Use the `Secure` attribute when serving your app over HTTPS
* Choose an appropriate `SameSite` policy for your login flow and cross-site behavior
* Consider a browser cookie lifetime that matches how you want the session to behave on the client side

### Rotate session IDs after authentication changes

When a user logs in, logs out, or their privilege level changes, consider rotating to a new session ID instead of continuing to use the existing one. This reduces the risk of session fixation and gives you a clean point to re-issue the browser cookie.

### Store only small, frequently accessed session data

Redis-backed sessions work well for small, frequently accessed state such as:

* User identifiers
* Lightweight preferences
* CSRF-related state
* Simple counters or timestamps

Avoid treating the session as a general-purpose profile store. Large or rarely used data is often better kept in your main database or another dedicated store.

### Add CSRF protection when needed

If your application uses cookie-based authentication, make sure your form and API design includes appropriate CSRF protections where needed. The right approach depends on your framework, request patterns, and whether the application accepts cross-site requests.

### Namespace session keys in shared Redis deployments

If multiple applications or environments share the same Redis deployment, use a clear key prefix strategy such as `session:app-a:` or `session:staging:`. Namespacing helps avoid collisions, simplifies cleanup, and makes it easier to inspect keys during operations or debugging.

### Inspect sessions directly in Redis

When testing or troubleshooting, inspect the stored session key directly to confirm that the application is writing the fields and TTL you expect. For example, after creating a session, you can verify the hash contents and expiration with `redis-cli`:

```bash
redis-cli HGETALL session:<session_id>
redis-cli TTL session:<session_id>
```

## Learn more

* [redis-py guide]({{< relref "/develop/clients/redis-py" >}}) - Install and use the Python Redis client
* [EXPIRE command]({{< relref "/commands/expire" >}}) - Set key expiration
* [HSET command]({{< relref "/commands/hset" >}}) - Set hash fields
* [HGETALL command]({{< relref "/commands/hgetall" >}}) - Read a full session hash
* [HINCRBY command]({{< relref "/commands/hincrby" >}}) - Increment counters in a session
