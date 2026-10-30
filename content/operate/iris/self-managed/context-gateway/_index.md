---
Title: Self-managed Redis Context Gateway
alwaysopen: false
categories:
- docs
- operate
- iris
description: Deploy, configure, and operate Redis Context Gateway on a self-managed Kubernetes cluster.
linkTitle: Context Gateway
weight: 30
hideListLinks: true
aliases:
- /operate/iris/context-retriever/self-managed/
- /operate/iris/context-gateway/self-managed/
- /operate/iris/context-gateway/
- /operate/iris/context-retriever/
- /operate/iris/context-retriever/create-service/
- /operate/iris/context-retriever/view-service/
- /operate/iris/context-retriever/view-admin-keys/
- /operate/rc/context-engine/context-retriever/
---

The `redis-context-gateway` Helm chart deploys one tenant's Context Gateway Control Plane and Data Plane. You provide the Identity Service release, the Redis databases, and the license. The chart does not install Identity Service, Redis, Vault, or Secrets Store CSI (Container Storage Interface) Driver resources.

Agents call the Data Plane's Model Context Protocol (MCP) endpoint, described in the [MCP API reference](/content/develop/ai/context-engine/context-gateway/api-reference.md). The [Control Plane API reference](/content/operate/iris/self-managed/context-gateway/control-plane-api-reference.md) documents the self-managed administration endpoints for Gateways and Upstreams.

The chart version that matches these guides is not published yet. Set the chart version and image tags from the approved release manifest when it becomes available.

<!-- TODO: Replace with the published chart version and the global Iris release instructions at GA. -->

## What you deploy

| Component | Purpose | Service port |
| --- | --- | --- |
| Control Plane | Create Gateways, register Upstreams, write credentials, and validate agent-key grants. | `9100` |
| Data Plane | Serve each Gateway's MCP endpoint and call its Upstreams. | `8083` |
| Identity Service | Issue agent keys and check them for the Data Plane. Installed as its own release. | `9200` |
| Metadata Redis | Store Gateway and Upstream records. | Customer-provided |
| Credential storage | Store Upstream credentials: encrypted Redis by default, or Vault or AWS Secrets Manager. | Customer-provided |
| Registered databases | Context Surface data, and the Gateway database for cached results and handles. | Customer-provided |

Use separately managed Redis deployments for metadata, credentials, and customer data. Use a separate Redis access control list (ACL) user for credentials.

### How the components work together

| Flow | Caller | Service | Backing store |
| --- | --- | --- | --- |
| Gateway administration | Platform admin | Control Plane | Metadata Redis and credential storage |
| Agent-key administration | Platform admin | Identity Service | Identity Service metadata Redis |
| Grant validation | Identity Service | Control Plane | Metadata Redis |
| Tool listing and calls | Agent | Data Plane | Metadata Redis, credential storage, and Upstreams |

1. Platform admins create Gateways and register Upstreams through the Control Plane, then mint agent keys through the Identity Service.
1. The Identity Service asks the Control Plane to confirm that a Gateway exists before it mints a key for it.
1. Agents call a Gateway's MCP endpoint on the Data Plane with an agent key or an identity provider token.
1. The Data Plane checks the key with the Identity Service, reads the Gateway's records, and calls the Upstream with the Upstream's credential.

### API surfaces

| API surface | Endpoint | Purpose |
| --- | --- | --- |
| Gateway MCP | `/v1/gateways/{gatewayId}/mcp` | The Streamable HTTP MCP endpoint for one Gateway. |
| Protected resource metadata | `/.well-known/oauth-protected-resource/v1/gateways/{gatewayId}/mcp` | Names the identity provider for MCP client sign-in. |
| Control Plane | `/v1/gateways` | Administration of Gateways and Upstreams. |
| Health | `/health/liveness`, `/health/readiness` | Liveness and readiness on both planes. |
| Identity Service | `/v1/api-keys` | Administration of agent keys. |

## Get started

1. Review the [prerequisites](/content/operate/iris/self-managed/context-gateway/prerequisites.md).
2. Prepare the [configuration](/content/operate/iris/self-managed/context-gateway/configuration.md).
3. [Deploy the chart](/content/operate/iris/self-managed/context-gateway/deploy.md).
4. [Load administrative credentials](/content/operate/iris/self-managed/context-gateway/authentication.md).
5. [Create a Gateway and an agent key](/content/operate/iris/self-managed/context-gateway/api-examples.md).

## Manage the deployment

- [Manage Gateways and Upstreams](/content/develop/ai/context-engine/context-gateway/manage-gateways.md) and [Context Surfaces](/content/develop/ai/context-engine/context-gateway/manage-context-surfaces.md) through the Control Plane.
- [Rotate or revoke agent keys](/content/operate/iris/self-managed/context-gateway/api-examples.md#rotate-or-revoke-agent-keys).
- [Check health, rotate credentials, back up, and upgrade](/content/operate/iris/self-managed/context-gateway/operations.md).
- [Troubleshoot the deployment](/content/operate/iris/self-managed/context-gateway/reference.md#troubleshooting).
