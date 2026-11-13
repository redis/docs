---
Title: Deploy Redis Agent Memory
alwaysopen: false
categories:
- docs
- operate
- iris
description: Add Redis Agent Memory to a Redis Iris suite release, then create a store, mint an agent key, and make one authenticated call.
linkTitle: Deploy
weight: 50
hideListLinks: true
aliases:
- /develop/ai/context-engine/agent-memory/self-managed/control-plane/
- /develop/ai/context-engine/agent-memory/self-managed/deploy-control-plane/
- /operate/iris/agent-memory/self-managed/deploy-control-plane/
- /develop/ai/context-engine/agent-memory/self-managed/install-k8s/
- /develop/ai/context-engine/agent-memory/self-managed/deploy-static/
- /operate/iris/agent-memory/self-managed/deploy-static/
---

Agent Memory installs as part of the `redis-iris` Helm chart. Follow [Install the Redis Iris suite](/content/operate/iris/self-managed/_index.md) for the prerequisites, the shared Secrets, the preflight, and the install. This page covers what Agent Memory adds to that release, and ends with one authenticated call to the Data Plane.

Agent Memory is on by default (`global.iris.products.memory.enabled: true`). Its values go under the `memory:` key in `iris-values.yaml`. The chart's `examples/memory-only.yaml` is a working values file for these steps. The suite nests Memory's Data Plane values one level down, so the Data Plane's `auth` setting is `memory.memory.auth`.

## 1. Create the Agent Memory Secrets

Memory reads its Redis addresses and provider credentials from an overlay file. The Data Plane, the workers, and the Control Plane all mount it. Save it as `overlay.yaml`:

```yaml
metadata:
  urls: ["redis://<metadata-redis-host>:6379"]
databases:
  "1":
    urls: ["redis://<store-redis-host>:6379"]
background_jobs:
  redis:
    urls: ["redis://<job-redis-host>:6379"]
  idempotency:
    urls: ["redis://<job-redis-host>:6379"]
embedders_connection_details:
  openai:
    credentials:
      api_key: <openai-api-key>
promote_session_memory:
  strategies:
    instruct:
      llm:
        credentials:
          api_key: <openai-api-key>
```

Then create the Secret:

```bash
kubectl -n <namespace-name> create secret generic mem-secrets \
  --from-file=overlay.yaml=./overlay.yaml
```

For what each overlay key configures, see [Where each setting goes](/content/operate/iris/agent-memory/self-managed/configuration.md#where-each-setting-goes).

## 2. Add the Agent Memory values

Add the overlay Secret, the database registry, and the model settings to `iris-values.yaml`. See [Data Plane settings](/content/operate/iris/agent-memory/self-managed/configuration.md#data-plane-settings) for each setting.

```yaml
memory:
  secrets:
    secretName: mem-secrets
  shared:
    databases:
      "1":
        name: default
  memory:
    license:
      license_path: /etc/redis-agent-memory/license
    default_extraction_strategy: instruct
    embedding:
      provider: openai
      models:
        default_embedding_model: text-embedding-3-small
        dimensions: 1536
    embedders_connection_details:
      openai:
        base_url: https://api.openai.com
        credentials:
          type: static
    inference_providers:
      openai:
        endpoint:
          base_url: https://api.openai.com/v1
          timeout: 30s
          auth_format: bearer
    promote_session_memory:
      strategies:
        instruct:
          llm:
            provider: openai
            credentials:
              type: static
            models:
              default_chat_model: <chat-model>
    background_jobs:
      idempotency:
        enabled: true
      redis:
        enabled: true
        queue_prefix: ram
        worker_regions: [default]
    request_region:
      default: default
    session_summarisation:
      enabled: false
  controlplane:
    configData:
      license:
        license_path: /etc/redis-agent-memory/license
      embedding:
        dimensions: 1536
```

- The suite mounts the license at `/etc/redis-agent-memory/license` but doesn't set the path in Memory's configuration. Set `license_path` for the Data Plane and the Control Plane, as shown, or both fail to start with `invalid license format`.
- `<chat-model>` is any chat model the endpoint serves.
- `memory.controlplane.configData.embedding.dimensions` must equal `memory.memory.embedding.models.dimensions`.
- `background_jobs.idempotency.enabled` prevents successful jobs from running again after redelivery and serializes extraction for the same session. Keep it enabled in production. Without it, workers warn that duplicate memories remain possible. This is separate from queue submission deduplication.
- The `"1"` entry in `memory.shared.databases` matches `databases."1"` in the overlay. The release test creates its store in database `1`.

For a local evaluation without a model provider, see [Evaluate on a local kind cluster](/content/operate/iris/self-managed/_index.md#evaluate-on-a-local-kind-cluster).

The suite sets these Agent Memory values itself. Don't set them under `memory:`: a value that differs fails the render and names the field.

- `tenantId` and `license.*`, from `global.iris.tenantId` and `global.iris.license`.
- `dataplane.identityServiceBaseURL` and `identityService.allowInsecureTransport`, for the suite's own Identity Service, `iris-identity-service`.
- `identityService.credential` and `controlplane.internalToken`, from the credentials the suite generates or that you supply in `global.iris.secrets`. The admin token is in the Secret `iris-memory-admin-token`.
- Worker identity: `workerAuth.enabled`, `memory.dataplane_client`, and `memory.auth.worker_identity`, trusted against `global.iris.workloadIdentity`.
- OIDC: `auth.oidc.audience` and the Control Plane's `controlplane.configData.auth.oidc`, from `global.iris.auth.oidc` and `global.iris.auth.roleBindings`. Data Plane OIDC stays off unless you set `memory.memory.auth.oidc.enabled: true`. It then takes the same issuer, JWKS URL, role claims, and role mappings.
- `fullnameOverride`, the Service ports, `server.strategy`, and `podDisruptionBudget.enabled: true`, which the suite fixes. The suite doesn't support the FIPS-oriented posture.

Check these values before you install. If one is wrong, you see the symptom in its row.

{{< table-scrollable >}}
| Check | Symptom | Fix |
| --- | --- | --- |
| <a id="cl-1"></a>`license_path` is set under `memory.memory.license` and `memory.controlplane.configData.license` | Pods `CrashLoopBackOff`; log: `initialize license enforcement: license validation failed; refusing to start: invalid license format` | Set `license_path: /etc/redis-agent-memory/license` in both places. |
| <a id="cl-2"></a>`memory.memory.promote_session_memory.strategies.instruct.llm` is set | Worker pods `CrashLoopBackOff` (server stays Ready); log: `promote_session_memory: Strategies: strategies.instruct.llm is required.` | Add the `instruct.llm` block. |
| <a id="cl-3"></a>Each `llm.provider` names an `inference_providers` entry | Server and worker pods `CrashLoopBackOff`; log: `panic: config validation failed: promote_session_memory.strategies.instruct.llm: provider "<name>" is not defined in inference_providers (defined: <names>)` | Add `memory.memory.inference_providers.<name>` or fix the name. |
| <a id="cl-5"></a>Any overridden image tags exist in the chosen registry | Pods `ImagePullBackOff`, event: `Failed to pull image "redislabs/agent-memory:<tag>": … not found` | Use the published defaults or valid mirrored tags. |
{{< /table-scrollable >}}

### Prepare worker identity for your platform

Memory workers call the Data Plane with their projected ServiceAccount token, and the Data Plane checks that token against the cluster's JSON Web Key Set (JWKS). The suite configures both sides from `global.iris.workloadIdentity`, which defaults to the in-cluster API server. The [preflight](/content/operate/iris/self-managed/_index.md#4-run-the-preflight) fails when the issuer isn't the cluster's ServiceAccount issuer, or when its JWKS isn't reachable without a credential.

- **Self-managed, Google Kubernetes Engine (GKE), and air-gapped clusters:** Keep the default issuer. The Data Plane verifies the API server's certificate, so include the cluster certificate authority (CA) in `cluster-ca`, as in [Create the shared Secrets](/content/operate/iris/self-managed/_index.md#2-create-the-shared-secrets).
- **Amazon Elastic Kubernetes Service (EKS):** Set both `global.iris.workloadIdentity` fields from the cluster's OIDC issuer, as the [preflight](/content/operate/iris/self-managed/_index.md#4-run-the-preflight) step shows. The Data Plane needs egress to the issuer host, or the `com.amazonaws.<region>.oidc-eks` PrivateLink endpoint with private DNS. The hostname differs for IPv6 clusters and AWS China, so copy it rather than typing it.
- **Clusters that refuse anonymous access to the issuer:** The Data Plane fetches the JWKS without credentials. Allowing that is the cluster admin's decision. The preflight prints the ClusterRoleBinding to create. It grants only `get` on `/.well-known/openid-configuration` and `/openid/v1/jwks`, which serve issuer metadata and public signing keys, not secrets. Where the API server disables anonymous authentication, the binding has no effect, and there is no working setup for `agent_key` with workers.

### Ownership and delegation with the suite chart

These Data Plane values are off or unset by default. Each one is described in full in the linked section.

| Value | Default | Effect |
| --- | --- | --- |
| `memory.memory.auth.method` | `agent_key` | Data Plane callers authenticate with agent keys. The suite needs no value here. `none` is allowed only with `profile: dev`. See [Agent-key authentication](/content/operate/iris/agent-memory/self-managed/authentication.md#agent-key-authentication). |
| `memory.memory.ownership.enabled` | `false` | The server restricts personal records to their owner. See [Server-side ownership enforcement](/content/operate/iris/agent-memory/self-managed/authentication.md#server-side-ownership-enforcement). |
| `memory.memory.auth.oidc.enabled` | `false` | The Data Plane validates user tokens. Delegation needs it. The suite fills in the issuer, JWKS URL, role claims, role mappings, and audience from `global.iris.auth.oidc`. |
| `memory.memory.auth.oidc.user_id_claim` | `sub` | The token claim that names the user. |
| `memory.memory.auth.oidc.allow_azp_fallback` | `false` | Accepts a token whose `aud` doesn't match when its `azp` does. Keep it off. |
| `memory.memory.auth.oidc.clock_skew` | `5m` | The tolerance for a token's time claims, as a duration. |
| `memory.memory.auth.oidc.allow_insecure_transport` | Derived | Derived from `global.iris.auth.oidc`. A different value fails the render. |
| `memory.memory.auth.delegation.enabled` | `false` | Accepts a user token in the `X-Iris-User-Token` header, next to an agent key. |
| `memory.memory.auth.delegation.audience` | The `auth.oidc` audience | The audience delegated user tokens must carry. Use one that differs from `global.iris.auth.oidc.audience`, which defaults to `api://redis-iris`. |
| `memory.memory.namespace_features.api` | `false` | Turns on the namespace lifecycle API. See [Configure namespace routing](/content/operate/iris/agent-memory/self-managed/configuration.md#enable-namespace-routing). |

With ownership enforcement off, your backend must authorize each user's access to personal memories. To turn on delegation and ownership enforcement, add this to `iris-values.yaml`:

```yaml
memory:
  memory:
    ownership:
      enabled: true
    auth:
      oidc:
        enabled: true
        user_id_claim: sub
        allow_azp_fallback: false
      delegation:
        enabled: true
        audience:
          - api://memory-delegation
```

Then upgrade the release as in [Install or upgrade the release](#3-install-or-upgrade-the-release). The upgrade changes the rendered configuration, so the Data Plane server and worker pods roll. After the rollout:

- An agent key alone can still use the store, but can't read or create personal records for a named owner.
- A request with an agent key and an `X-Iris-User-Token` header acts for that user. The token must carry the delegation audience. The key keeps its own grants: the user token names the user and adds no access.
- Shared records stay visible to every caller with the store grant.

To turn enforcement off again, set `memory.memory.ownership.enabled: false` and upgrade the same way. Records keep their owners. Before you turn it on for existing data, follow [Enable or change ownership enforcement](/content/operate/iris/agent-memory/self-managed/authentication.md#enable-or-change-ownership-enforcement).

The suite uses one static tenant, `global.iris.tenantId`. Every valid agent key and every valid user token from the configured issuer acts in that tenant, so Memory never returns the cross-tenant `403` that [Delegate a user with an agent key](/content/operate/iris/agent-memory/self-managed/authentication.md#delegate-a-user-with-an-agent-key) describes. See [Tenancy and identity provider limits](/content/operate/iris/self-managed/_index.md#tenancy-and-identity-provider-limits).

## 3. Install or upgrade the release

For a new release, follow [Run the preflight](/content/operate/iris/self-managed/_index.md#4-run-the-preflight) and [Install](/content/operate/iris/self-managed/_index.md#5-install). To add Agent Memory to a running release, or to apply changed values, upgrade it:

```bash
helm upgrade iris redis-ai/redis-iris \
  --version 1.0.1 \
  --namespace <namespace-name> \
  -f iris-values.yaml
```

## 4. Verify the deployment

```bash
kubectl -n <namespace-name> rollout status deployment/redis-agent-memory
kubectl -n <namespace-name> rollout status deployment/redis-agent-memory-worker
kubectl -n <namespace-name> rollout status deployment/redis-agent-memory-controlplane
helm test iris --namespace <namespace-name> --logs
```

`helm test` creates a store in Memory database `1`, mints a scoped agent key, and calls the Data Plane with it. If your `databases` registry uses another key, set `tests.suiteVerify.databaseId`. See [Verify the release](/content/operate/iris/self-managed/_index.md#6-verify-the-release).

To call the services from your workstation, run each port-forward in its own terminal and leave it running:

```bash
kubectl -n <namespace-name> port-forward svc/redis-agent-memory 9000:9000
```

```bash
kubectl -n <namespace-name> port-forward svc/redis-agent-memory-controlplane 9100:9100
```

```bash
kubectl -n <namespace-name> port-forward svc/iris-identity-service 9200:9200
```

Check the Data Plane's health. The health check doesn't need an agent key:

```bash
curl http://localhost:9000/health/readiness
```

The response is:

```json
{"status":"ready"}
```

## 5. Create a store

Read the Control Plane admin token from the Secret `iris-memory-admin-token`, as in [Credentials](/content/operate/iris/self-managed/_index.md#credentials). Then follow the store creation example in [Control Plane API examples](/content/operate/iris/agent-memory/self-managed/api-examples.md#control-plane-api-examples). `database.databaseId` names an entry in `memory.shared.databases`, here `"1"`. The response carries `storeId`.

To create the store and its agent key in one step instead, use the `iris` CLI as in [Create a store with the `iris` CLI](/content/operate/iris/self-managed/_index.md#7-create-a-store-with-the-iris-cli).

## 6. Mint an agent key

Mint a key with a grant on the store through the Identity Service, using the control token in the Secret `iris-identity-service-control-token`. See [Identity Service API examples](/content/operate/iris/agent-memory/self-managed/api-examples.md#identity-service-api-examples). Use `global.iris.tenantId` as the grant's tenant, `default` unless you changed it. The response's `token` is the agent key. It is shown only once.

## 7. Make one authenticated call

```bash
curl --fail-with-body -sS "http://localhost:9000/iris/data/v1/agent-memory/stores/<store-id>/health" \
  -H "Authorization: Bearer <agent-key>"
```

Check that the store and its memory features are healthy. This verifies the agent key's store access without requiring a user identity. To write personal data, follow the [Data Plane examples](/content/operate/iris/agent-memory/self-managed/api-examples.md#data-plane-api-examples), including delegated user setup.

## Next steps

- [API examples](/content/operate/iris/agent-memory/self-managed/api-examples.md) for the full API.
- [Operations](/content/operate/iris/agent-memory/self-managed/operations.md) for key rotation.
