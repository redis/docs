---
Title: Deploy Redis Context Gateway
alwaysopen: false
categories:
- docs
- operate
- iris
description: Install Redis Context Gateway with an external Identity Service, then create a Gateway, mint an agent key, and make one authenticated call.
linkTitle: Deploy
weight: 50
hideListLinks: true
---

These steps install the Context Gateway Control Plane and Data Plane with the `redis-context-gateway` Helm chart, and end with one authenticated Model Context Protocol (MCP) call.

You use three credentials along the way: the Control Plane admin token, the Identity Service control token, and an agent key. For what each credential unlocks, see [Credentials](/content/operate/iris/context-gateway/self-managed/authentication.md#credentials).

Before you begin, review the [prerequisites](/content/operate/iris/context-gateway/self-managed/prerequisites.md).

## 1. Create the namespace

```bash
kubectl create namespace <namespace-name>
```

## 2. Create Secrets

### Configure the Identity Service release first

Set these values on the Identity Service release so that it checks Gateway grants and accepts the Data Plane's runtime token:

| Identity Service value | Setting |
| --- | --- |
| `runtime.serviceCredentials[]` | A credential for the Data Plane with `allowedOperations: [api-key-introspect]` and `allowedProducts: [context-gateway]`, from the same Secret as `dataplane.runtimeToken`. |
| `productValidation.products.context-gateway.baseURL` | The Control Plane Service, for example `http://gateway-redis-context-gateway-controlplane:9100`. |
| `productValidation.products.context-gateway.credential` | The same Secret as `controlplane.internalToken`. |
| `productValidation.products.context-gateway.enabled` | `true` |
| `runtime.apiKeyTenant.singleTenantID` | The same value as `tenantId`. |

If the Identity Service release also serves Agent Memory or Agent Playbooks, add these entries to its existing lists.

### Create the connection files

Save the Metadata Redis connection as `metadata.yaml`:

```yaml
metadata_db:
  urls: ["rediss://<metadata-user>:<password>@<metadata-host>:6379"]
```

Save the credential Redis connection as `credential-redis.yaml`:

```yaml
credential_storage:
  redis:
    urls: ["rediss://<credential-user>:<password>@<credential-host>:6379"]
```

Keep real URLs and passwords only in these files, and create Secrets from them.

### Create the Secrets

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

## 3. Create `gateway-values.yaml`

Save this file, replacing the angle-bracket placeholders with your tenant, public Data Plane origin, and approved release image tags. It uses the Secrets created in step 2 and an Identity Service release named `ids` in the same namespace.

```yaml
tenantId: <tenant-id>
publicBaseURL: https://<gateway-host>
identityService:
  baseURL: http://ids-iris-identity-service:9200
  allowInsecureTransport: true
license:
  existingSecret: gateway-license
metadataDB:
  existingSecret: gateway-metadata
  secretKey: config.yaml
credentialStorage:
  provider: redis
  redis:
    connection:
      existingSecret: gateway-credential-redis
      secretKey: config.yaml
    keyring:
      existingSecret: gateway-keyring
    keyFiles:
      k1: k1
    activeKeyId: k1
controlplane:
  image:
    repository: redislabs/iris-context-gateway-control
    tag: <control-plane-image-tag>
  adminToken:
    existingSecret: gateway-admin
    secretKey: token
  internalToken:
    existingSecret: gateway-grant-validation
    secretKey: token
dataplane:
  image:
    repository: redislabs/iris-context-gateway-data
    tag: <data-plane-image-tag>
  runtimeToken:
    existingSecret: gateway-runtime
    secretKey: token
```

This configuration starts without cache or compression. Add [registered databases](/content/operate/iris/context-gateway/self-managed/configuration.md#database-registry) and feature settings when you need them.

When `identityService.baseURL` is an in-cluster `http://` address, such as `http://ids-iris-identity-service:9200` for an Identity Service release named `ids`, also set `identityService.allowInsecureTransport: true`.

## Before you install: check your values

Check each value in `gateway-values.yaml` before you install. If one is wrong, you see the symptom in its row.

{{< table-scrollable >}}
| Check | Symptom | Fix |
| --- | --- | --- |
| `tenantId` equals the Identity Service's `runtime.apiKeyTenant.singleTenantID` | Pods Ready, but minting an agent key for a Gateway fails | Set both to the same tenant. |
| `publicBaseURL` is the Data Plane origin that MCP clients reach | `mcpEndpoint` in Gateway responses points to an address clients cannot reach, and identity provider sign-in fails | Set the public origin, including `https://`. |
| `identityService.allowInsecureTransport` is `true` for an `http://` Identity Service URL | Rendering fails with `HTTP Identity Service requires explicit allowInsecureTransport`. | Set it, or use an `https://` URL. |
| The admin, internal, and runtime tokens come from three different Secrets or keys | Rendering fails, or the Identity Service cannot check keys | Create three distinct token files. |
| `license` points to a valid license | The Control Plane's `/health/readiness` answers `503`, and an invalid license stops either plane at startup | Mount the license file as issued. |
| Both component `image.repository` and `image.tag` are set | Pods `ImagePullBackOff` | Set both to the release images. |
{{< /table-scrollable >}}

## 4. Install

```bash
helm repo add redis-ai https://helm.redis.io/ai
helm repo update redis-ai
helm install gateway redis-ai/redis-context-gateway \
  --version <chart-version> \
  --namespace <namespace-name> \
  -f gateway-values.yaml \
  --wait --timeout 5m
```

Use the chart version and image tags supplied for the same release. A merged server change does not by itself publish a chart or image.

## 5. Verify pods and health

```bash
kubectl -n <namespace-name> rollout status deployment/gateway-redis-context-gateway-controlplane
kubectl -n <namespace-name> rollout status deployment/gateway-redis-context-gateway-dataplane
```

Run each port-forward in its own terminal and leave it running:

```bash
kubectl -n <namespace-name> port-forward svc/gateway-redis-context-gateway-controlplane 9100:9100
```

```bash
kubectl -n <namespace-name> port-forward svc/gateway-redis-context-gateway-dataplane 8083:8083
```

```bash
kubectl -n <namespace-name> port-forward svc/ids-iris-identity-service 9200:9200
```

Then check readiness on both planes:

```bash
curl -sS http://localhost:9100/health/readiness
curl -sS http://localhost:8083/health/readiness
```

## 6. Create a Gateway

```bash
umask 077
curl --fail-with-body --silent --show-error \
  -X POST http://localhost:9100/iris/v1/context-gateway/gateways \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "my-gateway", "toolExposureMode": "FULL"}' > gateway.json
export GATEWAY_ID="$(jq -er '.gatewayId' gateway.json)"
export MCP_ENDPOINT="$(jq -er '.mcpEndpoint' gateway.json)"
```

The response carries `gatewayId` (a `gw_`-prefixed ID) and `mcpEndpoint`. Use that ID in the grant in step 7. The advertised endpoint must be reachable from the shell that makes the MCP calls.

## 7. Mint an agent key

```bash
jq -n --arg tenant '<tenant-id>' --arg gateway "$GATEWAY_ID" \
  '{name:"my-agent-key",grants:[{tenant:$tenant,product:"context-gateway",resourceType:"gateway",resourceId:$gateway,actions:["use"]}]}' > agent-grant.json
curl --fail-with-body --silent --show-error \
  -X POST http://localhost:9200/v1/api-keys \
  -H "Authorization: Bearer <identity-service-control-token>" \
  -H "Content-Type: application/json" \
  --data-binary @agent-grant.json > agent-key.json
export AGENT_KEY="$(jq -er '.token' agent-key.json)"
```

> [!WARNING]
> The response's `token` is the agent key. It is shown only once, so save it in your secret manager.

## 8. Make one authenticated call

Send an initialization request to the advertised endpoint. These commands use protocol version `2025-06-18`, which the Gateway supports.

```bash
curl --fail-with-body --silent --show-error "$MCP_ENDPOINT" \
  -H "Authorization: Bearer $AGENT_KEY" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"gateway-smoke","version":"1.0"}}}'

curl --fail-with-body --silent --show-error "$MCP_ENDPOINT" \
  -H "Authorization: Bearer $AGENT_KEY" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'Mcp-Protocol-Version: 2025-06-18' \
  -d '{"jsonrpc":"2.0","method":"notifications/initialized"}'

curl --fail-with-body --silent --show-error "$MCP_ENDPOINT" \
  -H "Authorization: Bearer $AGENT_KEY" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'Mcp-Protocol-Version: 2025-06-18' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
```

The Gateway is stateless, so no session ID needs to be retained between these requests. A new full-mode Gateway with no Upstreams and compression off returns an empty tool list. Save the key in your secret manager, then remove `agent-key.json`.

## Next steps

- [API examples](/content/operate/iris/context-gateway/self-managed/api-examples.md) to register an Upstream and hand off to a developer.
- [Operations](/content/operate/iris/context-gateway/self-managed/operations.md) for credential rotation and upgrades.
