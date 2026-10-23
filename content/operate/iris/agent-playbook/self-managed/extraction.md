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
| Redis Agent Memory control-plane URL | Discover stores and verify source ownership. |
| Queue Redis URL | Store extraction jobs. Use persistence, `noeviction`, and capacity monitoring. Do not reuse Playbook metadata or content Redis. |
| Generation provider and model | Extract and consolidate FAQ candidates. These credentials are separate from the embedding configuration. |

Use certificate-verified endpoints. The Memory control plane and both data planes must reach the issuer's JWKS. Configure network policy for the control plane, worker, Redis, identity, and model-provider paths.

## Configure Redis Agent Memory trust

Redis Agent Memory trusts separate Playbook identities for source reads and ownership checks. With release `playbook`, namespace `<namespace-name>`, and `fullnameOverride: playbook`, the subjects are:

- `system:serviceaccount:<namespace-name>:playbook-worker`
- `system:serviceaccount:<namespace-name>:playbook-controlplane`

Add these settings to the Redis Agent Memory values. Merge entries with existing identity lists, preserving Memory's own worker and application agent-key authentication:

```yaml
memory:
  auth:
    method: agent_key
    jwt_subjects:
      - issuer: https://<service-account-issuer>
        jwks_uri: https://<service-account-jwks-uri>
        audience: [api://memory-dp]
        subjects:
          - subject: "system:serviceaccount:<namespace-name>:playbook-worker"
            authority: static
            roles: [viewer]
            resources:
              "mem-store:*":
                permissions: [read]
controlplane:
  configData:
    auth:
      workload_identity:
        enabled: true
        issuer: https://<service-account-issuer>
        jwks_uri: https://<service-account-jwks-uri>
        audience: [api://memory-cp]
        subjects:
          - subject: "system:serviceaccount:<namespace-name>:playbook-controlplane"
            tenant: "<tenant-id>"
            roles: [viewer]
```

The control-plane viewer must use the same tenant as Playbook's `tenantId`. Do not give it `suite_admin`, which bypasses Memory's ownership checks. This viewer verifies ownership; it does not supply the operator's consent. Playbook extraction needs no Identity Service subject grants, lookup credential, or Control administration identity. Keep unrelated service-subject integrations configured separately.

The `mem-store:*` wildcard gives this dedicated worker read access to all stores served by the Memory data plane. Binding configuration controls which sources it processes. Both Memory planes must trust the issuer's certificate authority and reach its JWKS endpoint.

See the [Redis Agent Memory authentication guide]({{< relref "/operate/iris/agent-memory/self-managed/authentication" >}}) before changing an existing authentication configuration.

## Configure Playbooks extraction

Save `playbook-extraction-values.yaml`. The worker starts without an active binding; creating a binding does not enable it:

```yaml
extraction:
  enabled: true
  connection:
    enabled: true
    issuer: https://<service-account-issuer>
    jwksURI: https://<service-account-jwks-uri>
    ramControlPlaneBaseURL: https://<memory-control-plane-host>

worker:
  enabled: true
  replicaCount: 1
  region: <region>
  existingSecret: playbook-extraction-worker
  sourceURL: https://<memory-data-plane-host>
  targetURL: https://<playbook-data-plane-host>
  scanConcurrency: 1
  extractConcurrency: 1
```

The chart projects separate tokens for the control plane and worker. Their audiences must match the Memory trust configuration. The control plane discovers stores live; no per-store deployment list is required. Keep the configured service endpoints fixed for the deployment.

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

Use the installation admin token, or a same-tenant OpenID Connect (OIDC) user mapped to `product_admin` or `suite_admin`, to list sources, create a binding, or enable it. Operator and viewer roles cannot authorize those actions.

Discover the current source stores for the destination playbook:

```bash
curl --fail-with-body --silent --show-error \
  "$PLAYBOOK_CONTROL_URL/v1/playbooks/$PLAYBOOK_ID/extraction/stores" \
  -H "Authorization: Bearer $PLAYBOOK_ADMIN_TOKEN" | jq
```

Choose an owned store and create a disabled binding. The control plane verifies the exact source again; an earlier listing is not authorization:

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

Successful creation returns HTTP `202`, `status: ready`, and `enabled: false`. Readiness confirms caller consent, exact source ownership, destination readiness, and supported deployment scope. It does not confirm worker or model connectivity.

Verify the worker before activation:

```bash
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

Every explicit enable revalidates the current caller's consent and source ownership. Permission denial or a Memory outage leaves the binding unchanged. Re-enabling a valid blocked binding clears its blocked reason. An enabled binding belongs to the tenant; removing its creator's individual role does not automatically stop it.

The worker checks bindings every five minutes. Sessions must remain idle for 30 minutes by default. Set `job.idleWindowSeconds` from 60 to 86,400 when creating or updating a binding. Review generated proposals and evidence before publication.

## Pause or remove extraction

An authorized destination manager can pause a binding with `enabled: false` and its current `expectedVersion`, or delete it. Neither operation requires source permissions or a successful Memory request. Both work when `extraction.enabled: false` or Memory is unavailable. Deletion removes scheduling intent, not source data, proposals, or FAQs.

Pause and deletion fence subsequent extraction work. Requests already accepted by an external service can complete. They do not revoke the worker's static identity. To revoke its access, remove that worker's trust from both data planes and roll all replicas.

Set `extraction.enabled: false` to block binding creation and activation. For an orderly shutdown, pause the bindings before stopping the worker. Scrape its `/metrics` endpoint on port `9203` and monitor queue age, permanent failures, exhausted attempts, lease loss, provider errors, and dispatch staleness.
