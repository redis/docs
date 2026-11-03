---
Title: Deploy Lens
alwaysopen: false
categories:
- docs
- operate
- iris
description: Install the Identity Service and Lens, check the deployment, create API keys, and give developers their Lens settings.
linkTitle: Deploy
weight: 50
hideListLinks: true
---

Follow these steps to install an Identity Service release and the `redis-lens` chart, check the deployment with a read key, and give developers the settings their agents need.

The examples use a Lens release named `lens` and an Identity Service release named `ids`, in the same namespace. With these names, the Lens Services are `lens-redis-lens-dataplane` and `lens-redis-lens-controlplane`, and the Identity Service is `ids-iris-identity-service`. If you choose other names, change them everywhere they appear, in both releases.

Before you begin, review the [prerequisites](/content/operate/iris/lens/self-managed/prerequisites.md). If you already run an Identity Service release for another Iris service, add the Lens entries from [step 3](#3-install-the-identity-service) to its values, and skip installing it.

## 1. Create the namespace

```bash
kubectl create namespace <namespace-name>
```

## 2. Create Secrets

Save the storage files from [Storage Secret](/content/operate/iris/lens/self-managed/configuration.md#storage-secret), and the license you received as `lens-license.key`. Save the Identity Service's metadata Redis as `ids-metadata.yaml`:

```yaml
metadata:
  urls: ["rediss://<ids-metadata-user>:<ids-metadata-password>@<ids-metadata-host>:<ids-metadata-port>"]
```

Then create the Secrets:

```bash
kubectl -n <namespace-name> create secret generic lens-storage \
  --from-file=lens-dataplane-storage.yaml \
  --from-file=lens-controlplane-storage.yaml
kubectl -n <namespace-name> create secret generic lens-license \
  --from-file=license=./lens-license.key
kubectl -n <namespace-name> create secret generic lens-dp-credential \
  --from-literal=token="$(openssl rand -hex 32)"
kubectl -n <namespace-name> create secret generic lens-internal-token \
  --from-literal=token="$(openssl rand -hex 32)"
kubectl -n <namespace-name> create secret generic ids-metadata \
  --from-file=metadata.yaml=./ids-metadata.yaml
kubectl -n <namespace-name> create secret generic ids-control-token \
  --from-literal=token="$(openssl rand -hex 32)"
```

Both releases mount `lens-dp-credential` and `lens-internal-token`. You own these two Secrets, and neither chart generates them. Neither chart checks the other's values, so keep them consistent yourself.

## 3. Install the Identity Service

For every Identity Service setting, and for running one release that serves several products, see the [Identity Service guide](/content/operate/iris/identity-service/_index.md).

Save this as `values-ids.yaml`. It registers the data plane's runtime credential, and points grant validation at the Lens control plane:

```yaml
metadata:
  existingSecret: ids-metadata
control:
  existingSecret: ids-control-token
  autoGenerate: false
runtime:
  apiKeyTenant:
    singleTenantID: default
  serviceCredentials:
    - name: lens-dataplane
      subject: lens-dataplane
      allowedOperations: [api-key-introspect]
      allowedProducts: [lens]
      existingSecret: lens-dp-credential
      secretKey: token
productValidation:
  products:
    lens:
      baseURL: http://lens-redis-lens-controlplane:9300
      credential:
        existingSecret: lens-internal-token
        secretKey: token
```

`singleTenantID` must equal the Lens `tenantId`. Lens needs no `subjectGrants.allowed` entry and no unscoped-grants product.

```bash
helm repo add redis-ai https://helm.redis.io/ai
helm repo update redis-ai
helm install ids redis-ai/iris-identity-service \
  --version 1.0.0 \
  --namespace <namespace-name> \
  -f values-ids.yaml
```

Use version `1.0.0` or later. The Lens control plane doesn't exist yet. Wait until Lens is running before you create keys, because the Identity Service calls the control plane to validate each grant.

## 4. Install Lens

Write `lens-values.yaml` from [Helm values](/content/operate/iris/lens/self-managed/configuration.md#helm-values), then install the chart:

<!-- TODO: confirm the chart name and version once redis-lens is published to helm.redis.io/ai. -->

```bash
helm install lens redis-ai/redis-lens \
  --version <chart-version> \
  --namespace <namespace-name> \
  -f lens-values.yaml \
  --wait --timeout 5m
```

The control plane creates the instance named by `instance.id` at startup, and generates the admin token Secret `lens-redis-lens-controlplane-admin-token`.

## 5. Check the deployment

Wait for the three Deployments:

```bash
kubectl -n <namespace-name> rollout status deployment/lens-redis-lens-dataplane
kubectl -n <namespace-name> rollout status deployment/lens-redis-lens-worker
kubectl -n <namespace-name> rollout status deployment/lens-redis-lens-controlplane
```

With `tests.enabled=true`, run the readiness checks:

```bash
helm test lens --namespace <namespace-name>
```

Readiness stays false while the license is in its grace period. A release image without a valid license doesn't start.

## 6. Make an authenticated read

Run each port-forward in its own terminal and leave it running:

```bash
kubectl -n <namespace-name> port-forward svc/ids-iris-identity-service 9200:9200
```

```bash
kubectl -n <namespace-name> port-forward svc/lens-redis-lens-dataplane 9000:9000
```

Create a read key, as described in [Create API keys](/content/operate/iris/lens/self-managed/authentication.md#create-api-keys), and save it in `LENS_API_KEY`. Then list the instance's agents:

```bash
curl -sS http://localhost:9000/iris/data/v1beta1/lens/instances/default/agents \
  -H "Authorization: Bearer $LENS_API_KEY"
```

A new instance returns an empty list. A `401` means the key is wrong or the data plane can't reach the Identity Service. A `403` means the key has no `read` grant on this instance.

## Expose the data plane

Agents and read clients reach Lens at an Iris host, such as `https://iris.example.com`. The SDK refuses a plain `http://` endpoint outside loopback addresses by default, and the data plane serves plain HTTP. Publish it through a TLS-terminating ingress or gateway:

- Route the path prefix `/iris/data/v1beta1/lens` on the Iris host to the `lens-redis-lens-dataplane` Service on port `9000`, without rewriting the path.
- Allow request bodies up to the ingest request size in [Request limits](/content/develop/ai/context-engine/lens/limits.md#request-limits), 8 mebibytes (MiB) by default.
- Don't publish the control plane. Operators reach it inside the cluster.

For example, with a Kubernetes Ingress:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: lens
spec:
  ingressClassName: <ingress-class>
  tls:
    - hosts: [<iris-host>]
      secretName: <iris-host-tls-secret>
  rules:
    - host: <iris-host>
      http:
        paths:
          - path: /iris/data/v1beta1/lens
            pathType: Prefix
            backend:
              service:
                name: lens-redis-lens-dataplane
                port:
                  number: 9000
```

To let developers open Lens in the Iris console, also add a `lens` entry to the console's gateway. See [Connect the console](/content/operate/iris/lens/self-managed/operations.md#connect-the-console).

## Hand off to developers

Give each application team these values. They match the variables in [Configure Lens](/content/develop/ai/context-engine/lens/configure.md) and the [read API](/content/develop/ai/context-engine/lens/read-api.md):

| Variable | Value |
| --- | --- |
| `IRIS_LENS_ENDPOINT` | The Iris host, such as `https://<iris-host>`. The SDK sends turns to `/iris/data/v1beta1/lens/v1/traces` on it. |
| `IRIS_LENS_API_KEY` | An ingest key for each agent. |
| `LENS_URL` | The same Iris host, for the read client. |
| `LENS_INSTANCE_ID` | Your `instance.id`, `default` unless you changed it. |
| `LENS_API_KEY` | A read key for each person or tool that reads turns. |

Give each agent its own ingest key, so one agent's key can't read other agents' turns. Send keys through your secret store, not in chat or tickets.

Developers can then [trace their first turn](/content/develop/ai/context-engine/lens/quickstart.md).

## Next steps

- [Create, rotate, and revoke API keys](/content/operate/iris/lens/self-managed/authentication.md).
- [Operate the deployment](/content/operate/iris/lens/self-managed/operations.md).
