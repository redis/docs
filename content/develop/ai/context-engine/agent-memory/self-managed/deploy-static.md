---
Title: Deploy with static stores
alwaysopen: false
categories:
- docs
- develop
- ai
description: Deploy Redis Agent Memory with static stores and no Control Plane.
linkTitle: Deploy with static stores
weight: 40
hideListLinks: true
aliases:
- /develop/ai/context-engine/agent-memory/self-managed/install-k8s/
---

Use static stores for a first install or a private single-store deployment. In
this mode, stores are declared directly in Data Plane configuration. The
deployment does not include the Control Plane and does not use Metadata Redis.

Before you begin, review [prerequisites]({{< relref "/develop/ai/context-engine/agent-memory/self-managed/prerequisites" >}})
and create `memory-dataplane.config.yaml` from the
[static stores example]({{< relref "/develop/ai/context-engine/agent-memory/self-managed/data-plane-configuration#static-stores-example" >}}).

## Create the namespace

```bash
kubectl create namespace <namespace-name>
```

## Create Secrets

Create the license Secret:

```bash
kubectl -n <namespace-name> create secret generic ram-license \
  --from-file=license=./license
```

Create the Data Plane config Secret:

```bash
kubectl -n <namespace-name> create secret generic ram-config \
  --from-file=memory-dataplane.config.yaml=./memory-dataplane.config.yaml
```

## Create Helm values

Create checksums for externally managed Secrets. Change these values whenever
the license or config changes so the pods roll automatically:

```bash
LICENSE_CHECKSUM="$(shasum ./license | awk '{print $1}')"
CONFIG_CHECKSUM="$(shasum ./memory-dataplane.config.yaml | awk '{print $1}')"
```

Create `ram-values.yaml`:

```yaml
license:
  existingSecret: ram-license
  existingSecretChecksum: "<license-checksum>"

config:
  existingSecret: ram-config
  existingSecretChecksum: "<config-checksum>"

image:
  repository: redislabs/agent-memory
  tag: "<ram-version>"
```

## Install the chart

Add the Helm repository when installing from the public repository:

```bash
helm repo add redis-ai https://helm.redis.io/ai --force-update
helm repo update redis-ai
helm search repo redis-ai/redis-agent-memory --versions
```

Install with `redis-agent-memory` as the Helm release name:

```bash
helm install redis-agent-memory redis-ai/redis-agent-memory \
  --version <chart-version> \
  --namespace <namespace-name> \
  --create-namespace \
  -f ram-values.yaml
```

On small clusters, install without `--atomic --wait`, then watch pod status:

```bash
kubectl -n <namespace-name> get pods -w
```

If you want Helm to wait, set an explicit timeout that matches the environment:

```bash
helm install redis-agent-memory redis-ai/redis-agent-memory \
  --version <chart-version> \
  --namespace <namespace-name> \
  --create-namespace \
  -f ram-values.yaml \
  --wait \
  --timeout 15m
```

## Verify the deployment

Check pods:

```bash
kubectl -n <namespace-name> get pods -l app.kubernetes.io/name=redis-agent-memory
```

Port-forward the Data Plane:

```bash
kubectl -n <namespace-name> port-forward svc/redis-agent-memory 9000:9000
```

Check health endpoints:

```bash
curl http://localhost:9000/health
curl http://localhost:9000/health/liveness
curl http://localhost:9000/health/readiness
```

Expected `/health` response:

```json
{"status":"healthy"}
```

Do not expose an auth-disabled Data Plane to untrusted callers. Use Kubernetes
NetworkPolicy, private service exposure, ingress, gateway, service mesh, or
equivalent controls to restrict access.
