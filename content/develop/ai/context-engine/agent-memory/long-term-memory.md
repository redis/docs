---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Create and search memories that remain useful across conversations.
hideListLinks: true
linktitle: Long-term memory
title: Long-term memory
weight: 11
aliases:
- /develop/ai/context-engine/agent-memory/custom-memory-types/
---

Long-term memory stores information that remains useful beyond one conversation. Use automatic extraction or direct creation to store memories, then search for information relevant to an agent turn.

## Create long-term memories

Redis Agent Memory provides two ways to create memories:

* **Automatic extraction:** Redis Agent Memory processes session events asynchronously and creates durable memories from relevant information. Configure the extraction cadence to control how often session events are processed.
* **Direct creation:** Your application creates one or more long-term memories through the application programming interface (API) or a software development kit (SDK). Use direct creation when importing existing information or when your application determines exactly what to store.

Configure the long-term-memory time to live (TTL) separately from the session-memory TTL.

See [memory configuration]({{< relref "/operate/iris/agent-memory/create-service#memory-configuration" >}}) to configure the extraction cadence and long-term-memory TTL in Redis Cloud.

{{< embed-md "agent-memory-continue-from-quickstart.md" >}}

This example creates three memories for the quickstart user. Direct creation does not wait for background extraction, so the memories are searchable immediately:

{{< clients-example set="iris_agent_memory_long_term_memory" step="ltm-create" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

In Python, `remember` derives a stable memory ID from the owner and text; the cURL example sets each `memoryId` explicitly. Either way, running the example again does not duplicate the memories. A `memoryId` that already exists is rejected for that record and reported in the response's `errors` array, and the stored memory is left unchanged. To change a memory, see [Update a memory](#update-a-memory).

Reuse an `idempotencyKey` with the same request to retry a bulk create safely. Redis Agent Memory replays the saved result during the retry window, which lasts at most 24 hours and no longer than the store's memory TTL. Reusing a key with a different request returns `409 Conflict`.

## Memory fields

When you create a memory directly, you supply `memoryId`, `text`, and `ownerId`. The Python SDK's `remember` method derives `memoryId` when you omit it. The server sets `createdAt`, `updatedAt`, and `revision`. During automatic extraction, the server creates the memory ID and content and copies the session owner into `ownerId`. Use that same stable user ID when querying personal memories; see [Authorize every memory request](/content/develop/ai/context-engine/agent-memory/developer-guide.md#authorize-every-memory-request).

A long-term memory record includes:

| Field | Purpose |
|:------|:--------|
| `memoryId` | Unique identifier for the memory. |
| `text` | Memory content used for retrieval. |
| `memoryType` | Built-in or custom memory type. Defaults to `semantic`. |
| `sessionId` | Session associated with the memory. |
| `ownerId` | User or entity associated with the memory. |
| `namespaceId` | Optional stable namespace ID. |
| `attributes` | Custom memory fields and their values. |
| `topics` | Topic tags used to categorize the memory. |
| `revision` | Opaque token that changes on every write. Use it for [conditional updates](#update-a-memory). |
| `documentManaged` | `true` when [MemoryETL](/content/develop/ai/context-engine/agent-memory/memory-etl.md) created the memory. |
| `createdAt` | Time the memory was created. |
| `updatedAt` | Time the memory was last updated. |

## Search long-term memory

Search by meaning and use `ownerId` to restrict recall to the relevant user or entity. Add filters for a session, namespace, topic, or memory type as needed.

For request fields, filter operators, and response schemas, see [`SearchLongTermMemory`]({{< relref "/develop/ai/context-engine/agent-memory/api-reference" >}}#operation/SearchLongTermMemory).

For domain-specific fields and extraction instructions, see [Custom memory types]({{< relref "/develop/ai/context-engine/agent-memory/long-term-memory#custom-memory-types" >}}). To group memories in a hierarchy, see [Namespaces]({{< relref "/develop/ai/context-engine/agent-memory/namespaces" >}}).

For controls that apply during automatic extraction, see [Exclude sensitive data from automatic extraction]({{< relref "/develop/ai/context-engine/agent-memory/developer-guide#exclude-sensitive-data-from-automatic-extraction" >}}).

### Search by meaning

This example finds memories about the user's food preferences. `recall` restricts the search to the owner's memories:

{{< clients-example set="iris_agent_memory_long_term_memory" step="ltm-search" description="" lang_filter="Python (Iris),CLI (Iris),cURL (Iris)" footer="hide" />}}

### Filter and sort without semantic search

Omit `query` to retrieve records by filters without a semantic query. For example, retrieve the user's most recently updated memories:

{{< clients-example set="iris_agent_memory_long_term_memory" step="ltm-filter" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

`sortBy` accepts `createdAt` or `updatedAt` only when `query` is absent. `sortOrder` accepts `ASC` or `DESC`, defaults to descending, and requires `sortBy`. Semantic searches remain ranked by similarity and cannot use these sort fields. `limit` accepts 1–100 and defaults to 50. Pass `nextCursor` as `cursor` with the same query to continue.

Filter conditions use `filter.op: "ALL"` (AND) by default; `"ANY"` uses OR. To restrict a query to a user, keep the owner condition mandatory. Do not use `"ANY"` with separate owner and namespace conditions when both must match. These retrieval filters do not replace application access checks.

Set `filter.unnamespaced: true` to match records with neither the older `namespace` string label nor a namespace resource. It cannot be combined with `namespaceId`, and remains mandatory even with `op: "ANY"`.

[MemoryETL](/content/develop/ai/context-engine/agent-memory/memory-etl.md) outputs are included in search by default. Set top-level `excludeDocumentManaged: true` to omit them. Returned `documentManaged` records are protected from generic writes: memory creation, `PUT`, and `PATCH` requests cannot change their content. The one exception is a `PATCH` that changes only `namespaceId`, which moves the record and keeps its TTL. Use the document-ingestion workflow to manage their content.

For custom fields, use `filter.attributes`, keyed by the field name, with the operators described in [`AttributeFilterClause`](/content/develop/ai/context-engine/agent-memory/api-reference.md#operation/SearchLongTermMemory). Combine it with `memoryType` to select the registered custom type.

For example, this search request combines the owner, type, and dietary requirement with `op: "ALL"`. A `list` clause requires every listed value to be present:

```json
{
  "filter": {
    "op": "ALL",
    "ownerId": {"eq": "<user-id>"},
    "memoryType": {"eq": "trip_preference"},
    "attributes": {"dietary_requirements": {"list": ["vegetarian"]}}
  },
  "limit": 10
}
```

Use exactly one typed clause per attribute: `string`, `number`, `boolean`, or `list`, matching the registered field type.

## Update a memory

Redis Agent Memory provides two ways to change a memory you manage:

* **Partial update:** [`PATCH /memories/{memoryId}`]({{< relref "/develop/ai/context-engine/agent-memory/api-reference" >}}#operation/UpdateLongTermMemory) changes only the fields you send: `text`, `memoryType`, `topics`, `namespaceId`, `ownerId`, or `sessionId`. It does not change `attributes`. An update that changes only `namespaceId` keeps the memory's current expiration; any other update restarts the long-term-memory TTL.
* **Replace or create:** [`PUT /memories/{memoryId}`]({{< relref "/develop/ai/context-engine/agent-memory/api-reference" >}}#operation/UpsertLongTermMemory) creates the memory if it does not exist, or replaces it completely. It requires `text` and `ownerId`. Omitted optional fields, including `attributes`, are cleared, and `memoryType` defaults to `semantic`. Replacement keeps `createdAt` and restarts the TTL. The response's `created` field reports whether the memory was new.

To change a custom memory's `attributes`, replace the record with `PUT`.

The example program first creates a memory that records a seat preference. Read the memory before you change it. The HTTP response's `revision` identifies the version you read:

{{< clients-example set="iris_agent_memory_long_term_memory_update" step="ltm-get" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

Change the text and topics with a partial update:

{{< clients-example set="iris_agent_memory_long_term_memory_update" step="ltm-patch" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

Replace the whole memory with `PUT`:

{{< clients-example set="iris_agent_memory_long_term_memory_update" step="ltm-put" description="" lang_filter="cURL (Iris)" footer="hide" />}}

### Prevent lost updates

Send `expectedRevision` with the `revision` you read to apply a `PATCH` or `PUT` only if nobody changed the memory since. A stale revision returns `412 Precondition Failed` with the type `/errors/revision-conflict`. Read the memory again, reapply your change, and retry. Omit `expectedRevision` for an unconditional write. Search results from older records can omit `revision`; read the memory by ID before a conditional update.

This request reuses the revision read before the partial update, so it fails:

{{< clients-example set="iris_agent_memory_long_term_memory_update" step="ltm-stale-revision" description="" lang_filter="cURL (Iris)" footer="hide" />}}

`PATCH` and `PUT` also accept an `idempotencyKey`. Reuse the key with the same request to retry safely; Redis Agent Memory replays the saved result during the retry window, which lasts at most 24 hours and no longer than the store's memory TTL. Reusing a key with a different request returns `409 Conflict`.

The Python SDK does not yet expose `revision`, `expectedRevision`, update idempotency keys, or the `PUT` operation. Use the HTTP API for replacement and conditional writes.

## Delete memories

Delete memories by ID. This example deletes the memories created in [Create long-term memories](#create-long-term-memories):

{{< clients-example set="iris_agent_memory_long_term_memory" step="ltm-delete" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

To delete every session and memory that a user owns, see [Clean up]({{< relref "/develop/ai/context-engine/agent-memory/quickstart#clean-up" >}}) in the quickstart.

## Custom memory types

Custom memory types capture structured information specific to your business domain.

### Define a memory type

Configure the type on your Redis Agent Memory service with:

| Setting | Purpose |
|:--------|:--------|
| **Name** | Unique name used as the memory's `memoryType`. |
| **Description** | Description of the information represented by the type. |
| **Extraction prompt** | Instructions that tell Redis Agent Memory when and how to extract the custom memory from session events. |
| **Enabled** | Controls whether Redis Agent Memory extracts new memories for the type. |
| **Custom fields** | Structured fields added to memories of this type. |

Custom fields support `str`, `int`, `float`, `bool`, `list[str]`, `list[float]`, and `object`. Each field has a name and description that explain what it captures. Every custom memory also includes the built-in [long-term memory fields]({{< relref "/develop/ai/context-engine/agent-memory/long-term-memory#memory-fields" >}}).

For example, a travel application can define a `trip_preference` type with these fields:

| Field | Type | Captures |
|:------|:-----|:---------|
| `destinations` | `list[str]` | Cities or countries the user plans to visit. |
| `travel_period` | `str` | Dates or period of the trip. |
| `dietary_requirements` | `list[str]` | Dietary requirements that affect recommendations. |
| `food_preferences` | `list[str]` | Cuisines, flavors, or dining preferences. |

When this type is enabled, Redis Agent Memory can extract a structured `trip_preference` memory from relevant session events. Each enabled custom type processes session events independently.

### Extract custom memories

{{< embed-md "agent-memory-continue-from-quickstart.md" >}}

In the Redis Cloud console, open your service’s **Configuration** tab, select **Edit**, and under **Memory types & extraction** select **Add type**. Configure and enable `trip_preference` with the fields in [Define a memory type]({{< relref "/develop/ai/context-engine/agent-memory/long-term-memory#define-a-memory-type" >}}). Use this extraction prompt:

```text
Extract trip requirements only when the user states a destination or travel plan. Preserve explicit dietary requirements and food preferences.
```

The examples in this section require the registered type. Until it exists, requests that create a `trip_preference` memory return `400 Bad Request` with the message `memory type "trip_preference" is not registered on this store`.

After enabling the type, add a travel message to a new session:

{{< clients-example set="iris_agent_memory_long_term_memory_custom_types" step="custom-memory-event" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

Search for the structured memory. The examples search every 10 seconds until extraction creates one:

{{< clients-example set="iris_agent_memory_long_term_memory_custom_types" step="custom-memory-search" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

The `items` array contains records with `memoryType` set to `trip_preference`. Custom fields are inside each record's `attributes` object. For example, a result can include this excerpt:

```json
{
  "memoryType": "trip_preference",
  "attributes": {
    "destinations": ["Tokyo", "Kyoto"],
    "travel_period": "next month",
    "dietary_requirements": ["vegetarian"],
    "food_preferences": ["spicy food"]
  }
}
```

The values depend on the conversation and extraction model. An application can use `dietary_requirements` to constrain restaurant recommendations, while `food_preferences` helps rank suitable choices. Check that each field is present and has the expected type before using it.

Inspect the structured fields. The examples collect dietary requirements for the next agent turn:

{{< clients-example set="iris_agent_memory_long_term_memory_custom_types" step="custom-memory-fields" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

If results remain empty, check that the type is enabled and that the owner ID matches the stored records. An empty result does not mean the user has no dietary requirements.

### Create a custom memory directly

If your application already has structured trip data, write it directly using the registered `trip_preference` type. This example represents data from a form and uses the same user identifier:

{{< clients-example set="iris_agent_memory_long_term_memory_custom_types" step="custom-memory-direct" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

Inspect the response's `errors` array for per-record errors. Run the custom-memory search again to retrieve the record. Direct creation does not wait for background extraction and does not apply the extraction prompt or sensitive-data exclusions. Creating a record whose `memoryId` already exists fails for that record and leaves the stored memory unchanged; use [`PUT`](#update-a-memory) to replace it. Access checks and protection for document-managed records still apply.

See [custom memory types]({{< relref "/operate/iris/agent-memory/create-service#custom-memory-types" >}}) for configuration requirements and limits.

## Test semantic exclusions

{{< embed-md "agent-memory-continue-from-quickstart.md" >}}

In the Redis Cloud console, open your service’s **Configuration** tab and select **Edit**. Under **Sensitive-data exclusions**, enable **Semantic exclusions** and set this prompt:

```text
Do not keep passwords, access tokens, recovery codes, payment card information, or booking confirmation codes in long-term memory.
```

The semantic exclusion prompt tells Redis Agent Memory which information should not be kept in long-term memory. Add an event containing a fictional booking code and information that is safe to retain:

{{< clients-example set="iris_agent_memory_long_term_memory_exclusions" step="exclusion-event" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

Search for the safe hotel information. The examples search every 10 seconds until a memory about the hotel appears:

{{< clients-example set="iris_agent_memory_long_term_memory_exclusions" step="exclusion-search" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

> [!NOTE]
> **What to expect:** A memory similar to `User booked Hotel Sakura in Tokyo` without the fictional confirmation code `DEMO-7QX9`. If the code appears, refine the exclusion prompt and test again.

> [!WARNING]
> Semantic exclusions are advisory and do not guarantee that sensitive information is excluded. Session content still reaches the extraction model provider. Do not use real sensitive data in this exercise. Exclusions do not apply to directly created long-term memories.

See [sensitive-data exclusions]({{< relref "/operate/iris/agent-memory/create-service#sensitive-data-exclusions" >}}) for configuration details.
