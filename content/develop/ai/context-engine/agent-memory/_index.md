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
---

Give your AI agents persistent memory and context that gets smarter over time.

Transform your AI agents from simple chatbots into intelligent assistants with Redis-powered memory that automatically learns, organizes, and recalls information across conversations and sessions.

<div class="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
  {{< image-card image="images/ai-brain.svg" alt="Quick start icon" title="Quick Start — Get up and running in 5 minutes with our step-by-step Cloud setup guide" url="/operate/rc/context-engine/agent-memory/create-service" >}}
  {{< image-card image="images/ai-LLM-memory.svg" alt="Use cases icon" title="API and SDK Examples — See real-world usage patterns with session events and long-term memory" url="/develop/ai/context-engine/agent-memory/api-examples" >}}
  {{< image-card image="images/ai-brain-2.svg" alt="Python SDK icon" title="Python SDK — Install the redis-agent-memory package from PyPI" url="https://pypi.org/project/redis-agent-memory/" >}}
</div>

## What is Redis Agent Memory?

Redis Agent Memory is a production-ready memory system for AI agents and applications that:

<ul class="my-4 space-y-2">
  <li class="flex gap-3"><span class="text-redis-red-500 font-bold mt-0.5">&#9679;</span><span><strong>Remembers everything</strong> — Stores conversation history, user preferences, and important facts across sessions</span></li>
  <li class="flex gap-3"><span class="text-redis-red-500 font-bold mt-0.5">&#9679;</span><span><strong>Finds relevant context</strong> — Uses semantic, keyword, and hybrid search to surface the right information at the right time</span></li>
  <li class="flex gap-3"><span class="text-redis-red-500 font-bold mt-0.5">&#9679;</span><span><strong>Gets smarter over time</strong> — Automatically extracts, organizes, and deduplicates memories from interactions</span></li>
  <li class="flex gap-3"><span class="text-redis-red-500 font-bold mt-0.5">&#9679;</span><span><strong>Works with any AI model</strong> — REST API and Python SDK compatible with any agent framework or LLM provider</span></li>
</ul>

## Why use Redis Agent Memory?

<div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
  <div class="p-5 border border-redis-pen-300 rounded-lg">
    <h3 class="text-redis-ink-900 font-semibold mb-3">For AI applications</h3>
    <ul class="space-y-1 text-redis-pen-600">
      <li>Never lose conversation context across sessions</li>
      <li>Provide personalized responses based on user history</li>
      <li>Build agents that learn and improve from interactions</li>
      <li>Scale from prototypes to production with authentication and multi-tenancy</li>
    </ul>
  </div>
  <div class="p-5 border border-redis-pen-300 rounded-lg">
    <h3 class="text-redis-ink-900 font-semibold mb-3">For developers</h3>
    <ul class="space-y-1 text-redis-pen-600">
      <li>Drop-in REST API — no custom infrastructure to build or maintain</li>
      <li>Python SDK with tool abstractions for OpenAI and Anthropic</li>
      <li>Automatic memory extraction and promotion in the background</li>
      <li>Flexible deployment: Redis Cloud, Redis Software, or self-hosted</li>
    </ul>
  </div>
</div>

## Quick example

Add a session event to short-term memory:

```json
POST /v1/stores/{storeId}/session-memory/events
{
    "sessionId": "abcd-efgh",
    "actorId": "user-name",
    "role": "USER",
    "content": [
        {
            "text": "I'm planning a trip to Japan next month."
        }
    ],
    "createdAt": "2026-05-02T18:15:06Z",
    "metadata": {
        "browser": "Chrome",
        "source": "web-chat"
    }
}
```

Add long-term memories directly:

```json
POST /v1/stores/{storeId}/long-term-memory
{
    "memories": [
        {
            "id": "cofIXpuMmg",
            "text": "The user prefers vegetarian food.",
            "memoryType": "episodic",
            "sessionId": "abcd-efgh",
            "ownerId": "user-name"
        }
    ]
}
```

See the full [API and SDK examples]({{< relref "/develop/ai/context-engine/agent-memory/api-examples" >}}) for more.

## Two-tier memory model

Redis Agent Memory uses a two-tier memory model:

- **Session memory** (also known as **Short-term memory** or **Working memory**) maintains the current conversation state, session history, and session-specific metadata. You can set a custom time-to-live (TTL) for session memory to control how long session data is retained.
- **Long-term memory** stores information extracted from past sessions, including user preferences, learned patterns, and other relevant data.

The promotion from short term memory to long-term memory is automatic. When you store a conversation event in session memory, the Agent Memory service asynchronously extracts important information using the configured extraction strategy (discrete, summary, preferences, or custom). These extracted memories are then stored as long-term memory entries with vector embeddings and metadata.

This process is non-blocking: the extraction and promotion happen in the background using a task worker, so the main agent interaction remains responsive. Users do not need to explicitly trigger promotion; it happens as a natural byproduct of storing conversation events in working memory.
Users can also create long-term memories directly using the API. This is useful for bulk memory creation or for importing knowledge from external sources.

The short-term memory that is not promoted will eventually expire based on its TTL configuration. As a conversation progresses, Redis Agent Memory extracts and asynchronously stores important information into long-term memory. This process ensures responsive interactions while knowledge gradually accumulates.

### Example: Memory storage during a conversation

Take this conversation between a User and an AI Travel Agent as an example:

```text
User: I'm planning a trip to Japan next month and need help finding some restaurants for the trip.
Agent: Nice! What cities are you visiting?
User: I'm going to Tokyo and Kyoto. Also, I'm a vegetarian.
Agent: Good to know! I'll help you find some vegetarian-friendly restaurants in Tokyo and Kyoto.
```

For this conversation, you could store the following information with Redis Agent Memory:
- Session Memory: The current conversation state, including the user's query, the agent's response, and the user's follow-up question. The session memory also stores session-specific metadata. 
- Long-term memory: Preference and location information from the conversation, stored as text and as vector embeddings for semantic retrieval. In this case, long-term memory might store "The user is a vegetarian" and "The user is planning a trip to Japan". 

## Get started with Redis Agent Memory {#get-started}

Get started with Redis Agent Memory on Redis Cloud, join the private preview for Redis Software, or set up your own open-source Redis Agent Memory instance.

{{< multitabs id="agent-memory-get-started"
    tab1="Redis Cloud"
    tab2="Redis Software (private preview)"
    tab3="Open source" >}}

{{< embed-md "rc-agent-memory-get-started.md" >}}

-tab-sep-

Contact your Redis representative or [contact sales](https://redis.io/contact/) to join the private preview on Redis Software.

-tab-sep-

The open-source version of Redis Agent Memory is [available on GitHub](https://github.com/redis/agent-memory-server). See [Redis Agent Memory server](https://redis.github.io/agent-memory-server/) for comprehensive docs, quick start guides, and API references.

{{< /multitabs >}}
