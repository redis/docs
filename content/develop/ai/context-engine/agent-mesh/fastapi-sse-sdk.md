---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Add resumable application event streams to a FastAPI application.
hideListLinks: true
linktitle: FastAPI SSE SDK guide
title: Integrate Agent Mesh with FastAPI
weight: 30
---

Use the Agent Mesh software development kit (SDK) to publish application events independently of client connections. FastAPI clients can reconnect with a saved cursor to replay retained server-sent events (SSE), then follow new ones.

For a runnable browser example, start with the [FastAPI quickstart](/content/develop/ai/context-engine/agent-mesh/quickstart.md#resume-fastapi-events). This guide explains application integration, access checks, and recovery.

## Install the integration

You need Python 3.11 or later and Redis 8.6 or later with native producer idempotency (`XADD IDMP`).

```bash
pip install 'redis-iris[fastapi-sse]'
```

Use the [quickstart's database setup](/content/develop/ai/context-engine/agent-mesh/quickstart.md#choose-your-redis-database) for a local or Redis Cloud connection. The A2A extra is independent and is not required.

The `redis_iris.agent_mesh.fastapi_sse` module exposes the FastAPI Redis SDK streaming objects unchanged. Your application supplies configuration, Redis clients, authentication, and execution.

## Register the backend

Create separate Redis clients for commands and blocking event delivery. This example reads an application-owned `REDIS_URL` and supplies explicit `StreamSettings`.

```python
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from redis.asyncio import Redis
from redis_iris.agent_mesh.fastapi_sse import (
    StreamBackend,
    StreamSettings,
    add_redis_streams,
)

commands = Redis.from_url(
    os.environ["REDIS_URL"], max_connections=16, socket_timeout=5
)
relays = Redis.from_url(
    os.environ["REDIS_URL"], max_connections=4, socket_timeout=5
)
backend = StreamBackend(
    commands,
    blocking_client=relays,
    settings=StreamSettings(prefix="myapp:sse", stream_bucket_count=4),
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with commands, relays, backend:
        yield


app = FastAPI(lifespan=lifespan)
add_redis_streams(app, backend=backend, manage_lifespan=False)
```

Register before startup so FastAPI installs the dependencies and error handlers. With `manage_lifespan=False`, your lifespan starts and stops the backend. It stops before the clients close.

Alternatively, `add_redis_streams(app, backend=backend)` manages the backend around the existing application lifespan. In that mode, supplied clients must remain usable until backend shutdown. Registration never closes your clients. Give the backend exactly one lifecycle owner.

Use independent pools connected to the same primary database with matching credentials and topology. The blocking pool needs at least one connection per configured bucket; Cluster pool limits apply per node. Set its socket timeout above `stream_block_ms`, which defaults to 1,000 milliseconds. Command and replay connections are additional.

Configure credentials, Transport Layer Security (TLS), pools, and timeouts on your Redis clients. Explicit `StreamSettings` does not read `REDIS_*` variables or `.env` files, or configure other Iris clients.

## Authorize the streaming endpoint

Authenticate the caller and authorize the resource before accessing its stream. Neither `sse_response()` nor `StreamBackendDep` performs those checks.

Add this endpoint to the application. `require_job_access` is your application dependency: it verifies the caller, loads the requested job in their tenant, checks access, and returns the job with its unique event-stream identity.

```python
from fastapi import Depends, Request
from fastapi.responses import StreamingResponse
from redis_iris.agent_mesh.fastapi_sse import StreamBackendDep, sse_response

from myapp.auth import require_job_access


@app.get(
    "/jobs/{job_id}/events",
    response_class=StreamingResponse,
    responses={200: {"content": {"text/event-stream": {}}}},
)
async def job_events(
    request: Request,
    streams: StreamBackendDep,
    job=Depends(require_job_access),
):
    return await sse_response(request, backend=streams, stream=job.event_stream_id)
```

Authorization runs on every reconnect. Stream IDs and cursors grant no access. Keep credentials out of URLs.

Same-origin applications with cookie authentication can use native `EventSource`. Bearer-authenticated clients need a fetch-based SSE client or another client that supports authorization headers. You can pass `expires_at` to `sse_response()` using a timezone-aware deadline derived from verified credentials. It bounds the connection lifetime and reauthorization delay; it does not provide immediate revocation.

## Publish progress and completion

Create the event log when accepting work, then publish from your application workflow or a separately managed worker. The following excerpt assumes your application has allocated unique `stream_id` and `job_id` values:

```python
await backend.create(stream_id, ttl=86400)
await backend.append(
    stream_id,
    event="job.progress",
    data={"percent": 50},
    producer="job-worker",
    idempotency_key=f"{job_id}:progress:50",
)
await backend.finish(
    stream_id,
    event="job.completed",
    data={"job_id": job_id},
    producer="job-worker",
    idempotency_key=f"{job_id}:completed",
)
```

`finish()` seals the log with a final event. Later appends fail. A matching finish retry returns the retained final cursor. Use a distinct retry identity for completion.

Keep producer and event identities stable across retries, with the same payload. Deduplication defaults to 24 hours and 10,000 IDs per producer, bounded by stream lifetime. It does not compare payloads or deduplicate external effects. A retry of a trimmed event can return its old cursor without restoring the payload.

Disconnecting a subscriber does not cancel the producer. The SDK does not schedule or restart jobs. Publisher-only workers can use `StreamBackend(client, settings=settings)` and call `await backend.initialize()` without starting a relay runtime. Workers and serving replicas must use the same prefix, bucket layout, serialization, and stream settings.

## Resume delivery

Stored events have Redis entry IDs. Save each cursor after applying its event. A reconnect with `Last-Event-ID` receives events strictly after that cursor. Native `EventSource` resends its last ID on automatic reconnects; for a newly created connection, supply your saved cursor, for example with the `after` query parameter.

Cursor selection is explicit `sse_response(after=...)`, then `Last-Event-ID`, then query `after`, then `0-0`. Every supplied value is validated, even when another takes precedence. Empty, duplicate, malformed, special Redis, or future cursors fail.

A reconnect after the final event returns HTTP 204. Stop reconnecting once completion is established. An ended connection alone does not prove the job completed.

## Recover when history is unavailable

Redis retains a delivery window, not your application's permanent state. If a client misses more history than the log retains, replay cannot reconstruct the missing changes.

Provide an authenticated application endpoint that returns current job state together with a matching event cursor. On recovery, the client replaces its local state with that result, saves its cursor, and resumes after it. Ensure the state and cursor describe the same point in the job's progress; otherwise updates can be skipped or applied twice.

If the old log has expired, your application decides whether to return a completed result or establish a new delivery window with a new stream identity. Do not silently jump to the retained tail of the old stream.

Before streaming headers are sent, registered handlers return errors with a stable `detail.code`:

| HTTP status | Code or condition | Client action |
| --- | --- | --- |
| 404 | `stream_not_found` | Retrieve application state; the stream is unknown. |
| 410 | `stream_expired` | Retrieve application state; the delivery window expired. |
| 409 | `history_unavailable` | Reload state with a matching cursor. |
| 409 | `cursor_ahead` | Reconcile state and cursor; do not retry the same cursor blindly. |
| 409 | `stream_conflict` | Resolve the lifecycle conflict. |
| 422 | `invalid_stream_request` | Correct the request. |
| 503 | `stream_capacity_exceeded` or `stream_unavailable` | Retry with backoff, preserving the last applied cursor. |
| 204 | Final event already consumed | Stop reconnecting. |

Your authentication dependencies retain their own status and challenge headers.

After headers, recoverable failures send a `redis.stream.control` event when possible, then close. Follow its `action`: `reload`, `reconnect`, or `reauthenticate`. Control frames and keepalives have no event ID and must not advance the cursor. A broken socket might receive no control frame. Native `EventSource` cannot inspect initial error bodies; use your application state endpoint or a fetch-based client for recovery.

## Configure retention and resources

`create(stream_id, ttl=...)` sets an absolute expiration. Reads, writes, and creation retries do not extend it. After payload expiry, content-free metadata recognizes expiry for a further window; after metadata expiry, the stream is unknown. Allocate unique stream identities across tenants and delivery lifetimes.

Pass settings as lowercase fields on `StreamSettings`:

| Setting | Default | Purpose |
| --- | --- | --- |
| `prefix` | Set explicitly in the example | Isolate a storage namespace; do not include braces. |
| `stream_bucket_count` | 16 | Fixed placement layout for the namespace. |
| `stream_max_event_bytes` | 65,536 | Maximum encoded storage bytes per event. |
| `stream_max_events` | 10,000 | Retained application events. |
| `stream_idmp_duration` / `stream_idmp_maxsize` | 86,400 seconds / 10,000 | Deduplication window and IDs per producer. |
| `stream_expiry_recognition` | 86,400 seconds | Expired-stream recognition window. |
| `stream_max_duration` / `stream_keepalive` | 300 / 15 seconds | Connection lifetime and keepalive interval. |
| `stream_queue_events` / `stream_queue_bytes` | 256 / 1,048,576 | Per-subscriber queue bounds. |
| `stream_max_subscribers` / `stream_max_active_streams` | 1,000 / 256 | Per-process admission bounds. |
| `stream_block_ms` | 1,000 | Blocking read interval in milliseconds. |

Do not change the persisted bucket layout in place. Use a new namespace for a different layout. Delivery uses one blocking reader per active bucket per process, with bounded subscriber queues and replay admission. Slow consumers can be disconnected and must recover with their saved cursor.

| Public API | Use it to |
| --- | --- |
| `StreamBackend` | Create, append, finish, replay, and follow event logs. |
| `StreamSettings` | Configure explicit storage and delivery limits. |
| `StreamEvent` | Read an event's `id`, `event`, `data`, and `final` metadata. |
| `StreamBackendDep`, `get_stream_backend` | Access the registered backend from FastAPI. |
| `add_redis_streams` | Register dependencies, error handlers, and optional lifespan management. |
| `sse_response` | Prepare replay and live delivery after application authorization. |

Catch the exported `StreamError` subclasses for direct backend calls, including `StreamNotFound`, `StreamExpired`, `StreamConflict`, `StreamHistoryUnavailable`, `StreamCursorAhead`, `StreamCapacityExceeded`, `StreamSlowConsumer`, and `InvalidStreamRequest`. The registered HTTP handlers provide the client responses described in [recovery](/content/develop/ai/context-engine/agent-mesh/fastapi-sse-sdk.md#recover-when-history-is-unavailable).

See the [SDK reference](https://github.com/redis/redis-iris/blob/main/docs/core/agent-mesh-sse.md) for the complete export inventory and upstream API documentation, and the [preview limits](/content/develop/ai/context-engine/agent-mesh/_index.md#requirements-and-limits) for deployment qualification.
