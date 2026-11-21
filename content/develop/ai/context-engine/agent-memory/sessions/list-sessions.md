---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Filter sessions by owner, namespace, or time, sort results, and follow pagination.
hideListLinks: true
linktitle: List sessions
title: List and sort sessions
weight: 10
aliases:
- /develop/ai/context-engine/agent-memory/list-sessions/
---

Use session listing to let a user reopen an earlier conversation. The session rows contain IDs and available owner, timestamp, and namespace metadata. They do not contain conversation events or summary text. Retrieve the selected session with `memory.conversation(owner=..., session_id=...).transcript()` (Python), `iris agent-memory sessions show`, or `GET /iris/data/v1/agent-memory/stores/{storeId}/sessions/{sessionId}` to build the agent's conversation context.

## Choose a listing operation

| Result you need | REST endpoint | Python | CLI |
|:----------------|:--------------|:-------|:----|
| Every session ID for one owner | `GET /iris/data/v1/agent-memory/stores/{storeId}/sessions?ownerId=...` | `memory.sessions(owner)` | `iris agent-memory sessions list --owner` |
| Session rows with filters, sorting, and pagination | `GET /iris/data/v1/agent-memory/stores/{storeId}/sessions` | `memory.client.list_sessions` | Not available |

The REST operation returns `items` and an optional `nextCursor`. It does not return a total count. `memory.sessions(owner)` follows every page for you and returns only the IDs.

{{< embed-md "agent-memory-continue-from-quickstart.md" >}}

To list the quickstart user's session IDs:

{{< clients-example set="iris_agent_memory_list_sessions" step="agent-memory-list-session-ids" description="" lang_filter="Python (Iris),CLI (Iris),cURL (Iris)" footer="hide" />}}

For a user's personal conversations, set `ownerId` to the user's authenticated ID. The session owner is the first event's `actorId`. Add `namespaceId` to require an exact namespace ID as well. It does not include descendants, deprecated namespace labels, or sessions without a namespace resource. Owner and namespace matching is case-sensitive.

A request without filters must set `includeAll=true`. Do not combine `includeAll=true` with any filter. Authorize store-wide or shared namespace listing in your application before making the request. A filter selects records; it does not establish the caller's right to access them.

## Filter by creation time or last update

Use an RFC 3339 timestamp such as `2026-11-01T00:00:00Z` in any of these query parameters.

| Time bound | Creation time | Last update |
|:-----------|:--------------|:------------|
| After | `createdAtGt` | `updatedAtGt` |
| At or after | `createdAtGte` | `updatedAtGte` |
| Before | `createdAtLt` | `updatedAtLt` |
| At or before | `createdAtLte` | `updatedAtLte` |

For an activity window, combine `updatedAtGte` and `updatedAtLt`. Use one lower bound and one upper bound per timestamp. You can combine time bounds with `ownerId` and `namespaceId`. A time filter excludes sessions whose matching timestamp is unknown.

## Sort and paginate session rows

The default is `sortBy=updatedAt` and `sortOrder=DESC`, so recent activity appears first. `sortBy` accepts `sessionId`, `createdAt`, or `updatedAt`. `sortOrder` accepts `ASC` or `DESC`. When omitted, it is ascending for `sessionId` and descending for timestamps. `limit` accepts 1–200 and defaults to 100.

To list session rows for one owner, with the most recently updated sessions first, follow every page:

{{< clients-example set="iris_agent_memory_list_sessions" step="agent-memory-list-sessions-sorted" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

Pass each returned `nextCursor` as `cursor`. Keep all filters, including time bounds, and sort options unchanged. Stop when the cursor is absent. The cursor is opaque, so URL-encode it in REST requests. Changing a filter or sort requires a new request without the old cursor.

List rows and single-session reads both return `createdAt` and `updatedAt` when known. Older session rows can omit `ownerId` and unknown timestamps. Adding events, removing events, and writing a summary advance `updatedAt`. To see whether a summary is available, check the single-session response.
