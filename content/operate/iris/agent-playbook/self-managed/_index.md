---
Title: Self-managed Redis Agent Playbooks
alwaysopen: false
categories:
- docs
- operate
- iris
description: Deploy, configure, and operate Redis Agent Playbooks on a self-managed Kubernetes cluster.
linkTitle: Self-managed
weight: 40
hideListLinks: true
bannerText: A license key is required to deploy. Contact your Redis representative or [contact sales](https://redis.io/contact/).
bannerChildren: true
---

Redis Agent Playbooks store the answers and procedures your business approves as versioned FAQs and skills, and serve the published versions to your agents. Developers author entries and review proposals in a playbook; agents retrieve published entries over REST or the Model Context Protocol (MCP). Before developers can do that, a platform administrator deploys Agent Playbooks and creates playbooks and agent keys for them.

This guide is for that administrator. It covers deploying Agent Playbooks on your own Kubernetes cluster, then configuring, securing, and operating it. To install, follow [Install the Redis Iris suite](/content/operate/iris/self-managed/_index.md), then [Deploy](/content/operate/iris/agent-playbook/self-managed/deploy.md).

The `redis-iris` chart `1.0` deploys the Agent Playbooks control plane and data plane, and optionally a background extraction worker, with the Identity Service that issues and checks agent keys. Agent Playbooks values go under the `playbook:` key, and the chart's `examples/playbook.yaml` is a working values file to start from. You provide the Redis databases, the embedding provider, and the suite license. The chart doesn't install Redis.

Applications call the data plane to author, review, and retrieve entries, as described in the [data-plane API reference](/content/develop/ai/context-engine/agent-playbooks/api-reference.md). The [control-plane API reference](/content/operate/iris/agent-playbook/self-managed/control-plane-api-reference.md) documents the administration endpoints for playbooks.

## What you deploy

| Component | Purpose | Service port |
| --- | --- | --- |
| Control plane | Create playbooks, manage their settings and lifecycle, and validate agent-key grants. | `9200` |
| Data plane | Author and retrieve FAQs and skills, review proposals, and serve MCP requests. | `9201` |
| Extraction worker | Optionally propose FAQs from connected Redis Agent Memory sessions. | `9203` |
| Identity Service | Issue agent keys and check them for the data plane. Installed by the suite. | `9200` |
| Metadata Redis | Store playbook configuration. | Customer-provided |
| Content Redis | Store entries, proposals, and search indexes. Needs JSON and Search. | Customer-provided |

Metadata and content need physically separate Redis deployments.

### How the components work together

| Flow | Caller | Service | Backing store |
| --- | --- | --- | --- |
| Playbook administration | Platform admin | Control plane | Metadata Redis |
| Agent-key administration | Platform admin | Identity Service | Identity Service metadata Redis |
| Grant validation | Identity Service | Control plane | Metadata Redis |
| Authoring, review, and retrieval | Application or agent | Data plane | Content Redis and the embedding provider |

1. Platform admins create playbooks through the control plane, then mint agent keys through the Identity Service.
1. The Identity Service asks the control plane to confirm each playbook grant before it stores a key.
1. Applications call the data plane with an agent key. The data plane checks the key with the Identity Service and reads or writes the playbook's content.

### API surfaces

| API surface | Endpoint | Purpose |
| --- | --- | --- |
| Data plane | `/iris/data/v1/agent-playbooks/playbooks/{playbookId}` | Authoring, review, and retrieval for one playbook. |
| MCP | `/iris/data/v1/agent-playbooks/playbooks/{playbookId}/mcp` | Read-only MCP tools for agents, on the data-plane port. |
| Control plane | `/iris/v1/agent-playbooks/playbooks`, `/iris/v1/agent-playbooks/models` | Administration of playbooks, their settings, and extraction bindings. |
| Health | `/health/liveness`, `/health/readiness` | Liveness and readiness on both planes. |
| Identity Service | `/v1/api-keys` | Administration of agent keys. |

## Get started

1. Review the [prerequisites](/content/operate/iris/agent-playbook/self-managed/prerequisites.md).
1. Prepare the [configuration](/content/operate/iris/agent-playbook/self-managed/configuration.md).
1. [Deploy the chart](/content/operate/iris/agent-playbook/self-managed/deploy.md).
1. [Load administrative credentials](/content/operate/iris/agent-playbook/self-managed/authentication.md#load-the-administrative-credentials).
1. [Create a playbook and agent keys](/content/operate/iris/agent-playbook/self-managed/api-examples.md).
1. Optional: [configure background FAQ extraction](/content/operate/iris/agent-playbook/self-managed/extraction.md).

## Manage the deployment

- [Rotate or revoke agent keys](/content/operate/iris/agent-playbook/self-managed/operations.md#rotate-or-revoke-agent-keys).
- [Check health, clear content, rotate Secrets, back up, and upgrade](/content/operate/iris/agent-playbook/self-managed/operations.md).
- [Configure operator sign-in with OpenID Connect (OIDC)](/content/operate/iris/agent-playbook/self-managed/authentication.md#configure-operator-oidc-access).
- [Troubleshoot the deployment](/content/operate/iris/agent-playbook/self-managed/reference.md#troubleshooting).
