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
Control Plane, and (by default) a bundled Identity Service. There is no
separate lighter-weight install path; every self-managed LangCache
deployment uses all three components.

Before you begin, review [prerequisites]({{< relref "/operate/iris/langcache/self-managed/prerequisites" >}})
and prepare the config overlays described in
[Configuration]({{< relref "/operate/iris/langcache/self-managed/configuration" >}}).

## Choose an Identity Service mode

Decide before you install:

| Mode | Use when | Values |
| --- | --- | --- |
| Bundled (default) | This is your first LangCache install, or your suite doesn't already run an Identity Service. | `identityService.mode: bundled` |
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
  image:
    repository: redislabs/iris-langcache-data
    tag: "<langcache-version>"
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
  image:
    repository: redislabs/iris-langcache-control
    tag: "<langcache-version>"
  secrets:
    secretName: cp-overlay
  configData:
    profile: prod
    embedders:
      openai:
        models:
          - model: text-embedding-3-small
            dimensions: 1536

identityService:
  mode: bundled
  bundled:
    image:
      repository: redislabs/iris-identity-service
      tag: "<langcache-version>"
    metadata:
      existingSecret: ids-metadata
```

This is a minimal complete install. `controlplane.adminToken`,
`controlplane.internalToken`, and `identityService.bundled.controlToken`
all default to `autoGenerate: true`, so the chart mints those tokens for
you on first install; see
[Authentication and authorization]({{< relref "/operate/iris/langcache/self-managed/authentication" >}})
to retrieve them, or set `existingSecret` to bring your own.

## Install the chart

Install from the chart package or repository your Redis representative
provides. From the chart's own root directory (`langcache/helm/` in the
source layout):

```bash
helm install langcache . \
  --namespace <namespace-name> \
  --create-namespace \
  -f langcache-values.yaml \
  --atomic --wait
```

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

For the full self-managed admin API schema, see the
[Control Plane API reference]({{< relref "/operate/iris/langcache/self-managed/control-plane-api-reference" >}}).

Next, mint an agent key through the Identity Service and start calling the
Data Plane; see
[Authentication and authorization]({{< relref "/operate/iris/langcache/self-managed/authentication" >}})
and [API examples]({{< relref "/operate/iris/langcache/self-managed/api-examples" >}}).

## Update

```bash
helm upgrade langcache . \
  --namespace <namespace-name> \
  -f langcache-values.yaml \
  --atomic --wait
```
