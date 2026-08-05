---
title: Redis Iris context engine
description: Deploy and operate Redis Iris services, including Redis Agent Memory and Context Retriever, on your own infrastructure.
linkTitle: Redis Iris context engine
alwaysopen: false
categories:
- docs
- operate
- iris
hideListLinks: true
weight: 45
---

Give your AI agents the context layer they need to act reliably on business data, deployed on your own infrastructure.

Redis Iris is a suite of AI context services built on Redis. Two of the services, Redis Agent Memory and Context Retriever, are available for self-hosting so you can run them on your own infrastructure while keeping full control of your data. All services are also available as fully managed on [Redis Cloud]({{< relref "/operate/rc/context-engine" >}}).

<div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
  {{< image-card image="images/ai-brain.svg" alt="Redis Agent Memory icon" title="Redis Agent Memory" url="/operate/iris/agent-memory" description="Deploy and operate Redis Agent Memory on your own infrastructure." >}}
  {{< image-card image="images/ai-cube.svg" alt="Context Retriever icon" title="Context Retriever" url="/develop/ai/context-engine/context-retriever" description="Self-hostable. Define your data model once and generate the tools agents call at runtime." >}}
</div>

## Self-hosted Redis Iris services

### Redis Agent Memory

[Redis Agent Memory]({{< relref "/develop/ai/context-engine/agent-memory" >}}) gives AI agents a persistent, structured memory layer using a two-tier model:

- **Session memory**: Holds the current conversation state with configurable TTL-based expiration.
- **Long-term memory**: Stores information extracted from past sessions as text with vector embeddings for semantic retrieval.

Redis Agent Memory is available through Python and TypeScript SDKs and a REST API. You can self-host it on your own infrastructure or use it as a fully managed service on Redis Cloud.

[Open the self-managed Redis Agent Memory documentation]({{< relref "/operate/iris/agent-memory/self-managed" >}})

### Context Retriever

[Context Retriever]({{< relref "/develop/ai/context-engine/context-retriever" >}}) turns your business data into structured tools that AI agents can reliably call at runtime. You define your data model once by specifying the entities and fields your agents need, and Context Retriever automatically generates the retrieval tools. Agents never access your database directly.

**Key benefits:**

- **Define once, reuse everywhere**: Business context is captured once and shared across all agents.
- **Automatic tool generation**: Tools are generated from your data model, not hand-coded per agent.
- **Controlled access**: Each agent requires a key, and access tags filter what data each agent can see.

Context Retriever is self-hostable or available as a fully managed service on Redis Cloud.

[Install Context Retriever]({{< relref "/develop/ai/context-engine/context-retriever/install" >}})

## Also available on Redis Cloud

All Redis Iris services, including LangCache and Data Integration, are available as fully managed services on Redis Cloud with no infrastructure to set up or maintain.

[Redis Iris on Redis Cloud]({{< relref "/operate/rc/context-engine" >}})
