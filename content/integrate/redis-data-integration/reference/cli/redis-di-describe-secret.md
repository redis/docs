---
Title: redis-di describe-secret
linkTitle: redis-di describe-secret
description: Describes a secret of a pipeline
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases:
---

Describes a single secret of a pipeline. The API never returns secret values, so the output shows
the key, database, type, configuration reference, and whether it is set, not the stored value.

The **Config Reference** row contains the placeholder to use in `config.yaml`, such as
`${TARGET_DB_PASSWORD}`.

## Usage

```
redis-di describe-secret <key> [flags]
```

## Options

| Option             | Description                                                 |
| :----------------- | :---------------------------------------------------------- |
| `-p`, `--pipeline` | Pipeline to target (default `default`).                     |
| `--db`             | Database the secret belongs to: a source name, or `target`. |

This command also accepts the
[global options](/content/integrate/redis-data-integration/reference/cli/redis-di.md#global-options).

## Example

```bash
redis-di describe-secret PASSWORD --db target
```
