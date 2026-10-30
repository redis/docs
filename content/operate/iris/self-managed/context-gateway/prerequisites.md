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
aliases:
- /operate/iris/context-gateway/self-managed/prerequisites/
---

## What you need

| Item | Where it comes from |
| --- | --- |
| Container images | The Context Gateway Control Plane and Data Plane images for the release |
| Helm chart | `redis-context-gateway` chart in the Redis AI Helm repository, or a chart package provided by Redis |
| Identity Service | An Identity Service release for the same tenant, shared with other Iris services |
| Redis databases | You provide Metadata Redis, credential storage, and the databases Gateways use |
| License key | Contact your Redis representative or [contact sales](https://redis.io/contact/). |
| Upstream credentials | You provide the tokens or header values each Model Context Protocol (MCP) server needs |

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
| Surface databases | The Search module, the JSON module for entities stored as JSON, and `FT.HYBRID` support for hybrid search tools. | Records that Context Surfaces serve as tools. |
| Gateway database | JSON support and `maxmemory-policy noeviction` for result handles. Only for the result cache or result handles. | Cached results and result handles. |

Use separately managed Redis deployments for metadata, credentials, and customer data. Redis endpoint aliases do not prove that two databases are separate.

- Give a Context Surface its own database when its records must stay separate from other Gateways. Gateways whose Surfaces share a database can read each other's records.
- Never use one Redis database as both a Surface database and a Gateway database.
- Size the Gateway database for result handles: the rate of calls that become handles, times the stored result size, times the handle lifetime.

Use `rediss://` URLs with certificate verification. The Federal Information Processing Standards (FIPS)-oriented profile rejects plaintext Redis URLs.

### Redis users for Surface databases

Give each plane its own Redis user on every Surface database, and put each login in that plane's registry entry. Both users need the `@connection` commands, `PING`, `INFO`, and `MODULE LIST`.

| Plane | Commands | Keys |
| --- | --- | --- |
| Data Plane | `FT.SEARCH`, `FT.AGGREGATE`, `FT.HYBRID`, `JSON.GET`, `HMGET` | Read access to each Surface key prefix only |
| Control Plane | `FT.CREATE`, `FT.DROPINDEX`, `FT._LIST`, `COMMAND INFO` | None |

For example, for a Surface whose entities use the key prefixes `provider:` and `location:`:

```text
ACL SETUSER surface-dp on ><dp-password> resetkeys %R~provider:* %R~location:* -@all +@connection +ping +info +module|list +ft.search +ft.aggregate +ft.hybrid +json.get +hmget
ACL SETUSER surface-cp on ><cp-password> resetkeys -@all +@connection +ping +info +module|list +ft.create +ft.dropindex +ft._list +command|info
```

On an OSS Redis Cluster, also grant `+cluster|slots` to both users. Search commands check key permissions differently across Redis versions, so test the users against your Redis version.

<!-- TODO: Confirm the minimum Redis version and capabilities each database needs. -->

## Credential storage

| Backend | What you provide |
| --- | --- |
| Encrypted Redis (default) | Credential Redis and a keyring of base64-encoded 32-byte Advanced Encryption Standard (AES) keys. |
| HashiCorp Vault key-value (KV) version 2 | A writer token for the Control Plane and a reader token for the Data Plane. |
| AWS Secrets Manager | An Identity and Access Management (IAM) role for each plane through workload identity. |

## Network access

| From | To | Purpose |
| --- | --- | --- |
| MCP clients | Data Plane, through your ingress at `publicBaseURL` | Tool listing and calls. |
| Data Plane | Every Upstream MCP server | Tool calls. |
| Data Plane | Identity Service | Agent-key checks. |
| Identity Service | Control Plane | Grant validation. |
| Operators | Control Plane and Identity Service | Administration. Keep both private. |

The chart creates `ClusterIP` services. Your platform owns ingress, network policy, and TLS termination.

Configure the ingress for Streamable HTTP:

- Pass the MCP request headers through unchanged, including `Authorization`, `X-Api-Key`, `Accept`, `Mcp-Protocol-Version`, `Mcp-Method`, and `Mcp-Name`.
- Pass the `WWW-Authenticate` response header, which MCP clients need to start identity provider sign-in.
- Responses can be server-sent event streams. Turn off response buffering for the Data Plane, and allow read timeouts longer than the slowest tool call.

## Credentials and Secrets

Redis URLs, tokens, keyrings, and the license belong in Kubernetes Secrets or Secrets Store Container Storage Interface (CSI) Driver files, never in Helm values or source control. See [Credentials](/content/operate/iris/self-managed/context-gateway/authentication.md#credentials) for each credential and [Configuration](/content/operate/iris/self-managed/context-gateway/configuration.md) for each file reference.

## Release artifacts and image tags

| Component | Image |
| --- | --- |
| Control Plane | `redislabs/iris-context-gateway-control:<control-plane-image-tag>` |
| Data Plane | `redislabs/iris-context-gateway-data:<data-plane-image-tag>` |

Set both `image.repository` and `image.tag` from the release manifest.

<!-- TODO: Add the published image tags and chart version from the release manifest. -->

## Air-gapped and private registry installs

For a disconnected installation, mirror both images to your registry, set each component's `image.repository`, and set `imagePullSecrets`. Install from a downloaded chart package instead of the Redis AI Helm repository.

## Helm values to review

| Value | Decide |
| --- | --- |
| `tenantId` | One tenant per release, equal to the Identity Service's single tenant ID. |
| `publicBaseURL` | The Data Plane origin MCP clients reach. |
| `credentialStorage.provider` | `redis`, `vault`, or `aws`. |
| `security.profile` | `standard` (default) or `fips`. |
