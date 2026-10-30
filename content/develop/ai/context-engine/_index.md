---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Redis Iris is a suite of managed and self-managed services that give your customers accurate, consistent experiences with your AI agents by providing memories, approved answers, governed access to business data, and turn-by-turn tracing.
hideListLinks: true
linktitle: Redis Iris context engine
title: Redis Iris context engine
weight: 30
---

{{< iris-demo preview="true" >}}

Redis Iris eliminates the infrastructure burden of building context-aware AI agents.

<div class="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
  {{< tile-card icon="images/dev/icons/icon-redis-iris-64-duotone.png" title="Concepts" description="What happens when an agent asks Redis Iris for context" url="/develop/ai/context-engine/concepts" >}}
  {{< tile-card icon="images/dev/icons/icon-redis-agent-memory-64-duotone.png" title="Agent Memory" description="Persistent short-term and long-term memory across agent interactions" url="/develop/ai/context-engine/agent-memory" >}}
  {{< tile-card icon="images/dev/icons/icon-redis-iris-64-duotone.png" title="Context Gateway" description="One MCP endpoint for the tools of any MCP server and your Redis data" url="/develop/ai/context-engine/context-gateway" >}}
  {{< tile-card icon="images/dev/icons/icon-redis-iris-64-duotone.png" title="Agent Playbooks" description="Publish reusable answers and procedures for agents" url="/develop/ai/context-engine/agent-playbooks" >}}
  {{< tile-card icon="images/dev/icons/icon-redis-iris-64-duotone.png" title="Lens" description="Debug agent answers by tracing the context behind each turn" url="/develop/ai/context-engine/lens" >}}
  {{< tile-card icon="images/dev/icons/icon-redis-iris-64-duotone.png" title="Intent Router" description="Classify requests into intents and route them to the right tool or agent" url="/develop/ai/context-engine/intent-router" >}}
  {{< tile-card icon="images/dev/icons/icon-redis-iris-64-duotone.png" title="SDK and CLI setup" description="Install redis-iris and connect it to Redis Cloud or a self-managed deployment" url="/develop/ai/context-engine/sdk-and-cli" >}}
  {{< tile-card icon="images/dev/icons/icon-redis-code-64-duotone.png" title="Agent Mesh (beta)" description="Share agent-to-agent task state across Python replicas and resume event delivery" url="/develop/ai/context-engine/agent-mesh" >}}
</div>

## What is Redis Iris?

Redis Iris is a production-ready context engine for AI agents that:

- **Answers recurring questions without a model call**: Agent Playbooks returns the answers and procedures your business published, matched to the agent's task by semantic similarity
- **Adds persistent memory**: Agents remember past interactions and user preferences across sessions
- **Routes each message**: Intent Router matches a message to the intents you defined and returns the target that handles it
- **Connects tools and business data**: Context Gateway gives agents one MCP endpoint for the tools of any MCP server and your Redis data
- **Keeps data fresh**: Data Integration streams live changes from relational databases into Redis within seconds
- **Shows why an agent answered the way it did**: Lens traces each turn, from what each source returned to what entered the prompt
- **Keeps long responses deliverable**: Agent Mesh keeps an agent's response stream resumable when the client disconnects
- **Deploys your way**: Check each service’s operator guide for its managed and self-managed deployment options.

## Why use Redis Iris?

<div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
  <div class="p-5 border border-redis-pen-300 rounded-lg">
    <h3 class="text-redis-ink-900 font-semibold mb-3">For AI applications</h3>
    <ul class="space-y-1 text-redis-pen-600">
      <li>Agents that remember context across sessions and users</li>
      <li>Consistent answers to recurring questions, from content your business approved</li>
      <li>Reliable, structured access to live business data</li>
      <li>No stale data: near real-time sync from your source databases</li>
    </ul>
  </div>
  <div class="p-5 border border-redis-pen-300 rounded-lg">
    <h3 class="text-redis-ink-900 font-semibold mb-3">For developers</h3>
    <ul class="space-y-1 text-redis-pen-600">
      <li>Managed and self-managed deployment options documented for each service</li>
      <li>Python and JavaScript SDKs and REST APIs for all services</li>
      <li>Define your data model once, reuse it across all agents</li>
      <li>Trace each agent turn to see which context reached the prompt</li>
      <li>No database setup required on Redis Cloud</li>
    </ul>
  </div>
</div>

## Next steps

Learn [how Redis Iris works](/content/develop/ai/context-engine/concepts/_index.md), from the agent request to where each kind of context lives.
