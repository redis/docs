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
| Python SDK | Your application or agent uses Python. | Install [`redis-agent-memory`](https://pypi.org/project/redis-agent-memory/) and follow the [Python SDK quickstart]({{< relref "/develop/ai/context-engine/agent-memory/python-sdk-quickstart" >}}). |
| TypeScript SDK | Your application or agent uses JavaScript or TypeScript. | Install [`@redis-iris/agent-memory`](https://www.npmjs.com/package/@redis-iris/agent-memory) and follow the [TypeScript SDK quickstart]({{< relref "/develop/ai/context-engine/agent-memory/typescript-sdk-quickstart" >}}). |
| REST API | You need language-independent HTTP access or don't want an SDK dependency. | No package required. Follow the [REST API quickstart]({{< relref "/develop/ai/context-engine/agent-memory/rest-api-quickstart" >}}). |

## Connect to a Redis Agent Memory service

Every client requires:

* The Redis Agent Memory endpoint.
* The Store ID.
* A Redis Agent Memory API key.

The Python and TypeScript SDKs accept the endpoint, Store ID, and API key when you create the client. When you use the REST API, send the API key as a bearer token and include the Store ID in request paths.

Follow the [Redis Cloud setup guide]({{< relref "/operate/iris/agent-memory/create-service" >}}) if you don't have a service. After you create one, copy its endpoint and Store ID from the **Configuration** tab and save the API key securely.

## Identify users and conversations

| Identifier | Purpose |
|:-----------|:--------|
| `sessionId` | Identifies a conversation or interaction session. |
| `actorId` | Identifies the actor that produced a session event. |
| `ownerId` | Identifies the user or entity associated with a long-term memory. |
| Memory ID | Uniquely identifies a long-term memory within the store. |

An application can use the same user identifier for `actorId` and `ownerId`, but the fields describe different relationships.

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

See [memory configuration]({{< relref "/operate/iris/agent-memory/create-service#memory-configuration" >}}) to configure the session-memory TTL in Redis Cloud.

### Automatic session summarization

Automatic summarization limits the amount of conversation history that must be added to a model's context window. Configure:

* **Summarize after:** The number of messages a session can contain before older messages are summarized.
* **Keep most recent:** The number of recent messages that remain available in full.

For example, with **Summarize after** set to 20 and **Keep most recent** set to 10, Redis Agent Memory summarizes the older 10 messages when the session reaches 20 messages and retains the 10 most recent messages in full.

See [automatic summarization]({{< relref "/operate/iris/agent-memory/create-service#automatic-summarization" >}}) to enable summarization and configure both thresholds in Redis Cloud.

Follow any of the client quickstarts to add and retrieve a session event. For complete schemas, see the [session-memory API reference]({{< relref "/develop/ai/context-engine/agent-memory/api-reference#tag/session-memory" >}}).

## Work with long-term memory

Long-term memory stores information that remains useful beyond one conversation. A long-term memory record includes content and fields that let applications classify, scope, and retrieve it:

| Field | Purpose |
|:------|:--------|
| `id` | Unique identifier for the memory. |
| `text` | Memory content used for retrieval. |
| `memoryType` | Built-in or custom memory type. |
| `sessionId` | Session associated with the memory. |
| `ownerId` | User or entity associated with the memory. |
| `namespace` | Logical grouping for the memory. |
| `topics` | Topic tags used to categorize the memory. |
| `createdAt` | Time the memory was created. |
| `updatedAt` | Time the memory was last updated. |

### Create long-term memories

Redis Agent Memory provides two creation paths:

* **Automatic extraction:** Redis Agent Memory processes session events asynchronously and creates durable memories from relevant information. Configure the extraction cadence to control how often session events are processed.
* **Direct creation:** Your application creates one or more long-term memories through the API or an SDK. Use direct creation when importing existing information or when your application determines exactly what to store.

Configure the long-term-memory TTL separately from the session-memory TTL.

See [memory configuration]({{< relref "/operate/iris/agent-memory/create-service#memory-configuration" >}}) to configure the extraction cadence and long-term-memory TTL in Redis Cloud.

### Exclude sensitive data from automatic extraction

Semantic exclusions guide Redis Agent Memory away from storing specified information in long-term memory during automatic extraction. Define an exclusion prompt in the service configuration using plain-language categories such as passwords, access tokens, recovery codes, payment card information, or booking confirmation codes.

Exclusions apply to automatic extraction from session events. They do not apply when an application creates long-term memories directly.

{{< warning >}}
Semantic exclusions are advisory and do not guarantee exclusion. Sensitive session content still reaches the extraction model provider. Use appropriate controls before sending sensitive information to Redis Agent Memory or the model provider.
{{< /warning >}}

See [sensitive-data exclusions]({{< relref "/operate/iris/agent-memory/create-service#sensitive-data-exclusions" >}}) to configure the feature in Redis Cloud.

### Search long-term memory

Search long-term memory using semantic, keyword, or hybrid retrieval. Scope results with filters for owners, sessions, namespaces, topics, and memory types.

Use `ownerId` to restrict recall to the relevant user or entity. Add narrower filters when the application needs memories from a particular session, namespace, topic, or memory type.

For request fields, filter operators, and response schemas, see [`SearchLongTermMemory`]({{< relref "/develop/ai/context-engine/agent-memory/api-reference#tag/long-term-memory/operation/SearchLongTermMemory" >}}).

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
| `destination` | `str` | City or country the user plans to visit. |
| `travel_period` | `str` | Dates or period of the trip. |
| `dietary_requirements` | `list[str]` | Dietary requirements that affect recommendations. |

When this type is enabled, Redis Agent Memory can extract a structured `trip_preference` memory from relevant session events. Each enabled custom type processes session events independently.

See [custom memory types]({{< relref "/operate/iris/agent-memory/create-service#custom-memory-types" >}}) for configuration requirements and limits.

Follow any of the client quickstarts to create and search long-term memory. For complete schemas, see the [long-term-memory API reference]({{< relref "/develop/ai/context-engine/agent-memory/api-reference#tag/long-term-memory" >}}).

## References

* [Python SDK quickstart]({{< relref "/develop/ai/context-engine/agent-memory/python-sdk-quickstart" >}})
* [TypeScript SDK quickstart]({{< relref "/develop/ai/context-engine/agent-memory/typescript-sdk-quickstart" >}})
* [Python SDK reference](https://pypi.org/project/redis-agent-memory/)
* [TypeScript SDK reference](https://www.npmjs.com/package/@redis-iris/agent-memory)
* [REST API quickstart]({{< relref "/develop/ai/context-engine/agent-memory/rest-api-quickstart" >}})
* [Redis Agent Memory API reference]({{< relref "/develop/ai/context-engine/agent-memory/api-reference" >}})
