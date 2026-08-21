---
Title: redis-di describe
linkTitle: redis-di describe
description: Describes a pipeline with its status
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases:
  - /integrate/redis-data-integration/reference/cli/redis-di-status/
---

Describes a pipeline, combining its configuration with its runtime status, components, errors, and
metrics in a human-readable, sectioned layout. `status` is an alias for this command.

The RDI version is not shown here, because it is a property of the API connection rather than of the
pipeline; use [`info`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-info" >}})
to see it.

## Usage

```
redis-di describe [pipeline] [flags]
```

The pipeline name is an optional argument that defaults to `default`.

## Options

This command takes only the
[global options]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di#global-options" >}}).

## Example

```bash
redis-di describe
redis-di status my-pipeline
```

To watch the status update live, pair the command with `watch`:

```bash
watch -n 1 redis-di describe
```

The output has a section for each part of the pipeline. The example below shows a pipeline with
two sources, `mysql` and `postgresql`:

```
Name:     default
Active:   yes
Status:   started
Current:  yes

Sources:
  Name        Type  Db Type     Connection              Sync Mode  Connected
  ----        ----  -------     ----------              ---------  ---------
  mysql       cdc   mysql       <mysql-host>:3306       streaming  yes
  postgresql  cdc   postgresql  <postgresql-host>:5432  streaming  yes

Targets:
  Name    Db Type  Connection                 Connected
  ----    -------  ----------                 ---------
  target  redis    <redis-target-host>:12000  yes

Processor:
  Type:  classic

Jobs:
  Name                Server Name  Db / Schema  Table      Transformations  Outputs  Connections
  ----                -----------  -----------  -----      ---------------  -------  -----------
  billing_job         postgresql   public       customers  1                1        target
  customers_hash_job  mysql        inventory    customers  0                1        target
  orders_job          mysql        inventory    orders     1                1        target

Components:
  Name                  Type                Version    Status
  ----                  ----                -------    ------
  collector-api         collector-api       <version>  started
  collector-mysql       debezium-collector  <version>  started
  collector-postgresql  debezium-collector  <version>  started
  processor             stream-processor    <version>  started

Statistics:
  Name                         Total  Pending  Inserted  Updated  Deleted  Filtered  Rejected  Deduplicated  Last Arrival
  ----                         -----  -------  --------  -------  -------  --------  --------  ------------  ------------
  mysql.inventory.customers    4      0        4         0        0        0         0         0             2026-06-18T13:42:44Z
  mysql.inventory.orders       12     0        12        0        0        0         0         0             2026-06-18T13:42:51Z
  postgresql.public.customers  7      0        7         0        0        0         0         0             2026-06-18T13:42:49Z
```
