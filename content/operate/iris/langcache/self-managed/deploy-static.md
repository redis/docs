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
and create `dataplane.config.yaml` from the
[static caches example]({{< relref "/operate/iris/langcache/self-managed/data-plane-configuration#static-caches-example" >}}).

## Create the namespace

```bash
kubectl create namespace <namespace-name>
```

## Create the config Secret

```bash
kubectl -n <namespace-name> create secret generic langcache-config \
  --from-file=dataplane.config.yaml=./dataplane.config.yaml
```

## Create Helm values

Create `langcache-values.yaml`:

```yaml
image:
  repository: <your-registry>/langcache
  tag: "<langcache-version>"

config:
  existingSecret: langcache-config

initProvisioner:
  enabled: true
  config: /etc/langcache/dataplane.config.yaml
```

`config.existingSecret` points the chart at the config Secret you created.
`initProvisioner.enabled: true` runs `provision-cache-index --ignore` as an
init container so cache indexes exist before the Data Plane starts, without
recreating indexes that already exist.

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
