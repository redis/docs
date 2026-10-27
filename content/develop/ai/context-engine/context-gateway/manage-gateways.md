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

Use the Control Plane to create Gateways, register their Upstreams, and decide how each tool behaves. Agents see a change on their next request. To serve Redis records as tools, see [Manage Context Surfaces](/content/develop/ai/context-engine/context-gateway/manage-context-surfaces.md).

## Before you begin

These tasks need the Control Plane URL and the admin token, which a platform team holds. See [Authentication and authorization](/content/operate/iris/context-gateway/self-managed/authentication.md). The admin token manages every Gateway in the deployment, so keep it out of agent and application configuration.

Export these values in the shell where you run the examples:

```bash
export IRIS_CONTEXT_GATEWAY_SERVICE_URL='<control-plane-url>'
export IRIS_CONTEXT_GATEWAY_SERVICE_TOKEN='<admin-token>'
```

The examples use Python (`ContextGateway.from_env().service`), cURL, and the `iris context-gateway` command-line interface (CLI), which all read these variables. Follow one tab throughout the page. To choose a client, see the [developer guide](/content/develop/ai/context-engine/context-gateway/developer-guide.md#choose-a-client).

## Create a Gateway

Create a Gateway and save its `id` and `mcpEndpoint`. The Gateway serves Model Context Protocol (MCP) at that endpoint immediately.

*Example set `iris_gateway_manage`, step `gateway-create`, in Python (Iris), cURL (Iris), and CLI (Iris).*

To use the cache or compression, select a Gateway database with `databaseId`. Your administrator names the available databases. A Gateway created with a `databaseId` has `cache` and `compression` enabled unless you send them as `disabled`. Sending `enabled` without a `databaseId` returns `400`.

## List and inspect Gateways and Upstreams

List the deployment's Gateways and a Gateway's Upstreams, and read one by ID. Every read returns the current `revision`, which updates and deletes need.

*Example step `gateway-list`.*

## Change a Gateway

Update a Gateway's `toolExposureMode` to `full` or `search`, its display name, its `databaseId`, or its `cache` and `compression` settings. Agents see a new mode on their next request. See [Tool exposure modes](/content/develop/ai/context-engine/context-gateway/concepts.md#tool-exposure-modes).

*Example step `gateway-update-mode`.*

### Turn the cache and compression on or off

Set `cache` or `compression` to `enabled` or `disabled` on a Gateway update. Every Gateway response returns both settings. A Gateway's setting takes effect only when the deployment also turns the feature on. See [Cache and compression](/content/operate/iris/context-gateway/self-managed/configuration.md#cache-and-compression).

```json
{"revision": "<revision>", "cache": "enabled", "compression": "disabled"}
```

| Change | What to send |
| --- | --- |
| Remove the Gateway database | `"databaseId": null` with `"cache": "disabled"` and `"compression": "disabled"` in the same request. Without them, the update returns `400`. |
| Add a Gateway database to a Gateway that had none | `databaseId` with `"cache": "enabled"`, `"compression": "enabled"`, or both. Adding a database alone keeps both settings as they were, which is `disabled` for a Gateway created without one. |
| Stop caching or handles for a Gateway | `"disabled"` for that setting. The Gateway stops reading and writing cache entries, or stops creating handles and removes the handle tools from `tools/list`. Stored entries and handles stay until their TTL. |

*Example step `gateway-update-features`.*

## Register an MCP server

Register an MCP server as an Upstream with a namespace, its endpoint, and its credential. Any MCP server that serves Streamable HTTP works, including third-party and in-house servers. The Gateway discovers the server's tools during registration.

*Example step `gateway-register-mcp`.*

| Credential method | What the Gateway sends |
| --- | --- |
| `bearer` | `Authorization: Bearer <value>` |
| `header` | The value in the header you name. |

The Control Plane writes the credential value to the secrets backend. Reads of the Upstream never return it.

## Inspect the tool catalog

List an Upstream's tools to see their qualified names and whether each one can be cached.

*Example step `gateway-list-tools`.*

Refresh the catalog when the Upstream's tools change. A refresh publishes a new catalog revision, and cached results from the old revision are no longer served.

*Example step `gateway-refresh`.*

## Enable or disable an Upstream

Disable an Upstream to take its tools away from agents without deleting it. Its tools return when you enable it again.

*Example step `gateway-disable`.*

## Set tool policies

Set a tool's policies with `toolPolicies` on an Upstream update. The cache is opt-in for each tool. Compression applies to every eligible result while it is on for the Gateway, so a tool policy only opts a tool out or changes its handle lifetime.

| Policy | Member | Effect |
| --- | --- | --- |
| `cache` | `ttlSeconds`, 1 to 86400 | Caches the tool's results for that long. |
| `compression` | `capture: never` | Always returns the tool's results whole, also from `run_tool_as_handle`. |
| `compression` | `ttlSeconds`, 1 to 86400 | Keeps the tool's handles for that long instead of the deployment's default. |

*Example step `gateway-tool-policy`.*

- Cache only tools whose data changes more slowly than the time to live (TTL). All callers with access to the Gateway share its cache entries.
- A tool whose definition says `readOnlyHint: false` or `destructiveHint: true` is never cached.
- A new or changed `cache` policy returns `400` while the Gateway's `cache` setting is `disabled`, including on a Gateway without a `databaseId`. A stored policy sent back unchanged is kept.
- When you move an Upstream to a new endpoint, the response lists any policies it removed in `droppedToolPolicies`.

## Rotate an Upstream credential

Update the Upstream with a new credential value. If you rotate a secret in place in Vault or AWS Secrets Manager instead, refresh the catalog so that cached results stop being served.

*Example step `gateway-rotate-credential`.*

## Delete an Upstream or a Gateway

Delete an Upstream at its current revision. A Gateway can be deleted only when it has no Upstreams. With the CLI, `iris context-gateway service delete <gateway-id> --cascade` deletes the Upstreams first.

*Example step `gateway-delete`.*

A delete marks the Upstream first, then cleans up. If a delete stops after the mark, for example on a timeout, repeat it with the Upstream ID to finish.

Revoke the agent keys for a deleted Gateway. See [Operations](/content/operate/iris/context-gateway/self-managed/operations.md#rotate-credentials).
