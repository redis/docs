---
Title: Redis Context Gateway
alwaysopen: false
categories:
- docs
- develop
- ai
description: Connect agents to MCP servers and tools over Redis data through one endpoint.
linkTitle: Context Gateway
hideListLinks: true
weight: 22
aliases:
- /develop/ai/context-engine/context-retriever/
- /develop/ai/context-engine/context-retriever/interactive-demo/
---

## What is Context Gateway?

Redis Context Gateway is a Model Context Protocol (MCP) gateway for AI agents that:

- **Connects MCP servers:** Register third-party and in-house MCP servers that support Streamable HTTP as Upstreams.
- **Provides one endpoint per Gateway:** Connect your agent to a Gateway to access tools from multiple sources.
- **Manages Upstream credentials:** Configure credentials on the Gateway so your agent does not need credentials for each connected MCP server.
- **Makes Redis data available as tools:** A Context Surface generates tools from a data model describing records in Redis.
- **Scales to large tool sets:** In search mode, the agent searches for tools instead of loading every definition.
- **Handles large and repeated results:** An optional cache serves repeated calls, and compression keeps large results out of the agent's context.

<div class="grid grid-cols-1 md:grid-cols-4 gap-6 my-8">
  {{< tile-card icon="images/icon_logo/icon-data-structures-64-midnight.png" title="Concepts" description="Gateways, Upstreams, tool exposure modes, caching, and compression" url="/develop/ai/context-engine/context-gateway/concepts" >}}
  {{< tile-card icon="images/icon_logo/icon-developers-64-midnight.png" title="Quickstart" description="List, search, and call your first tools through a Gateway" url="/develop/ai/context-engine/context-gateway/quickstart" >}}
  {{< tile-card icon="images/dev/icons/icon-redis-code-64-duotone.png" title="Agent integration" description="Connect a Gateway to OpenAI Agents SDK or LangGraph" url="/develop/ai/context-engine/context-gateway/agent-integration" >}}
  {{< tile-card icon="images/dev/icons/icon-redis-insight-64-duotone.png" title="Manage Gateways" description="Register MCP servers and Context Surfaces and set tool policies" url="/develop/ai/context-engine/context-gateway/manage-gateways" >}}
</div>

## Why use Context Gateway?

<div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
  <div class="p-5 border border-redis-pen-300 rounded-lg">
    <h3 class="text-redis-ink-900 font-semibold mb-3">For AI applications</h3>
    <ul class="space-y-1 text-redis-pen-600">
      <li>Access tools from multiple sources through one MCP connection</li>
      <li>Tool definitions that fit the context window, through search mode</li>
      <li>Large results read in pages instead of filling the context</li>
      <li>Sign-in with your identity provider for MCP clients that support it</li>
    </ul>
  </div>
  <div class="p-5 border border-redis-pen-300 rounded-lg">
    <h3 class="text-redis-ink-900 font-semibold mb-3">For platform teams</h3>
    <ul class="space-y-1 text-redis-pen-600">
      <li>Upstream credentials stored once, in Vault, AWS Secrets Manager, or encrypted Redis</li>
      <li>Per-Gateway access through Identity Service agent keys</li>
      <li>Python package, <code>iris</code> command-line interface (CLI), and REST API for administration</li>
      <li>Managed deployment on Redis Cloud or self-managed deployment on Kubernetes</li>
    </ul>
  </div>
</div>

## Concepts

A **Gateway** is one MCP endpoint for an agent. Each **Upstream** behind it is an MCP server or a **Context Surface**, which generates tools from a data model of records in Redis. In full mode the agent lists every tool; in search mode it searches for the tools it needs. See [Context Gateway concepts](/content/develop/ai/context-engine/context-gateway/concepts.md) for tool policies, caching, and compression.

## Quick example

1. Set up a Gateway:
    - **Redis Cloud:** [Create a Context Gateway](/content/operate/iris/context-gateway/create-gateway.md).
    - **Self-managed:** Follow the [deployment guide](/content/operate/iris/context-gateway/self-managed/_index.md), then [create a Gateway and an agent key](/content/operate/iris/context-gateway/self-managed/api-examples.md). A license key is required for self-managed deployment. [Contact Redis](https://redis.io/contact/) to request access.
1. Install the Redis Iris Python package, which includes the `iris` CLI:

    ```bash
    pip install 'redis-iris'
    ```

1. With `IRIS_CONTEXT_GATEWAY_URL` and `IRIS_CONTEXT_GATEWAY_API_KEY` in your environment, find a tool and call it:

    ```python
    from redis_iris import ContextGateway

    gateway = ContextGateway.from_env()

    for tool in gateway.search("filter providers by specialty"):
        print(tool.name, tool.description)

    result = gateway.call("<tool-name>", {"<argument>": "<value>"})
    ```

    From the CLI, `iris --json context-gateway tools list` lists the same tools.

Use the tool names and input schemas returned by discovery. The [redis-iris package](https://pypi.org/project/redis-iris/) covers MCP calls and Gateway administration in Python and the CLI. For JavaScript and TypeScript, install the [@redis-iris/context-gateway SDK](https://www.npmjs.com/package/@redis-iris/context-gateway); see the [client guide](/content/develop/ai/context-engine/context-gateway/mcp.md#choose-a-client) to choose a client. The [quickstart](/content/develop/ai/context-engine/context-gateway/quickstart.md) shows calls in full and search mode.

## Manage Gateways and Upstreams

- [Manage Gateways and Upstreams](/content/develop/ai/context-engine/context-gateway/manage-gateways.md): create Gateways, register MCP servers, store their credentials, and set tool policies.
- [Manage Context Surfaces](/content/develop/ai/context-engine/context-gateway/manage-context-surfaces.md): generate tools for querying records in Redis.

## Serve tools at runtime

- [Connect with MCP](/content/develop/ai/context-engine/context-gateway/mcp.md) from any Streamable HTTP client.
- [Integrate with an agent](/content/develop/ai/context-engine/context-gateway/agent-integration.md) using OpenAI Agents SDK or LangGraph.

Use the [MCP API Reference](/content/develop/ai/context-engine/context-gateway/api-reference.md) for MCP tools and metadata, and [limits and errors](/content/develop/ai/context-engine/context-gateway/limits.md) for constraints and recovery guidance.
