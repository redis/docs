---
alwaysopen: false
categories:
- docs
- operate
- iris
description: Create a Gateway, register its first Upstream, mint an agent key, and verify agent access.
linkTitle: API examples
weight: 70
hideListLinks: true
---

Create a Gateway, register an Upstream, issue an agent key, and hand the connection values to a developer.

Before you begin, [deploy the chart](/content/operate/iris/context-gateway/self-managed/deploy.md), then [load the admin token](/content/operate/iris/context-gateway/self-managed/authentication.md#control-plane-admin-token).

## Set connection values

```bash
export IRIS_CONTEXT_GATEWAY_SERVICE_URL='http://localhost:9100'
export IRIS_IDENTITY_URL='<identity-service-url>'
export IRIS_IDENTITY_TENANT='<tenant-id>'
umask 077
```

## Create a Gateway

```bash
curl --fail-with-body --silent --show-error \
  -X POST "$IRIS_CONTEXT_GATEWAY_SERVICE_URL/v1/gateways" \
  -H "Authorization: Bearer $IRIS_CONTEXT_GATEWAY_SERVICE_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"displayName": "Support", "toolExposureMode": "full"}' > gateway.json
export GATEWAY_ID="$(jq -er '.id' gateway.json)"
jq '{id, mcpEndpoint, toolExposureMode}' gateway.json
```

<!-- TODO: Run every step against a deployed chart before review. -->

## Register an Upstream

*Request that registers the sample Upstream with a namespace and a credential, and prints the discovered tools.*

<!-- TODO: Choose the sample Upstream. A Context Surface over a small sample dataset needs no external MCP server. -->

## Mint an agent key

```bash
jq -n --arg tenant "$IRIS_IDENTITY_TENANT" --arg id "$GATEWAY_ID" '{
  name: "support-agent",
  grants: [{
    tenant: $tenant,
    product: "context-gateway",
    resourceType: "gateway",
    resourceId: $id,
    actions: ["use"]
  }]
}' > agent-grant.json

curl --fail-with-body --silent --show-error \
  -X POST "$IRIS_IDENTITY_URL/v1/api-keys" \
  -H "Authorization: Bearer $IRIS_IDENTITY_TOKEN" \
  -H 'Content-Type: application/json' \
  --data-binary @agent-grant.json > agent-key.json
export IRIS_CONTEXT_GATEWAY_API_KEY="$(jq -er '.token' agent-key.json)"
```

Save the token in your secret manager and keep its `keyId`. The token is returned only on creation or rotation.

## Verify agent access

*MCP `initialize` and `tools/list` requests with curl that print the Gateway's tool names.*

## Hand off to a developer

Give the developer the Gateway's `mcpEndpoint` as `IRIS_CONTEXT_GATEWAY_URL` and the agent key as `IRIS_CONTEXT_GATEWAY_API_KEY` for the [quickstart](/content/develop/ai/context-engine/context-gateway/quickstart.md). Give platform teams who register Upstreams the Control Plane URL and admin token for [Manage Gateways and Upstreams](/content/develop/ai/context-engine/context-gateway/manage-gateways.md). Remove the local key-response files after you save the token.

## Use the CLI instead

The `iris context-gateway` CLI in the [redis-iris package](https://pypi.org/project/redis-iris/) runs the same steps. Export `IRIS_IDENTITY_TOKEN` with the Identity Service control token, then create the Gateway, mint its agent key, and write the developer's environment file in one command:

```bash
iris context-gateway service create --name support --write-env .env
```

`--dry-run` checks the request and sends nothing. `--write-env` writes `IRIS_CONTEXT_GATEWAY_URL`, `IRIS_CONTEXT_GATEWAY_ID`, and `IRIS_CONTEXT_GATEWAY_API_KEY` to the file with mode `0600`, and the key is never printed. Register the first Upstream with `iris context-gateway upstream add`. See [Manage Gateways and Upstreams](/content/develop/ai/context-engine/context-gateway/manage-gateways.md) for every operation.
