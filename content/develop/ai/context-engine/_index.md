---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Redis Iris is a suite of managed and self-managed services for agent memory, semantic caching, and governed data access.
hideListLinks: true
linktitle: Redis Iris context engine
title: Redis Iris context engine
weight: 30
bannerText: Agent Memory and Context Retriever are currently available in preview. Features and behavior are subject to change.
---

Give your AI agents the context layer they need to reliably act on business data.

Redis Iris eliminates the infrastructure burden of building context-aware AI agents: persistent memory, semantic caching, governed data access, and live data sync, fully managed on Redis Cloud or self-managed on your own infrastructure.

<div class="grid grid-cols-1 md:grid-cols-4 gap-6 my-8">
  {{< tile-card icon="images/dev/icons/icon-redis-iris-64-duotone.png" title="Concepts" description="What happens when an agent asks Redis Iris for context" url="/develop/ai/context-engine/concepts" >}}
  {{< tile-card icon="images/dev/icons/icon-redis-agent-memory-64-duotone.png" title="Agent Memory" description="Persistent short-term and long-term memory across agent interactions" url="/develop/ai/context-engine/agent-memory" >}}
  {{< tile-card icon="images/dev/icons/icon-redis-iris-64-duotone.png" title="Context Gateway" description="One MCP endpoint for the tools of any MCP server and your Redis data" url="/develop/ai/context-engine/context-gateway" >}}
  {{< tile-card icon="images/dev/icons/icon-redis-iris-64-duotone.png" title="Agent Playbooks" description="Publish reusable answers and procedures for agents" url="/develop/ai/context-engine/agent-playbook" >}}
  {{< tile-card icon="images/dev/icons/icon-redis-iris-64-duotone.png" title="Lens" description="Debug agent answers by tracing the context behind each turn" url="/develop/ai/context-engine/lens" >}}
  {{< tile-card icon="images/dev/icons/icon-redis-code-64-duotone.png" title="Agent Mesh (preview)" description="Share A2A task state across Python replicas and resume event delivery" url="/develop/ai/context-engine/agent-mesh" >}}
</div>

## What is Redis Iris?

Redis Iris is a production-ready context engine for AI agents that:

- **Reduces LLM costs**: Semantic caching returns cached responses for similar queries in milliseconds
- **Adds persistent memory**: Agents remember past interactions and user preferences across sessions
- **Connects tools and business data**: Context Gateway gives agents one MCP endpoint for the tools of any MCP server and your Redis data
- **Keeps data fresh**: Data Integration streams live changes from relational databases into Redis within seconds
- **Deploys your way**: Check each service’s operator guide for its managed and self-managed deployment options.

## Why use Redis Iris?

<div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
  <div class="p-5 border border-redis-pen-300 rounded-lg">
    <h3 class="text-redis-ink-900 font-semibold mb-3">For AI applications</h3>
    <ul class="space-y-1 text-redis-pen-600">
      <li>Agents that remember context across sessions and users</li>
      <li>Faster responses and lower costs through semantic caching</li>
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
      <li>No database setup required on Redis Cloud</li>
    </ul>
  </div>
</div>

## Next steps

Learn [how Redis Iris works](/content/develop/ai/context-engine/concepts/_index.md), from the agent request to where each kind of context lives.
