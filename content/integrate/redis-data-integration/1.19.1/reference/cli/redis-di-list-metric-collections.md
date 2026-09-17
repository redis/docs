---
Title: redis-di list-metric-collections
linkTitle: redis-di list-metric-collections
description: Lists the metric collections of a pipeline
weight: 10
alwaysopen: false
categories: ["redis-di"]
url: '/integrate/redis-data-integration/1.19.1/reference/cli/redis-di-list-metric-collections/'
---

Lists the metric collections of a pipeline. Metric collections hold the raw component metrics that
the [`describe`]({{< relref "/integrate/redis-data-integration/1.19.1/reference/cli/redis-di-describe" >}})
command summarizes in its Statistics and Performance sections. This command is most useful with
`-o json` or `-o yaml` for scripting and for tools such as `jq`.

## Usage

```
redis-di list-metric-collections [flags]
```

## Options

| Option             | Description                                          |
| :----------------- | :--------------------------------------------------- |
| `-p`, `--pipeline` | Pipeline to target (default `default`).              |
| `-o`, `--output`   | Output format: `table` (default), `json`, or `yaml`. |

This command also accepts the
[global options]({{< relref "/integrate/redis-data-integration/1.19.1/reference/cli/redis-di#global-options" >}}).

## Example

```bash
redis-di list-metric-collections
```
