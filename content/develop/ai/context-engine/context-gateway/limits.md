---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Find tool and result limits, tool call failure reasons, Control Plane error types, conflicts, and retry guidance.
hideListLinks: true
linktitle: Limits and errors
title: Limits and errors
weight: 90
---

Use this page to check limits, interpret errors, and recover from failed or interrupted operations. A failed response does not by itself establish whether an operation ran.

The [MCP API Reference](/content/develop/ai/context-engine/context-gateway/api-reference.md) defines Model Context Protocol (MCP) tools, arguments, and metadata. The [Control Plane API Reference](/content/operate/iris/context-gateway/self-managed/control-plane-api-reference.md) defines administration requests and field formats.

## Limits and configurable defaults {#tool-and-result-limits}

Fixed limits are enforced by the API. Deployment defaults can be changed by your administrator. Request options and tool policies apply within their documented ranges. Confirm your deployment's settings before relying on a default.

### Resource fields and naming

| Item | Fixed constraint |
| --- | --- |
| Gateway and Upstream `name` | 1 to 128 characters, with visible content and no control characters or line breaks. |
| Gateway and Upstream IDs | Server-generated `gw_` and `up_` prefixes followed by 32 lowercase hexadecimal characters. Copy returned IDs rather than constructing them. |
| Upstream namespace | 1 to 32 lowercase letters and digits, with single hyphens between them. |
| Gateway `databaseId` | 1 to 32 letters, digits, and hyphens. |

### Tool discovery

| Item | Fixed limit | Request default |
| --- | --- | --- |
| `search_tools` query | 1 to 200 characters. | Required. |
| `search_tools` result limit | 1 to 100. | `5`. |

Discovery can also stop at the response-size cap. When `truncated` is true, narrow the query. Raising `limit` only helps when the number returned reached that limit. See [Handle truncated discovery results](/content/develop/ai/context-engine/context-gateway/mcp.md#handle-truncated-discovery-results).

### Caching and stored results

| Setting | Default or limit | Configuration |
| --- | --- | --- |
| Cache time to live (TTL) | 1 to 86400 seconds. | Per-tool `cache.ttlSeconds`. |
| Automatic capture threshold | 32 kibibytes (KiB) by default. | Deployment setting `compression.inline_max_bytes`. |
| Maximum captured result size | 8 mebibytes (MiB) by default. | Deployment setting `compression.max_capture_bytes`. |
| Handle lifetime | 15 minutes by default, at most 24 hours. | Deployment setting `compression.ttl`. A tool policy can override it with 1 to 86400 seconds. |
| Handle preview | First 3 items, bounded by 2 KiB by default. | Deployment settings `compression.preview_items` and `compression.preview_bytes`. |

Exceeding the capture threshold does not guarantee a handle. Capture also depends on deployment and Gateway compression settings, tool policy, result eligibility, and storage availability. Automatic capture can fall back to the complete inline result. Explicit capture through `run_tool_as_handle` returns a tool error if it cannot create a handle, even if the source tool already ran.

See [compression configuration](/content/operate/iris/context-gateway/self-managed/configuration.md) and [Work with stored results](/content/develop/ai/context-engine/context-gateway/mcp.md#work-with-stored-results).

### Context Surfaces

| Item | Limit or default | Behavior |
| --- | --- | --- |
| Data model | Fixed maximum of 1 MiB of JSON. | Reduce the model before submitting it. |
| Tool result page | Up to 100 records. | One page may not include every matching record. |
| Records collected for a handle | 10,000 rows by default, configurable through `compression.max_surface_items`. | Eligible filter/text captures can continue across pages, subject to byte and time limits. Semantic/hybrid top-K results are not continued. |

A successful search or capture can still be incomplete. Inspect `completeness`, `over`, and `warning` before treating counts of captured rows as totals for the source. Paging a handle does not retrieve records that were never captured. See [stored-result interpretation](/content/develop/ai/context-engine/context-gateway/mcp.md#inspect-retrieve-and-release).

Background indexing can also make search results incomplete. See [Allow indexing to finish](/content/develop/ai/context-engine/context-gateway/manage-context-surfaces.md#allow-indexing-to-finish).

### Agent key revocation

Revocation takes effect within the Identity Service cache lifetime, which is 300 seconds by default. Confirm that deployment setting with your administrator when planning key rotation or revocation.

## MCP failures and safe retries {#tool-call-failures}

First identify the response type. HTTP connection or authentication failures can prevent an MCP response entirely. See [MCP troubleshooting](/content/develop/ai/context-engine/context-gateway/mcp.md#troubleshoot-the-connection) for those failures. Within MCP, a failed call can be a JSON-RPC error or a tool result with its error flag set.

Use machine-readable `reason` values to handle failures. Messages and result text explain the problem for people and can change between releases.

### Decide whether a retry is safe

Tool failure metadata is in `_meta["com.redis.context-gateway/failure"]`. Its `completion` field describes whether the Gateway dispatched the call:

| `completion` | Meaning | Retry guidance |
| --- | --- | --- |
| `not_dispatched` | No new call was sent to the Upstream. This can also describe a capture failure for an existing cached result. | After resolving the cause, use bounded retries. A retry can still invoke the Upstream if the cached result is no longer available. |
| `dispatched` | The tool ran, but its result could not be stored as the requested handle. | Do not repeat a mutating tool just to obtain a handle. Check the completed operation first. |
| `unknown` | The Upstream might have run the call. | Read back state before retrying a mutating tool. A read-only call can be retried with bounded backoff. |

Explicit-capture failures include `handleOutcome`, which identifies the storage or policy outcome. Their `completion` is `dispatched` when the tool ran, or `not_dispatched` when the Gateway answered from its cache. No handle does not mean no result existed or no work was done.

A cache hit is reported by `cache.status: hit` and `cache.ageMs` in `_meta["com.redis.context-gateway/invocation"]`. Missing cache-hit metadata does not prove execution either: validation or authorization may have stopped the call first.

If completion is missing or uncertain, do not assume a mutating call is safe to repeat. Follow [Retry uncertain operations](#retry-uncertain-operations).

### JSON-RPC errors

These happen before any call to an Upstream. `error.data` holds `reason` and a `traceId` to give operators.

| Code | `reason` | Meaning |
| --- | --- | --- |
| `-32602` | `unknown_tool` | A direct `tools/call` names a tool the Gateway does not expose. List tools again and use a returned name. |
| `-32602` | `invalid_request` | The request is not a valid tool call. Correct the request before retrying. |
| `-32603` | `gateway_unavailable` | The Gateway could not read its own records. Retry with bounded backoff. |

### Tool results with an error flag

The failure metadata contains `reason` and `completion`. For an Upstream failure, it also contains `stage` and, for an Upstream JSON-RPC error, `upstreamCode`. Give operators the `traceId` from `_meta["com.redis.context-gateway/invocation"]` when investigating a tool failure.

| `reason` | Meaning | Recovery |
| --- | --- | --- |
| `unknown_tool` | A `run_tool` or `run_tool_as_handle` target is unknown or inaccessible. The call was `not_dispatched`. | Discover tools again and copy the returned identity. |
| `invalid_arguments` | The arguments do not match the input schema of a Gateway tool or a Context Surface tool. MCP Upstream arguments pass through to the server. | Inspect the discovered input schema and correct the arguments. |
| `upstream_unavailable` | The Gateway could not reach the Upstream. | Check Upstream availability and `completion` before retrying. |
| `upstream_credentials_unavailable` | The Gateway could not read the Upstream's credential from the secrets backend. | Ask your administrator to check the secrets backend and stored credential. |
| `upstream_rejected_credentials` | The Upstream refused the credential the Gateway sent. | Ask your administrator to correct the Upstream credential. |
| `upstream_permission_denied` | The Upstream accepted the credential but refused the call. | Check the permissions of the credential used by the Upstream. |
| `upstream_error` | The Upstream returned an error. | Inspect `stage` and `upstreamCode` when present. Resolve the reported cause before retrying. |
| `unsupported_upstream_result` | The Upstream returned a result the Gateway cannot pass on. | Ask the Upstream owner to check its MCP response format. Check completion before repeating the call. |
| `timeout` | The call did not finish in time. | Treat execution as uncertain unless completion establishes otherwise. Read back state before repeating a mutating call. |
| `connection_lost` | The connection to the Upstream closed during the call. | Check completion and read back state before repeating a mutating call. |
| `unknown_handle` | The handle expired, was released, or belongs to another caller. | Call the source tool again only when safe. Another caller cannot use the handle. |
| `handle_storage_full` | An explicit capture could not store a handle because of a memory admission limit or an out-of-memory response. Release handles, narrow the query, or increase capacity. | Check `completion` before requesting capture again. |
| `handle_not_created` | An explicit capture could not create a handle for another reason, such as result size, format, or policy. Inspect `handleOutcome` and the explanation. | Resolve the capture problem and check `completion` before requesting capture again. |
| `gateway_unavailable` | A handle tool could not read the Gateway database. | Retry the read with bounded backoff. Ask your administrator to check the Gateway database if failures persist. |
| `embedding_unavailable` | A Context Surface semantic or hybrid search tool could not reach its embedding service. | Ask your administrator to check the embedding service before retrying the search. |

### Read raw Python MCP errors

With a direct Python MCP session, inspect the error flag before using result data. For example, after `result = await session.call_tool(name, arguments)`:

```python
if result.is_error:
    metadata = result.meta or {}
    failure = metadata.get("com.redis.context-gateway/failure", {})
    print(failure.get("reason"), failure.get("completion"))
else:
    print(result.structured_content)
```

Catch JSON-RPC failures separately. They are protocol exceptions rather than tool results. See [Open a Python MCP session](/content/develop/ai/context-engine/context-gateway/mcp.md#connect-a-client). Transport failures are also separate from tool results.

## Python client error handling {#python-client-errors}

With `redis_iris.ContextGateway`, `call()` returns a `ToolResult` for a successful response or a tool error that is not marked `not_dispatched`. A Gateway tool error marked `not_dispatched` raises `ToolError`, including an explicit-capture failure for a cached result. Rejected credentials or a missing Gateway raise `ConfigurationError`. Protocol failures, network failures, and timeouts can raise other exceptions.

After creating `gateway` and discovering a tool, handle these cases separately:

```python
from redis_iris.errors import ConfigurationError, ToolError

try:
    result = gateway.call(tool_name, arguments)
except ConfigurationError as error:
    print("Check the Gateway endpoint and credentials:", error)
except ToolError as error:
    print("The Gateway did not dispatch the call:", error.reason)
else:
    if result.is_error:
        failure = result.meta.get("com.redis.context-gateway/failure", {})
        print(failure.get("reason"), failure.get("completion"), result.as_text())
    else:
        print(result.data)
```

A raw session obtained through `gateway.client.connect()` returns MCP result objects instead. Use `is_error`, `structured_content`, and `meta` as in the raw-session example. Keep transport and protocol exceptions separate from successful responses with an error flag.

Do not infer retry safety from the exception class alone when completion is uncertain. Follow [Retry uncertain operations](#retry-uncertain-operations).

## Control Plane API errors {#control-plane-errors}

Control Plane errors are problem details. Act on the HTTP status, the problem `type`, and the `errors[]` entries. Each entry identifies a body member with a JSON Pointer in `pointer`, or a path/query argument with `parameter`, and explains the issue in `detail`. Do not parse human-readable details into error codes.

| Status | Problem types | Action |
| --- | --- | --- |
| `400` | `/errors/invalid-data` | Correct the members named in `errors[]`. |
| `401` | `/errors/authentication-failed` | Check the admin token. An agent key is not accepted here. |
| `403` | `/errors/insufficient-permissions` | Use a credential that can administer Gateways. |
| `404` | `/errors/gateway-not-found`, `/errors/upstream-not-found` | Check identifiers. A Gateway or Upstream being deleted reads as not found. |
| `408` | `/errors/timeout` | Read the resource before you repeat a write. |
| `409` | See [Resolve conflicts](#resolve-conflicts). | Read the current state before you repeat the request. |
| `412` | `/errors/revision-conflict` | Fetch the current state, reconcile your intended change, then submit it with the current revision. |
| `413` | `/errors/payload-too-large` | Reduce the request size before retrying. |
| `422` | `/errors/resource-unavailable` | Updating or refreshing an Upstream found its database or credential unusable. Check the referenced database or credential. |
| `423` | `/errors/resource-suspended` | The Gateway or its tenant is suspended. Ask your administrator to check its state. |
| `424` | `/errors/resource-unavailable`, `/errors/database-out-of-memory` | A dependency failed, such as the Upstream or the Gateway database. |
| `500` | `/errors/unexpected-error` | Keep the trace identifier and report persistent failures. |
| `503` | `/errors/service-unavailable` | Check readiness. Retry reads with bounded backoff. For writes, [read back state before retrying](#recover-an-uncertain-control-plane-write). |

### Resolve conflicts

Updates and deletes take the resource's current `revision` as `expectedRevision`. Treat revisions as opaque values. A stale revision returns `412` with `/errors/revision-conflict`. Fetch the current state and reconcile your intended change before resubmitting it with the current revision. Substituting a new revision into an unchanged request can overwrite another update. Other state conflicts return `409`:

| Problem type | Action |
| --- | --- |
| `/errors/namespace-conflict` | Another Upstream of the Gateway uses the namespace. Choose another one. |
| `/errors/gateway-not-empty` | Delete the Gateway's Upstreams before you delete the Gateway. |
| `/errors/catalog-publication-conflict` | The Upstream changed while its tools were discovered, so nothing was published. Refresh the catalog again. |
| `/errors/gateway-mutation-in-progress` | Another change to the Gateway's database binding is running. Retry after it completes. |
| `/errors/surface-mutation-in-progress` | Another change to the Surface is running. Retry after it completes. |
| `/errors/gateway-deleting` | The Gateway is being deleted and accepts no other change. |

## Retry uncertain operations

Use bounded retries with backoff for reads and for tool calls that report `not_dispatched`, after correcting the cause. Read-only tool calls can be repeated without duplicating a mutation. For a mutating tool with `dispatched`, `unknown`, or missing completion, inspect the Upstream's state before deciding whether another call is safe.

A `dispatched` explicit-capture failure means the tool already ran even though no handle was created. Do not retry a mutating tool solely to obtain a handle.

### Recover an uncertain Control Plane write

A timeout or lost response does not prove that a write failed:

1. Read the Gateway or Upstream's current state.
2. Check whether the intended change already took effect.
3. If another write is needed, reconcile it with the current state and use the current revision.

Do not blindly replay the original write or replace only its revision.

### Resume an interrupted Upstream delete

A delete that stops partway can leave the Upstream marked for deletion while cleanup remains unfinished. Reads then return `404`, which does not establish that cleanup completed.

Repeat the delete with the same Upstream ID to finish it. See [Delete an Upstream](/content/develop/ai/context-engine/context-gateway/manage-gateways.md#delete-an-upstream-or-a-gateway) and [Context Surface index cleanup](/content/develop/ai/context-engine/context-gateway/manage-context-surfaces.md#if-index-cleanup-fails).
