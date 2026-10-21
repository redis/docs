---
Title: Configure background FAQ extraction
alwaysopen: false
categories:
- docs
- operate
- iris
description: Connect Redis Agent Memory and run the Agent Playbooks extraction worker.
linkTitle: Background FAQ extraction
weight: 85
hideListLinks: true
---

Background extraction reads eligible Redis Agent Memory sessions and creates frequently asked question (FAQ) proposals for human review. It does not publish FAQs or create skills.

The capability is optional. It requires Redis Agent Memory in the same tenant, a persistent queue, a generation model, and workload identity between the two products.

## Plan the connection

Prepare these values before enabling extraction:

| Value | Purpose |
| --- | --- |
| Redis Agent Memory store ID | Source store for one extraction binding. The store tenant must match `tenantId`. |
| ServiceAccount issuer and JSON Web Key Set (JWKS) URI | Validate projected control-plane and worker tokens. |
| Redis Agent Memory data-plane URL | Let the worker read sessions. |
| Redis Agent Memory Identity Service URL | Let the Playbook control plane prepare source grants. |
| Queue Redis URL | Store extraction jobs. Use persistence, `noeviction`, and capacity monitoring. Do not reuse Playbook metadata or content Redis. |
| Generation provider and model | Extract and consolidate FAQ candidates. These credentials are separate from the embedding configuration. |

Use certificate-verified endpoints. Both data planes must reach the issuer's JWKS. Configure network policy for the control plane, worker, Redis, identity, and model-provider paths.

## Configure Redis Agent Memory trust

Redis Agent Memory must trust the Playbook worker for store reads and the Playbook control plane for grant preparation. With release `playbook`, namespace `<namespace-name>`, and `fullnameOverride: playbook`, the subjects are:

- `system:serviceaccount:<namespace-name>:playbook-worker`
- `system:serviceaccount:<namespace-name>:playbook-controlplane`

Add these settings to the Redis Agent Memory values. Merge the list entries with its existing worker identities, grant policies, and runtime credentials:

```yaml
memory:
  auth:
    service_subjects:
      enabled: true
      issuer: https://<service-account-issuer>
      jwks_uri: https://<service-account-jwks-uri>
      audience:
        - api://memory-dp
      subjects:
        - system:serviceaccount:<namespace-name>:playbook-worker

identityService:
  subjectGrants:
    allowed:
      - product: memory
        resourceType: mem-store
        actions:
          - read
  controlAuth:
    workloadIdentity:
      enabled: true
      issuer: https://<service-account-issuer>
      jwks_uri: https://<service-account-jwks-uri>
      audience:
        - api://memory-identity-control
      subjects:
        - subject: system:serviceaccount:<namespace-name>:playbook-controlplane
          tenant: <tenant-id>
          roles:
            - subject_grant_admin
```

The Redis Agent Memory data-plane runtime credential must also allow `subject-grant-lookup`. For example, preserve its current settings and include both runtime operations:

```yaml
identityService:
  runtime:
    serviceCredentials:
      - name: memory-dp
        subject: memory-dp
        secretKey: token
        autoGenerate: true
        allowedOperations:
          - api-key-introspect
          - subject-grant-lookup
        allowedProducts:
          - memory
```

See the [Redis Agent Memory authentication guide]({{< relref "/operate/iris/agent-memory/self-managed/authentication" >}}) before changing an existing authentication configuration.

## Configure Playbooks extraction

Save `playbook-extraction-values.yaml`. Start with the worker disabled:

```yaml
extraction:
  enabled: true
  sources:
    - tenant_id: <tenant-id>
      store_id: <memory-store-id>
  connection:
    enabled: true
    issuer: https://<service-account-issuer>
    jwksURI: https://<service-account-jwks-uri>
    identityServiceBaseURL: https://<memory-identity-service-host>

worker:
  enabled: false
  replicaCount: 1
  region: <region>
  existingSecret: playbook-extraction-worker
  sourceURL: https://<memory-data-plane-host>
  targetURL: https://<playbook-data-plane-host>
  scanConcurrency: 1
  extractConcurrency: 1
```

The chart adds its worker subject to the connection automatically. Use `extraction.connection.workerSubjects` only for additional worker identities. To discover stores from Redis Agent Memory instead of listing `extraction.sources`, configure `ramControlPlaneBaseURL` and its workload identity. Do not configure both discovery methods.

Save the private worker configuration as `worker.yaml`:

```yaml
inference_providers:
  private-generation:
    protocol: openai
    endpoint:
      base_url: https://<generation-provider-host>/v1
      generation_api: chat_completions
    http_client:
      timeout: 30s
      max_retry_attempts: 0

worker:
  redis:
    urls:
      - rediss://<queue-user>:<queue-password>@<queue-host>:6379
  llm:
    provider: private-generation
    models:
      default_chat_model: <generation-model-name>
    reasoning_mappings:
      - model_patterns:
          - <generation-model-name>
        values:
          low:
            reasoning_effort: low
    credentials:
      type: static
      api_key: <generation-provider-api-key>
```

Create the Secret and apply the public overlay:

```bash
kubectl -n "$PLAYBOOK_NAMESPACE" create secret generic playbook-extraction-worker \
  --from-file=worker.yaml=./worker.yaml

helm upgrade playbook redis-ai/redis-agent-playbook \
  --version "$PLAYBOOK_CHART_VERSION" \
  --namespace "$PLAYBOOK_NAMESPACE" \
  -f playbook-values.yaml \
  -f playbook-extraction-values.yaml \
  --wait --timeout 10m
```

## Create and enable a binding

Create a disabled binding for the source store:

```bash
jq -n --arg store '<memory-store-id>' '{
  source: {
    type: "redis_agent_memory",
    storeId: $store
  },
  job: {
    type: "faq"
  }
}' > binding-request.json

curl --fail-with-body --silent --show-error \
  -X POST "$PLAYBOOK_CONTROL_URL/v1/playbooks/$PLAYBOOK_ID/extraction/bindings" \
  -H "Authorization: Bearer $PLAYBOOK_ADMIN_TOKEN" \
  -H 'Content-Type: application/json' \
  --data-binary @binding-request.json > binding.json

export BINDING_ID="$(jq -er '.bindingId' binding.json)"
```

Read the binding until `status` is `ready`. A ready binding confirms store ownership and prepared source and destination grants. It does not confirm worker or model connectivity.

Set `worker.enabled: true` in `playbook-extraction-values.yaml`, apply the values again, and verify the worker:

```bash
helm upgrade playbook redis-ai/redis-agent-playbook \
  --version "$PLAYBOOK_CHART_VERSION" \
  --namespace "$PLAYBOOK_NAMESPACE" \
  -f playbook-values.yaml \
  -f playbook-extraction-values.yaml \
  --wait --timeout 10m
kubectl -n "$PLAYBOOK_NAMESPACE" rollout status deploy/playbook-worker
```

Get the binding again, then enable its current version:

```bash
curl --fail-with-body --silent --show-error \
  "$PLAYBOOK_CONTROL_URL/v1/playbooks/$PLAYBOOK_ID/extraction/bindings/$BINDING_ID" \
  -H "Authorization: Bearer $PLAYBOOK_ADMIN_TOKEN" > binding.json

jq '{expectedVersion: .version, enabled: true}' binding.json > activation.json

curl --fail-with-body --silent --show-error \
  -X PATCH "$PLAYBOOK_CONTROL_URL/v1/playbooks/$PLAYBOOK_ID/extraction/bindings/$BINDING_ID" \
  -H "Authorization: Bearer $PLAYBOOK_ADMIN_TOKEN" \
  -H 'Content-Type: application/json' \
  --data-binary @activation.json > binding.json
```

The worker checks bindings every five minutes. Sessions must remain idle for 30 minutes by default. Set `job.idleWindowSeconds` from 60 to 86,400 when creating or updating a binding. Review generated proposals and evidence before publication.

## Pause or remove extraction

Pause a binding by sending `enabled: false` with its current `expectedVersion`. Pausing retains prepared grants. Delete the binding and wait for reads to return `404` before disabling `extraction.connection` or removing Redis Agent Memory trust.

To stop new extraction configuration while retaining cleanup, set `extraction.enabled: false` and leave `extraction.connection.enabled: true`. Stop the worker only after pausing affected bindings. Scrape its `/metrics` endpoint on port `9203` and monitor queue age, permanent failures, exhausted attempts, lease loss, provider errors, and dispatch staleness.
