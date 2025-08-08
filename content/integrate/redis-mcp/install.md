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

## Quick Start with uvx

The easiest way to use the Redis MCP Server is with [`uvx`](https://docs.astral.sh/uv/guides/tools/),
which lets you run it directly from a GitHub branch or a tagged release (see the `uv`
[installation instructions](https://github.com/astral-sh/uv?tab=readme-ov-file#installation)
for more information.)

```bash
# Run with Redis URI
uvx --from git+https://github.com/redis/mcp-redis.git redis-mcp-server --url redis://localhost:6379/0

# Run with Redis URI and SSL 
uvx --from git+https://github.com/redis/mcp-redis.git redis-mcp-server --url "rediss://<USERNAME>:<PASSWORD>@<HOST>:<PORT>?ssl_cert_reqs=required&ssl_ca_certs=<PATH_TO_CERT>"

# Run with individual parameters
uvx --from git+https://github.com/redis/mcp-redis.git redis-mcp-server --host localhost --port 6379 --password mypassword

# See all options
uvx --from git+https://github.com/redis/mcp-redis.git redis-mcp-server --help
```

## Install the server from source

You can also run Redis MCP from source, which may be useful if you want to
contribute to the project.

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

# Run with CLI interface
uv run redis-mcp-server --help

# Or run the main file directly (uses environment variables)
uv run src/main.py
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
You can use environment variables to change these settings
(see [Environment variables](#environment-variables) below for the full list).
For example, for a `bash` shell, use

```bash
export REDIS_USERNAME="my_username"
```

from the command line or the `.bashrc` file to set the username you want
to connect with.

Alternatively, you can use a `.env` file in your project folder to set the
environment variables as key-value pairs, one per line:

```
REDIS_HOST=your_redis_host
REDIS_PORT=6379
    .
    .
```

See the [`.env.example` file](https://github.com/redis/mcp-redis/blob/main/.env.example)
in the repository for the full list of variables and their default values.

You can also set the configuration using command-line arguments, which
may be useful if you only want to change a few settings from the defaults
(see [Command line options](#command-line-options) below for the full list
of options).

```bash
# Basic Redis connection
uvx --from git+https://github.com/redis/mcp-redis.git redis-mcp-server \
  --host localhost \
  --port 6379 \
  --password mypassword

# Using Redis URI (simpler)
uvx --from git+https://github.com/redis/mcp-redis.git redis-mcp-server \
  --url redis://user:pass@localhost:6379/0

# SSL connection
uvx --from git+https://github.com/redis/mcp-redis.git redis-mcp-server \
  --url rediss://user:pass@redis.example.com:6379/0

# See all available options
uvx --from git+https://github.com/redis/mcp-redis.git redis-mcp-server --help
```

{{< note >}}The command-line options take precedence over the environment variables.
{{< /note >}}

### Environment variables

The full set of environment variables is shown in the table below:

| Name                 | Description                 | Default Value |
|----------------------|-----------------------------|---------------|
| `REDIS_HOST`         | Redis IP or hostname   | `"127.0.0.1"` |
| `REDIS_PORT`         | Redis port         | `6379`        |
| `REDIS_DB`           | Database | 0 |
| `REDIS_USERNAME`     | Database username   | `"default"`   |
| `REDIS_PWD`          | Database password       | ""            |
| `REDIS_SSL`          | Enables or disables SSL/TLS    | `False`       |
| `REDIS_CA_PATH`      | CA certificate for verifying server   | None  |
| `REDIS_SSL_KEYFILE`  | Client's private key file for client authentication       | None          |
| `REDIS_SSL_CERTFILE` | Client's certificate file for client authentication       | None          |
| `REDIS_CERT_REQS`    | Whether the client should verify the server's certificate | `"required"`  |
| `REDIS_CA_CERTS`     | Path to the trusted CA certificates file                  | None          |
| `REDIS_CLUSTER_MODE` | Enable Redis Cluster mode                                 | `False`       |

### Command line options

The full set of command line options is shown in the table below:

| Name                 | Description     | Default Value |
|----------------------|-----------------|---------------|
| `--url`              | Redis URL (`redis://user:pass@host:port/db`)   |  |
| `--host`             | Redis IP or hostname   | `"127.0.0.1"` |
| `--port`             | Redis port         | `6379`        |
| `--db`               | Database | 0 |
| `--username`         | Database username   | `"default"`   |
| `--password`         | Database password       | |
| `--ssl`              | Enables or disables SSL/TLS    | `False`       |
| `--ssl-ca-path`          | CA certificate for verifying server   | None  |
| `--ssl-keyfile`      | Client's private key file for client authentication   |    |
| `--ssl-certfile`     | Client's certificate file for client authentication   |   |
| `--ssl-cert-reqs`        | Whether the client should verify the server's certificate   | `"required"`  |
| `--ssl-ca-certs`         | Path to the trusted CA certificates file   |   |
| `--cluster-mode`     | Enable Redis Cluster mode    | `False`       |

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
