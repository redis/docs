---
Title: redis-di get-metric-collection
linkTitle: redis-di get-metric-collection
description: Gets a metric collection of a pipeline
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases:
---

Gets a single metric collection of a pipeline, returning its raw metric data. This command is most
useful with `-o json` or `-o yaml` for scripting and for tools such as `jq`. Use
[`list-metric-collections`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-list-metric-collections" >}})
to see the available collections.

## Usage

```
redis-di get-metric-collection <name> [flags]
```

## Options

| Option | Description |
| :-- | :-- |
| `-p`, `--pipeline` | Pipeline to target (default `default`). |
| `-o`, `--output` | Output format: `table` (default), `json`, or `yaml`. |

This command also accepts the
[global options]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di#global-options" >}}).

## Example

```bash
redis-di get-metric-collection processor -o json
```
