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
only the key and whether it is set, not the stored value.

## Usage

```
redis-di describe-secret <key> [flags]
```

## Options

| Option             | Description                             |
| :----------------- | :-------------------------------------- |
| `-p`, `--pipeline` | Pipeline to target (default `default`). |

This command also accepts the
[global options]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di#global-options" >}}).

## Example

```bash
redis-di describe-secret TARGET_DB_PASSWORD
```
