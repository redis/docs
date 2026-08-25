---
Title: redis-di get-dlq
linkTitle: redis-di get-dlq
description: Gets a dead-letter queue of a pipeline
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases:
---

Gets a single dead-letter queue (DLQ) of a pipeline and prints it in the compact `list-dlqs` table
format.

## Usage

```
redis-di get-dlq <name> [flags]
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
redis-di get-dlq inventory.customers
```
