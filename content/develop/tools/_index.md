---
categories:
aliases:
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

## Redis command line interface (CLI)

The [Redis command line interface]({{< relref "/develop/tools/cli" >}}) (also known as `redis-cli`) is a terminal program that sends commands to and reads replies from the Redis server. It has the following two main modes:

1. An interactive Read Eval Print Loop (REPL) mode where the user types Redis commands and receives replies.
2. A command mode where `redis-cli` is executed with additional arguments, and the reply is printed to the standard output.

## Redis Insight

[Redis Insight]({{< relref "/develop/tools/insight" >}}) combines a graphical user interface with Redis CLI to let you work with any Redis deployment. You can visually browse and interact with data, take advantage of diagnostic tools, learn by example, and much more. Best of all, Redis Insight is free.

[Download Redis Insight](https://redis.io/downloads/#:~:text=Redis-,Insight,-Download%20a%20powerful).

## Redis VSCode extension

[Redis for VS Code]({{< relref "/develop/tools/redis-for-vscode" >}})
is an extension that allows you to connect to your Redis databases from within Microsoft Visual Studio Code. After connecting to a database, you can view, add, modify, and delete keys, and interact with your Redis databases using a Redis Insight like UI and also a built-in CLI interface.
