---
Title: redis-di delete-context
linkTitle: redis-di delete-context
description: Deletes a context
weight: 10
alwaysopen: false
categories: ["redis-di"]
url: '/integrate/redis-data-integration/1.19.1/reference/cli/redis-di-delete-context/'
---

Deletes a context from the `~/.redis-di` context file. Because this is destructive, the command asks
for confirmation unless you pass `--force`.

## Usage

```
redis-di delete-context <name> [flags]
```

## Options

| Option    | Description                   |
| :-------- | :---------------------------- |
| `--force` | Skip the confirmation prompt. |

This command also accepts the
[global options]({{< relref "/integrate/redis-data-integration/1.19.1/reference/cli/redis-di#global-options" >}}).

## Example

```bash
redis-di delete-context dev --force
```
