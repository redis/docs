---
Title: Quickstart
aliases: null
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Get started creating a write-behind pipeline
draft: null
group: di
hidden: false
linkTitle: Quickstart
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 5
---

This guide takes you through the creation of a write-behind pipeline.


## Concepts

**Write-behind** is a processing pipeline used to synchronize data in a Redis database with a downstream data store.
You can think about it as a pipeline that starts with change data capture (CDC) events for a Redis database and then filters, transforms, and maps the data to the target data store data structures.

The **target** data store to which the write-behind pipeline connects and writes data.

The write-behind pipeline is composed of one or more **jobs**. Each job is responsible for capturing change for one key pattern in Redis and mapping it to one or more tables in the downstream data store. Each job is defined in a YAML file.

{{< image filename="/images/rdi/redis-di-write-behind.png" >}}

## Supported data stores

Write-behind currently supports these target data stores:

| Data Store |
| ---------- |
| Cassandra  |
| MariaDB    |
| MySQL      |
| Oracle     |
| PostgreSQL |
| Redis Enterprise     |
| SQL Server |

## Prerequisites

The only prerequisite for running Write-behind is [Redis Gears Python](https://redis.com/modules/redis-gears/) >= 1.2.6 installed on the Redis Enterprise Cluster and enabled for the database you want to mirror to the downstream data store.
For more information, see
[RedisGears installation]({{< relref "/integrate/write-behind/installation/install-redis-gears" >}}).

## Preparing the write-behind pipeline

- Install [Write-behind CLI]({{< relref "/integrate/write-behind/installation/install-rdi-cli" >}}) on a Linux host that has connectivity to your Redis Enterprise Cluster.
- Run the [`configure`]({{< relref "/integrate/write-behind/reference/cli/redis-di-configure" >}}) command to install the Write-behind Engine on your Redis database, if you have not used this Redis database with Write-behind before.
- Run the [`scaffold`]({{< relref "/integrate/write-behind/reference/cli/redis-di-scaffold" >}}) command with the type of data store you want to use, for example:

  ```bash
  redis-di scaffold --strategy write_behind --dir . --db-type mysql
  ```

  This creates a template `config.yaml` file and a folder named `jobs` under the current directory.
  You can specify any folder name with `--dir` or use the `--preview config.yaml` option, if your Write-behind CLI is deployed inside a Kubernetes (K8s) pod, to get the `config.yaml` template to the terminal.

- Add the connections required for downstream targets in the `connections` section of `config.yaml`, for example:

  ```yaml
  connections:
    my-postgres:
      type: postgresql
      host: 172.17.0.3
      port: 5432
      database: postgres
      user: postgres
      password: postgres
      #query_args:
      # sslmode: verify-ca
      # sslrootcert: /opt/work/ssl/ca.crt
      # sslkey: /opt/work/ssl/client.key
      # sslcert: /opt/work/ssl/client.crt
    my-mysql:
      type: mysql
      host: 172.17.0.4
      port: 3306
      database: test
      user: test
      password: test
      #connect_args:
      # ssl_ca: /opt/ssl/ca.crt
      # ssl_cert: /opt/ssl/client.crt
      # ssl_key: /opt/ssl/client.key
  ```

  This is the first section of the `config.yaml` file and typically the only one you'll need to edit. The `connections` section is designed to have many target connections. In the previous example, there are two downstream connections named `my-postgres` and `my-mysql`.

  To obtain a secured connection using TLS, you can add more `connect_args` or `query_args`, depending on the specific target database terminology, to the connection definition.

  The name can be any arbitrary name as long as it is:

  - Unique for this Write-behind engine
  - Referenced correctly by the jobs in the respective YAML files

In order to prepare the pipeline, fill in the correct information for the target data store. Secrets can be provided using a reference to a secret ([see below](#how-to-provide-targets-secrets)) or by specifying a path.

The `applier` section has information about the batch size and frequency used to write data to the target.

Some of the `applier` attributes such as `target_data_type`, `wait_enabled`, and `retry_on_replica_failure` are specific for the Write-behind ingest pipeline and can be ignored.

### Write-behind jobs

Write-behind jobs are a mandatory part of the write-behind pipeline configuration.
Under the `jobs` directory (parallel to `config.yaml`) you should have a job definition in a YAML file for every key pattern you want to write to a downstream database table.

The YAML file can be named using the destination table name or another naming convention, but it has to have a unique name.

Job definition has the following structure:

```yaml
source:
  redis:
    key_pattern: emp:*
    trigger: write-behind
    exclude_commands: ["json.del"]
transform:
  - uses: rename_field
    with:
      from_field: after.country
      to_field: after.my_country
output:
  - uses: relational.write
    with:
      connection: my-connection
      schema: my-schema
      table: my-table
      keys:
        - first_name
        - last_name
      mapping:
        - first_name
        - last_name
        - address
        - gender
```

### Source section

The `source` section describes the source of data in the pipeline.

The `redis` section is common for every pipeline initiated by an event in Redis, such as applying changes to data. In the case of write-behind, it has the information required to activate a pipeline dealing with changes to data. It includes the following attributes:

- The `key_pattern` attribute specifies the pattern of Redis keys to listen on. The pattern must correspond to keys that are of Hash or JSON type.

- The `exclude_commands` attribute specifies which commands to ignore. For example, if you listen on a key pattern with Hash values, you can exclude the `HDEL` command so no data deletions will propagate to the downstream database. If you don't specify this attribute, Write-behind acts on all relevant commands.
- The `trigger` attribute is mandatory and must be set to `write-behind`.

- The `row_format` attribute can be used with the value `full` to receive both the `before` and `after` sections of the payload. Note that for write-behind events the `before` value of the key is never provided.

 > Note: Write-behind does not support the [`expired`]({{< relref "/develop/pubsub/keyspace-notifications" >}}#events-generated-by-different-commands) event. Therefore, keys that are expired in Redis will not be deleted from the target database automatically.
> Notes: The `redis` attribute is a breaking change replacing the `keyspace` attribute. The `key_pattern` attribute replaces the `pattern` attribute. The `exclude_commands` attributes replaces the `exclude-commands` attribute. If you upgrade to version 0.105 and beyond, you must edit your existing jobs and redeploy them.

### Output section

The `output` section is critical. It specifies a reference to a connection from the `config.yaml` `connections` section:

- The `uses` attribute specifies the type of **writer** Write-behind will use to prepare and write the data to the target.
  In this example, it is `relational.write`, a writer that translates the data into a SQL statement with the specific dialect of the downstream relational database.
  For a full list of supported writers, see
  [data transformation block types]({{< relref "/integrate/write-behind/reference/data-transformation-block-types" >}}).

- The `schema` attribute specifies the schema/database to use (different database have different names for schema in the object hierarchy).

- The `table` attribute specifies the downstream table to use.

- The `keys` section specifies the field(s) in the table that are the unique constraints in that table.

- The `mapping` section is used to map database columns to Redis fields with different names or to expressions. The mapping can be all Redis data fields or a subset of them.

> Note: The columns used in `keys` will be automatically included, so there's no need to repeat them in the `mapping` section.

### Apply filters and transformations to write-behind

The Write-behind jobs can apply filters and transformations to the data before it is written to the target. Specify the filters and transformations under the `transform` section.

#### Filters

Use filters to skip some of the data and not apply it to target.
Filters can apply simple or complex expressions that take as arguments the Redis entry key, fields, and even the change op code (create, delete, update, etc.).
See [Filter]({{< relref "/integrate/write-behind/reference/data-transformation-block-types/filter" >}}) for more information.

#### Transformations

Transformations manipulate the data in one of the following ways:

- Renaming a field
- Adding a field
- Removing a field
- Mapping source fields to use in output

To learn more about transformations, see
[data transformation pipeline]({{< relref "/integrate/write-behind/data-transformation/data-transformation-pipeline" >}}).

## Provide target's secrets

The target's secrets (such as TLS certificates) can be read from a path on the Redis node's file system. This allows the consumption of secrets injected from secret stores.

## Deploy the write-behind pipeline

To start the pipeline, run the
[`deploy`]({{< relref "/integrate/write-behind/reference/cli/redis-di-deploy" >}}) command:

```bash
redis-di deploy
```

You can check that the pipeline is running, receiving, and writing data using the
[`status`]({{< relref "/integrate/write-behind/reference/cli/redis-di-status" >}}) command:

```bash
redis-di status
```

## Monitor the write-behind pipeline

The Write-behind pipeline collects the following metrics:

| Metric Description                  | Metric in [Prometheus](https://prometheus.io/)                                                      |
| ----------------------------------- | --------------------------------------------------------------------------------------------------- |
| Total incoming events by stream     | Calculated as a Prometheus DB query: `sum(pending, rejected, filtered, inserted, updated, deleted)` |
| Created incoming events by stream   | `rdi_metrics_incoming_entries{data_source:"…",operation="inserted"}`                                |
| Updated incoming events by stream   | `rdi_metrics_incoming_entries{data_source:"…",operation="updated"}`                                 |
| Deleted incoming events by stream   | `rdi_metrics_incoming_entries{data_source:"…",operation="deleted"}`                                 |
| Filtered incoming events by stream  | `rdi_metrics_incoming_entries{data_source:"…",operation="filtered"}`                                |
| Malformed incoming events by stream | `rdi_metrics_incoming_entries{data_source:"…",operation="rejected"}`                                |
| Total events per stream (snapshot)  | `rdi_metrics_stream_size{data_source:""}`                                                           |
| Time in stream (snapshot)           | `rdi_metrics_stream_last_latency_ms{data_source:"…"}`                                               |

To use the metrics you can either:

- Run the [`status`]({{< relref "/integrate/write-behind/reference/cli/redis-di-status" >}}) command:

  ```bash
  redis-di status
  ```

- Scrape the metrics using Write-behind's Prometheus exporter

## Upgrading

If you need to upgrade Write-behind, you should use the
[`upgrade`]({{< relref "/integrate/write-behind/reference/cli/redis-di-upgrade" >}}) command that provides for a zero downtime upgrade:

```bash
redis-di upgrade ...
```
