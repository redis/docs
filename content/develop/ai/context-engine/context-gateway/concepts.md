---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Understand Gateways, Upstreams, credentials, tool exposure modes, the cache, compression, and agent access.
hideListLinks: true
linktitle: Concepts
title: Redis Context Gateway concepts
weight: 3
aliases:
- /develop/ai/context-engine/context-retriever/concepts/
---

Redis Context Gateway gives agents access to tools from multiple sources through one Model Context Protocol (MCP) endpoint. You choose which sources to connect and whether agents receive all tool definitions or discover relevant tools as needed.

The Gateway also helps agents work efficiently with tool results. **Caching** reuses results for repeated calls, reducing requests to connected sources. **Compression** stores large results outside the agent’s context and lets the agent retrieve selected portions or calculate counts and aggregates.

This page explains how Gateways, tool sources, discovery modes, caching, and compression work together.

## Gateways and Upstreams {#gateways}

A **Gateway** brings together a set of tools that an agent or team needs. Each source of tools registered with a Gateway is an **Upstream**.

<a id="upstreams"></a>

Context Gateway supports two kinds of Upstream:

| Source | What it provides |
| --- | --- |
| **MCP server** | Tools from a third-party or in-house server that supports Streamable HTTP. |
| **Context Surface** | Tools generated from a data model describing records in a Redis database. |

For example, a support agent might need to look up invoices and search product information. You could register a billing MCP server and a product Context Surface with the same Gateway. The agent then accesses both through one connection.

![An agent sends one agent key to Context Gateway, which checks it with the Identity Service. The Gateway calls an MCP server and a Context Surface over a Redis database, and reads Upstream credentials from the secrets backend.](/images/ai/context-engine/context-gateway-overview.svg)
{width="750"}

### Tool names

Each Upstream has a **namespace** that distinguishes its tools from tools provided by other sources. For example, the `get_invoice` tool from an Upstream with the namespace `billing` appears as `billing__get_invoice`.

Use the names returned by tool discovery when calling tools.

### Tool catalogs

When you register an Upstream, the Gateway discovers its tools and stores their definitions in a **catalog**. Refresh the catalog when you add, remove, or change tools at the source.

The Gateway serves tool discovery requests from this stored catalog. Listing tools does not contact the Upstream or check whether it is available.

You can disable an Upstream to remove its tools from discovery without deleting its registration.

<a id="access"></a>
<a id="credentials"></a>

## Access and credentials

Agents authenticate to a Gateway using an agent key. Deployments configured for identity provider sign-in also support compatible MCP clients signing in through that provider.

Access is granted at the Gateway level. An agent with permission to use a Gateway can call every tool it exposes, including tools that modify data. Organize Gateways around the access your agents need. Read-only and destructive tool annotations describe tool behavior but do not restrict access.

Credentials for connected sources are configured separately. The Gateway uses those credentials when accessing the sources and does not forward the agent’s key or identity provider token.

See [Authentication and authorization](/content/operate/iris/context-gateway/self-managed/authentication.md) for authentication setup and access grants.

## Tool discovery {#tool-exposure-modes}

A Gateway’s **tool exposure mode** determines how an agent discovers and calls tools.

### Full mode

In full mode, the Gateway lists all available tools with their definitions. The agent calls a tool directly using its discovered name, such as `billing__get_invoice`.

Full mode is the default. Use it when the tool definitions fit comfortably in your agent’s context.

### Search mode

In search mode, the agent discovers tools as needed. It uses `search_tools` to find tools relevant to a task, reads the returned definitions to choose a tool and its arguments, then calls the selected tool through `run_tool`.

Search matches query words against tool names, titles, and descriptions. Descriptive tool names and descriptions help agents find the right tools.

Use search mode when you have a large tool set and want to avoid including every definition in the agent’s context. When compression is enabled, the Gateway also exposes tools for working with stored results.

The application programming interface (API) values for these modes are `FULL` and `SEARCH`.

![In full mode, listing tools returns every tool definition and the agent calls a tool by name. In search mode, listing tools returns search_tools and run_tool, search returns the matching tools, and run_tool calls the chosen one.](/images/ai/context-engine/context-gateway-exposure-modes.svg)
{width="650"}

## Working with tool results {#tool-policies}

Caching and compression address different needs. Caching reuses results across repeated calls. Compression lets an agent work with a large result without receiving it all at once.

Both features require a Redis database configured for the Gateway and must be enabled in both the deployment and the Gateway configuration. Caching and compression are disabled on Redis Cloud in this release.

### Caching {#cache}

Caching lets the Gateway reuse a previous tool result for a matching call instead of calling the Upstream again.

Caching is configured for individual tools through a **tool policy**. The policy’s time to live (TTL) determines how long a cached result can be reused. Choose a TTL that reflects how quickly the source data changes and how much staleness your application can tolerate.

For example, product descriptions may tolerate a longer TTL than inventory availability.

![A tool call without a cache policy goes straight to the Upstream. A call with a policy checks for a stored result. If one exists, the Gateway returns it. If not, the Gateway calls the Upstream, stores the result for the TTL, and returns it.](/images/ai/context-engine/context-gateway-result-cache.svg)
{width="850"}

Cache entries are shared by callers with access to the same Gateway. Consider that shared access when deciding which tools to cache. Tool annotations alone do not enable caching.

See [Manage Gateways and Upstreams](/content/develop/ai/context-engine/context-gateway/manage-gateways.md) for cache configuration and tool eligibility.

### Compression

Compression reduces the amount of tool-result data sent to the agent by storing eligible large results in Redis. The agent receives a small response containing a **handle**, a reference it can use to work with the stored result.

Using that handle, the agent can:

- Retrieve a page of records.
- Select part of the result.
- Calculate counts and aggregates.

For example, a product search might return more records than an agent needs to inspect. The agent can count the matches by category, then retrieve a page from the category relevant to the user’s question.

Compression can capture eligible large results automatically when enabled, with tool policies controlling exceptions and handle lifetime. Agents can also explicitly request a stored result with `run_tool_as_handle`.

#### Handle lifetime and access

A handle belongs to the caller that created it. It remains available until its TTL expires or the caller releases it.

#### Result completeness

Capture limits can prevent the Gateway from storing the complete source result. A count or aggregate then describes the captured data, which may represent only part of the source result.

Check the result’s completeness information and warnings before treating a count or aggregate as a total.

See the [MCP API Reference](/content/develop/ai/context-engine/context-gateway/api-reference.md) for handle tools and [Limits and errors](/content/develop/ai/context-engine/context-gateway/limits.md) for capture limits and failure behavior.

## Next steps

- [Quickstart](/content/develop/ai/context-engine/context-gateway/quickstart.md): Discover and call your first tools.
- [Manage Gateways and Upstreams](/content/develop/ai/context-engine/context-gateway/manage-gateways.md): Connect tool sources and configure Gateway behavior.
- [Manage Context Surfaces](/content/develop/ai/context-engine/context-gateway/manage-context-surfaces.md): Generate tools for querying Redis data.
