---
Title: redis-di get-setting
linkTitle: redis-di get-setting
description: Gets a setting of the RDI instance
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases: []
---

Gets one runtime setting of the RDI instance.

## Usage

```
redis-di get-setting <name> [flags]
```

## Options

| Option           | Description                                          |
| :--------------- | :--------------------------------------------------- |
| `-o`, `--output` | Output format: `table` (default), `json`, or `yaml`. |

This command also accepts the
[global options](/content/integrate/redis-data-integration/reference/cli/redis-di.md#global-options).

The supported setting is `standby_mode`.

## Example

```bash
redis-di get-setting standby_mode
```
