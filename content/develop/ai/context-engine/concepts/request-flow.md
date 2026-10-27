---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Trace how a single agent request draws on Redis Iris's caching, memory, and retrieval capabilities before a model call.
hideListLinks: true
linktitle: Request flow
title: How a request flows through Redis Iris
weight: 6
---

[How Redis Iris works]({{< relref "/develop/ai/context-engine/concepts" >}}) covers the mental model. This page traces the same idea through an actual request, capability by capability.

Every capability in Iris manages the same limited resource: the model's context window. Agent Playbooks returns an approved answer, or a skill preview the agent expands only when it needs the full procedure. Agent Memory decides what's worth keeping from a conversation. Context Gateway returns the result of one tool call instead of a raw query result, and holds large results as handles. Treat "what goes into the next model call" as a budget. Manage it actively. It doesn't take care of itself once a request reaches Iris.

These capabilities aren't a fixed sequence. A request can draw on any combination of them before a model call happens: Intent Router to choose the agent, tool, or workflow that handles the message, [Agent Playbooks]({{< relref "/develop/ai/context-engine/agent-playbook" >}}) for published answers and procedures, [Agent Memory]({{< relref "/develop/ai/context-engine/agent-memory" >}}) for session and long-term recall, and [Context Gateway]({{< relref "/develop/ai/context-engine/context-gateway" >}}) for tool calls to your Model Context Protocol (MCP) servers and your business data. [Data Integration]({{< relref "/develop/ai/context-engine/data-integration" >}}) runs in the background, keeping that business data fresh for Context Gateway to query.

[Lens]({{< relref "/develop/ai/context-engine/lens" >}}) traces each of these steps, and Agent Mesh keeps the response stream resumable if the client disconnects. Neither supplies context to the model call, so the diagram leaves them out.
<!-- TODO: link Intent Router to /develop/ai/context-engine/intent-router when intent-router-docs-align merges into iris-ga-docs. -->
<!-- TODO: link Agent Mesh to /develop/ai/context-engine/agent-mesh when codex/agent-mesh-preview-docs merges into iris-ga-docs. -->

Select a node in the diagram for a description of what that capability does, with a link to its docs. Select a scenario button to trace the path a request takes.

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
    intentRouter:
        label: "Intent Router"
        type: process
        col: 1
        row: 1
        description: |
            Intent Router: matches the message to an intent you defined and returns its target, such as the agent, tool, or workflow that handles it. No model call decides the route, and your application dispatches.
    playbooks:
        label: "Playbook match?"
        type: decision
        col: 2
        row: 0
        description: |
            Agent Playbooks: matches the task against published FAQs and skills. A skill match returns a preview, and the agent loads the full procedure before the model call.
        links:
            concepts:
                label: "Concepts"
                url: "/develop/ai/context-engine/agent-playbook/concepts"
        docsUrl: "/develop/ai/context-engine/agent-playbook"
    agentMemory:
        label: "Agent Memory"
        type: process
        col: 2
        row: 1
        description: |
            Agent Memory: session and long-term recall. Recalls session history and long-term facts about the user or task.
        links:
            demo:
                label: "Interactive demo"
                url: "/develop/ai/context-engine/agent-memory/interactive-demo"
        docsUrl: "/develop/ai/context-engine/agent-memory"
    contextGateway:
        label: "Context Gateway"
        type: process
        col: 2
        row: 2
        description: |
            Context Gateway: tool calls through one endpoint. Calls the tools of MCP servers and Context Surfaces to fetch the business data the agent needs. For tools you opt in, the result cache returns the stored result of an identical call.
        links:
            resultCache:
                label: "Result cache"
                url: "/develop/ai/context-engine/context-gateway/concepts#result-cache"
        docsUrl: "/develop/ai/context-engine/context-gateway"
    dataIntegration:
        label: "Data Integration"
        type: process
        col: 1
        row: 3
        description: |
            Data Integration: keeps business data fresh. Streams changes from source databases into the data layer Context Gateway queries.
        docsUrl: "/develop/ai/context-engine/data-integration"
    publishedAnswer:
        label: "Published answer"
        type: terminal
        col: 3
        row: 0
        description: |
            Return the published answer: on a FAQ match, the agent returns the answer your business approved, skipping the model call.
    modelCall:
        label: "Model call"
        type: process
        col: 3
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
        col: 4
        row: 1
        description: |
            The final response returned to the caller.
edges:
    e0:
        from: agent
        to: intentRouter
        kind: normal
        path: "faqMatch,memory,context"
    e1:
        from: intentRouter
        to: playbooks
        kind: normal
        path: faqMatch
    e2:
        from: playbooks
        to: publishedAnswer
        kind: branch
        path: faqMatch
    e3:
        from: intentRouter
        to: agentMemory
        kind: normal
        path: memory
    e4:
        from: agentMemory
        to: modelCall
        kind: normal
        path: memory
    e5:
        from: intentRouter
        to: contextGateway
        kind: normal
        label: "MCP"
        path: context
    e6:
        from: dataIntegration
        to: contextGateway
        kind: normal
        path: context
    e7:
        from: contextGateway
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
    faqMatch:
        label: "FAQ match: fastest"
        description: |
            Agent Playbooks finds a published FAQ that matches the task, and the agent returns its answer directly. No model call generates the answer, so this path is the fastest and adds no generation cost.
    memory:
        label: "Needs memory: recalls session or long-term info"
        description: |
            For a question that depends on earlier turns or what's known about the user, Agent Memory supplies that recall before the model call.
    context:
        label: "Needs business data: retrieves via Context Gateway"
        description: |
            For a question that depends on live business data, Context Gateway calls tools to fetch it before the model call. Data Integration keeps that data fresh.
```

## Two things Iris changes

**Isolation is about meaning, not just timing.** Multiple agents or users often share Iris. The conflict that matters usually isn't two writes touching the same record at the same instant. It's two agents writing similar-but-different memories about the same user, or two near-duplicate playbook entries competing to answer the same class of question. Both writes can be individually valid and still disagree with each other. Scoping every write and lookup by user, session, and data type prevents this. Treat those scoping identifiers as carefully as you'd treat any other access boundary in your application.

**Trust follows the agent, not the data source.** Application code is trusted by default, and the database enforces permissions at the boundary between code and data. An agent complicates that. Its next action can be shaped by content it's processing, such as a retrieved document or a tool's own output. You don't fully control that content. Assume anything an agent reads can influence what it does next. Design the tools and memory it can reach with that in mind. Don't trust content just because a trusted code path read it.

## Next steps

- [Agent Playbooks concepts]({{< relref "/develop/ai/context-engine/agent-playbook/concepts" >}})
- [Agent Memory overview]({{< relref "/develop/ai/context-engine/agent-memory/overview" >}})
- [Context Gateway concepts]({{< relref "/develop/ai/context-engine/context-gateway/concepts" >}})
- An [interactive demo]({{< relref "/develop/ai/context-engine/agent-memory/interactive-demo" >}}) of Agent Memory that runs in your browser
