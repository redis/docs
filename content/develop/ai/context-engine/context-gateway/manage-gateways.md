---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Create and change Gateways, register MCP servers with their credentials, set tool policies, and remove Upstreams.
hideListLinks: true
linktitle: Manage Gateways
title: Manage Gateways and Upstreams
weight: 20
---

Use the Control Plane to create Gateways, register Upstreams, and set tool policies. To serve Redis records as tools, see [Manage Context Surfaces](/content/develop/ai/context-engine/context-gateway/manage-context-surfaces.md).

## Before you begin

These self-managed examples use Bash, cURL, and jq. Get the Control Plane URL and admin token from your platform team. The admin token manages every Gateway in the deployment. Keep it out of agent and application configuration. See [Authentication and authorization](/content/operate/iris/context-gateway/self-managed/authentication.md).

Export the values and define a helper in the shell where you run the examples:

```bash
export IRIS_CONTEXT_GATEWAY_SERVICE_URL='<control-plane-url>'
export IRIS_CONTEXT_GATEWAY_SERVICE_TOKEN='<admin-token>'
export GATEWAY_API="$IRIS_CONTEXT_GATEWAY_SERVICE_URL/iris/v1/context-gateway"
umask 077

gateway_api() {
  local method="$1" path="$2"
  shift 2
  curl --fail-with-body --silent --show-error \
    -X "$method" "$GATEWAY_API$path" \
    -H "Authorization: Bearer $IRIS_CONTEXT_GATEWAY_SERVICE_TOKEN" \
    -H 'Content-Type: application/json' "$@"
}
```

The [developer guide](/content/develop/ai/context-engine/context-gateway/developer-guide.md#choose-a-client) describes the Python and TypeScript SDKs and the command-line interface (CLI). API enum values are case-sensitive: use `FULL` or `SEARCH`, and `ENABLED` or `DISABLED` in JSON. CLI flags can accept lowercase values.

## Create a Gateway

Create a Gateway and save its `gatewayId` and `mcpEndpoint`:

```bash
gateway_api POST /gateways \
  --data '{"name":"Support","toolExposureMode":"FULL","cache":"DISABLED","compression":"DISABLED"}' \
  > gateway.json
export GATEWAY_ID="$(jq -er '.gatewayId' gateway.json)"
jq '{gatewayId, mcpEndpoint, revision}' gateway.json
```

Gateway IDs start with `gw_`, and Upstream IDs start with `up_`. Copy the returned IDs rather than constructing them.

To use cache or compression, select a Gateway database with `databaseId`. On a self-managed deployment, omitting it uses the configured default Gateway database, if there is one. Without either, both features are disabled. An explicit empty string or `null` on create returns `400`. A response exposes the resolved database through `databaseBinding`, including its name when available. See [Default databases](/content/operate/iris/context-gateway/self-managed/configuration.md#default-databases).

When a Gateway is created with a database, cache and compression default to `ENABLED` unless explicitly disabled, subject to the compression capability check. Explicitly enabling compression requires a reachable database with JSON support and `maxmemory-policy noeviction`. An unsuitable database returns `400` with an entry in `errors[]` whose `pointer` names `/compression`. An unreachable database returns `503`. When create omits compression and the check fails, it stores compression as `DISABLED` instead. The example explicitly disables both features for a basic tool-only Gateway.

## List and inspect Gateways and Upstreams

List the first page, then read one Gateway:

```bash
gateway_api GET '/gateways?limit=50' > gateways.json
jq '.items[] | {gatewayId, name}' gateways.json
gateway_api GET "/gateways/$GATEWAY_ID" > gateway.json
```

Lists return `items` and an optional `nextCursor`. To fetch another page, pass that opaque cursor unchanged and URL-encoded:

```bash
cursor="$(jq -r '.nextCursor // empty' gateways.json)"
if [ -n "$cursor" ]; then
  gateway_api GET /gateways --get \
    --data-urlencode 'limit=50' --data-urlencode "cursor=$cursor" > gateways-next.json
fi
```

Use `/gateways/$GATEWAY_ID/upstreams` to list an Upstream page. Read a resource again before changing it, and copy its `revision` into `expectedRevision`. A stale revision returns `412` with type `/errors/revision-conflict`. Re-read and reconcile your change before retrying. Revisions are opaque values, not counters.

## Change a Gateway

Change the name or tool exposure mode with `PATCH`:

```bash
gateway_api GET "/gateways/$GATEWAY_ID" > gateway.json
jq '{expectedRevision: .revision, toolExposureMode: "SEARCH"}' gateway.json > update.json
gateway_api PATCH "/gateways/$GATEWAY_ID" --data-binary @update.json > gateway.json
```

Agents see the new mode on a subsequent request. See [Tool exposure modes](/content/develop/ai/context-engine/context-gateway/concepts.md#tool-exposure-modes).

### Turn the cache and compression on or off

Both features need a Gateway database and the corresponding deployment setting. This example adds a database and explicitly enables both:

```bash
export GATEWAY_DATABASE_ID='<gateway-database-id>'
gateway_api GET "/gateways/$GATEWAY_ID" > gateway.json
jq --arg database "$GATEWAY_DATABASE_ID" \
  '{expectedRevision: .revision, databaseId: $database, cache: "ENABLED", compression: "ENABLED"}' \
  gateway.json > update.json
gateway_api PATCH "/gateways/$GATEWAY_ID" --data-binary @update.json > gateway.json
```

| Change | What to send with `expectedRevision` |
| --- | --- |
| Detach the database | `"databaseId": null` and disable any enabled features in the same request: `"cache": "DISABLED", "compression": "DISABLED"`. |
| Add a database to a Gateway that had none | `databaseId` and explicitly enable the features you want. Adding a database alone preserves their disabled settings. |
| Disable a feature | `"DISABLED"` for that setting. Stored entries remain until their TTL expires. Disabling compression removes the handle tools from discovery. |

See [Cache and compression](/content/operate/iris/context-gateway/self-managed/configuration.md#cache-and-compression) for the deployment settings and memory limits.

## Register an MCP server

Register a Streamable HTTP Model Context Protocol (MCP) server. The endpoint must be reachable from the Gateway and allowed by its outbound policy. This example sends a bearer credential:

```bash
export UPSTREAM_URL='<upstream-mcp-url>'
export UPSTREAM_TOKEN='<upstream-bearer-token>'
jq -n --arg endpoint "$UPSTREAM_URL" --arg token "$UPSTREAM_TOKEN" '{
  name: "Support tools", namespace: "support", kind: "MCP",
  mcp: {endpoint: $endpoint, transport: "streamable-http",
        authentication: {methods: [{bearer: {value: $token}}]}}
}' > upstream-create.json
gateway_api POST "/gateways/$GATEWAY_ID/upstreams" \
  --data-binary @upstream-create.json > upstream.json
rm upstream-create.json
export UPSTREAM_ID="$(jq -er '.upstreamId' upstream.json)"
jq '{upstreamId, revision, initialCatalogFailure}' upstream.json
```

For a server that needs no credential, use `"authentication": {"methods": []}`. For a custom header, use a method such as `{"header":{"name":"X-Api-Key","value":"<upstream-key>"}}`. Credential values are write-only. Do not print or retain the temporary request file.

Namespaces have at most 32 characters. The Gateway exposes names such as `support__get_ticket`. Copy names from discovery instead of recreating the sanitization rules. Creating an Upstream can return `initialCatalogFailure` when initial discovery fails. Correct the cause and refresh before using its tools.

## Inspect the tool catalog

Read the tools and inspect their exact original names before setting policies:

```bash
gateway_api GET "/gateways/$GATEWAY_ID/upstreams/$UPSTREAM_ID/tools" > tools.json
jq . tools.json
```

Refresh after changing the server's tools:

```bash
gateway_api POST "/gateways/$GATEWAY_ID/upstreams/$UPSTREAM_ID/refresh" > upstream.json
```

A refresh publishes a new catalog revision. Results cached against the previous revision are no longer served.

## Enable or disable an Upstream

Disable an Upstream to hide its tools without deleting it. Set `enabled` to `true` to restore it:

```bash
gateway_api GET "/gateways/$GATEWAY_ID/upstreams/$UPSTREAM_ID" > upstream.json
jq '{expectedRevision: .revision, enabled: false}' upstream.json > update.json
gateway_api PATCH "/gateways/$GATEWAY_ID/upstreams/$UPSTREAM_ID" \
  --data-binary @update.json > upstream.json
```

## Set tool policies

Policy keys are exact original tool names, not the exposed `namespace__tool` names. Cache is opt-in per tool. Compression applies to eligible results while enabled, unless a tool policy excludes the tool or changes its handle lifetime.

| Policy | Member | Effect |
| --- | --- | --- |
| `cache` | `ttlSeconds`, 1 to 86400 | Cache eligible results for this duration. |
| `compression` | `capture: "NEVER"` | Disable capture. Ordinary calls return inline; an explicit handle request returns a tool error. |
| `compression` | `ttlSeconds`, 1 to 86400 | Override the handle lifetime. Do not combine with `capture`. |

This example preserves other policies while configuring one tool. First enable cache for the Gateway and choose a cacheable tool:

```bash
export ORIGINAL_TOOL_NAME='<original-tool-name>'
gateway_api GET "/gateways/$GATEWAY_ID/upstreams/$UPSTREAM_ID" > upstream.json
jq --arg tool "$ORIGINAL_TOOL_NAME" '{
  expectedRevision: .revision,
  toolPolicies: ((.toolPolicies // {}) + {($tool): {cache: {ttlSeconds: 60}}})
}' upstream.json > update.json
gateway_api PATCH "/gateways/$GATEWAY_ID/upstreams/$UPSTREAM_ID" \
  --data-binary @update.json > upstream.json
```

All callers with access to a Gateway share its cache entries. A tool declaring `readOnlyHint: false` or `destructiveHint: true` is not cacheable. New or changed cache policies return `400` while the Gateway's cache is disabled. An unchanged stored policy is retained. Moving an Upstream to another endpoint can remove policies, reported in `droppedToolPolicies`.

## Rotate an Upstream credential

Send the replacement authentication configuration at the current revision:

```bash
export UPSTREAM_TOKEN='<replacement-upstream-token>'
gateway_api GET "/gateways/$GATEWAY_ID/upstreams/$UPSTREAM_ID" > upstream.json
jq --arg token "$UPSTREAM_TOKEN" '{
  expectedRevision: .revision,
  mcp: {authentication: {methods: [{bearer: {value: $token}}]}}
}' upstream.json > credential-update.json
gateway_api PATCH "/gateways/$GATEWAY_ID/upstreams/$UPSTREAM_ID" \
  --data-binary @credential-update.json > upstream.json
rm credential-update.json
unset UPSTREAM_TOKEN
```

For a credential stored in an external secret backend and rotated there, refresh the catalog after rotation so cached results stop being served.

## Delete an Upstream or a Gateway

Delete each Upstream before deleting its Gateway. The CLI has no `--cascade` flag. These commands delete the selected MCP Upstream, then the Gateway if no other Upstreams remain:

```bash
gateway_api GET "/gateways/$GATEWAY_ID/upstreams/$UPSTREAM_ID" > upstream.json
revision="$(jq -er '.revision | @uri' upstream.json)"
gateway_api DELETE "/gateways/$GATEWAY_ID/upstreams/$UPSTREAM_ID?expectedRevision=$revision"

gateway_api GET "/gateways/$GATEWAY_ID" > gateway.json
revision="$(jq -er '.revision | @uri' gateway.json)"
gateway_api DELETE "/gateways/$GATEWAY_ID?expectedRevision=$revision"
```

A delete marks the Upstream before cleanup. If cleanup stops, repeat deletion by ID to finish. Revoke agent keys for a deleted Gateway. See [Operations](/content/operate/iris/context-gateway/self-managed/operations.md#rotate-credentials).
