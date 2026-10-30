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
For an existing agent, use the [agent SDK recipes](#agent-sdk-recipes).

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

## Agent SDK recipes

Connect an existing agent to resumable server-sent events (SSE) by translating
its asynchronous events into `StreamWriter` calls. Choose one recipe for the
OpenAI Agents SDK, PydanticAI, Google Agent Development Kit (ADK), or LangGraph.
The agent framework stays responsible for tools, model credentials, and
conversation state. Iris carries one turn's events.

Install `redis-iris[fastapi-sse]` and your chosen framework with its model-provider
dependencies. These recipes adapt the
[upstream agent recipes](https://github.com/redis/fastapi-redis-sdk/blob/99b27df0f2b5100d4a4ac04762b004f2aeef986b/docs/guide/streams.md#agent-sdk-recipes),
which target `openai-agents` 0.24, `pydantic-ai-slim` 2.54, `google-adk` 2.7,
and `langgraph` 1.2 with `langchain-core` 1.7. Check event types when upgrading.
Each snippet takes your configured agent, runner, or compiled graph as an
argument; it does not configure a model or create a conversation store.

### Use a shared event format

The four recipes publish the same application event types:

| Type | Data | Write method |
| --- | --- | --- |
| `delta` | `{"text": ...}` | `append()` |
| `tool_call` | `{"id": ..., "name": ..., "args": ...}` | `append()` |
| `tool_result` | `{"id": ..., "output": ...}` | `append()` |
| `message` | `{"text": ...}`, the completed answer | `finish()` |
| `turn.interrupted` | `{"interrupts": [...]}`, an approval or input request | `finish()` |

Append `delta` text in the browser. Use the final `message` to set the completed
answer; appending it would duplicate the streamed text. The LangGraph recipe
also demonstrates `turn.interrupted`.

Map only the fields your interface needs. Whole framework events can contain
agents, tools, or conversation history that cannot be encoded or exceed
`stream_max_event_bytes`. Summarize large tool results. The default payload
coder accepts Pydantic models and dataclasses, but the output still must fit
the event limit. Tool arguments and results can contain sensitive data; publish
only what the authorized reader should see.

### Start and serve a turn

Configure your FastAPI application as described in
[Configure the application](#configure-the-application). Save your chosen
`run_turn` recipe in your application's `myapp.streaming` module. For OpenAI
Agents or PydanticAI, start it from an authorized route like this:

```python
from fastapi import Depends
from pydantic import BaseModel
from redis_iris.agent_mesh.fastapi_sse import StreamBackendDep

from myapp.agent import agent
from myapp.auth import require_job_access
from myapp.streaming import run_turn


class Prompt(BaseModel):
    text: str


@app.post("/jobs/{job_id}/runs", status_code=202)
async def start_turn(
    body: Prompt,
    streams: StreamBackendDep,
    job=Depends(require_job_access),
):
    producer = run_turn(body.text, agent=agent)
    writer = await streams.start(
        producer,
        scope=f"tenant:{job.tenant_id}:job:{job.id}",
        stream_id=job.run_id,
    )
    return {"stream_id": writer.stream_id}
```

`myapp.agent` supplies your configured agent. `require_job_access` is your own
authentication and authorization dependency, as in
[Authorize scoped runs](#authorize-scoped-runs). It returns the authorized job
and its application-assigned run ID. Reuse that ID for retries of the same turn;
assign a new ID for a new turn. For ADK and LangGraph, replace the `producer`
assignment with the call shown in their recipe.

Serve the run using the existing `job_events` route. Authorize cancellation
through the same dependency:

```python
@app.post("/jobs/{job_id}/runs/cancel", status_code=204)
async def cancel_turn(
    streams: StreamBackendDep,
    job=Depends(require_job_access),
) -> None:
    await streams.cancel(
        job.run_id, scope=f"tenant:{job.tenant_id}:job:{job.id}"
    )
```

Disconnecting a reader leaves the producer running. With the SDK revision used
by these recipes, cancellation in the producer's process cancels the task and
reaches its awaited model call or tool. A cancellation handled by another
process ends delivery to readers but does not stop that producer or its model
spend. Do not catch and suppress task cancellation in your producer.

If the SDK raises, the backend ends the stream with
`{"reason": "error", "code": "producer_error"}` instead of exposing exception
text. A string `code` attribute on the exception overrides `producer_error`.
Keep conversation history in the framework's session or checkpoint store;
replaying SSE events does not resume agent computation.

### OpenAI Agents SDK

Pass your configured `agents.Agent` as `agent`. Text deltas come from raw
Responses API events; tool calls and results come from run-item events.

```python
import json

from agents import Runner
from openai.types.responses import ResponseTextDeltaEvent
from redis_iris.agent_mesh.fastapi_sse import StreamWriter


def run_turn(prompt: str, *, agent):
    async def produce(writer: StreamWriter) -> None:
        result = Runner.run_streamed(agent, prompt)
        async for event in result.stream_events():
            if event.type == "raw_response_event":
                if isinstance(event.data, ResponseTextDeltaEvent):
                    await writer.append("delta", {"text": event.data.delta})
            elif event.type == "run_item_stream_event":
                if event.name == "tool_called":
                    call = event.item.raw_item
                    await writer.append("tool_call", {
                        "id": call.call_id,
                        "name": call.name,
                        "args": json.loads(call.arguments or "{}"),
                    })
                elif event.name == "tool_output":
                    await writer.append("tool_result", {
                        "id": event.item.raw_item["call_id"],
                        "output": event.item.output,
                    })
        await writer.finish("message", {"text": str(result.final_output)})

    return produce
```

Read `final_output` after consuming `stream_events()`. This recipe handles turns
without tool approvals. If your tools require approval, handle
`result.interruptions` before writing the final `message`, as described in
[Handle human input](#handle-human-input).

### PydanticAI

Pass your configured `pydantic_ai.Agent` as `agent`. Consume both the initial text
part and subsequent text deltas so the first chunk is preserved.

```python
from pydantic_ai import (
    AgentRunResultEvent, FunctionToolCallEvent, FunctionToolResultEvent,
    PartDeltaEvent, PartStartEvent, TextPart, TextPartDelta,
)
from redis_iris.agent_mesh.fastapi_sse import StreamWriter


def run_turn(prompt: str, *, agent):
    async def produce(writer: StreamWriter) -> None:
        async with agent.run_stream_events(prompt) as events:
            async for event in events:
                if isinstance(event, PartStartEvent) and isinstance(event.part, TextPart):
                    if event.part.content:
                        await writer.append("delta", {"text": event.part.content})
                elif isinstance(event, PartDeltaEvent) and isinstance(event.delta, TextPartDelta):
                    await writer.append("delta", {"text": event.delta.content_delta})
                elif isinstance(event, FunctionToolCallEvent):
                    await writer.append("tool_call", {
                        "id": event.part.tool_call_id,
                        "name": event.part.tool_name,
                        "args": event.part.args_as_dict(),
                    })
                elif isinstance(event, FunctionToolResultEvent):
                    await writer.append("tool_result", {
                        "id": event.part.tool_call_id,
                        "output": event.part.content,
                    })
                elif isinstance(event, AgentRunResultEvent):
                    await writer.finish("message", {"text": event.result.output})

    return produce
```

Use `async with` for `run_stream_events()` so leaving the loop closes the run.
Publish only the result output, rather than its whole message history. This
recipe assumes tools finish within the turn; deferred-tool output needs the
[human-input pattern](#handle-human-input).

### Google ADK

Pass your configured ADK `Runner` as `runner`. Its session must exist before the
producer starts. Resolve `user_id` and `session_id` from authorized application
state, and create or load that session through your session service.

```python
from google.adk.agents.run_config import RunConfig, StreamingMode
from google.genai import types
from redis_iris.agent_mesh.fastapi_sse import StreamWriter


def run_turn(prompt: str, *, runner, user_id: str, session_id: str):
    async def produce(writer: StreamWriter) -> None:
        message = types.Content(role="user", parts=[types.Part(text=prompt)])
        config = RunConfig(streaming_mode=StreamingMode.SSE)
        answer = ""
        async for event in runner.run_async(user_id=user_id, session_id=session_id,
                                            new_message=message, run_config=config):
            if event.partial:
                # A chunk of the answer.  The final, non-partial event repeats
                # the whole text, so only chunks become deltas.
                parts = event.content.parts if event.content else None
                for part in parts or []:
                    if part.text and not part.thought:
                        await writer.append("delta", {"text": part.text})
                continue
            for call in event.get_function_calls():
                await writer.append("tool_call",
                                    {"id": call.id, "name": call.name, "args": call.args})
            for response in event.get_function_responses():
                await writer.append("tool_result",
                                    {"id": response.id, "output": response.response})
            if event.is_final_response() and event.content and event.content.parts:
                answer = "".join(part.text or "" for part in event.content.parts
                                 if not part.thought)
        await writer.finish("message", {"text": answer})

    return produce
```

Use this producer assignment in the start route, with your application-owned
runner and the authorized ADK user and session identifiers:

```python
producer = run_turn(
    body.text, runner=runner, user_id=user_id, session_id=session_id
)
```

`StreamingMode.SSE` enables partial text events. The final non-partial event
repeats the answer, so it becomes the final `message`, not another delta. The
recipe excludes thought parts from the browser output. Long-running tools that
wait for a person need the [human-input pattern](#handle-human-input).

### LangGraph

Pass a compiled graph with a checkpointer as `graph`. This recipe expects graph
state with a `messages` key and message-bearing node updates. It uses `messages`
for text deltas and `updates` for tool calls, tool results, and interrupts.

```python
from langchain_core.messages import AIMessage, AIMessageChunk, ToolMessage
from redis_iris.agent_mesh.fastapi_sse import StreamWriter


def run_turn(inputs, *, graph, config):
    async def produce(writer: StreamWriter) -> None:
        answer = ""
        async for mode, chunk in graph.astream(inputs, config,
                                               stream_mode=["messages", "updates"]):
            if mode == "messages":
                message, _metadata = chunk
                if isinstance(message, AIMessageChunk) and message.text:
                    await writer.append("delta", {"text": message.text})
                continue
            if "__interrupt__" in chunk:
                # The graph waits for a person.  End this turn; the answer
                # resumes the graph as a new turn, on a new stream.
                interrupts = [item.value for item in chunk["__interrupt__"]]
                await writer.finish("turn.interrupted", {"interrupts": interrupts})
                return
            for update in chunk.values():
                for message in (update or {}).get("messages", []):
                    if isinstance(message, ToolMessage):
                        await writer.append("tool_result", {
                            "id": message.tool_call_id, "output": message.content})
                    elif isinstance(message, AIMessage) and message.tool_calls:
                        for call in message.tool_calls:
                            await writer.append("tool_call", {
                                "id": call["id"], "name": call["name"],
                                "args": call["args"]})
                    elif isinstance(message, AIMessage):
                        answer = message.text
        await writer.finish("message", {"text": answer})

    return produce
```

For a new turn, use an application-authorized checkpoint thread ID:

```python
thread = {"configurable": {"thread_id": checkpoint_thread_id}}
producer = run_turn(
    {"messages": [("user", body.text)]}, graph=graph, config=thread
)
```

After an interrupt, start a new stream with a new run ID and the same checkpoint
thread. Validate and authorize the answer before resuming:

```python
from langgraph.types import Command

producer = run_turn(Command(resume=answer), graph=graph, config=thread)
```

`message.text` joins text blocks for providers that return structured content.
Avoid the `values` stream mode here; it sends the whole state after every step.
Keep checkpoint storage and access isolation in your application.

### Handle human input

When an agent pauses for approval or an answer, finish the current stream with
`writer.finish("turn.interrupted", ...)`. Publish only the approval fields the
reader needs, and persist resumable framework state in the session or checkpoint
store. After authorized input arrives, resume through the framework and start
a new stream with a new run ID.

The LangGraph recipe implements this for `__interrupt__` updates. For OpenAI
Agents SDK interruptions, PydanticAI deferred tools, and ADK long-running tools,
add the corresponding framework-specific state and approval handling before
using these recipes with those features. Do not serialize whole framework
objects as the interruption payload.

These recipes use asynchronous producers in the FastAPI process. They do not
add synchronous producers, external durable workers, or automatic computation
restart after deployment.

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
[beta limits](/content/develop/ai/context-engine/agent-mesh/_index.md#requirements-and-limits)
for deployment qualification.
