---
title: Identity Service
description: Deploy and operate the Identity Service, which issues and checks agent keys for self-managed Redis Iris services.
linkTitle: Identity Service
alwaysopen: false
categories:
- docs
- operate
- iris
weight: 29
hideListLinks: true
---

The Identity Service issues the agent keys that applications and agents present to self-managed Redis Iris services, and checks those keys for each service's data plane. Every self-managed Iris service connects to it, and one Identity Service release can serve all of them.

This guide is for the platform administrator who installs the Identity Service, registers each service with it, and manages agent keys and operator access.

> [!NOTE]
> The Identity Service needs no license key of its own. Each Iris service you connect to it needs a license. Contact your Redis representative or
> [contact sales](https://redis.io/contact/).

## Deployment options

### Redis Cloud

On Redis Cloud, agent keys are managed for you: there is no Identity Service to deploy. Create each service's agent keys in the Redis Cloud console.

### Self-managed

Deploy the Identity Service on Kubernetes to run it on your own infrastructure, before or alongside the services that use it.

[Start with the deployment guide](/content/operate/iris/identity-service/deploy.md).

## Which services use it

Each of these services' self-managed guides installs the Identity Service as a separate release before the service:

| Service | `product` in grants | `resourceType` in grants | Guide |
| --- | --- | --- | --- |
| Agent Memory | `memory` | `mem-store` | [Self-managed Agent Memory](/content/operate/iris/agent-memory/self-managed/_index.md) |
| Agent Playbooks | `playbook` | `playbook` | [Self-managed Agent Playbooks](/content/operate/iris/agent-playbook/self-managed/_index.md) |
| Context Gateway | `context-gateway` | `gateway` | [Self-managed Context Gateway](/content/operate/iris/context-gateway/self-managed/_index.md) |
| Intent Router | `intent` | `intent-router` | [Self-managed Intent Router](/content/operate/iris/intent-router/self-managed/_index.md) |
| Lens | `lens` | `lens-instance` | [Self-managed Lens](/content/operate/iris/lens/self-managed/_index.md) |

If you already run an Identity Service release for one service, register the next service on that release instead of installing a second one. See [Register services](/content/operate/iris/identity-service/configuration.md#register-services).

## What you deploy

The `iris-identity-service` Helm chart deploys one Deployment and one ClusterIP Service on port `9200`. The guides install it as release `ids`, so its Service is `ids-iris-identity-service`.

| Component | Purpose | Provided by |
| --- | --- | --- |
| Identity Service | Issues, lists, rotates, and revokes agent keys, and checks them for the service data planes. | The chart |
| Control token Secret | The rescue credential for the Identity Service control API. | The chart generates it, or you supply it |
| Metadata Redis | Stores the hashed agent keys, their grants, and subject grants. | You |
| Runtime credentials and internal tokens | Shared Secrets between the Identity Service and each service. | You |

The chart deploys no Redis, no service, no Ingress, and no NetworkPolicy. The Identity Service has no TLS listener: terminate Transport Layer Security (TLS) in your ingress, service mesh, or load balancer.

## How it fits with the services

The Identity Service listens on one port and serves three groups of routes. Each group accepts a different credential, sent as `Authorization: Bearer <value>`.

| Route group | Routes | Caller | Credential |
| --- | --- | --- | --- |
| Control | `/v1/api-keys`, `/v1/products`, `/v1/subject-grants` | Operators and automation | The control token, or an operator's identity provider (IdP) access token |
| Runtime | `/v1/auth/*` | Service data planes | The service's runtime credential |
| Operational | `/health/liveness`, `/health/readiness` | Kubernetes probes and monitoring | None |

1. An operator creates a resource in a service's control plane, such as an Agent Memory store or a Router in Intent Router.
1. The operator mints an agent key for that resource through the Identity Service control API.
1. Before it stores the key, the Identity Service asks the service's control plane to confirm that the resource exists and that the actions are valid. This step is called grant validation. It uses the control plane's internal token.
1. The Identity Service returns the key once. It stores only a hash of the key.
1. The agent sends the key to the service's data plane. The data plane checks it with the Identity Service, using its runtime credential, and caches the answer.

The Identity Service keeps no service data.

## Pages in this guide

- [Deploy](/content/operate/iris/identity-service/deploy.md): prerequisites, install, and verification.
- [Configuration](/content/operate/iris/identity-service/configuration.md): the metadata Redis, the tenant, service registration, and the other Helm values.
- [Authentication and authorization](/content/operate/iris/identity-service/authentication.md): credentials, roles, operator sign-in with your IdP, and subject grants.
- [Operations](/content/operate/iris/identity-service/operations.md): the agent-key lifecycle, credential rotation, upgrades, backups, and troubleshooting.
