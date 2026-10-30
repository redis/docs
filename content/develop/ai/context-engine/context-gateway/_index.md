---
Title: Redis Context Gateway
alwaysopen: false
categories:
- docs
- develop
- ai
description: Give an agent one MCP endpoint for the tools of any MCP server, plus tools over your Redis data.
linkTitle: Context Gateway
hideListLinks: true
weight: 22
aliases:
- /develop/ai/context-engine/context-retriever/
- /develop/ai/context-engine/context-retriever/interactive-demo/
---

## What is Context Gateway?

Redis Context Gateway is a Model Context Protocol (MCP) gateway for AI agents that:

- **Works with any MCP server:** Attach third-party and in-house MCP servers as Upstreams, not only Redis tools.
- **Serves one endpoint per Gateway:** An agent connects to one Gateway instead of to every MCP server it uses.
- **Keeps credentials out of agents:** The Gateway stores each Upstream's credential in your secrets backend and sends it on every call.
- **Turns Redis data into tools:** Optionally, a Context Surface generates tools from a data model over a Redis database.
- **Scales to large tool sets:** In `search` mode, the agent searches for tools instead of loading every definition.
- **Handles large and repeated results:** An optional result cache serves repeated calls, and result handles keep large results out of the agent's context.

<div class="grid grid-cols-1 md:grid-cols-4 gap-6 my-8">
  {{< tile-card icon="images/icon_logo/icon-data-structures-64-midnight.png" title="Concepts" description="Gateways, Upstreams, tool exposure modes, and result handles" url="/develop/ai/context-engine/context-gateway/concepts" >}}
  {{< tile-card icon="images/icon_logo/icon-developers-64-midnight.png" title="Quickstart" description="List, search, and call your first tools through a Gateway" url="/develop/ai/context-engine/context-gateway/quickstart" >}}
  {{< tile-card icon="images/dev/icons/icon-redis-code-64-duotone.png" title="Agent integration" description="Connect a Gateway to OpenAI Agents SDK or LangGraph" url="/develop/ai/context-engine/context-gateway/agent-integration" >}}
  {{< tile-card icon="images/dev/icons/icon-redis-insight-64-duotone.png" title="Manage Gateways" description="Register MCP servers and Context Surfaces and set tool policies" url="/develop/ai/context-engine/context-gateway/manage-gateways" >}}
</div>

## Why use Context Gateway?

<div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
  <div class="p-5 border border-redis-pen-300 rounded-lg">
    <h3 class="text-redis-ink-900 font-semibold mb-3">For AI applications</h3>
    <ul class="space-y-1 text-redis-pen-600">
      <li>One MCP connection and one agent key per agent</li>
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
      <li>Self-managed on your own Kubernetes</li>
    </ul>
  </div>
</div>

## Quick example

Install the Redis Iris Python package, which includes the `iris` CLI:

```bash
pip install redis-iris
```

With a Gateway's MCP endpoint and an agent key in your environment, list and call its tools:

*Short Python example with `ContextGateway.from_env()`, `tools()`, and `call()`, and the same calls with `iris context-gateway tools list` and `tools call`.*

The [redis-iris package](https://pypi.org/project/redis-iris/) covers MCP calls and Gateway administration in Python and the CLI. For TypeScript, the generated client [@redis-iris/context-gateway](https://www.npmjs.com/package/@redis-iris/context-gateway) covers MCP calls and the Control Plane API. See the [developer guide](/content/develop/ai/context-engine/context-gateway/developer-guide.md) to choose a client.

Follow the [quickstart](/content/develop/ai/context-engine/context-gateway/quickstart.md) to list, search, and call tools, or see [Manage Gateways and Upstreams](/content/develop/ai/context-engine/context-gateway/manage-gateways.md) to register your own MCP servers and Context Surfaces.

## Get started with Context Gateway

Context Gateway is available for self-managed deployment on Kubernetes. See [Self-managed Context Gateway](/content/operate/iris/self-managed/context-gateway/_index.md), then [create a Gateway and an agent key](/content/operate/iris/self-managed/context-gateway/api-examples.md).

You need a license key to deploy: [contact Redis](https://redis.io/contact/) to request access.

## Manage Gateways and Upstreams

- [Manage Gateways and Upstreams](/content/develop/ai/context-engine/context-gateway/manage-gateways.md): create Gateways, register MCP servers, store their credentials, and set tool policies.
- [Manage Context Surfaces](/content/develop/ai/context-engine/context-gateway/manage-context-surfaces.md): serve the records of a Redis database as tools.

## Serve tools at runtime

- [Connect with MCP](/content/develop/ai/context-engine/context-gateway/mcp.md) from any Streamable HTTP client.
- [Integrate with an agent](/content/develop/ai/context-engine/context-gateway/agent-integration.md) using OpenAI Agents SDK or LangGraph.

Use the [API reference](/content/develop/ai/context-engine/context-gateway/api-reference.md) for MCP tools and metadata, and [limits and errors](/content/develop/ai/context-engine/context-gateway/limits.md) for constraints and recovery guidance.
