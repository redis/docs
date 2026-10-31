---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Find tool and result limits, tool call failure reasons, Control Plane error types, conflicts, and retry guidance.
hideListLinks: true
linktitle: Limits and errors
title: Redis Context Gateway limits and errors
weight: 90
---

Check these limits and error types when you handle a failed request or a tool result that did not come from the Upstream. Confirm deployment settings with your administrator.

The [API reference](/content/develop/ai/context-engine/context-gateway/api-reference.md) defines the Model Context Protocol (MCP) tools and their arguments. The [Control Plane API reference](/content/operate/iris/context-gateway/self-managed/control-plane-api-reference.md) defines Control Plane field formats.

## Tool and result limits

| Item | Limit or default |
| --- | --- |
| Gateway and Upstream display name | 1 to 128 characters, with visible content and no control characters or line breaks |
| Gateway and Upstream IDs | Server-generated `gw_` and `up_` prefixes followed by 32 lowercase hexadecimal characters. Copy returned IDs rather than constructing them. |
| Upstream namespace | 1 to 32 lowercase letters and digits, with single hyphens between them |
| Gateway `databaseId` | 1 to 32 letters, digits, and hyphens |
| `search_tools` query | 1 to 200 characters. `limit` 1 to 100, default 5. |
| Cache time to live (TTL) (`cache.ttlSeconds`) | 1 to 86400 seconds |
| Compression threshold | Results over 32 kibibytes (KiB) become handles when the deployment turns handles on. |
| Largest result a handle holds | 8 mebibytes (MiB) by default. Automatic capture can fall back inline. Explicit capture returns a tool error if it cannot hold the result. |
| Handle lifetime | 15 minutes by default, at most 24 hours. A tool policy can set 1 to 86400 seconds. |
| Handle preview | The first 3 items or 2 KiB |
| Context Surface data model | 1 MiB of JSON |
| Context Surface tool results | Up to 100 records per page. Eligible filter/text captures can collect multiple pages, up to 10,000 rows by default, subject to byte and time limits. Semantic/hybrid top-K results are not continued. |
| Agent key revocation | Takes effect within the Identity Service cache lifetime, 300 seconds by default. |

## Handle tool call failures

A failed call reaches the client as a JSON-RPC error or as a tool result with its error flag set. Act on the `reason`, never on the message or the text: those are written for people and can change in any release.

### JSON-RPC errors

These happen before any call to an Upstream. `error.data` holds `reason` and a `traceId` to give operators.

| Code | `reason` | Meaning |
| --- | --- | --- |
| `-32602` | `unknown_tool` | A direct `tools/call` names a tool the Gateway does not expose. List tools again and use a returned name. |
| `-32602` | `invalid_request` | The request is not a valid tool call. |
| `-32603` | `gateway_unavailable` | The Gateway could not read its own records. |

### Tool results with an error flag

The failure entry in `_meta["com.redis.context-gateway/failure"]` holds `reason` and `completion`. When the failure happened at the Upstream, it also holds `stage` and, for an Upstream JSON-RPC error, `upstreamCode`.

| `reason` | Meaning |
| --- | --- |
| `unknown_tool` | A `run_tool` or `run_tool_as_handle` target is unknown or inaccessible. The call was `not_dispatched`. |
| `invalid_arguments` | The arguments do not match the tool's input schema. |
| `upstream_unavailable` | The Gateway could not reach the Upstream. |
| `upstream_credentials_unavailable` | The Gateway could not read the Upstream's credential from the secrets backend. |
| `upstream_rejected_credentials` | The Upstream refused the credential the Gateway sent. |
| `upstream_permission_denied` | The Upstream accepted the credential but refused the call. |
| `upstream_error` | The Upstream returned an error. |
| `unsupported_upstream_result` | The Upstream returned a result the Gateway cannot pass on. |
| `timeout` | The call did not finish in time. |
| `connection_lost` | The connection to the Upstream closed during the call. |
| `unknown_handle` | The handle expired, was released, or belongs to another caller. |
| `handle_storage_full` | An explicit capture could not store a handle because of a memory admission limit or an out-of-memory response. Release handles, narrow the query, or increase capacity. |
| `handle_not_created` | An explicit capture could not create a handle for another reason, such as result size, format, or policy. Inspect `handleOutcome` and the explanation. |
| `gateway_unavailable` | A handle tool could not read the Gateway database. |
| `embedding_unavailable` | A Context Surface semantic or hybrid search tool could not reach its embedding service. |

| `completion` | Meaning | Retry |
| --- | --- | --- |
| `not_dispatched` | The Gateway did not send the call to the Upstream. | Safe to retry after you fix the cause. |
| `dispatched` | The tool ran, but its result could not be stored as the requested handle. | Do not blindly repeat a tool that changes data. Check the completed operation before deciding whether another call is safe. |
| `unknown` | The Upstream might have run the call. | Check the Upstream's state before you retry a call that changes data. |

Explicit capture failures include `handleOutcome` with the storage or policy outcome. Their `completion` is `dispatched` when the tool ran, or `not_dispatched` when the Gateway answered from its cache. No handle does not mean that the tool did no work.

With the Python MCP SDK, inspect the error flag before using a result. For example, after `result = await session.call_tool(name, arguments)`:

```python
if result.is_error:
    metadata = result.meta or {}
    failure = metadata.get("com.redis.context-gateway/failure", {})
    print(failure.get("reason"), failure.get("completion"))
else:
    print(result.structured_content)
```

Catch JSON-RPC failures separately. They are protocol exceptions rather than tool results. See the complete connection example in the [quickstart](/content/develop/ai/context-engine/context-gateway/quickstart.md).

A result the cache answered carries `cache` with `status` `hit` and `ageMs` in `_meta["com.redis.context-gateway/invocation"]`. Its absence does not prove that an Upstream call ran: validation or authorization may have refused the call first.

## Handle request errors

Control Plane errors are problem details. Act on the HTTP status, the problem `type`, and the `errors[]` entries. Each entry identifies a body member with a JSON Pointer in `pointer`, or a path/query argument with `parameter`, and explains the issue in `detail`. Do not parse human-readable details into error codes.

| Status | Problem types | Action |
| --- | --- | --- |
| `400` | `/errors/invalid-data` | Correct the members named in `errors[]`. |
| `401` | `/errors/authentication-failed` | Check the admin token. An agent key is not accepted here. |
| `403` | `/errors/insufficient-permissions` | Use a credential that can administer Gateways. |
| `404` | `/errors/gateway-not-found`, `/errors/upstream-not-found` | Check identifiers. A Gateway or Upstream being deleted reads as not found. |
| `408` | `/errors/timeout` | Read the resource before you repeat a write. |
| `409` | See [Resolve conflicts](#resolve-conflicts). | Read the current state before you repeat the request. |
| `412` | `/errors/revision-conflict` | Read the resource again, then retry with its current revision. |
| `413` | `/errors/payload-too-large` | Reduce the request size before retrying. |
| `422` | `/errors/resource-unavailable` | Updating or refreshing an Upstream found its database or credential unusable. Check the referenced database or credential. |
| `423` | `/errors/resource-suspended` | The Gateway or its tenant is suspended. Ask your administrator to check its state. |
| `424` | `/errors/resource-unavailable`, `/errors/database-out-of-memory` | A dependency failed, such as the Upstream or the Gateway database. |
| `500` | `/errors/unexpected-error` | Keep the trace identifier and report persistent failures. |
| `503` | `/errors/service-unavailable` | Check readiness and retry with bounded backoff. |

## Resolve conflicts

Updates and deletes take the resource's current `revision` as `expectedRevision`. Treat revisions as opaque values. A stale revision returns `412` with `/errors/revision-conflict`. Read the resource again before retrying, rather than replaying the same write. Other state conflicts return `409`:

| Problem type | Action |
| --- | --- |
| `/errors/namespace-conflict` | Another Upstream of the Gateway uses the namespace. Choose another one. |
| `/errors/gateway-not-empty` | Delete the Gateway's Upstreams before you delete the Gateway. |
| `/errors/catalog-publication-conflict` | The Upstream changed while its tools were discovered, so nothing was published. Refresh the catalog again. |

## Retry uncertain operations

Use bounded retries for reads and for tool calls that report `not_dispatched`. A `dispatched` explicit-capture failure means the tool already ran even though no handle was created. Do not retry a mutating tool just to obtain a handle. A timeout on a Control Plane write does not prove the write failed. Read the Gateway or Upstream before you repeat it.

A delete that stopped partway leaves the Upstream marked for deletion, and reads report it as not found. Repeat the delete with the Upstream ID to finish it.
