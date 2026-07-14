---
Title: redis-di list-secrets
linkTitle: redis-di list-secrets
description: Lists the secrets of a pipeline
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases:
---

Lists the secrets of a pipeline. The API never returns secret values, so the output shows only the
secret keys and whether each one is set, not the stored values.

## Usage

```
redis-di list-secrets [flags]
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
redis-di list-secrets
redis-di list-secrets -p my-pipeline
```
