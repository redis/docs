---
Title: Redis Agent Memory
alwaysopen: false
categories:
- docs
- develop
- ai
description: Store agent memory for AI applications in Redis.
linkTitle: Agent Memory
hideListLinks: true
weight: 10
aliases:
- /develop/ai/agent-memory/
---

## What is Redis Agent Memory?

Redis Agent Memory is a memory service for AI applications. It stores ordered conversation events in session memory and durable information in long-term memory.

When enabled, automatic summarization compacts session memory by summarizing older events while retaining recent events in full. Redis Agent Memory extracts long-term memories automatically from session events.

Access Redis Agent Memory through the Python and TypeScript SDKs or its REST API. It works with any agent framework or LLM provider.

<div class="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
  {{< tile-card icon="images/icon_logo/icon-data-structures-64-midnight.png" title="Overview" description="What's the same and what's different if you already know Redis" url="/develop/ai/context-engine/agent-memory/overview" >}}
  {{< tile-card icon="images/icon_logo/icon-developers-64-midnight.png" title="Quickstart" description="Make your first requests" url="/develop/ai/context-engine/agent-memory/quickstart" >}}
  {{< tile-card icon="images/dev/icons/icon-redis-code-64-duotone.png" title="Developer guide" description="Add memory to your application" url="/develop/ai/context-engine/agent-memory/developer-guide" >}}
  {{< tile-card icon="images/dev/icons/icon-redis-agent-memory-64-duotone.png" title="Sessions" description="Store conversation events" url="/develop/ai/context-engine/agent-memory/sessions" >}}
  {{< tile-card icon="images/dev/icons/icon-redis-agent-memory-64-duotone.png" title="Long-term memory" description="Recall information across conversations" url="/develop/ai/context-engine/agent-memory/long-term-memory" >}}
  {{< tile-card icon="images/icon_logo/icon-data-structures-64-midnight.png" title="Namespaces" description="Organize your memories" url="/develop/ai/context-engine/agent-memory/namespaces" >}}
</div>

## Why use Redis Agent Memory?

* **Context-aware conversations:** Store ordered conversation events with their actor, role, timestamp, and metadata, then retrieve them by session ID. Configure session expiration to control how long the conversation is retained.
* **Automatic session summarization:** Automatically summarize older conversation events while retaining recent messages in full.
* **Automatic long-term memory:** Automatically extract durable information from session events in the background. You can also create long-term memories directly from external data.
* **Sensitive-data exclusions:** Guide automatic extraction away from information that should not be kept in long-term memory.
* **Relevant retrieval:** Search long-term memory semantically and narrow results with filters.
* **Multi-session recall:** Retrieve relevant memories across conversations and filter results by owner, session, namespace, topic, or memory type.
* **Custom memory types:** Define memory types for your business domain, with structured fields and instructions that control what Redis Agent Memory extracts.

## Concepts

Redis Agent Memory provides two memory tiers. See the [overview](/content/develop/ai/context-engine/agent-memory/overview.md) for how they relate to sessions, owners, and namespaces.

<div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
  <div class="p-5 border border-redis-pen-300 rounded-lg">
    <h3 class="text-redis-ink-900 font-semibold mb-3">Session memory</h3>
    <p>Stores the ordered events and metadata for a conversation.</p>
    <ul class="space-y-2">
      <li><strong>Configurable retention:</strong> Set a time-to-live (TTL) to control how long session events are retained.</li>
      <li><strong>Automatic summarization:</strong> Condense older events after a configured threshold while retaining recent events in full, reducing the conversation history sent to the model's context window.</li>
    </ul>
  </div>
  <div class="p-5 border border-redis-pen-300 rounded-lg">
    <h3 class="text-redis-ink-900 font-semibold mb-3">Long-term memory</h3>
    <p>Stores durable information that can be retrieved across sessions using semantic search and filters.</p>
    <ul class="space-y-2">
      <li><strong>Automatic extraction:</strong> Process session events asynchronously and store important information with vector embeddings and metadata.</li>
      <li><strong>Custom memory types:</strong> Define domain-specific memories with structured fields and extraction instructions.</li>
      <li><strong>Sensitive-data exclusions:</strong> Guide automatic extraction away from specified sensitive information.</li>
      <li><strong>Direct memory creation:</strong> Create memories through the API or import knowledge from external sources.</li>
      <li><strong>Configurable retention:</strong> Set a separate TTL for long-term memories.</li>
    </ul>
  </div>
</div>

### Example: Travel planning agent

Consider a travel agent helping a user plan a trip:

```text
User: I'm planning a trip to Japan next month and need help finding some restaurants for the trip.
Agent: Nice! What cities are you visiting?
User: I'm going to Tokyo and Kyoto. Also, I'm a vegetarian.
Agent: Good to know! I'll help you find some vegetarian-friendly restaurants in Tokyo and Kyoto.
```

<div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
  <div class="p-5 border border-redis-pen-300 rounded-lg">
    <h4 class="text-redis-ink-900 font-semibold mb-3">Session memory</h4>
    <p>Stores an ordered sequence of events under a session ID, including each event's role, content, timestamps, and metadata. Before the next agent turn, the application can retrieve the session to reconstruct the conversation context.</p>
  </div>
  <div class="p-5 border border-redis-pen-300 rounded-lg">
    <h4 class="text-redis-ink-900 font-semibold mb-3">Automatic session summarization</h4>
    <p>Summarizes older events after the configured threshold while retaining recent messages in full. The application can provide relevant conversation history to the agent without filling the model's context window with every original event.</p>
  </div>
  <div class="p-5 border border-redis-pen-300 rounded-lg">
    <h4 class="text-redis-ink-900 font-semibold mb-3">Automatic long-term memory extraction</h4>
    <p>Extracts durable information in the background, such as "The user is vegetarian." Later sessions can retrieve it after the original session expires.</p>
  </div>
  <div class="p-5 border border-redis-pen-300 rounded-lg">
    <h4 class="text-redis-ink-900 font-semibold mb-3">Custom memory types</h4>
    <p>Stores domain-specific information in a custom <code>trip_preference</code> type with fields such as <code>destinations</code>, <code>travel_period</code>, and <code>dietary_requirements</code>.</p>
  </div>
</div>

## Quick example {#get-started}

1. Set up an Agent Memory store:
    - **Redis Cloud:** [Create an Agent Memory service on Redis Cloud](/content/operate/iris/agent-memory/create-service.md).
    - **Self-managed:** [Deploy Agent Memory on Kubernetes](/content/operate/iris/agent-memory/self-managed/_index.md).
1. Install the Redis Iris Python package, which includes the `iris` CLI:

    ```bash
    pip install 'redis-iris>=1.0.0'
    ```

1. With `IRIS_AGENT_MEMORY_URL`, `IRIS_AGENT_MEMORY_STORE_ID`, and `IRIS_AGENT_MEMORY_API_KEY` in your environment, record a conversation, then recall what Agent Memory extracted from it:

    ```python
    from redis_iris import AgentMemory

    memory = AgentMemory.from_env()

    convo = memory.conversation(owner="user-1042", session_id="trip-planning")
    convo.user("I'm going to Tokyo and Kyoto. Also, I'm a vegetarian.")
    convo.assistant("I'll find vegetarian-friendly restaurants in Tokyo and Kyoto.")

    # In a later session, after background extraction:
    known = memory.recall("Where should this user eat?", owner="user-1042")
    print(known.as_prompt())
    ```

Follow the [quickstart](/content/develop/ai/context-engine/agent-memory/quickstart.md) to explore the same travel planning scenario in Python, TypeScript, or curl.

## Explore the documentation

* [Overview]({{< relref "/develop/ai/context-engine/agent-memory/overview" >}}): Understand session memory, long-term memory, and namespaces.
* [Quickstart]({{< relref "/develop/ai/context-engine/agent-memory/quickstart" >}}): Store a conversation and recall an extracted memory.
* [Developer guide]({{< relref "/develop/ai/context-engine/agent-memory/developer-guide" >}}): Put the pieces together in an application.
* [Sessions]({{< relref "/develop/ai/context-engine/agent-memory/sessions" >}}): Store conversation events and configure retention and summarization.
* [Long-term memory]({{< relref "/develop/ai/context-engine/agent-memory/long-term-memory" >}}): Create and retrieve memories across conversations, including custom memory types.
* [MemoryETL](/content/develop/ai/context-engine/agent-memory/memory-etl.md): Extract memories from documents and inspect their source evidence.
* [Summary Views](/content/develop/ai/context-engine/agent-memory/summary-views.md): Materialize text or structured summaries of long-term memories.
* [Ingestion webhooks](/content/develop/ai/context-engine/agent-memory/ingestion-webhooks.md): Review input and generated changes before they are saved.
* [Namespaces]({{< relref "/develop/ai/context-engine/agent-memory/namespaces" >}}): Organize memories and manage namespace hierarchies.

* [API reference]({{< relref "/develop/ai/context-engine/agent-memory/api-reference" >}}): Look up request and response schemas.

For shared placement rules, see [Namespace routing](/content/develop/ai/context-engine/agent-memory/namespaces/namespace-routing.md). To build a conversation list, see [List and sort sessions](/content/develop/ai/context-engine/agent-memory/sessions/list-sessions.md).
