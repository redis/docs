---
Title: Deploy Redis Context Gateway
alwaysopen: false
categories:
- docs
- operate
- iris
description: Add Redis Context Gateway to a Redis Iris suite release, then create a Gateway, mint an agent key, and make one authenticated call.
linkTitle: Deploy
weight: 50
hideListLinks: true
---

Context Gateway installs as part of the `redis-iris` Helm chart. Follow [Install the Redis Iris suite](/content/operate/iris/self-managed/_index.md) for the prerequisites, the shared Secrets, the preflight, and the install. This page covers what Context Gateway adds to that release, and ends with one authenticated Model Context Protocol (MCP) call.

Context Gateway is on by default (`global.iris.products.contextGateway.enabled: true`). Its values go under the `contextGateway:` key in `iris-values.yaml`. The chart's `examples/context-gateway.yaml` is a working values file for these steps.

## 1. Create the Context Gateway Secrets

Save the Metadata Redis connection as `metadata.yaml`:

```yaml
metadata_db:
  urls: ["rediss://<metadata-user>:<password>@<metadata-host>:6379"]
```

Save the credential Redis connection as `credential-redis.yaml`. Use a different Redis from the metadata one:

```yaml
credential_storage:
  redis:
    urls: ["rediss://<credential-user>:<password>@<credential-host>:6379"]
```

Keep real URLs and passwords only in these files, and create Secrets from them. The keyring holds a base64 32-byte key:

```bash
umask 077
openssl rand -base64 32 > k1
kubectl -n <namespace-name> create secret generic gateway-metadata --from-file=config.yaml=metadata.yaml
kubectl -n <namespace-name> create secret generic gateway-credential-redis --from-file=config.yaml=credential-redis.yaml
kubectl -n <namespace-name> create secret generic gateway-keyring --from-file=k1
```

See [Service Secrets and Redis databases](/content/operate/iris/self-managed/_index.md#service-secrets-and-redis-databases) for what each Secret holds in a local evaluation.

## 2. Add the Context Gateway values

Add the storage references and the public Data Plane origin to `iris-values.yaml`. `publicBaseURL` must be an `https://` origin with no path. Also set `dataplane.ingress`, or route to `redis-context-gateway-dataplane:8083` yourself.

```yaml
contextGateway:
  publicBaseURL: https://mcp.example.com
  metadataDB:
    existingSecret: gateway-metadata
  credentialStorage:
    provider: redis
    redis:
      connection:
        existingSecret: gateway-credential-redis
      keyring:
        existingSecret: gateway-keyring
```

This configuration starts without cache or compression. Add [registered databases](/content/operate/iris/context-gateway/self-managed/configuration.md#database-registry) and feature settings when you need them.

The suite sets these Context Gateway values itself and registers Context Gateway with its Identity Service. Don't set them under `contextGateway:`: a value that differs fails the render.

- `tenantId` and `license`, from `global.iris`.
- `identityService.baseURL` and `identityService.allowInsecureTransport`, for the suite's own Identity Service.
- `dataplane.runtimeToken` and `controlplane.internalToken`, which the suite supplies as Kubernetes Secrets. See [Credentials](/content/operate/iris/self-managed/_index.md#credentials).
- `controlplane.config.auth.oidc`, when `global.iris.auth.oidc` sets an issuer.
- `fullnameOverride`, both `service.port` values, `dataplane.strategy`, and `podDisruptionBudget.enabled`, which the suite fixes. The suite runs two Data Plane replicas by default.

`tls.caBundle` defaults to `global.tls.caCertSecret`. `controlplane.adminToken` reads the `iris-context-gateway-admin-token` Secret, which the suite generates by default.

Check these values before you install. If one is wrong, you see the symptom in its row.

{{< table-scrollable >}}
| Check | Symptom | Fix |
| --- | --- | --- |
| `publicBaseURL` is the Data Plane origin that MCP clients reach | `mcpEndpoint` in Gateway responses points to an address clients cannot reach, and identity provider sign-in fails | Set the public origin, including `https://`. |
| Any `image.repository` or `image.tag` override names an image your cluster can pull | Pods `ImagePullBackOff` | Remove the overrides to use the chart's default images, or mirror those images unchanged. |
{{< /table-scrollable >}}

## 3. Install or upgrade the release

For a new release, follow [Run the preflight](/content/operate/iris/self-managed/_index.md#4-run-the-preflight) and [Install](/content/operate/iris/self-managed/_index.md#5-install). To add Context Gateway to a running release, upgrade it:

```bash
helm upgrade iris redis-ai/redis-iris \
  --version 1.0.0 \
  --namespace <namespace-name> \
  -f iris-values.yaml
```

## 4. Verify the deployment

```bash
kubectl -n <namespace-name> rollout status deployment/redis-context-gateway-controlplane
kubectl -n <namespace-name> rollout status deployment/redis-context-gateway-dataplane
helm test iris --namespace <namespace-name> --logs
```

`helm test` creates a Gateway, mints a scoped agent key, and calls the Data Plane with it. See [Verify the release](/content/operate/iris/self-managed/_index.md#6-verify-the-release).

To call the services from your workstation, run each port-forward in its own terminal and leave it running:

```bash
kubectl -n <namespace-name> port-forward svc/redis-context-gateway-controlplane 9100:9100
```

```bash
kubectl -n <namespace-name> port-forward svc/redis-context-gateway-dataplane 8083:8083
```

```bash
kubectl -n <namespace-name> port-forward svc/iris-identity-service 9200:9200
```

Rerun a port-forward after its pod is replaced. Then check readiness on both planes:

```bash
curl -sS http://localhost:9100/health/readiness
curl -sS http://localhost:8083/health/readiness
```

## 5. Create a Gateway

Read the admin token and the Identity Service control token from the Secrets the suite generates. See [Credentials](/content/operate/iris/self-managed/_index.md#credentials).

```bash
kubectl -n <namespace-name> get secret iris-context-gateway-admin-token -o jsonpath='{.data.token}' | base64 -d
kubectl -n <namespace-name> get secret iris-identity-service-control-token -o jsonpath='{.data.token}' | base64 -d
```

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

The response carries `gatewayId` (a `gw_`-prefixed ID) and `mcpEndpoint`. Use that ID in the grant in step 6. The advertised endpoint must be reachable from the shell that makes the MCP calls.
## 6. Mint an agent key

Use the suite's `global.iris.tenantId` as `<tenant-id>`:

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

## 7. Make one authenticated call

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
