---
Title: redis-di list-secrets
linkTitle: redis-di list-secrets
description: Lists the secrets of a pipeline
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases:
---

Lists the secrets of a pipeline. The API never returns secret values, so the output shows the secret
key, database, type, configuration reference, and whether the secret is set, not the stored value.
The configuration reference is the placeholder to use in `config.yaml`, such as
`${MYSQL_DB_USERNAME}`.

## Usage

```
redis-di list-secrets [flags]
```

## Options

| Option             | Description                                                         |
| :----------------- | :------------------------------------------------------------------ |
| `-p`, `--pipeline` | Pipeline to target (default `default`).                             |
| `--db`             | List only the secrets of this database: a source name, or `target`. |
| `-o`, `--output`   | Output format: `table` (default), `json`, or `yaml`.                |

This command also accepts the
[global options](/content/integrate/redis-data-integration/reference/cli/redis-di.md#global-options).

## Example

```bash
redis-di list-secrets
redis-di list-secrets --db mysql
redis-di list-secrets -p my-pipeline
```
