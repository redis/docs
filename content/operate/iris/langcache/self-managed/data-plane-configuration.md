---
Title: Data Plane configuration
alwaysopen: false
categories:
- docs
- operate
- iris
description: Configure the LangCache Data Plane for static caches or Control Plane managed caches.
linkTitle: Data Plane configuration
weight: 30
hideListLinks: true
---

The Data Plane reads `dataplane.config.yaml`. The published `langcache` chart
provides this content inline under the `config` Helm value, which the chart
renders into a ConfigMap (not a Secret) — see
[Deploy with static caches]({{< relref "/operate/iris/langcache/self-managed/deploy-static" >}}).
Use one cache mode: static caches or Control Plane managed caches. The two
modes use different Data Plane binaries and config shapes.

## Shared settings

| Setting | Purpose |
| --- | --- |
| `server.port` | Data Plane bind port. |
| `client_side_cache` | In-memory response caching for repeated lookups. |
| `client_pool` | Redis client pool sizing. |
| `profile` | `prod`, `dev`, or `test`. |

## Static caches example

Use this config when caches are declared directly under `metadata.caches`.
This is the mode the published `langcache` Helm chart deploys today.

```yaml
server:
  port: 8080

profile: prod

metadata:
  loader: static
  cache_ttl: 1m
  caches:
    # metadata.caches is a list; each entry is one cache.
    - id: my-cache
      urls:
        - redis://cache-redis:6379
      index: idx:my-cache
      model:
        type: openai
        name: text-embedding-3-large
        dimensions: 3072
        # key: "<embedding-api-key>"   # optional per-cache override
      attributes: []
      default_ttl: 60000
      default_search_threshold: 0.9
      search_strategies:
        default_strategies:
          - semantic

embeddings:
  openai:
    default:
      base_url: https://api.openai.com

client_side_cache:
  enabled: true
  default_ttl: 1m
  max_items: 30000

client_pool:
  enable: true
  max_size: 10000
  client_acquisition_timeout_ms: 2000
```

Static caches carry Redis URLs and embedding settings directly in config.
Data Plane auth for this mode is disabled by default; see
[Authentication and authorization]({{< relref "/operate/iris/langcache/self-managed/authentication" >}})
to enable the legacy per-cache token auth.

Provision the cache's RediSearch index before or during first start. The
`provision-cache-index` binary shipped in the Data Plane image reads the same
config and creates or repairs the index for every entry in `metadata.caches`:

```bash
provision-cache-index --config=/etc/langcache/dataplane.config.yaml
```

The chart can run this automatically as an init container with
`initProvisioner.enabled: true`.

## Control Plane managed caches example

Use this config when the Data Plane serves caches created by the Control
Plane. This mode uses the on-prem-hardened Data Plane binary, requires
Metadata Redis, and only supports agent-key authentication through the shared
Identity Service.

```yaml
server:
  port: 9000

profile: prod

metadata:
  urls:
    - redis://redis-meta:6379
  cache_ttl: 1m

databases:
  cache-primary:
    name: cache-primary
    urls:
      - redis://cache-primary:6379

auth:
  agent_keys:
    enabled: true
    product: langcache
    introspection:
      base_url: https://iris-identity-service:9200
      product: langcache
      credential:
        token_file: /etc/introspection/token

embedding:
  provider: openai
  endpoint:
    base_url: https://api.openai.com
  models:
    default_embedding_model: text-embedding-3-large
    dimensions: 3072
  credentials:
    type: static
    api_key: "<embedding-api-key>"

license:
  license_path: /etc/license/license
```

The `databases` map must use the same logical `<id>` keys (here,
`cache-primary`) as the Control Plane's `controlplane-onprem.config.yaml`, so
both processes resolve `databaseId` to the same Cache Redis target. The
`embedding` block must match the Control Plane's configured provider, model,
and dimensions exactly; Control Plane managed caches cannot select a
different embedding model or supply per-cache credentials. `embedding.endpoint.base_url`
is required for the OpenAI-compatible provider; the Data Plane fails startup
without it.

For the Identity Service introspection settings, see
[Authentication and authorization]({{< relref "/operate/iris/langcache/self-managed/authentication" >}}).

## Config storage

The published `langcache` chart takes `dataplane.config.yaml` as the inline
`config` Helm value and renders it into a Kubernetes ConfigMap, not a Secret.
Because this config commonly contains embedding provider credentials and
Redis URLs with embedded credentials, treat the values file itself (and any
CI/CD pipeline that renders it) as sensitive, the same as you would a
Secret. If your security policy requires Secret-backed storage for this
content instead, mount a Secret through the chart's generic
`volumes`/`volumeMounts` values and override `args` to point at the mounted
path instead of the default `/etc/langcache/dataplane.config.yaml`.

The chart automatically restarts Data Plane pods when the rendered
ConfigMap content changes on `helm upgrade`; no separate checksum value is
needed for `config` itself.
