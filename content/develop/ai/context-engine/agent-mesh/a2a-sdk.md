---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Add resumable task updates to an A2A Python application.
hideListLinks: true
linktitle: A2A SDK guide
title: Integrate Agent Mesh with A2A
weight: 20
---

Use the Agent Mesh software development kit (SDK) to let clients resume Agent2Agent (A2A) task updates after a disconnect, including through another serving replica. Redis retains the updates and a current Task snapshot. Your application runs the agent and controls access.

For a runnable browser example, start with the [A2A quickstart](/content/develop/ai/context-engine/agent-mesh/quickstart.md#resume-a2a-task-updates). This guide explains how to add the integration to an existing application.

## Install the integration

You need Python 3.11 or later, Redis 8.6 or later with native producer idempotency (`XADD IDMP`), and the official A2A Python SDK 1.2.x.

```bash
pip install 'redis-iris[a2a]'
```

To use both integrations in one application, install `redis-iris[a2a,fastapi-sse]`. Their shared redis-py range is `>=8.0.1,<9`; separate Python environments are not required.

Use the [quickstart's database setup](/content/develop/ai/context-engine/agent-mesh/quickstart.md#choose-your-redis-database) for a local or Redis Cloud connection. Keep database credentials in application configuration.

## Connect your request handler

The application factory in this example accepts your existing `AgentExecutor`, `AgentCard`, and Starlette authentication backend. The authentication backend must verify credentials and populate `request.user`. Set your card's streaming capability to `True` before constructing the application.

```python
import os
from contextlib import asynccontextmanager

from a2a.server.request_handlers import DefaultRequestHandler
from a2a.server.routes import create_agent_card_routes, create_jsonrpc_routes
from redis.asyncio import Redis
from redis_iris.agent_mesh.a2a import RedisTaskEventStream, RedisTaskStore
from redis_iris.agent_mesh.a2a.routes import (
    create_resumable_rest_routes,
    resumable_streams_extension,
)
from starlette.applications import Starlette
from starlette.middleware import Middleware
from starlette.middleware.authentication import AuthenticationMiddleware


def create_app(agent_executor, agent_card, auth_backend):
    commands = Redis.from_url(
        os.environ["REDIS_URL"], max_connections=16, socket_timeout=5
    )
    readers = Redis.from_url(
        os.environ["REDIS_URL"], max_connections=64, socket_timeout=5
    )
    store = RedisTaskStore(commands, namespace="myapp:a2a")
    event_stream = RedisTaskEventStream(readers, store=store)
    handler = DefaultRequestHandler(
        agent_executor=store.heartbeat(agent_executor),
        agent_card=agent_card,
        task_store=store,
        event_stream=event_stream,
    )
    agent_card.capabilities.extensions.append(resumable_streams_extension())

    @asynccontextmanager
    async def lifespan(app):
        async with commands, readers:
            try:
                yield
            finally:
                await handler.aclose()

    return Starlette(
        routes=[
            *create_agent_card_routes(agent_card),
            *create_jsonrpc_routes(handler, rpc_url="/"),
            *create_resumable_rest_routes(
                handler, store=store, event_stream=event_stream
            ),
        ],
        middleware=[Middleware(AuthenticationMiddleware, backend=auth_backend)],
        lifespan=lifespan,
    )
```

Use the same Redis database, namespace, and ownership policy on every replica. Use primary reads for both snapshots and events. Your application owns credentials, Transport Layer Security (TLS), connection pools, timeouts, and shutdown.

Each waiting subscription occupies a Redis connection. A separate reader pool keeps blocked subscriptions from exhausting connections needed for writes and heartbeats. Set its socket timeout above the event stream's `block_ms` interval, which defaults to 1,000 milliseconds.

`RedisTaskStore` commits the Task snapshot, version, and event together. The paired event stream reads that log; its `publish()` method does not append another copy. Keep writing through the official request handler and its task store.

## Enforce ownership

By default, the store requires an authenticated user. Behind the SDK's Starlette routes, ownership uses the user's `display_name`. Ensure this value uniquely identifies a principal across your tenants.

For a different identity model, pass `owner_resolver` to `RedisTaskStore`. The callable receives the official `ServerCallContext` and must return a nonempty, stable owner derived from verified identity. Never derive it from request bodies, task IDs, or unverified headers.

The official handler and resumable routes check ownership before subscribing. The internal `RedisTaskEventStream` reader has no request context: do not expose it directly to callers without that check. Task IDs and event cursors grant no access.

## Start and resume a subscription

`create_resumable_rest_routes()` adds event cursors to the HTTP+JSON binding's `POST /message:stream` and `GET` or `POST /tasks/{id}:subscribe` routes. Other REST routes retain the official SDK's behavior.

To follow an existing active task, send an authenticated request to `/tasks/<task-id>:subscribe` with `A2A-Version: 1.0`. Without a cursor, the response starts with the current Task snapshot and follows new updates.

Task frames use server-sent events (SSE) and carry an `id:` containing the Task version. After applying a frame, save its ID. On reconnect, send that value in `Last-Event-ID` to receive retained updates strictly after it. The routes also accept the `after` query parameter.

For example, these are the request headers for a reconnect using your application's bearer authentication:

```http
GET /tasks/<task-id>:subscribe HTTP/1.1
Accept: text/event-stream
A2A-Version: 1.0
Authorization: Bearer <application-access-token>
Last-Event-ID: <last-applied-task-version>
```

Use an SSE client that parses frames and handles reconnect status codes. A fetch-based browser client can supply both the version and authorization headers. Native `EventSource` cannot set those headers. To use it, you need an explicit fixed-version server policy and browser-compatible authentication, as demonstrated by the [local quickstart](/content/develop/ai/context-engine/agent-mesh/quickstart.md#resume-a2a-task-updates). The route factory does not install that policy.

A missing version header is interpreted as A2A 0.3 and rejected by the resumable routes. Declaring `resumable_streams_extension()` in the card advertises support; it does not select the request version. The official A2A client does not send `Last-Event-ID`, so it receives standard snapshot-then-live subscriptions.

Message-only replies and error frames have no Task-version ID. They must not advance the saved cursor. Task versions are not raw Redis stream entry IDs.

## Handle replay and completion

| Condition | Behavior |
| --- | --- |
| Retained cursor | Replay updates after the cursor, then follow new updates. |
| Trimmed history or compact Task replacement | Return the current Task snapshot, then follow events after its version. Intermediate updates covered by the snapshot are not reproduced. |
| Final cursor already consumed | Return HTTP 204; stop reconnecting. |
| No cursor for a terminal task | Reject the subscription; use the normal task retrieval API. |
| Malformed, repeated, or future cursor | Return HTTP 400. |
| Missing or expired snapshot | A new request receives TaskNotFound (HTTP 404). After streaming headers, send a TaskNotFound error frame. |

An update that moves a Task to a terminal, input-required, or auth-required state ends the HTTP subscription. If the Task already requires input or authentication when you subscribe, the stream can remain open. Without a cursor, it sends the waiting Task snapshot and then waits. With a cursor matching the current version, it waits without sending a Task frame.

Act on the Task's state and provide the required input or credentials through your application's A2A interaction. Do not wait for the stream to close. Disconnecting a subscriber does not cancel execution.

For cancellation, use the official handler's cancellation path. A cancellation can supersede a stale version while the stored Task is nonterminal. A later write cannot revive a terminal Task. These guards protect Redis updates; they do not undo external effects.

## Monitor executing agents

The optional `store.heartbeat(executor, interval=5.0, alive_ttl=15.0)` wrapper refreshes liveness and retention while the agent executes. It checks stored terminal state and stops local execution when another replica cancels or finishes the Task. Set `alive_ttl` greater than `interval`.

With an active store-backed subscriber, a lapsed heartbeat on a submitted or working Task marks it failed with a `producer_lost` status message. Polling task state alone does not trigger this recovery. Tasks waiting for input or authentication, and tasks without tracked heartbeats, are excluded.

The wrapper does not restart computation. Without it, an agent on another replica learns of cancellation at its next write. With A2A SDK 1.2.3, continued emission after that cancellation can also leave handler shutdown waiting indefinitely; the wrapper stops the agent first.

## Configure retention and limits

Pass these options to `RedisTaskStore`:

| Option | Default | Purpose |
| --- | --- | --- |
| `namespace` | `iris:a2a` | Isolate applications and deployments. |
| `active_ttl` | 604,800 seconds (7 days) | Active snapshot and event retention, refreshed by saves or heartbeats. |
| `terminal_ttl` | 86,400 seconds (1 day) | Terminal snapshot and event retention. |
| `metadata_ttl` | 86,400 seconds | Additional ownership and version retention after snapshot expiry. |
| `max_task_bytes` | 1,048,576 | Serialized snapshot size limit. |
| `max_event_bytes` | 1,048,576 | Serialized event size limit. |
| `max_events` | 10,000 | Approximate retained log length. |
| `max_attempts` | 5 | Maximum attempts under transaction contention. |

The byte limits apply before hex encoding; stored payloads use about twice those serialized sizes. Size the event limit and log length for your memory budget. An oversized payload raises `A2ACapacityExceeded` without changing the snapshot or log.

Owner metadata prevents another owner from reusing a Task ID until it expires. Deleting an owned Task removes its snapshot and events while retaining ownership metadata for `metadata_ttl`. After metadata expiry, reuse cannot be detected.

| Public API | Use it to |
| --- | --- |
| `RedisTaskStore` | Store owner-scoped snapshots and versioned updates through the official SDK. |
| `store.event_stream()` | Build the matching event reader, with producer-loss recovery. |
| `RedisTaskEventStream` | Configure a reader explicitly with `store=store` and a separate client. |
| `store.heartbeat()` | Track execution liveness and notice remote cancellation. |
| `create_resumable_rest_routes()` | Expose cursor-enabled REST streaming. |
| `resumable_streams_extension()` | Advertise cursor support in the agent card. |

Storage and internal reader calls can raise `A2AStorageError`, `A2ACapacityExceeded`, or `A2AStreamExpired`. Stale or conflicting writes raise the official SDK's `ConcurrentTaskModificationError`. Let the handler and routes translate these into protocol responses rather than exposing storage exceptions to clients.

Task listing scans the namespace and suits modest inventories. It is not a search index or a consistent snapshot during concurrent writes.

See the [SDK API reference](https://github.com/redis/redis-iris/blob/main/docs/core/agent-mesh-a2a.md) for signatures and the [preview limits](/content/develop/ai/context-engine/agent-mesh/_index.md#requirements-and-limits) for deployment qualification. Redis durability remains application-owned; replay does not guarantee exactly-once external effects.
