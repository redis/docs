---
Title: redis-di delete
linkTitle: redis-di delete
description: Deletes a pipeline
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases:
---

Deletes a pipeline. Because this is destructive, the command asks for confirmation unless you pass
`--force`.

## Usage

```
redis-di delete [pipeline] [flags]
```

The pipeline name is an optional argument that defaults to `default`.

## Options

| Option      | Description                                                                       |
| :---------- | :-------------------------------------------------------------------------------- |
| `--force`   | Skip the confirmation prompt.                                                     |
| `--wait`    | Wait for the pipeline to reach the expected state (default `true`).               |
| `--timeout` | Maximum time to wait for the pipeline to reach the expected state (default `2m`). |

This command also accepts the
[global options]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di#global-options" >}}).

## Example

```bash
redis-di delete my-pipeline --force
```
