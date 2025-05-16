---
Title: Configure client apps
alwaysopen: false
categories:
- docs
- integrate
- rs
summary: Access a Redis server using any MCP client.
group: service
linkTitle: Configure client apps
description: Configure client apps to use the Redis MCP server.
type: integration
weight: 20
---

When you have [installed]({{< relref "/integrate/redis-mcp/install" >}})
the Redis MCP server, you must also configure your client app to use it.
The sections below describe the ways you can do this.

## Smithery

Smithery provides a searchable repository of scripts that add configurations
for many MCP services to client apps.
The easiest way to configure your client is to use the
[Smithery tool for Redis MCP](https://smithery.ai/server/@redis/mcp-redis).

When you select your client from the **Install** bar on the Redis MCP page,
you will see a command line that you can copy and paste into a terminal.
Running this command will configure your client app to use Redis MCP. (Note
that you need to have [Node.js](https://nodejs.org/en) installed to run
the Smithery scripts.) For example, the command line for
[Claude Desktop](https://claude.ai/download) is

```bash
npx -y @smithery/cli@latest install @redis/mcp-redis --client claude
```

The script will prompt you for the information required to connect to
your Redis database.

## Manual configuration

You can also add the configuration for Redis MCP to your client app
manually. The exact method varies from client to client but the
basic approach is similar in each case.

For a locally-running MCP server, you need to edit the configuration
file to add the command that launches the server, along with its
arguments. For example, with Claude Desktop, you can locate the
file by selecting **Settings** from the menu, then selecting the
**Developer** tab, and then clicking the **Edit Config** button.
When you open this JSON file, you should add your settings as
shown below:

```json
{
    "mcpServers": {
        .
        .
      "redis": {
            "command": "<path-to-uv-command>>",
            "args": [
                "--directory",
                "<your-folder-path>/mcp-redis",
                "run",
                "src/main.py"
            ]
        }
    },
        .
        .
  }
```

You can find the path to the `uv` command using `which uv`, or
the equivalent. You can also optionally set the environment for
the command shell here in the `env` section:

```json
"redis": {
    "command": "<path-to-uv-command>>",
    "args": [
        "--directory",
        "<your-folder-path>/mcp-redis",
        "run",
        "src/main.py"
    ],
    "env": {
        "REDIS_HOST": "<your_redis_database_hostname>",
        "REDIS_PORT": "<your_redis_database_port>",
        "REDIS_PWD": "<your_redis_database_password>",
        "REDIS_SSL": True|False,
        "REDIS_CA_PATH": "<your_redis_ca_path>",
        "REDIS_CLUSTER_MODE": True|False
    }
}
```


