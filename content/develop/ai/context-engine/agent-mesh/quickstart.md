---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Create your first resumable event stream with A2A or FastAPI.
hideListLinks: true
linktitle: Quickstart
title: Get started with Agent Mesh
weight: 10
---

Choose one browser demo: reconnect to Agent2Agent (A2A) task updates, or resume application-defined server-sent events (SSE) with FastAPI. Neither example needs a model account.

## Before you begin

You need Python 3.11 or later, `pip`, a browser, and a Redis database running version 8.6 or later with native producer idempotency (`XADD IDMP`). The demo application runs locally on port 8000, whichever database option you choose.

## Choose your Redis database

Choose Redis Cloud or a local instance, then set `REDIS_URL` in the terminal where you will run the demo application. Both examples use this connection value.

{{< multitabs id="agent-mesh-redis" tab1="Redis Cloud" tab2="Local Redis" >}}

1. Use a dedicated Redis Cloud database running Redis 8.6 or later. See [Create a database](/content/operate/rc/databases/create-database/_index.md) and [supported database versions](/content/operate/rc/databases/version-management/_index.md#supported-database-versions).
1. [Enable Transport Layer Security (TLS)](/content/operate/rc/security/database-security/tls-ssl.md#enable-tls) and download the server certificate bundle. Get your database endpoint, username, and password from the [connection guide](/content/operate/rc/databases/connect/_index.md).
1. Set the connection URL in your application terminal:

   ```bash
   export REDIS_URL='rediss://<username>:<encoded-password>@<host>:<port>/0?ssl_ca_certs=<absolute-path-to-redis_ca.pem>'
   ```

Replace the placeholders with your database values and the certificate bundle's absolute path. Percent-encode special characters in the username, password, and certificate path; see [connection URLs](/content/develop/clients/connection-urls.md). Keep this URL out of source control and logs.

These are Redis database credentials. The local browser demo still needs no token or sign-in. Redis Cloud deployment and failure qualification remain separate from the [preview's tested coverage](/content/develop/ai/context-engine/agent-mesh/_index.md#requirements-and-limits).

-tab-sep-

You need a local `redis-server` executable, another terminal, and free port 6389.

1. Start disposable Redis in that other terminal:

   ```bash
   redis-server --bind 127.0.0.1 --port 6389 --save '' --appendonly no
   ```

   Leave it running. If the port is in use, stop rather than reusing an existing database. Persistence is disabled for this local example.

1. Set the connection URL in your application terminal:

   ```bash
   export REDIS_URL='redis://127.0.0.1:6389/0'
   ```

{{< /multitabs >}}

Continue in the application terminal so that the demo can read `REDIS_URL` from its environment. If you open a new terminal to try the other example, set `REDIS_URL` there too.

## Resume A2A task updates

A simulated agent produces twenty numbered updates, one per second. Disconnect the browser's subscription while the agent continues, then reconnect to receive the updates you missed.

### Install

In your application terminal, create an environment for the A2A example:

```bash
mkdir agent-mesh-a2a
cd agent-mesh-a2a
python3 -m venv .venv
source .venv/bin/activate
python -m pip install 'redis-iris[a2a]' 'a2a-sdk[http-server]>=1.2.3,<1.3' uvicorn
```

### Start the demo

1. Save both example files in your `agent-mesh-a2a` directory:

   - {{< download "Download a2a-demo.py" "../../../../../code/agent-mesh/a2a-demo.py" >}}
   - {{< download "Download a2a-demo.html" "../../../../../code/agent-mesh/a2a-demo.html" >}}

1. Run the application:

   ```bash
   python a2a-demo.py
   ```

1. Open <http://127.0.0.1:8000> in your browser.

This loopback-only example uses one fixed demo owner and needs no token or sign-in. In a deployed application, derive ownership from verified identity and authorize each task subscription.

### Disconnect and catch up

1. Select **Start task**. Numbered updates appear in the page.
1. After a few updates arrive, select **Disconnect**. The displayed update count stops.
1. Wait a few seconds, then select **Reconnect**. The missed updates arrive, followed by new updates as the agent continues.
1. Wait for **Complete — all 20 updates received**.

The task keeps running while the subscription is disconnected. The page remembers the last applied event cursor and reconnects with `?after=` to receive retained updates after that cursor. Expand **What is being resumed?** to see the task ID and saved cursor.

The page uses the browser's built-in `EventSource` client. It does not restart the task on reconnect. Replay requires retained Redis history; it does not restart interrupted agent execution.

### Connect the A2A handler to Redis

The downloaded application defines `CountingAgent`, its streaming agent card, and the Redis client. These are the integration points:

```python
from a2a.server.request_handlers import DefaultRequestHandler
from redis_iris.agent_mesh.a2a import RedisTaskStore
from redis_iris.agent_mesh.a2a.routes import create_resumable_rest_routes

store = RedisTaskStore(
    redis,
    namespace="quickstart:a2a-browser",
    owner_resolver=lambda context: "local-demo-user",  # Loopback demo only.
)
events = store.event_stream()
handler = DefaultRequestHandler(
    agent_executor=store.heartbeat(CountingAgent()),
    agent_card=card,
    task_store=store,
    event_stream=events,
)
routes = create_resumable_rest_routes(handler, store=store, event_stream=events)
```

`RedisTaskStore` saves the task and its updates together. Its paired event stream reads those updates from Redis. `create_resumable_rest_routes()` exposes subscriptions with event cursors. The agent card enables streaming and advertises `resumable_streams_extension()`.

On reconnect, the browser uses the same task ID and the last cursor it applied:

```javascript
new EventSource(`/tasks/${taskId}:subscribe?after=${encodeURIComponent(cursor)}`);
```

The request resumes event delivery for the existing task; it does not submit the work again.

Stop the application with Control-C before trying the FastAPI example on the same port.

## Resume FastAPI events

A simulated travel agent plans a day in Rome. It publishes twenty progress events, one per second, then returns a sample itinerary. Disconnect while it works, then reconnect to catch up and receive the answer. The agent uses scripted steps, so you need no model account or live travel service. These are application-defined events, independent of A2A tasks.

### Install

In your application terminal, create an environment for the FastAPI example:

```bash
mkdir agent-mesh-sse
cd agent-mesh-sse
python3 -m venv .venv
source .venv/bin/activate
python -m pip install 'redis-iris[fastapi-sse]' uvicorn
```

### Start the demo

1. Save both example files in your `agent-mesh-sse` directory:

   - {{< download "Download fastapi-sse-demo.py" "../../../../../code/agent-mesh/fastapi-sse-demo.py" >}}
   - {{< download "Download fastapi-sse-demo.html" "../../../../../code/agent-mesh/fastapi-sse-demo.html" >}}

1. Run the application:

   ```bash
   python fastapi-sse-demo.py
   ```

1. Open <http://127.0.0.1:8000> in your browser.

This loopback-only example uses one fixed demo owner and needs no token or sign-in. In a deployed application, authenticate callers and authorize access to each job's events.

### Disconnect and catch up

1. Select **Start agent**. Progress messages show the agent preparing its itinerary.
1. After a few events arrive, select **Disconnect**. The displayed event count stops.
1. Wait a few seconds, then select **Reconnect**. The missed events arrive, followed by new events as the agent continues.
1. Wait for **Complete — all 20 events received** and the agent’s sample itinerary.

The page saves its event cursor and reconnects to the same agent run’s event stream. Expand **What is being resumed?** to see the run’s job ID and saved cursor. Your application runs the agent independently of the subscription; reconnecting does not start it again.

### Publish and serve resumable events

The downloaded application owns its Redis clients, startup, and simulated agent execution. Its streaming backend uses separate command and relay clients:

```python
from redis_iris.agent_mesh.fastapi_sse import StreamBackend, StreamSettings

backend = StreamBackend(
    commands, blocking_client=relays,
    settings=StreamSettings(prefix="quickstart:sse-browser", stream_bucket_count=2),
)
```

Create a log when starting the agent, append its progress messages, and finish with its answer:

```python
await backend.create(stream, ttl=3600)
await backend.append(
    stream, event="progress", data={"number": number, "message": message},
    producer="demo", idempotency_key=f"progress-{number}",
)
await backend.finish(
    stream, event="completed", data={"count": len(AGENT_STEPS), "answer": AGENT_ANSWER},
    producer="demo", idempotency_key="completed",
)
```

The event endpoint uses `sse_response()` to serve both retained and live events:

```python
from redis_iris.agent_mesh.fastapi_sse import StreamBackendDep, sse_response

@app.get("/jobs/{job_id}/events", response_class=StreamingResponse)
async def events(job_id: UUID, request: Request, streams: StreamBackendDep):
    job = get_job(job_id)
    return await sse_response(request, backend=streams, stream=job["stream"])
```

The browser's built-in `EventSource` reconnects with the last applied cursor. This demo retains each log for one hour. Replay requires retained history, and event delivery does not restart interrupted job execution.

## When you're done

Stop the demo application with Control-C. If you started local Redis for this example, stop it with Control-C too.

Stopping the app leaves a Redis Cloud database running. If you created a disposable database and no longer need it, see [Delete a database](/content/operate/rc/databases/delete-database.md).

## Further reading

To add these integrations to your application, follow the [A2A SDK guide](/content/develop/ai/context-engine/agent-mesh/a2a-sdk.md) or [FastAPI SSE SDK guide](/content/develop/ai/context-engine/agent-mesh/fastapi-sse-sdk.md). See the [Agent Mesh limitations](/content/develop/ai/context-engine/agent-mesh/_index.md#requirements-and-limits) for preview qualification.
