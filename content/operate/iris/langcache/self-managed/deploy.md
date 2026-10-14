---
Title: Deploy self-managed LangCache
alwaysopen: false
categories:
- docs
- operate
- iris
description: Deploy self-managed LangCache with the langcache Helm chart.
linkTitle: Deploy
weight: 30
hideListLinks: true
---

One `helm install` of the `langcache` chart deploys the Data Plane, the
Control Plane, and either a bundled Identity Service or a connection to an
external Identity Service. There is no separate lighter-weight install
path; every self-managed LangCache deployment uses the Data Plane, Control
Plane, and one Identity Service mode.

Before you begin, review [prerequisites]({{< relref "/operate/iris/langcache/self-managed/prerequisites" >}})
and prepare the config overlays described in
[Configuration]({{< relref "/operate/iris/langcache/self-managed/configuration" >}}).

You use three credentials along the way: the Control Plane admin token, the Identity Service
control token, and an agent key. The chart generates the first two. For what each credential
unlocks, see [Credentials](/content/operate/iris/langcache/self-managed/authentication.md#credentials).

## Choose an Identity Service mode

Decide before you install:

| Mode | Use when | Values |
| --- | --- | --- |
| Bundled | This is your first LangCache install, or your suite doesn't already run an Identity Service. | `identityService.mode: bundled` |
| External | Your suite already runs an Identity Service (for example, alongside self-managed Redis Agent Memory) and you want LangCache to share it. | `identityService.mode: external` |

This guide uses bundled mode. For external mode, see
[Authentication and authorization]({{< relref "/operate/iris/langcache/self-managed/authentication#external-identity-service" >}})
for the values and the coordination required with the Identity Service's
owner.

## Create the namespace

```bash
kubectl create namespace <namespace-name>
```

## Create the required Secrets

Create the license Secret, shared by the Data Plane and Control Plane:

```bash
kubectl -n <namespace-name> create secret generic langcache-license \
  --from-file=license=./langcache.key
```

Create the config overlay Secrets described in
[Configuration]({{< relref "/operate/iris/langcache/self-managed/configuration" >}}):

```bash
kubectl -n <namespace-name> create secret generic dp-overlay \
  --from-file=overlay.yaml=./dp-overlay.yaml
kubectl -n <namespace-name> create secret generic cp-overlay \
  --from-file=overlay.yaml=./cp-overlay.yaml
kubectl -n <namespace-name> create secret generic ids-metadata \
  --from-file=metadata.yaml=./ids-metadata.yaml
```

## Create Helm values

Create `langcache-values.yaml`:

```yaml
dataplane:
  license:
    existingSecret: langcache-license
  secrets:
    secretName: dp-overlay
  embedding:
    provider: openai
    endpoint:
      baseURL: https://api.openai.com/v1
    credentials:
      type: static
    models:
      defaultEmbeddingModel: text-embedding-3-small
      dimensions: 1536

controlplane:
  secrets:
    secretName: cp-overlay
  configData:
    profile: prod

identityService:
  mode: bundled
  bundled:
    metadata:
      existingSecret: ids-metadata
```

This is a minimal complete install. `controlplane.adminToken`,
`controlplane.internalToken`, and `identityService.bundled.controlToken`
all default to `autoGenerate: true`, so the chart mints those tokens for
you on first install; see
[Authentication and authorization]({{< relref "/operate/iris/langcache/self-managed/authentication" >}})
to retrieve them, or set `existingSecret` to bring your own.

The chart renders the Control Plane's embedding contract from
`dataplane.embedding.*`, so set the provider, model, and dimensions only
under `dataplane.embedding`.

## Before you install: check your values

Check each item before you install and before you mint a key. If one is wrong, you see the symptom
in its row. The rows are checklist items LC-CL-1 to LC-CL-3.

{{< table-scrollable >}}
| Row | Check | Symptom | Fix |
| --- | --- | --- | --- |
| <a id="lc-cl-1"></a>LC-CL-1 | No image tag is set, or it exists on Docker Hub (`0.0.1` is the only published tag) | With `--atomic --wait`: `Error: INSTALLATION FAILED: release langcache failed, and has been uninstalled due to atomic being set: context deadline exceeded` after the wait times out; `kubectl get events` keeps `Failed to pull image "redislabs/iris-langcache-data:1.0.0": … not found` (also `-control`, `iris-identity-service`) | Remove `*.image.tag` |
| <a id="lc-cl-2"></a>LC-CL-2 | The Identity Service is reachable before you mint a key | `curl: (7) Failed to connect to localhost port 9200 after 0 ms: Couldn't connect to server` | Port-forward `svc/langcache-identity-service 9200:9200`, as in [Verify the deployment](#verify-the-deployment) |
| <a id="lc-cl-3"></a>LC-CL-3 | Every attribute you send was listed in `attributes` when the cache was created | `400`, `"detail":"attributes: no attributes are configured for this cache."` | Create the cache with the attribute names, for example `"attributes": ["topic"]` |
{{< /table-scrollable >}}

## Install the chart

Add the Helm repository when installing from the public repository:

```bash
helm repo add redis-ai https://helm.redis.io/ai
helm repo update redis-ai
helm search repo redis-ai/langcache --versions
```

Install with `langcache` as the Helm release name:

```bash
helm install langcache redis-ai/langcache \
  --version 0.0.1 \
  --namespace <namespace-name> \
  -f langcache-values.yaml \
  --atomic --wait
```

If you installed from a chart package or a local checkout instead, replace
`redis-ai/langcache --version 0.0.1` with the chart path (for
example `.` from the chart's own root directory).

On small clusters, install without `--atomic --wait`, then watch pod
status:

```bash
kubectl -n <namespace-name> get pods -w
```

## Verify the deployment

```bash
kubectl -n <namespace-name> rollout status deployment/langcache
kubectl -n <namespace-name> rollout status deployment/langcache-controlplane
kubectl -n <namespace-name> rollout status deployment/langcache-identity-service
```

Port-forward the Data Plane:

```bash
kubectl -n <namespace-name> port-forward svc/langcache 9000:9000
```

```bash
curl http://localhost:9000/health
```

Port-forward the Control Plane:

```bash
kubectl -n <namespace-name> port-forward svc/langcache-controlplane 9100:9100
```

Retrieve the auto-generated admin token, then create your first cache:

```bash
kubectl -n <namespace-name> get secret langcache-controlplane-admin-token \
  -o jsonpath="{.data.token}" | base64 -d
```

```bash
curl -sS -X POST http://localhost:9100/v1/caches \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-cache",
    "databaseId": "cache-primary",
    "defaultSearchThreshold": 0.9,
    "defaultTtlMillis": -1,
    "attributes": []
  }'
```

Port-forward the Identity Service (bundled mode):

```bash
kubectl -n <namespace-name> port-forward svc/langcache-identity-service 9200:9200
```

Retrieve the auto-generated Identity Service control token:

```bash
kubectl -n <namespace-name> get secret langcache-identity-service-control-token -o jsonpath="{.data.token}" | base64 -d
```

For the full self-managed admin API schema, see the
[Control Plane API reference]({{< relref "/operate/iris/langcache/self-managed/control-plane-api-reference" >}}).

Next, mint an agent key through the Identity Service and start calling the
Data Plane; see
[Authentication and authorization]({{< relref "/operate/iris/langcache/self-managed/authentication" >}})
and [API examples]({{< relref "/operate/iris/langcache/self-managed/api-examples" >}}).

## Update

```bash
helm upgrade langcache redis-ai/langcache \
  --version <chart-version> \
  --namespace <namespace-name> \
  -f langcache-values.yaml \
  --atomic --wait
```

## Next steps

- [Authentication and authorization]({{< relref "/operate/iris/langcache/self-managed/authentication" >}}) to mint agent keys and configure the Identity Service mode you chose.
- [API examples]({{< relref "/operate/iris/langcache/self-managed/api-examples" >}}) to start calling the Data Plane.
- [Operations]({{< relref "/operate/iris/langcache/self-managed/operations" >}}) for backups, secret rotation, and FIPS posture.
