---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Connect an application to Redis Agent Memory and work with session memory and long-term memory through Python, TypeScript, or REST.
hideListLinks: true
linktitle: Developer guide
title: Redis Agent Memory developer guide
weight: 5
---

Use the Python SDK, TypeScript SDK, or REST API to add session events, retrieve conversation context, create long-term memories, and search for relevant information.

## Integration workflow

1. Connect to a Redis Agent Memory service with its endpoint, Store ID, and API key.
1. Add conversation events to session memory.
1. Retrieve session memory before an agent turn to reconstruct the conversation context.
1. Search long-term memory for information relevant to the current interaction.

Redis Agent Memory can automatically summarize older session events and extract long-term memories in the background. Applications can also create long-term memories directly.

## Choose a client

| Client | Use it when | Package and quickstart |
|:-------|:------------|:-----------------------|
| Python SDK | Your application or agent uses Python. | Install [`redis-agent-memory`](https://pypi.org/project/redis-agent-memory/) and follow the [Python SDK quickstart](/content/develop/ai/context-engine/agent-memory/python-sdk-quickstart.md). |
| TypeScript SDK | Your application or agent uses JavaScript or TypeScript. | Install [`@redis-iris/agent-memory`](https://www.npmjs.com/package/@redis-iris/agent-memory) and follow the [TypeScript SDK quickstart](/content/develop/ai/context-engine/agent-memory/typescript-sdk-quickstart.md). |
| REST API | You need language-independent HTTP access or don't want an SDK dependency. | No package required. Follow the [REST API quickstart](/content/develop/ai/context-engine/agent-memory/rest-api-quickstart.md). |

## Connect to a Redis Agent Memory service

Every client requires:

* The Redis Agent Memory endpoint.
* The Store ID.
* A Redis Agent Memory API key.

The Python and TypeScript SDKs accept the endpoint, Store ID, and API key when you create the client. When you use the REST API, send the API key as a bearer token and include the Store ID in request paths.

Follow the [Redis Cloud setup guide](/content/operate/iris/agent-memory/create-service.md) if you don't have a service. After you create one, copy its endpoint and Store ID from the **Configuration** tab and save the API key securely.

## Identify users and conversations

| Identifier | Purpose |
|:-----------|:--------|
| `sessionId` | Identifies a conversation or interaction session. |
| `actorId` | Identifies the actor that produced a session event. |
| `ownerId` | Identifies the user or entity associated with a long-term memory. |
| `namespaceId` | Identifies a namespace resource used to group sessions and long-term memories. |
| Memory ID | Uniquely identifies a long-term memory within the store. |

An application can use the same user identifier for `actorId` and `ownerId`, but the fields describe different relationships.

## Organize memories with namespaces

Use a namespace to group memories for a project, team, or user. For example, a travel agent can keep a user's trip memories in a personal `travel` namespace. A namespace controls where you place and search for memories; a custom memory type describes the information in each record.

Create the namespace before writing to it. The response contains a server-generated `namespaceId`. Save this ID and use it in `namespaceRef` on session events and long-term memory writes. Names and paths can change when you rename a namespace; its ID stays the same.

### Create a namespace hierarchy

Choose a root scope when you create a namespace:

| Scope | Creation fields | Example use |
|:------|:----------------|:------------|
| `PERSONAL` | `name`, `scope`, and `ownerId` | A user's travel plans. |
| `SHARED` | `name` and `scope`, without `ownerId` | Information used across a team. |

Create a child with `name` and `parentId`. You can also create a hierarchy with `path`, such as `travel/japan`, and the root scope. Supply `ownerId` for a personal path. Missing path segments are created as needed. Do not combine `path` with `name` or `parentId`.

Names and paths are case-sensitive. The path does not encode scope. Use the returned ID to distinguish namespaces that have the same path under different owners or scopes.

Follow the [REST quickstart]({{< relref "/develop/ai/context-engine/agent-memory/rest-api-quickstart#create-a-namespace" >}}), [Python quickstart]({{< relref "/develop/ai/context-engine/agent-memory/python-sdk-quickstart#create-a-namespace" >}}), or [TypeScript quickstart]({{< relref "/develop/ai/context-engine/agent-memory/typescript-sdk-quickstart#create-a-namespace" >}}) to create a personal namespace and use its ID throughout a conversation.

### Place and retrieve memories

Pass `namespaceRef: {"namespaceId": "<namespace-id>"}` when you start a session. Memories extracted from the session use that namespace. Use a new session ID when following the quickstarts if you already ran them without a namespace.

For direct long-term memory creation, set `namespaceRef` on each record. To move existing records, use `MoveLongTermMemories` with their IDs and the destination `namespaceRef`. Check both `moved` and `errors` in the response before treating a batch as complete.

Search with `filter.namespaceRef.eq` for one namespace or `filter.namespaceRef.in` for several IDs. These filters match exact namespace IDs; they do not expand a parent into its descendants. List the children and include their IDs when you need to search several levels of a hierarchy. Keep the `ownerId` filter when recalling one user's memories. Namespace scope and search filters do not replace your application's access checks.

### Manage namespaces

| Operation | Behavior |
|:----------|:---------|
| List | List roots, or pass `parentId` to list direct children. Follow `nextPageToken` for additional pages. |
| Get | Retrieve the current name, path, scope, and state by ID. |
| Rename | Update `name`; continue using the same ID for placement and retrieval. |
| Archive | Set `state` to `ARCHIVED` to stop new children and placements. The update API does not offer an unarchive transition. |
| Delete | Delete an empty leaf namespace. A namespace with children or memory placements returns `409 Conflict`. |

Creating a namespace at an occupied location returns `409 Conflict`, including when the existing namespace is archived. Save and reuse the returned ID instead of creating the same namespace on each agent turn. For request fields and error responses, see the [namespace API reference]({{< relref "/develop/ai/context-engine/agent-memory/api-reference" >}}#operation/CreateNamespace).

### Migrate legacy namespace labels

The `namespace` string is deprecated. It is a label, and does not create or resolve a namespace resource. Creating a resource with the same name does not move records that carry the old label. A `namespaceRef` search matches only records placed in a namespace resource.

1. Create the destination namespace and save its ID.
1. Find the records to move with the legacy `filter.namespace` and the appropriate owner filter. Follow search pagination and review the IDs before moving them.
1. Move the selected records with `MoveLongTermMemories`.
1. Check `moved` and any per-record `errors`, then search with `filter.namespaceRef` to verify the new placement.
1. Update application writes and searches to use `namespaceRef`. Start new sessions with the namespace reference for future extraction.

Using the connection variables from the [REST quickstart]({{< relref "/develop/ai/context-engine/agent-memory/rest-api-quickstart#save-the-connection-values" >}}), move a selected record as follows. Set `NAMESPACE_ID` to the destination ID and replace `<memory-id>` with a reviewed record ID:

```sh
curl --fail-with-body --silent --show-error \
  --request POST \
  --header "Authorization: Bearer $API_KEY" \
  --header 'Content-Type: application/json' \
  --data "$(jq -n --arg ns "$NAMESPACE_ID" --arg id '<memory-id>' \
    '{memoryIds: [$id], namespaceRef: {namespaceId: $ns}}')" \
  "$AGENT_MEMORY_URL/v1/stores/$STORE_ID/long-term-memory/move" | jq
```

Do not send `namespace` and `namespaceRef` together. Moving long-term records does not reconfigure the session that produced them.

## Work with session memory

Use a stable `sessionId` to store a conversation as an ordered sequence of events. Add an event for each user, assistant, or system message that your application needs to retain.

Each stored event can include:

| Field | Purpose |
|:------|:--------|
| `eventId` | Server-generated identifier for the event. |
| `sessionId` | Session that contains the event. |
| `actorId` | User, agent, or other actor that produced the event. |
| `role` | Role of the message in the conversation. |
| `content` | Message content, including its text. |
| `createdAt` | Time the event occurred in the application. |
| `systemTimestamp` | Time Redis Agent Memory stored the event. |
| `metadata` | Optional application-specific information associated with the event. |

Before an agent turn, retrieve the session by `sessionId` and provide the relevant events to the agent. This lets the application reconstruct the conversation without maintaining a separate conversation store.

### Session retention

The session-memory TTL controls how long sessions remain available. Configure it according to the retention requirements of your application. When a session expires, its events are no longer available through session-memory retrieval.

See [memory configuration](/content/operate/iris/agent-memory/create-service.md#memory-configuration) to configure the session-memory TTL in Redis Cloud.

### Automatic session summarization

Automatic summarization limits the amount of conversation history that must be added to a model's context window. Configure:

* **Summarize after:** The number of messages a session can contain before older messages are summarized.
* **Keep most recent:** The number of recent messages that remain available in full.

For example, with **Summarize after** set to 20 and **Keep most recent** set to 10, Redis Agent Memory summarizes the older 10 messages when the session reaches 20 messages and retains the 10 most recent messages in full.

See [automatic summarization](/content/operate/iris/agent-memory/create-service.md#automatic-summarization) to enable summarization and configure both thresholds in Redis Cloud.

Follow any of the client quickstarts to add and retrieve a session event. For complete schemas, see the [session-memory API reference](/content/develop/ai/context-engine/agent-memory/api-reference.md#tag/session-memory).

## Work with long-term memory

Long-term memory stores information that remains useful beyond one conversation. A long-term memory record includes content and fields that let applications classify, scope, and retrieve it:

| Field | Purpose |
|:------|:--------|
| `id` | Unique identifier for the memory. |
| `text` | Memory content used for retrieval. |
| `memoryType` | Built-in or custom memory type. |
| `sessionId` | Session associated with the memory. |
| `ownerId` | User or entity associated with the memory. |
| `namespaceRef` | Namespace ID and its current name and path. |
| `attributes` | Custom memory fields and their values. |
| `topics` | Topic tags used to categorize the memory. |
| `createdAt` | Time the memory was created. |
| `updatedAt` | Time the memory was last updated. |

### Create long-term memories

Redis Agent Memory provides two creation paths:

* **Automatic extraction:** Redis Agent Memory processes session events asynchronously and creates durable memories from relevant information. Configure the extraction cadence to control how often session events are processed.
* **Direct creation:** Your application creates one or more long-term memories through the API or an SDK. Use direct creation when importing existing information or when your application determines exactly what to store.

Configure the long-term-memory TTL separately from the session-memory TTL.

See [memory configuration](/content/operate/iris/agent-memory/create-service.md#memory-configuration) to configure the extraction cadence and long-term-memory TTL in Redis Cloud.

### Exclude sensitive data from automatic extraction

Sensitive-data exclusions keep specified information out of long-term memory during automatic extraction. A store's exclusions policy combines three mechanisms that you enable independently:

* **Built-in detectors:** Validated patterns for common identifiers, such as payment card numbers, email addresses, phone numbers, IP addresses, and US Social Security numbers. Select the ones a store should apply.
* **Custom detectors:** Regular expressions you write yourself, for identifiers specific to your domain such as tenant IDs or internal reference numbers.
* **Semantic exclusions:** A plain-language exclusion prompt describing what must not be kept, such as passwords, access tokens, recovery codes, payment card information, or booking confirmation codes. Use it for concepts a pattern cannot express.

Every detector chooses what happens to a memory it matches: redact the matched text and keep the rest, or drop the memory. When a memory matches several detectors that choose different actions, the memory is dropped.

Exclusions apply to automatic extraction from session events. They do not apply when an application creates long-term memories directly, and session memory itself is never altered.

> [!WARNING]
> Detector matches are deterministic, but semantic exclusions are advisory and do not guarantee exclusion. Sensitive session content still reaches the extraction model provider. Use appropriate controls before sending sensitive information to Redis Agent Memory or the model provider.

See [sensitive-data exclusions](/content/operate/iris/agent-memory/create-service.md#sensitive-data-exclusions) to configure the feature in Redis Cloud.

### Search long-term memory

Search long-term memory using semantic, keyword, or hybrid retrieval. Scope results with filters for owners, sessions, namespaces, topics, and memory types.

Use `ownerId` to restrict recall to the relevant user or entity. Add narrower filters when the application needs memories from a particular session, namespace, topic, or memory type.

For request fields, filter operators, and response schemas, see [`SearchLongTermMemory`](/content/develop/ai/context-engine/agent-memory/api-reference.md#tag/long-term-memory/operation/SearchLongTermMemory).

### Define custom memory types

Custom memory types capture structured information specific to your business domain. Define them in the Redis Agent Memory service configuration with:

| Setting | Purpose |
|:--------|:--------|
| **Name** | Unique name used as the memory's `memoryType`. |
| **Description** | Description of the information represented by the type. |
| **Extraction prompt** | Instructions that tell Redis Agent Memory when and how to extract the custom memory from session events. |
| **Enabled** | Controls whether Redis Agent Memory extracts new memories for the type. |
| **Custom fields** | Structured fields added to memories of this type. |

Custom fields support `str`, `int`, `float`, `bool`, `list[str]`, `list[float]`, and `object`. Each field has a name and description that explain what it captures. Every custom memory also includes the built-in long-term memory fields listed above.

For example, a travel application could define a `trip_preference` type with these fields:

| Field | Type | Captures |
|:------|:-----|:---------|
| `destinations` | `list[str]` | Cities or countries the user plans to visit. |
| `travel_period` | `str` | Dates or period of the trip. |
| `dietary_requirements` | `list[str]` | Dietary requirements that affect recommendations. |
| `food_preferences` | `list[str]` | Cuisines, flavors, or dining preferences. |

When this type is enabled, Redis Agent Memory can extract a structured `trip_preference` memory from relevant session events. Each enabled custom type processes session events independently.

Search with `memoryType`, `ownerId`, and `namespaceRef` filters together to retrieve this user's trip preferences from the intended namespace. Read the structured fields from each result's `attributes` object. For example, this excerpt shows fields your application can use to constrain restaurant recommendations:

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

This is an illustrative excerpt, not a guaranteed extraction result. Check for missing fields before using them. Extraction runs asynchronously: an empty `items` array can mean that processing is not finished or no matching information was extracted. Retry after a short wait, then check the type's enabled setting, extraction prompt, and search filters if results remain empty. Do not interpret an empty result as the absence of a dietary requirement.

You can also create custom memories directly. Register the type on the service first, then send `id`, `text`, `ownerId`, `memoryType`, `attributes`, and optionally `namespaceRef` through `BulkCreateLongTermMemories`. Attribute names and JSON values must match the registered fields. Use this path for structured data from an application form or an import. It does not run the extraction prompt or sensitive-data exclusions.

The quickstarts show both extraction and direct creation with the same `trip_preference` schema. Custom types are configured for the service; placing a record in a namespace does not define a new type.

See [custom memory types](/content/operate/iris/agent-memory/create-service.md#custom-memory-types) for configuration requirements and limits.

Follow any of the client quickstarts to create and search long-term memory. For complete schemas, see the [long-term-memory API reference](/content/develop/ai/context-engine/agent-memory/api-reference.md#tag/long-term-memory).

## References

* [Python SDK quickstart](/content/develop/ai/context-engine/agent-memory/python-sdk-quickstart.md)
* [TypeScript SDK quickstart](/content/develop/ai/context-engine/agent-memory/typescript-sdk-quickstart.md)
* [Python SDK reference](https://pypi.org/project/redis-agent-memory/)
* [TypeScript SDK reference](https://www.npmjs.com/package/@redis-iris/agent-memory)
* [REST API quickstart](/content/develop/ai/context-engine/agent-memory/rest-api-quickstart.md)
* [Redis Agent Memory API reference](/content/develop/ai/context-engine/agent-memory/api-reference.md)
