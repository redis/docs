---
Title: redis-di delete-secret
linkTitle: redis-di delete-secret
description: Deletes a secret of a pipeline
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases:
---

Deletes a secret of a pipeline. Because this is destructive, the command asks for confirmation unless
you pass `--force`.

## Usage

```
redis-di delete-secret <key> [flags]
```

## Options

| Option | Description |
| :-- | :-- |
| `-p`, `--pipeline` | Pipeline to target (default `default`). |
| `--force` | Skip the confirmation prompt. |
| `--wait` | Wait for the pipeline to reach the expected state (default `true`). |
| `--timeout` | Maximum time to wait for the pipeline to reach the expected state (default `2m`). |

This command also accepts the
[global options]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di#global-options" >}}).

## Example

```bash
redis-di delete-secret SOURCE_DB_CACERT --force
```
