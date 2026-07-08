---
Title: Redis Context Retriever
alwaysopen: false
categories:
- docs
- develop
- ai
description: Expose tools to Agents to query your Redis databases. 
linkTitle: Context Retriever
hideListLinks: true
weight: 30
bannerText: Redis Context Retriever is currently available in preview. Features and behavior are subject to change.
bannerChildren: true
---

Give your agents structured, governed access to business data — without building custom tools for every project.

Context Retriever lets you define your data model once. It automatically generates the retrieval tools agents call at runtime, so agents always work with accurate, live data through a controlled interface rather than guessing at SQL or calling databases directly.

<div class="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
  {{< image-card image="images/ai-cube.svg" alt="Quick start icon" title="Quick Start — Create a Context Retriever service on Redis Cloud" url="/operate/rc/context-engine/context-retriever/create-service" >}}
  {{< image-card image="images/ai-lib.svg" alt="Python SDK icon" title="Python SDK and CLI — Model entities and deploy tools with the redis-context-retriever package" url="https://pypi.org/project/redis-context-retriever/" >}}
  {{< image-card image="images/ai-brain.svg" alt="Admin keys icon" title="Manage Access — Create and manage agent keys to control what each agent can access" url="/operate/rc/context-engine/context-retriever/view-admin-keys" >}}
</div>

## What is Context Retriever?

Redis Context Retriever is a schema-first context layer for AI agents that:

<ul class="my-4 space-y-2">
  <li class="flex gap-3"><span class="text-redis-red-500 font-bold mt-0.5">&#9679;</span><span><strong>Defines business context once</strong> — Model your entities, fields, and relationships in one place, reused across all agents</span></li>
  <li class="flex gap-3"><span class="text-redis-red-500 font-bold mt-0.5">&#9679;</span><span><strong>Auto-generates retrieval tools</strong> — Tools are created from your data model, not hand-coded per agent</span></li>
  <li class="flex gap-3"><span class="text-redis-red-500 font-bold mt-0.5">&#9679;</span><span><strong>Keeps agents out of your database</strong> — Agents call generated tools; the system handles data access safely</span></li>
  <li class="flex gap-3"><span class="text-redis-red-500 font-bold mt-0.5">&#9679;</span><span><strong>Governs access by design</strong> — Each agent key has access tags that automatically filter what data it can see</span></li>
  <li class="flex gap-3"><span class="text-redis-red-500 font-bold mt-0.5">&#9679;</span><span><strong>Exposes tools via MCP</strong> — Agents call tools through a standard MCP interface at runtime</span></li>
</ul>

## Why use Context Retriever?

<div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
  <div class="p-5 border border-redis-pen-300 rounded-lg">
    <h3 class="text-redis-ink-900 font-semibold mb-3">For AI applications</h3>
    <ul class="space-y-1 text-redis-pen-600">
      <li>Agents reliably follow defined data paths instead of guessing at SQL</li>
      <li>Live, structured context from your business data at every agent step</li>
      <li>No tool zoo sprawl — one model definition, consistent tool surface</li>
      <li>Access control built in — agents only see what they're allowed to see</li>
    </ul>
  </div>
  <div class="p-5 border border-redis-pen-300 rounded-lg">
    <h3 class="text-redis-ink-900 font-semibold mb-3">For developers</h3>
    <ul class="space-y-1 text-redis-pen-600">
      <li>Python client and <code>ctxctl</code> CLI for modeling and deploying</li>
      <li>UI-based setup available in Redis Cloud console</li>
      <li>No per-agent tool engineering — the platform handles tool generation</li>
      <li>Fully managed on Redis Cloud, no infrastructure required</li>
    </ul>
  </div>
</div>

## Quick example

Install the Python client, which also includes the `ctxctl` CLI:

```bash
pip install redis-context-retriever
```

Use the `ctxctl` CLI, the Python client, or the Redis Cloud UI to model your entities and relationships. Context Retriever uses that model to automatically generate retrieval tools that agents call at runtime through its MCP interface — agents never access your database directly.

See the [Redis Cloud setup guide]({{< relref "/operate/rc/context-engine/context-retriever/create-service" >}}) to create your first Context Retriever service.

Redis Context Retriever helps teams expose operational context to AI agents through schema-first retrieval. It models the entities, fields, keys, and relationships that matter to an agent workflow, then presents that context through a governed tool surface the agent can call at runtime. Context Retriever helps an AI Agent understand what business objects exist, how they connect, and which paths are safe to use.

## Overview

Production agents fail not because the model is wrong, but because the context layer breaks. Enterprise data can be fragmented across multiple different databases, and can be disorganized. Teams try to patch this with text-to-SQL, OpenAPI-to-MCP wrappers, or hand-built tools — which works for demos but creates tool zoo sprawl, SQL risk, and agents that can't reliably choose the right path in production. Redis Context Retriever gives teams a governed, schema-first surface agents can traverse safely.

When you set up Redis Context Retriever, you model the objects that matter to your agent workflow and connect the relationships between them. You can do this either through the UI, using the [Context Surfaces Python Client](https://pypi.org/project/redis-context-retriever/), or the `ctxctl` CLI (available when you install the python client). Context Retriever will use those relationships to automatically create and deploy retrieval tools from your entity model.  

When an agent needs context during execution, it calls the MCP tools Context Retriever exposes. Instead of guessing which tool to use, or generating SQL, the agent follows the defined entity paths and gets back structured, live, operational context. 

## Get started with Redis Context Retriever

Get started with Redis Context Retriever on Redis Cloud or join the private preview for Redis Software.

{{< multitabs id="context-retriever-get-started"
    tab1="Redis Cloud"
    tab2="Redis Software (private preview)" >}}

{{< embed-md "rc-context-retriever-get-started.md" >}}

-tab-sep-

Contact your Redis representative or [contact sales](https://redis.io/contact/) to join the private preview on Redis Software.

{{< /multitabs >}}

