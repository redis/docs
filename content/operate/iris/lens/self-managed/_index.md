---
Title: Self-managed Lens
alwaysopen: false
categories:
- docs
- operate
- iris
description: Deploy, configure, secure, and operate Lens on a self-managed Kubernetes cluster.
linkTitle: Self-managed
weight: 40
hideListLinks: true
---

Lens traces your AI agent turns, so developers can see what each source returned, what entered the prompt, and how each step went. Before developers can send turns, a platform administrator deploys Lens, connects it to an Identity Service, and gives each application an endpoint and API keys.

This guide is for that administrator. It covers deploying Lens on your own Kubernetes cluster with the `redis-lens` Helm chart, then configuring, securing, and operating it. To install, start with the [prerequisites](/content/operate/iris/lens/self-managed/prerequisites.md). To install Lens with the Identity Service and the Iris console in one release, see [Install with the Redis Iris suite chart](/content/operate/iris/lens/self-managed/deploy.md#install-with-the-redis-iris-suite-chart).

> [!NOTE]
> You need a license key to deploy self-managed Lens. Contact your Redis representative or
> [contact sales](https://redis.io/contact/).

These guides use `redis-lens` chart `1.0.0`.

## What you deploy

One release of the `redis-lens` chart runs three workloads. It deploys no Identity Service: it connects to a separate `iris-identity-service` release.

| Component | Purpose | Service port |
| --- | --- | --- |
| Data plane | Receives turns from agents over OpenTelemetry Protocol (OTLP) and serves the read application programming interface (API). | `9000` |
| Worker | Assembles received steps into turns. Runs the data-plane image, with no Service. | None |
| Control plane | Holds the single Lens instance record and validates key grants for the Identity Service. | `9300` |
| Identity Service | Mints Lens API keys and checks them for the data plane. Installed as its own release. | `9200` |
| Records database | Turn streams and search indexes. | Customer-provided |
| Content database | Captured prompts, responses, and tool payloads. | Customer-provided |
| Metadata Redis | The Lens instance record. | Customer-provided |

One installation serves one Lens instance, `default` unless you set `instance.id`. The control plane creates it at startup, so there is no create call.

### How the components work together

| Flow | Caller | Service |
| --- | --- | --- |
| Send turns | Agent, with an `ingest` key | Data plane |
| Read sessions and turns | Lens UI or read client, with a `read` key | Data plane |
| Mint and revoke API keys | Platform admin, with the Identity Service control token | Identity Service |
| Validate a key's grant before it's stored | Identity Service, with the control-plane internal token | Control plane |
| Check an API key on each request | Data plane, with its runtime credential | Identity Service |
| Read or change the instance's retention | Platform admin, with the control-plane admin token | Control plane |

The worker reads what the data plane receives from the records database and writes assembled turns back. It calls no other service.

### API surfaces

| API surface | Endpoint | Purpose |
| --- | --- | --- |
| Ingest | `POST /iris/data/v1beta1/lens/v1/traces` | OTLP over HTTP (protobuf) from agents. |
| Read API | `/iris/data/v1beta1/lens/instances/{instanceId}/...` | Agents, sessions, turns, and captured content. See the [read API](/content/develop/ai/context-engine/lens/read-api.md). |
| Control plane | `/iris/v1beta1/lens/instance` | Read and change the instance's retention. |
| Health | `/health/liveness`, `/health/readiness` | Liveness and readiness on every workload. |
| Identity Service | `/v1/api-keys` | Administration of API keys. |

## Get started

1. Review the [prerequisites](/content/operate/iris/lens/self-managed/prerequisites.md).
1. Prepare the [configuration](/content/operate/iris/lens/self-managed/configuration.md).
1. [Deploy the Identity Service and Lens](/content/operate/iris/lens/self-managed/deploy.md).
1. [Create API keys](/content/operate/iris/lens/self-managed/authentication.md#create-api-keys).
1. [Give developers their Lens settings](/content/operate/iris/lens/self-managed/deploy.md#hand-off-to-developers).

## Manage the deployment

- [Rotate credentials and revoke keys](/content/operate/iris/lens/self-managed/authentication.md#rotate-credentials).
- [Check health, watch stream growth, change retention, and upgrade](/content/operate/iris/lens/self-managed/operations.md).
- [Troubleshoot the deployment](/content/operate/iris/lens/self-managed/operations.md#troubleshooting).
