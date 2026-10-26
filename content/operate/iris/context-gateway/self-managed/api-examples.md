---
Title: Self-managed Context Gateway API examples
alwaysopen: false
categories:
- docs
- operate
- iris
description: Create the Gateways and the sample Upstream, mint an agent key, verify agent access, and rotate or revoke keys.
linkTitle: API examples
weight: 70
hideListLinks: true
---

Create the two Gateways the [developer quickstart](/content/develop/ai/context-engine/context-gateway/quickstart.md) uses, register the sample clinic directory on both, issue one agent key, and hand the connection values to a developer.

Before you begin, [deploy the chart](/content/operate/iris/context-gateway/self-managed/deploy.md) and [load the admin token](/content/operate/iris/context-gateway/self-managed/authentication.md#control-plane-admin-token).

## Set connection values

Forward the Control Plane and the Identity Service in separate terminals, as in [Deploy](/content/operate/iris/context-gateway/self-managed/deploy.md#5-verify-pods-and-health), then export the connection values:

```bash
export IRIS_CONTEXT_GATEWAY_SERVICE_URL='http://localhost:9100'
export IRIS_IDENTITY_URL='http://localhost:9200'
export IRIS_IDENTITY_TOKEN='<identity-service-control-token>'
export IRIS_IDENTITY_TENANT='<tenant-id>'
umask 077
```

`IRIS_CONTEXT_GATEWAY_SERVICE_TOKEN` holds the admin token. For application deployment, use the Control Plane and Identity Service endpoints your platform exposes.

## Create the Gateways

Create a `full` mode Gateway, and a `search` mode Gateway with a Gateway database so that it can hold result handles:

```bash
curl --fail-with-body --silent --show-error \
  -X POST "$IRIS_CONTEXT_GATEWAY_SERVICE_URL/v1/gateways" \
  -H "Authorization: Bearer $IRIS_CONTEXT_GATEWAY_SERVICE_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"displayName": "Front desk", "toolExposureMode": "full"}' > front-desk.json

curl --fail-with-body --silent --show-error \
  -X POST "$IRIS_CONTEXT_GATEWAY_SERVICE_URL/v1/gateways" \
  -H "Authorization: Bearer $IRIS_CONTEXT_GATEWAY_SERVICE_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"displayName": "Operations", "toolExposureMode": "search", "databaseId": "<gateway-database-id>"}' > operations.json

export FRONT_DESK_ID="$(jq -er '.id' front-desk.json)"
export OPERATIONS_ID="$(jq -er '.id' operations.json)"
jq '{id, mcpEndpoint, toolExposureMode}' front-desk.json operations.json
```

The `search` mode Gateway has a `databaseId`, so it starts with `cache` and `compression` enabled. Result handles also need `result_handles.enabled` on the Data Plane. See [Result cache and result handles](/content/operate/iris/context-gateway/self-managed/configuration.md#result-cache-and-result-handles).

<!-- TODO: Run every step against a deployed chart before review. -->

## Register the sample Upstream

Load the sample clinic directory into a registered Surface database and register it as a Context Surface on both Gateways.

*Example set `iris_gateway_setup`, steps `gateway-seed-data` and `gateway-create-surface`, in cURL (Iris) and CLI (Iris).*

## Mint an agent key

Issue one key with a `use` grant on each Gateway:

```bash
jq -n --arg tenant "$IRIS_IDENTITY_TENANT" --arg a "$FRONT_DESK_ID" --arg b "$OPERATIONS_ID" '{
  name: "front-desk-agent",
  grants: [
    {tenant: $tenant, product: "context-gateway", resourceType: "gateway", resourceId: $a, actions: ["use"]},
    {tenant: $tenant, product: "context-gateway", resourceType: "gateway", resourceId: $b, actions: ["use"]}
  ]
}' > agent-grant.json

curl --fail-with-body --silent --show-error \
  -X POST "$IRIS_IDENTITY_URL/v1/api-keys" \
  -H "Authorization: Bearer $IRIS_IDENTITY_TOKEN" \
  -H 'Content-Type: application/json' \
  --data-binary @agent-grant.json > agent-key.json
export IRIS_CONTEXT_GATEWAY_API_KEY="$(jq -er '.token' agent-key.json)"
```

> [!WARNING]
> The response's `token` is the agent key, and it is returned only on creation or rotation. Save it in your secret manager and keep its `keyId`.

## Verify agent access

*Example set `iris_gateway_setup`, step `gateway-verify`, in cURL (Iris) and CLI (Iris): a Model Context Protocol (MCP) `tools/list` request to each Gateway that prints the tool names.*

## Rotate or revoke agent keys

Rotate a key to issue a new token for the same grants. The grace period keeps the old token valid while applications switch:

```bash
curl --fail-with-body --silent --show-error \
  -X POST "$IRIS_IDENTITY_URL/v1/api-keys/<key-id>/rotate?graceSeconds=3600" \
  -H "Authorization: Bearer $IRIS_IDENTITY_TOKEN"
```

Revoke a key you no longer need:

```bash
curl --fail-with-body --silent --show-error \
  -X DELETE "$IRIS_IDENTITY_URL/v1/api-keys/<key-id>" \
  -H "Authorization: Bearer $IRIS_IDENTITY_TOKEN"
```

A revoked key stops working within the Identity Service cache lifetime, 300 seconds by default.

## Hand off to a developer

Give the developer the front desk Gateway's `mcpEndpoint` as `IRIS_CONTEXT_GATEWAY_URL`, the operations Gateway's `mcpEndpoint` as `SEARCH_GATEWAY_URL`, and the agent key as `IRIS_CONTEXT_GATEWAY_API_KEY`. Give platform teams who register Upstreams the Control Plane URL and admin token for [Manage Gateways and Upstreams](/content/develop/ai/context-engine/context-gateway/manage-gateways.md). Remove the local key-response files after you save the token.

## Use the CLI instead

The `iris context-gateway` command-line interface (CLI) in the [redis-iris package](https://pypi.org/project/redis-iris/) runs the same steps. With `IRIS_IDENTITY_URL` and `IRIS_IDENTITY_TOKEN` exported, create a Gateway, mint its agent key, and write the developer's environment file in one command:

```bash
iris context-gateway service create --name front-desk --write-env .env
```

`--write-env` writes `IRIS_CONTEXT_GATEWAY_URL`, `IRIS_CONTEXT_GATEWAY_ID`, and `IRIS_CONTEXT_GATEWAY_API_KEY` to the file with mode `0600`, and the key is never printed. Add `--tool-exposure-mode search` and `--database-id <gateway-database-id>` for the operations Gateway. `service key`, `service keys`, and `service revoke` mint, list, and revoke agent keys. See [Manage Gateways and Upstreams](/content/develop/ai/context-engine/context-gateway/manage-gateways.md) for every operation.
