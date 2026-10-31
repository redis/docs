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

Agents call Redis Context Gateway through its Model Context Protocol (MCP) endpoint, the Data Plane API. Platform teams manage Gateways and Upstreams through the [Control Plane API](/content/operate/iris/context-gateway/self-managed/control-plane-api-reference.md).

For how to connect, see [MCP](/content/develop/ai/context-engine/context-gateway/mcp.md). For limits and recovery, see [Limits and errors](/content/develop/ai/context-engine/context-gateway/limits.md).

## Endpoint

| Item | Value |
| --- | --- |
| Endpoint | `POST <data-plane-base-url>/iris/data/v1/context-gateway/gateways/<gateway-id>/mcp`, the Gateway's `mcpEndpoint` |
| Transport | Streamable HTTP. Responses can be JSON or a server-sent event stream, so send `Accept: application/json, text/event-stream`. |
| Credential | An agent key in `Authorization: Bearer <key>` or `X-Api-Key: <key>`, or an identity provider (IdP) access token in `Authorization: Bearer <token>` |
| Protocol versions | `2026-07-28`, `2025-11-25`, `2025-06-18`, and `2025-03-26` |
| Sign-in metadata | `GET <data-plane-base-url>/.well-known/oauth-protected-resource/iris/data/v1/context-gateway/gateways/<gateway-id>/mcp`, served without a credential when the deployment turns on sign-in |

Before any MCP message, the endpoint answers `401` without a valid credential, `404` for a Gateway that does not exist or belongs to another tenant, and `403` when the credential has no grant for this Gateway, or the Gateway or its tenant is suspended. It answers `503` when the Gateway's records could not be read. Retry with backoff.

## Tools

### Upstream tools

In full mode (`toolExposureMode: FULL`), `tools/list` returns every tool of every enabled Upstream under its qualified name, `<namespace>__<sanitized-tool-name>`. Use the returned name unchanged in `tools/call`. The full name is at most 64 characters and contains only letters, digits, underscores, and hyphens. Each definition keeps the Upstream's input schema, output schema, and annotations. The original name remains available in the tool identity metadata.

### `search_tools`

Listed in search mode only.

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

Listed in search mode only.

| Argument | Type | Description |
| --- | --- | --- |
| `tool` | object | Required. `upstreamId` and `originalName`, copied from a definition's `_meta["com.redis.context-gateway/tool"]`. No other members. |
| `toolArgs` | object | Required. The tool's arguments as an object, `{}` when it takes none. |

The result is the tool's result.

### Handle tools

Listed in both modes when compression is on for the Gateway.

| Tool | Arguments | Result |
| --- | --- | --- |
| `run_tool_as_handle` | full mode: `name` and `toolArgs`. search mode: `tool` and `toolArgs`, as `run_tool` takes them. | A stub for the held result, or a tool error when it cannot be held. It never silently falls back to the whole result. An Upstream's own tool error is returned as that error. |
| `page_results` | `handle`, `offset` (default `0`), `limit` | For a collection, items from `offset`, `limit` 1 to 100, default 10. For text, bytes, `limit` up to 16384, default 4096. |
| `query_results` | `handle`, `jsonpath`, `offset`, `limit` 1 to 100, default 20 | The matches of a JSONPath expression over the held result, in pages. |
| `count_results` | `handle`, optional `jsonpath` and `groupBy` | Counts captured items or selected nodes. With both arguments, selects nodes first, then groups them by the field. |
| `aggregate_results` | `handle`, `jsonpath` | `count`, `sum`, `min`, `max`, and `avg` of the selected numbers, and `ignored` for values that are not numbers. |
| `describe_result` | `handle` | The held result's description without its preview. |
| `release_results` | `handle` | Deletes the held result before its time to live (TTL) ends. |

A handle is `h_` followed by 32 hexadecimal digits. A JSONPath expression follows RFC 9535, starts with `$`, is at most 1 kibibyte (KiB), and cannot use the descendant segment `..`.

`groupBy` names one field within each item. For example, `state`, `/state`, and `$.state` name the same field, and `user.login` or `/user/login` names a nested field. A grouped response includes `groups`, `distinct`, and `missing`. When the response limit omits groups, check `groupsOmitted` and `groupsWarning` before treating the listed groups as exhaustive.

Eligible Context Surface filter and text queries can capture continuation pages. Row, byte, time, and concurrent-capture limits can stop collection early. Semantic and hybrid top-K results are not continued. Check `completeness`, `over`, and `warning` in the handle description and operation results. A count or aggregate describes the captured rows, not records that were never captured.

Ordinary automatic capture can return the original inline result when it cannot store a handle. An explicit `run_tool_as_handle` request instead returns a tool error. Release unused handles or narrow the query before requesting another one. Check `completion` first: an explicit capture failure marked `dispatched` means the tool already ran, so retrying a mutating tool can repeat its effect.

The released CLI `redis-iris==1.0.0b2` accepts either `--jsonpath` or `--group-by` for its count command, but not both. Use a direct MCP call for combined selection and grouping.

## Metadata keys

The Gateway adds these entries to `_meta`. Read them by key, and ignore members you do not know.

| Key | Where | Members |
| --- | --- | --- |
| `com.redis.context-gateway/tool` | Each tool definition | `upstreamId`, `originalName`, and the catalog revision |
| `com.redis.context-gateway/invocation` | Each tool result | `schemaVersion` and `traceId`. `tool` and `catalogRevision` only when an Upstream tool was resolved, not for discovery calls or unresolved targets. `cache` (`status` `hit`, `ageMs`) on a cache hit. `upstream` (`serverName`, `serverVersion`) when known. `upstreamDurationMs` when the call reached the Upstream. |
| `com.redis.context-gateway/handle` | A handle stub | The handle and its description, without the preview and the next call |
| `com.redis.context-gateway/failure` | A tool result with its error flag set | `schemaVersion`, `reason`, `completion`, optional `handleOutcome` for capture failures, and when the failure happened at the Upstream, `stage` and `upstreamCode` |

## Errors

A failure reaches the client in one of two ways.

### JSON-RPC errors

These failures happen before any call to an Upstream. The JSON-RPC `error.data` holds `schemaVersion`, `reason`, and `traceId`.

| Code | `reason` | Cause |
| --- | --- | --- |
| `-32602` | `unknown_tool` | A direct `tools/call` names a tool the Gateway does not expose. List tools again and use a returned name. |
| `-32602` | `invalid_request` | The request is not a valid tool call. |
| `-32603` | `gateway_unavailable` | The Gateway could not read its own records. |

### Tool results with an error flag

An unknown or inaccessible target passed to `run_tool` or `run_tool_as_handle` returns a tool result with `isError: true`, `reason: unknown_tool`, and `completion: not_dispatched`. Other tool failures also return an error result and the failure entry in `_meta`. In the Python MCP SDK, inspect `result.is_error`. Act on `reason` and `completion`. The text of the result is written for people and can change in any release. For every reason and how to retry, see [Limits and errors](/content/develop/ai/context-engine/context-gateway/limits.md).
