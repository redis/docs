---
Title: Configuration
alwaysopen: false
categories:
- docs
- operate
- iris
description: Configure the Redis Agent Memory Data Plane, Control Plane, and Identity Service from Helm values, or bring your own configuration files.
linkTitle: Configuration
weight: 30
hideListLinks: true
aliases:
- /develop/ai/context-engine/agent-memory/self-managed/data-plane-configuration/
- /operate/iris/agent-memory/self-managed/data-plane-configuration/
---

The chart renders the Data Plane, Control Plane, and Identity Service configuration from Helm values
(`config.render: true`). Credentials stay out of the values, in the overlay Secret. For a complete
example, see the values in [step 3 of Deploy](/content/operate/iris/agent-memory/self-managed/deploy.md#3-create-ram-valuesyaml).

To supply complete configuration files in your own Secrets instead, see
[Bring-your-own (BYO) configuration](#bring-your-own-byo-configuration).

## Where each setting goes

| Values | Configures |
| --- | --- |
| `shared` | Settings common to the Data Plane and the Control Plane, such as `databases`. The chart merges them under `memory` and `controlplane.configData`. |
| `memory` | The Data Plane and worker configuration file. |
| `controlplane.configData` | The Control Plane configuration file. |
| `identityService.*` | The Identity Service. `identityService.metadata.existingSecret` names the Secret with its Metadata Redis URL. |
| Overlay Secret (`secrets.secretName`, key `overlay.yaml`) | `metadata.urls`, `metadata.namespace`, `databases."1".urls`, `background_jobs.redis.urls`, and provider `api_key` values. The Data Plane, the workers, and the Control Plane all read it. |

## Data Plane settings

Data Plane settings go under `memory`, or at the top level of a BYO Data Plane configuration file.

| Setting | Purpose |
| --- | --- |
| `metadata.urls` | Required. Metadata Redis, which holds store records. `metadata.namespace` sets the key namespace (default `iris:memory`). |
| `databases` | Required. Store Redis, as `databases."1".urls`. |
| `embedding.models.default_embedding_model`, `embedding.models.dimensions` | Required. The embedding model and its vector size. The Control Plane's `embedding.dimensions` must match. |
| `auth` | Data Plane authentication. Defaults to `agent_key`. |
| `inference_providers` | Required when any `llm` block is set. Each entry holds a provider's `endpoint`. |
| `server` | Data Plane bind address and port. |
| `license.license_path` | Path where the license Secret is mounted. |
| `request_region` | Region used for background work routing. |
| `background_jobs.redis` | Job Redis connection used by background workers. |
| `embedders_connection_details` | Embedding provider endpoint and credentials. |
| `dataplane_client` | Worker callback client configuration. |
| `promote_session_memory` | Promotion strategy and LLM connection used by workers. |

An `llm` block names its provider with `llm.provider`, which must match an `inference_providers`
entry. The endpoint goes in `inference_providers.<name>.endpoint`, not in the `llm` block.

In the chart-rendered configuration, the chart writes the agent-key introspection settings for you.
Leave `auth.method` unset to keep the `agent_key` default.

## Bring-your-own (BYO) configuration

With BYO configuration, you supply each complete configuration file in your own Secret, and the
chart injects nothing into it. Add the keys the chart would otherwise write:

- **Data Plane**: the `auth.agent_keys.introspection` block.
- **Control Plane**: `auth.internal_token.token_file: /etc/controlplane-onprem/internal/token`.

The Data Plane defaults to `agent_key` whenever no auth method is set. A BYO Data Plane configuration
without `auth` therefore needs the `auth.agent_keys.introspection` block, or `auth.method: none`.
The `MEM_AUTH_METHOD` environment variable overrides the method.

### Data Plane configuration file

Create `memory-dataplane.config.yaml`:

```yaml
server:
  host: 0.0.0.0
  port: 9000

license:
  license_path: /etc/redis-agent-memory/license
default_extraction_strategy: instruct

request_region:
  default: eu1

background_jobs:
  redis:
    enabled: true
    queue_prefix: ram
    urls:
      - redis://<job-redis-host>:6379
    worker_regions:
      - eu1

metadata:
  urls:
    - redis://<metadata-redis-host>:6379
  namespace: iris:memory

databases:
  "1":
    urls:
      - redis://<store-redis-host>:6379

auth:
  agent_keys:
    introspection:
      base_url: http://redis-agent-memory-identity-service:9200
      allow_insecure_transport: true
      product: memory
      credential:
        token_file: /etc/identity-service/runtime/memory-dp/token
  worker_identity:
    enabled: true
    issuer: <service-account-issuer>
    jwks_uri: https://kubernetes.default.svc/openid/v1/jwks
    audience:
      - redis-agent-memory
    subjects:
      - subject: "system:serviceaccount:<namespace-name>:redis-agent-memory-worker"
        user_id: redis-agent-memory-worker
        roles:
          - operator
        resources:
          "mem-store:*":
            permissions:
              - write

embedding:
  provider: openai
  models:
    default_embedding_model: text-embedding-3-large
    dimensions: 3072

embedders_connection_details:
  openai:
    base_url: https://api.openai.com
    credentials:
      type: static
      api_key: "<embedding-api-key>"

inference_providers:
  openai:
    endpoint:
      base_url: https://api.openai.com/v1
      timeout: 30s
      auth_format: bearer

dataplane_client:
  base_url: http://redis-agent-memory:9000
  auth:
    disabled: false
    type: service_account_token
    token_file: /var/run/secrets/redis-agent-memory-worker/token

promote_session_memory:
  strategies:
    instruct:
      llm:
        provider: openai
        credentials:
          type: static
          api_key: "<promotion-llm-api-key>"
        models:
          default_chat_model: gpt-4o
```

The `auth.worker_identity` and `dataplane_client.auth` settings let workers call the Data Plane
under agent-key authentication. They need `workerAuth.enabled: true` in the values, and the platform
setup in [worker identity](/content/operate/iris/agent-memory/self-managed/deploy.md#prepare-worker-identity-for-your-platform).

Create the Data Plane config Secret with the key `memory-dataplane.config.yaml`:

```bash
kubectl -n <namespace-name> create secret generic ram-config \
  --from-file=memory-dataplane.config.yaml=./memory-dataplane.config.yaml
```

### Control Plane configuration file

Create `controlplane-onprem.config.yaml`:

```yaml
profile: prod

auth:
  type: admin-token
  admin_token:
    token_file: /etc/controlplane-onprem/admin/token
  internal_token:
    token_file: /etc/controlplane-onprem/internal/token

license:
  license_path: /etc/redis-agent-memory/license

metadata:
  urls:
    - redis://<metadata-redis-host>:6379
  namespace: iris:memory

databases:
  "1":
    urls:
      - redis://<store-redis-host>:6379

embedding:
  dimensions: 3072
```

The Control Plane only needs `embedding.dimensions`, to create each store's vector index. Configure
the embedding provider, model, and credentials in the Data Plane configuration.

Create the Control Plane config Secret:

```bash
kubectl -n <namespace-name> create secret generic ram-controlplane-config \
  --from-file=controlplane-onprem.config.yaml=./controlplane-onprem.config.yaml
```

### Helm values

In `ram-values.yaml`, replace `config.render`, `shared`, `memory`, `controlplane.config.render`, and
`controlplane.configData` with the two Secrets. The chart fails at install time if both
`config.existingSecret` and `config.render` are set.

```yaml
config:
  existingSecret: ram-config
controlplane:
  config:
    existingSecret: ram-controlplane-config
```
