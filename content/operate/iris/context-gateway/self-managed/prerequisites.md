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
| Suite | The [suite prerequisites](/content/operate/iris/self-managed/_index.md#prerequisites): the cluster, Helm, the `redis-iris` chart `1.0.0`, the suite license, and the Identity Service the suite installs |
| Redis databases | You provide Metadata Redis, credential storage, and the databases Gateways use |
| Public origin | The `https://` origin MCP clients reach the Data Plane at, set as `contextGateway.publicBaseURL` |
| Upstream credentials | You provide the tokens or header values each Model Context Protocol (MCP) server needs |

## Required software

| Software | Purpose |
| --- | --- |
| Bash, curl, and jq | Run the API examples. |

<!-- TODO: Confirm the supported platforms for the launch release. -->

## Redis databases

The suite consumes existing Redis deployments. It doesn't provision them.

| Redis deployment | Requirements | Use |
| --- | --- | --- |
| Metadata Redis | Shared by the Control Plane and Data Plane. | Gateway and Upstream records. |
| Credential Redis | A separate access control list (ACL) user. Only with the encrypted Redis backend. | Encrypted Upstream credentials. |
| Surface databases | The Search module, the JSON module for entities stored as JSON, and `FT.HYBRID` support for hybrid search tools. | Records that Context Surfaces serve as tools. |
| Gateway database | JSON support and `maxmemory-policy noeviction` for compression. Only for the cache or compression. | Cached results and handles. |

Use separately managed Redis deployments for metadata, credentials, and customer data. Redis endpoint aliases do not prove that two databases are separate.

- Give a Context Surface its own database when its records must stay separate from other Gateways. Gateways whose Surfaces share a database can read each other's records.
- Never use one Redis database as both a Surface database and a Gateway database. Keep the two [default databases](/content/operate/iris/context-gateway/self-managed/configuration.md#default-databases) on separate Redis endpoints when compression is on, because `noeviction` would otherwise apply to customer data.
- Size the Gateway database for handles: the rate of calls that become handles, times the stored result size, times the handle lifetime.

Use `rediss://` URLs with certificate verification.

### Redis users for Surface databases

Give each plane its own Redis user on every Surface database, and supply each plane's login through its own overlay. See [Context Surface databases](/content/operate/iris/context-gateway/self-managed/configuration.md#context-surface-databases). Both users need the `@connection` commands, `PING`, `INFO`, and `MODULE LIST`.

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

The suite creates `ClusterIP` services. It can also create an Ingress for the Data Plane with `contextGateway.dataplane.ingress`, which is off by default. See [Helm values](/content/operate/iris/context-gateway/self-managed/configuration.md#helm-values). Your platform owns the ingress controller, network policy, Domain Name System (DNS) records, and Transport Layer Security (TLS) certificates.

Configure the ingress for Streamable HTTP:

- Pass the MCP request headers through unchanged, including `Authorization`, `X-Api-Key`, `Accept`, `Mcp-Protocol-Version`, `Mcp-Method`, and `Mcp-Name`.
- Pass the `WWW-Authenticate` response header, which MCP clients need to start identity provider sign-in.
- Allow read timeouts longer than the slowest tool call.

## Credentials and Secrets

Redis URLs and keyrings belong in Kubernetes Secrets or Secrets Store Container Storage Interface (CSI) Driver files, never in Helm values or source control. The suite supplies the license and the internal and runtime tokens as Kubernetes Secrets, so don't point those at CSI files. See [Service Secrets and Redis databases](/content/operate/iris/self-managed/_index.md#service-secrets-and-redis-databases), [Credentials](/content/operate/iris/context-gateway/self-managed/authentication.md#credentials) for each credential and [Configuration](/content/operate/iris/context-gateway/self-managed/configuration.md) for each file reference.

## Images and private registries

The suite pins the Control Plane and Data Plane images, `redislabs/iris-context-gateway-control` and `redislabs/iris-context-gateway-data`, to `1.0.0`. For a disconnected installation, mirror both images to your registry with their tags unchanged, then set `contextGateway.controlplane.image.repository`, `contextGateway.dataplane.image.repository`, and `global.imagePullSecrets`. Install from the package that `helm pull redis-ai/redis-iris --version 1.0.0` downloads, instead of the Redis AI Helm repository.

## Helm values to review

| Value | Decide |
| --- | --- |
| `contextGateway.publicBaseURL` | The Data Plane origin MCP clients reach. |
| `contextGateway.credentialStorage.provider` | `redis`, `vault`, or `aws_secrets_manager`. |
