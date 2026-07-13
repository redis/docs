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

The output has a section for each part of the pipeline, for example:

```
Name:     default
Active:   yes
Status:   started
Current:  yes

Sources:
  Name   Type  Db Type  Connection        Sync Mode  Connected
  ----   ----  -------  ----------        ---------  ---------
  mysql  cdc   mysql    ${HOST_IP}:13000  streaming  yes

Targets:
  Name    Db Type   Connection        Connected
  ----    -------   ----------        ---------
  target  redis     ${HOST_IP}:12000  yes

Jobs:
  Name                Source               Transformations  Outputs  Connections
  ----                ------               ---------------  -------  -----------
  address_job         inventory.addresses  1                1        target
  customers_hash_job  inventory.customers  0                1        target

Components:
  Name                Type                Version  Status
  ----                ----                -------  ------
  collector-api       collector-api       0.0.0    started
  collector-source    debezium-collector  ...      started
  processor           processor           0.0.0    started

Statistics:
  Name                       Total  Pending  Inserted  Updated  Deleted  Filtered  Rejected  Deduplicated  Last Arrival
  ----                       -----  -------  --------  -------  -------  --------  --------  ------------  ------------
  {rdi}:inventory.customers  4      0        4         0        0        0         0         0             2026-06-18T13:42:44Z
```
