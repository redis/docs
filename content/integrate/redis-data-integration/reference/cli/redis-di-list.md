---
Title: redis-di list
linkTitle: redis-di list
description: Lists all pipelines
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases:
---

Lists all pipelines with their status in a compact table.

## Usage

```
redis-di list [flags]
```

## Options

| Option | Description |
| :-- | :-- |
| `-o`, `--output` | Output format: `table` (default), `json`, or `yaml`. |

This command also accepts the
[global options]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di#global-options" >}}).

## Example

```bash
redis-di list
redis-di list -o json
```
