---
Title: Configure self-managed Intent Router
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

This page describes how to configure self-managed Intent Router before you [deploy it](/content/operate/iris/intent-router/self-managed/deploy.md). Every value on this page sits under the `intent:` key of the suite's `iris-values.yaml`. The suite sets the tenant, license, tokens, and Identity Service connection from `global.iris`. The Secrets hold what shouldn't be in a values file: Redis connection URLs and embedding provider credentials.

Every install needs the Helm values, the storage Secret, and an embedding model, covered in the first three sections. The remaining sections are optional, and their defaults work for a first deployment. Use them to store Routers in customer databases, tune search and matching, adjust Router lifecycle timing, trust a private certificate authority, enable tracing, or scale the planes.

## Helm values

Every install sets the storage Secret, the inference Secret, and exactly one embedding model. The chart's `examples/intent.yaml` is a working starting point:

```yaml
intent:
  storage:
    existingSecret: intent-storage
  inference:
    existingSecret: intent-inference
    models:
      - provider: openai
        model: text-embedding-3-small
        dimensions: 1536
```

For the values the suite sets itself, see [Add the Intent Router values](/content/operate/iris/intent-router/self-managed/deploy.md#2-add-the-intent-router-values). For the tokens it generates, see [Credentials](/content/operate/iris/intent-router/self-managed/authentication.md#credentials).

## Storage Secret

One Secret holds a YAML overlay for each service, merged over the rendered configuration. Save each overlay as a file named after its Secret key:

| Secret key | Value that names it | Content |
| --- | --- | --- |
| `intent-controlplane-storage.yaml` | `storage.controlplaneKey` | `storage.metadata.urls`: Router records. |
| `intent-dataplane-storage.yaml` | `storage.dataplaneKey` | `storage.redis.urls`: intents, examples, and the per-Router vector indexes. `runtime.redis.urls`: the mailbox Redis, which is the control plane's metadata Redis. |

`intent-controlplane-storage.yaml`:

```yaml
storage:
  metadata:
    urls:
      - rediss://<metadata-user>:<metadata-password>@<metadata-host>:6379
```

`intent-dataplane-storage.yaml`:

```yaml
storage:
  redis:
    urls:
      - rediss://<dataplane-user>:<dataplane-password>@<dataplane-host>:6379
runtime:
  redis:
    urls:
      - rediss://<metadata-user>:<metadata-password>@<metadata-host>:6379
```

The Identity Service's metadata Redis is a [shared suite Secret](/content/operate/iris/self-managed/_index.md#2-create-the-shared-secrets), not part of this Secret.

In the mailbox Redis, the data plane reads and writes only the mailbox keys under `storage.keyPrefix`. Nothing else of the control plane's data is touched. Keep real URLs and passwords in the Secret, not in values files.

## Embedding models

`inference.models` lists the deployment's one embedding model as a public, immutable identity: `provider`, `model`, and `dimensions`. The control plane serves it from `GET /iris/v1/intent/models` as an `EMBEDDING` model that needs no caller credential, and refuses to create a Router with any other vector space.

For any provider other than `noop`, create the inference Secret named by `inference.existingSecret`. It holds one key, `inference.yaml`, with an `embedders_connection_details` entry for each provider. The entry's name must match `inference.models[].provider`. It carries the provider's `base_url`, `credentials`, and an optional `protocol`, but no model or dimensions:

```yaml
embedders_connection_details:
  openai:
    base_url: https://api.openai.com/v1
    credentials:
      type: static
      api_key: <openai-api-key>
```

```bash
kubectl -n <namespace-name> create secret generic intent-inference --from-file=inference.yaml
```

The `noop` provider needs no Secret. It is a local, word-based embedder that matches by shared words, not meaning, and is for development only. The chart refuses it unless you set `inference.allowLocalModels=true`.

## Customer databases

To let Routers live in a customer's own Redis, list the databases under `databases:` in both the control-plane and data-plane overlay keys, with the same IDs and the same URLs. An ID has 1 to 32 letters, digits, or hyphens, and isn't case-sensitive.

```yaml
databases:
  <database-id>:
    urls: ["rediss://:<password>@<customer-host>:6379"]
```

A Router then names one with `databaseId` when it is created, and never changes it. The control plane only checks the ID and never connects. Each database needs Search, and none may be the mailbox Redis. Changing a URL needs a restart: a changed Secret checksum rolls the pods. Set `controlplane.requireDatabase=true` to make every Router name a database.

A Router whose database is unreachable keeps waiting with the reason, then fails at the provisioning deadline. A serving Router answers `503` with `Retry-After` until the database returns.

## Search and match tuning

Tune `dataplane.search` for index recall and memory: `hnsw.m`, `hnsw.ef_construction`, `hnsw.ef_runtime`, `query_timeout`, `ready_cache_ttl`, and `verify_interval`. The Hierarchical Navigable Small World (HNSW) values shape recall and memory, never correctness.

`dataplane.limits` and `dataplane.match` are copied verbatim, with snake_case keys, into the data-plane configuration. Set fractional values such as `dataplane.match.default_threshold` from a values file, because `--set` turns `0.8` into a string. Each key in this table sits under `dataplane.`:

| Key | Default | Meaning |
| --- | --- | --- |
| `limits.max_intents_per_router` | 1000 | Intents a Router can hold. |
| `limits.max_intents_per_batch` | 100 | Intents in one bulk request. |
| `limits.max_examples_per_batch` | 5000 | Examples across one bulk request. |
| `limits.max_examples_per_add` | 256 | Examples in one add-examples request. It can't usefully exceed 256, the per-intent ceiling. |
| `match.scan_k` | 50 | Nearest examples read before grouping by intent. Between 1 and 1000. |
| `match.aggregation` | `min` | How an intent's example distances combine: `min` scores an intent as its closest example, `avg` as the average of its examples among the nearest. |
| `match.default_max_intents` | 5 | Intents a match returns when the request sets no `limit`. |
| `match.max_intents_cap` | 50 | The largest `limit` a match accepts. |
| `match.default_threshold` | 0.7 | The minimum score for a Router that has none. Every Router created through the control plane carries its own `minScore`, 0.7 unless set, so this rarely applies. |

## Router lifecycle

| Value | Default | Meaning |
| --- | --- | --- |
| `storage.maxRoutersPerTenant` | 128 | Routers the tenant can hold. Creating more fails with `409`. |
| `controlplane.reconcile.interval` | `5s` | How often the control plane reconciles Routers with the data plane's status. |
| `controlplane.reconcile.provisioningDeadline` | `10m` | How long a new Router can stay `PROVISIONING` before it fails. |
| `dataplane.pollInterval` | `2s` | How often the data plane reads the mailbox for Router changes. |
| `dataplane.startupBudget` | `20s` | How long the data plane's first convergence pass can run before it opens its listener. At most `40s`, because the liveness probe restarts the pod 50 seconds after start. Routers the pass doesn't reach are picked up by later passes. |

A Router change reaches the data plane within about one poll interval.

## Trust a private certificate authority

Set `global.tls.caCertSecret` to a Secret that holds additional certificate authority (CA) certificates. Every container mounts it at `/etc/ssl/custom`, and `SSL_CERT_DIR` points there. Set `tls.caCertSecretChecksum` so the pods roll when the Secret changes.

## Tracing

Set `tracing.enabled` and `tracing.otlpGRPCEndpoint` to send spans to your OpenTelemetry collector over the OpenTelemetry Protocol (OTLP). The exporter uses plaintext gRPC, so use a trusted local hop.

## Scale and schedule the planes

The control plane and data plane scale independently. Set `replicaCount`, `resources`, `nodeSelector`, `tolerations`, and `affinity` for each. Scale the Identity Service under `identityService:`. The data plane carries the matching load, so scale it first.

The suite runs two data-plane replicas and one control-plane replica by default, and fixes the rollout strategy and PodDisruptionBudgets. See [Availability](/content/operate/iris/self-managed/_index.md#availability).
