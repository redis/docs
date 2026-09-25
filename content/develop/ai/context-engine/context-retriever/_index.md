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

Give your agents structured, governed access to business data, without building custom tools for every project.

Context Retriever lets you define your data model once. It automatically generates the retrieval tools agents call at runtime, so agents always work with accurate, live data through a controlled interface rather than guessing at SQL or calling databases directly.

<div class="grid grid-cols-1 md:grid-cols-4 gap-6 my-8">
  {{< tile-card color="bg-blue-300" title="Concepts" description="Governed tool-calling instead of direct database access, and why it matters" url="/develop/ai/context-engine/context-retriever/concepts" >}}
  {{< tile-card color="bg-redis-red-500" title="Quick Start" description="Create a Context Retriever service on Redis Cloud" url="/operate/iris/context-retriever/create-service" >}}
  {{< tile-card color="bg-redis-yellow-500" title="Python SDK & CLI" description="Model entities and deploy tools with the redis-context-retriever package" url="https://pypi.org/project/redis-context-retriever/" >}}
  {{< tile-card color="bg-teal-300" title="Manage Access" description="Create and manage agent keys to control what each agent can access" url="/operate/iris/context-retriever/view-admin-keys" >}}
</div>

## What is Context Retriever?

Redis Context Retriever is a schema-first context layer for AI agents that:

- **Defines business context once**: Model your entities, fields, and relationships in one place, reused across all agents
- **Auto-generates retrieval tools**: Tools are created from your data model, not hand-coded per agent
- **Keeps agents out of your database**: Agents call generated tools; the system handles data access safely
- **Governs access by design**: Each agent key has access tags that automatically filter what data it can see
- **Exposes tools via MCP**: Agents call tools through a standard Model Context Protocol (MCP) interface at runtime

## Why use Context Retriever?

<div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
  <div class="p-5 border border-redis-pen-300 rounded-lg">
    <h3 class="text-redis-ink-900 font-semibold mb-3">For AI applications</h3>
    <ul class="space-y-1 text-redis-pen-600">
      <li>Agents reliably follow defined data paths instead of guessing at SQL</li>
      <li>Live, structured context from your business data at every agent step</li>
      <li>No tool zoo sprawl: one model definition, consistent tool surface</li>
      <li>Access control built in: agents only see what they're allowed to see</li>
    </ul>
  </div>
  <div class="p-5 border border-redis-pen-300 rounded-lg">
    <h3 class="text-redis-ink-900 font-semibold mb-3">For developers</h3>
    <ul class="space-y-1 text-redis-pen-600">
      <li>Python client and <code>ctxctl</code> CLI for modeling and deploying</li>
      <li>UI-based setup available in Redis Cloud console</li>
      <li>No per-agent tool engineering: the platform handles tool generation</li>
      <li>Available fully managed on Redis Cloud or self-managed on your own infrastructure</li>
    </ul>
  </div>
</div>

## Quick example

Install the Python client, which also includes the `ctxctl` CLI:

```bash
pip install redis-context-retriever
```

Use the `ctxctl` CLI, the Python client, or the Redis Cloud UI to model your entities and relationships. Context Retriever uses that model to automatically generate retrieval tools that agents call at runtime through its MCP interface. Agents never access your database directly.

See the [Redis Cloud setup guide](/content/operate/iris/context-retriever/create-service.md) to create your first Context Retriever service.

Redis Context Retriever helps teams expose operational context to AI agents through schema-first retrieval. It models the entities, fields, keys, and relationships that matter to an agent workflow, then presents that context through a governed tool surface the agent can call at runtime. Context Retriever helps an AI Agent understand what business objects exist, how they connect, and which paths are safe to use.

## Overview

Production agents fail not because the model is wrong, but because the context layer breaks. Enterprise data can be fragmented across multiple different databases, and can be disorganized. Teams try to patch this with text-to-SQL, OpenAPI-to-MCP wrappers, or hand-built tools, which works for demos but creates tool zoo sprawl, SQL risk, and agents that can't reliably choose the right path in production. Redis Context Retriever gives teams a governed, schema-first surface agents can traverse safely.

When you set up Redis Context Retriever, you model the objects that matter to your agent workflow and connect the relationships between them. You can do this either through the UI, using the [Context Surfaces Python Client](https://pypi.org/project/redis-context-retriever/), or the `ctxctl` CLI (available when you install the python client). Context Retriever will use those relationships to automatically create and deploy retrieval tools from your entity model.  

When an agent needs context during execution, it calls the MCP tools Context Retriever exposes. Instead of guessing which tool to use, or generating SQL, the agent follows the defined entity paths and gets back structured, live, operational context. 

## Get started with Redis Context Retriever

Get started with Redis Context Retriever on Redis Cloud or join the private preview for Redis Software.

{{< multitabs id="context-retriever-get-started"
    tab1="Redis Cloud"
    tab2="Redis Software (private preview)" >}}

{{< embed-md "rc-context-retriever-get-started.md" >}}

-tab-sep-

Redis Context Retriever is available for self-managed deployment on Kubernetes as a private preview. See [Install Context Retriever](/content/develop/ai/context-engine/context-retriever/install/_index.md).

You need a license key to deploy: [contact Redis](https://redis.io/contact/) to request access.

{{< /multitabs >}}

