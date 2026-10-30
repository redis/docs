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
aliases:
- /operate/iris/intent-router/self-managed/deploy/
---

Follow these steps to install the Intent Router control plane, data plane, and Identity Service with the `redis-intent-router` Helm chart, and end with one authenticated match request.

You use three credentials along the way: the control-plane admin token, the Identity Service control token, and an agent key. For what each credential unlocks, see [Credentials](/content/operate/iris/self-managed/intent-router/authentication.md#credentials).

Before you begin, review the [prerequisites](/content/operate/iris/self-managed/intent-router/prerequisites.md).

## 1. Create the namespace

```bash
kubectl create namespace <namespace-name>
```

## 2. Create Secrets

### Create the connection files

Save the three Redis connections as `intent-controlplane-storage.yaml`, `intent-dataplane-storage.yaml`, and `identity-service-metadata.yaml`, as shown in [Storage Secret](/content/operate/iris/self-managed/intent-router/configuration.md#storage-secret). The file names become the Secret's keys.

### Create the Secrets

Generate four distinct tokens, then create the Secrets:

```bash
umask 077
for token in admin-token internal-token identity-control-token identity-runtime-token; do
  openssl rand -base64 32 > "$token"
done
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

To let the chart generate a token instead, skip its Secret and delete its `existingSecret` line from the values file. The chart keeps a generated token across upgrades and never rotates it.

For an embedding provider other than `noop`, also create the inference Secret, as shown in [Embedding models](/content/operate/iris/self-managed/intent-router/configuration.md#embedding-models).

## 3. Create `intent-values.yaml`

Write the values file from [Helm values](/content/operate/iris/self-managed/intent-router/configuration.md#helm-values), with your tenant, image tags, and Secret names.

## Before you install: check your values

Check each value before you install. If one is wrong, you see the symptom in its row.

{{< table-scrollable >}}
| Check | Symptom | Fix |
| --- | --- | --- |
| `tenantId` is set | Rendering fails with a named message | Set the tenant. |
| Each image has a `repository` and a `tag` | Rendering fails, or pods `ImagePullBackOff` | Set both for all three images. |
| The four tokens come from four different Secrets or keys | Rendering fails | Create four distinct token files. |
| `dataplane.identityServiceBaseURL` is `https://`, or `allowInsecureIdentityService` is `true` | Rendering fails | Choose one. |
| `inference.models` lists one model, and `noop` only with `inference.allowLocalModels=true` | Rendering fails | List the one model the deployment offers. |
| The inference Secret has an `embedders_connection_details` entry named after the model's `provider` | A new Router stays `PROVISIONING` or fails | Add the entry under that provider name. |
| The data-plane Redis has Search | A new Router is `FAILED` and `failureReason` mentions vector search | Use a Redis 8 build that includes Search, or load the Search and Query engine. |
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

To add `helm test` pods that probe each service and run the shared security-profile checks, set `tests.enabled` to `true` in your values.

## 5. Verify pods and health

```bash
kubectl -n <namespace-name> rollout status deployment/intent-redis-intent-router-controlplane
kubectl -n <namespace-name> rollout status deployment/intent-redis-intent-router-dataplane
kubectl -n <namespace-name> rollout status deployment/intent-redis-intent-router-identity-service
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

Then check readiness on every service:

```bash
curl -sS http://localhost:9400/health/readiness
curl -sS http://localhost:9401/health/readiness
curl -sS http://localhost:9200/health/readiness
```

## 6. Create a Router

Load the admin token, then create a Router. See [Manage Routers](/content/develop/ai/context-engine/intent-router/manage-routers.md) for every option.

```bash
export IRIS_INTENT_ROUTER_SERVICE_URL='http://localhost:9400'
export IRIS_INTENT_ROUTER_SERVICE_TOKEN="$(kubectl -n <namespace-name> get secret \
  intent-controlplane-admin -o jsonpath='{.data.token}' | base64 --decode)"
```

If the chart generated the admin token, read it from `intent-redis-intent-router-controlplane-admin-token` instead.

The [API examples](/content/operate/iris/self-managed/intent-router/api-examples.md#create-a-router) create the Router and wait until its state is `READY`.

## 7. Mint an agent key

Mint a key with a grant on the Router through the Identity Service. See [Mint an agent key](/content/operate/iris/self-managed/intent-router/api-examples.md#mint-an-agent-key).

## 8. Make one authenticated call

Match a query with the key against the data plane:

```bash
curl -sS -X POST "$IRIS_INTENT_ROUTER_URL/iris/data/v1/intent/routers/$IRIS_INTENT_ROUTER_ID/match" \
  -H "Authorization: Bearer $IRIS_INTENT_ROUTER_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"query": "hello"}'
```

A Router with no intents returns `200` and `{"items": []}`. A `401` means the key is wrong, and a `403` means it lacks a grant on the Router. A `409` means the Router isn't `READY` yet.

## Next steps

- [Define intents and match queries](/content/develop/ai/context-engine/intent-router/quickstart.md).
- [Operate the deployment](/content/operate/iris/self-managed/intent-router/operations.md).
