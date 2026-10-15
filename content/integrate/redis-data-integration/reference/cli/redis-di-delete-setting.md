---
Title: redis-di delete-setting
linkTitle: redis-di delete-setting
description: Deletes a setting of the RDI instance
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases: []
---

Deletes a runtime setting of the RDI instance. The setting returns to its configured default.
Because this can change leader election, the command asks for confirmation unless you pass
`--force`.

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

The supported setting is `standby_mode`. Deleting it lets the instance rejoin leader election.

## Example

```bash
redis-di delete-setting standby_mode --force
```
