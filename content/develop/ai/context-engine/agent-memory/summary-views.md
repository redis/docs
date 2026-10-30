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

Summary Views differ from [session summarization](/content/develop/ai/context-engine/agent-memory/sessions/_index.md#configure-automatic-summarization), which compacts conversation events. The supported source is `LONG_TERM`. Document-managed MemoryETL records are excluded from Summary View sources.

## Prepare the service and identity

Summary Views are available in Redis Cloud and enabled in self-managed deployments. For self-managed model and capacity settings, see [Configure Summary Views](/content/operate/iris/agent-memory/self-managed/configuration.md#enable-summary-views).

The examples use a self-managed service with ownership enforcement and [delegated user identity](/content/operate/iris/agent-memory/self-managed/authentication.md#delegate-a-user-with-an-agent-key). Set `AGENT_MEMORY_URL`, `STORE_ID`, `API_KEY`, `USER_TOKEN`, and `OWNER_ID` as described there. `OWNER_ID` must match the verified user claim. Install the SDK through the [quickstart](/content/develop/ai/context-engine/agent-memory/quickstart.md#install-the-sdk).

The server assigns the definition's immutable `ownerId`. In on-prem deployments, creation requires an authenticated user ID even with enforcement off. A store credential without user identity cannot create a view by supplying an owner field.

### Choose private or shared visibility

In on-prem deployments with ownership enforcement enabled:

| Visibility | Who can read | Sources |
|:-----------|:-------------|:--------|
| `PRIVATE` (default) | The definition owner. | The owner's personal and store-authorized shared memories, narrowed by the definition's filters. |
| `SHARED` | Callers with store read access. The owner retains lifecycle control. | Shared memories only. Personal records cannot be published through a shared view. |

Shared does not mean a particular team. Enforce team membership in your backend or use separate stores and grants. In on-prem deployments with enforcement off, store-level access is broader: `PRIVATE` does not replace backend authorization. A view records its source-access policy at creation. Changing on-prem enforcement requires replacing existing views and configuring server and worker alike.

## Create, refresh, and read a view

These examples create one private profile for `OWNER_ID`, request a full refresh, and poll its result. First [create ordinary long-term memories](/content/develop/ai/context-engine/agent-memory/long-term-memory.md#create-a-custom-memory-directly) in this self-managed store, using the delegated client and matching `OWNER_ID`. A successful refresh with no matching sources returns `empty`.

Save the view ID for later requests. Creation and refresh are asynchronous; their responses do not contain generated output.

{{< multitabs id="summary-view-lifecycle" tab1="Python" tab2="TypeScript" tab3="curl" >}}

```python
import asyncio
import os

from redis_agent_memory import AgentMemory


async def main():
    headers = {"X-Iris-User-Token": os.environ["USER_TOKEN"]}
    async with AgentMemory(
        os.environ["AGENT_MEMORY_URL"], store_id=os.environ["STORE_ID"],
        api_key=os.environ["API_KEY"],
    ) as memory:
        view = await memory.create_summary_view_async(
            name="Travel profile", source="long_term", group_by=[],
            filter_={"owner_id": {"eq": os.environ["OWNER_ID"]}},
            output={"format_": "text", "instructions": "Summarize the user's travel preferences."},
            refresh_policy={"mode": "manual"}, http_headers=headers,
        )
        print("View ID:", view.id)
        accepted = await memory.refresh_summary_view_async(
            view_id=view.id, target="full", http_headers=headers,
        )
        print(accepted.model_dump_json(by_alias=True))
        for _ in range(60):
            result = await memory.get_summary_view_result_async(
                view_id=view.id, include_source_memory_ids=True, http_headers=headers,
            )
            if result.status == "failed":
                raise RuntimeError(f"Refresh failed: {result.error_code}")
            if result.status == "empty":
                print("No matching source memories.")
                return
            if result.status == "ready" and not result.stale:
                if result.value is None:
                    raise RuntimeError("Ready result omitted its value")
                print(result.model_dump_json(by_alias=True))
                return
            await asyncio.sleep(2)
        raise TimeoutError(f"Continue polling view {view.id}")


asyncio.run(main())
```

-tab-sep-

```typescript
import { setTimeout as delay } from "node:timers/promises";
import { AgentMemory } from "@redis-iris/agent-memory";

async function main() {
  const { AGENT_MEMORY_URL, STORE_ID, API_KEY, USER_TOKEN, OWNER_ID } = process.env;
  if (!AGENT_MEMORY_URL || !STORE_ID || !API_KEY || !USER_TOKEN || !OWNER_ID) {
    throw new Error("Set the connection values, USER_TOKEN, and OWNER_ID.");
  }
  const memory = new AgentMemory({ serverURL: AGENT_MEMORY_URL, storeId: STORE_ID, apiKey: API_KEY });
  const options = { headers: { "X-Iris-User-Token": USER_TOKEN } };
  const view = await memory.createSummaryView({
    name: "Travel profile", source: "long_term", groupBy: [],
    filter: { ownerId: { eq: OWNER_ID } },
    output: { format: "text", instructions: "Summarize the user's travel preferences." },
    refreshPolicy: { mode: "manual" },
  }, options);
  console.log("View ID:", view.id);
  console.dir(await memory.refreshSummaryView(view.id, { target: "full" }, options));
  for (let attempt = 0; attempt < 60; attempt++) {
    const result = await memory.getSummaryViewResult(
      view.id,   // viewId
      undefined, // ownerId
      undefined, // sessionId
      undefined, // namespaceRef
      undefined, // memoryType
      true,      // includeSourceMemoryIds
      options,   // request options
    );
    if (result.status === "failed") throw new Error(`Refresh failed: ${result.errorCode}`);
    if (result.status === "empty") {
      console.log("No matching source memories.");
      return;
    }
    if (result.status === "ready" && !result.stale) {
      if (!result.value) throw new Error("Ready result omitted its value");
      console.dir(result, { depth: null });
      return;
    }
    await delay(2000);
  }
  throw new Error(`Continue polling view ${view.id}`);
}

main().catch((error) => { console.error(error instanceof Error ? error.message : "Request failed"); process.exitCode = 1; });
```

-tab-sep-

```sh
definition=$(jq -n --arg owner "$OWNER_ID" \
  '{name:"Travel profile",source:"LONG_TERM",groupBy:[],filter:{ownerId:{eq:$owner}},output:{format:"TEXT",instructions:"Summarize travel preferences."},refreshPolicy:{mode:"MANUAL"}}')
view=$(curl --fail-with-body --silent --show-error --request POST \
  --header "Authorization: Bearer $API_KEY" \
  --header "X-Iris-User-Token: $USER_TOKEN" \
  --header 'Content-Type: application/json' --data "$definition" \
  "$AGENT_MEMORY_URL/iris/data/v1/agent-memory/stores/$STORE_ID/summary-views") || exit 1
VIEW_ID=$(printf '%s' "$view" | jq -er .viewId) || exit 1
printf 'View ID: %s\n' "$VIEW_ID"

curl --fail-with-body --silent --show-error --request POST \
  --header "Authorization: Bearer $API_KEY" \
  --header "X-Iris-User-Token: $USER_TOKEN" \
  --header 'Content-Type: application/json' --data '{"target":"FULL"}' \
  "$AGENT_MEMORY_URL/iris/data/v1/agent-memory/stores/$STORE_ID/summary-views/$VIEW_ID/refresh" | jq

for attempt in $(seq 1 60); do
  result=$(curl --fail-with-body --silent --show-error --get \
    --header "Authorization: Bearer $API_KEY" \
    --header "X-Iris-User-Token: $USER_TOKEN" \
    --data-urlencode 'includeSourceMemoryIds=true' \
    "$AGENT_MEMORY_URL/iris/data/v1/agent-memory/stores/$STORE_ID/summary-views/$VIEW_ID/result") || exit 1
  state=$(printf '%s' "$result" | jq -r .status)
  case "$state" in
    FAILED) printf '%s\n' "$result" | jq; exit 1 ;;
    EMPTY) printf 'No matching source memories.\n'; exit 0 ;;
    READY)
      if printf '%s' "$result" | jq -e '.stale == false and .value != null' >/dev/null; then
        printf '%s\n' "$result" | jq
        exit 0
      fi ;;
  esac
  sleep 2
done
printf 'Continue polling view %s\n' "$VIEW_ID"
exit 1
```

{{< /multitabs >}}

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

## Filter and group sources

Use `filter` for owners, sessions, stable namespace IDs, topics, memory types, creation times, and typed attributes. `filter.op` defaults to `ALL`; `ANY` combines optional filters with OR. Exact partition scope and time-window restrictions apply separately, as do ownership checks in on-prem deployments. Legacy `namespace` labels are unsupported for Summary Views; use `namespaceId`.

`groupBy` accepts up to four distinct fields: `ownerId`, `sessionId`, `namespaceId`, and `memoryType`. A result read or `target: PARTITION` refresh must supply exactly those fields. Missing or extra scope fields are invalid. `groupBy: []` creates a singleton; omit all scope fields when reading it.

For `groupBy: ["ownerId", "namespaceId"]`, use this partition refresh body:

```json
{
  "target": "PARTITION",
  "scope": {"ownerId":"<user-id>","namespaceId":"<namespace-id>"}
}
```

Send the same scope as query parameters on result reads. `target: FULL` reconciles current and previous partitions.

`evictionPolicy.maxPartitions` bounds grouped results within the deployment limit. Grouped views use the operator's partition limit when the policy is omitted; singleton views omit it. Matching source mutations make a scope recent; reads do not. Evicted scopes can return `COLD`. `timeWindowSeconds` selects sources by creation time in a rolling window; it does not change source retention.

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

| Action | Python method | TypeScript method | REST |
|:-------|:--------------|:------------------|:-----|
| List definitions | `list_summary_views_async` | `listSummaryViews` | `GET /summary-views` |
| Read a definition | `get_summary_view_async` | `getSummaryView` | `GET /summary-views/{viewId}` |
| Update a definition | `update_summary_view_async` | `updateSummaryView` | `PATCH /summary-views/{viewId}` |
| Delete a definition | `delete_summary_view_async` | `deleteSummaryView` | `DELETE /summary-views/{viewId}` |

REST paths are relative to `/iris/data/v1/agent-memory/stores/{storeId}`. Lists return `items` and optional `nextCursor`; pass it as `cursor` with the same query. Definition states (`ACTIVE`, `DISABLED`, `DELETING`) are separate from result status.

| Change | Effect |
|:-------|:-------|
| Name or description | Does not trigger generation. |
| Filter, output, or refresh policy | Increments `definitionVersion`. |
| `groupBy` | Increments `definitionVersion` and replaces the partition layout. |
| Owner, visibility, or source | Cannot be changed. Create a new definition. |
| `state: disabled` | Disables the view. Re-enabling requests refresh work. |

`clearFilter: true` and `clearTimeWindow: true` remove those settings; do not also supply replacements.

Deletion returns `202` while cleanup runs. Repeated deletion is idempotent; the definition becomes `deleting` before schedules and results are removed. Source memories remain.

For quota failures, inspect the API error and deployment limits. For generation or source-access failures, keep the view ID and address the reported error instead of creating duplicates. [Ingestion webhooks](/content/develop/ai/context-engine/agent-memory/ingestion-webhooks.md) can reject generated content before publication.
