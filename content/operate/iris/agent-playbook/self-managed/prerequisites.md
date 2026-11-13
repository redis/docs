---
Title: Self-managed Agent Playbooks prerequisites
alwaysopen: false
categories:
- docs
- operate
- iris
description: Review the Redis, embedding, network, Secret, and image prerequisites that Agent Playbooks adds to a redis-iris suite release.
linkTitle: Prerequisites
weight: 20
hideListLinks: true
---

The `redis-iris` chart `1.0.1` deploys the Agent Playbooks control plane, data plane, and optional extraction worker, with the Identity Service. Start with the suite's [prerequisites](/content/operate/iris/self-managed/_index.md#prerequisites). This page lists what Agent Playbooks adds: the Redis databases, the embedding provider, and Kubernetes exposure.

## What you need

| Requirement | Purpose |
| --- | --- |
| The suite prerequisites | Kubernetes, Helm, `kubectl`, the suite license, and the Identity Service metadata Redis. See [Install the Redis Iris suite](/content/operate/iris/self-managed/_index.md#prerequisites). |
| Bash, curl, and jq | Run the administrative API examples. Use a curl version that supports `--fail-with-body`. |
| Embedding provider | A provider and model the data plane can reach, with its credentials. |

<!-- TODO: Confirm the supported platforms and production sizing for the GA release. -->

## Deployment decisions

Choose these settings before you create playbooks:

| Decision | What to plan |
| --- | --- |
| Tenant | The release's one tenant, `global.iris.tenantId`. See [Tenancy and identity provider limits](/content/operate/iris/self-managed/_index.md#tenancy-and-identity-provider-limits). |
| Storage | Provision separate metadata and content Redis deployments. |
| Embeddings | List each provider, model, and dimension identity the deployment offers. Each playbook selects one when you create it. |
| API exposure | Keep the control plane and Identity Service private. Expose the data plane to approved applications through your platform's ingress. |
| Credentials | The suite generates the credentials Agent Playbooks shares with the Identity Service, and the admin token. See [Credentials](/content/operate/iris/self-managed/_index.md#credentials). Give applications separate scoped agent keys. |
| Operator identity | Use the admin token, OpenID Connect (OIDC) access tokens from your identity provider, or both. |
| Extraction | To propose FAQs from Redis Agent Memory sessions, plan a durable queue Redis, a generation model, workload identity, and network paths between both products. See [Configure background FAQ extraction](/content/operate/iris/agent-playbook/self-managed/extraction.md). |

### Choose embedding models

A playbook's embedding identity (`provider`, `model`, and `dimensions`) can't change after you create it. To change its model or dimensions, create a new playbook and migrate the content. You can offer several identities in one deployment. There is no default; every playbook names one.

Set up the models in [Embedding configuration](/content/operate/iris/agent-playbook/self-managed/configuration.md#embedding-configuration).

### Plan API exposure

The chart creates `ClusterIP` Services. Your platform owns ingress, network policy, and Transport Layer Security (TLS) termination for Agent Playbooks and the Identity Service.

The data-plane Service on port `9201` serves both REST and MCP. To expose MCP, route `/iris/data/v1/agent-playbooks/playbooks/{playbookId}/mcp` to the data-plane Service and keep the complete path, the `Authorization` header, the request body, and the MCP and `Accept` headers. MCP messages use `POST`. The transport is stateless, so an authenticated `GET` or `DELETE` returns `405`.

Exposing a whole Identity Service also exposes its administration routes. Expose only the routes your applications need.

### Plan capacity and recovery

The suite runs two data-plane replicas and one control-plane replica, with PodDisruptionBudgets, and leaves `resources` unset. These defaults are not a production sizing recommendation. Set resource requests and limits under `playbook:`, and leave capacity for one extra pod during upgrades. See [Availability](/content/operate/iris/self-managed/_index.md#availability).

Plan coordinated storage backups in [Operations](/content/operate/iris/agent-playbook/self-managed/operations.md#back-up-the-deployment).

<!-- TODO: Add qualified production sizing and availability guidance for the GA release. -->

## Redis databases

The chart uses existing Redis deployments. It does not provision them.

| Redis deployment | Requirements | Use |
| --- | --- | --- |
| Metadata | Core Redis commands and Lua scripting. Also JSON when extraction is enabled. | Playbook configuration and extraction bindings. |
| Content | JSON and Search, including vector indexes. | Entries, proposals, and retrieval. |
| Extraction queue | Persistence and a `noeviction` policy. Only with extraction. | Extraction jobs. |

Use physically separate deployments for metadata and content. The services reject aliased endpoints, so different database numbers or credentials on the same Redis endpoint don't satisfy this requirement. A Redis 8 build that includes JSON and Search, such as the official `redis:8` image, meets both requirements.

The Identity Service's metadata Redis is a suite prerequisite. It can use the Agent Playbooks metadata deployment with its own, least-privileged Redis user. Use authenticated, certificate-verified `rediss://` connections for production, and trust the issuing certificate authority (CA).

## Images and network access

The suite chart pins these images:

| Component | Image |
| --- | --- |
| Control plane | `redislabs/iris-agent-playbook-control:1.0.1` |
| Data plane and extraction worker | `redislabs/iris-agent-playbook-data:1.0.1` |

Allow chart downloads, image pulls, Redis connections, and data-plane access to the embedding provider. The data plane and control plane must reach the Identity Service, and the Identity Service must reach the control plane on port `9200`. For a disconnected installation, mirror the images, use a downloaded chart package, and set the image repositories and `imagePullSecrets` under `playbook:` in `iris-values.yaml`.

## Secrets

Prepare the files and Secrets described in [Configuration](/content/operate/iris/agent-playbook/self-managed/configuration.md). Storage URLs and provider credentials belong in Secrets, not in Helm values or source control.

For the credentials Agent Playbooks uses, see [Credentials](/content/operate/iris/agent-playbook/self-managed/authentication.md#credentials).
