---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a Redis-backed session store in Go with go-redis
linkTitle: Go session store
title: Redis session store with Go
weight: 3
---

This guide shows you how to implement a Redis-backed session store in Go with the [`go-redis`]({{< relref "/develop/clients/go" >}}) client library. It includes a small local web server built with Go's standard `net/http` package so you can see the session lifecycle end to end.

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
2. The server generates a random session ID with Go's `crypto/rand` package
3. The server stores session data in Redis under `session:{id}`
4. The server sends a `sid` cookie containing only the session ID
5. Later requests read the cookie, load the hash from Redis, and refresh the TTL
6. Logging out deletes the Redis key and clears the cookie

Because the cookie only contains an opaque identifier, the browser never receives the actual session data. That stays in Redis.

## The Go session store

The `RedisSessionStore` type wraps the basic session operations
([source](session_store.go)):

```go
package main

import (
	"context"
	"fmt"
	"log"

	"github.com/redis/go-redis/v9"
)

func main() {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr: "localhost:6379",
	})

	store := NewRedisSessionStore(SessionStoreConfig{
		Client: rdb,
		TTL:    1800,
	})

	sessionID, err := store.CreateSession(ctx, map[string]string{
		"username":   "andrew",
		"page_views": "0",
	}, 0)
	if err != nil {
		log.Fatal(err)
	}

	session, ok, err := store.GetSession(ctx, sessionID, true)
	if err != nil {
		log.Fatal(err)
	}
	if ok {
		fmt.Println(session["username"])
	}

	_, _, _ = store.IncrementField(ctx, sessionID, "page_views", 1)
	_, _ = store.DeleteSession(ctx, sessionID)
}
```

Go's `context.Context` is passed to every store call, making it easy to set deadlines and cancellations in a real application.

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

```go
func (s *RedisSessionStore) CreateSession(
	ctx context.Context,
	data map[string]string,
	ttl int,
) (string, error) {
	sessionID, err := randomSessionID()
	if err != nil {
		return "", err
	}

	key := s.sessionKey(sessionID)
	now := s.timestamp()
	sessionTTL, err := s.normalizeTTL(ttl)
	if err != nil {
		return "", err
	}

	payload := map[string]string{
		"created_at":       now,
		"last_accessed_at": now,
		"session_ttl":      strconv.Itoa(sessionTTL),
	}

	for field, value := range data {
		if !reservedSessionFields[field] {
			payload[field] = value
		}
	}

	pipe := s.client.TxPipeline()
	pipe.HSet(ctx, key, payload)
	pipe.Expire(ctx, key, time.Duration(sessionTTL)*time.Second)
	_, err = pipe.Exec(ctx)
	return sessionID, err
}
```

When the application reads a session, it refreshes the configured TTL so active users stay logged in:

```go
func (s *RedisSessionStore) GetSession(
	ctx context.Context,
	sessionID string,
	refreshTTL bool,
) (map[string]string, bool, error) {
	key := s.sessionKey(sessionID)
	session, err := s.client.HGetAll(ctx, key).Result()
	if err != nil {
		return nil, false, err
	}
	if !isValidSession(session) {
		return nil, false, nil
	}

	if !refreshTTL {
		return session, true, nil
	}

	sessionTTL, err := s.normalizeTTLString(session["session_ttl"])
	if err != nil {
		return nil, false, err
	}

	pipe := s.client.TxPipeline()
	pipe.HSet(ctx, key, map[string]string{"last_accessed_at": s.timestamp()})
	pipe.Expire(ctx, key, time.Duration(sessionTTL)*time.Second)
	getCmd := pipe.HGetAll(ctx, key)
	if _, err := pipe.Exec(ctx); err != nil {
		return nil, false, err
	}

	refreshed := getCmd.Val()
	return refreshed, isValidSession(refreshed), nil
}
```

This is a simple and effective pattern for many apps. For more complex requirements, you might add separate metadata keys, rotate session IDs after login, or store less frequently accessed data elsewhere.

## Prerequisites

Before running the demo, make sure that:

* Redis is running and accessible. By default, the demo connects to `localhost:6379`.
* The `go-redis` package is available:

```bash
go get github.com/redis/go-redis/v9
```

If your Redis server is running elsewhere, start the demo with `-redis-host` and `-redis-port`.

## Running the demo

A local demo server is included to show the session store in action
([source](demo_server.go)):

Create a `main.go` file in the same directory:

```go
package main

import "sessionstore"

func main() { sessionstore.RunDemoServer() }
```

Then build and run:

```bash
go build -o demo ./...
./demo
```

The demo server uses Go's standard library for HTTP handling:

* [`net/http`](https://pkg.go.dev/net/http) for the web server and cookies
* [`net/url`](https://pkg.go.dev/net/url) for form parsing
* [`html`](https://pkg.go.dev/html) for rendering session values safely

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

```go
http.SetCookie(w, &http.Cookie{
	Name:     "sid",
	Value:    sessionID,
	Path:     "/",
	HttpOnly: true,
	SameSite: http.SameSiteLaxMode,
})
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

This example keeps everything explicit so you can see the Redis session pattern clearly. In a real app, you will often wrap the same Redis operations behind middleware for Gin, Echo, Fiber, or another Go web framework.

## Next steps

You now have a complete Redis-backed session example in Go using `go-redis`. From here you can:

* Adapt the store to your web framework
* Add session ID rotation or absolute expiration
* Store additional lightweight session metadata in the same Redis hash
* Reuse the same Redis deployment across multiple application instances

For more Redis data modeling patterns, see:

* [Session store overview]({{< relref "/develop/use-cases/session-store" >}})
* [Go client guide]({{< relref "/develop/clients/go" >}})
* [Redis data types]({{< relref "/develop/data-types" >}})
