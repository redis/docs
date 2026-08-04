---
Title: Data Plane configuration
alwaysopen: false
categories:
- docs
- develop
- ai
description: Configure the Redis Agent Memory Data Plane for static stores or Control Plane managed stores.
linkTitle: Data Plane configuration
weight: 30
hideListLinks: true
---

The Data Plane reads `memory-dataplane.config.yaml` from a Kubernetes Secret.
Use one store mode: static stores or Control Plane managed stores.

## Shared settings

The following settings are common to both deployment modes:

| Setting | Purpose |
| --- | --- |
| `server` | Data Plane bind address and port. |
| `license.license_path` | Path where the license Secret is mounted. |
| `request_region` | Region used for background work routing. |
| `background_jobs.redis` | Job Redis connection used by background workers. |
| `embedders_connection_details` | Embedding provider endpoint and credentials. |
| `dataplane_client` | Worker callback client configuration. |
| `promote_session_memory` | Promotion strategy and LLM connection used by workers. |

## Static stores example

Use this config when stores are declared directly under `metadata.stores`.

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
      - redis://redis-jobs:6379
    worker_regions:
      - eu1

metadata:
  stores:
    # metadata.stores is a map keyed by store ID.
    "00000000000000000000000000000001":
      urls:
        - redis://redis-store:6379
      extraction_strategy: instruct
      long_term_memory:
        embedding_provider: openai
        embedding_model: text-embedding-3-large
        embedding_dimensions: 3072

auth:
  method: none

embedders_connection_details:
  openai:
    base_url: https://api.openai.com
    credentials:
      type: static
      api_key: "<embedding-api-key>"

dataplane_client:
  base_url: http://redis-agent-memory:9000
  auth:
    disabled: true

promote_session_memory:
  strategies:
    instruct:
      llm:
        provider: openai
        endpoint:
          base_url: https://api.openai.com/v1
          auth_format: bearer
        credentials:
          type: static
          api_key: "<promotion-llm-api-key>"
        models:
          default_chat_model: gpt-4o
```

## Control Plane managed stores example

Use this config when the Data Plane serves stores created by the Control Plane.
The Data Plane and Control Plane must point to the same Metadata Redis namespace
and Store Redis.

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
      - redis://redis-jobs:6379
    worker_regions:
      - eu1

metadata:
  source: live
  live:
    urls:
      - redis://redis-meta:6379
    namespace: iris:memory
    store_db:
      urls:
        - redis://redis-store:6379

auth:
  method: none

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

dataplane_client:
  base_url: http://redis-agent-memory:9000
  auth:
    disabled: true

promote_session_memory:
  strategies:
    instruct:
      llm:
        provider: openai
        endpoint:
          base_url: https://api.openai.com/v1
          auth_format: bearer
        credentials:
          type: static
          api_key: "<promotion-llm-api-key>"
        models:
          default_chat_model: gpt-4o
```

This Control Plane managed example leaves Data Plane auth disabled at the Agent
Memory layer. To use Agent Memory agent keys, set `auth.method: agent_key` and
follow [Authentication and authorization]({{< relref "/develop/ai/context-engine/agent-memory/self-managed/authentication" >}}).

## Secret key

Create the Data Plane config Secret with the key
`memory-dataplane.config.yaml`:

```bash
kubectl -n <namespace-name> create secret generic ram-config \
  --from-file=memory-dataplane.config.yaml=./memory-dataplane.config.yaml
```
