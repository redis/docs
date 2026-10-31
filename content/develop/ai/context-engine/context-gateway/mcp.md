---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Connect a Streamable HTTP MCP client to a Gateway with an agent key or your identity provider, use full or search mode, and read handles.
hideListLinks: true
linktitle: MCP
title: Connect with MCP
weight: 60
aliases:
- /develop/ai/context-engine/context-gateway/connect-agents/
---

Connect any Model Context Protocol (MCP) client that supports Streamable HTTP and custom request headers. For framework examples, see [Integrate with an agent](/content/develop/ai/context-engine/context-gateway/agent-integration.md). For every tool, argument, and metadata key, see the [API reference](/content/develop/ai/context-engine/context-gateway/api-reference.md).

## Before you begin

Get the Gateway's MCP endpoint and an agent key with a `use` grant. Export `IRIS_CONTEXT_GATEWAY_URL` and `IRIS_CONTEXT_GATEWAY_API_KEY` as shown in [Save connection values](/content/develop/ai/context-engine/context-gateway/quickstart.md#save-connection-values).

Install the dependencies for your language as shown in the [quickstart](/content/develop/ai/context-engine/context-gateway/quickstart.md#before-you-begin).

## Configure the connection

| Setting | Value |
| --- | --- |
| Transport | Streamable HTTP |
| Endpoint | `<data-plane-base-url>/iris/data/v1/context-gateway/gateways/<gateway-id>/mcp` |
| Request header | `Authorization: Bearer <agent-key>` or `X-Api-Key: <agent-key>` |
| Protocol versions | `2026-07-28`, `2025-11-25`, `2025-06-18`, and `2025-03-26` |

The endpoint must be reachable from the client runtime. Keep the agent key in connection settings and out of agent instructions.

In Python, `ContextGateway` from the `redis-iris` package opens a session with these settings and sends the agent key as `Authorization: Bearer`.

The command-line interface (CLI) writes the configuration for Claude Code, Cursor, the Agent Development Kit (ADK), or a generic JSON client. It reads the Gateway's endpoint from the Control Plane, so it needs the Gateway ID and the Control Plane settings:

```bash
export IRIS_CONTEXT_GATEWAY_ID='<gateway-id>'
iris context-gateway connect --client claude-code
```

Use `--client cursor`, `adk`, or `json` for the other clients. The written configuration reads the key from an environment variable and never contains it.

## Use the tools

What the agent sees depends on the Gateway's [tool exposure mode](/content/develop/ai/context-engine/context-gateway/concepts.md#tool-exposure-modes).

### Full mode

`tools/list` returns every tool under its qualified name. Call a tool by that name with `tools/call`.

### Search mode

`tools/list` returns these discovery tools, plus the handle tools when compression is enabled:

| Tool | Input | Result |
| --- | --- | --- |
| `search_tools` | `query`, 1 to 200 characters, or `*` for every tool. Optional `limit`, 1 to 100, default 5. | `matched`, `returned`, `truncated`, and the matching tool definitions in ranked order. |
| `run_tool` | `tool` with `upstreamId` and `originalName`, and the tool's arguments in `toolArgs`. | The tool's result. |

Use the tools in this order:

1. Search with words that a tool's name, title, or description would contain. Search matches words, not meaning.
2. Pick a definition and read its input schema. When `truncated` is `true`, raise `limit` or narrow the query.
3. Call it through `run_tool`, copying `upstreamId` and `originalName` from the definition's `_meta["com.redis.context-gateway/tool"]`. Do not construct them, and send no other members of that metadata. `run_tool` refuses extra members, such as the catalog revision.

## Connect a client

Follow the [quickstart](/content/develop/ai/context-engine/context-gateway/quickstart.md#connect-to-the-gateway) for a complete client that connects, lists tools, and calls one in either mode.

## Read handles

When compression is on for the Gateway, it lists these tools in both modes:

| Tool | What it does |
| --- | --- |
| `run_tool_as_handle` | Runs one tool and requests a handle even below the automatic threshold. Returns a tool error if capture is refused. In full mode it takes the tool's `name`. In search mode it takes a `tool` reference, as `run_tool` does. |
| `page_results` | Reads a held result in order. |
| `query_results` | Selects from a held JSON result with a JSONPath expression. |
| `count_results` | Counts items, selected nodes, or items for each value of one field. |
| `aggregate_results` | Computes the count, sum, minimum, maximum, or average of selected numbers. |
| `describe_result` | Describes a held result's shape, size, fields, and expiry. |
| `release_results` | Deletes a held result before it expires. |

![A large tool result is stored in the Gateway database, automatically or through run_tool_as_handle, and the agent receives a small stub. The agent reads a page or a query from the stored result, then releases the handle.](/images/ai/context-engine/context-gateway-handles.svg)
{width="700"}

An ordinary tool call whose result exceeds the handle threshold can also return a stub, unless the tool's policy opts out. The stub carries the handle in `_meta["com.redis.context-gateway/handle"]`, a short preview, and the next call to make. Automatic capture can still return the whole result, for example when the Gateway database is low on memory, so check for the handle before you read it. Explicit `run_tool_as_handle` calls return a tool error instead of falling back inline.

Follow [Read a large result through a handle](/content/develop/ai/context-engine/context-gateway/quickstart.md#4-read-a-large-result-through-a-handle) for page, count, and release calls. Use `query_results` with a `jsonpath` expression to select nodes. Always inspect `completeness` and `warning`: results can represent only part of the source, and paging a stored handle does not fetch uncaptured source records.

Handles are bound to the caller. Another caller's handle, or one that expired or was released, returns a tool error with the reason `unknown_handle`.

## Sign in with your identity provider

When the deployment turns on sign-in, an MCP client can use an access token from your identity provider (IdP) instead of an agent key. Send it as `Authorization: Bearer <token>`. The Gateway does not accept an IdP token in `X-Api-Key`.

A request without a credential receives `401` and a `WWW-Authenticate` header that points to the Gateway's protected resource metadata. Clients that support MCP authorization read that document, find the IdP, and sign the user in. The IdP's token never reaches an Upstream.

The signed-in user still needs a grant on the Gateway. See [Identity provider sign-in](/content/operate/iris/context-gateway/self-managed/authentication.md#identity-provider-sign-in).

## Troubleshoot the connection

| Response | Meaning | Action |
| --- | --- | --- |
| `401` | No credential, or the key or token was not accepted. | Check the key, its expiry, and the header. |
| `403` | The credential has no grant for this Gateway. | Ask your administrator for a `use` grant. |
| `404` | No Gateway answers at this URL for your tenant. | Check the full endpoint. |
| JSON-RPC error with `reason` `unknown_tool` | A direct call names a tool the Gateway does not expose. | List the tools again and use a returned name. |
| Tool error with `reason` `unknown_tool` and `completion` `not_dispatched` | A target passed through `run_tool` or `run_tool_as_handle` is unknown or inaccessible. | Discover the tools again and copy the returned identity. |
| Tool result with its error flag set | The tool or its Upstream failed. | Read `reason` and `completion` in the failure metadata. See [Limits and errors](/content/develop/ai/context-engine/context-gateway/limits.md). |

Give your platform team the `traceId` from a JSON-RPC error's `data` to find the failure in their logs. With the Control Plane token, they can run `iris context-gateway service check <gateway-id>`, which checks the token, the Gateway, the Identity Service, the agent key, and one `tools/list`, in that order, and stops at the first failure. `iris context-gateway service diagnose <gateway-id>` prints a report of the Gateway's setup.

Keep diagnostic details without logging keys or tool results that hold private data.
