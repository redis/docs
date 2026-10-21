---
Title: redis-di get-secret
linkTitle: redis-di get-secret
description: Gets a secret of a pipeline
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases:
---

Gets a single secret of a pipeline and prints it in the compact `list-secrets` table format. The
output shows the key, database, type, and configuration reference of the secret, but not its value,
because the API never returns secret values.

## Usage

```
redis-di get-secret <key> [flags]
```

## Options

| Option             | Description                                                 |
| :----------------- | :---------------------------------------------------------- |
| `-p`, `--pipeline` | Pipeline to target (default `default`).                     |
| `--db`             | Database the secret belongs to: a source name, or `target`. |
| `-o`, `--output`   | Output format: `table` (default), `json`, or `yaml`.        |

This command also accepts the
[global options](/content/integrate/redis-data-integration/reference/cli/redis-di.md#global-options).

## Example

```bash
redis-di get-secret USERNAME --db mysql
```
