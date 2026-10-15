---
Title: Self-managed Redis Agent Memory
alwaysopen: false
categories:
- docs
- operate
- iris
description: Deploy, configure, secure, and operate Redis Agent Memory on a self-managed Kubernetes cluster.
linkTitle: Self-managed
weight: 40
hideListLinks: true
bannerText: Redis Agent Memory self-managed is currently in private preview and subject to change. A license key is required to deploy. Contact your Redis representative or [contact sales](https://redis.io/contact/).
bannerChildren: true
aliases:
- /develop/ai/context-engine/agent-memory/self-managed/
---

Redis Agent Memory provides persistent memory for AI agents and
applications. Applications write conversation events and long-term memories to
Redis Agent Memory, then query Redis Agent Memory for relevant context before calling an LLM.

This guide covers deployment, configuration, security, validation, API examples,
and operations for self-managed Redis Agent Memory. To install, start with
[Prerequisites](/content/operate/iris/agent-memory/self-managed/prerequisites.md), then follow
[Deploy](/content/operate/iris/agent-memory/self-managed/deploy.md).

The [Redis Agent Memory API]({{< relref "/develop/ai/context-engine/agent-memory/api-reference" >}})
is the shared Data Plane API for Redis Cloud and self-managed deployments. The
[Control Plane API reference]({{< relref "/operate/iris/agent-memory/self-managed/control-plane-api-reference" >}})
documents the self-managed admin endpoints for stores.

## What you are deploying

The chart always deploys the Data Plane, the workers, the Control Plane, and the Identity Service.
You provide the Redis databases.

| Component | Purpose | Default service |
| --- | --- | --- |
| Redis Agent Memory Data Plane | Store-scoped runtime memory API. | `redis-agent-memory:9000` |
| Redis Agent Memory worker | Background promotion, summarization, and forgetting work. | No public service |
| Redis Agent Memory Control Plane | Admin API for creating and managing stores. | `redis-agent-memory-controlplane:9100` |
| Identity Service | Mints, rotates, revokes, and checks agent keys. | `redis-agent-memory-identity-service:9200` |
| Store Redis | Holds session memory, long-term memory, indexes, and TTL data. | Customer-provided |
| Job Redis | Holds background work for Redis Agent Memory workers. | Customer-provided |
| Metadata Redis | Holds Control Plane store records. The Identity Service keeps agent-key records in the Metadata Redis named in its own metadata Secret. | Customer-provided |

### How the components work together

The Data Plane handles runtime memory requests. The Control Plane handles store administration,
and the Identity Service handles agent keys.

| Flow | Caller | Service | Backing Redis |
| --- | --- | --- | --- |
| Store administration | Platform admin | Redis Agent Memory Control Plane | Metadata Redis |
| Agent-key administration | Platform admin | Identity Service | Identity Service Metadata Redis |
| Runtime memory requests | Agent, app, or gateway | Redis Agent Memory Data Plane | Store Redis |
| Background memory processing | Redis Agent Memory worker | Redis Agent Memory Data Plane | Job Redis and Store Redis |

1. Platform admins create stores with the Control Plane and mint agent keys with the Identity Service.
1. The Control Plane keeps store records in Metadata Redis. The Identity Service keeps agent-key
   records in its own Metadata Redis.
1. Agents and applications call the Data Plane with a store ID and an agent key.
1. The Data Plane checks each agent key by calling the Identity Service, then reads or writes memory
   in Store Redis.
1. Workers use Job Redis for background work and write generated memory to Store Redis.

### API surfaces

All Data Plane APIs except `/health` are scoped to a store. A store is the logical isolation
boundary for memory data.

When agent-key authentication is enabled, the grants on each agent key determine which stores and
actions the key can access.

| API surface | Endpoint prefix | Purpose |
| --- | --- | --- |
| Session memory | `/v1/stores/{storeId}/session-memory` | Ordered conversation events, session metadata, and session lifecycle operations. |
| Long-term memory | `/v1/stores/{storeId}/long-term-memory` | Searchable facts, preferences, summaries, and custom memory records. |
| Namespaces | `/v1/stores/{storeId}/namespaces` | Namespace resources within a store. |
| Model Context Protocol (MCP) | `/v1/stores/{storeId}/mcp` | The MCP streamable-HTTP endpoint for a store. |
| Store health | `/v1/stores/{storeId}/health` | Read-only health for store-scoped features. |
| Service health | `/health` | Operational status of the Data Plane. |
| Control Plane | `/v1/stores`, `/v1/detectors` | Self-managed administration for stores, and the catalog of built-in sensitive-data detectors. |
| Identity Service | `/v1/api-keys` | Self-managed administration for agent keys. |

Session memory keeps conversation continuity within a session. Long-term memory
provides searchable context across sessions.

Long-term memory `memoryType` is an open identifier. When omitted on create,
Redis Agent Memory stores the record as `semantic`; built-in names include `semantic`,
`episodic`, `message`, and `session_summary_view`.
