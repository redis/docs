---
Title: Configure self-managed Context Gateway
alwaysopen: false
categories:
- docs
- operate
- iris
description: Prepare Helm values, file references, credential storage, the database registry, Context Surface databases, and optional features for Context Gateway.
linkTitle: Configuration
weight: 30
hideListLinks: true
---

The chart reads non-secret settings from Helm values and every credential from a mounted file. Prepare `gateway-values.yaml` and the Secrets it references before you [deploy](/content/operate/iris/context-gateway/self-managed/deploy.md).

## Helm values

| Value | Purpose |
| --- | --- |
| `tenantId` | The deployment's tenant. Must equal the Identity Service's single tenant ID. |
| `publicBaseURL` | The Data Plane's public origin, used in every Gateway's `mcpEndpoint`. |
| `identityService.baseURL` | The Identity Service runtime API that checks agent keys. |
| `identityService.allowInsecureTransport` | `true` for an in-cluster `http://` Identity Service URL. Default `false`. |
| `profile` | `prod` (default) or `dev` logging. |
| `security.profile` | `standard` (default) or `fips`. See [Configure security and tracing](#configure-security-and-tracing). |
| `imagePullSecrets` | Credentials for a private registry. |
| `controlplane.config`, `dataplane.config` | Application settings for each plane. They default to `{}`, so the image's defaults apply. |

*Complete example `gateway-values.yaml`, copied from the chart's `examples/kubernetes-secret.yaml` at release.*

## File references

Each credential has its own reference. Point it at a Kubernetes Secret key with `existingSecret` and `secretKey`, or at a Secrets Store CSI (Container Storage Interface) Driver file with `secretProviderClass` and `fileName`. Change a reference's optional `checksum` to roll out both planes after the file changes.

| Helm reference | File contents | Used by |
| --- | --- | --- |
| `metadataDB` | YAML with `metadata_db.urls`. | Both planes |
| `credentialStorage.redis.connection` | YAML with `credential_storage.redis.urls`. | Both planes |
| `credentialStorage.redis.keyring` | Directory of base64-encoded 32-byte Advanced Encryption Standard (AES) keys. | Both planes |
| `credentialStorage.vault.credentials.controlplane` | YAML with `credential_storage.vault.token`, with write and delete access. | Control Plane |
| `credentialStorage.vault.credentials.dataplane` | YAML with `credential_storage.vault.token`, with read access. | Data Plane |
| `databaseConnections[]` | YAML with `databases.<id>.urls`. | Both planes |
| `controlplane.adminToken` | The admin token operators send to the Control Plane. | Control Plane |
| `controlplane.internalToken` | The token Identity Service sends to the grant callback. | Control Plane |
| `dataplane.runtimeToken` | The token the Data Plane sends to Identity Service. | Data Plane |
| `license` | The license file as issued. | Both planes |
| `tls.caBundle` | A PEM-encoded certificate authority (CA) bundle. | Both planes |

The admin, internal, and runtime tokens must be distinct. Keep the admin token, the internal token, and the Vault writer token out of every CSI class the Data Plane mounts.

## Credential storage

| `credentialStorage.provider` | Configuration |
| --- | --- |
| `redis` (default) | A credential Redis connection and a keyring shared by both planes. `credentialStorage.redis.keyFiles` maps each key ID to a file in the keyring, and `activeKeyId` names the key for new writes. |
| `vault` | Separate writer and reader tokens for the Control Plane and Data Plane. |
| `aws` | Separate Identity and Access Management (IAM) roles for each plane through workload identity. |

<!-- TODO: Reconcile the chart's `credential_storage` keys with the `secrets` keys in the service README before publishing. -->

## Database registry

Register every database a Gateway uses under the same ID on both planes: Context Surface databases and Gateway databases. Put display names in `shared.config.databases` and connection URLs in a `databaseConnections` file.

```yaml
shared:
  config:
    databases:
      clinics: {name: Clinic directory}
      results: {name: Gateway database}
databaseConnections:
  - existingSecret: gateway-database-connections
    secretKey: config.yaml
```

Both planes probe every entry at startup. An entry that does not answer does not stop a plane. The plane logs `Gateway database did not answer at startup` with the entry's `database_id` and starts.

## Context Surface databases

A Context Surface stores only its database ID. Give each plane its own Redis user on the database, as listed in [Redis users for Surface databases](/content/operate/iris/context-gateway/self-managed/prerequisites.md#redis-users-for-surface-databases), and put each login in that plane's registry entry. To change a password, update the Secret and restart both planes.

Semantic and hybrid search tools embed the agent's text before they search. Point the Data Plane at an OpenAI-compatible embedding service:

```yaml
dataplane:
  config:
    context_surface:
      embedding:
        endpoint: https://api.openai.com/v1
        model: text-embedding-3-small
```

<!-- TODO: Confirm how the chart supplies the embedding API key to the Data Plane. -->

Without an embedding service, every other tool still works, and semantic or hybrid search calls fail with `embedding_unavailable`. The embedding client ignores proxy variables and dials the endpoint directly, and with an API key set every endpoint must use HTTPS.

The Data Plane keeps at most two clients for each Surface database. One Surface database sees at most `2 × client.pool_size × Data Plane replicas` connections, so set `client.pool_size` explicitly.

## Result cache and result handles

Both features are off by default. Turn them on in the Data Plane configuration:

```yaml
dataplane:
  config:
    result_cache:
      enabled: true
    result_handles:
      enabled: true
      ttl: 15m
```

| Setting | Default | Meaning |
| --- | --- | --- |
| `result_cache.max_entry_bytes` | `262144` | The largest result the cache stores. |
| `result_handles.ttl` | `15m` | How long a handle lives. At most `24h`. A tool policy can override it. |
| `result_handles.inline_max_bytes` | `32768` | Results above this size become handles. |
| `result_handles.max_capture_bytes` | `8388608` | Results above this size come back whole. |
| `result_handles.preview_items`, `preview_bytes` | `3`, `2048` | The size of a handle stub's preview. |

These settings turn each feature on for the deployment. Each Gateway then has its own `cache` and `compression` settings, and a feature serves a Gateway only when both the deployment and the Gateway turn it on. Both need the Gateway's `databaseId` to name a registered database.

The result cache still needs a policy for each tool. Result handles apply to every eligible result on a Gateway that has them on, unless a tool's policy opts out. See [Turn the result cache and result handles on or off](/content/develop/ai/context-engine/context-gateway/manage-gateways.md#turn-the-result-cache-and-result-handles-on-or-off).

## Trust a private CA

Set `tls.caBundle` to a PEM bundle, or mount a single certificate under `/etc/ssl/certs` with the chart's `examples/certificates.yaml`. Restart both planes after you rotate a certificate.

## Configure security and tracing

`security.profile: fips` runs the Federal Information Processing Standards (FIPS)-oriented profile. Both planes then reject plaintext Redis URLs and disabled certificate verification, including in the registered databases.

Both planes serve Prometheus metrics at `/metrics`. Set `shared.config.opentelemetry.enable_tracing: true` and an OpenTelemetry Protocol (OTLP) endpoint for traces.

## Scale and schedule the planes

Each plane starts one replica. Set `replicaCount`, or turn on `autoscaling`, with `resources`, `nodeSelector`, `tolerations`, and `affinity` under `controlplane` and `dataplane`. The probes are chart-managed. Leave headroom for old and new pods during upgrades.

<!-- TODO: Add qualified production sizing and availability guidance for the launch release. -->
