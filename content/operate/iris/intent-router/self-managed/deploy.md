---
Title: Deploy Redis Intent Router
alwaysopen: false
categories:
- docs
- operate
- iris
description: Add Redis Intent Router to a Redis Iris suite release, then create a Router, mint an agent key, and make one authenticated match.
linkTitle: Deploy
weight: 50
hideListLinks: true
---

Intent Router installs as part of the `redis-iris` Helm chart. Follow [Install the Redis Iris suite](/content/operate/iris/self-managed/_index.md) for the prerequisites, the shared Secrets, the preflight, and the install. This page covers what Intent Router adds to that release, and ends with one authenticated match request to the data plane.

Intent Router is on by default (`global.iris.products.intent.enabled: true`). Its values go under the `intent:` key in `iris-values.yaml`. The chart's `examples/intent.yaml` is a working values file for these steps.

## 1. Create the Intent Router Secrets

Save the two Redis connections as `intent-controlplane-storage.yaml` and `intent-dataplane-storage.yaml`, as shown in [Storage Secret](/content/operate/iris/intent-router/self-managed/configuration.md#storage-secret). The file names become the Secret's keys. For an embedding provider other than `noop`, also prepare `inference.yaml`, as shown in [Embedding models](/content/operate/iris/intent-router/self-managed/configuration.md#embedding-models). Then create the Secrets:

```bash
kubectl -n <namespace-name> create secret generic intent-storage \
  --from-file=intent-controlplane-storage.yaml \
  --from-file=intent-dataplane-storage.yaml
kubectl -n <namespace-name> create secret generic intent-inference --from-file=inference.yaml
```

You don't need `intent-inference` when the model is `noop`.

## 2. Add the Intent Router values

Add the storage Secret, the embedding model, and the inference Secret to `iris-values.yaml`. See [Helm values](/content/operate/iris/intent-router/self-managed/configuration.md#helm-values) for each setting.

```yaml
intent:
  storage:
    existingSecret: intent-storage
  inference:
    existingSecret: intent-inference
    models:
      - provider: openai
        model: text-embedding-3-small
        dimensions: 1536
```

The suite sets these Intent Router values itself. Don't set them under `intent:`: a value that differs fails the render and names the field.

- `tenantId` and `license.*`, from `global.iris.tenantId` and `global.iris.license`.
- `dataplane.identityServiceBaseURL` and `identityService.allowInsecureTransport`, for the suite's own Identity Service.
- `identityService.credential` and `controlplane.internalToken`, from the credentials the suite generates or that you supply in `global.iris.secrets`. The suite registers them and the tenant on its Identity Service. The admin token is in the Secret `iris-intent-admin-token`.
- `auth.oidc.audience`, `dataplane.oidc`, and `controlplane.oidc.enabled`, from `global.iris.auth`.
- `fullnameOverride`, the Service ports, `dataplane.strategy`, and `podDisruptionBudget.enabled`, which the suite fixes. The suite runs two data-plane replicas by default.

The suite chart doesn't support the FIPS profile.

Check these values before you install. If one is wrong, you see the symptom in its row.

{{< table-scrollable >}}
| Check | Symptom | Fix |
| --- | --- | --- |
| `inference.models` lists one model, and `noop` only with `inference.allowLocalModels=true` | Rendering fails | List the one model the deployment offers. |
| The inference Secret has an `embedders_connection_details` entry named after the model's `provider` | A new Router stays `PROVISIONING` or fails | Add the entry under that provider name. |
| The data-plane Redis has Search | A new Router is `FAILED` and `failureReason` mentions vector search | Use a Redis 8 build that includes Search, or load the Search and Query engine. |
{{< /table-scrollable >}}

## 3. Install or upgrade the release

For a new release, follow [Run the preflight](/content/operate/iris/self-managed/_index.md#4-run-the-preflight) and [Install](/content/operate/iris/self-managed/_index.md#5-install). To add Intent Router to a running release, upgrade it:

```bash
helm upgrade iris redis-ai/redis-iris \
  --version '~1.0.1' \
  --namespace <namespace-name> \
  -f iris-values.yaml
```

## 4. Verify the deployment

```bash
kubectl -n <namespace-name> rollout status deployment/redis-intent-router-controlplane
kubectl -n <namespace-name> rollout status deployment/redis-intent-router-dataplane
helm test iris --namespace <namespace-name> --logs
```

`helm test` upserts and matches an intent, which calls the embedding provider in `intent-inference`, so it needs a real OpenAI-compatible endpoint and key. With a placeholder key, the upsert fails with `424`. See [Verify the release](/content/operate/iris/self-managed/_index.md#6-verify-the-release).

To call the services from your workstation, run each port-forward in its own terminal and leave it running:

```bash
kubectl -n <namespace-name> port-forward svc/redis-intent-router-controlplane 9400:9400
```

```bash
kubectl -n <namespace-name> port-forward svc/redis-intent-router-dataplane 9401:9401
```

```bash
kubectl -n <namespace-name> port-forward svc/iris-identity-service 9200:9200
```

## 5. Create a Router

Load the admin token and the Identity Service control token from the Secrets the suite generated. See [Credentials](/content/operate/iris/self-managed/_index.md#credentials).

```bash
export IRIS_INTENT_ROUTER_SERVICE_TOKEN="$(kubectl -n <namespace-name> get secret \
  iris-intent-admin-token -o jsonpath='{.data.token}' | base64 --decode)"
export IRIS_IDENTITY_TOKEN="$(kubectl -n <namespace-name> get secret \
  iris-identity-service-control-token -o jsonpath='{.data.token}' | base64 --decode)"
```

Then follow [Create a Router](/content/operate/iris/intent-router/self-managed/api-examples.md#create-a-router), which creates the Router and waits until its state is `READY`. See [Manage Routers](/content/develop/ai/context-engine/intent-router/manage-routers.md) for every option.

To create the Router and its agent key in one step instead, use the `iris` CLI as in [Create a store with the `iris` CLI](/content/operate/iris/self-managed/_index.md#7-create-a-store-with-the-iris-cli).

## 6. Mint an agent key

Mint a key with a grant on the Router through the Identity Service. See [Mint an agent key](/content/operate/iris/intent-router/self-managed/api-examples.md#mint-an-agent-key).

## 7. Make one authenticated call

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
