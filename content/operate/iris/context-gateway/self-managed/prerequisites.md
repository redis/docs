---
Title: Self-managed Context Gateway prerequisites
alwaysopen: false
categories:
- docs
- operate
- iris
description: Review software, Identity Service, Redis, credential storage, network, Secret, and image prerequisites for self-managed Context Gateway.
linkTitle: Prerequisites
weight: 20
hideListLinks: true
---

## What you need

| Item | Where it comes from |
| --- | --- |
| Container images | The Context Gateway Control Plane and Data Plane images for the release |
| Helm chart | `redis-context-gateway` chart in the Redis AI Helm repository, or a chart package provided by Redis |
| Identity Service | An Identity Service release for the same tenant, shared with other Iris services |
| Redis databases | You provide Metadata Redis, credential storage, and the databases Gateways use |
| License key | Contact your Redis representative or [contact sales](https://redis.io/contact/). |
| Upstream credentials | You provide the tokens or header values each MCP server needs |

## Required software

| Software | Purpose |
| --- | --- |
| Kubernetes cluster and `kubectl` | Run both planes and create Secrets in the installation namespace. |
| [Helm 3](https://docs.helm.sh/docs/v3/intro/install/) | Install the chart. |
| Bash, curl, and jq | Run the API examples. |

<!-- TODO: Confirm the supported Kubernetes versions and platforms for the launch release. -->

## Redis databases

The chart consumes existing Redis deployments. It does not provision them.

| Redis deployment | Requirements | Use |
| --- | --- | --- |
| Metadata Redis | Shared by the Control Plane and Data Plane. | Gateway and Upstream records. |
| Credential Redis | A separate access control list (ACL) user. Only with the encrypted Redis backend. | Encrypted Upstream credentials. |
| Surface databases | Search capability for the indexes a data model needs. | Records that Context Surfaces serve as tools. |
| Gateway database | `maxmemory-policy noeviction`. Only for the result cache or result handles. | Cached results and result handles. |

Use separately managed Redis deployments for metadata, credentials, and customer data. Redis endpoint aliases do not prove that two databases are separate.

- Give a Context Surface its own database when its records must stay separate from other Gateways. Gateways whose Surfaces share a database can read each other's records.
- Never use one Redis database as both a Surface database and a Gateway database.
- Size the Gateway database for result handles: the rate of calls that become handles, times the stored result size, times the handle lifetime.

Use `rediss://` URLs with certificate verification. The FIPS-oriented profile rejects plaintext Redis URLs.

<!-- TODO: Confirm the minimum Redis version and capabilities each database needs. -->

## Credential storage

| Backend | What you provide |
| --- | --- |
| Encrypted Redis (default) | Credential Redis and a keyring of base64-encoded 32-byte AES keys. |
| HashiCorp Vault KV version 2 | A writer token for the Control Plane and a reader token for the Data Plane. |
| AWS Secrets Manager | An IAM role for each plane through workload identity. |

## Network access

| From | To | Purpose |
| --- | --- | --- |
| MCP clients | Data Plane, through your ingress at `publicBaseURL` | Tool listing and calls. Preserve the MCP request and response headers. |
| Data Plane | Every Upstream MCP server | Tool calls. |
| Data Plane | Identity Service | Agent-key checks. |
| Identity Service | Control Plane | Grant validation. |
| Operators | Control Plane and Identity Service | Administration. Keep both private. |

The chart creates `ClusterIP` services. Your platform owns ingress, network policy, and TLS termination.

## Credentials and Secrets

Redis URLs, tokens, keyrings, and the license belong in Kubernetes Secrets or Secrets Store CSI Driver files, never in Helm values or source control. See [Credentials](/content/operate/iris/context-gateway/self-managed/authentication.md#credentials) for each credential and [Configuration](/content/operate/iris/context-gateway/self-managed/configuration.md) for each file reference.

## Release artifacts and image tags

<!-- TODO: Add the published image repositories, tags, and chart version from the release manifest. -->

## Helm values to review

| Value | Decide |
| --- | --- |
| `tenantId` | One tenant per release, equal to the Identity Service's single tenant ID. |
| `publicBaseURL` | The Data Plane origin MCP clients reach. |
| `credentialStorage.provider` | `redis`, `vault`, or `aws`. |
| `security` | Whether to run the FIPS-oriented profile. |
