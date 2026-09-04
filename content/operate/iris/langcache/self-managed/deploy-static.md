---
Title: Deploy with static caches
alwaysopen: false
categories:
- docs
- operate
- iris
description: Deploy LangCache with static caches and no Control Plane.
linkTitle: Deploy with static caches
weight: 40
hideListLinks: true
---

Use static caches for a first install or a private single-cache deployment.
In this mode, caches are declared directly in Data Plane configuration. The
deployment does not include the Control Plane and does not use Metadata
Redis. This is the mode the published `langcache` Helm chart deploys today.

Before you begin, review [prerequisites]({{< relref "/operate/iris/langcache/self-managed/prerequisites" >}})
and the
[static caches config example]({{< relref "/operate/iris/langcache/self-managed/data-plane-configuration#static-caches-example" >}}),
which you'll paste into the Helm values below.

## Create the namespace

```bash
kubectl create namespace <namespace-name>
```

## Create Helm values

The published `langcache` chart takes `dataplane.config.yaml` inline as the
`config` value; there is no `existingSecret` option for it. Paste the
content of your `dataplane.config.yaml` (from the
[static caches example]({{< relref "/operate/iris/langcache/self-managed/data-plane-configuration#static-caches-example" >}}))
under `config` in `langcache-values.yaml`:

```yaml
nameOverride: langcache
fullnameOverride: langcache

image:
  repository: <your-registry>/langcache
  tag: "<langcache-version>"

config:
  server:
    port: 8080
  profile: prod
  metadata:
    loader: static
    cache_ttl: 1m
    caches:
      - id: my-cache
        urls:
          - redis://cache-redis:6379
        index: idx:my-cache
        model:
          type: openai
          name: text-embedding-3-large
          dimensions: 3072
        attributes: []
        default_ttl: 60000
        default_search_threshold: 0.9
        search_strategies:
          default_strategies:
            - semantic
  embeddings:
    openai:
      default:
        base_url: https://api.openai.com

initProvisioner:
  enabled: true
  config: /etc/langcache/dataplane.config.yaml
```

Because the chart renders `config` into a ConfigMap rather than a Secret,
treat `langcache-values.yaml` itself as sensitive — it contains any
embedding provider credentials and Redis URL credentials you configure. See
[Data Plane configuration]({{< relref "/operate/iris/langcache/self-managed/data-plane-configuration#config-storage" >}})
for a Secret-backed alternative.

`nameOverride`/`fullnameOverride` make the rendered resource names match the
`langcache` names used in the verification commands below; the chart's own
default names are longer. `initProvisioner.enabled: true` runs
`provision-cache-index --ignore` as an init container so cache indexes exist
before the Data Plane starts, without recreating indexes that already exist.

## Install the chart

Install from the chart package provided by your Redis representative:

```bash
helm install langcache ./langcache \
  --namespace <namespace-name> \
  --create-namespace \
  -f langcache-values.yaml
```

On small clusters, install without `--atomic --wait`, then watch pod status:

```bash
kubectl -n <namespace-name> get pods -w
```

If you want Helm to wait, set an explicit timeout that matches the
environment:

```bash
helm install langcache ./langcache \
  --namespace <namespace-name> \
  --create-namespace \
  -f langcache-values.yaml \
  --wait \
  --timeout 15m
```

## Verify the deployment

Check pods:

```bash
kubectl -n <namespace-name> get pods -l app.kubernetes.io/name=langcache
```

Port-forward the Data Plane:

```bash
kubectl -n <namespace-name> port-forward svc/langcache 8080:8080
```

Check health endpoints:

```bash
curl http://localhost:8080/health
curl http://localhost:8080/health/liveness
curl http://localhost:8080/health/readiness
```

Check the configured cache:

```bash
curl http://localhost:8080/v1/caches/my-cache/health
```

Do not expose an auth-disabled Data Plane to untrusted callers. Use
Kubernetes NetworkPolicy, private service exposure, ingress, gateway, service
mesh, or equivalent controls to restrict access.
