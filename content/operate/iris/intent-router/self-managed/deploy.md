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

Follow these steps to install the Intent Router control plane and data plane with the `redis-intent-router` Helm chart, connect them to your Identity Service release, and end with one authenticated match request.

You use three credentials along the way: the control-plane admin token, the Identity Service control token, and an agent key. For what each credential unlocks, see [Credentials](/content/operate/iris/intent-router/self-managed/authentication.md#credentials).

Before you begin, review the [prerequisites](/content/operate/iris/intent-router/self-managed/prerequisites.md).

## 1. Create the namespace

```bash
kubectl create namespace <namespace-name>
```

## 2. Create Secrets

### Configure the Identity Service release first

For every Identity Service setting, and for running one release that serves several products, see the [Identity Service guide](/content/operate/iris/identity-service/_index.md).

The chart deploys no Identity Service. Set these values on your Identity Service release so that it checks Router grants and accepts the data plane's runtime credential. The examples assume this chart is installed as release `intent` in the same namespace as an Identity Service release named `ids`.

| Identity Service value | Setting |
| --- | --- |
| `runtime.serviceCredentials[]` | An entry with `name: intent-dp`, `subject: intent-dp`, `allowedOperations: [api-key-introspect]`, `allowedProducts: [intent]`, and the same `existingSecret` and `secretKey` as `identityService.credential`. |
| `productValidation.products.intent.enabled` | `true` |
| `productValidation.products.intent.baseURL` | The control-plane Service, `http://intent-redis-intent-router-controlplane:9400`. |
| `productValidation.products.intent.credential` | The same Secret and key as `controlplane.internalToken`. |
| `runtime.apiKeyTenant.singleTenantID` | The same value as `tenantId`. |

Neither chart checks these values against the other. If the Identity Service release also serves other Iris products, add these entries to its existing lists. All products use the one tenant.

### Create the connection files

Save the two Redis connections as `intent-controlplane-storage.yaml` and `intent-dataplane-storage.yaml`, as shown in [Storage Secret](/content/operate/iris/intent-router/self-managed/configuration.md#storage-secret). The file names become the Secret's keys.

### Create the Secrets

Generate three distinct tokens, then create the Secrets:

```bash
umask 077
for token in admin-token internal-token dp-credential; do
  openssl rand -base64 32 > "$token"
done
kubectl -n <namespace-name> create secret generic intent-storage \
  --from-file=intent-controlplane-storage.yaml \
  --from-file=intent-dataplane-storage.yaml
kubectl -n <namespace-name> create secret generic intent-license --from-file=license=./license
kubectl -n <namespace-name> create secret generic intent-controlplane-admin --from-file=token=./admin-token
kubectl -n <namespace-name> create secret generic intent-controlplane-internal --from-file=token=./internal-token
kubectl -n <namespace-name> create secret generic intent-dp-credential --from-file=token=./dp-credential
```

The Identity Service release mounts `intent-controlplane-internal` and `intent-dp-credential` too, so create them in its namespace as well if it runs in another one.

To let the chart generate the admin or internal token instead, skip its Secret and delete its `existingSecret` line from the values file. The chart keeps a generated token across upgrades and never rotates it. The chart never generates `intent-dp-credential`.

For an embedding provider other than `noop`, also create the inference Secret, as shown in [Embedding models](/content/operate/iris/intent-router/self-managed/configuration.md#embedding-models).

## 3. Create `intent-values.yaml`

Write the values file from [Helm values](/content/operate/iris/intent-router/self-managed/configuration.md#helm-values), with your tenant, image tags, and Secret names.

## Before you install: check your values

Check each value before you install. If one is wrong, you see the symptom in its row.

{{< table-scrollable >}}
| Check | Symptom | Fix |
| --- | --- | --- |
| `tenantId` is set | Rendering fails with a named message | Set the tenant. |
| Each image has a `tag` | Rendering fails, or pods `ImagePullBackOff` | Set `controlplane.image.tag` and `dataplane.image.tag`. |
| The admin token, internal token, and Identity Service credential come from three different Secrets or keys | Rendering fails | Create three distinct token files. |
| `dataplane.identityServiceBaseURL` is `https://`, or `identityService.allowInsecureTransport` is `true` | Rendering fails | Choose one. |
| `tenantId` equals the Identity Service's `runtime.apiKeyTenant.singleTenantID` | Minting an agent key for a Router fails | Set both to the same tenant. |
| `inference.models` lists one model, and `noop` only with `inference.allowLocalModels=true` | Rendering fails | List the one model the deployment offers. |
| The inference Secret has an `embedders_connection_details` entry named after the model's `provider` | A new Router stays `PROVISIONING` or fails | Add the entry under that provider name. |
| The data-plane Redis has Search | A new Router is `FAILED` and `failureReason` mentions vector search | Use a Redis 8 build that includes Search, or load the Search and Query engine. |
{{< /table-scrollable >}}

## 4. Install

```bash
helm repo add redis-ai https://helm.redis.io/ai
helm repo update redis-ai
helm install intent redis-ai/redis-intent-router \
  --version 0.1.0 \
  --namespace <namespace-name> \
  -f intent-values.yaml \
  --wait --timeout 5m
```

To add `helm test` pods that probe each service and run the shared security-profile checks, set `tests.enabled` to `true` in your values.

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
kubectl -n <namespace-name> port-forward svc/ids-iris-identity-service 9200:9200
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

The [API examples](/content/operate/iris/intent-router/self-managed/api-examples.md#create-a-router) create the Router and wait until its state is `READY`.

## 7. Mint an agent key

Mint a key with a grant on the Router through the Identity Service. See [Mint an agent key](/content/operate/iris/intent-router/self-managed/api-examples.md#mint-an-agent-key).

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
- [Operate the deployment](/content/operate/iris/intent-router/self-managed/operations.md).
