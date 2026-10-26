---
Title: Configure self-managed Redis Intent Router
alwaysopen: false
categories:
- docs
- operate
- iris
description: Set the Helm values, storage Secret, embedding models, customer databases, search tuning, and limits for Redis Intent Router.
linkTitle: Configuration
weight: 30
hideListLinks: true
---

Prepare the Helm values and the Secrets they reference before you [deploy the chart](/content/operate/iris/intent-router/self-managed/deploy.md).

## Helm values

Set these values for every install:

| Value | Meaning |
| --- | --- |
| `tenantId` | The one tenant this installation serves. Required. |
| `storage.existingSecret` | The Secret that holds the Redis connection overlays. Required. |
| `license.existingSecret` | The Secret that holds the license. Required. |
| `inference.models` | The embedding model the deployment offers. Required. |
| `controlplane.image`, `dataplane.image`, `identityService.image` | An explicit `tag` for each image. The repositories default to `redislabs/iris-intent-router-control`, `redislabs/iris-intent-router-data`, and `redislabs/iris-identity-service`. |
| `controlplane.adminToken`, `controlplane.internalToken` | The control plane's tokens. |
| `identityService.controlToken`, `identityService.runtimeToken` | The Identity Service's tokens. |

A minimal values file looks like this:

```yaml
tenantId: acme

controlplane:
  image:
    repository: redislabs/iris-intent-router-control
    tag: <tag>
  adminToken:
    existingSecret: intent-controlplane-admin
  internalToken:
    existingSecret: intent-controlplane-internal

dataplane:
  allowInsecureIdentityService: true
  image:
    repository: redislabs/iris-intent-router-data
    tag: <tag>

identityService:
  image:
    repository: redislabs/iris-identity-service
    tag: <tag>
  controlToken:
    existingSecret: intent-identity-control
  runtimeToken:
    existingSecret: intent-identity-runtime

license:
  existingSecret: intent-license

storage:
  existingSecret: intent-storage

inference:
  existingSecret: intent-inference
  models:
    - provider: openai
      model: text-embedding-3-small
      dimensions: 1536
```

The bundled Identity Service speaks plain HTTP inside the cluster, and the data plane rejects an `http://` introspection URL. Rendering fails until you choose: set `dataplane.identityServiceBaseURL` to an `https://` endpoint, or set `dataplane.allowInsecureIdentityService=true` to accept cleartext introspection on the pod network.

## Storage Secret

One Secret holds a YAML overlay for each service, merged over the rendered configuration. Name each key with `storage.controlplaneKey`, `storage.dataplaneKey`, and `storage.identityServiceKey`.

| Key | Content |
| --- | --- |
| Control plane | `storage.metadata.urls`: Router records. |
| Data plane | `storage.redis.urls`: intents, examples, and the per-Router vector indexes. `runtime.redis.urls`: the mailbox Redis, which is the control plane's metadata Redis. |
| Identity Service | `metadata.urls`. |

```yaml
intent-controlplane-storage.yaml: |
  storage:
    metadata:
      urls:
        - rediss://<metadata-user>:<metadata-password>@<metadata-host>:6379
intent-dataplane-storage.yaml: |
  storage:
    redis:
      urls:
        - rediss://<dataplane-user>:<dataplane-password>@<dataplane-host>:6379
  runtime:
    redis:
      urls:
        - rediss://<metadata-user>:<metadata-password>@<metadata-host>:6379
identity-service-metadata.yaml: |
  metadata:
    urls:
      - rediss://<identity-user>:<identity-password>@<metadata-host>:6379
```

The data plane reads and writes only keys under `<storage.keyPrefix>:runtime` in the mailbox Redis. Nothing else of the control plane's data is touched. Keep real URLs and passwords in the Secret, not in values files.

## Embedding models

`inference.models` lists the deployment's one embedding model as a public, immutable identity: `provider`, `model`, and `dimensions`. The control plane serves it from `GET /iris/v2/intent/models` as an `EMBEDDING` model that needs no caller credential, and refuses to create a Router with any other vector space.

For any provider other than `noop`, `inference.existingSecret` must carry `embedders_connection_details`. The data plane mounts it. Each entry has a `base_url`, `credentials`, and an optional `protocol`, and serves the Routers whose `vectorSpace.provider` has that name. Keep the identity in the Secret identical to the one in `inference.models`.

The `noop` provider needs no entry. It returns placeholder vectors and is for development only.

## Customer databases

To let Routers live in a customer's own Redis, list the databases under `databases:` in both the control plane and data plane overlay keys, with the same IDs and the same URLs. An ID has 1 to 32 letters, digits, or hyphens, and isn't case-sensitive.

```yaml
databases:
  customer-a:
    urls: ["rediss://:<password>@redis-a.example:6379"]
```

A Router then names one with `databaseId` when it is created, and never changes it. The control plane only checks the ID and never connects. Each database needs Search, and none may be the mailbox Redis. Changing a URL needs a restart: a changed Secret checksum rolls the pods. Set `controlplane.requireDatabase=true` to make every Router name a database.

A Router whose database is unreachable keeps waiting with the reason, then fails at the provisioning deadline. A serving Router answers `503` with `Retry-After` until the database returns.

## Search and match tuning

Tune `dataplane.search` for index recall and memory: `hnsw.m`, `hnsw.ef_construction`, `hnsw.ef_runtime`, `query_timeout`, `ready_cache_ttl`, and `verify_interval`. The HNSW values shape recall and memory, never correctness.

`dataplane.limits` and `dataplane.match` are copied verbatim, with snake_case keys, into the data-plane configuration. Set fractional values such as `match.default_threshold` from a values file, because `--set` turns `0.8` into a string.

| Key | Default | Meaning |
| --- | --- | --- |
| `limits.max_intents_per_router` | 1000 | Intents a Router can hold. |
| `limits.max_intents_per_batch` | 100 | Intents in one bulk request. |
| `limits.max_examples_per_batch` | 5000 | Examples across one bulk request. |
| `limits.max_examples_per_add` | 256 | Examples in one add-examples request. |
| `match.scan_k` | 50 | Nearest examples read before grouping by intent. Between 1 and 1000. |
| `match.aggregation` | `min` | How an intent's example distances combine: `min` scores an intent as its closest example, `avg` as the average of its examples among the nearest. |
| `match.default_max_intents` | 5 | Intents a match returns when the request sets no `limit`. |
| `match.max_intents_cap` | 50 | The largest `limit` a match accepts. |
| `match.default_threshold` | 0.7 | The minimum score when no request, intent, or Router sets one. |

## Router lifecycle

| Value | Default | Meaning |
| --- | --- | --- |
| `storage.maxRoutersPerTenant` | 128 | Routers the tenant can hold. Creating more fails with `409`. |
| `controlplane.reconcile.interval` | `5s` | How often the control plane reconciles Routers with the data plane's status. |
| `controlplane.reconcile.provisioningDeadline` | `10m` | How long a new Router can stay `PROVISIONING` before it fails. |
| `dataplane.pollInterval` | `2s` | How often the data plane reads the mailbox for Router changes. |

A Router change reaches the data plane within about one poll interval.

## Trust a private CA

Set `tls.caCertSecret` to a Secret that holds additional CA certificates. Every container mounts it at `/etc/ssl/custom`, and `SSL_CERT_DIR` points there. Set `tls.caCertSecretChecksum` so the pods roll when the Secret changes.

## FIPS and tracing

Set `security.profile: fips` to select the FIPS runtime. It requires explicit HTTPS peers: `dataplane.identityServiceBaseURL` and, with the bundled Identity Service, `identityService.controlPlaneBaseURL`. Use `rediss://` URLs in the storage Secret, including `runtime.redis.urls`. Rendering rejects a FIPS release without them, and FIPS never allows cleartext Identity Service transport.

Set `tracing.enabled` and `tracing.otlpGRPCEndpoint` to send spans to your OpenTelemetry collector. The exporter uses plaintext gRPC, so use a trusted local hop.

## Scale and schedule the planes

The control plane, data plane, and Identity Service scale independently. Set `replicaCount`, `resources`, `nodeSelector`, `tolerations`, and `affinity` for each in the chart values. The data plane carries the matching load, so scale it first.
