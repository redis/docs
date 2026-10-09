---
Title: redis-di start
linkTitle: redis-di start
description: Starts a pipeline
weight: 10
alwaysopen: false
categories: ["redis-di"]
url: '/integrate/redis-data-integration/1.19.1/reference/cli/redis-di-start/'
---

Starts a pipeline. By default, the command waits for the pipeline to reach the `started` state before
returning.

## Usage

```
redis-di start [pipeline] [flags]
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
redis-di start
redis-di start my-pipeline --wait=false
```
