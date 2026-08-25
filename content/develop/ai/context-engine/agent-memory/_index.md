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
weight: 20
bannerText: Redis Agent Memory is currently available in preview. Features and behavior are subject to change.
bannerChildren: true
aliases:
- /develop/ai/agent-memory/
---

## What is Redis Agent Memory?

Redis Agent Memory is a memory service for AI applications. It stores ordered conversation events in session memory and durable information in long-term memory.

When enabled, automatic summarization compacts session memory by summarizing older events while retaining recent events in full. Redis Agent Memory extracts long-term memories automatically from session events.

Access Redis Agent Memory through the Python and TypeScript SDKs or its REST API. It works with any agent framework or LLM provider.

<div class="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
  {{< image-card image="images/python-sdk-mark.svg" alt="Python SDK mark" title="Python SDK quickstart — Explore Redis Agent Memory with Python" url="/develop/ai/context-engine/agent-memory/python-sdk-quickstart" >}}
  {{< image-card image="images/typescript-sdk-mark.svg" alt="TypeScript SDK mark" title="TypeScript SDK quickstart — Explore Redis Agent Memory with TypeScript" url="/develop/ai/context-engine/agent-memory/typescript-sdk-quickstart" >}}
  {{< image-card image="images/rest-api-mark.svg" alt="REST API mark" title="REST API quickstart — Explore Redis Agent Memory with curl" url="/develop/ai/context-engine/agent-memory/rest-api-quickstart" >}}
</div>

## Why use Redis Agent Memory?

* **Context-aware conversations:** Store ordered conversation events with their actor, role, timestamp, and metadata, then retrieve them by session ID. Configure session expiration to control how long the conversation is retained.
* **Automatic session summarization:** Automatically summarize older conversation events while retaining recent messages in full.
* **Automatic long-term memory:** Automatically extract durable information from session events in the background. You can also create long-term memories directly from external data.
* **Sensitive-data exclusions:** Guide automatic extraction away from specified categories of information that should not be kept in long-term memory.
* **Relevant retrieval:** Search long-term memory using semantic, keyword, or hybrid search.
* **Multi-session recall:** Retrieve relevant memories across conversations and filter results by owner, session, namespace, topic, or memory type.
* **Custom memory types:** Define memory types for your business domain, with structured fields and instructions that control what Redis Agent Memory extracts.

## Two-tier memory model

Redis Agent Memory provides two memory tiers:

<div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
  <div class="p-5 border border-redis-pen-300 rounded-lg">
    <h3 class="text-redis-ink-900 font-semibold mb-3">Session memory</h3>
    <p>Stores the ordered events and metadata for a conversation.</p>
    <ul class="space-y-2">
      <li><strong>Configurable retention:</strong> Set a TTL to control how long session events are retained.</li>
      <li><strong>Automatic summarization:</strong> Condense older events after a configured threshold while retaining recent events in full, reducing the conversation history sent to the model's context window.</li>
    </ul>
  </div>
  <div class="p-5 border border-redis-pen-300 rounded-lg">
    <h3 class="text-redis-ink-900 font-semibold mb-3">Long-term memory</h3>
    <p>Stores durable information that can be retrieved across sessions using semantic, keyword, or hybrid search.</p>
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
    <p>Stores domain-specific information in a custom <code>trip_preference</code> type with fields such as <code>destination</code>, <code>travel_period</code>, and <code>dietary_requirement</code>.</p>
  </div>
</div>

## Get started with Redis Agent Memory {#get-started}

Get started with Redis Agent Memory on Redis Cloud or join the private preview for Redis Software.

<div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
  <div class="p-5 border border-redis-pen-300 rounded-lg">
    <h3 class="text-redis-ink-900 font-semibold mb-3">Redis Cloud</h3>
    <p>Create a managed Redis Agent Memory service and make your first requests.</p>
    <p><a href="{{< relref "/operate/iris/agent-memory/create-service" >}}">Open the Redis Cloud setup guide</a></p>
  </div>
  <div class="p-5 border border-redis-pen-300 rounded-lg">
    <h3 class="text-redis-ink-900 font-semibold mb-3">Redis Software private preview</h3>
    <p>Deploy Redis Agent Memory on Kubernetes with Redis Software.</p>
    <p><a href="{{< relref "/operate/iris/agent-memory/self-managed" >}}">Open the self-managed deployment guide</a></p>
  </div>
</div>

### Choose a quickstart

After your Redis Agent Memory service is ready, choose a client. Each quickstart follows the same travel planning scenario through session memory, automatic extraction, summarization, custom memory types, and sensitive-data exclusions.

<div class="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
  <div class="p-5 border border-redis-pen-300 rounded-lg">
    <h3 class="text-redis-ink-900 font-semibold mb-3">Python SDK</h3>
    <p>Explore the Redis Agent Memory workflow with the Python SDK.</p>
    <p><a href="{{< relref "/develop/ai/context-engine/agent-memory/python-sdk-quickstart" >}}">Open the Python quickstart</a></p>
  </div>
  <div class="p-5 border border-redis-pen-300 rounded-lg">
    <h3 class="text-redis-ink-900 font-semibold mb-3">TypeScript SDK</h3>
    <p>Explore the Redis Agent Memory workflow with the TypeScript SDK.</p>
    <p><a href="{{< relref "/develop/ai/context-engine/agent-memory/typescript-sdk-quickstart" >}}">Open the TypeScript quickstart</a></p>
  </div>
  <div class="p-5 border border-redis-pen-300 rounded-lg">
    <h3 class="text-redis-ink-900 font-semibold mb-3">REST API</h3>
    <p>Explore the Redis Agent Memory workflow with <code>curl</code>.</p>
    <p><a href="{{< relref "/develop/ai/context-engine/agent-memory/rest-api-quickstart" >}}">Open the REST API quickstart</a></p>
  </div>
</div>

For shared integration concepts, identifiers, and authentication, see the [Redis Agent Memory developer guide]({{< relref "/develop/ai/context-engine/agent-memory/developer-guide" >}}).
