---
Title: redis-di stop
linkTitle: redis-di stop
description: Stops a pipeline
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases:
---

Stops a pipeline. By default, the command waits for the pipeline to reach the `stopped` state before
returning.

## Usage

```
redis-di stop [pipeline] [flags]
```

The pipeline name is an optional argument that defaults to `default`.

## Options

| Option | Description |
| :-- | :-- |
| `--wait` | Wait for the pipeline to reach the expected state (default `true`). |
| `--timeout` | Maximum time to wait for the pipeline to reach the expected state (default `2m`). |

This command also accepts the
[global options]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di#global-options" >}}).

## Example

```bash
redis-di stop
```
