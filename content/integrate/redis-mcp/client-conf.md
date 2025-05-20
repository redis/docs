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

[Smithery](https://smithery.ai/) provides a searchable repository of scripts
that add configurations for many MCP services to client apps.
The easiest way to configure your client is to use the
[Smithery tool for Redis MCP](https://smithery.ai/server/@redis/mcp-redis).

When you select your client from the **Install** bar on the Redis MCP page,
you will see a command line that you can copy and paste into a terminal.
Running this command will configure your client app to use Redis MCP. (Note
that you must have [Node.js](https://nodejs.org/en) installed to run
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
basic approach is similar in each case. The pages listed below
give the general configuration details for some common MCP client tools:

-   [Claude Desktop](https://modelcontextprotocol.io/quickstart/user)
-   [GitHub Copilot for VS Code](https://code.visualstudio.com/docs/copilot/chat/mcp-servers)
-   [OpenAI](https://openai.github.io/openai-agents-python/mcp/)

### Local servers

For a locally-running MCP server, you need to edit the configuration
file to add the command that launches the server, along with its
arguments. For example, with Claude Desktop, you can locate the
file by selecting **Settings** from the menu, then selecting the
**Developer** tab, and then clicking the **Edit Config** button.
Open this JSON file and add your settings as
shown below:

```json
{
    "mcpServers": {
        .
        .
      "redis": {
            "command": "<path-to-uv-command>",
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

If you are using
[Docker]({{< relref "/integrate/redis-mcp/install#install-using-docker" >}})
to deploy the server, change the `command` and `args` sections of the
configuration as shown below:

```json
"redis": {
    "command": "docker",
    "args": ["run",
            "--rm",
            "--name",
            "redis-mcp-server",
            "-i",
            "-e", "REDIS_HOST=<redis_hostname>",
            "-e", "REDIS_PORT=<redis_port>",
            "-e", "REDIS_USERNAME=<redis_username>",
            "-e", "REDIS_PWD=<redis_password>",
            "mcp-redis"]
}
```

### Remote servers

If you set up an
[externally visible]({{< relref "/integrate/redis-mcp/install#making-mcp-visible-externally" >}})
MCP server, you may be able to configure it directly from the app (but
if you can't, then see [Using a gateway](#using-a-gateway) for an alternative approach). For
example, the following `JSON` element configures
[GitHub Copilot for VS Code](https://code.visualstudio.com/docs/copilot/overview)
to use an `sse` type server running at `127.0.0.1`:

```json
    .
    .
"mcp": {
    "servers": {
        "redis-mcp": {
            "type": "sse",
            "url": "http://127.0.0.1:8000/sse"
        },
    }
},
    .
    .
```

### Using a gateway

Apps that don't currently support external MCP servers directly, such as Claude
Desktop, can still access them using a *gateway*. See
[MCP server gateway](https://github.com/lightconetech/mcp-gateway)
for more information.

## Redis Cloud MCP

If you are using
[Redis Cloud MCP]({{< relref "/integrate/redis-mcp/install#redis-cloud-mcp" >}}),
the configuration is similar to [basic MCP](#manual-configuration), but with a
few differences. Set the client to run the server using the `node` command, as shown 
in the example for Claude Desktop below:

```json
{
  "mcpServers": {
    "mcp-redis-cloud": {
      "command": "node",
      "args": ["--experimental-fetch", "<absolute_path_to_project_root>/dist/index.js"],
      "env": {
        "API_KEY": "<redis_cloud_api_key>",
        "SECRET_KEY": "<redis_cloud_api_secret_key>"
      }
    }
  }
}
```

Here, the environment includes the Redis Cloud API key and API secret key
(see [Redis Cloud REST API]({{< relref "/operate/rc/api" >}}) for more
information).

If you are deploying Redis Cloud MCP with Docker, use a configuration like
the following to launch the server with the `docker` command:

```json
{
  "mcpServers": {
    "redis-cloud": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "API_KEY=<your_redis_cloud_api_key>",
        "-e",
        "SECRET_KEY=<your_redis_cloud_api_secret_key>",
        "mcp/redis-cloud"
      ]
    }
  }
}
```
