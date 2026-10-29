---
alwaysopen: false
categories:
- docs
- develop
- ai
description: See which parts of the Redis Iris stack answer which kind of question, from routing to approved answers, memory, and governed tools.
hideListLinks: true
linktitle: Request flow
title: How a request flows through Redis Iris
weight: 6
---

{{< iris-request-flow >}}

Select one of Maya's questions to see which parts of the stack answer it. Each question passes through Intent Router, then goes to the component, or components, it needs. The questions come from the [Redis Iris interactive demo](/content/develop/ai/context-engine/concepts/interactive-demo.md).

[How Redis Iris works]({{< relref "/develop/ai/context-engine/concepts" >}}) covers the mental model. This page traces the same idea through an actual request, capability by capability.

Every capability in Iris manages the same limited resource: the model's context window. Agent Playbooks returns an approved answer, or a skill preview the agent expands only when it needs the full procedure. Agent Memory decides what's worth keeping from a conversation. Context Gateway returns the result of one tool call instead of a raw query result, and holds large results as handles. Treat "what goes into the next model call" as a budget. Manage it actively. It doesn't take care of itself once a request reaches Iris.

These capabilities aren't a fixed sequence. A request can draw on any combination of them before a model call happens: Intent Router to choose the agent, tool, or workflow that handles the message, [Agent Playbooks]({{< relref "/develop/ai/context-engine/agent-playbook" >}}) for published answers and procedures, [Agent Memory]({{< relref "/develop/ai/context-engine/agent-memory" >}}) for session and long-term recall, and [Context Gateway]({{< relref "/develop/ai/context-engine/context-gateway" >}}) for tool calls to your business data and other systems.

Context Gateway gives the agent one Model Context Protocol (MCP) endpoint for every tool it's allowed to call. Behind that endpoint are the Gateway's Upstreams: MCP servers you register, and Context Surfaces that generate search tools from a data model over your Redis data. The agent never connects to those systems directly. It calls a tool through the Gateway, and the Gateway sends the call to the Upstream that serves it. In search mode, the agent finds tools with `search_tools` and runs them with `run_tool`, instead of loading every tool into its context.

[Lens]({{< relref "/develop/ai/context-engine/lens" >}}) traces each of these steps, and Agent Mesh keeps the response stream resumable if the client disconnects. Neither supplies context to the model call, so they work alongside every request rather than answering it.
<!-- TODO: link Intent Router to /develop/ai/context-engine/intent-router when intent-router-docs-align merges into iris-ga-docs. -->
<!-- TODO: link Agent Mesh to /develop/ai/context-engine/agent-mesh when codex/agent-mesh-preview-docs merges into iris-ga-docs. -->

## Two things Iris changes

**Isolation is about meaning, not just timing.** Multiple agents or users often share Iris. The conflict that matters usually isn't two writes touching the same record at the same instant. It's two agents writing similar-but-different memories about the same user, or two near-duplicate playbook entries competing to answer the same class of question. Both writes can be individually valid and still disagree with each other. Scoping every write and lookup by user, session, and data type prevents this. Treat those scoping identifiers as carefully as you'd treat any other access boundary in your application.

**Trust follows the agent, not the data source.** Application code is trusted by default, and the database enforces permissions at the boundary between code and data. An agent complicates that. Its next action can be shaped by content it's processing, such as a retrieved document or a tool's own output. You don't fully control that content. Assume anything an agent reads can influence what it does next. Design the tools and memory it can reach with that in mind. Don't trust content just because a trusted code path read it.

## Next steps

- [Agent Playbooks concepts]({{< relref "/develop/ai/context-engine/agent-playbook/concepts" >}})
- [Agent Memory overview]({{< relref "/develop/ai/context-engine/agent-memory/overview" >}})
- [Context Gateway concepts]({{< relref "/develop/ai/context-engine/context-gateway/concepts" >}})
- An [interactive demo]({{< relref "/develop/ai/context-engine/agent-memory/interactive-demo" >}}) of Agent Memory that runs in your browser
