---
Title: Deploy with Control Plane managed caches
alwaysopen: false
categories:
- docs
- operate
- iris
description: Deploy LangCache with caches managed by the self-managed Control Plane.
linkTitle: Deploy with Control Plane managed caches
weight: 50
hideListLinks: true
---

Use Control Plane managed caches when operators need to create or manage
caches at runtime. In this mode, the Data Plane reads cache records from
Metadata Redis, and the Control Plane provisions the RediSearch index in
Cache Redis when it creates a cache.

{{< note >}}
The published `langcache` Helm chart currently templates only the Data Plane.
This page deploys the Control Plane, and (for agent-key auth) the Identity
Service, as plain Kubernetes manifests using the images provided by your
Redis representative. Chart support for these components is expected in a
future release; check with your Redis representative for the current state.
{{< /note >}}

Before you begin, review [prerequisites]({{< relref "/operate/iris/langcache/self-managed/prerequisites" >}})
and create `dataplane.config.yaml` from the
[Control Plane managed caches example]({{< relref "/operate/iris/langcache/self-managed/data-plane-configuration#control-plane-managed-caches-example" >}}).

## Create the namespace

```bash
kubectl create namespace <namespace-name>
```

## Create shared Secrets

Create the license Secret:

```bash
kubectl -n <namespace-name> create secret generic langcache-license \
  --from-file=license=./license
```

Create the Data Plane config Secret:

```bash
kubectl -n <namespace-name> create secret generic langcache-config \
  --from-file=dataplane.config.yaml=./dataplane.config.yaml
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
  license_path: /etc/langcache/license

metadata:
  urls:
    - redis://redis-meta:6379

databases:
  cache-primary:
    name: cache-primary
    urls:
      - redis://cache-primary:6379

embedders:
  openai:
    models:
      - model: text-embedding-3-large
        dimensions: 3072
```

The Control Plane's `embedders` block must describe exactly one provider with
exactly one model; it is the embedding contract that cache creation and the
Data Plane's `embedding` config must agree on. It must not set
`authorized: true` — on-prem cache creation cannot accept per-cache embedding
credentials.

Create the Control Plane config Secret:

```bash
kubectl -n <namespace-name> create secret generic langcache-controlplane-config \
  --from-file=controlplane-onprem.config.yaml=./controlplane-onprem.config.yaml
```

Bring your own admin token:

```bash
kubectl -n <namespace-name> create secret generic langcache-controlplane-admin-token \
  --from-literal=token='<admin-token>'
```

## Deploy the Control Plane

Until the Control Plane is packaged in the Helm chart, deploy it directly.
Adjust the image reference to the one provided by your Redis representative:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: langcache-controlplane
  namespace: <namespace-name>
spec:
  replicas: 1
  selector:
    matchLabels:
      app: langcache-controlplane
  template:
    metadata:
      labels:
        app: langcache-controlplane
    spec:
      containers:
        - name: controlplane
          image: <your-registry>/langcache-controlplane-onprem:<langcache-version>
          args: ["--config=/etc/controlplane-onprem/config/controlplane-onprem.config.yaml"]
          ports:
            - name: http
              containerPort: 9100
          volumeMounts:
            - name: config
              mountPath: /etc/controlplane-onprem/config
              readOnly: true
            - name: admin-token
              mountPath: /etc/controlplane-onprem/admin
              readOnly: true
            - name: license
              mountPath: /etc/langcache
              readOnly: true
          readinessProbe:
            httpGet:
              path: /health/readiness
              port: http
          livenessProbe:
            httpGet:
              path: /health/liveness
              port: http
      volumes:
        - name: config
          secret:
            secretName: langcache-controlplane-config
        - name: admin-token
          secret:
            secretName: langcache-controlplane-admin-token
        - name: license
          secret:
            secretName: langcache-license
---
apiVersion: v1
kind: Service
metadata:
  name: langcache-controlplane
  namespace: <namespace-name>
spec:
  selector:
    app: langcache-controlplane
  ports:
    - name: http
      port: 9100
      targetPort: http
```

```bash
kubectl apply -f langcache-controlplane.yaml
```

## Create Helm values for the Data Plane

Create SHA-256 checksums for externally managed Secrets. These values are
used by Helm values to roll pods after Secret changes; they are not used to
validate Secret integrity.

{{< multitabs id="langcache-control-plane-secret-checksums"
tab1="Linux"
tab2="macOS" >}}

```bash
LICENSE_CHECKSUM="$(sha256sum ./license | awk '{print $1}')"
CONFIG_CHECKSUM="$(sha256sum ./dataplane.config.yaml | awk '{print $1}')"
```

-tab-sep-

```bash
LICENSE_CHECKSUM="$(shasum -a 256 ./license | awk '{print $1}')"
CONFIG_CHECKSUM="$(shasum -a 256 ./dataplane.config.yaml | awk '{print $1}')"
```

{{< /multitabs >}}

Create `langcache-values.yaml`:

```yaml
image:
  repository: <your-registry>/langcache-dataplane
  tag: "<langcache-version>"

config:
  existingSecret: langcache-config
  existingSecretChecksum: "<config-checksum>"
```

The chart values shown throughout this guide reflect the current `langcache`
chart, which does not yet expose license or Control Plane fields. Once your
chart provides `controlplane.enabled` (or similar) support, prefer that over
the manual Deployment above.

## Install the Data Plane chart

```bash
helm install langcache ./langcache \
  --namespace <namespace-name> \
  --create-namespace \
  -f langcache-values.yaml
```

## Verify the deployment

Check pods:

```bash
kubectl -n <namespace-name> get pods
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

Verify the admin API:

```bash
curl -H "Authorization: Bearer <admin-token>" \
  http://localhost:9100/v1/caches
```

For the full self-managed admin API schema, see the
[Control Plane API reference]({{< relref "/operate/iris/langcache/self-managed/control-plane-api-reference" >}}).

After you deploy Control Plane managed caches, configure Data Plane
agent-key authentication and the Identity Service in
[Authentication and authorization]({{< relref "/operate/iris/langcache/self-managed/authentication" >}}).
