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
description: The server doesn't recognize the command name.
linkTitle: ERR unknown command
title: ERR unknown command
weight: 10
error:
  prefix: ERR
  message: "ERR unknown command '<command>', with args beginning with: <arguments>"
  match:
  - unknown command
  - unknown subcommand
---

Redis returns this error when it doesn't recognize the command you sent. The message repeats the command name and its first arguments, so you can see exactly what the server received. For a command without arguments, the message ends after the command name: `ERR unknown command 'FOO'`.

```
ERR unknown command 'FOO', with args beginning with: 'bar'
```

## Example

```
> FOO bar
(error) ERR unknown command 'FOO', with args beginning with: 'bar'
```

A command that has subcommands, such as `CONFIG`, gives a similar error for a subcommand it doesn't know:

```
> CONFIG FOO
(error) ERR unknown subcommand 'FOO'. Try CONFIG HELP.
```

## How to fix it

- **The command name is misspelled.** Check the name on the command's page, such as [`GET`](/content/commands/get.md).
- **The command is newer than your server.** Each command page shows the version that added the command, under **Available since**. To find your server's version, run [`INFO server`](/content/commands/info.md) and look at the `redis_version` field. Upgrade the server if you need the command.
- **The command needs a feature that the server doesn't include.** For example, `JSON.SET` and `FT.SEARCH` only work when the server includes JSON and Redis Search. Some Redis builds and packages don't include them. To see which modules the server has loaded, run [`MODULE LIST`](/content/commands/module-list.md).
- **The server's configuration renamed or disabled the command.** The `rename-command` setting can give a command a different name, or remove it. See [Disallowing specific commands](/content/operate/oss_and_stack/management/security/_index.md#disallowing-specific-commands).

In a transaction, an unknown command also makes [`EXEC`](/content/commands/exec.md) fail with [`EXECABORT`](/content/develop/reference/errors/common/execabort.md).
