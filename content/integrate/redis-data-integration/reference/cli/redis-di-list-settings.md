---
Title: redis-di list-settings
linkTitle: redis-di list-settings
description: Lists the settings of the RDI instance
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases: []
---

Lists the runtime settings of the RDI instance.

## Usage

```
redis-di list-settings [flags]
```

## Options

| Option           | Description                                          |
| :--------------- | :--------------------------------------------------- |
| `-o`, `--output` | Output format: `table` (default), `json`, or `yaml`. |

This command also accepts the
[global options](/content/integrate/redis-data-integration/reference/cli/redis-di.md#global-options).

The available setting is `standby_mode`. A value of `true` means that the instance does not
participate in leader election.

## Example

```bash
redis-di list-settings
redis-di list-settings -o json
```
