---
Title: Deploy Redis Agent Memory
alwaysopen: false
categories:
- docs
- operate
- iris
description: Install Redis Agent Memory with chart-rendered configuration and agent-key authentication, then make one authenticated call.
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

These steps install Redis Agent Memory with chart-rendered configuration and agent-key
authentication, and end with one authenticated call to the Data Plane.

You use three credentials along the way: the Control Plane admin token, the Identity Service
control token, and an agent key. The chart generates the first two. For what each credential
unlocks, see [Credentials](/content/operate/iris/agent-memory/self-managed/authentication.md#credentials).

Before you begin, review the [prerequisites](/content/operate/iris/agent-memory/self-managed/prerequisites.md).

## 1. Create the namespace

```bash
kubectl create namespace <namespace-name>
```

## 2. Create Secrets

```bash
kubectl -n <namespace-name> create secret generic ram-license \
  --from-file=license=./ram-license.key
kubectl -n <namespace-name> create secret generic ram-secrets \
  --from-file=overlay.yaml=./overlay.yaml
kubectl -n <namespace-name> create secret generic ram-ids-metadata \
  --from-file=metadata.yaml=./ids-metadata.yaml
```

`overlay.yaml` holds the Redis addresses and provider credentials. The Data Plane, the workers, and
the Control Plane all mount it:

```yaml
metadata:
  urls: ["redis://<metadata-redis-host>:6379"]
databases:
  "1":
    urls: ["redis://<store-redis-host>:6379"]
background_jobs:
  redis:
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

`ids-metadata.yaml` tells the Identity Service where Metadata Redis is:

```yaml
metadata:
  urls: ["redis://<metadata-redis-host>:6379"]
```

### Prepare worker identity for your platform

With agent-key authentication, workers call the Data Plane with their projected service account
token, and the Data Plane checks that token against the cluster's JSON Web Key Set (JWKS). The
chart's defaults disagree here: the Data Plane defaults to `agent_key` authentication, while
`workerAuth.enabled` defaults to `false`. With `agent_key`, you must configure worker identity. The
values in [step 3](#3-create-ram-valuesyaml) do this.

In version 0.7.0, the Data Plane fetches the JWKS without credentials and trusts only the
certificate authority (CA) bundle in its image. What you set up depends on where the cluster's
issuer is served:

| Cluster | `issuer` | `jwks_uri` | Extra steps | Tested |
|---------|----------|------------|-------------|--------|
| Self-managed (kind, kubeadm, on-premises) | from `kubectl get --raw /.well-known/openid-configuration` (kind: `https://kubernetes.default.svc.cluster.local`) | `https://kubernetes.default.svc/openid/v1/jwks` | `cluster-ca` Secret + `tls.caCertSecret: cluster-ca` + ClusterRoleBinding (cluster admin's decision) | Yes, on kind |
| Amazon Elastic Kubernetes Service (EKS) | `aws eks describe-cluster --name <cluster> --query cluster.identity.oidc.issuer --output text` | the `jwks_uri` field of `<issuer>/.well-known/openid-configuration` | Data Plane egress to the issuer host, or the `com.amazonaws.<region>.oidc-eks` PrivateLink endpoint with private DNS. The hostname differs for IPv6 clusters and AWS China, so copy it, don't type it | No |
| Azure Kubernetes Service (AKS), OpenID Connect (OIDC) issuer enabled | `az aks show -n <cluster> -g <resource-group> --query oidcIssuerProfile.issuerUrl -o tsv` (exact, including the trailing slash) | the `jwks_uri` field of `<issuer>.well-known/openid-configuration` | Data Plane egress. The issuer is on by default only for new Standard clusters on 1.34+ and on AKS Automatic. `--enable-oidc-issuer` on an existing cluster restarts the API server and cannot be undone | No |
| Google Kubernetes Engine (GKE) | as self-managed | as self-managed | as self-managed, because anonymous access to the GKE `jwks` endpoint is not verified | No |
| Air-gapped (any) | as self-managed | as self-managed | as self-managed | Yes, on kind |

Always take `jwks_uri` from the discovery document. Don't build it from the issuer, because the AKS
path differs. On EKS and AKS, replace `issuer` and `jwks_uri` in the values, remove `tls`, and skip
the rest of this section.

On self-managed, GKE, and air-gapped clusters, create a Secret from the cluster CA so the Data
Plane trusts the API server certificate:

```bash
kubectl -n <namespace-name> get configmap kube-root-ca.crt -o jsonpath="{.data.ca\.crt}" >./cluster-ca.crt
kubectl -n <namespace-name> create secret generic cluster-ca --from-file=ca.crt=./cluster-ca.crt
```

The Data Plane also needs to read the JWKS without logging in. Allowing that is the cluster
admin's decision:

```bash
kubectl create clusterrolebinding redis-agent-memory-oidc-discovery \
  --clusterrole=system:service-account-issuer-discovery --group=system:unauthenticated
```

This binding grants only `get` on `/.well-known/openid-configuration` and `/openid/v1/jwks`, which
serve issuer metadata and public signing keys, not secrets. It applies to unauthenticated callers
across the whole cluster. It has no effect where the API server disables anonymous authentication.
On those clusters, version 0.7.0 has no working setup for `agent_key` with workers.

## 3. Create `ram-values.yaml`

```yaml
license:
  existingSecret: ram-license
config:
  render: true
secrets:
  secretName: ram-secrets
shared:
  databases:
    "1":
      name: default
workerAuth:
  enabled: true
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
    redis:
      enabled: true
      queue_prefix: ram
      worker_regions: [default]
  request_region:
    default: default
  dataplane_client:
    base_url: http://redis-agent-memory:9000
    auth:
      disabled: false
      type: service_account_token
      token_file: /var/run/secrets/redis-agent-memory-worker/token
  auth:
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
  session_summarisation:
    enabled: false
  session_summary_view:
    enabled: false
controlplane:
  config:
    render: true
  configData:
    profile: prod
    auth:
      type: admin-token
      admin_token:
        token_file: /etc/controlplane-onprem/admin/token
    license:
      license_path: /etc/redis-agent-memory/license
    embedding:
      dimensions: 1536
identityService:
  metadata:
    existingSecret: ram-ids-metadata
tls:
  caCertSecret: cluster-ca
```

- `<chat-model>` is any chat model the endpoint serves.
- `controlplane.configData.embedding.dimensions` must equal `memory.embedding.models.dimensions`.
- `<service-account-issuer>` is the cluster's issuer. Read it with:

  ```bash
  kubectl get --raw /.well-known/openid-configuration | jq -r .issuer
  ```

- `tls.caCertSecret` names the CA Secret from [step 2](#prepare-worker-identity-for-your-platform).
  Remove it on EKS and AKS.
- The chart writes the agent-key introspection settings and the Control Plane internal token for you.
- Image tags are not set, so the chart defaults (`0.7.0`) apply.

{{< note >}}
No external model provider? To try the API with local models, see [Evaluate locally](#evaluate-locally).
{{< /note >}}

## Before you install: check your values

Check each value in `ram-values.yaml` before you install. If one is wrong, you see the symptom in
its row.

{{< table-scrollable >}}
| Row | Check | Symptom | Fix |
| --- | --- | --- | --- |
| <a id="cl-1"></a>CL-1 | `memory.license.license_path` is set | Server and worker pods `CrashLoopBackOff`; log: `initialize license enforcement: license validation failed; refusing to start: invalid license format` | Set `memory.license.license_path: /etc/redis-agent-memory/license` |
| <a id="cl-2"></a>CL-2 | `memory.promote_session_memory.strategies.instruct.llm` is set | Worker pods `CrashLoopBackOff` (server stays Ready); log: `promote_session_memory: Strategies: strategies.instruct.llm is required.` | Add the `instruct.llm` block |
| <a id="cl-3"></a>CL-3 | Each `llm.provider` names an `inference_providers` entry | Server and worker pods `CrashLoopBackOff`; log: `panic: config validation failed: promote_session_memory.strategies.instruct.llm: provider "<name>" is not defined in inference_providers (defined: <names>)` | Add `memory.inference_providers.<name>` or fix the name |
| <a id="cl-4"></a>CL-4 | `memory.dataplane_client.base_url` is `http://redis-agent-memory:9000` | Pods Ready, but no memories appear; worker log: `getting session memory: Get "http://<wrong-host>:9000/v1/stores/<store-id>/session-memory/..."` … `dial tcp: lookup <wrong-host>` (the rest depends on the cluster DNS) | Set `http://redis-agent-memory:9000` |
| <a id="cl-5"></a>CL-5 | No image tag is set, or it exists on Docker Hub | Server and worker pods `ImagePullBackOff`; event: `Failed to pull image "redislabs/agent-memory:<tag>": … not found` | Remove `*.image.tag` (defaults `0.7.0`) |
| <a id="cl-6"></a>CL-6 | `auth.worker_identity` matches the worker (issuer, audience, subject with your namespace) | Pods Ready, but no memories appear; worker log: `memory-dataplane API error: status 401`; the Data Plane logs `401` on `GET /v1/stores/<store-id>/session-memory/<session-id>` with no reason | Fix `issuer` from `/.well-known/openid-configuration` and the namespace in `subject`. The same symptom appears when the Data Plane cannot fetch the cluster JWKS, so also check [worker identity for your platform](#prepare-worker-identity-for-your-platform) |
{{< /table-scrollable >}}

## 4. Install

```bash
helm repo add redis-ai https://helm.redis.io/ai
helm repo update redis-ai
helm install redis-agent-memory redis-ai/redis-agent-memory \
  --version 0.7.0 \
  --namespace <namespace-name> \
  -f ram-values.yaml
kubectl -n <namespace-name> get pods -w
```

On small clusters, install without `--atomic --wait`, as shown, and watch pod status.

If you want Helm to wait, set an explicit timeout that matches the environment:

```bash
helm install redis-agent-memory redis-ai/redis-agent-memory \
  --version 0.7.0 \
  --namespace <namespace-name> \
  -f ram-values.yaml \
  --wait \
  --timeout 15m
```

## 5. Verify pods and health

```bash
kubectl -n <namespace-name> get pods -l app.kubernetes.io/name=redis-agent-memory
```

The server, worker, `redis-agent-memory-controlplane`, and `redis-agent-memory-identity-service`
pods are Ready.

Run each `port-forward` in this guide in its own terminal. Port-forward the Data Plane and check its
health. The health check doesn't need an agent key:

```bash
kubectl -n <namespace-name> port-forward svc/redis-agent-memory 9000:9000
curl http://localhost:9000/health
```

The response is:

```json
{"status":"healthy"}
```

## 6. Create a store

Use the Control Plane admin token:

```bash
kubectl -n <namespace-name> port-forward svc/redis-agent-memory-controlplane 9100:9100
RAM_ADMIN_TOKEN=$(kubectl -n <namespace-name> get secret \
  redis-agent-memory-controlplane-admin-token -o jsonpath='{.data.token}' | base64 -d)
curl -sS -X POST http://localhost:9100/v1/stores \
  -H "Authorization: Bearer $RAM_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "my-store"}'
```

The response carries `storeId`.

## 7. Mint an agent key

Use the Identity Service control token:

```bash
kubectl -n <namespace-name> port-forward svc/redis-agent-memory-identity-service 9200:9200
IDS_CONTROL_TOKEN=$(kubectl -n <namespace-name> get secret \
  redis-agent-memory-identity-service-control-token -o jsonpath='{.data.token}' | base64 -d)
curl -sS -X POST http://localhost:9200/v1/api-keys \
  -H "Authorization: Bearer $IDS_CONTROL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-agent-key",
    "grants": [
      {
        "tenant": "<your-tenant-id>",
        "product": "memory",
        "resourceType": "mem-store",
        "resourceId": "<store-id>",
        "actions": ["read", "write"]
      }
    ]
  }'
```

Use the same tenant on every grant of a key. The response's `token` is the agent key. It is shown
only once.

## 8. Make one authenticated call

```bash
curl -sS -X POST "http://localhost:9000/v1/stores/<store-id>/session-memory/events" \
  -H "Authorization: Bearer <agent-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-001",
    "actorId": "user-001",
    "role": "USER",
    "content": [{"text": "What is the capital of France?"}],
    "createdAt": "2026-06-25T18:00:00Z"
  }'
```

The first long-term memories appear up to 5 minutes after the session events, because promotion
runs at the end of a clock-aligned 300-second window. To shorten the wait, set
`extractionCadence.activeIntervalSeconds` (60–600) on the store. No API triggers promotion.

## Next steps

- [API examples](/content/operate/iris/agent-memory/self-managed/api-examples.md) for the full API.
- [Operations](/content/operate/iris/agent-memory/self-managed/operations.md) for key rotation.

## Evaluate locally

This setup runs with no external model provider. The `noop` embedder produces meaningless vectors,
and a small local model produces rough extractions. Use it to try the API, not to judge quality or
for production.

Save this Deployment and Service as `ollama.yaml`. Replace `<ollama-version>` with 0.13.3 or later:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ollama
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ollama
  template:
    metadata:
      labels:
        app: ollama
    spec:
      containers:
        - name: ollama
          image: ollama/ollama:<ollama-version>   # 0.13.3 or later
          env:
            - name: OLLAMA_CONTEXT_LENGTH
              value: "8192"
          command: ["/bin/sh", "-c"]
          args: ["ollama serve & until ollama list >/dev/null 2>&1; do sleep 1; done; ollama pull qwen2.5:3b; wait"]
          ports:
            - containerPort: 11434
          resources:
            requests:
              cpu: "2"
              memory: 4Gi
          volumeMounts:
            - name: models
              mountPath: /root/.ollama
      volumes:
        - name: models
          emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: ollama
spec:
  selector:
    app: ollama
  ports:
    - port: 11434
      targetPort: 11434
```

Deploy it in the release namespace:

```bash
kubectl -n <namespace-name> apply -f ollama.yaml
```

The first start downloads about 2 GB.

In `ram-values.yaml`, replace the provider blocks with:

```yaml
memory:
  embedding:
    provider: noop
    models:
      default_embedding_model: noop
      dimensions: 384
  embedders_connection_details:
    noop:
      protocol: noop
  inference_providers:
    ollama:
      protocol: openai
      endpoint:
        base_url: http://ollama:11434/v1
        timeout: 300s
      http_client:
        timeout: 300s
  promote_session_memory:
    strategies:
      instruct:
        llm:
          provider: ollama
          credentials:
            type: static
            api_key: ollama
          models:
            default_chat_model: qwen2.5:3b
controlplane:
  configData:
    embedding:
      dimensions: 384
```

`api_key: ollama` is a placeholder. The client requires a key, and Ollama ignores it.

In `overlay.yaml`, remove `embedders_connection_details.openai` and both `api_key` entries.
