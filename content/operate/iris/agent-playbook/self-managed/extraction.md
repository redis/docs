---
Title: Configure background FAQ extraction
alwaysopen: false
categories:
- docs
- operate
- iris
description: Connect Redis Agent Memory, run the Agent Playbooks extraction worker, and create, enable, pause, and remove extraction bindings.
linkTitle: Background FAQ extraction
weight: 85
hideListLinks: true
---

Background extraction reads idle Redis Agent Memory sessions and creates frequently asked question (FAQ) proposals for human review. It doesn't publish FAQs or create skills. An accepted proposal still needs review and publication before agents receive it.

Extraction is optional. It needs Redis Agent Memory in the same tenant, a persistent queue Redis, a generation model, and workload identity between the two products. It needs no Identity Service subject grants, lookup credentials, or Identity Service control trust.

## How extraction is wired

| Caller | Calls | Credential | Trust you configure |
| --- | --- | --- | --- |
| Agent Playbooks control plane | Redis Agent Memory control plane, to list stores and confirm the source store's tenant | Projected ServiceAccount token, audience `api://memory-cp` | `controlplane.configData.auth.workload_identity` on Redis Agent Memory, role `viewer` |
| Extraction worker | Redis Agent Memory data plane, to read sessions | Projected ServiceAccount token, audience `api://memory-dp` | `memory.auth.jwt_subjects` on Redis Agent Memory, `authority: static`, `mem-store:*` read |
| Extraction worker | Agent Playbooks data plane, to search and propose | Projected ServiceAccount token, audience `api://playbook-dp` | Rendered by this chart when the worker is enabled |

With release `playbook`, namespace `<namespace-name>`, and `fullnameOverride: playbook`, the two subjects are:

- `system:serviceaccount:<namespace-name>:playbook-controlplane`
- `system:serviceaccount:<namespace-name>:playbook-worker`

If you change the namespace or resource names, change these subjects everywhere.

## Plan the connection

Prepare these values before you enable extraction:

| Value | Purpose |
| --- | --- |
| Redis Agent Memory store | The source store for a binding. Its tenant must match `tenantId`. |
| ServiceAccount issuer and JSON Web Key Set (JWKS) URI | Validate the projected control-plane and worker tokens. Both must use `https://`. The issuer must exactly match the issuer Redis Agent Memory accepts. |
| Redis Agent Memory control-plane URL | Let the Agent Playbooks control plane discover stores and check ownership. |
| Redis Agent Memory data-plane URL | Let the worker read sessions. |
| Queue Redis URL | Store extraction jobs. Use persistence, `noeviction`, and capacity monitoring. Don't reuse the Agent Playbooks metadata or content Redis. |
| Generation provider and model | Extract and consolidate FAQ candidates. These credentials are separate from the embedding configuration. |

Use certificate-verified endpoints. Redis Agent Memory must be able to fetch the JWKS without a bearer token. See [Prepare worker identity for your platform](/content/operate/iris/agent-memory/self-managed/deploy.md#prepare-worker-identity-for-your-platform) for where each Kubernetes platform serves its issuer. Allow network paths for the control plane, worker, queue Redis, both data planes, and the model provider.

## Configure Redis Agent Memory trust

Add these settings to the Redis Agent Memory values. Merge the list entries with its existing worker identity and authentication settings, and keep `memory.auth.method: agent_key`:

```yaml
memory:
  auth:
    method: agent_key
    jwt_subjects:
      - issuer: https://<service-account-issuer>
        jwks_uri: https://<service-account-jwks-uri>
        audience: [api://memory-dp]
        subjects:
          - subject: system:serviceaccount:<namespace-name>:playbook-worker
            authority: static
            roles: [viewer]
            resources:
              "mem-store:*": {permissions: [read]}

controlplane:
  configData:
    auth:
      workload_identity:
        enabled: true
        issuer: https://<service-account-issuer>
        jwks_uri: https://<service-account-jwks-uri>
        audience: [api://memory-cp]
        subjects:
          - subject: system:serviceaccount:<namespace-name>:playbook-controlplane
            tenant: default
            roles: [viewer]
```

Set `tenant` to the Agent Playbooks `tenantId`. Don't give the control-plane subject a suite administrator role: that bypasses the ownership checks extraction relies on. Upgrade the Redis Agent Memory release, and wait for its planes to be ready.

See the [Redis Agent Memory authentication guide](/content/operate/iris/agent-memory/self-managed/authentication.md) before you change an existing authentication configuration.

<!-- TODO: The Agent Memory configuration page's "Optional Agent Playbooks extraction" section still describes Identity Service subject grants and subject-grant-lookup. Chart 1.0.0 uses the static trust on this page instead; align that section. -->

## Configure Agent Playbooks extraction

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

The reasoning mapping tells the client how to send the worker's `low` reasoning effort to this model. `generation_api` accepts `chat_completions` or `responses`. Don't add `worker.target_token`; the chart supplies the worker's own token for the Agent Playbooks data plane.

Create the Secret:

```bash
kubectl -n <namespace-name> create secret generic playbook-extraction-worker \
  --from-file=worker.yaml=./worker.yaml
```

Save `playbook-extraction-values.yaml`:

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
  scanConcurrency: 1
  extractConcurrency: 1
```

- `ramControlPlaneBaseURL` is the Redis Agent Memory control plane. `extraction.enabled` requires it.
- `worker.sourceURL` is the Redis Agent Memory data plane. `worker.targetURL` defaults to this release's data-plane Service; set an `https://` endpoint when the security profile requires it.
- `worker.region` names the queues, `playbook-extraction:<region>:scan` and `playbook-extraction:<region>:extract`. Run one active regional deployment per binding inventory.
- Bindings start disabled, so the worker reads nothing until you [enable a binding](#create-and-enable-a-binding).

Apply both values files:

```bash
helm upgrade playbook redis-ai/redis-agent-playbook \
  --version 1.0.0 \
  --namespace <namespace-name> \
  -f playbook-values.yaml \
  -f playbook-extraction-values.yaml \
  --wait --timeout 10m
kubectl -n <namespace-name> rollout status deployment/playbook-worker
```

Startup fails when the source URL, model, region, or token file is missing, or when the queue Redis is unreachable. Check the worker's `/health/readiness` and `/metrics` on port `9203` before you enable a binding.

## Create and enable a binding

These requests need the admin token or an OpenID Connect (OIDC) token with the `product_admin` or `suite_admin` role. Operators and viewers can't list sources or create or enable bindings. Each playbook has one binding.

List the Redis Agent Memory stores the control plane can see:

```bash
curl --fail-with-body -sS \
  "$IRIS_AGENT_PLAYBOOKS_SERVICE_URL/iris/v1/agent-playbooks/playbooks/$IRIS_AGENT_PLAYBOOKS_PLAYBOOK_ID/extraction/stores" \
  -H "Authorization: Bearer $IRIS_AGENT_PLAYBOOKS_SERVICE_TOKEN" | jq '.items'
```

Create a binding for one store:

```bash
jq -n --arg store '<memory-store-id>' \
  '{source: {kind: "REDIS_AGENT_MEMORY", storeId: $store}, job: {kind: "FAQ"}}' \
  > binding-request.json

curl --fail-with-body -sS \
  -X POST "$IRIS_AGENT_PLAYBOOKS_SERVICE_URL/iris/v1/agent-playbooks/playbooks/$IRIS_AGENT_PLAYBOOKS_PLAYBOOK_ID/extraction/bindings" \
  -H "Authorization: Bearer $IRIS_AGENT_PLAYBOOKS_SERVICE_TOKEN" \
  -H 'Content-Type: application/json' \
  --data-binary @binding-request.json > binding.json
export BINDING_ID="$(jq -er '.bindingId' binding.json)"
```

A successful create returns `201` with `state: READY` and `enabled: false`. It confirms that the store exists in your tenant and that the caller may connect it. It doesn't check model access or worker connectivity. Binding IDs start with `bind_`.

Enable the binding with its current `revision`:

```bash
curl --fail-with-body -sS \
  "$IRIS_AGENT_PLAYBOOKS_SERVICE_URL/iris/v1/agent-playbooks/playbooks/$IRIS_AGENT_PLAYBOOKS_PLAYBOOK_ID/extraction/bindings/$BINDING_ID" \
  -H "Authorization: Bearer $IRIS_AGENT_PLAYBOOKS_SERVICE_TOKEN" > binding.json

jq '{expectedRevision: .revision, enabled: true}' binding.json > activation.json

curl --fail-with-body -sS \
  -X PATCH "$IRIS_AGENT_PLAYBOOKS_SERVICE_URL/iris/v1/agent-playbooks/playbooks/$IRIS_AGENT_PLAYBOOKS_PLAYBOOK_ID/extraction/bindings/$BINDING_ID" \
  -H "Authorization: Bearer $IRIS_AGENT_PLAYBOOKS_SERVICE_TOKEN" \
  -H 'Content-Type: application/json' \
  --data-binary @activation.json > binding.json
```

Enabling checks the store and the caller again. A stale `expectedRevision` returns `412`; read the binding again and rebuild `activation.json`. If the check fails, the binding is unchanged. A binding that later fails reports `state: BLOCKED` with a `blockedReason`, such as `source_not_found` or `source_access_denied`.

The Iris command-line interface (CLI) runs the same steps: `iris agent-playbooks extraction bind <memory-store-id> --enable`, then `extraction list`, `show`, `pause`, `enable`, and `delete`.

The worker looks for due bindings every five minutes (`worker.scanInterval`, default `300s`). A session must stay idle for 30 minutes by default before the worker extracts from it. Set `job.idleWindowSeconds` from 60 to 86,400 when you create or update a binding. Neither setting is an end-to-end freshness guarantee: queue and model time also affect when a proposal appears.

For the first run, send a small session with a known FAQ to the bound store, let it go idle, and review the proposals and evidence in the playbook. A healthy deployment can produce no proposal for a session that has no reusable FAQ.

## Tune the worker

| Value | Default | Purpose |
| --- | --- | --- |
| `worker.scanInterval` | `300s` | How often the worker looks for due bindings. Use the same value on every worker that shares a queue, and restart them after a change. Shorter intervals add source-listing load. |
| `worker.timeout` | `2m` | FAQ strategy timeout. |
| `worker.reasoningEffort` | `low` | Reasoning effort sent through the model's reasoning mapping. |
| `worker.maxInputTokens` | `8192` | Input cap for each model request. |
| `worker.maxCompletionTokens` | `4096` | Output cap for each model request. |
| `worker.scanConcurrency`, `worker.extractConcurrency` | `1` | Consumers per queue per replica. |
| `worker.maxPending` | `1000` | Bound on unfinished tasks per queue. |

These settings apply to every binding. Model and credential changes apply to unfinished and new sessions; completed sessions aren't extracted again. Keep the first deployment at one replica and one extraction consumer, and qualify model quality and load before you scale.

## Monitor extraction

Scrape `/metrics` on port `9203` of every worker pod, and alert on sustained queue age, permanent failures, exhausted attempts, lease loss, provider errors, and dispatch staleness. Useful signals include:

- `iris_jobqueue_oldest_pending_seconds`, for backlog. Use `max` across pods, not a sum.
- `iris_jobqueue_processing_duration_seconds_count{processing_outcome="permanent_failure"}`
- `iris_playbook_extraction_runs_total{exhausted="true"}`
- `iris_playbook_extraction_dispatch_last_success_age_seconds`

Four charged failures exhaust a session's attempts. An empty queue doesn't prove that every session was processed.

## Pause or remove extraction

To pause a binding, send `enabled: false` with its current `expectedRevision`. To remove it, send `DELETE` to the binding; the request returns `202`. Both work while Redis Agent Memory is unavailable. Deleting a binding doesn't delete Redis Agent Memory data, proposals, or FAQs.

Work the worker already accepted can still finish after a pause or delete. The worker's static read access lasts until you remove its subject from the Redis Agent Memory values and both data planes roll out.

To stop new extraction configuration while keeping the worker and connection, set `extraction.enabled: false`. Bindings can still be paused and deleted.

To remove extraction from the deployment, delete the bindings first, then set `extraction.enabled`, `extraction.connection.enabled`, and `worker.enabled` to `false` together, and remove both subjects from the Redis Agent Memory values. The chart refuses an enabled connection without the worker unless `extraction.connection.workerSubjects` lists another worker.
