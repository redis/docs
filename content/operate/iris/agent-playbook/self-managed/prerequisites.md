---
Title: Self-managed Agent Playbooks prerequisites
alwaysopen: false
categories:
- docs
- operate
- iris
description: Review software, Identity Service, Redis, embedding, network, Secret, and image prerequisites for self-managed Agent Playbooks.
linkTitle: Prerequisites
weight: 20
hideListLinks: true
---

Redis Agent Playbooks is distributed as container images on Docker Hub plus the `redis-agent-playbook` Helm chart in the Redis AI Helm repository. The chart deploys the control plane, the data plane, and the optional extraction worker. Install the `iris-identity-service` chart as its own release before you install Agent Playbooks.

You provide the Identity Service release, the Redis databases, the embedding provider, Kubernetes exposure, and the license.

> [!NOTE]
> This guide is for system administrators deploying Redis Agent Playbooks on a self-managed
> Kubernetes cluster.

## What you need

| Requirement | Purpose |
| --- | --- |
| Kubernetes cluster and `kubectl` | Run the services and create Secrets in the deployment namespace. |
| [Helm 3](https://helm.sh/docs/intro/install/) | Install `redis-ai/redis-agent-playbook` and `redis-ai/iris-identity-service` from `https://helm.redis.io/ai`. |
| Bash, curl, jq, and OpenSSL | Generate tokens and run the administrative API examples. Use a curl version that supports `--fail-with-body`. |
| License key | Contact your Redis representative or [contact sales](https://redis.io/contact/). An Agent Playbooks license or an Iris suite license that includes Agent Playbooks. |
| Embedding provider | A provider and model the data plane can reach, with its credentials. |
| Identity Service | An `iris-identity-service` release, chart `0.10.0` or later, with the Agent Playbooks entries registered. See [Deploy](/content/operate/iris/agent-playbook/self-managed/deploy.md#3-install-identity-service-first). |

<!-- TODO: Confirm the supported Kubernetes versions, platforms, and production sizing for the GA release. The chart states that a supported Kubernetes version matrix is not yet qualified. -->

## Deployment decisions

Choose these settings before you create playbooks:

| Decision | What to plan |
| --- | --- |
| Tenant | Choose one `tenantId` for the deployment. The Identity Service release's `runtime.apiKeyTenant.singleTenantID` must match it, and agent-key grants name it. |
| Storage | Provision separate metadata and content Redis deployments. |
| Embeddings | List each provider, model, and dimension identity the deployment offers. Each playbook selects one when you create it. |
| API exposure | Keep the control plane and Identity Service private. Expose the data plane to approved applications through your platform's ingress. |
| Credentials | Provision the two credentials the Identity Service release shares with Agent Playbooks. Let the chart generate the admin token, or supply it. Give applications separate scoped agent keys. |
| Operator identity | Use the admin token, OpenID Connect (OIDC) access tokens from your identity provider, or both. |
| Extraction | To propose FAQs from Redis Agent Memory sessions, plan a durable queue Redis, a generation model, workload identity, and network paths between both products. See [Configure background FAQ extraction](/content/operate/iris/agent-playbook/self-managed/extraction.md). |

### Choose embedding models

A playbook's embedding identity (`provider`, `model`, and `dimensions`) can't change after you create it. To change its model or dimensions, create a new playbook and migrate the content. You can offer several identities in one deployment. There is no default; every playbook names one.

Set up the models in [Embedding configuration](/content/operate/iris/agent-playbook/self-managed/configuration.md#embedding-configuration).

### Plan API exposure

The chart creates `ClusterIP` Services. Your platform owns ingress, network policy, and Transport Layer Security (TLS) termination. Neither the Agent Playbooks chart nor the Identity Service chart terminates TLS.

The data-plane Service on port `9201` serves both REST and MCP. To expose MCP, route `/iris/data/v1/agent-playbooks/playbooks/{playbookId}/mcp` to the data-plane Service and keep the complete path, the `Authorization` header, the request body, and the MCP and `Accept` headers. MCP messages use `POST`. The transport is stateless, so an authenticated `GET` or `DELETE` returns `405`.

Exposing a whole Identity Service Service also exposes its administration routes. Expose only the routes your applications need.

### Plan capacity and recovery

The chart starts one replica of each service and leaves `resources` unset for the control plane and data plane. These defaults are not a production sizing recommendation. Set resource requests and limits, and leave capacity for old and new pods during upgrades.

Plan coordinated storage backups in [Operations](/content/operate/iris/agent-playbook/self-managed/operations.md#back-up-the-deployment).

<!-- TODO: Add qualified production sizing and availability guidance for the GA release. -->

## Redis databases

The chart uses existing Redis deployments. It does not provision them.

| Redis deployment | Requirements | Use |
| --- | --- | --- |
| Metadata | Core Redis commands and Lua scripting. Also JSON when extraction is enabled. | Playbook configuration and extraction bindings. |
| Content | JSON and Search, including vector indexes. | Entries, proposals, and retrieval. |
| Identity Service metadata | Core Redis commands. Configured on the Identity Service release. | Agent-key records. |
| Extraction queue | Persistence and a `noeviction` policy. Only with extraction. | Extraction jobs. |

Use physically separate deployments for metadata and content. The services reject aliased endpoints, so different database numbers or credentials on the same Redis endpoint don't satisfy this requirement. A Redis 8 build that includes JSON and Search, such as the official `redis:8` image, meets both requirements.

The Identity Service can use the metadata deployment with its own, least-privileged Redis user. Use authenticated, certificate-verified `rediss://` connections for production, and trust the issuing certificate authority (CA).

## Images and network access

The chart requires an explicit image tag for each plane.

| Component | Image |
| --- | --- |
| Control plane | `redislabs/iris-agent-playbook-control:1.0.0` |
| Data plane and extraction worker | `redislabs/iris-agent-playbook-data:1.0.0` |
| Identity Service | The image that its own chart pins. |

<!-- TODO: Confirm the GA image tags. Chart 1.0.0 declares appVersion 1.0.0, but its default image tags are empty. -->

Allow chart downloads, image pulls, Redis connections, and data-plane access to the embedding provider. The data plane and control plane must reach the Identity Service, and the Identity Service must reach the control plane on port `9200`. For a disconnected installation, mirror the images, use a downloaded chart package, and set the image repositories and `imagePullSecrets` in your Helm values.

## Secrets

Prepare the files and Secrets described in [Configuration](/content/operate/iris/agent-playbook/self-managed/configuration.md). Storage URLs, provider credentials, and license material belong in Secrets, not in Helm values or source control.

For the credentials each release needs, see [Credentials](/content/operate/iris/agent-playbook/self-managed/authentication.md#credentials).
