---
Title: redis-di get
linkTitle: redis-di get
description: Gets a pipeline
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases:
---

Gets a single pipeline and prints it in the compact `list` table format. Use
[`describe`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-describe" >}})
for the full pipeline view with its status and metrics.

## Usage

```
redis-di get [pipeline] [flags]
```

The pipeline name is an optional argument that defaults to `default`.

## Options

| Option           | Description                                          |
| :--------------- | :--------------------------------------------------- |
| `-o`, `--output` | Output format: `table` (default), `json`, or `yaml`. |

This command also accepts the
[global options]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di#global-options" >}}).

## Example

```bash
redis-di get
redis-di get my-pipeline -o yaml
```
