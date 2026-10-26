---
Title: Deploy Redis Intent Router
alwaysopen: false
categories:
- docs
- operate
- iris
description: Install Redis Intent Router, then create a Router, mint an agent key, and make one authenticated match.
linkTitle: Deploy
weight: 50
hideListLinks: true
---

These steps install the Intent Router control plane, data plane, and Identity Service with the `redis-intent-router` Helm chart, and end with one authenticated match request.

You use three credentials along the way: the control plane admin token, the Identity Service control token, and an agent key. For what each credential unlocks, see [Credentials](/content/operate/iris/intent-router/self-managed/authentication.md#credentials).

Before you begin, review the [prerequisites](/content/operate/iris/intent-router/self-managed/prerequisites.md).

## 1. Create the namespace

```bash
kubectl create namespace <namespace-name>
```

## 2. Create Secrets

Save the three Redis connections in one file for each service, as shown in [Storage Secret](/content/operate/iris/intent-router/self-managed/configuration.md#storage-secret). Then create the Secrets:

```bash
umask 077
kubectl -n <namespace-name> create secret generic intent-storage \
  --from-file=intent-controlplane-storage.yaml \
  --from-file=intent-dataplane-storage.yaml \
  --from-file=identity-service-metadata.yaml
kubectl -n <namespace-name> create secret generic intent-license --from-file=license=./license
kubectl -n <namespace-name> create secret generic intent-controlplane-admin --from-file=token=./admin-token
kubectl -n <namespace-name> create secret generic intent-controlplane-internal --from-file=token=./internal-token
kubectl -n <namespace-name> create secret generic intent-identity-control --from-file=token=./identity-control-token
kubectl -n <namespace-name> create secret generic intent-identity-runtime --from-file=token=./identity-runtime-token
```

The four tokens must be distinct. Omit a token Secret and the chart generates one, keeps it across upgrades, and never rotates it. For an embedding provider other than `noop`, also create the inference Secret. See [Embedding models](/content/operate/iris/intent-router/self-managed/configuration.md#embedding-models).

## 3. Create `intent-values.yaml`

Write the values file from [Helm values](/content/operate/iris/intent-router/self-managed/configuration.md#helm-values), with your registry, image tags, and Secret names.

## Before you install: check your values

Check each value before you install. If one is wrong, you see the symptom in its row.

{{< table-scrollable >}}
| Check | Symptom | Fix |
| --- | --- | --- |
| `tenantId` is set | Rendering fails with a named message | Set the tenant. |
| Each image has a `repository` and a `tag` | Rendering fails, or pods `ImagePullBackOff` | Set both for all three images. |
| The four tokens come from four different Secrets or keys | Rendering fails | Create four distinct token files. |
| `dataplane.identityServiceBaseURL` is `https://`, or `allowInsecureIdentityService` is `true` | Rendering fails | Choose one. |
| The data-plane Redis has Search | A new Router is `FAILED` and `failureReason` mentions vector search | Use Redis 8, or load the Search and Query engine. |
| `inference.models` matches the inference Secret | A new Router stays `PROVISIONING` or fails | Keep the provider, model, and dimensions identical in both. |
{{< /table-scrollable >}}

## 4. Install

```bash
helm repo add redis-ai https://helm.redis.io/ai
helm repo update redis-ai
helm install intent redis-ai/redis-intent-router \
  --version <chart-version> \
  --namespace <namespace-name> \
  -f intent-values.yaml \
  --wait --timeout 5m
```

Set `tests.enabled=true` in your values to add `helm test` pods that probe each service and run the shared security-profile checks.

## 5. Verify pods and health

```bash
kubectl -n <namespace-name> rollout status deployment/intent-redis-intent-router-controlplane
kubectl -n <namespace-name> rollout status deployment/intent-redis-intent-router-dataplane
```

Run each port-forward in its own terminal and leave it running:

```bash
kubectl -n <namespace-name> port-forward svc/intent-redis-intent-router-controlplane 9400:9400
```

```bash
kubectl -n <namespace-name> port-forward svc/intent-redis-intent-router-dataplane 9401:9401
```

```bash
kubectl -n <namespace-name> port-forward svc/intent-redis-intent-router-identity-service 9200:9200
```

Then check readiness on both planes:

```bash
curl -sS http://localhost:9400/health/readiness
curl -sS http://localhost:9401/health/readiness
```

## 6. Create a Router

Load the admin token, then create a Router. See [Manage Routers](/content/develop/ai/context-engine/intent-router/manage-routers.md) for every option.

```bash
export IRIS_INTENT_ROUTER_SERVICE_URL='http://localhost:9400'
export IRIS_INTENT_ROUTER_SERVICE_TOKEN="$(kubectl -n <namespace-name> get secret \
  intent-controlplane-admin -o jsonpath='{.data.token}' | base64 --decode)"
```

The [API examples](/content/operate/iris/intent-router/self-managed/api-examples.md#create-a-router) create the Router and wait until its state is `READY`.

## 7. Mint an agent key

Mint a key with a grant on the Router through the Identity Service. See [Mint an agent key](/content/operate/iris/intent-router/self-managed/api-examples.md#mint-an-agent-key).

## 8. Make one authenticated call

Match a query with the key against the data plane:

```bash
curl -sS -X POST "http://localhost:9401/iris/v2/intent/routers/$ROUTER_ID/match" \
  -H "Authorization: Bearer $INTENT_ROUTER_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"query": "hello"}'
```

A Router with no intents returns `200` and `{"items": []}`. A `401` means the key is wrong, and a `403` means it lacks a grant on the Router. A `409` means the Router isn't `READY` yet.

## Next steps

- [Define intents and match queries](/content/develop/ai/context-engine/intent-router/quickstart.md).
- [Operate the deployment](/content/operate/iris/intent-router/self-managed/operations.md).
