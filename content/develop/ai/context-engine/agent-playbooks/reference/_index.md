---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Find client conventions, MCP tool contracts, public API schemas, and error recovery rules.
hideListLinks: true
linktitle: API and client reference
title: Agent Playbooks API and client reference
weight: 70
---

The data-plane application programming interface (API) manages knowledge; the control-plane API manages playbooks and policies.

## Choose a reference

| Interface | Reference |
|:----------|:----------|
| Data-plane API | [Interactive reference]({{< relref "/develop/ai/context-engine/agent-playbooks/reference/rest-api" >}}) · [OpenAPI document]({{< relref "/develop/ai/context-engine/agent-playbooks/reference/rest-api/" >}}openapi.json) |
| Control-plane API | [Interactive reference]({{< relref "/operate/iris/agent-playbooks/control-plane-api-reference" >}}) · [OpenAPI document]({{< relref "/operate/iris/agent-playbooks/control-plane-api-reference/" >}}openapi.json) |
| Python software development kit (SDK) | `redis-agent-playbook==0.1.0a2` · [Complete examples]({{< relref "/develop/ai/context-engine/agent-playbooks/examples" >}}) |
| Model Context Protocol (MCP) | [Connect an agent]({{< relref "/develop/ai/context-engine/agent-playbooks/connect-agent" >}}) · [Tool contracts](#mcp-tool-contracts) |

The OpenAPI `info.version` identifies the API contract, not the service image or SDK release.

## Use the Python client

Initialize `Playbook` with the data-plane base URL, `playbook_id`, and `api_key`. Direct requests use `Authorization: Bearer <key>`.

| Concept | Python | Direct request or response |
|:--------|:-------|:---------------------------|
| Entry identity | `entry_id`, `entry_key` | `entryId`, `entryKey` |
| Filter | `filter_`, `and_`, `or_` | `filter`, `and`, `or` |
| Pagination | Request `cursor`; response `next_cursor` | Request `cursor`; response `nextCursor` |
| Proposal review | `expected_proposal_revision` | `expectedProposalRevision` |

Continue listing until `nextCursor` is absent, even after an empty page. Concurrent updates can move results. Search and discovery use limits, not cursors.

The [access guide]({{< relref "/operate/iris/agent-playbooks/authentication" >}}) defines `read`, `write`, `publish`, and `propose`. Management callers can inspect unpublished or historical versions; serving operations return current publications.

## MCP tool contracts

The endpoint is `<base-url>/v1/playbooks/<playbook-id>/mcp`. Use Streamable HTTP and a reader key. `tools/list` returns the tool schemas.

| Tool | Arguments | Structured result |
|:-----|:----------|:------------------|
| `discover_entries` | Required `query`; optional `filter`, `pinned_entries`, `limit`. | `pinnedEntries`, `discoveredEntries`, `truncated`, and optional `budgetTruncated`. |
| `load_skill` | `entry_id` and `version` copied from one selected preview. | `entryId`, `version`, and `content` with instructions and resource descriptors. |
| `fetch_resource` | `uri` copied from a tool result. | `uri`, `mimeType`, `digest`, and `text` or base64-encoded `blob`. |

Frequently asked question (FAQ) previews include `question` and `answer`. Skill previews include `name`, `description`, and a file address. Both include `entryId` and `version`; ranked discoveries include `score`.

Check `isError` before reading `structuredContent`. These tools serve only the currently published version, including calls made with a management key. The service also supports MCP `resources/read` for returned file addresses.

## Handle errors

Inspect the status and error `type`. Avoid logging credentials or private content.

| Failure | Action |
|:--------|:-------|
| `400` invalid request | Check fields, filters, pins, and package structure. Change the request before retrying. |
| `401` unauthenticated | Check the endpoint and key, including expiry or revocation. |
| `403` forbidden | Check tenant, resource, and permissions. `write` does not include `publish`. |
| `404` unavailable resource or version | Check the ID. Rediscover a previously selected skill once; publication may have changed. |
| `409` conflict | Read the current entry or proposal before retrying. Review a changed proposal revision again. |
| `413` content too large | Reduce the payload to the documented operation limits. |
| `423` suspended | Ask the administrator to inspect the playbook's state. |
| `424` failed dependency | Inspect playbook health and the failed dependency. |
| `429` or temporary `5xx` | Retry reads with bounded backoff; honor `Retry-After` when present. |
| `408` or timeout after a write | Read state before repeating a create or append; the write may have completed. |
| Connection refused | For the local walkthrough, restart the Helm guide's port-forwards. For a remote client, check that it can reach the configured endpoint. |

The examples set `retry_config=None` to disable retries. Repeating a create or append can duplicate content. Republishing the current version is a no-op; concurrent publication changes are last-write-wins.
