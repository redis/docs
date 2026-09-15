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

## Memory fields

A long-term memory record includes:

| Field | Purpose |
|:------|:--------|
| `id` | Unique identifier for the memory. |
| `text` | Memory content used for retrieval. |
| `memoryType` | Built-in or custom memory type. |
| `sessionId` | Session associated with the memory. |
| `ownerId` | User or entity associated with the memory. |
| `namespaceRef` | Optional namespace ID and its current name and path. |
| `attributes` | Custom memory fields and their values. |
| `topics` | Topic tags used to categorize the memory. |
| `createdAt` | Time the memory was created. |
| `updatedAt` | Time the memory was last updated. |

## Create long-term memories

Redis Agent Memory provides two ways to create memories:

* **Automatic extraction:** Redis Agent Memory processes session events asynchronously and creates durable memories from relevant information. Configure the extraction cadence to control how often session events are processed.
* **Direct creation:** Your application creates one or more long-term memories through the application programming interface (API) or a software development kit (SDK). Use direct creation when importing existing information or when your application determines exactly what to store.

Configure the long-term-memory time to live (TTL) separately from the session-memory TTL.

See [memory configuration]({{< relref "/operate/iris/agent-memory/create-service#memory-configuration" >}}) to configure the extraction cadence and long-term-memory TTL in Redis Cloud.

## Search long-term memory

Search long-term memory semantically and narrow results with filters. Scope results with filters for owners, sessions, namespaces, topics, and memory types.

Use `ownerId` to restrict recall to the relevant user or entity. Add narrower filters when the application needs memories from a particular session, namespace, topic, or memory type.

For request fields, filter operators, and response schemas, see [`SearchLongTermMemory`]({{< relref "/develop/ai/context-engine/agent-memory/api-reference" >}}#operation/SearchLongTermMemory).

For domain-specific fields and extraction instructions, see [Custom memory types]({{< relref "/develop/ai/context-engine/agent-memory/long-term-memory#custom-memory-types" >}}). To group memories in a hierarchy, see [Namespaces]({{< relref "/develop/ai/context-engine/agent-memory/namespaces" >}}).

For controls that apply during automatic extraction, see [Exclude sensitive data from automatic extraction]({{< relref "/develop/ai/context-engine/agent-memory/developer-guide#exclude-sensitive-data-from-automatic-extraction" >}}).

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

Complete the [quickstart]({{< relref "/develop/ai/context-engine/agent-memory/quickstart" >}}) first. Reuse its client, connection values, and user and session identifiers. Add Python snippets inside the `with` block and TypeScript snippets inside `run`. Run curl commands in the same shell. Run each write once; comment out completed writes and their output statements before rerunning an SDK file.

Custom memory types let an application extract structured information for its business domain. Configure and enable the `trip_preference` type with the fields in [Define a memory type]({{< relref "/develop/ai/context-engine/agent-memory/long-term-memory#define-a-memory-type" >}}). Use this extraction prompt:

```text
Extract trip requirements only when the user states a destination or travel plan. Preserve explicit dietary requirements and food preferences.
```

After enabling the type, add the travel message from the quickstart to a new session. Wait at least one extraction interval before searching.

Search for the structured memory:

{{< multitabs id="custom-memory-search" tab1="Python" tab2="TypeScript" tab3="curl" >}}

```python
        custom_results = agent_memory.search_long_term_memory(
            request={
                "text": "What are the requirements for the user's trip?",
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
    text: "What are the requirements for the user's trip?",
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
  "$AGENT_MEMORY_URL/v1/stores/$STORE_ID/long-term-memory/search" <<JSON | jq
{
  "text": "What are the requirements for the user's trip?",
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
            "id": "trip-form-1",
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
      id: "trip-form-1",
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
  "$AGENT_MEMORY_URL/v1/stores/$STORE_ID/long-term-memory" <<JSON | jq
{
  "memories": [{
    "id": "trip-form-1",
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

Inspect the bulk response for per-record errors. Run the custom-memory search again to retrieve the record. Direct creation does not wait for background extraction and does not apply the extraction prompt or sensitive-data exclusions. Run this write once; the memory ID identifies the record within the store.

See [custom memory types]({{< relref "/operate/iris/agent-memory/create-service#custom-memory-types" >}}) for configuration requirements and limits.

## Test semantic exclusions

Complete the [quickstart]({{< relref "/develop/ai/context-engine/agent-memory/quickstart" >}}) first. Reuse its client, connection values, and user and session identifiers. Add Python snippets inside the `with` block and TypeScript snippets inside `run`. Run curl commands in the same shell. Run each write once; comment out completed writes and their output statements before rerunning an SDK file.

In the service configuration, enable **Semantic exclusions** and set this prompt:

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
  const sensitiveEvent = await agentMemory.addSessionEvent({
    sessionId,
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
  "$AGENT_MEMORY_URL/v1/stores/$STORE_ID/session-memory/events" <<JSON | jq
{
  "sessionId": "$SESSION_ID",
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
                "text": "Where is the user staying in Tokyo?",
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
    text: "Where is the user staying in Tokyo?",
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
  "$AGENT_MEMORY_URL/v1/stores/$STORE_ID/long-term-memory/search" <<JSON | jq
{
  "text": "Where is the user staying in Tokyo?",
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

Inspect the returned memories. They can retain the hotel name, but should not contain `DEMO-7QX9` because the exclusion prompt covers booking confirmation codes.

> [!NOTE]
> **What to expect:** A memory similar to `User booked Hotel Sakura in Tokyo` without the fictional confirmation code. If the code appears, refine the exclusion prompt and test again. Exclusions remain advisory.

> [!WARNING]
> Semantic exclusions are advisory and do not guarantee that sensitive information is excluded. Session content still reaches the extraction model provider. Do not use real sensitive data in this exercise. Exclusions do not apply to directly created long-term memories.

See [sensitive-data exclusions]({{< relref "/operate/iris/agent-memory/create-service#sensitive-data-exclusions" >}}) for configuration details.
