---
Title: Redis Cloud remote MCP server
alwaysopen: false
categories:
- docs
- integrate
- rc
summary: Manage Redis Cloud from any MCP client, with nothing to install.
group: service
linkTitle: Redis Cloud remote MCP
description: Connect an MCP client to the Redis Cloud MCP server that Redis hosts.
type: integration
weight: 30
---

Redis hosts a Model Context Protocol (MCP) server for
[Redis Cloud](/content/operate/rc/_index.md) at `https://cloud.mcp.redis.io/mcp`.
Connect an MCP client to it to manage your subscriptions, databases, and
Agent Memory stores from an AI assistant. There is nothing to install or run:
you add one URL and your Redis Cloud API keys to your client.

Use requests like these:

- "List my subscriptions and their databases"
- "Create a free Essentials database on AWS in us-east-1"
- "Which regions can I use for an Essentials plan on Google Cloud?"
- "Show the metrics for my Agent Memory store"

> [!NOTE]
> The remote server manages Redis Cloud resources. It doesn't read or write the
> data inside your databases. To work with your data, use
> [Redis MCP](/content/integrate/redis-mcp/_index.md). To work with the memories
> in an Agent Memory store, use the store's
> [MCP endpoint](/content/develop/ai/context-engine/agent-memory/mcp.md). To
> give your agent the Redis documentation, use
> [Redis Docs MCP](/content/develop/setup/build-with-an-agent.md#redis-docs-mcp).
> To run a server yourself, use the
> [local Redis Cloud MCP server](/content/integrate/redis-mcp/install.md#redis-cloud-mcp).

## Before you begin

You need:

- A Redis Cloud account with the
  [Redis Cloud API enabled](/content/operate/rc/api/get-started/enable-the-api.md).
- An API account key and an API user key. See
  [Manage API keys](/content/operate/rc/api/get-started/manage-api-keys.md).
- An MCP client that supports Streamable HTTP and custom request headers.
  Clients that only support OAuth sign-in can't connect.

The server acts as the API user key's user, so it can do only what that user
can do in the Redis Cloud console:

- To create, update, or delete resources, use a user key for a user with the
  owner role.
- If the user key has a Classless Inter-Domain Routing (CIDR) allow list, add
  the address your MCP client connects from.

To create, update, or delete resources, your client must also support MCP
elicitation (form requests). The server uses it to ask you to confirm a change.

## Connect your client

The [Agents page](https://cloud.redis.io/#/agents/mcp) in the Redis Cloud
console has guided setup. Choose your agent, and the page shows the
configuration to copy and links to where you create your API keys.

To connect by hand, use the same settings in every client:

| Setting | Value |
|---|---|
| URL | `https://cloud.mcp.redis.io/mcp` |
| `x-api-key` header | Your API account key |
| `x-api-secret-key` header | Your API user key |

Keep your keys in the client's connection settings. Don't put them in prompts or
agent instructions.

### Codex

Set the `REDIS_CLOUD_API_KEY` and `REDIS_CLOUD_API_SECRET_KEY` environment
variables to your API account key and API user key. Then add the server to
`~/.codex/config.toml`:

```toml
[mcp_servers.redis-cloud]
url = "https://cloud.mcp.redis.io/mcp"
env_http_headers = { "x-api-key" = "REDIS_CLOUD_API_KEY", "x-api-secret-key" = "REDIS_CLOUD_API_SECRET_KEY" }
```

### Claude Code

```bash
claude mcp add --transport http redis-cloud https://cloud.mcp.redis.io/mcp \
  --header "x-api-key: <your-api-account-key>" \
  --header "x-api-secret-key: <your-api-user-key>"
```

### Cursor

Add the server to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "redis-cloud": {
      "url": "https://cloud.mcp.redis.io/mcp",
      "headers": {
        "x-api-key": "<your-api-account-key>",
        "x-api-secret-key": "<your-api-user-key>"
      }
    }
  }
}
```

### VS Code

Set the `REDIS_CLOUD_API_KEY` and `REDIS_CLOUD_API_SECRET_KEY` environment
variables to your API account key and API user key before you start VS Code.
Then add the server to `.vscode/mcp.json` in your workspace:

```json
{
  "servers": {
    "redis-cloud": {
      "type": "http",
      "url": "https://cloud.mcp.redis.io/mcp",
      "headers": {
        "x-api-key": "${env:REDIS_CLOUD_API_KEY}",
        "x-api-secret-key": "${env:REDIS_CLOUD_API_SECRET_KEY}"
      }
    }
  }
}
```

To check the connection, ask your assistant to list your Redis Cloud
subscriptions.

## What you can do

Your client shows two tools, `search_tools` and `call_tool`. Your assistant
searches for the Redis Cloud tool it needs and then calls it, so your client's
tool list stays short. Clients that support MCP Apps also get `call_ui_tool`,
which opens interactive views such as Agent Memory store metrics.

| Resource | View | Create, update, and delete |
|---|---|---|
| Redis Cloud Essentials subscriptions and databases | Yes | Yes |
| Redis Cloud Pro subscriptions and databases | Yes | No |
| Agent Memory stores and their metrics | Yes | Yes |
| Plans, regions, payment methods, and cloud accounts | Yes | No |

Payment methods show only the card type, the last four digits, and the expiry
date.

Some changes finish in the background. For these, the server returns a task,
and your assistant can check the task's status.

## Confirm changes

The server asks you to confirm before most changes:

| Change | How you confirm |
|---|---|
| Delete a subscription, database, or Agent Memory store | Type the resource name exactly. |
| Update a resource, create a paid subscription, or create an Agent Memory store | Approve the change in your client. |
| Create a free subscription or a database | No confirmation. |

If you decline or cancel, nothing changes. The server never retries a change
automatically.

## Limits

- Each tool call must finish in about 25 seconds. A change that times out might
  still complete, so check the resource before you try again.
- Lists return every matching resource in your account. They aren't paginated.
- The server limits how many requests it accepts. Over the limit, calls fail
  with `Global rate limit exceeded`. Wait, then try again.
- Calls to manage subscriptions and databases also count toward your
  [Redis Cloud API quota](/content/operate/rc/api/examples/usage-quota-and-throttling.md).

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| Your client reports HTTP 401 | A key is missing or wrong. | Check both headers and their values. |
| Your client reports HTTP 403 | The server can't check your access right now. | Try again in a few minutes. |
| A call fails with `Global rate limit exceeded` | Too many requests. | Wait, then try again. |
| A change stops at the confirmation step | Your client doesn't support MCP elicitation. | Use a client that supports elicitation. |
| A change fails with a permission error | The user key's user doesn't have the owner role. | Use a user key for an owner. |
