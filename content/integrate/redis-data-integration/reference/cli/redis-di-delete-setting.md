---
Title: redis-di delete-setting
linkTitle: redis-di delete-setting
description: Deletes a setting of the RDI instance
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases: []
---

Deletes a runtime setting of the RDI instance, so that the corresponding installation value
applies again. Because this can change the behavior of the instance, the command asks for
confirmation unless you pass `--force`.

## Usage

```
redis-di delete-setting <name> [flags]
```

## Options

| Option      | Description                           |
| :---------- | :------------------------------------ |
| `--force`   | Skip the confirmation prompt.          |

This command also accepts the
[global options](/content/integrate/redis-data-integration/reference/cli/redis-di.md#global-options).

See [RDI instance settings](/content/integrate/redis-data-integration/reference/instance-settings.md)
for the available settings and what deleting each one does.

## Example

```bash
redis-di delete-setting standby_mode --force
```
