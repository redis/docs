---
categories:
- docs
- operate
- stack
- oss
description: How to install just the Redis CLI (redis-cli) without installing all of Redis
linkTitle: Install redis-cli
title: Install redis-cli
weight: 8
---

If you only need the [Redis CLI]({{< relref "/develop/tools/cli" >}}) (`redis-cli`) to connect to a remote Redis server, you can install it on its own, without installing the full Redis Open Source distribution or building it from source.

The installer downloads a single, statically linked `redis-cli` binary, so it works even on minimal images (such as Amazon Linux, openSUSE, or distroless). It requires only `curl` or `wget`.

{{< note >}}
This installation method is supported on **Linux** and **macOS** only, on `x86_64`/`amd64` and `arm64`/`aarch64` processors. It does not run on native Windows. You have two options:

1. You can run it under the [Windows Subsystem for Linux (WSL)](https://learn.microsoft.com/windows/wsl/).
1. You can use it with Docker; see [Run Redis Open Source on Docker]({{< relref "/operate/oss_and_stack/install/install-stack/docker" >}}) for more information.
{{< /note >}}

## Install redis-cli

Run the following command:

{{< highlight bash >}}
curl -fsSL https://packages.redis.io/redis-cli/install.sh | sh
{{< /highlight >}}

The script detects your operating system and architecture, downloads the matching `redis-cli` binary, verifies its SHA-256 checksum, and installs it to `/usr/local/bin` (using `sudo` if required). If `/usr/local/bin` is not writable, it installs to `~/.local/bin` instead.

{{< note >}}
As with any `curl ... | sh` command, review the [install script](https://packages.redis.io/redis-cli/install.sh) before running it if you want to see exactly what it does.
{{< /note >}}

### Install a specific version

By default, the script installs the latest stable release. To install a particular version, set the `REDIS_CLI_VERSION` environment variable:

{{< highlight bash >}}
curl -fsSL https://packages.redis.io/redis-cli/install.sh | REDIS_CLI_VERSION=8.8.0 sh
{{< /highlight >}}

### Choose the installation directory

To install `redis-cli` to a location of your choice, set the `REDIS_CLI_INSTALL_DIR` environment variable:

{{< highlight bash >}}
curl -fsSL https://packages.redis.io/redis-cli/install.sh | REDIS_CLI_INSTALL_DIR="$HOME/bin" sh
{{< /highlight >}}

If the installation directory is not on your `PATH`, the script prints a note reminding you to add it.

## Connect to Redis

Once `redis-cli` is installed, you can use it to connect to any Redis instance. For example, to connect to a server running on `localhost` on the default port:

{{< highlight bash >}}
redis-cli
{{< /highlight >}}

To connect to a remote server, specify the host and port:

{{< highlight bash >}}
redis-cli -h <host> -p <port>
{{< /highlight >}}

Test the connection with the `ping` command:

{{< highlight bash >}}
127.0.0.1:6379> PING
PONG
{{< /highlight >}}

## Next steps

- Try the [Redis CLI tutorial]({{< relref "/develop/tools/cli" >}}).
- If you need a full Redis installation, see the other [installation guides]({{< relref "/operate/oss_and_stack/install/install-stack" >}}).
