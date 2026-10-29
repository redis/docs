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

Use the Agent Mesh software development kit (SDK) to run a producer independently
of its client connection. FastAPI clients reconnect with a saved cursor to replay
retained server-sent events (SSE), then follow new events from the same run.

Start with the [FastAPI browser demo](/content/develop/ai/context-engine/agent-mesh/quickstart.md#resume-fastapi-events).
This guide covers application setup, authorization, execution and recovery.

## Install the integration

Use Python 3.11 or later and Redis 8.6.2 or later with native producer idempotency
(`XADD IDMP`). Redis 8.6.6 or later is recommended by the upstream streaming guide.

```bash
pip install 'redis-iris[fastapi-sse]'
```

The independent A2A integration is optional. Install both with
`redis-iris[a2a,fastapi-sse]`; their shared redis-py range is `>=8.0.1,<9`.
See the [database setup](/content/develop/ai/context-engine/agent-mesh/quickstart.md#choose-your-redis-database)
for local Redis or Redis Cloud connections. Deployment qualification is separate
from configuring an endpoint.

## Configure the application

The facade re-exports the upstream FastAPI Redis SDK objects unchanged. Configure
its standard lifespan and streaming feature before application startup:

```python
from fastapi import FastAPI
from redis_iris.agent_mesh.fastapi_sse import FastAPIRedis

app = FastAPI()
FastAPIRedis(app).lifespan().streams()
```

Set `REDIS_URL` for the connection, including any Transport Layer Security (TLS)
parameters. Set `REDIS_PREFIX` for the namespace. The SDK creates and closes its
Redis pools and stops its in-process producers when the application shuts down.
Use its `REDIS_*` configuration and `.env` sources; settings are cached globally.
The integration does not accept injected clients, per-app settings or a separate
blocking-client argument.

Keep `REDIS_SOCKET_TIMEOUT` unset, or longer than
`REDIS_STREAM_HEARTBEAT_INTERVAL` (15 seconds by default), so blocking reads can
complete. Each live reader holds one connection from the shared pool. If you set
`REDIS_MAX_CONNECTIONS`, reserve capacity for readers plus writes and other
commands. There are no relay buckets or subscriber queues.

## Authorize scoped runs

A run is identified by a `scope` and `stream_id`. Choose a scope for the resource
you authorize, such as a tenant's chat or job. Multiple runs can share a scope;
your application tracks the current run and enforces any one-run-at-a-time policy.

Authenticate and authorize before passing the scope and run ID to the backend.
Neither `StreamBackendDep` nor `backend.sse()` performs application access checks.
The application dependency in this example verifies access to the job and returns
its authorized tenant and run identifiers:

```python
from fastapi import Depends, Request
from fastapi.responses import StreamingResponse
from redis_iris.agent_mesh.fastapi_sse import StreamBackendDep

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
    scope = f"tenant:{job.tenant_id}:job:{job.id}"
    return await streams.sse(job.run_id, request=request, scope=scope)
```

Authorize every reconnect. IDs and cursors grant no access. Scopes accept
letters, digits, underscores, periods, colons and hyphens; run IDs accept letters,
digits, underscores and hyphens. Keep credentials out of URLs.

Same-origin cookie authentication works with native `EventSource`. Bearer tokens
need a fetch-based SSE client or another client that accepts authorization
headers. Pass a timezone-aware verified credential deadline as `expires_at` to
`backend.sse()` to bound the open connection. This does not provide immediate
revocation.

## Start a producer and publish events

Supply an async producer that receives a `StreamWriter`:

```python
from redis_iris.agent_mesh.fastapi_sse import StreamWriter


async def run_job(writer: StreamWriter):
    result = await perform_job()
    await writer.append("job.progress", {"percent": 100})
    await writer.finish("job.completed", {"result": result})


# In your authorized start endpoint, with a StreamBackendDep named streams:
# scope and run_id come from the application's job record.
writer = await streams.start(run_job, scope=scope, stream_id=run_id)
```

`start()` opens the run and starts the producer only when it was newly created.
A repeated start with the same scope and retained ID returns a retry handle
without spawning a second producer. `writer.append(type, data)` and
`writer.finish(type, data)` return Redis entry IDs. Event types are application
names; the `stream.` prefix is reserved for SDK events.

For additional work between opening and spawning, use `await streams.open(...)`
and call `streams.spawn(writer, producer)` only when `writer.created` is true.
To read without HTTP, use
`async with await streams.follow(run_id, scope=scope, after=cursor)`.
Events expose `id`, `type`, `data` and `final` fields.

The SDK owns the producer task and generates its write-retry identities.
Applications cannot supply producer/event idempotency keys. Disconnecting a
reader leaves the task running. `cancel()` ends the run for readers and cancels
a producer in the same process. A producer in another process keeps running;
its later events are unread. Runs cannot be handed to another process or restart
after a process exit. Publisher-only external workers are not supported.

## Resume and recover

Save each event cursor after applying its update. Reconnect to the same scope
and run with `Last-Event-ID` or `?after=`. Selection order is explicit
`backend.sse(after=...)`, then the header, then the query, then the start of the
stream. Every supplied cursor is validated; repeated or malformed values fail.
A reconnect at the final cursor returns HTTP 204.

Retention bounds replay. Provide an authorized application endpoint returning
current state together with a matching cursor when clients need recovery.
Reload state when reconnecting returns HTTP 404 for an unknown or expired run,
or HTTP 410 for externally removed history.
A `stream.gap` event during delivery reports missing entries and the reader
continues; a client requiring complete history should recover application state.

Before headers, errors have the shape `{"detail": "...", "code": "..."}`.
Read the top-level `code` field:

| HTTP status | Code or condition | Client action |
| --- | --- | --- |
| 401 | `credential_expired` | Refresh verified credentials. |
| 404 | `stream_not_found` | Retrieve application state. |
| 410 | `stream_expired` | Reload state; entries were removed externally. |
| 409 | `cursor_ahead` | Reconcile application state and cursor. |
| 422 | `invalid_cursor`, `invalid_stream_name` | Correct the request. |
| 503 | `stream_unavailable`, `stream_unsupported`, or reader capacity | Retry transient failures with backoff; check server requirements for unsupported features. |
| 204 | Final event consumed | Stop reconnecting. |

Authentication dependencies retain their own status and challenge headers.
After headers, transient failures close the connection and clients reconnect.
Handle SDK events `stream.end` (including `error`, `cancelled` and
`producer_lost` outcomes) and `stream.error` (credential expiry or read-only
producer-loss reporting). Native
`EventSource` cannot inspect refused-connection bodies; use the application
state endpoint or a fetch-based client to explain failures.

## Configure retention

A run has a fixed lifetime from `open()`, bounded by `stream_max_run`. Nothing
extends it. Completion shortens remaining retention to at most `stream_done_ttl`.
Set `stream_max_run` for the longest expected run, up to 86,400 seconds.

A reader that sees no new entries for `stream_silence_timeout` ends the run with
a `producer_lost` final event. `spawn()` runs `writer.keepalive()` around the
producer, writing hidden pings during quiet work. An application-managed producer
can enter that context itself. Pings prevent silence detection but do not extend
the run's lifetime. A producer lost on a process exit is not restarted.

The SDK retains all events until the run expires. A writer that exceeds
`stream_maxlen` raises `ValueError` rather than trimming earlier events.

| Setting (prefix with `REDIS_`) | Default | Purpose |
| --- | --- | --- |
| `STREAM_MAX_RUN` | 3,600 seconds | Fixed run lifetime from creation. |
| `STREAM_DONE_TTL` | 120 seconds | Maximum remaining retention after completion. |
| `STREAM_MAXLEN` | 10,000 | Maximum events one writer can append. |
| `STREAM_MAX_EVENT_BYTES` | 65,536 | Largest encoded event. |
| `STREAM_HEARTBEAT_INTERVAL` | 15 seconds | SSE ping, blocking-read bound and keepalive check interval. |
| `STREAM_SILENCE_TIMEOUT` | 60 seconds | Silence before a reader ends a lost producer's run; must exceed twice the heartbeat interval. |
| `STREAM_MAX_READERS` | 256 | Live-reader admission per process. |
| `STREAM_REPLAY_PAGE` | 100 | Events per Redis read. |
| `STREAM_MAX_CONNECTION_DURATION` | 300 seconds | Connection cap before reconnect. |
| `STREAM_READ_RETRY_WINDOW` | 30 seconds | Retry window for transient read failures. |
| `STREAM_SEND_TIMEOUT` | 10 seconds | Bound for stalled sends. |

The demo sets `REDIS_STREAM_DONE_TTL=3600`; replay still ends at the run's
original lifetime. Application state in your own database has separate retention.

See the [SDK reference](https://github.com/redis/redis-iris/blob/main/docs/core/agent-mesh-sse.md)
for facade exports and upstream signatures, and the
[preview limits](/content/develop/ai/context-engine/agent-mesh/_index.md#requirements-and-limits)
for deployment qualification.
