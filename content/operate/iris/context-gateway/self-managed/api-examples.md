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

These examples use Bash, cURL, jq, and `redis-cli`. Use a dedicated demo Surface database with JSON and Search support. Register it in both planes, separately from the Gateway database. Enable `compression.enabled` in the Data Plane and use a Gateway database with JSON and `maxmemory-policy noeviction`.

Choose the registry IDs:

```bash
export GATEWAY_DATABASE_ID='<gateway-database-id>'
export SURFACE_DATABASE_ID='<surface-database-id>'
```

Create a `FULL` mode Gateway with compression disabled, and a `SEARCH` mode Gateway with compression enabled:

```bash
curl --fail-with-body --silent --show-error \
  -X POST "$IRIS_CONTEXT_GATEWAY_SERVICE_URL/iris/v1/context-gateway/gateways" \
  -H "Authorization: Bearer $IRIS_CONTEXT_GATEWAY_SERVICE_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name": "Front desk", "toolExposureMode": "FULL", "cache": "DISABLED", "compression": "DISABLED"}' > front-desk.json

jq -n --arg database "$GATEWAY_DATABASE_ID" '{
  name: "Operations", toolExposureMode: "SEARCH", databaseId: $database,
  cache: "DISABLED", compression: "ENABLED"
}' > operations-create.json
curl --fail-with-body --silent --show-error \
  -X POST "$IRIS_CONTEXT_GATEWAY_SERVICE_URL/iris/v1/context-gateway/gateways" \
  -H "Authorization: Bearer $IRIS_CONTEXT_GATEWAY_SERVICE_TOKEN" \
  -H 'Content-Type: application/json' \
  --data-binary @operations-create.json > operations.json

export FRONT_DESK_ID="$(jq -er '.gatewayId' front-desk.json)"
export OPERATIONS_ID="$(jq -er '.gatewayId' operations.json)"
jq '{gatewayId, mcpEndpoint, toolExposureMode, compression}' front-desk.json operations.json
```

The `SEARCH` mode Gateway explicitly enables compression. Creation fails if its database cannot support it. Cache remains disabled in this walkthrough. Compression also needs `compression.enabled` on the Data Plane. See [Cache and compression](/content/operate/iris/context-gateway/self-managed/configuration.md#cache-and-compression).

## Register the sample Upstream

Save the complete JSON model from [Write a data model](/content/develop/ai/context-engine/context-gateway/manage-context-surfaces.md#write-a-data-model) as `clinic-model.json`. It defines `Location` and `Provider`, including the `specialty` and `location_id` TAG fields. Load these synthetic records into the dedicated demo database. The commands replace only these five sample keys:

```bash
export SURFACE_REDIS_URL='<surface-redis-url>'
redis-cli -u "$SURFACE_REDIS_URL" JSON.SET location:clinic-a '$' \
  '{"id":"clinic-a","name":"Clinic A","city":"Boston"}'
redis-cli -u "$SURFACE_REDIS_URL" JSON.SET location:clinic-b '$' \
  '{"id":"clinic-b","name":"Clinic B","city":"Boston"}'
redis-cli -u "$SURFACE_REDIS_URL" JSON.SET provider:p1 '$' \
  '{"id":"p1","specialty":"cardiology","location_id":"clinic-a"}'
redis-cli -u "$SURFACE_REDIS_URL" JSON.SET provider:p2 '$' \
  '{"id":"p2","specialty":"cardiology","location_id":"clinic-a"}'
redis-cli -u "$SURFACE_REDIS_URL" JSON.SET provider:p3 '$' \
  '{"id":"p3","specialty":"cardiology","location_id":"clinic-b"}'
```

Use the TLS scheme `rediss://` when the database requires it. Keep the real connection URL out of source control. For a password, prefer `REDISCLI_AUTH` over placing the password in command arguments. Importers must normalize line breaks in TEXT fields to spaces before writing records.

Register this model on both Gateways. Sharing the Surface database is intentional here: both Gateways should expose the same demo records.

```bash
jq -n --arg database "$SURFACE_DATABASE_ID" --slurpfile model clinic-model.json '{
  name: "Scheduling", namespace: "scheduling", kind: "CONTEXT_SURFACE",
  contextSurface: {databaseId: $database, dataModel: $model[0]}
}' > surface-create.json

for gateway_id in "$FRONT_DESK_ID" "$OPERATIONS_ID"; do
  curl --fail-with-body --silent --show-error \
    -X POST "$IRIS_CONTEXT_GATEWAY_SERVICE_URL/iris/v1/context-gateway/gateways/$gateway_id/upstreams" \
    -H "Authorization: Bearer $IRIS_CONTEXT_GATEWAY_SERVICE_TOKEN" \
    -H 'Content-Type: application/json' \
    --data-binary @surface-create.json > "surface-$gateway_id.json"
  jq -e '(.initialCatalogFailure == null) and (.upstreamId != null)' "surface-$gateway_id.json"
done
```

If `initialCatalogFailure` is present, stop and fix the reported database or configuration error before continuing. Indexing happens in the background. Wait for indexing to finish before comparing result counts. The expected dataset has three cardiologists: two at Clinic A and one at Clinic B.

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

Use the returned endpoints rather than constructing MCP URLs. They must be reachable from the developer's machine:

```bash
export IRIS_CONTEXT_GATEWAY_URL="$(jq -er '.mcpEndpoint' front-desk.json)"
export SEARCH_GATEWAY_URL="$(jq -er '.mcpEndpoint' operations.json)"
python -m venv .venv
source .venv/bin/activate
python -m pip install 'redis-context-gateway==1.0.0b1'
```

Run this Python program to authenticate and list both catalogs:

```python
import asyncio
import os

from redis_context_gateway import ContextGateway

async def main():
    for setting in ("IRIS_CONTEXT_GATEWAY_URL", "SEARCH_GATEWAY_URL"):
        client = ContextGateway(os.environ[setting], os.environ["IRIS_CONTEXT_GATEWAY_API_KEY"])
        async with client.connect() as session:
            result = await session.list_tools()
            print(setting, [tool.name for tool in result.tools])

asyncio.run(main())
```

The full-mode catalog includes `scheduling__filter_provider`. The search-mode catalog includes `search_tools`, `run_tool`, and the handle tools, including `run_tool_as_handle` and `count_results`. Continue with the [quickstart](/content/develop/ai/context-engine/context-gateway/quickstart.md) to call the sample tools.

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

The `iris context-gateway` command-line interface (CLI) in the [redis-iris package](https://pypi.org/project/redis-iris/) also manages Gateways. Install the version pinned in the [quickstart](/content/develop/ai/context-engine/context-gateway/quickstart.md#use-the-cli). With `IRIS_IDENTITY_URL` and `IRIS_IDENTITY_TOKEN` exported, create a Gateway, mint its agent key, and write the developer's environment file in one command:

```bash
iris context-gateway service create --name front-desk --write-env .env
```

`--write-env` writes `IRIS_CONTEXT_GATEWAY_URL`, `IRIS_CONTEXT_GATEWAY_ID`, and `IRIS_CONTEXT_GATEWAY_API_KEY` to the file with mode `0600`, and the key is never printed. Add `--tool-exposure-mode search` and `--database-id <gateway-database-id>` for the operations Gateway. `service key` mints an agent key. `iris identity keys list --product context-gateway` lists keys, and `iris identity keys revoke <key-id>` revokes one. See [Manage Gateways and Upstreams](/content/develop/ai/context-engine/context-gateway/manage-gateways.md) for every operation.
