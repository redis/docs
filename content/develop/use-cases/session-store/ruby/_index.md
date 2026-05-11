---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a Redis-backed session store in Ruby with redis-rb
linkTitle: redis-rb example (Ruby)
title: Redis session store with Ruby
weight: 7
---

This guide shows you how to implement a Redis-backed session store in Ruby with [`redis-rb`]({{< relref "/develop/clients/ruby" >}}). It includes a small local web server built with WEBrick so you can see the session lifecycle end to end.

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
2. The server generates a random session ID with Ruby's `SecureRandom`
3. The server stores session data in Redis under `session:{id}`
4. The server sends a `sid` cookie containing only the session ID
5. Later requests read the cookie, load the hash from Redis, and refresh the TTL
6. Logging out deletes the Redis key and clears the cookie

Because the cookie only contains an opaque identifier, the browser never receives the actual session data. That stays in Redis.

## The Ruby session store

The `RedisSessionStore` class wraps the basic session operations
([source](session_store.rb)):

```ruby
require "redis"
require_relative "session_store"

redis = Redis.new(host: "localhost", port: 6379)
store = RedisSessionStore.new(redis: redis, ttl: 1800)

session_id = store.create_session(
  {
    username: "andrew",
    page_views: "0"
  }
)

session = store.get_session(session_id)
puts session["username"]

store.increment_field(session_id, "page_views")
store.delete_session(session_id)
```

Ruby's keyword arguments make the constructor options readable, and the store returns hashes and scalars that fit naturally with typical Ruby application code.

### Data model

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

The `create_session()` method generates a random session ID, writes the initial hash fields, and sets the TTL:

```ruby
def create_session(data = {}, ttl: nil)
  session_id = SecureRandom.urlsafe_base64(32)
  key = session_key(session_id)
  now = timestamp
  session_ttl = normalize_ttl(ttl)

  payload = user_payload(data).merge(
    "created_at" => now,
    "last_accessed_at" => now,
    "session_ttl" => session_ttl.to_s
  )

  @redis.pipelined do |pipeline|
    pipeline.hset(key, payload)
    pipeline.expire(key, session_ttl)
  end

  session_id
end
```

When the application reads a session, it refreshes the configured TTL so active users stay logged in:

```ruby
def get_session(session_id, refresh_ttl: true)
  key = session_key(session_id)
  session = @redis.hgetall(key)
  return nil unless valid_session?(session)

  return session unless refresh_ttl

  session_ttl = normalize_ttl(Integer(session["session_ttl"]))
  result = @redis.pipelined do |pipeline|
    pipeline.hset(key, "last_accessed_at", timestamp)
    pipeline.expire(key, session_ttl)
    pipeline.hgetall(key)
  end

  refreshed = result[2] || {}
  valid_session?(refreshed) ? refreshed : nil
end
```

This is a simple and effective pattern for many apps. For more complex requirements, you might add separate metadata keys, rotate session IDs after login, or store less frequently accessed data elsewhere.

## Installation

Install the `redis` gem:

```bash
gem install redis
```

Or add it to your `Gemfile`:

```ruby
gem "redis", "~> 5.0"
```

Then run:

```bash
bundle install
```

## Running the demo

A local demo server is included to show the session store in action
([source](demo_server.rb)):

```bash
gem install redis webrick
ruby demo_server.rb
```

The demo exposes a small interactive page where you can:

* Start a session with a username
* Choose a short TTL and watch the session expire
* See the Redis-backed session data rendered in the browser
* Increment a page-view counter stored in Redis
* Change the active session TTL from the page
* Log out and delete the session

The demo assumes Redis is running on `localhost:6379`, but you can override that with `--redis-host` and `--redis-port`. After starting the server, visit `http://localhost:8080`.

## Cookie handling

The browser cookie should contain only the session ID:

```ruby
cookie = WEBrick::Cookie.new("sid", session_id)
cookie.path = "/"
cookie.httponly = true
res.cookies << cookie
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

This example keeps everything explicit so you can see the Redis session pattern clearly. In a real app, you will often wrap the same Redis operations behind middleware for Rails, Sinatra, Hanami, or another Rack-based framework.

## Next steps

You now have a complete Redis-backed session example in Ruby using `redis-rb`. From here you can:

* Adapt the store to your web framework
* Add session ID rotation or absolute expiration
* Store additional lightweight session metadata in the same Redis hash
* Reuse the same Redis deployment across multiple application instances

For more Redis data modeling patterns, see:

* [Session store overview]({{< relref "/develop/use-cases/session-store" >}})
* [Ruby client guide]({{< relref "/develop/clients/ruby" >}})
* [Redis data types]({{< relref "/develop/data-types" >}})
