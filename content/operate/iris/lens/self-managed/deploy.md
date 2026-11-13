---
Title: Deploy Lens
alwaysopen: false
categories:
- docs
- operate
- iris
description: Add Lens to a Redis Iris suite release, then check the deployment, create API keys, and give developers their Lens settings.
linkTitle: Deploy
weight: 50
hideListLinks: true
---

Lens installs as part of the `redis-iris` Helm chart. Follow [Install the Redis Iris suite](/content/operate/iris/self-managed/_index.md) for the prerequisites, the shared Secrets, the preflight, and the install. This page covers what Lens adds to that release, and ends with one authenticated read from the data plane.

Lens is on by default (`global.iris.products.lens.enabled`). Its values go under the `lens:` key in `iris-values.yaml`. The chart's `examples/lens.yaml` is a working values file for these steps.

## 1. Create the Lens Secrets

Save the storage files from [Storage Secret](/content/operate/iris/lens/self-managed/configuration.md#storage-secret). Then create the Secret:

```bash
kubectl -n <namespace-name> create secret generic lens-storage \
  --from-file=lens-dataplane-storage.yaml \
  --from-file=lens-controlplane-storage.yaml
```

Lens needs no model provider. For what each file holds, and what a local evaluation can use, see [Service Secrets and Redis databases](/content/operate/iris/self-managed/_index.md#service-secrets-and-redis-databases).

## 2. Add the Lens values

Add the storage Secret to `iris-values.yaml`. See [Helm values](/content/operate/iris/lens/self-managed/configuration.md#helm-values) for each Lens setting.

```yaml
lens:
  storage:
    existingSecret: lens-storage
```

The suite sets these Lens values itself. Don't set them under `lens:`: a value that differs fails the render and names the field.

- `tenantId`, from `global.iris.tenantId`.
- `license.existingSecret` and `license.secretKey`, from `global.iris.license`.
- `dataplane.identityServiceBaseURL` and `identityService.allowInsecureTransport`, for the suite's own Identity Service.
- `identityService.credential` and `controlplane.internalToken`, from the [credentials](/content/operate/iris/self-managed/_index.md#credentials) the suite generates or that you supply in `global.iris.secrets`. The admin token is in the Secret `iris-lens-admin-token`.
- `auth.oidc.audience`, `dataplane.oidc`, and `controlplane.oidc.enabled`, from `global.iris.auth.oidc` and `global.iris.auth.roleBindings`.
- `fullnameOverride` (`redis-lens`), the Service ports, `instance.id` (`default`), the data-plane rollout strategy, and `podDisruptionBudget.enabled` (`true`), which the suite fixes. The suite runs two data-plane replicas by default, and adds the console's Lens route.

## 3. Install or upgrade the release

For a new release, follow [Run the preflight](/content/operate/iris/self-managed/_index.md#4-run-the-preflight) and [Install](/content/operate/iris/self-managed/_index.md#5-install). To add Lens to a running release, upgrade it:

```bash
helm upgrade iris redis-ai/redis-iris \
  --version '~1.0.1' \
  --namespace <namespace-name> \
  -f iris-values.yaml
```

To try Lens on a workstation first, see [Evaluate on a local kind cluster](/content/operate/iris/self-managed/_index.md#evaluate-on-a-local-kind-cluster).

## 4. Verify the deployment

```bash
kubectl -n <namespace-name> rollout status deployment/redis-lens-controlplane
kubectl -n <namespace-name> rollout status deployment/redis-lens-dataplane
kubectl -n <namespace-name> rollout status deployment/redis-lens-worker
helm test iris --namespace <namespace-name> --logs
```

`helm test` creates a resource with the admin token, mints a scoped agent key, and calls the data plane with it. See [Verify the release](/content/operate/iris/self-managed/_index.md#6-verify-the-release).

Readiness stays false while the license is in its grace period. A release image without a valid license doesn't start.

To call the services from your workstation, run each port-forward in its own terminal and leave it running:

```bash
kubectl -n <namespace-name> port-forward svc/iris-identity-service 9200:9200
```

```bash
kubectl -n <namespace-name> port-forward svc/redis-lens-dataplane 9010:9000
```

```bash
kubectl -n <namespace-name> port-forward svc/redis-lens-controlplane 9300:9300
```

Rerun a port-forward after its pod is replaced.

## 5. Make an authenticated read

Create a read key, as described in [Create API keys](/content/operate/iris/lens/self-managed/authentication.md#create-api-keys), and save it in `LENS_API_KEY`. To create keys with the `iris` CLI instead, see [Create a store with the `iris` CLI](/content/operate/iris/self-managed/_index.md#7-create-a-store-with-the-iris-cli). Then list the instance's agents:

```bash
curl -sS http://localhost:9010/iris/data/v1beta1/lens/instances/default/agents \
  -H "Authorization: Bearer $LENS_API_KEY"
```

A new instance returns an empty list. A `401` means the key is wrong or the data plane can't reach the Identity Service. A `403` means the key has no `read` grant on this instance.

## Expose the data plane

Agents and read clients reach Lens at an Iris host, such as `https://iris.example.com`. The SDK refuses a plain `http://` endpoint outside loopback addresses by default, and the data plane serves plain HTTP. Publish it through a TLS-terminating ingress or gateway:

- Route the path prefix `/iris/data/v1beta1/lens` on the Iris host to the `redis-lens-dataplane` Service on port `9000`, without rewriting the path.
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
                name: redis-lens-dataplane
                port:
                  number: 9000
```

## Hand off to developers

Give each application team these values. They match the variables in [Configure Lens](/content/develop/ai/context-engine/lens/configure.md) and the [read API](/content/develop/ai/context-engine/lens/read-api.md):

| Variable | Value |
| --- | --- |
| `IRIS_LENS_ENDPOINT` | The Iris host, such as `https://<iris-host>`. The SDK sends turns to `/iris/data/v1beta1/lens/v1/traces` on it. |
| `IRIS_LENS_API_KEY` | An ingest key for each agent. |
| `LENS_URL` | The same Iris host, for the read client. |
| `LENS_INSTANCE_ID` | `default`, the suite's `instance.id`. |
| `LENS_API_KEY` | A read key for each person or tool that reads turns. |

Give each agent its own ingest key. If one agent's key leaks, you can [revoke or rotate that key](/content/operate/iris/lens/self-managed/authentication.md) without interrupting your other agents. Send keys through your secret store, not in chat or tickets.

Developers can then [trace their first turn](/content/develop/ai/context-engine/lens/quickstart.md).

## Next steps

- [Create, rotate, and revoke API keys](/content/operate/iris/lens/self-managed/authentication.md).
- [Operate the deployment](/content/operate/iris/lens/self-managed/operations.md).
