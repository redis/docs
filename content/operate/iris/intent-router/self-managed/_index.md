---
Title: Self-managed Redis Intent Router
alwaysopen: false
categories:
- docs
- operate
- iris
description: Deploy, configure, and operate Redis Intent Router on a self-managed Kubernetes cluster.
linkTitle: Self-managed
weight: 40
hideListLinks: true
---

The `redis-intent-router` Helm chart deploys one tenant's Intent Router control plane and data plane. By default it also deploys an Identity Service that issues and checks agent keys. You provide the Redis databases, the embedding provider credentials, and the license.

Applications call the data plane to author intents and match queries, as described in the [data-plane API reference](/content/develop/ai/context-engine/intent-router/api-reference.md). The [control plane API reference](/content/operate/iris/intent-router/self-managed/control-plane-api-reference.md) documents the administration endpoints for Routers.

The chart version that matches these guides is not published yet. Set the chart version and image tags from the approved release manifest when it becomes available.

## What you deploy

| Component | Purpose | Service port |
| --- | --- | --- |
| Control plane | Create and manage Routers, and validate agent-key grants. | `9400` |
| Data plane | Store intents and examples, build each Router's vector index, and serve matching. | `9401` |
| Identity Service | Issue agent keys and check them for the data plane. | `9200` |
| Metadata Redis | Store Router records and the mailbox the planes coordinate through. | Customer-provided |
| Data-plane Redis | Store intents, examples, and a vector index for each Router. Needs Redis Search. | Customer-provided |
| Embedding provider | Embed examples and queries. | Customer-provided |

Use a separate Redis for the control plane's metadata and for the data plane. Redis 8, or a database with the Search and Query engine loaded, is required for the data plane.

### How the components work together

| Flow | Caller | Service | Backing store |
| --- | --- | --- | --- |
| Router administration | Platform admin | Control plane | Metadata Redis |
| Agent-key administration | Platform admin | Identity Service | Identity Service metadata Redis |
| Grant validation | Identity Service | Control plane | Metadata Redis |
| Authoring and matching | Application | Data plane | Data-plane Redis and the embedding provider |

1. Platform admins create Routers through the control plane, then mint agent keys through the Identity Service.
1. The Identity Service asks the control plane to confirm that a Router exists before it mints a key for it.
1. The control plane writes each Router's desired configuration to a mailbox in the metadata Redis. The data plane applies it, builds the Router's vector index, and publishes the result back. The two planes never call each other.
1. Applications call the data plane with an agent key. The data plane checks the key with the Identity Service and reads or writes the Router's data.

A Router serves requests only after the data plane has applied its current configuration. Until then, data requests return `409`.

### API surfaces

| API surface | Endpoint | Purpose |
| --- | --- | --- |
| Data plane | `/iris/v2/intent/routers/{routerId}` | Authoring and matching for one Router. |
| Control plane | `/iris/v2/intent/routers`, `/iris/v2/intent/models` | Administration of Routers and the model they use. |
| Health | `/health/liveness`, `/health/readiness` | Liveness and readiness on both planes. |
| Identity Service | `/v1/api-keys` | Administration of agent keys. |

## Get started

1. Review the [prerequisites](/content/operate/iris/intent-router/self-managed/prerequisites.md).
1. Prepare the [configuration](/content/operate/iris/intent-router/self-managed/configuration.md).
1. [Deploy the chart](/content/operate/iris/intent-router/self-managed/deploy.md).
1. [Load administrative credentials](/content/operate/iris/intent-router/self-managed/authentication.md).
1. [Create a Router and an agent key](/content/operate/iris/intent-router/self-managed/api-examples.md).

## Manage the deployment

- [Manage Routers](/content/develop/ai/context-engine/intent-router/manage-routers.md) through the control plane.
- [Rotate or revoke agent keys](/content/operate/iris/intent-router/self-managed/api-examples.md#rotate-or-revoke-agent-keys).
- [Check health, rotate credentials, size memory, and upgrade](/content/operate/iris/intent-router/self-managed/operations.md).
- [Troubleshoot the deployment](/content/operate/iris/intent-router/self-managed/reference.md#troubleshooting).
