---
Title: redis-di delete
linkTitle: redis-di delete
description: Deletes a pipeline
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases:
  - /integrate/redis-data-integration/ingest/reference/cli/redis-di-delete/
---

Deletes a pipeline. Because this is destructive, the command asks for confirmation unless you pass
`--force`.

The command deletes the pipeline, its components, and its data from the RDI database. It keeps the
pipeline secrets, and it does not delete records that the pipeline already wrote to the target
database. If you omit the pipeline name, it deletes the `default` pipeline.

## Usage

```
redis-di delete [pipeline] [flags]
```

The command waits for the pipeline to disappear unless you pass `--wait=false`. It fails when the
pipeline has not disappeared before `--timeout`.

## Options

| Option      | Description                                                                       |
| :---------- | :-------------------------------------------------------------------------------- |
| `--force`   | Skip the confirmation prompt.                                                     |
| `--wait`    | Wait for the pipeline to disappear (default `true`).                              |
| `--timeout` | Maximum time to wait for the pipeline to disappear (default `2m`).                |

This command also accepts the
[global options](/content/integrate/redis-data-integration/reference/cli/redis-di.md#global-options).

## Example

```bash
redis-di delete my-pipeline --force
```

To stop a pipeline and keep its empty resource so you can deploy a new configuration later, use
`redis-di deploy --empty` instead:

```bash
redis-di deploy --empty
```

See [Clear a pipeline](/content/integrate/redis-data-integration/data-pipelines/deploy.md#clear-a-pipeline)
for what this removes and what it keeps, and
[`redis-di deploy`](/content/integrate/redis-data-integration/reference/cli/redis-di-deploy.md)
for the command's options.
