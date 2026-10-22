---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Find tool call failure reasons, Control Plane error types, result cache behavior, and retry guidance.
hideListLinks: true
linktitle: Limits and errors
title: Context Gateway limits and errors
weight: 90
---

Check these limits and error types when you handle a failed request or a tool result that did not come from the Upstream. Confirm deployment settings with your administrator.

The [Control Plane API reference](/content/operate/iris/context-gateway/self-managed/control-plane-api-reference.md) defines field formats and operation-specific schemas.

## Limits

| Item | Limit or default |
| --- | --- |
| Result handle threshold | Results over 32 kibibytes (KiB) become handles when handles are on. |
| Result handle lifetime | 15 minutes by default, or until the agent releases the handle. |
| Agent key revocation | Takes effect within the Identity Service cache lifetime, 300 seconds by default. |
| Context Surface tool results | Up to 100 records per call. A result handle over a larger answer holds one page and is marked partial. |

<!-- TODO: Add namespace, tool count, request size, and catalog limits from the control-plane contract. -->

## Handle tool call failures

A tool call that fails returns a tool result with its error flag set, and failure metadata in `_meta["com.redis.context-gateway/failure"]`. Act on `reason` and `completion`. Do not parse the text of a failed result: it is written for people and can change in any release.

| `reason` | Meaning |
| --- | --- |
| `unknown_tool` | The Gateway serves no tool with that name or reference. |
| `invalid_arguments` | The arguments do not match the tool's input schema. |
| `invalid_request` | The request is not a valid tool call. |
| `upstream_unavailable` | The Gateway could not reach the Upstream. |
| `upstream_credentials_unavailable` | The Gateway could not read the Upstream's credential from the secrets backend. |
| `upstream_rejected_credentials` | The Upstream refused the credential the Gateway sent. |
| `upstream_permission_denied` | The Upstream accepted the credential but refused the call. |
| `upstream_error` | The Upstream returned an error. |
| `unsupported_upstream_result` | The Upstream returned a result the Gateway cannot pass on. |
| `timeout` | The call did not finish in time. |
| `connection_lost` | The connection to the Upstream closed during the call. |
| `gateway_unavailable` | The Gateway could not read its own configuration. |
| `unknown_handle` | The handle expired, was released, or belongs to another caller. |
| `embedding_unavailable` | Semantic search could not reach its embedding provider. |

*Example set `iris_gateway_limits`, step `gateway-error-reason`, in Python (Iris) and cURL (Iris): read `reason` and `completion` from a failed call.*

| `completion` | Meaning | Retry |
| --- | --- | --- |
| `not_dispatched` | The Gateway did not send the call to the Upstream. | Safe to retry after you fix the cause. |
| `unknown` | The Upstream might have run the call. | Check the Upstream's state before you retry a call that changes data. |

## Handle Control Plane errors

Control Plane errors are problem details. Act on the HTTP status, the problem `type`, and the `fields[]` paths, not on `detail`.

<!-- TODO: Check each action against the operation descriptions in the control-plane OpenAPI, especially 403, 422, and 423. -->

| Status | Problem types | Action |
| --- | --- | --- |
| `400` | `/errors/invalid-data` | Correct the fields named in `fields[]`. |
| `401` | `/errors/authentication-failed` | Check the admin token. An agent key is not accepted here. |
| `403` | `/errors/insufficient-permissions` | Use a credential that can administer Gateways. |
| `404` | `/errors/gateway-not-found`, `/errors/upstream-not-found` | Check identifiers. A Gateway being deleted reads as not found. |
| `408` | `/errors/timeout` | Read the resource before you repeat a write. |
| `409` | `/errors/revision-conflict`, `/errors/namespace-conflict`, `/errors/gateway-not-empty`, `/errors/catalog-publication-conflict` | Read the current state, then repeat with its revision, another namespace, or after deleting the Gateway's Upstreams. |
| `422` | `/errors/resource-unavailable` | Check that the referenced database or credential exists. |
| `423` | `/errors/resource-suspended` | Ask your administrator to check the resource's state. |
| `424` | `/errors/resource-unavailable`, `/errors/database-out-of-memory` | Check the dependency, such as the Upstream or the Gateway database. |
| `500` | `/errors/unexpected-error` | Keep the trace identifier and report persistent failures. |
| `503` | `/errors/service-unavailable` | Check readiness and retry with bounded backoff. |

## Understand cached results

A cached result carries `resultCache` with `status` and `ageMs` in its invocation metadata. A result without `resultCache` came from the Upstream.

| Bypass reason | What to check |
| --- | --- |
| `not_opted_in` | The tool has no result cache policy. |
| `no_database` | The Gateway has no `databaseId`. |
| `unknown_database` | The Gateway's database is not registered on the Data Plane. |
| `vetoed_by_annotation` | The tool's definition says it is not read-only, or that it is destructive. |
| `caller_credentials` | The Upstream's credential could depend on the caller. |
| `uncanonical_arguments` | The arguments repeat a member, are not valid UTF-8, or nest too deep. |
| `unreadable_policy` | The Data Plane is older than the release that wrote the policy. Upgrade it. |

## Retry uncertain operations

Use bounded retries for reads and for tool calls that report `not_dispatched`. A timeout on a Control Plane write does not prove the write failed. Read the Gateway or Upstream before you repeat it.
