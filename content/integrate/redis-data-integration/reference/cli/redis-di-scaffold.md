---
Title: redis-di scaffold
linkTitle: redis-di scaffold
description: Generates pipeline configuration files
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases:
---

Generates a starter pipeline configuration for the given source database type. With `--dir`, the
command writes a `config.yaml` file into that directory, prompting before overwriting an existing
file unless `--force` is set. Without `--dir`, it prints the configuration to standard output.

## Usage

```
redis-di scaffold [flags]
```

## Options

| Option | Description |
| :-- | :-- |
| `--db-type` | Source database type (required): `mariadb`, `mongodb`, `mysql`, `oracle`, `postgresql`, `snowflake`, `sqlserver`, or `spanner`. |
| `--db-flavor` | Source database flavor: `mongodb-atlas`, `mongodb-replica-set`, or `mongodb-sharded-cluster`. |
| `--dir` | Directory to write `config.yaml` to; prints to standard output when omitted. |
| `--force` | Skip the confirmation prompt when overwriting an existing file. |

This command also accepts the
[global options]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di#global-options" >}}).

## Example

```bash
# Print a PostgreSQL configuration to stdout
redis-di scaffold --db-type postgresql

# Write a MySQL configuration into a directory
redis-di scaffold --db-type mysql --dir /opt/rdi/config
```
