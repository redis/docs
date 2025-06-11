---
Title: Install
alwaysopen: false
categories:
- docs
- integrate
- rs
summary: Access a Redis server using any MCP client.
group: service
linkTitle: Install the server
description: Install and configure the Redis MCP server.
type: integration
weight: 10
---

The MCP server runs separately from Redis, so you will need a
Redis server for it to connect to. See [Redis Cloud]({{< relref "/operate/rc" >}})
or [Redis Open Source]({{< relref "/operate/oss_and_stack" >}}) to learn
how to get a test server active within minutes.

When you have a Redis server available, use the instructions below to install and
configure the Redis MCP server.

## Install the server from source

Clone Redis MCP from the
[Github repository](https://github.com/redis/mcp-redis) using the following
command:

```bash
git clone https://github.com/redis/mcp-redis.git
```

You will also need the [`uv`](https://github.com/astral-sh/uv) packaging
tool to set up the server. See the `uv`
[installation instructions](https://github.com/astral-sh/uv?tab=readme-ov-file#installation)
for more information.

When you have installed `uv`, go to the `mcp-redis` folder that you cloned and
enter the following commands to initialize the MCP server code:

```bash
cd mcp-redis

uv venv
source .venv/bin/activate
uv sync
```

## Install using Docker

You can use the [`mcp/redis`](https://hub.docker.com/r/mcp/redis)
image to run Redis MCP with [Docker](https://www.docker.com/).
Alternatively, use the following
command to build the Docker image with the `Dockerfile` in the
`mcp/redis` folder:

```
docker build -t mcp-redis .
```

## Configuration

The default settings for MCP assume a Redis server is running on the
local machine, with the default port and no security arrangements.
To change these settings, use the environment variables shown in the
table below. For example, for a `bash` shell, use

```bash
export REDIS_USERNAME="my_username"
```

from the command line or the `.bashrc` file to set the username you want
to connect with.


| Name                 | Description                                               | Default Value |
|----------------------|-----------------------------------------------------------|---------------|
| `REDIS_HOST`         | Redis IP or hostname                                      | `"127.0.0.1"` |
| `REDIS_PORT`         | Redis port                                                | `6379`        |
| `REDIS_DB`           | Database | 0 |
| `REDIS_USERNAME`     | Database username                                 | `"default"`   |
| `REDIS_PWD`          | Database password                                 | ""            |
| `REDIS_SSL`          | Enables or disables SSL/TLS                               | `False`       |
| `REDIS_CA_PATH`      | CA certificate for verifying server                       | None          |
| `REDIS_SSL_KEYFILE`  | Client's private key file for client authentication       | None          |
| `REDIS_SSL_CERTFILE` | Client's certificate file for client authentication       | None          |
| `REDIS_CERT_REQS`    | Whether the client should verify the server's certificate | `"required"`  |
| `REDIS_CA_CERTS`     | Path to the trusted CA certificates file                  | None          |
| `REDIS_CLUSTER_MODE` | Enable Redis Cluster mode                                 | `False`       |
| `MCP_TRANSPORT`      | Use the `stdio` or `sse` transport                        | `stdio`       |

### Making MCP visible externally

{{< note >}}The configuration for an MCP client includes the commands
to start a local server, so you can ignore this section if you don't
want your Redis MCP to be externally accessible.
{{< /note >}}

The default configuration assumes you only want to use the MCP server
locally, but you can make it externally available by setting
`MCP_TRANSPORT` to `sse`:

```bash
export MCP_TRANSPORT="sse"
```

Then, start the server with the following command:

```bash
uv run src/main.py
```

You can test the server is responding with the [`curl`](https://curl.se/)
tool:

```bash
curl -i http://127.0.0.1:8000/sse
HTTP/1.1 200 OK
```

## Redis Cloud MCP

A separate version of the MCP server is available for
[Redis Cloud]({{< relref "/operate/rc" >}}). This has the same main
functionality as the basic MCP server but also has some features
specific to Redis Cloud, including subscription management and
billing details. For example, you can use questions and instructions
like the following:

-   "Create a new Redis database in AWS"
-   "What are my current subscriptions?"
-   "Help me choose the right Redis database for my e-commerce application"

You will need [Node.js](https://nodejs.org/en) installed to run Redis Cloud MCP.
Clone the GitHub repository using the following command:

```bash
git clone https://github.com/redis/mcp-redis-cloud.git
```

Go into the `mcp-redis-cloud` folder and install the dependencies:

```bash
npm run build
```

The server is now ready for use.

You can also deploy Redis Cloud MCP using Docker. Build the image
using the `Dockerfile` in the repository folder with the following
command:

```bash
docker build -t mcp/redis-cloud .
```

## Next steps

When you have installed the server, you will need a MCP client to
connect to it and use its services. See
[Configure client apps]({{< relref "/integrate/redis-mcp/client-conf" >}})
for more information.
