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

Redis Agent Memory is a memory service for AI Agents available as a REST API and client libraries. It provides the persistent, structured memory layer that intelligent agents need to store, retrieve, and manage contextual data across interactions. Rather than requiring developers to build custom memory infrastructure from scratch, Redis Agent Memory offers a turnkey solution with dedicated endpoints, secure API key management, configurable memory schemas, and automatic TTL-based lifecycle management.

[Get started](#get-started) with Redis Agent Memory on Redis Cloud, join the private preview, or set up your own Redis Agent Memory instance.

## Redis Agent Memory overview

Redis Agent Memory uses a two-tier memory model:

- **Session memory** (also known as **Short-term memory** or **Working memory**) maintains the current conversation state, session history, and session-specific metadata. You can set a custom time-to-live (TTL) for session memory to control how long session data is retained.
- **Long-term memory** stores information extracted from past sessions, including user preferences, learned patterns, and other relevant data.

The promotion from short term memory to long-term memory is automatic. When you store a conversation event in session memory, the Agent Memory Server asynchronously extracts important information using the configured extraction strategy (discrete, summary, preferences, or custom). These extracted memories are then stored as long-term memory entries with vector embeddings and metadata.

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
