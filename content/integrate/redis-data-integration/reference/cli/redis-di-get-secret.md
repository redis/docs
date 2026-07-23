---
Title: redis-di get-secret
linkTitle: redis-di get-secret
description: Gets a secret of a pipeline
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases:
---

Gets a single secret of a pipeline and prints it in the compact `list-secrets` table format. The API
never returns secret values, so the output shows only the key and whether it is set, not the stored
value.

## Usage

```
redis-di get-secret <key> [flags]
```

## Options

| Option             | Description                                          |
| :----------------- | :--------------------------------------------------- |
| `-p`, `--pipeline` | Pipeline to target (default `default`).              |
| `-o`, `--output`   | Output format: `table` (default), `json`, or `yaml`. |

This command also accepts the
[global options]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di#global-options" >}}).

## Example

```bash
redis-di get-secret SOURCE_DB_USERNAME
```
