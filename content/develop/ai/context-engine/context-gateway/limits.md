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
| Gateway and Upstream display name | 1 to 200 characters |
| Upstream namespace | 1 to 63 lowercase letters and digits, with single hyphens between them |
| Gateway `databaseId` | 1 to 32 letters, digits, and hyphens |
| `search_tools` query | 1 to 200 characters. `limit` 1 to 100, default 5. |
| Result cache time to live (TTL) (`resultCache.ttlSeconds`) | 1 to 86400 seconds |
| Result handle threshold | Results over 32 kibibytes (KiB) become handles when the deployment turns handles on. |
| Largest result a handle holds | 8 mebibytes (MiB). A larger result comes back whole. |
| Result handle lifetime | 15 minutes by default, at most 24 hours. A tool policy can set 1 to 86400 seconds. |
| Handle preview | The first 3 items or 2 KiB |
| Context Surface data model | 1 MiB of JSON |
| Context Surface tool results | Up to 100 records per call. A handle over a larger answer holds one page and is marked partial. |
| Agent key revocation | Takes effect within the Identity Service cache lifetime, 300 seconds by default. |

## Handle tool call failures

A failed call reaches the client as a JSON-RPC error or as a tool result with its error flag set. Act on the `reason`, never on the message or the text: those are written for people and can change in any release.

### JSON-RPC errors

These happen before any call to an Upstream. `error.data` holds `reason` and a `traceId` to give operators.

| Code | `reason` | Meaning |
| --- | --- | --- |
| `-32602` | `unknown_tool` | The Gateway serves no tool with that name or reference. A disabled Upstream and a tool removed by a catalog change also answer this way. |
| `-32602` | `invalid_request` | The request is not a valid tool call. |
| `-32603` | `gateway_unavailable` | The Gateway could not read its own records. |

### Tool results with an error flag

The failure entry in `_meta["com.redis.context-gateway/failure"]` holds `reason` and `completion`. When the failure happened at the Upstream, it also holds `stage` and, for an Upstream JSON-RPC error, `upstreamCode`.

| `reason` | Meaning |
| --- | --- |
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
| `gateway_unavailable` | A handle tool could not read the Gateway database. |
| `embedding_unavailable` | A Context Surface semantic or hybrid search tool could not reach its embedding service. |

| `completion` | Meaning | Retry |
| --- | --- | --- |
| `not_dispatched` | The Gateway did not send the call to the Upstream. | Safe to retry after you fix the cause. |
| `unknown` | The Upstream might have run the call. | Check the Upstream's state before you retry a call that changes data. |

*Example set `iris_gateway_limits`, steps `gateway-error-reason` and `gateway-error-jsonrpc`, in Python (Iris) and cURL (Iris): read the reason from a failed tool result and from a JSON-RPC error.*

A result the cache answered carries `resultCache` with `status` `hit` and `ageMs` in `_meta["com.redis.context-gateway/invocation"]`. A result without it came from the Upstream.

## Handle request errors

Control Plane errors are problem details. Act on the HTTP status, the problem `type`, and the `fields[]` paths, not on `detail`.

| Status | Problem types | Action |
| --- | --- | --- |
| `400` | `/errors/invalid-data` | Correct the fields named in `fields[]`. |
| `401` | `/errors/authentication-failed` | Check the admin token. An agent key is not accepted here. |
| `403` | `/errors/insufficient-permissions` | Use a credential that can administer Gateways. |
| `404` | `/errors/gateway-not-found`, `/errors/upstream-not-found` | Check identifiers. A Gateway or Upstream being deleted reads as not found. |
| `408` | `/errors/timeout` | Read the resource before you repeat a write. |
| `409` | See [Resolve conflicts](#resolve-conflicts). | Read the current state before you repeat the request. |
| `422` | `/errors/resource-unavailable` | Updating or refreshing an Upstream found its database or credential unusable. Check the referenced database or credential. |
| `423` | `/errors/resource-suspended` | The Gateway or its tenant is suspended. Ask your administrator to check its state. |
| `424` | `/errors/resource-unavailable`, `/errors/database-out-of-memory` | A dependency failed, such as the Upstream or the Gateway database. |
| `500` | `/errors/unexpected-error` | Keep the trace identifier and report persistent failures. |
| `503` | `/errors/service-unavailable` | Check readiness and retry with bounded backoff. |

<!-- TODO: Check each action against the operation descriptions in the Control Plane OpenAPI, especially 403. -->

## Resolve conflicts

Updates and deletes take the resource's current `revision` as `expectedRevision`. A `409` names the conflict:

| Problem type | Action |
| --- | --- |
| `/errors/revision-conflict` | Another change landed first. Read the Gateway or Upstream again, then send your change with its new `revision`. |
| `/errors/namespace-conflict` | Another Upstream of the Gateway uses the namespace. Choose another one. |
| `/errors/gateway-not-empty` | Delete the Gateway's Upstreams before you delete the Gateway. |
| `/errors/catalog-publication-conflict` | The Upstream changed while its tools were discovered, so nothing was published. Refresh the catalog again. |

## Retry uncertain operations

Use bounded retries for reads and for tool calls that report `not_dispatched`. A timeout on a Control Plane write does not prove the write failed. Read the Gateway or Upstream before you repeat it.

A delete that stopped partway leaves the Upstream marked for deletion, and reads report it as not found. Repeat the delete with the Upstream ID to finish it.
