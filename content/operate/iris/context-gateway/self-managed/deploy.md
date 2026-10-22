---
Title: Deploy Context Gateway
alwaysopen: false
categories:
- docs
- operate
- iris
description: Install Context Gateway with an external Identity Service, then create a Gateway, mint an agent key, and make one authenticated call.
linkTitle: Deploy
weight: 50
hideListLinks: true
---

These steps install the Context Gateway Control Plane and Data Plane with the `redis-context-gateway` Helm chart, and end with one authenticated MCP call.

You use three credentials along the way: the Control Plane admin token, the Identity Service control token, and an agent key. For what each credential unlocks, see [Credentials](/content/operate/iris/context-gateway/self-managed/authentication.md#credentials).

Before you begin, review the [prerequisites](/content/operate/iris/context-gateway/self-managed/prerequisites.md).

## 1. Create the namespace

```bash
kubectl create namespace <namespace-name>
```

## 2. Configure the Identity Service release

Set these values on the Identity Service release so that it checks Gateway grants and accepts the Data Plane's runtime token:

| Identity Service value | Setting |
| --- | --- |
| `runtime.serviceCredentials[]` | A credential for the Data Plane with `allowedOperations: [api-key-introspect]` and `allowedProducts: [context-gateway]`, from the same Secret as `dataplane.runtimeToken`. |
| `productValidation.products.context-gateway.baseURL` | The Control Plane Service, for example `http://gateway-redis-context-gateway-controlplane:9100`. |
| `productValidation.products.context-gateway.credential` | The same Secret as `controlplane.internalToken`. |
| `runtime.apiKeyTenant.singleTenantID` | The same value as `tenantId`. |

If the Identity Service release also serves Agent Memory or Agent Playbooks, add these entries to its existing lists.

## 3. Create Secrets

```bash
umask 077
openssl rand -base64 32 > k1
kubectl -n <namespace-name> create secret generic gateway-metadata --from-file=config.yaml=metadata.yaml
kubectl -n <namespace-name> create secret generic gateway-credential-redis --from-file=config.yaml=credential-redis.yaml
kubectl -n <namespace-name> create secret generic gateway-keyring --from-file=k1
kubectl -n <namespace-name> create secret generic gateway-license --from-file=license=./license
kubectl -n <namespace-name> create secret generic gateway-admin --from-file=token=./admin-token
kubectl -n <namespace-name> create secret generic gateway-grant-validation --from-file=token=./grant-token
kubectl -n <namespace-name> create secret generic gateway-runtime --from-file=token=./runtime-token
```

Create a `databaseConnections` Secret for the registered databases. See [Database registry](/content/operate/iris/context-gateway/self-managed/configuration.md#database-registry).

## 4. Create `gateway-values.yaml`

*Complete values file: `tenantId`, `publicBaseURL`, `identityService.baseURL`, image settings, and the file references from step 3.*

## Before you install: check your values

Check each value in `gateway-values.yaml` before you install. If one is wrong, you see the symptom in its row.

{{< table-scrollable >}}
| Check | Symptom | Fix |
| --- | --- | --- |
| `tenantId` equals the Identity Service's `runtime.apiKeyTenant.singleTenantID` | Pods Ready, but minting an agent key for a Gateway fails | Set both to the same tenant. |
| `publicBaseURL` is the Data Plane origin that MCP clients reach | `mcpEndpoint` in Gateway responses points to an address clients cannot reach, and IdP sign-in fails | Set the public origin, including `https://`. |
| The admin, internal, and runtime tokens come from three different Secrets or keys | Rendering fails, or the Identity Service cannot check keys | Create three distinct token files. |
| `license` points to a valid license | `/v1/health/ready` answers `503` | Mount the license file as issued. |
| Both component `image.repository` and `image.tag` are set | Pods `ImagePullBackOff` | Set both to the release images. |
{{< /table-scrollable >}}

<!-- TODO: Replace each symptom with the exact error or log line from a test install. -->

## 5. Install

```bash
helm repo add redis-ai https://helm.redis.io/ai
helm repo update redis-ai
helm install gateway redis-ai/redis-context-gateway \
  --version <chart-version> \
  --namespace <namespace-name> \
  -f gateway-values.yaml \
  --wait --timeout 5m
```

<!-- TODO: Set the published chart version and confirm the repository and chart name. -->

## 6. Verify pods and health

```bash
kubectl -n <namespace-name> rollout status deployment/gateway-redis-context-gateway-controlplane
kubectl -n <namespace-name> rollout status deployment/gateway-redis-context-gateway-dataplane
```

Forward both services, then check `/v1/health/ready` on ports `9100` and `8083`.

## 7. Create a Gateway

```bash
kubectl -n <namespace-name> port-forward svc/gateway-redis-context-gateway-controlplane 9100:9100
curl -sS -X POST http://localhost:9100/v1/gateways \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"displayName": "my-gateway"}'
```

The response carries `id` and `mcpEndpoint`.

## 8. Mint an agent key

```bash
curl -sS -X POST <identity-service-url>/v1/api-keys \
  -H "Authorization: Bearer <identity-service-control-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-agent-key",
    "grants": [
      {
        "tenant": "<tenant-id>",
        "product": "context-gateway",
        "resourceType": "gateway",
        "resourceId": "<gateway-id>",
        "actions": ["use"]
      }
    ]
  }'
```

> [!WARNING]
> The response's `token` is the agent key. It is shown only once, so save it in your secret manager.

## 9. Make one authenticated call

*MCP `initialize` and `tools/list` requests with curl against `mcpEndpoint`. A new Gateway with no Upstreams lists no tools.*

## Next steps

- [API examples](/content/operate/iris/context-gateway/self-managed/api-examples.md) to register an Upstream and hand off to a developer.
- [Operations](/content/operate/iris/context-gateway/self-managed/operations.md) for credential rotation and upgrades.
