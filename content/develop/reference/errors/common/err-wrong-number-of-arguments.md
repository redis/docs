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
description: A command has too many or too few arguments.
linkTitle: ERR wrong number of arguments
title: ERR wrong number of arguments
weight: 11
error:
  prefix: ERR
  message: "ERR wrong number of arguments for '<command>' command"
  match:
  - wrong number of arguments
---

Redis returns this error when a command has more or fewer arguments than it accepts. The message names the command in lowercase. For a subcommand, it shows both names joined by `|`, such as `'config|get'`.

```
ERR wrong number of arguments for 'get' command
```

## Example

```
> GET
(error) ERR wrong number of arguments for 'get' command
> CONFIG GET
(error) ERR wrong number of arguments for 'config|get' command
```

## How to fix it

- **An argument is missing, or there's one too many.** Compare your command with the syntax on its command page, such as [`GET`](/content/commands/get.md).
- **Your code passed an empty list.** Commands such as [`DEL`](/content/commands/del.md), [`MGET`](/content/commands/mget.md), and [`HSET`](/content/commands/hset.md) need at least one key or field. When your code builds the arguments from a list that turns out to be empty, the command gets no keys at all. Check for an empty list before you send the command.
- **A value with spaces was split into several arguments.** In `redis-cli`, `GET my key` sends two arguments, `my` and `key`. Put quotes around a value that contains spaces: `GET "my key"`.
- **The command is `auth`, and you passed a username and a password.** Servers older than Redis 6 accept only a password. Upgrade the server, or send the password alone.
