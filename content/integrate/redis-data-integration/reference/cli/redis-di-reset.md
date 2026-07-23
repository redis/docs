---
Title: redis-di reset
linkTitle: redis-di reset
description: Resets a pipeline
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases:
---

Resets a pipeline into initial full-sync mode, so it reloads a snapshot of the source data before
resuming change data capture. By default, the command waits for the pipeline to reach a terminal
state before returning.

## Usage

```
redis-di reset [pipeline] [flags]
```

The pipeline name is an optional argument that defaults to `default`.

## Options

| Option      | Description                                                                       |
| :---------- | :-------------------------------------------------------------------------------- |
| `--wait`    | Wait for the pipeline to reach the expected state (default `true`).               |
| `--timeout` | Maximum time to wait for the pipeline to reach the expected state (default `2m`). |

This command also accepts the
[global options]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di#global-options" >}}).

## Example

```bash
redis-di reset
```
