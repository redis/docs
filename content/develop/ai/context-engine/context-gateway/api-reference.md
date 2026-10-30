---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Reference for the Redis Context Gateway MCP endpoint, its tools and arguments, its metadata keys, and its errors.
hideListLinks: true
linktitle: API reference
title: Redis Context Gateway MCP API reference
weight: 80
---

Agents call Redis Context Gateway through its Model Context Protocol (MCP) endpoint, the Data Plane API. Platform teams manage Gateways and Upstreams through the [Control Plane API](/content/operate/iris/self-managed/context-gateway/control-plane-api-reference.md).

For how to connect, see [MCP](/content/develop/ai/context-engine/context-gateway/mcp.md). For limits and recovery, see [Limits and errors](/content/develop/ai/context-engine/context-gateway/limits.md).

## Endpoint

| Item | Value |
| --- | --- |
| Endpoint | `POST <data-plane-base-url>/v1/gateways/<gateway-id>/mcp`, the Gateway's `mcpEndpoint` |
| Transport | Streamable HTTP. Responses can be JSON or a server-sent event stream, so send `Accept: application/json, text/event-stream`. |
| Credential | An agent key in `Authorization: Bearer <key>` or `X-Api-Key: <key>`, or an identity provider (IdP) access token in `Authorization: Bearer <token>` |
| Protocol versions | `2026-07-28`, `2025-11-25`, `2025-06-18`, and `2025-03-26` |
| Sign-in metadata | `GET <data-plane-base-url>/.well-known/oauth-protected-resource/v1/gateways/<gateway-id>/mcp`, served without a credential when the deployment turns on sign-in |

Before any MCP message, the endpoint answers `401` without a valid credential, `404` for a Gateway that does not exist or belongs to another tenant, and `403` without a grant on the Gateway.

## Tools

### Upstream tools

In `full` mode, `tools/list` returns every tool of every enabled Upstream under its qualified name, `<namespace>.<original-name>`. Call one with `tools/call` and that name. Each definition keeps the Upstream's input schema, output schema, and annotations.

### `search_tools`

Listed in `search` mode only.

| Argument | Type | Description |
| --- | --- | --- |
| `query` | string | Required. 1 to 200 characters after trimming. `*` matches every tool. |
| `limit` | integer | Optional. 1 to 100. Default `5`. |

Any other argument is refused with the reason `invalid_arguments`. Search lowercases the query and matches its words against each tool's exposed name and original name first, then its title and description. Ties sort by exposed name, so the order is stable for the same catalog and query.

The result, in `structuredContent` and in one text part:

| Field | Description |
| --- | --- |
| `query` | The trimmed query. |
| `returned` | The number of definitions in `tools`. |
| `matched` | The number of tools that match the query. |
| `truncated` | `true` when `returned` is smaller than `matched`. |
| `tools` | The matching tool definitions, in ranked order. |

### `run_tool`

Listed in `search` mode only.

| Argument | Type | Description |
| --- | --- | --- |
| `tool` | object | Required. `upstreamId` and `originalName`, copied from a definition's `_meta["com.redis.context-gateway/tool"]`. No other members. |
| `toolArgs` | object | The tool's arguments, as its input schema describes. |

The result is the tool's result.

### Result handle tools

Listed in both modes when result handles are on for the Gateway.

| Tool | Arguments | Result |
| --- | --- | --- |
| `run_tool_as_handle` | `full` mode: `name` and `toolArgs`. `search` mode: `tool` and `toolArgs`, as `run_tool` takes them. | A stub for the held result, or the result whole when it cannot be held. |
| `page_results` | `handle`, `offset` (default `0`), `limit` | For a collection, items from `offset`, `limit` 1 to 100, default 10. For text, bytes, `limit` up to 16384, default 4096. |
| `query_results` | `handle`, `jsonpath`, `offset`, `limit` 1 to 100, default 20 | The matches of a JSONPath expression over the held result, in pages. |
| `count_results` | `handle`, and `jsonpath` or `groupBy` | The number of items, of selected nodes, or of items for each value of one field. |
| `aggregate_results` | `handle`, `jsonpath` | `count`, `sum`, `min`, `max`, and `avg` of the selected numbers, and `ignored` for values that are not numbers. |
| `describe_result` | `handle` | The held result's description without its preview. |
| `release_results` | `handle` | Deletes the held result before its time to live (TTL) ends. |

A handle is `h_` followed by 32 hexadecimal digits. A JSONPath expression follows RFC 9535, starts with `$`, is at most 1 kibibyte (KiB), and cannot use the descendant segment `..`.

## Metadata keys

The Gateway adds these entries to `_meta`. Read them by key, and ignore members you do not know.

| Key | Where | Members |
| --- | --- | --- |
| `com.redis.context-gateway/tool` | Each tool definition | `upstreamId`, `originalName`, and the catalog revision |
| `com.redis.context-gateway/invocation` | Each tool result | `resultCache` with `status` `hit` and `ageMs` when the cache answered. `upstream` and `upstreamDurationMs` when the call reached the Upstream. |
| `com.redis.context-gateway/handle` | A handle stub | The handle and its description, without the preview and the next call |
| `com.redis.context-gateway/failure` | A tool result with its error flag set | `schemaVersion`, `reason`, `completion`, and when the failure happened at the Upstream, `stage` and `upstreamCode` |

## Errors

A failure reaches the client in one of two ways.

### JSON-RPC errors

These failures happen before any call to an Upstream. The JSON-RPC `error.data` holds `schemaVersion`, `reason`, and `traceId`.

| Code | `reason` | Cause |
| --- | --- | --- |
| `-32602` | `unknown_tool` | The Gateway serves no tool with that name or reference. A disabled Upstream and a tool removed by a catalog change also answer this way. |
| `-32602` | `invalid_request` | The request is not a valid tool call. |
| `-32603` | `gateway_unavailable` | The Gateway could not read its own records. |

### Tool results with an error flag

Every other failure comes back as a tool result with `isError: true` and the failure entry in `_meta`. Act on `reason` and `completion`. The text of the result is written for people and can change in any release. For every reason and how to retry, see [Limits and errors](/content/develop/ai/context-engine/context-gateway/limits.md).
