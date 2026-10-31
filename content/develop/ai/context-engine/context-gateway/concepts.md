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

## Gateways

A **Gateway** is one Model Context Protocol (MCP) endpoint, `/iris/data/v1/context-gateway/gateways/<gateway-id>/mcp` on the Data Plane. It lists and calls the tools of its **Upstreams**. Create a Gateway for each set of tools that an agent or team should see together.

![An agent sends one agent key to Context Gateway, which checks it with the Identity Service. The Gateway calls an MCP server and a Context Surface over a Redis database, and reads Upstream credentials from the secrets backend.](/images/ai/context-engine/context-gateway-overview.svg)
{width="750"}

One Helm release serves one tenant, and every Gateway belongs to that tenant. A Gateway of another tenant answers like a Gateway that does not exist.

### Access

An agent reaches a Gateway in one of two ways:

- An **agent key** from the Identity Service, sent as `Authorization: Bearer <key>` or `X-Api-Key: <key>`.
- An **identity provider (IdP) access token**, when the deployment turns on sign-in. MCP clients that support MCP authorization find the IdP from the Gateway and sign in by themselves. The token is accepted only in `Authorization: Bearer`.

The key's or token's grants must name the Gateway:

| Action | What it allows |
| --- | --- |
| `use` | List and call every tool on the Gateway, including tools that change data in an Upstream. |
| `full` | Everything `use` allows. |

MCP read-only and destructive annotations do not limit what `use` allows. Give an agent a Gateway that holds only the tools it should call. Neither the agent key nor the IdP token reaches an Upstream.

For key administration, see [Authentication and authorization](/content/operate/iris/context-gateway/self-managed/authentication.md).

## Upstreams

An **Upstream** is a source of tools. A Gateway supports two kinds:

- An **MCP server** (`MCP`): any MCP server the Gateway reaches over Streamable HTTP. It can come from any vendor or from your own team. It does not need to use Redis.
- A **Context Surface** (`CONTEXT_SURFACE`): tools generated from a data model over the records of a Redis database. See [Manage Context Surfaces](/content/develop/ai/context-engine/context-gateway/manage-context-surfaces.md).

Each Upstream has a **namespace**: 1 to 32 lowercase letters and digits, with single hyphens between them. The Control Plane derives it from the Upstream's `name` when you leave it out. A long derived namespace is shortened with a hash suffix. An existing namespace causes a conflict instead of silently choosing another name. The Gateway serves each tool under its qualified name, such as `billing__get_invoice`. Namespaces keep two Upstreams with the same tool name apart.

The Gateway joins the namespace and sanitized tool name with `__`, replacing unsupported tool-name characters with underscores. It refuses catalogs whose names collide after sanitization or exceed 64 characters. Use names returned by discovery unchanged. Search-mode identity still uses the exact `originalName` and `upstreamId` from tool metadata.

An Upstream is enabled when you create it. A disabled Upstream contributes no tools until you enable it again.

### Tool catalogs

The Gateway discovers an Upstream's tools when you register it and stores them as the Upstream's **catalog**. `tools/list` serves the stored catalog and does not contact the Upstream, so an Upstream outage shows up only when an agent calls one of its tools.

Refresh the catalog when the Upstream's tools change. Each refresh publishes a new catalog revision. Changing an Upstream's endpoint or credential also changes its revision.

### Credentials

The Gateway sends each MCP server the credential you register for it, as a bearer token or a named header. Credential values live in the deployment's secrets backend: an encrypted Redis database, HashiCorp Vault, or AWS Secrets Manager. Reads of an Upstream never return them.

Context Surfaces use Redis credentials from the deployment's database registry. See [Context Surface databases](/content/operate/iris/context-gateway/self-managed/configuration.md#context-surface-databases).

## Tool exposure modes

A Gateway's `toolExposureMode` decides what an MCP `tools/list` request returns:

| Mode | `tools/list` returns | Use it when |
| --- | --- | --- |
| `FULL` (default) | Every tool under its qualified name. | The agent works with a small, known set of tools. |
| `SEARCH` | `search_tools` and `run_tool`, plus handle tools when compression is enabled. | The Gateway holds more tools than fit in the agent's context. |

![In full mode, listing tools returns every tool definition and the agent calls a tool by name. In search mode, listing tools returns search_tools and run_tool, search returns the matching tools, and run_tool calls the chosen one.](/images/ai/context-engine/context-gateway-exposure-modes.svg)
{width="650"}

In search mode the agent calls `search_tools` and receives complete tool definitions. Search matches the words of the query against each tool's name, title, and description, so write queries with the words a tool's name or description would contain. The agent then calls a tool through `run_tool` with the `upstreamId` and `originalName` from its definition. A mode change applies on the next request.

## Tool policies

A **tool policy** sets optional behavior for one tool of one Upstream. Both behaviors need a Gateway database, selected with the Gateway's `databaseId`.

Each Gateway also turns the cache and compression on or off for all of its tools with two settings, `ENABLED` or `DISABLED`: `cache` for the cache and `compression` for compression. On self-managed deployments, a Gateway created with a database defaults both features to enabled, subject to database capability checks. A Gateway without a database has both disabled. Redis Cloud keeps compression disabled. A feature serves a Gateway only when the Gateway's setting is `ENABLED` and the deployment turns the feature on.

### Cache

The cache serves a repeated call from the Gateway database instead of calling the Upstream again. Each tool opts in with a `cache` policy and a time to live (TTL).

A tool can be cached unless its definition says `readOnlyHint: false` or `destructiveHint: true`. An absent hint does not block caching, and no annotation turns caching on. An entry is served until its TTL expires or the Upstream's revision changes.

![A tool call without a cache policy goes straight to the Upstream. A call with a policy checks for a stored result. If one exists, the Gateway returns it. If not, the Gateway calls the Upstream, stores the result for the TTL, and returns it.](/images/ai/context-engine/context-gateway-result-cache.svg)
{width="850"}

All callers with access to a Gateway share its cache entries.

### Compression

A handle holds a large tool result in the Gateway database. When compression is on for a Gateway, eligible results over 32 kibibytes (KiB) are candidates for a handle, subject to storage and capture limits. The agent receives a small stub with the handle and reads the result in pages, queries, counts, or aggregates.

A tool opts out with a `compression` policy of `capture: NEVER`, or sets its own handle lifetime with `ttlSeconds`. An agent can request a handle even below the automatic threshold with `run_tool_as_handle`. If the result cannot be held, this explicit request returns a tool error. Ordinary automatic capture can instead return the original result inline.

A handle is bound to the caller that created it, and it survives a rotation of that caller's agent key. It ends when the agent releases it or its TTL expires. Handles are bounded by their TTL and the Gateway database's memory.

Eligible Surface filter and text queries collect continuation pages within configured limits. A handle can still be partial or have unknown completeness. Read its completeness warning before treating a count or aggregate as the total for the source.

## Key terms

| Term | Meaning |
| --- | --- |
| Gateway | One MCP endpoint that serves the tools of its Upstreams. |
| Upstream | An MCP server or Context Surface whose tools a Gateway serves. |
| Context Surface | An Upstream that serves Redis records as tools from a data model. |
| Namespace | The prefix that makes an Upstream's tool names unique within a Gateway. |
| Catalog | The stored list of an Upstream's tools. |
| Tool policy | Per-tool settings for the cache and compression. |
| `cache`, `compression` | Per-Gateway settings that turn the cache and compression on or off. |
| Gateway database | The Redis database that holds cached results and handles. |

## Next steps

- [Quickstart](/content/develop/ai/context-engine/context-gateway/quickstart.md) to list and call your first tools.
- [MCP](/content/develop/ai/context-engine/context-gateway/mcp.md) to connect any MCP client.
- [API reference](/content/develop/ai/context-engine/context-gateway/api-reference.md) for every tool, argument, and metadata key.
