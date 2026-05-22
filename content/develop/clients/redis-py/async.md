---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- oss
- kubernetes
- clients
description: Use redis-py with asyncio for non-blocking Redis access
linkTitle: Async operations
title: Asynchronous operations with redis-py
weight: 22
---

`redis-py` provides an asyncio-compatible API under the
[`redis.asyncio`](https://redis.readthedocs.io/en/stable/examples/asyncio_examples.html)
namespace. It mirrors the synchronous client API, so most code patterns
translate directly — you `await` commands instead of calling them.

Use the async client for I/O-bound workloads, for integration with async web
frameworks (such as [FastAPI](https://fastapi.tiangolo.com/), [Starlette](https://www.starlette.io/), [aiohttp](https://docs.aiohttp.org/en/stable/), or [Sanic](https://sanic.dev/en/), or when you need
to run many concurrent Redis operations from a single process. For simple
scripts, CPU-bound work, or codebases without an existing event loop, the
synchronous client is usually a better choice.

The examples on the other pages in this section use the synchronous client,
but you can translate any of them to async by following the rules in
[Translating sync examples](#translating-sync-examples) below.

## Basic connection

Import the async client from `redis.asyncio` and `await` each command.
Construction is synchronous and doesn't open a connection — the pool
establishes one lazily the first time you issue a command. Call `aclose()`
when you're done to release the underlying socket.

{{< clients-example set="async_intro" step="connect" lang_filter="Python" description="Foundational: Connect to Redis with the async client and run a basic SET/GET" difficulty="beginner" >}}
{{< /clients-example >}}

The recommended pattern is to use the client as an async context manager,
which ensures `aclose()` runs even if an exception is raised:

{{< clients-example set="async_intro" step="context_manager" lang_filter="Python" description="Foundational: Use the async client as a context manager for automatic cleanup" difficulty="beginner" >}}
{{< /clients-example >}}

## Connection pools

For production usage, you should manage connections with a connection pool
rather than opening and closing them individually.
See [Connection pools and multiplexing]({{< relref "/develop/clients/pools-and-muxing" >}})
for more information about how this works.

A `Redis` client instance already creates and manages its own connection
pool internally, so in a long-running async application the recommended
pattern is to create a single client at startup, share it across requests
and tasks, and close it at shutdown. Avoid creating a new `Redis()` per
request — it defeats pooling and pays the connection cost on every call.

{{< clients-example set="async_intro" step="pool" lang_filter="Python" description="Foundational: Create and share a single async client across the app" difficulty="beginner" >}}
{{< /clients-example >}}

Tune `max_connections` to the maximum number of concurrent Redis operations
you expect from the process. If you'd rather block on pool exhaustion than
raise an error, construct the client with a `BlockingConnectionPool`.

{{% alert title="Note" %}}
Don't share a single `ConnectionPool` across multiple `Redis(connection_pool=...)`
instances. Closing any one of those clients also closes the shared pool,
which silently invalidates the connections held by every other client using
it. Share the `Redis` client object instead.
{{% /alert %}}

## Awaiting commands

Every command method on the async client returns a coroutine — each call
must be `await`ed. Forgetting `await` returns a coroutine object instead of
a result, which is the most common async mistake to watch for.

Because each command is a coroutine, you can run several concurrently with
`asyncio.gather()`:

{{< clients-example set="async_intro" step="gather" lang_filter="Python" description="Run several Redis commands concurrently with asyncio.gather" difficulty="intermediate" >}}
{{< /clients-example >}}

Each in-flight command consumes one pooled connection while it's executing,
so size `max_connections` to match your peak concurrency. (If you instantiate
the client with `single_connection_client=True`, all commands serialize
through a single connection instead.)

## Pipelines and transactions

Pipelines and transactions work the same way as in the synchronous client
(see [Pipelines and transactions]({{< relref "/develop/clients/redis-py/transpipe" >}})
for the conceptual background). The only difference is that you create the
pipeline inside an `async with` block and `await pipe.execute()`.

{{< clients-example set="async_intro" step="pipeline" lang_filter="Python" description="Foundational: Execute commands in an async pipeline" difficulty="beginner" >}}
{{< /clients-example >}}

`WATCH`/`MULTI`/`EXEC` for optimistic locking also has an async form.
`watch()` and `execute()` are coroutines; `multi()` remains synchronous
because it only toggles internal pipeline state.

{{< clients-example set="async_intro" step="watch" lang_filter="Python" description="Optimistic locking with an async pipeline and WATCH" difficulty="intermediate" >}}
{{< /clients-example >}}

## Pub/Sub

The async pub/sub object follows the same shape as the sync version. Call
`await pubsub.subscribe(...)` to register channels, then iterate messages
with `async for message in pubsub.listen():`. Use the `PubSub` object as an
async context manager (`async with r.pubsub() as pubsub:`) or call
`await pubsub.aclose()` explicitly to release the connection.

{{< clients-example set="async_intro" step="pubsub" lang_filter="Python" description="Subscribe and receive messages with the async pub/sub API" difficulty="intermediate" >}}
{{< /clients-example >}}

A single `PubSub` object isn't safe to share across tasks — give each
consuming task its own subscription.

## Cluster connections

To connect to a Redis cluster asynchronously, import `RedisCluster` from
`redis.asyncio.cluster`. The API matches the synchronous cluster client
(see [Connect to a Redis cluster]({{< relref "/develop/clients/redis-py/connect#connect-to-a-redis-cluster" >}})),
with `await` in front of each command.

{{< clients-example set="async_intro" step="cluster" lang_filter="Python" description="Foundational: Connect to a Redis cluster with the async client" difficulty="beginner" >}}
{{< /clients-example >}}

## Cleanup and lifecycle

Always close clients and pools when you're done:

- Use `async with Redis(...) as r:` whenever the client's lifetime fits a
  single scope.
- For longer-lived clients, call `await r.aclose()` explicitly. (The older
  `close()` method is deprecated.)
- For frameworks with startup/shutdown hooks — for example FastAPI's
  `lifespan` — create the client or pool at startup and close it at
  shutdown so connections aren't leaked between process restarts.

## Cancellation and timeouts

You can cancel an in-flight command by wrapping it in `asyncio.wait_for()`
(or `asyncio.timeout()` on Python 3.11+). If the command is canceled
mid-flight, `redis-py` disconnects the underlying connection to avoid
response/request misalignment on subsequent reads. The next command
transparently picks up a new connection from the pool.

{{< clients-example set="async_intro" step="timeout" lang_filter="Python" description="Apply an asyncio timeout to a Redis command" difficulty="intermediate" >}}
{{< /clients-example >}}

A `Redis` client instance is safe to share across tasks (the pool handles
concurrency), but stateful objects derived from it — pipelines and pub/sub
subscriptions — are not. Give each task its own pipeline or `PubSub`.

## Translating sync examples

To adapt any synchronous example elsewhere in this guide to the async
client, apply these rules:

- Replace `import redis` with `import redis.asyncio as redis`.
- Wrap the example in an `async def` function and call it with
  `asyncio.run(...)`.
- Add `await` in front of every command call. (Exception: buffered pipeline
  commands such as `pipe.set(...)` stay un-awaited; only `pipe.watch(...)`,
  any reads issued before `pipe.multi()`, and `pipe.execute()` are awaited.)
- Replace `with r.pipeline(...) as pipe:` with
  `async with r.pipeline(...) as pipe:`, and `await pipe.execute()`.
- Replace `r.close()` with `await r.aclose()`, or use
  `async with redis.Redis(...) as r:` as a context manager.

## More information

- The [`redis-py` asyncio examples](https://redis.readthedocs.io/en/stable/examples/asyncio_examples.html)
  on Read the Docs cover further patterns.
- See [Error handling]({{< relref "/develop/clients/redis-py/error-handling" >}}) and
  [Client-side geographic failover]({{< relref "/develop/clients/redis-py/failover" >}}) for
  resiliency patterns that apply to both sync and async clients.
