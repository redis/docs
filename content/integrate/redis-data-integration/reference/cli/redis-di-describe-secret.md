---
Title: redis-di describe-secret
linkTitle: redis-di describe-secret
description: Describes a secret of a pipeline
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases:
---

Describes a single secret of a pipeline. The output shows the key, database, type, and
configuration reference of the secret, but not its value, because the API never returns secret
values. The `Config Reference` field contains the placeholder to use in `config.yaml`, such as
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

The output looks like the following:

```
Key:               PASSWORD
Db:                target
Type:              simple
Config Reference:  ${TARGET_DB_PASSWORD}
```
