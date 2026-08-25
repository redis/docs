---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- oss
- kubernetes
- clients
description: Tools to interact with a Redis server
linkTitle: Client tools
hideListLinks: true
title: Client tools
weight: 25
---

You can use several tools to connect to a Redis server, to
manage it and interact with the data:

* The [`redis-cli`](#redis-command-line-interface-cli) command line tool
* [Redis Insight](#redis-insight) (a graphical user interface tool)
* The Redis [VSCode extension](#redis-vscode-extension)
* [`redisctl`](#redisctl) (a unified CLI for managing Redis Cloud and Redis Software)
* [Third-party tools](#third-party-tools) maintained by the community

## Redis command line interface (CLI)

The [Redis command line interface]({{< relref "/develop/tools/cli" >}}) (also known as `redis-cli`) is a terminal program that sends commands to and reads replies from the Redis server. It has the following two main modes:

1. An interactive Read Eval Print Loop (REPL) mode where the user types Redis commands and receives replies.
2. A command mode where `redis-cli` is executed with additional arguments, and the reply is printed to the standard output.

## Redis Insight

[Redis Insight]({{< relref "/develop/tools/insight" >}}) combines a graphical user interface with Redis CLI to let you work with any Redis deployment. You can visually browse and interact with data, take advantage of diagnostic tools, learn by example, and much more. Best of all, Redis Insight is free.

[Download Redis Insight](https://redis.io/downloads/#insight).

## Redis VSCode extension

[Redis for VS Code]({{< relref "/develop/tools/redis-for-vscode" >}})
is an extension that allows you to connect to your Redis databases from within Microsoft Visual Studio Code. After connecting to a database, you can view, add, modify, and delete keys, and interact with your Redis databases using a Redis Insight like UI and also a built-in CLI interface.

## redisctl

[`redisctl`](https://github.com/redis/redisctl) is a unified command-line tool for managing Redis Cloud and Redis Software from your terminal. It provides complete API coverage for both platforms — including subscriptions, databases, VPC peering, ACLs, clusters, and users — without needing custom scripts. It also includes an MCP server component that exposes management operations to AI assistants.

Install via Homebrew, Cargo, or download a binary release from the [GitHub repository](https://github.com/redis/redisctl).

## Third-party tools

The tools above are maintained by Redis. The tools below are maintained by their authors, who are responsible for supporting them.

### LibreDB Studio

[LibreDB Studio](https://github.com/libredb/libredb-studio) is an MIT-licensed, self-hosted database GUI that runs in the browser and is deployed next to the databases it connects to, as a container, a Helm chart, or an npm package. It presents Redis in the same interface as the other engines a team runs, so a cache and the application database behind it can be inspected in one place. The Redis support is built on [`ioredis`](https://github.com/redis/ioredis) and provides:

* A command console that sends any command through a generic dispatch path, including module commands such as `JSON.GET`.
* A key browser that groups keys by prefix using `SCAN` over a bounded sample of the keyspace, rather than `KEYS`.
* Server, client, and slow command views built from `INFO`, `CLIENT LIST`, and `SLOWLOG GET`.

It connects to a single standalone node over an unencrypted connection: Cluster, Sentinel, and TLS are not supported. Commands carry the privileges of the user you connect as, so read-only access has to come from a Redis ACL rather than from the tool.
