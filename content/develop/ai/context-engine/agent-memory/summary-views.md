---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Create owned summaries of long-term memories, refresh them, and read text or structured results.
hideListLinks: true
linktitle: Summary Views
title: Summarize long-term memories with Summary Views
weight: 14
---

A Summary View turns selected long-term memories into a reusable text or structured summary. For example, a travel assistant can maintain a compact profile instead of adding every matching memory to each model request.

A **definition** specifies the sources, filters, grouping, output, and refresh policy. A **partition** is one materialized result for an exact combination of grouping values. An ungrouped definition has one result. Results are derived data; they do not enter long-term-memory search or replace the source records.

Summary Views use long-term memories. [Automatic summarization](/content/develop/ai/context-engine/agent-memory/sessions/_index.md#configure-automatic-summarization) summarizes conversation events within a session. The supported Summary View source is `LONG_TERM`. Document-managed MemoryETL records are excluded from Summary View sources.

## Prepare the service and identity

Summary Views are available in Redis Cloud and enabled in self-managed deployments. For self-managed model and capacity settings, see [Configure Summary Views](/content/operate/iris/agent-memory/self-managed/configuration.md#enable-summary-views).

{{< embed-md "agent-memory-continue-from-quickstart.md" >}}

The server assigns the definition's immutable `ownerId` from the caller's authenticated user ID. A create request cannot supply an owner field.

On a self-managed store with ownership enforcement enabled, creating a view requires an authenticated user ID, including when an agent key is used. Use [delegated user identity](/content/operate/iris/agent-memory/self-managed/authentication.md#delegate-a-user-with-an-agent-key) and send the user token on every Summary View request. Pass `http_headers={"X-Iris-User-Token": user_token}` to each Python call, or add `-H "X-Iris-User-Token: $USER_TOKEN"` to each cURL request. The verified user becomes the owner, so filter sources by that user's ID.

On a self-managed store with ownership enforcement disabled, agent keys without a user can create, refresh, and read views of either visibility. `ownerId` is empty when the caller has no authenticated user ID. Check the store's [effective ownership policy](/content/operate/iris/agent-memory/self-managed/authentication.md#server-side-ownership-enforcement) before choosing a visibility.

### Choose private or shared visibility

On self-managed stores with ownership enforcement enabled:

| Visibility | Who can read | Sources |
|:-----------|:-------------|:--------|
| `PRIVATE` (default) | The definition owner. | The owner's personal and store-authorized shared memories, narrowed by the definition's filters. |
| `SHARED` | Callers with store read access. The owner retains lifecycle control. | Shared memories only. Personal records cannot be published through a shared view. |

Shared does not mean a particular team. Enforce team membership in your backend or use separate stores and grants.

With ownership enforcement disabled, every caller with store read access can read a `PRIVATE` view. Both `PRIVATE` and `SHARED` views can include personal memories. Your backend must authorize access to personal data. A view records its source-access policy at creation. Replace views whose policy differs from the store's effective policy after a change. Keep the server and worker configuration aligned.

## Create, refresh, and read a view

These examples create one private profile for the quickstart user, request a full refresh, and poll its result. First create ordinary long-term memories for that user. For more ways to write them, see [Create a custom memory directly](/content/develop/ai/context-engine/agent-memory/long-term-memory.md#create-a-custom-memory-directly):

{{< clients-example set="iris_agent_memory_summary_views" step="summary-view-seed" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

Create the view and save its ID for later requests:

{{< clients-example set="iris_agent_memory_summary_views" step="summary-view-create" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

Request a full refresh. Creation and refresh are asynchronous; their responses do not contain generated output:

{{< clients-example set="iris_agent_memory_summary_views" step="summary-view-refresh" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

Poll the result until it is ready. A successful refresh with no matching sources returns `EMPTY`:

{{< clients-example set="iris_agent_memory_summary_views" step="summary-view-result" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

Text output uses `value.text`; structured output uses `value.data`. Python output configuration uses `format_` and `schema_`, serialized as `format` and `schema`. Do not assume every result has a `value`.

### Handle asynchronous result states

| Status | Application behavior |
|:-------|:---------------------|
| `COLD` | No result is stored for this group. It may not have been generated yet, or it may have been evicted. |
| `PENDING` | Work is queued. Previous output may be withheld because its sources changed or became inaccessible. |
| `READY` | A value is available. Check `stale` and coverage fields. |
| `EMPTY` | No sources match. There is no generated value. |
| `REFRESHING` | New work is running. A last good value can remain. |
| `FAILED` | Inspect `errorCode`. A last good value may remain, or `value` may be absent. |

`stale` is independent of status. It compares the result with the current definition and source changes. Decide whether to use a last good stale value, wait, or fall back to direct recall. Do not turn an absent value into an empty summary.

Result reads validate contributing source records. Deleted, changed, or newly inaccessible sources can cause old output to be withheld and repair to be requested. Repair is asynchronous; an old value need not remain available.

### Track refresh progress

A result can include `refresh` while a newer attempt is outstanding. Use `value` and `stale` to decide whether to serve the cached result. Use `refresh.status` to inspect the attempt:

| Status | Meaning |
|:-------|:--------|
| `QUEUED` | Work is waiting for a worker. |
| `RUNNING` | A worker holds the refresh lease. |
| `INTERRUPTED` | The worker's lease expired and another attempt can recover the work. |
| `FAILED` | The last attempt failed. Inspect the result's error and retry as appropriate. |

`lastHeartbeatAt` shows worker activity. `lastProgressAt` updates as the worker processes sources and generates output. If a terminal failure leaves newer changes pending, a continuous view picks them up during reconciliation. For a manual view, request another refresh after addressing the failure.

Repeated refresh requests for the same partition share a queued job. Changes during a build can queue one follow-up after it succeeds. An immediate manual refresh can bring a delayed job forward. A job that is already retrying keeps its backoff.

## Filter and group sources

Use `filter` for owners, sessions, stable namespace IDs, topics, memory types, creation times, and typed attributes. `filter.op` defaults to `ALL`; `ANY` combines optional filters with OR. Exact partition scope, time windows, and self-managed ownership checks apply independently. Use `namespaceId` to filter by namespace.

`groupBy` accepts up to four distinct fields: `ownerId`, `sessionId`, `namespaceId`, and `memoryType`. A result read or `target: PARTITION` refresh must supply exactly those fields. Missing or extra scope fields are invalid. `groupBy: []` creates a singleton; omit all scope fields when reading it.

For `groupBy: ["ownerId", "namespaceId"]`, use this partition refresh body:

```json
{
  "target": "PARTITION",
  "scope": {"ownerId":"<user-id>","namespaceId":"<namespace-id>"}
}
```

Send the same scope as query parameters on result reads. `target: FULL` reconciles current and previous partitions.

`evictionPolicy.maxPartitions` bounds grouped results within the deployment limit. Grouped views use the operator's partition limit when the policy is omitted; singleton views omit it. Matching source mutations make a scope recent; reads do not. Evicted scopes can return `COLD`.

`timeWindowSeconds` sets a rolling window for source selection. The default time basis, `createdAt`, uses the time when Agent Memory stored each memory. The window only affects which memories the view uses.

Set `"timeBasis": "eventTime"` when you create the view and include a `timeWindowSeconds` value. For example, use `1209600` for a 14-day window. This keeps historical session imports out of a recent view. Agent Memory ranks eligible memories by event time before applying source limits.

- For a session-derived memory, event time is the newest rendered message time from its recorded extraction sources. Send original message timestamps when importing sessions.
- For a new direct memory, event time is the memory's creation time.
- The view skips memories without a stored event time, including records written before the feature was available. Agent Memory does not backfill timestamps.

Create a new view to choose a different time basis. On self-managed deployments, upgrade the Agent Memory control plane, data-plane servers, and workers before creating an event-time view. Disable event-time views before rolling back to older binaries. Older workers select sources by storage time.

When a source used in a cached result ages out of the window, the result reports `stale: true`. Continuous views refresh at the next reconciliation. For a manual view, request a refresh.

## Choose structured output and continuous refresh

For structured output, replace `output` with:

```json
{
  "format": "STRUCTURED",
  "instructions": "Summarize only preferences supported by the selected memories.",
  "schema": {
    "fields": [
      {"name":"cities","type":"STRING_LIST","description":"Cities the user wants to visit"},
      {"name":"vegetarian","type":"BOOLEAN","description":"Whether the user has stated a vegetarian diet"}
    ]
  }
}
```

The schema accepts 1–50 fields of type `STRING`, `INTEGER`, `FLOAT`, `BOOLEAN`, `STRING_LIST`, `FLOAT_LIST`, or `OBJECT`. Generated fields are optional. Arbitrary JSON Schema, required-field declarations, and nested object schemas are unsupported. Text output must omit `schema`; structured output requires it. Invalid generated data is reported as `OUTPUT_VALIDATION_FAILED`.

For continuous refresh, use:

```json
{"mode":"CONTINUOUS","debounceSeconds":5,"reconcileIntervalSeconds":60}
```

The reconcile interval is required and must fit deployment limits. Debounce coalesces mutations; reconciliation also handles changes such as a moving time window. Manual mode omits both interval fields. Both modes run asynchronously within queue, source, generation, and concurrency limits.

## Check coverage and manage definitions

Inspect `sourceMemoryCount` and `summarizedMemoryCount`. Selection can omit whole records (`sourcesOmitted`) or clip included content (`sourceContentTruncated`). `truncated` combines both. Check `truncated` even when every record was included: some text may have been cut. Concurrent writes can change the source set while counts are measured.

Request `includeSourceMemoryIds=true` for the selected source IDs. These identify contributing records, not every match. `computedAt`, `sourceUpdatedAt`, and `definitionVersion` help assess freshness.

| Action | Python method | REST |
|:-------|:--------------|:-----|
| List definitions | `memory.client.list_summary_views` | `GET /summary-views` |
| Read a definition | `memory.client.get_summary_view` | `GET /summary-views/{viewId}` |
| Update a definition | `memory.client.update_summary_view` | `PATCH /summary-views/{viewId}` |
| Delete a definition | `memory.client.delete_summary_view` | `DELETE /summary-views/{viewId}` |

REST paths are relative to `/iris/data/v1/agent-memory/stores/{storeId}`. Lists return `items` and optional `nextCursor`; pass it as `cursor` with the same query. Definition states (`ACTIVE`, `DISABLED`, `DELETING`) are separate from result status. Each Python method also has an `_async` variant.

This example updates the description, which does not trigger generation, and lists the store's definitions:

{{< clients-example set="iris_agent_memory_summary_views" step="summary-view-update" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

| Change | Effect |
|:-------|:-------|
| Name or description | Does not trigger generation. |
| Filter, output, or refresh policy | Increments `definitionVersion`. |
| `groupBy` | Increments `definitionVersion` and replaces the partition layout. |
| Owner, visibility, source, or time basis | Create a new definition to change these fields. |
| `state: DISABLED` | Disables the view. Re-enabling requests refresh work. |

`clearFilter: true` and `clearTimeWindow: true` remove those settings; do not also supply replacements.

Deletion returns `202` while cleanup runs. Repeated deletion is idempotent; the definition becomes `DELETING` before schedules and results are removed. Source memories remain.

{{< clients-example set="iris_agent_memory_summary_views" step="summary-view-delete" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

For quota failures, inspect the API error and deployment limits. For generation or source-access failures, keep the view ID and address the reported error instead of creating duplicates. [Ingestion webhooks](/content/develop/ai/context-engine/agent-memory/ingestion-webhooks.md) can reject generated content before publication.
