---
Title: Self-managed Redis Agent Memory
alwaysopen: false
categories:
- docs
- develop
- ai
description: Deploy, configure, secure, and operate Redis Agent Memory on a self-managed Kubernetes cluster.
linkTitle: Self-managed Agent Memory
weight: 40
hideListLinks: true
---

Redis Agent Memory provides persistent memory for AI agents and
applications. Applications write conversation events and long-term memories to
Agent Memory, then query Agent Memory for relevant context before calling an LLM.

This guide covers deployment, configuration, security, validation, API examples,
and operations for self-managed Agent Memory.

The [Redis Agent Memory API]({{< relref "/develop/ai/context-engine/agent-memory/api-reference" >}})
is the shared Data Plane API for Redis Cloud and self-managed deployments. The
[Control Plane API reference]({{< relref "/develop/ai/context-engine/agent-memory/self-managed/control-plane-api-reference" >}})
documents the self-managed admin endpoints for stores and agent keys.

{{< note >}}
Self-managed Redis Agent Memory is available as a private preview. You need a
license key to deploy it. Contact your Redis representative or
[contact sales](https://redis.io/contact/).
{{< /note >}}

## What you are deploying

A standard self-managed Agent Memory deployment contains:

| Component | Purpose | Default service |
| --- | --- | --- |
| Agent Memory Data Plane | Store-scoped runtime memory API. | `redis-agent-memory:9000` |
| Agent Memory worker | Background promotion, summarization, and forgetting work. | No public service |
| Agent Memory Control Plane | Optional admin API for creating stores and managing agent keys. | `redis-agent-memory-controlplane:9100` |
| Store Redis | Holds session memory, long-term memory, indexes, and TTL data. | Customer-provided |
| Job Redis | Holds background work for Agent Memory workers. | Customer-provided |
| Metadata Redis | Holds Control Plane store records and agent-key records. | Required for Control Plane managed stores and agent keys |

### How the components work together

The Data Plane handles runtime memory requests. The optional Control Plane
handles store and agent-key administration.

| Flow | Caller | Service | Backing Redis |
| --- | --- | --- | --- |
| Store and key administration | Platform admin | Agent Memory Control Plane | Metadata Redis |
| Runtime memory requests | Agent, app, or gateway | Agent Memory Data Plane | Store Redis |
| Background memory processing | Agent Memory worker | Agent Memory Data Plane | Job Redis and Store Redis |

1. Platform admins use the Control Plane to create stores and agent keys.
1. The Control Plane stores store records and agent-key grants in Metadata Redis.
1. Agents and applications call the Data Plane with a store ID.
1. The Data Plane enforces the configured auth mode and reads or writes memory in Store Redis.
1. Workers use Job Redis for background work and write generated memory to Store Redis.

### API surfaces

All Data Plane APIs are scoped to a store. A store is the logical isolation
boundary for memory data.

When agent-key authentication is enabled, grants stored in Metadata Redis
determine which stores and actions each key can access.

| API surface | Endpoint prefix | Purpose |
| --- | --- | --- |
| Session memory | `/v1/stores/{storeId}/session-memory` | Ordered conversation events, session metadata, and session lifecycle operations. |
| Long-term memory | `/v1/stores/{storeId}/long-term-memory` | Searchable facts, preferences, summaries, and custom memory records. |
| Control Plane | `/v1/stores`, `/v1/api-keys` | Self-managed administration for stores and agent keys. |

Session memory keeps conversation continuity within a session. Long-term memory
provides searchable context across sessions.

Long-term memory `memoryType` is an open identifier. When omitted on create,
Agent Memory stores the record as `semantic`; built-in names include `semantic`,
`episodic`, `message`, and `session_summary_view`.


## Deployment modes

Start with [Plan a deployment]({{< relref "/develop/ai/context-engine/agent-memory/self-managed/plan-deployment" >}})
to choose between static stores and Control Plane managed stores.

| If you need to | Go to |
| --- | --- |
| Review software, Redis, network, Secret, image, and sizing requirements | [Prerequisites]({{< relref "/develop/ai/context-engine/agent-memory/self-managed/prerequisites" >}}) |
| Prepare `memory-dataplane.config.yaml` for either deployment mode | [Data Plane configuration]({{< relref "/develop/ai/context-engine/agent-memory/self-managed/data-plane-configuration" >}}) |
| Deploy a first-install or single-store setup without the Control Plane | [Deploy with static stores]({{< relref "/develop/ai/context-engine/agent-memory/self-managed/deploy-static" >}}) |
| Deploy runtime store and agent-key administration | [Deploy with Control Plane managed stores]({{< relref "/develop/ai/context-engine/agent-memory/self-managed/deploy-control-plane" >}}) |

Do not combine static `metadata.stores` with Control Plane managed store
metadata in the same Data Plane config. Static stores do not use Metadata Redis.
Control Plane managed stores use `metadata.source: live` and require Metadata
Redis.

{{< warning >}}
Do not expose an auth-disabled Data Plane to untrusted callers. In auth-disabled
mode, Agent Memory does not authenticate or authorize Data Plane requests; any caller that
can reach the API can read or write memory for configured stores. Use that mode
only when Kubernetes NetworkPolicy, private service exposure, ingress/gateway
policy, service mesh, or equivalent controls restrict access to trusted
components.
{{< /warning >}}
