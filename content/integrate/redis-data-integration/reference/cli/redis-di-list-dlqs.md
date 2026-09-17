---
Title: redis-di list-dlqs
linkTitle: redis-di list-dlqs
description: Lists the dead-letter queues of a pipeline
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases:
---

Lists the dead-letter queues (DLQs) of a pipeline with their record counts. A DLQ holds the records
that RDI rejected. Use
[`list-dlq-records`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-list-dlq-records" >}})
to read the records of a single queue.

There is one queue per source table, named `<source>.<qualified_table_name>`, where `<source>`
is the source name from `config.yaml` and `<qualified_table_name>` is the qualified table name, 
such as `public.users` for PostgreSQL or `inventory.dbo.users` for SQL Server. See
[Rejected records]({{< relref "/integrate/redis-data-integration/data-pipelines/rejected-records#how-rdi-stores-rejected-records" >}})
for the form each database uses.

## Usage

```
redis-di list-dlqs [flags]
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
redis-di list-dlqs
```
