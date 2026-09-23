---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Learn how familiar Redis patterns work differently in Redis Iris, and what's new for building AI agents.
hideListLinks: true
linktitle: Concepts
title: Redis Iris concepts
weight: 5
---

Redis Iris reuses Redis primitives you likely already know, but not all of your existing assumptions carry over. This page covers the shifts that apply across the three request-time services: LangCache, Agent Memory, and Context Retriever. Each also has its own concepts page for what's specific to it: [LangCache]({{< relref "/develop/ai/context-engine/langcache/concepts" >}}), [Agent Memory]({{< relref "/develop/ai/context-engine/agent-memory/overview" >}}), and [Context Retriever]({{< relref "/develop/ai/context-engine/context-retriever/concepts" >}}). Data Integration is a background data-sync pipeline rather than a request-time service, so the diagram below includes it for a complete picture, but it isn't covered in the shifts on this page.

## Context is a budget, not a store

Every service in Iris exists to manage a resource that's smaller than it looks: the model's context window. Agent Memory decides what's worth keeping and summarizes the rest. LangCache avoids spending a model call at all when a similar one already ran. Context Retriever returns exactly the data a tool call needs, not a raw query result. Treat "what goes into the next model call" as a budget you're actively managing at every layer, not something that takes care of itself once you've wired up the right service.

LangCache, Agent Memory, Context Retriever, and Data Integration aren't a fixed sequence: they're a layer of services a request can draw on, in whatever combination it needs, before a model call happens.

In the diagram below, you can select a node for a description of what that service does, with a link to its docs. Select a scenario button to trace the path a request takes.

```context-map {id="iris-request-flow" scope="context-engine"}
id: iris-request-flow
scope: context-engine
nodes:
    agent:
        label: "Agent"
        type: process
        col: 0
        row: 1
        description: |
            The calling application or AI agent that sends a prompt.
        docsUrl: "/develop/ai/agent-builder"
    langcache:
        label: "LangCache hit?"
        type: decision
        col: 1
        row: 0
        description: |
            LangCache: checks whether a similar prompt is already cached before calling the model.
        docsUrl: "/develop/ai/context-engine/langcache"
    agentMemory:
        label: "Agent Memory"
        type: process
        col: 1
        row: 1
        description: |
            Agent Memory: session and long-term recall. Recalls session history and long-term facts about the user or task.
        docsUrl: "/develop/ai/context-engine/agent-memory"
    contextRetriever:
        label: "Context Retriever"
        type: process
        col: 1
        row: 2
        description: |
            Context Retriever: governed tool calls. Calls governed, schema-first tools to fetch business data the agent needs.
        docsUrl: "/develop/ai/context-engine/context-retriever"
    dataIntegration:
        label: "Data Integration"
        type: process
        col: 0
        row: 3
        description: |
            Data Integration: keeps business data fresh. Streams changes from source databases into the data layer Context Retriever queries.
        docsUrl: "/develop/ai/context-engine/data-integration"
    cachedResponse:
        label: "Cached response"
        type: terminal
        col: 2
        row: 0
        description: |
            Return cached response: on a cache hit, LangCache returns the stored response directly, skipping the model call.
    modelCall:
        label: "Model call"
        type: process
        col: 2
        row: 1
        description: |
            The model generates a response using the retrieved context.
        links:
            googleAdk:
                label: "Google ADK"
                url: "/integrate/google-adk"
            bedrock:
                label: "Amazon Bedrock"
                url: "/integrate/amazon-bedrock"
            langchain:
                label: "LangChain"
                url: "/integrate/langchain-redis"
            ecosystem:
                label: "More integrations"
                url: "/develop/ai/ecosystem-integrations"
    response:
        label: "Response"
        type: terminal
        col: 3
        row: 1
        description: |
            The final response returned to the caller.
edges:
    e1:
        from: agent
        to: langcache
        kind: normal
        path: cacheHit
    e2:
        from: langcache
        to: cachedResponse
        kind: branch
        path: cacheHit
    e3:
        from: agent
        to: agentMemory
        kind: normal
        path: memory
    e4:
        from: agentMemory
        to: modelCall
        kind: normal
        path: memory
    e5:
        from: agent
        to: contextRetriever
        kind: normal
        label: "MCP"
        path: context
    e6:
        from: dataIntegration
        to: contextRetriever
        kind: normal
        path: context
    e7:
        from: contextRetriever
        to: modelCall
        kind: normal
        path: context
    e8:
        from: modelCall
        to: response
        kind: normal
        path: "memory,context"
    e9:
        from: response
        to: agentMemory
        kind: loopback
        route: top
        label: "App writes session event"
        path: "memory,context"
paths:
    cacheHit:
        label: "Cache hit: fastest"
        description: |
            LangCache finds a similar prompt already cached and returns it directly. No model call, so this path is the fastest and adds no LLM cost.
    memory:
        label: "Needs memory: recalls session or long-term info"
        description: |
            For a question that depends on earlier turns or what's known about the user, Agent Memory supplies that recall before the model call.
    context:
        label: "Needs business data: retrieves via Context Retriever"
        description: |
            For a question that depends on live business data, Context Retriever calls governed tools to fetch it before the model call. Data Integration keeps that data fresh.
```

## State isolation is semantic, not just structural

If you've built concurrent systems before, you're used to races being structural: two writers touching the same key, resolved with a lock or a transaction. When multiple agents or multiple users share Redis Iris services, the races that matter are often semantic instead: two agents writing similar-but-different memories about the same user, or two near-duplicate cache entries competing to answer the same class of question. Locking a key doesn't prevent this. Scoping by user, namespace, and memory or entry type does. Design your scoping keys (owner ID, namespace, session ID) as carefully as you'd design a lock strategy in a traditional concurrent system.

## Trust boundaries move to where the agent acts, not where data is stored

In a traditional application, the trust boundary is usually the database: application code is trusted, external input is not, and the database enforces permissions at the boundary between them. An agent complicates this, because the agent's next action can be influenced by content it's processing, such as a retrieved document, a summarized conversation, or a tool's own output, none of which you fully control. Context Retriever's governed tool-calling model exists specifically because "trusted code, untrusted data" breaks down once the code's next step is chosen by a model reading that data. Assume anything an agent reads can shape what it does next, and design the tools and memory it can reach accordingly.

## Further reading

- [Getting Started with Redis Iris](https://redis.io/tutorials/getting-started-with-redis-iris/): a hands-on walkthrough of LangCache, Agent Memory, and Context Retriever.
- [Long-horizon AI agents: memory & state infrastructure](https://redis.io/blog/long-horizon-ai-agents-memory-state-infrastructure/): failure modes specific to agents that run longer than a single request.
- [Agent memory as a moat: how context compounds](https://redis.io/blog/compounding-context-memory-as-the-moat/): governance and retention tradeoffs as context accumulates across services.
- [AI agent context engine FAQ](https://redis.io/blog/faq-real-time-context-engine-agent-memory-and-retrieval/): build-vs-buy, vendor-comparison, and "isn't this overkill" questions this page doesn't cover.

## Next steps

- [LangCache concepts]({{< relref "/develop/ai/context-engine/langcache/concepts" >}})
- [Agent Memory overview]({{< relref "/develop/ai/context-engine/agent-memory/overview" >}})
- [Context Retriever concepts]({{< relref "/develop/ai/context-engine/context-retriever/concepts" >}})
