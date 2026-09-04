---
title: Build with an agent
linkTitle: Build with an agent
alwaysopen: false
categories:
- docs
- getting started
description: Connect AI agents to Redis documentation and give them Redis-specific skills.
weight: 60
---

Redis publishes two agent-facing tools that work alongside the client libraries and MCP servers covered elsewhere in these docs:

- [Redis Docs MCP](#redis-docs-mcp) — a hosted server that lets any MCP-compatible agent search, fetch, and ask questions against the Redis documentation itself.
- [Agent Skills](#agent-skills) — packaged instructions that teach a coding agent Redis-specific patterns (data modeling, connections, search, security, and more).

## Redis Docs MCP

[`redis.io/mcp`](https://redis.io/mcp) is a public, read-only [Model Context Protocol](https://modelcontextprotocol.io/introduction) server that serves the Redis documentation to any MCP client. It requires no API key or sign-up.

{{< note >}}
This is a different server from the [Redis MCP server]({{< relref "/integrate/redis-mcp" >}}) (`mcp-redis`). `mcp-redis` is a self-hosted server that connects an agent to *your own* Redis database, so it can run commands against your data. The Redis Docs MCP server has no access to any Redis instance except Redis's own documentation index.
{{< /note >}}


### Connect a client

Add the server to your MCP client's configuration:

```json
{
  "mcpServers": {
    "redis-docs": {
      "url": "https://redis.io/mcp"
    }
  }
}
```


## Agent skills

[`redis/agent-skills`](https://github.com/redis/agent-skills) is Redis's published collection of [Agent Skills](https://agentskills.io/) — packaged instructions and resources that extend a coding agent's knowledge of Redis-specific patterns. Once installed, an agent automatically applies the relevant skill when it detects a matching task; you don't invoke them manually.

| Skill | Covers |
|-------|--------|
| `redis-core` | Data structures, key naming strategies, memory management, TTLs, and when to use JSON versus Hash |
| `redis-connections` | Connection pooling, multiplexing, pipelining, and client-side caching |
| `redis-search` | Full-text search schemas, aggregation queries, and vector similarity (HNSW/FLAT) for RAG pipelines |
| `redis-semantic-cache` | Caching LLM responses with LangCache and configurable similarity thresholds |
| `redis-clustering` | Cluster operations using hash tags and replica reads |
| `redis-security` | Authentication, TLS encryption, ACL policies, and network security |
| `redis-observability` | Monitoring with `INFO`, `SLOWLOG` analysis, and Redis Insight |
| `iris-development` | Agent Memory provisioning and long-term memory search |

### Install

Install the full collection with the [Agent Skills CLI](https://agentskills.io/):

```sh
npx skills add redis/agent-skills
```

Or install it as a plugin in your agent tool of choice:

- **Claude Code**: `/plugin marketplace add redis/agent-skills`
- **Cursor**: `/add-plugin redis`
- **ChatGPT/Codex**: use the package under [`plugins/redis-development/`](https://github.com/redis/agent-skills/tree/main/plugins/redis-development) in the repository

## See also

- [Redis MCP server]({{< relref "/integrate/redis-mcp" >}}) — connect an agent to your own Redis database
- [Redis client libraries]({{< relref "/develop/clients" >}})
- [Redis for AI agents]({{< relref "/develop/get-started/redis-in-ai" >}})
