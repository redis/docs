---
Title: Deploy with Control Plane managed stores
alwaysopen: false
categories:
- docs
- develop
- ai
description: Deploy Redis Agent Memory with stores managed by the self-managed Control Plane.
linkTitle: Deploy with Control Plane managed stores
weight: 50
hideListLinks: true
aliases:
- /develop/ai/context-engine/agent-memory/self-managed/control-plane/
---

Use Control Plane managed stores when operators need to create stores or agent
keys at runtime. In this mode, the Data Plane reads store and agent-key records
from Metadata Redis.

Before you begin, review [prerequisites]({{< relref "/develop/ai/context-engine/agent-memory/self-managed/prerequisites" >}})
and create `memory-dataplane.config.yaml` from the
[Control Plane managed stores example]({{< relref "/develop/ai/context-engine/agent-memory/self-managed/data-plane-configuration#control-plane-managed-stores-example" >}}).

## Create the namespace

```bash
kubectl create namespace <namespace-name>
```

## Create shared Secrets

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

## Create the Control Plane config

Create `controlplane-onprem.config.yaml`:

```yaml
profile: prod

auth:
  type: admin-token
  admin_token:
    token_file: /etc/controlplane-onprem/admin/token

license:
  license_path: /etc/redis-agent-memory/license

metadata:
  urls:
    - redis://redis-meta:6379
  namespace: iris:memory

store_db:
  urls:
    - redis://redis-store:6379

embedding:
  dimensions: 3072
```

Create the Control Plane config Secret:

```bash
kubectl -n <namespace-name> create secret generic ram-controlplane-config \
  --from-file=controlplane-onprem.config.yaml=./controlplane-onprem.config.yaml
```

Bring your own admin token:

```bash
kubectl -n <namespace-name> create secret generic ram-controlplane-admin-token \
  --from-literal=token='<admin-token>'
```

To read the admin token from the Secret used in this guide:

```bash
kubectl -n <namespace-name> get secret \
  ram-controlplane-admin-token \
  -o jsonpath="{.data.token}" | base64 -d
```

## Create Helm values

Create checksums for externally managed Secrets. Change these values whenever
the license or config changes so the pods roll automatically:

```bash
LICENSE_CHECKSUM="$(shasum ./license | awk '{print $1}')"
CONFIG_CHECKSUM="$(shasum ./memory-dataplane.config.yaml | awk '{print $1}')"
CONTROLPLANE_CONFIG_CHECKSUM="$(shasum ./controlplane-onprem.config.yaml | awk '{print $1}')"
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

controlplane:
  enabled: true
  image:
    repository: redislabs/agent-memory-control-plane
    tag: "<ram-version>"
  config:
    existingSecret: ram-controlplane-config
    existingSecretChecksum: "<controlplane-config-checksum>"
  adminToken:
    existingSecret: ram-controlplane-admin-token
    secretKey: token
    autoGenerate: false
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

Check Data Plane health:

```bash
curl http://localhost:9000/health
curl http://localhost:9000/health/liveness
curl http://localhost:9000/health/readiness
```

Port-forward the Control Plane:

```bash
kubectl -n <namespace-name> port-forward svc/redis-agent-memory-controlplane 9100:9100
```

Verify the admin API:

```bash
curl -H "Authorization: Bearer <admin-token>" \
  http://localhost:9100/v1/stores
```

For the full self-managed admin API schema, see the
[Control Plane API reference]({{< relref "/develop/ai/context-engine/agent-memory/self-managed/control-plane-api-reference" >}}).

After you deploy Control Plane managed stores, configure Data Plane auth in
[Authentication and authorization]({{< relref "/develop/ai/context-engine/agent-memory/self-managed/authentication" >}}).
