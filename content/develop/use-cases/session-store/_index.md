---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Store web sessions in Redis with cookie-based session IDs and TTL expiration
linkTitle: Session store
title: Redis session store
weight: 2
---

This guide family shows how to store web sessions in Redis so multiple application servers can share session state.

## Overview

A Redis-backed session store is a good fit when you need:

* Shared session state across multiple web servers
* Fast reads and writes for authenticated user state
* Automatic session expiration after inactivity
* A simple way to store lightweight user-specific data

The typical pattern is:

1. Generate an opaque session ID
2. Store the session data in Redis under a key such as `session:{id}`
3. Send the session ID to the browser in a cookie
4. Load the session from Redis on each request
5. Refresh the TTL while the session stays active

## Available implementations

* [redis-py]({{< relref "/develop/use-cases/session-store/redis-py" >}}) - Build a Python session store and a local demo server using the standard library HTTP server
* [Node.js]({{< relref "/develop/use-cases/session-store/nodejs" >}}) - Build a Redis-backed session store with `node-redis` and a local Node.js demo server
* [Go]({{< relref "/develop/use-cases/session-store/go" >}}) - Build a Redis-backed session store with `go-redis` and a local Go demo server
* [Java]({{< relref "/develop/use-cases/session-store/java-jedis" >}}) - Build a Redis-backed session store with Jedis and a local Java demo server
* [.NET]({{< relref "/develop/use-cases/session-store/dotnet" >}}) - Build a Redis-backed session store with `StackExchange.Redis` and a local ASP.NET Core demo server
