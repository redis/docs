---
Title: Deploy the Identity Service
alwaysopen: false
categories:
- docs
- operate
- iris
description: Install the Identity Service as its own Helm release, register a product with it, and check that it answers.
linkTitle: Deploy
weight: 50
hideListLinks: true
---

Follow these steps to install the Identity Service with the `iris-identity-service` Helm chart, register your first Iris product with it, and check that its control API accepts your control token.

The examples install chart `1.2.0` as release `ids` in the same namespace as the products, so the Service is `ids-iris-identity-service:9200`. They register Agent Memory. For the other products, swap in their entries from [Register products](/content/operate/iris/identity-service/configuration.md#register-products).

<!-- TODO: iris#2368 (M6) moves the chart to 1.3.0. Update the version in every guide when it merges. -->

## Prerequisites

| Requirement | Details |
| --- | --- |
| Kubernetes | A cluster and a namespace for the release. The tested layout puts the Identity Service in the same namespace as the products, because they share Secrets. |
| Helm | Helm 3, with the Redis AI repository `https://helm.redis.io/ai`. |
| Image | `redislabs/iris-identity-service` from Docker Hub, or a copy in your private registry. By default, the chart deploys the image tag that matches its version. |
| Metadata Redis | A Redis database for the Identity Service. Turn on persistence (append-only file or RDB snapshots) and keep its data on durable storage. It holds every agent key, so back it up. See [Metadata Redis](/content/operate/iris/identity-service/configuration.md#metadata-redis). |
| Tenant | One tenant ID for the installation, for example `default`. Every product release sets the same value as its `tenantId`. You can't change it later. |
| Product details | For each product you register: its control-plane Service address, its control-plane internal token Secret, and its data-plane runtime credential Secret. Each product's deploy guide names them. |
| Transport Layer Security (TLS) | The Identity Service has no TLS listener. For production, put a TLS endpoint in front of it and of each product control plane. |

## 1. Create the namespace

Skip this step if the products' namespace already exists.

```bash
kubectl create namespace <namespace-name>
```

## 2. Create the metadata Secret

1. Save the metadata Redis connection as `ids-metadata.yaml`. Use `rediss://` for TLS, and put the Redis user and password in the URL:

   ```yaml
   metadata:
     urls: ["rediss://<metadata-user>:<metadata-password>@<metadata-host>:<metadata-port>"]
   ```

1. Create the Secret. The key must be `metadata.yaml`:

   ```bash
   kubectl -n <namespace-name> create secret generic ids-metadata \
     --from-file=metadata.yaml=./ids-metadata.yaml
   ```

## 3. Create the control token and shared Secrets

1. Create the control token Secret. Only the Identity Service mounts it:

   ```bash
   kubectl -n <namespace-name> create secret generic ids-control-token \
     --from-literal=token="$(openssl rand -hex 32)"
   ```

   To let the chart generate the token instead, skip this step and omit `control` from the values file. The chart then creates `ids-iris-identity-service-control-token` and keeps it across upgrades and uninstalls.

1. Create the product's data-plane runtime credential. The data plane and the Identity Service both mount it:

   ```bash
   kubectl -n <namespace-name> create secret generic memory-dp-credential \
     --from-literal=token="$(openssl rand -hex 32)"
   ```

1. Create the product's control-plane internal token. The control plane and the Identity Service both mount it:

   ```bash
   kubectl -n <namespace-name> create secret generic memory-internal-token \
     --from-literal=token="$(openssl rand -hex 32)"
   ```

Every credential needs its own value. The Identity Service doesn't start when two credentials have the same value. If you already followed a product's deploy guide, these Secrets exist: reuse them.

## 4. Create `values-ids.yaml`

Save this file. It registers Agent Memory over the in-cluster Service. For production, use the control plane's TLS endpoint and set `tls.caCertSecret`, as described in [TLS, Federal Information Processing Standards (FIPS), and network](/content/operate/iris/identity-service/configuration.md#tls-fips-and-network).

```yaml
metadata:
  existingSecret: ids-metadata
control:
  existingSecret: ids-control-token
  autoGenerate: false
runtime:
  unscopedGrantsProduct: memory
  apiKeyTenant:
    singleTenantID: default
  serviceCredentials:
    - name: memory-dp
      subject: memory-dp
      allowedOperations: [api-key-introspect]
      allowedProducts: [memory]
      existingSecret: memory-dp-credential
      secretKey: token
productValidation:
  products:
    memory:
      baseURL: http://redis-agent-memory-controlplane:9100
      credential:
        existingSecret: memory-internal-token
        secretKey: token
```

`runtime.unscopedGrantsProduct: memory` is for Agent Memory only. Omit it when the release doesn't serve Agent Memory.

## Before you install: check your values

The chart's values schema is closed: an unknown key, product, or operation fails the install. Check each value before you install. If one is wrong, you see the symptom in its row.

{{< table-scrollable >}}
| Check | Symptom | Fix |
| --- | --- | --- |
| `metadata.existingSecret` is set | Rendering fails | Name the metadata Secret. |
| `runtime.serviceCredentials` has at least one entry | Rendering fails | Add an entry for each product data plane. |
| `productValidation.products` has at least one enabled product | Rendering fails | Add a validator for each product control plane. |
| The control token, runtime credentials, and internal tokens use different Secret keys and different values | Rendering fails, or the pod doesn't start | Create a separate Secret for each. |
| `runtime.apiKeyTenant.singleTenantID` equals each product's `tenantId` | Minting a key fails with `400`, or agents get `403` | Set the same tenant in every release. |
| A numeric tenant ID is a string | Rendering fails, or the tenant doesn't match | Quote it in YAML, or use `--set-string`. |
{{< /table-scrollable >}}

## 5. Install

```bash
helm repo add redis-ai https://helm.redis.io/ai
helm repo update redis-ai
helm install ids redis-ai/iris-identity-service \
  --version 1.2.0 \
  --namespace <namespace-name> \
  -f values-ids.yaml
```

The product's control plane can be missing at this point. The Identity Service starts without it, but minting a key for that product fails until the control plane answers grant validation.

## 6. Verify the release

1. Wait for the Deployment:

   ```bash
   kubectl -n <namespace-name> rollout status deployment/ids-iris-identity-service
   ```

1. Run the chart test. It checks that the Identity Service is ready, which means it reaches the metadata Redis:

   ```bash
   helm test ids --namespace <namespace-name>
   ```

1. In a separate terminal, forward the Service port and leave it running:

   ```bash
   kubectl -n <namespace-name> port-forward svc/ids-iris-identity-service 9200:9200
   ```

1. Load the control token:

   ```bash
   export IRIS_IDENTITY_URL='http://localhost:9200'
   export IRIS_IDENTITY_TOKEN="$(kubectl -n <namespace-name> get secret \
     ids-control-token -o jsonpath='{.data.token}' | base64 --decode)"
   ```

   If the chart generated the token, read `ids-iris-identity-service-control-token` instead. `helm status ids -n <namespace-name>` prints the command for your release.

1. List the registered products. The response names each product that has a grant validator:

   ```bash
   curl -sS -H "Authorization: Bearer $IRIS_IDENTITY_TOKEN" "$IRIS_IDENTITY_URL/v1/products"
   ```

A passing `helm test` doesn't prove that the release can mint keys. Minting needs the product's control plane. After you install the product, mint a key as its deploy guide shows, or as described in [Mint an agent key](/content/operate/iris/identity-service/operations.md#mint-an-agent-key).

## Next steps

- Install the product and connect its data plane to `http://ids-iris-identity-service:9200`, or to the Identity Service's TLS endpoint.
- [Register more products](/content/operate/iris/identity-service/configuration.md#register-products) on the same release.
- [Let operators sign in with your identity provider](/content/operate/iris/identity-service/authentication.md#operator-sign-in-with-your-identity-provider), so they don't share the control token.
