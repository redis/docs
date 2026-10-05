---
Title: redis-di start
linkTitle: redis-di start
description: Starts a pipeline
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases:
- /integrate/redis-data-integration/ingest/reference/cli/redis-di-start/
---

Starts a pipeline. By default, the command waits for the pipeline to reach the `started` state before
returning.

An [external collector](/content/integrate/redis-data-integration/data-pipelines/external-sources.md#operate-an-external-source)
cannot be started with `--source`. Starting its pipeline does not start the external writer.

## Usage

```
redis-di start [pipeline] [flags]
```

The pipeline name is an optional argument that defaults to `default`.

## Options

| Option      | Description                                                                       |
| :---------- | :-------------------------------------------------------------------------------- |
| `--source`  | Target only this source instead of the whole pipeline.                            |
| `--wait`    | Wait for the pipeline to reach the expected state (default `true`).               |
| `--timeout` | Maximum time to wait for the pipeline to reach the expected state (default `2m`). |

This command also accepts the
[global options](/content/integrate/redis-data-integration/reference/cli/redis-di.md#global-options).

## Example

```bash
redis-di start
redis-di start my-pipeline --wait=false

# Start only source mysql. Does not start the pipeline if it's currently stopped.
redis-di start --source mysql
```
