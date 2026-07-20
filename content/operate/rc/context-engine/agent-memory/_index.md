---
alwaysopen: true
categories:
- docs
- operate
- rc
description: Store agent memory for AI applications in Redis Cloud.
hideListLinks: true
linktitle: Agent Memory
title: Redis Agent Memory on Redis Cloud
weight: 36
bannerText: Redis Agent Memory on Redis Cloud is currently available as a public preview. Features and behavior are subject to change.
bannerChildren: true
---

Redis Agent Memory is a memory service for AI Agents available as a REST API and Python SDK. It provides the persistent, structured memory layer that intelligent agents need to store, retrieve, and manage contextual data across interactions. Rather than requiring developers to build custom memory infrastructure from scratch, Redis Agent Memory offers a turnkey solution with dedicated endpoints, secure API key management, configurable memory schemas, and automatic TTL-based lifecycle management.

## Redis Agent Memory overview

Redis Agent Memory uses a two-tier memory model:

- **Session memory** (also known as **short-term** or **working memory**) maintains the current conversation state, session history, and session-specific metadata. You can set a custom time-to-live (TTL) to control how long session data is retained.
- **Long-term memory** stores information extracted from past sessions, such as user preferences and learned patterns, as text with vector embeddings for semantic retrieval.

Promotion from short-term to long-term memory happens automatically. When you store a conversation event in session memory, the Agent Memory Server asynchronously extracts important information using the configured extraction strategy (discrete, summary, preferences, or custom) and stores it as long-term memory. The process is non-blocking, so agent interactions remain responsive. Short-term memory that is not promoted expires based on its TTL. You can also create long-term memories directly through the API for bulk creation or to import knowledge from external sources.

For more details, see the [Redis Agent Memory overview]({{< relref "/develop/ai/context-engine/agent-memory" >}}).

## Get started with Agent Memory on Redis Cloud

{{< embed-md "rc-agent-memory-get-started.md" >}}
