---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Create resumable event streams with Agent Mesh through A2A or FastAPI.
hideListLinks: true
linktitle: Agent Mesh
title: Redis Agent Mesh
weight: 40
bannerText: Redis Agent Mesh is currently in beta. Features and behavior are subject to change.
bannerChildren: true
---

## What is Redis Agent Mesh?
Redis Agent Mesh provides resumable event streams on top of Redis. Your application keeps producing events when a client disconnects. When the client reconnects, it can receive retained updates after its last event cursor.

The Agent Mesh software development kit (SDK) offers two Python integration paths: Agent2Agent (A2A) task updates through the official A2A Python SDK, and server-sent events (SSE) through FastAPI. Both are available in the `redis-iris` Python distribution. Your application supplies agent execution and authentication. A2A accepts application-owned Redis clients; the FastAPI integration uses SDK-managed pools and producer lifecycle.

<div class="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
  {{< tile-card icon="images/dev/icons/icon-redis-code-64-duotone.png" title="Quickstart" description="Create your first resumable event stream with A2A or FastAPI" url="/develop/ai/context-engine/agent-mesh/quickstart" >}}
</div>

## Why use resumable event streams?

An agent response can take seconds or minutes as it calls tools, waits for results, and prepares an answer. If the user's connection drops halfway through, they need a way to catch up and receive the result without submitting the request again.

Resumable streams let you:

- **Show progress throughout the work.** Deliver progress updates, tool results, and completed output as your application produces them.
- **Reconnect to the same work.** The application can keep publishing while the client is disconnected. The client returns with its saved cursor to receive retained updates it missed and follow new ones.
- **Resume through another serving replica.** Redis gives replicas a shared event log. Replicas with the same Redis configuration and access policy can serve a reconnecting client, independently of which process produced the events.

Resumption recovers event delivery. Your application remains responsible for restarting work if the process executing it stops.

## Choose an integration

| Integration | Use it to | Python module | Install with |
| --- | --- | --- | --- |
| A2A server | Resume retained task updates after reconnecting, including through another server replica | `redis_iris.agent_mesh.a2a` | `pip install 'redis-iris[a2a]'` |
| FastAPI event streaming | Publish an event log and replay retained server-sent events (SSE) after reconnecting | `redis_iris.agent_mesh.fastapi_sse` | `pip install 'redis-iris[fastapi-sse]'` |

These integrations are independent. Install the integration you use, or install both in one Python environment with `pip install 'redis-iris[a2a,fastapi-sse]'`. Using both selects redis-py `>=8.0.1,<9`. This is the Python client version. Both require Redis server 8.6.2+; A2A also requires JavaScript Object Notation (JSON) support.

## How it works

Both integrations retain events in Redis and give clients cursors for resuming delivery. Clients reconnect with their last event cursor to receive retained updates.

For A2A, connect `RedisTaskStore` and its paired event stream to the official SDK's request handler, and expose the resumable routes. The integration also stores Task snapshots alongside their updates. Replicas using the same database, namespace, and ownership policy can serve the subscriptions.

For FastAPI, configure `FastAPIRedis(app).lifespan().streams()`, publish scoped run events through a `StreamWriter`, and serve them with `backend.sse()`. Event production is independent of client connections.

## Requirements and limits

- Both integrations require Python 3.11 or later and native producer idempotency (`XADD IDMP`). Both require Redis 8.6.2+; A2A also requires JSON support. The A2A integration targets the official A2A Python SDK 1.2.x.
- Derive ownership from verified identity. Task IDs and cursors grant no access; authorize requests and reconnections in your application.
- Retention bounds replay. A2A can fall back to the current snapshot when event history is unavailable. If events are no longer retained, a FastAPI application must provide another way for clients to retrieve the current state.
- Your application owns execution and Redis durability. Stored tasks do not restart interrupted computation or guarantee exactly-once external effects.
- Standalone Redis and normal A2A operation on a three-primary Redis Open Source Cluster have local validation evidence. Cloud, Enterprise, failover recovery, and sustained capacity remain unqualified for this beta.

## Get started

Follow the [quickstart](/content/develop/ai/context-engine/agent-mesh/quickstart.md) to [resume A2A task updates](/content/develop/ai/context-engine/agent-mesh/quickstart.md#resume-a2a-task-updates) or [resume FastAPI events](/content/develop/ai/context-engine/agent-mesh/quickstart.md#resume-fastapi-events).

To integrate with your application, follow the [A2A SDK guide](/content/develop/ai/context-engine/agent-mesh/a2a-sdk.md) or [FastAPI SSE SDK guide](/content/develop/ai/context-engine/agent-mesh/fastapi-sse-sdk.md). These guides cover configuration, authorization, replay, and recovery.
