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
The published `langcache` Helm chart currently templates only the Data
Plane. This page deploys the Control Plane as a plain Kubernetes manifest
using the image provided by your Redis representative. Chart support for
the Control Plane is expected in a future release; check with your Redis
representative for the current state.

This page does not deploy the Identity Service, which agent-key Data Plane
authentication also depends on; see
[Authentication and authorization]({{< relref "/operate/iris/langcache/self-managed/authentication" >}})
for what that component requires and why deploying it is out of scope here.
{{< /note >}}

Before you begin, review [prerequisites]({{< relref "/operate/iris/langcache/self-managed/prerequisites" >}})
and the
[Control Plane managed caches config example]({{< relref "/operate/iris/langcache/self-managed/data-plane-configuration#control-plane-managed-caches-example" >}}),
which you'll paste into the Data Plane's Helm values below.

## Create the namespace

```bash
kubectl create namespace <namespace-name>
```

## Create shared Secrets

Create the license Secret. Both the Control Plane manifest below and the
Data Plane values further down mount this same Secret:

```bash
kubectl -n <namespace-name> create secret generic langcache-license \
  --from-file=license=./license
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
  license_path: /etc/license/license

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
              mountPath: /etc/license
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

The published `langcache` chart takes `dataplane.config.yaml` inline as the
`config` value — there is no `existingSecret` option for it. It also has no
built-in fields for the license file or the Identity Service introspection
credential, so mount those two as Secrets yourself using the chart's generic
`volumes`/`volumeMounts` passthrough, at paths that don't overlap with the
chart's own config mount at `/etc/langcache`.

Create the introspection-token Secret. This is the shared credential the
Data Plane presents to the Identity Service when introspecting agent keys;
provision it as part of your Identity Service deployment:

```bash
kubectl -n <namespace-name> create secret generic langcache-introspection-token \
  --from-literal=token='<introspection-credential>'
```

Create `langcache-values.yaml`, using the
[Control Plane managed caches example]({{< relref "/operate/iris/langcache/self-managed/data-plane-configuration#control-plane-managed-caches-example" >}})
for `config`:

```yaml
nameOverride: langcache
fullnameOverride: langcache

image:
  repository: <your-registry>/langcache-dataplane
  tag: "<langcache-version>"

# The on-prem-hardened Data Plane binary listens on 9000 by default;
# override the chart's default service port (8080) to match.
service:
  port: 9000

config:
  server:
    port: 9000
  profile: prod
  metadata:
    urls:
      - redis://redis-meta:6379
    cache_ttl: 1m
  databases:
    cache-primary:
      name: cache-primary
      urls:
        - redis://cache-primary:6379
  auth:
    agent_keys:
      enabled: true
      product: langcache
      introspection:
        base_url: https://iris-identity-service:9200
        product: langcache
        credential:
          token_file: /etc/introspection/token
  embedding:
    provider: openai
    endpoint:
      base_url: https://api.openai.com
    models:
      default_embedding_model: text-embedding-3-large
      dimensions: 3072
    credentials:
      type: static
      api_key: "<embedding-api-key>"
  license:
    license_path: /etc/license/license

volumes:
  - name: license
    secret:
      secretName: langcache-license
  - name: introspection-token
    secret:
      secretName: langcache-introspection-token

volumeMounts:
  - name: license
    mountPath: /etc/license
    readOnly: true
  - name: introspection-token
    mountPath: /etc/introspection
    readOnly: true
```

As with static caches, this `config` block ends up in a ConfigMap, so treat
`langcache-values.yaml` as sensitive. The `volumes`/`volumeMounts` entries
above are whole-directory mounts rather than `subPath` mounts, so Kubernetes
refreshes the mounted license and introspection-credential files
automatically when the backing Secret changes — no pod restart required to
pick up new file content (the running process still decides how often it
re-reads them; see [Operations]({{< relref "/operate/iris/langcache/self-managed/operations" >}})
for license/token rotation).

The chart values shown throughout this guide reflect the current `langcache`
chart, which does not yet expose dedicated license or Control Plane fields.
Once your chart provides `controlplane.enabled` (or similar) support, prefer
that over the manual Deployment and volume passthroughs above.

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
