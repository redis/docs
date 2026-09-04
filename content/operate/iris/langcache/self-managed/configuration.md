---
Title: Configuration
alwaysopen: false
categories:
- docs
- operate
- iris
description: Configure the LangCache Data Plane, Control Plane, and Identity Service through Helm values and config overlay Secrets.
linkTitle: Configuration
weight: 20
hideListLinks: true
---

The `langcache` chart splits configuration into two layers for the Data
Plane, the Control Plane, and (in bundled mode) the Identity Service:

- **Non-secret structure**, set as Helm values (`dataplane.configData`,
  `controlplane.configData`, `identityService.bundled.configData`) and
  rendered into a ConfigMap by default.
- **Redis URLs, the database registry, and the embedding credential**,
  which never go in `values.yaml` or a rendered ConfigMap. Each component
  reads its own pre-created overlay Secret, deep-merged over its rendered
  base config at container startup (later files win — the chart passes each
  overlay as an additional `--config` flag).

You always create the overlay Secrets yourself; the chart only tells each
component where to mount and read them.

## Data Plane overlay

Create `dp-overlay.yaml`. Provide Metadata Redis and, when
`dataplane.embedding.credentials.type: static`, the embedding credential.
The Data Plane has no database registry of its own — it resolves each
cache's Cache Redis target from the `databaseUrls` the Control Plane already
persisted in Metadata Redis at cache-creation time.

```yaml
metadata:
  urls:
    - rediss://default:<password>@metadata-redis:6380

embedding:
  credentials:
    api_key: "<embedding-api-key>"
```

```bash
kubectl -n <namespace-name> create secret generic dp-overlay \
  --from-file=overlay.yaml=./dp-overlay.yaml
```

Point the chart at it, alongside the public (non-secret) embedding facts:

```yaml
dataplane:
  secrets:
    secretName: dp-overlay
  embedding:
    provider: openai
    endpoint:
      baseURL: https://api.openai.com/v1
    credentials:
      type: static
    models:
      defaultEmbeddingModel: text-embedding-3-small
      dimensions: 1536
```

## Control Plane overlay

Create `cp-overlay.yaml`. Provide the same Metadata Redis as the Data Plane,
plus the `databases` registry — one entry per Cache Redis target, keyed by a
logical ID you choose. The Control Plane never receives an embedding
credential; it only needs the public provider/model/dimensions contract
(set as `controlplane.configData`, matching `dataplane.embedding`).

```yaml
metadata:
  urls:
    - rediss://default:<password>@metadata-redis:6380

databases:
  cache-primary:
    name: cache-primary
    urls:
      - rediss://default:<password>@cache-primary:6380
```

```bash
kubectl -n <namespace-name> create secret generic cp-overlay \
  --from-file=overlay.yaml=./cp-overlay.yaml
```

```yaml
controlplane:
  secrets:
    secretName: cp-overlay
  configData:
    profile: prod
    embedders:
      openai:
        models:
          - model: text-embedding-3-small
            dimensions: 1536
```

The `databases` map must use the same logical IDs your operators will pass
as `databaseId` when creating caches through the Control Plane API. The
`embedders` block must describe exactly one provider with exactly one model
— the embedding contract that cache creation and the Data Plane's
`dataplane.embedding` values must agree on exactly. It must not set
`authorized: true`; on-prem cache creation cannot accept per-cache embedding
credentials.

## Identity Service metadata (bundled mode only)

When `identityService.mode: bundled` (the default), the bundled Identity
Service needs its own Metadata Redis connection — it can be the same Redis
instance as the Control Plane's Metadata Redis, in a separate namespace.

```yaml
metadata:
  urls:
    - rediss://default:<password>@metadata-redis:6380
```

```bash
kubectl -n <namespace-name> create secret generic ids-metadata \
  --from-file=metadata.yaml=./ids-metadata.yaml
```

```yaml
identityService:
  mode: bundled
  bundled:
    metadata:
      existingSecret: ids-metadata
```

If you use `identityService.mode: external` instead, there is no Identity
Service overlay to create here; see
[Authentication and authorization]({{< relref "/operate/iris/langcache/self-managed/authentication" >}}).

## Multiple overlay Secrets

`dataplane.secrets.additionalSecrets` and
`controlplane.secrets.additionalSecrets` accept a list of extra pre-created
Secret names, layered in order after the primary overlay (later wins). Use
this to split, for example, Redis connection details from the embedding
credential across separately rotated Secrets.

## Treat overlay content as sensitive

Store `dp-overlay.yaml`, `cp-overlay.yaml`, and `ids-metadata.yaml` outside
your values files and outside git, the same as any other credential
material.
