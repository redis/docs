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

## Memory fields

When you create a memory directly, you must supply `memoryId`, `text`, and `ownerId`. The server sets `createdAt` and `updatedAt`. During automatic extraction, the server creates the memory ID and content and copies the session owner into `ownerId`. Use that same stable user ID when querying personal memories; see [Authorize every memory request](/content/develop/ai/context-engine/agent-memory/developer-guide.md#authorize-every-memory-request).

A long-term memory record includes:

| Field | Purpose |
|:------|:--------|
| `memoryId` | Unique identifier for the memory. |
| `text` | Memory content used for retrieval. |
| `memoryType` | Built-in or custom memory type. |
| `sessionId` | Session associated with the memory. |
| `ownerId` | User or entity associated with the memory. |
| `namespaceId` | Optional stable namespace ID. |
| `attributes` | Custom memory fields and their values. |
| `topics` | Topic tags used to categorize the memory. |
| `createdAt` | Time the memory was created. |
| `updatedAt` | Time the memory was last updated. |

## Search long-term memory

Search by meaning and use `ownerId` to restrict recall to the relevant user or entity. Add filters for a session, namespace, topic, or memory type as needed.

For request fields, filter operators, and response schemas, see [`SearchLongTermMemory`]({{< relref "/develop/ai/context-engine/agent-memory/api-reference" >}}#operation/SearchLongTermMemory).

For domain-specific fields and extraction instructions, see [Custom memory types]({{< relref "/develop/ai/context-engine/agent-memory/long-term-memory#custom-memory-types" >}}). To group memories in a hierarchy, see [Namespaces]({{< relref "/develop/ai/context-engine/agent-memory/namespaces" >}}).

For controls that apply during automatic extraction, see [Exclude sensitive data from automatic extraction]({{< relref "/develop/ai/context-engine/agent-memory/developer-guide#exclude-sensitive-data-from-automatic-extraction" >}}).

### Search by meaning

Use the same connection values and owner ID as the [quickstart](/content/develop/ai/context-engine/agent-memory/quickstart.md). This example finds memories about the user’s food preferences:

{{< clients-example set="agent_memory_sdk" step="search_long_term_memory_basic" footer="hide" dft_tab_name="curl" runnable="false" try_it="false" >}}
curl --fail-with-body --silent --show-error \
  --request POST \
  --header "Authorization: Bearer $API_KEY" \
  --header 'Content-Type: application/json' \
  --data @- \
  "$AGENT_MEMORY_URL/iris/data/v1/agent-memory/stores/$STORE_ID/memories/search" <<JSON | jq
{
  "query": "What dietary requirements and food preferences does the user have?",
  "filter": {
    "ownerId": {
      "eq": "$OWNER_ID"
    }
  },
  "limit": 5
}
JSON
{{< /clients-example >}}

### Filter and sort without semantic search

Omit `query` to retrieve records by filters without a semantic query. For example, retrieve the user's most recently updated memories:

{{< multitabs id="filter-only-memory-search" tab1="Python" tab2="TypeScript" tab3="curl" >}}

```python
        recent_memories = agent_memory.search_long_term_memory(request={
            "filter_": {"owner_id": {"eq": USER_ID}},
            "sort_by": "updatedAt",
            "sort_order": "DESC",
            "limit": 10,
        })
        show("Recent memories", recent_memories)
```

-tab-sep-

```typescript
  const recentMemories = await agentMemory.searchLongTermMemory({
    filter: { ownerId: { eq: userId } },
    sortBy: "updatedAt", sortOrder: "DESC", limit: 10,
  });
  console.dir(recentMemories, { depth: null });
```

-tab-sep-

```sh
curl --fail-with-body --silent --show-error \
  --request POST \
  --header "Authorization: Bearer $API_KEY" \
  --header 'Content-Type: application/json' \
  --data "$(jq -n --arg owner "$OWNER_ID" \
    '{filter: {ownerId: {eq: $owner}}, sortBy: "updatedAt", sortOrder: "DESC", limit: 10}')" \
  "$AGENT_MEMORY_URL/iris/data/v1/agent-memory/stores/$STORE_ID/memories/search" | jq
```

{{< /multitabs >}}

Use the client and identifiers from the [quickstart](/content/develop/ai/context-engine/agent-memory/quickstart.md). Add the Python snippet inside the `with` block and the TypeScript snippet inside `run`.

`sortBy` accepts `createdAt` or `updatedAt` only when `query` is absent. `sortOrder` accepts `ASC` or `DESC`, defaults to descending, and requires `sortBy`. Semantic searches remain ranked by similarity and cannot use these sort fields. `limit` accepts 1–100 and defaults to 50. Pass `nextCursor` as `cursor` with the same query to continue.

Filter conditions use `filter.op: "ALL"` (AND) by default; `"ANY"` uses OR. To restrict a query to a user, keep the owner condition mandatory. Do not use `"ANY"` with separate owner and namespace conditions when both must match. These retrieval filters do not replace application access checks.

Set `filter.unnamespaced: true` to match records with neither the older `namespace` string label nor a namespace resource. It cannot be combined with `namespaceId`, and remains mandatory even with `op: "ANY"`.

[MemoryETL](/content/develop/ai/context-engine/agent-memory/memory-etl.md) outputs are included in search by default. Set top-level `excludeDocumentManaged: true` to omit them. Returned `documentManaged` records cannot be overwritten through generic memory creation or PATCH requests; use the document-ingestion workflow to manage their content.

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

After enabling the type, add a travel message to a new session. Run this write once, then wait at least one extraction interval before searching.

{{< multitabs id="custom-memory-event" tab1="Python" tab2="TypeScript" tab3="curl" >}}

```python
        agent_memory.add_session_event(
            session_id="trip-preference-session", actor_id=USER_ID,
            role=models.MessageRole.USER,
            content=[models.Text(text="I am visiting Tokyo and Kyoto next month. I am vegetarian.")],
            created_at=datetime.now(timezone.utc),
        )
```

-tab-sep-

```typescript
  await agentMemory.addSessionEvent("trip-preference-session", {
    actorId: userId, role: "USER",
    content: [{ text: "I am visiting Tokyo and Kyoto next month. I am vegetarian." }],
    createdAt: new Date(),
  });
```

-tab-sep-

```sh
curl --fail-with-body --silent --show-error --request POST \
  --header "Authorization: Bearer $API_KEY" \
  --header 'Content-Type: application/json' \
  --data "$(jq -n --arg owner "$OWNER_ID" --arg now "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
    '{actorId:$owner,role:"USER",content:[{text:"I am visiting Tokyo and Kyoto next month. I am vegetarian."}],createdAt:$now}')" \
  "$AGENT_MEMORY_URL/iris/data/v1/agent-memory/stores/$STORE_ID/sessions/trip-preference-session/events" | jq
```

{{< /multitabs >}}

Search for the structured memory:

{{< multitabs id="custom-memory-search" tab1="Python" tab2="TypeScript" tab3="curl" >}}

```python
        custom_results = agent_memory.search_long_term_memory(
            request={
                "query": "What are the requirements for the user's trip?",
                "filter_": {
                    "owner_id": {"eq": USER_ID},
                    "memory_type": {"eq": "trip_preference"},
                },
                "limit": 5,
            },
        )
        show("Trip preference memories", custom_results)
```

-tab-sep-

```typescript
  const customResults = await agentMemory.searchLongTermMemory({
    query: "What are the requirements for the user's trip?",
    filter: {
      ownerId: { eq: userId },
      memoryType: { eq: "trip_preference" },
    },
    limit: 5,
  });
  console.log("Trip preference memories:");
  console.dir(customResults, { depth: null });
```

-tab-sep-

```sh
curl --fail-with-body --silent --show-error \
  --request POST \
  --header "Authorization: Bearer $API_KEY" \
  --header 'Content-Type: application/json' \
  --data @- \
  "$AGENT_MEMORY_URL/iris/data/v1/agent-memory/stores/$STORE_ID/memories/search" <<JSON | jq
{
  "query": "What are the requirements for the user's trip?",
  "filter": {
    "ownerId": {
      "eq": "$OWNER_ID"
    },
    "memoryType": {
      "eq": "trip_preference"
    }
  },
  "limit": 5
}
JSON
```

{{< /multitabs >}}

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

Inspect the structured fields. The SDK examples collect dietary requirements for the next agent turn:

{{< multitabs id="custom-memory-fields" tab1="Python" tab2="TypeScript" tab3="curl" >}}

```python
        dietary_requirements = set()
        if not custom_results.items:
            print("No matching trip preferences yet. Retry after a short wait.")
        for memory in custom_results.items:
            attributes = memory.attributes or {}
            requirements = attributes.get("dietary_requirements", [])
            if isinstance(requirements, list):
                dietary_requirements.update(
                    value for value in requirements if isinstance(value, str)
                )
        print("Restaurant requirements:", sorted(dietary_requirements))
```

-tab-sep-

```typescript
  const dietaryRequirements = new Set<string>();
  if (customResults.items.length === 0) {
    console.log("No matching trip preferences yet. Retry after a short wait.");
  }
  for (const memory of customResults.items) {
    const requirements = memory.attributes?.dietary_requirements;
    if (Array.isArray(requirements)) {
      for (const value of requirements) {
        if (typeof value === "string") dietaryRequirements.add(value);
      }
    }
  }
  console.log("Restaurant requirements:", [...dietaryRequirements].sort());
```

-tab-sep-

Run the search with this filter in place of the final `jq` command:

```sh
jq 'if (.items | length) == 0 then
      {status: "No matching trip preferences yet. Retry after a short wait."}
    else
      .items[] | {id, attributes}
    end'
```

{{< /multitabs >}}

If results remain empty, check that the type is enabled and that the owner ID matches the stored records. An empty result does not mean the user has no dietary requirements.


### Create a custom memory directly

If your application already has structured trip data, write it directly using the registered `trip_preference` type. This optional example represents data from a form and uses the same user identifier:

{{< multitabs id="direct-memory" tab1="Python" tab2="TypeScript" tab3="curl" >}}

```python
        direct_result = agent_memory.bulk_create_long_term_memories(memories=[{
            "memory_id": "trip-form-1",
            "text": "The user plans to visit Tokyo and Kyoto next month and requires vegetarian food.",
            "owner_id": USER_ID,
            "memory_type": "trip_preference",
            "attributes": {
                "destinations": ["Tokyo", "Kyoto"],
                "travel_period": "next month",
                "dietary_requirements": ["vegetarian"],
                "food_preferences": ["spicy food"],
            },
        }])
        show("Directly created trip preference", direct_result)
```

-tab-sep-

```typescript
  const directResult = await agentMemory.bulkCreateLongTermMemories({
    memories: [{
      memoryId: "trip-form-1",
      text: "The user plans to visit Tokyo and Kyoto next month and requires vegetarian food.",
      ownerId: userId,
      memoryType: "trip_preference",
      attributes: {
        destinations: ["Tokyo", "Kyoto"],
        travel_period: "next month",
        dietary_requirements: ["vegetarian"],
        food_preferences: ["spicy food"],
      },
    }],
  });
  console.dir(directResult, { depth: null });
```

-tab-sep-

```sh
curl --fail-with-body --silent --show-error \
  --request POST \
  --header "Authorization: Bearer $API_KEY" \
  --header 'Content-Type: application/json' \
  --data @- \
  "$AGENT_MEMORY_URL/iris/data/v1/agent-memory/stores/$STORE_ID/memories" <<JSON | jq
{
  "memories": [{
    "memoryId": "trip-form-1",
    "text": "The user plans to visit Tokyo and Kyoto next month and requires vegetarian food.",
    "ownerId": "$OWNER_ID",
    "memoryType": "trip_preference",
    "attributes": {
      "destinations": ["Tokyo", "Kyoto"],
      "travel_period": "next month",
      "dietary_requirements": ["vegetarian"],
      "food_preferences": ["spicy food"]
    }
  }]
}
JSON
```

{{< /multitabs >}}

Inspect the bulk response for per-record errors. Run the custom-memory search again to retrieve the record. Direct creation does not wait for background extraction and does not apply the extraction prompt or sensitive-data exclusions. Creating an eligible record with the same `id` again replaces that record. Access checks and protection for document-managed records still apply.

See [custom memory types]({{< relref "/operate/iris/agent-memory/create-service#custom-memory-types" >}}) for configuration requirements and limits.

## Test semantic exclusions

{{< embed-md "agent-memory-continue-from-quickstart.md" >}}

In the Redis Cloud console, open your service’s **Configuration** tab and select **Edit**. Under **Sensitive-data exclusions**, enable **Semantic exclusions** and set this prompt:

```text
Do not keep passwords, access tokens, recovery codes, payment card information, or booking confirmation codes in long-term memory.
```

The semantic exclusion prompt tells Redis Agent Memory which information should not be kept in long-term memory. Add an event containing a fictional booking code and information that is safe to retain:

{{< multitabs id="exclusion-event" tab1="Python" tab2="TypeScript" tab3="curl" >}}

```python
        sensitive_event = agent_memory.add_session_event(
            session_id=SESSION_ID,
            actor_id=USER_ID,
            role=models.MessageRole.USER,
            content=[models.Text(
                text=(
                    "I booked Hotel Sakura in Tokyo. For this example, "
                    "the fictional booking confirmation code is DEMO-7QX9."
                ),
            )],
            created_at=datetime.now(timezone.utc),
        )
        show("Event with excluded information", sensitive_event)
```

-tab-sep-

```typescript
  const sensitiveEvent = await agentMemory.addSessionEvent(sessionId, {
    actorId: userId,
    role: "USER",
    content: [{
      text: "I booked Hotel Sakura in Tokyo. For this example, the fictional booking confirmation code is DEMO-7QX9.",
    }],
    createdAt: new Date(),
  });
  console.log("Event with excluded information:");
  console.dir(sensitiveEvent, { depth: null });
```

-tab-sep-

```sh
export EVENT_CREATED_AT="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"

curl --fail-with-body --silent --show-error \
  --request POST \
  --header "Authorization: Bearer $API_KEY" \
  --header 'Content-Type: application/json' \
  --data @- \
  "$AGENT_MEMORY_URL/iris/data/v1/agent-memory/stores/$STORE_ID/sessions/$SESSION_ID/events" <<JSON | jq
{
  "actorId": "$OWNER_ID",
  "role": "USER",
  "content": [
    {
      "text": "I booked Hotel Sakura in Tokyo. For this example, the fictional booking confirmation code is DEMO-7QX9."
    }
  ],
  "createdAt": "$EVENT_CREATED_AT"
}
JSON
```

{{< /multitabs >}}

Run the event write once. In the SDK files, comment out event creation and its output statements before subsequent runs. Wait at least one minute and search for the safe hotel information:

{{< multitabs id="exclusion-search" tab1="Python" tab2="TypeScript" tab3="curl" >}}

```python
        exclusion_results = agent_memory.search_long_term_memory(
            request={
                "query": "Where is the user staying in Tokyo?",
                "filter_": {
                    "owner_id": {"eq": USER_ID},
                },
                "limit": 5,
            },
        )
        show("Memories after semantic exclusion", exclusion_results)
```

-tab-sep-

```typescript
  const exclusionResults = await agentMemory.searchLongTermMemory({
    query: "Where is the user staying in Tokyo?",
    filter: {
      ownerId: { eq: userId },
    },
    limit: 5,
  });
  console.log("Memories after semantic exclusion:");
  console.dir(exclusionResults, { depth: null });
```

-tab-sep-

```sh
curl --fail-with-body --silent --show-error \
  --request POST \
  --header "Authorization: Bearer $API_KEY" \
  --header 'Content-Type: application/json' \
  --data @- \
  "$AGENT_MEMORY_URL/iris/data/v1/agent-memory/stores/$STORE_ID/memories/search" <<JSON | jq
{
  "query": "Where is the user staying in Tokyo?",
  "filter": {
    "ownerId": {
      "eq": "$OWNER_ID"
    }
  },
  "limit": 5
}
JSON
```

{{< /multitabs >}}

> [!NOTE]
> **What to expect:** A memory similar to `User booked Hotel Sakura in Tokyo` without the fictional confirmation code `DEMO-7QX9`. If the code appears, refine the exclusion prompt and test again.

> [!WARNING]
> Semantic exclusions are advisory and do not guarantee that sensitive information is excluded. Session content still reaches the extraction model provider. Do not use real sensitive data in this exercise. Exclusions do not apply to directly created long-term memories.

See [sensitive-data exclusions]({{< relref "/operate/iris/agent-memory/create-service#sensitive-data-exclusions" >}}) for configuration details.
