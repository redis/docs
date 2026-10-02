---
title: Diagram 3D scratch
description: Temporary page for previewing the experimental 3D request-flow diagram
linkTitle: Diagram 3D scratch
---

Experimental 3D version of the request-flow diagram:

{{< diagram-3d script="iris-request-flow-3d" alt="Interactive 3D diagram of how a request flows through Redis Iris." >}}
An agent sends a prompt, which can draw on any combination of three capabilities before the model call:

- **LangCache** checks whether a similar prompt is already cached. On a cache hit, it returns the cached response directly, skipping the model call.
- **Agent Memory** recalls session history and long-term facts about the user or task.
- **Context Retriever** calls governed tools over the Model Context Protocol (MCP) to fetch the business data the agent needs. **Data Integration** keeps that data fresh by capturing changes from your source database and streaming them into Redis.

The model call generates the response that returns to the caller. The app then writes a session event back to Agent Memory.
{{< /diagram-3d >}}

The original 2D version, for comparison:

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
