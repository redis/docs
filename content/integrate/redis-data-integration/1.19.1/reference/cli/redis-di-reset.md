---
Title: redis-di reset
linkTitle: redis-di reset
description: Resets a pipeline
weight: 10
alwaysopen: false
categories: ["redis-di"]
url: '/integrate/redis-data-integration/1.19.1/reference/cli/redis-di-reset/'
---

Clears a pipeline's saved source positions without changing its configured snapshot mode
or flushing the target Redis database. With the default `initial` mode, the collector
takes a new data snapshot and then resumes change data capture (CDC). Other modes can
skip existing rows or omit ongoing change capture. See
[Choose a snapshot mode](/content/integrate/redis-data-integration/1.19.1/data-pipelines/pipeline-config.md#choose-a-snapshot-mode).

By default, the command waits for the pipeline to reach a terminal state before returning.

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
[global options](/content/integrate/redis-data-integration/1.19.1/reference/cli/redis-di.md#global-options).

## Example

```bash
redis-di reset
```
