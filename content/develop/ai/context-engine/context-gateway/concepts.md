---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Understand Gateways, Upstreams, credentials, tool exposure modes, the result cache, result handles, and agent access.
hideListLinks: true
linktitle: Concepts
title: Redis Context Gateway concepts
weight: 3
---

## Gateways

A **Gateway** is one MCP endpoint, `/v1/gateways/<gateway-id>/mcp` on the Data Plane. It lists and calls the tools of its **Upstreams**. Create a Gateway for each set of tools that an agent or team should see together.

![An agent connects to Context Gateway with one agent key. The Gateway calls an MCP server and a Context Surface over a Redis database, and reads Upstream credentials from the secrets backend.](/images/ai/context-engine/context-gateway-overview.svg)
{width="750"}


Every Gateway belongs to the deployment's tenant. An agent reaches a Gateway with an agent key or an identity provider (IdP) token whose grants name that Gateway:

| Action | What it allows |
| --- | --- |
| `use` | List and call every tool on the Gateway, including tools that change data in an Upstream. |
| `full` | Everything `use` allows. |

MCP read-only and destructive annotations do not limit what `use` allows. Give an agent a Gateway that holds only the tools it should call.

For key administration, see [Authentication and access](/content/operate/iris/context-gateway/self-managed/authentication.md).

## Upstreams

An **Upstream** is a source of tools. A Gateway supports two kinds:

- An **MCP server** (`mcp`): any MCP server the Gateway reaches over Streamable HTTP. It can come from any vendor or from your own team. It does not need to use Redis.
- A **Context Surface** (`context-surface`) that serves the records of a Redis database as tools, from a data model you supply.

<!-- TODO: The Iris AGENTS.md does not cover the terms Gateway, Upstream, or Context Surface, and it warns against using "Context Surfaces" as a name for Context Retriever. Confirm these terms with the docs team. -->

Each Upstream has a **namespace**. The Gateway serves each tool under its qualified name, the namespace and the tool's original name, such as `billing.get_invoice`. Namespaces keep two Upstreams with the same tool name apart.

### Tool catalogs

The Gateway discovers an Upstream's tools when you register it and stores them as the Upstream's **catalog**. Refresh the catalog when the Upstream's tools change. Each refresh publishes a new catalog revision.

### Credentials

The Gateway sends each Upstream the credential you register for it, as a bearer token or a named header. Credential values live in the deployment's secrets backend: an encrypted Redis database, HashiCorp Vault, or AWS Secrets Manager.

The agent's key is never sent to an Upstream, and an Upstream credential is never returned to the agent.

<!-- TODO: Confirm with product how Context Surfaces authenticate to their Redis database and whether that belongs here or in the operator configuration page. -->

## Tool exposure modes

A Gateway's `toolExposureMode` decides what an MCP `tools/list` request returns:

| Mode | `tools/list` returns | Use it when |
| --- | --- | --- |
| `full` (default) | Every tool under its qualified name. | The agent works with a small, known set of tools. |
| `search` | Only `search_tools` and `run_tool`. | The Gateway holds more tools than fit in the agent's context. |

![In full mode, listing tools returns every tool definition and the agent calls a tool by name. In search mode, listing tools returns search_tools and run_tool, search returns the matching tools, and run_tool calls the chosen one.](/images/ai/context-engine/context-gateway-exposure-modes.svg)
{width="650"}

In `search` mode the agent searches the Gateway's tools by query and receives complete tool definitions. It then calls one through `run_tool` with the `upstreamId` and `originalName` from that definition. A mode change applies on the next request.

## Tool policies

A **tool policy** turns on optional behavior for one tool of one Upstream. Both behaviors are off by default and need a Gateway database.

### Result cache

The result cache serves a repeated call from the Gateway database instead of calling the Upstream again. Only tools whose definitions allow caching can use it. An entry is served until its time to live (TTL) expires or the Upstream's catalog revision changes.

![A tool call checks for a stored result. If one exists, the Gateway returns it. If not, the Gateway calls the Upstream, stores the result for the TTL, and returns it.](/images/ai/context-engine/context-gateway-result-cache.svg)
{width="850"}

All callers with access to a Gateway share its cache entries.

<!-- TODO: Remove the shared-entry note if it is no longer true at GA. -->

### Result handles

A result handle holds a large tool result in the Gateway database. The agent receives a small stub with the handle and reads the result in pages, queries, counts, or aggregates. A handle ends when the agent releases it or its TTL expires. Handles are bounded by their TTL and the Gateway database's memory.

## Agent access and sign-in

Agents authenticate in one of two ways:

- An **agent key** from the Identity Service, sent as `Authorization: Bearer <key>` or `X-Api-Key: <key>`.
- An **IdP access token**, when the deployment turns on sign-in. MCP clients that support MCP authorization discover the IdP from the Gateway and sign in by themselves.

Neither credential reaches an Upstream.

## Key terms

| Term | Meaning |
| --- | --- |
| Gateway | One MCP endpoint that serves the tools of its Upstreams. |
| Upstream | An MCP server or Context Surface whose tools a Gateway serves. |
| Context Surface | An Upstream that serves Redis records as tools from a data model. |
| Namespace | The prefix that makes an Upstream's tool names unique within a Gateway. |
| Catalog | The stored list of an Upstream's tools. |
| Tool policy | Per-tool settings for the result cache and result handles. |
| Gateway database | The Redis database that holds cached results and result handles. |
