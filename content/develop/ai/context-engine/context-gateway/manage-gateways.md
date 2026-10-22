---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Create Gateways, register MCP servers and Context Surfaces with their credentials, set tool policies, and remove Upstreams.
hideListLinks: true
linktitle: Manage Gateways
title: Manage Gateways and Upstreams
weight: 20
---

Use the Control Plane to create Gateways, register their Upstreams, and decide how each tool behaves. Agents see a change on their next request.

## Before you begin

Get the Control Plane URL and the admin token from your administrator. See [Authentication and access](/content/operate/iris/context-gateway/self-managed/authentication.md). The admin token manages every Gateway in the deployment, so keep it out of agent and application configuration.

Export these values in the shell where you run the examples:

```bash
export IRIS_CONTEXT_GATEWAY_SERVICE_URL='<control-plane-url>'
export IRIS_CONTEXT_GATEWAY_SERVICE_TOKEN='<admin-token>'
```

## Choose a client

| Client | Install | Use for administration |
| --- | --- | --- |
| Python | `pip install redis-iris` | `ContextGateway.from_env().service`, which reads `IRIS_CONTEXT_GATEWAY_SERVICE_URL` and `IRIS_CONTEXT_GATEWAY_SERVICE_TOKEN`. |
| CLI | `pip install redis-iris` | `iris context-gateway service`, `upstream`, and `policy` commands, which read the same variables. |
| HTTP | curl and jq | The [Control Plane API](/content/operate/iris/context-gateway/self-managed/control-plane-api-reference.md). |

The [redis-iris package](https://pypi.org/project/redis-iris/) requires Python 3.11 or later. The CLI reads secrets only from the environment, never from its configuration file, and never prints a key. Follow one tab throughout the page.

{{< note >}}
For TypeScript, see the [Context Gateway SDK on npm](https://www.npmjs.com/package/@redis-iris/context-gateway). It is a generated client, not a unified SDK equivalent to Python's `redis-iris` package.
{{< /note >}}

## Create a Gateway

Create a Gateway and save its identifier and `mcpEndpoint`. The Gateway serves MCP at that endpoint at once.

*Example set `iris_gateway_manage`, step `gateway-create`, in Python (Iris), cURL (Iris), and CLI (Iris).*

To use the result cache or result handles, select a Gateway database with `databaseId`. Your administrator names the available databases.

## Choose the tool exposure mode

Set `toolExposureMode` to `full` or `search` on create or update. Agents see the new mode on their next request. See [Tool exposure modes](/content/develop/ai/context-engine/context-gateway/concepts.md#tool-exposure-modes).

*Example step `gateway-update-mode`.*

## Register an MCP server

Register an MCP server as an Upstream with a namespace, its endpoint, and its credential. Any MCP server that serves Streamable HTTP works, including third-party and in-house servers. The Gateway discovers the server's tools during registration.

*Example step `gateway-register-mcp`.*

| Credential method | What the Gateway sends |
| --- | --- |
| `bearer` | `Authorization: Bearer <value>` |
| `header` | The value in the header you name. |

The Control Plane writes the credential value to the secrets backend. Reads of the Upstream never return it.

## Register a Context Surface

A Context Surface serves the records of a Redis database as tools generated from a data model. Your administrator registers the database under an identifier. You reference that identifier and supply the data model.

*Example step `gateway-register-surface`.*

Read these limits before you create a Surface:

- Every agent with access to the Gateway can read every record of every Surface on it. This release does not narrow results by access tags.
- Gateways whose Surfaces share a database can read each other's records. Give a Surface its own database when its records must stay separate, and never use one Redis database as both a Surface database and a Gateway database.
- Creating a Surface, changing its data model, or refreshing it starts background indexing on the Surface database. Search tools can return partial results until indexing finishes.

<!-- TODO: Link the Context Surface data model reference once it is published. -->

## Inspect the tool catalog

List an Upstream's tools to see their qualified names and whether each one can be cached.

*Example step `gateway-list-tools`.*

Refresh the catalog when the Upstream's tools change. A refresh publishes a new catalog revision, and cached results from the old revision are no longer served.

*Example step `gateway-refresh`.*

## Set tool policies

Turn on the result cache or result handles for one tool with `toolPolicies` on an Upstream update.

*Example step `gateway-tool-policy`.*

- A cached result is served until its `ttlSeconds` expires. Cache only tools whose data changes more slowly than the TTL.
- All callers with access to the Gateway share its cache entries.
- When you move an Upstream to a new endpoint, the response lists any policies it removed in `droppedToolPolicies`.

## Rotate an Upstream credential

Update the Upstream with a new credential value. If you rotate a secret in place in Vault or AWS Secrets Manager instead, refresh the catalog so that cached results stop being served.

*Example step `gateway-rotate-credential`.*

## Delete an Upstream or a Gateway

Delete an Upstream at its current revision. Delete a Gateway after you delete its Upstreams.

*Example step `gateway-delete`.*

A delete marks the Upstream first, then cleans up. If a delete stops after the mark, for example on a timeout, repeat it with the Upstream identifier to finish. Deleting a Context Surface also drops its indexes from the Surface database.

Revoke the agent keys for a deleted Gateway. See [Operations](/content/operate/iris/context-gateway/self-managed/operations.md).
