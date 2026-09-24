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
  {{< image-card image="images/ai-brain.svg" alt="Concepts icon" title="Concepts — Understand the memory model" url="/develop/ai/context-engine/agent-memory/concepts" >}}
  {{< image-card image="images/ai-cube.svg" alt="Quickstart icon" title="Quickstart — Make your first requests" url="/develop/ai/context-engine/agent-memory/quickstart" >}}
  {{< image-card image="images/ai-lib.svg" alt="Developer guide icon" title="Developer guide — Add memory to your application" url="/develop/ai/context-engine/agent-memory/developer-guide" >}}
  {{< image-card image="images/ai-LLM-memory.svg" alt="Sessions icon" title="Sessions — Store conversation events" url="/develop/ai/context-engine/agent-memory/sessions" >}}
  {{< image-card image="images/ai-brain-2.svg" alt="Long-term memory icon" title="Long-term memory — Recall information across conversations" url="/develop/ai/context-engine/agent-memory/long-term-memory" >}}
  {{< image-card image="images/ai-semantic-routing.svg" alt="Namespaces icon" title="Namespaces — Organize your memories" url="/develop/ai/context-engine/agent-memory/namespaces" >}}
</div>

## Why use Redis Agent Memory?

* **Context-aware conversations:** Store ordered conversation events with their actor, role, timestamp, and metadata, then retrieve them by session ID. Configure session expiration to control how long the conversation is retained.
* **Automatic session summarization:** Automatically summarize older conversation events while retaining recent messages in full.
* **Automatic long-term memory:** Automatically extract durable information from session events in the background. You can also create long-term memories directly from external data.
* **Sensitive-data exclusions:** Guide automatic extraction away from information that should not be kept in long-term memory.
* **Relevant retrieval:** Search long-term memory semantically and narrow results with filters.
* **Multi-session recall:** Retrieve relevant memories across conversations and filter results by owner, session, namespace, topic, or memory type.
* **Custom memory types:** Define memory types for your business domain, with structured fields and instructions that control what Redis Agent Memory extracts.

## Two-tier memory model

Session memory keeps the current conversation available to the agent. Long-term memory preserves useful information across conversations. See [Concepts]({{< relref "/develop/ai/context-engine/agent-memory/concepts" >}}) for an overview of both and the optional namespaces that organize them.

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

### Follow the quickstart

After your service is ready, follow the [quickstart]({{< relref "/develop/ai/context-engine/agent-memory/quickstart" >}}). Choose Python, TypeScript, or curl to explore the same travel planning scenario.

## Explore the documentation

* [Concepts]({{< relref "/develop/ai/context-engine/agent-memory/concepts" >}}): Understand session memory, long-term memory, and namespaces.
* [Quickstart]({{< relref "/develop/ai/context-engine/agent-memory/quickstart" >}}): Store a conversation and recall an extracted memory.
* [Developer guide]({{< relref "/develop/ai/context-engine/agent-memory/developer-guide" >}}): Put the pieces together in an application.
* [Sessions]({{< relref "/develop/ai/context-engine/agent-memory/sessions" >}}): Store conversation events and configure retention and summarization.
* [Long-term memory]({{< relref "/develop/ai/context-engine/agent-memory/long-term-memory" >}}): Create and retrieve memories across conversations, including custom memory types.
* [Namespaces]({{< relref "/develop/ai/context-engine/agent-memory/namespaces" >}}): Organize memories and manage namespace hierarchies.

* [API reference]({{< relref "/develop/ai/context-engine/agent-memory/api-reference" >}}): Look up request and response schemas.
