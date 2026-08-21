---
Title: Pipeline configuration file
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Learn how to specify the main configuration details for an RDI pipeline.
group: di
linkTitle: Pipeline configuration file
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 3
aliases:
- /integrate/redis-data-integration/ingest/data-pipelines/data-pipelines/
---

The main configuration details for an RDI pipeline are in the `config.yaml` file.
This file specifies the connection details for the source and target databases,
and also the set of tables you want to capture. You can also add one or more
[job files]({{< relref "/integrate/redis-data-integration/data-pipelines/transform-examples" >}})
if you want to apply custom transformations to the captured data.

Each section explains one part of the file. Start with the minimal example, then
add only the optional properties that you need. See the
[configuration file reference]({{< relref "/integrate/redis-data-integration/reference/config-yaml-reference" >}})
for all supported properties.

## Before you start

Before you create `config.yaml`:

1. [Prepare the source database]({{< relref "/integrate/redis-data-integration/data-pipelines/prepare-dbs" >}}) for change data capture.
1. [Install RDI]({{< relref "/integrate/redis-data-integration/installation" >}}).
1. [Set the secrets]({{< relref "/integrate/redis-data-integration/data-pipelines/deploy#set-secrets" >}}) that the file references.

## Start with a minimal file

The following example shows the required structure of a `config.yaml` file. Values of the
form "`${name}`" refer to secrets that you should set as described in
[Set secrets]({{< relref "/integrate/redis-data-integration/data-pipelines/deploy#set-secrets" >}}).
In particular, you should normally use secrets as shown to set the source
and target username and password rather than storing them in plain text in this file.

```yaml
sources:
  mysql:
    type: cdc
    logging:
      level: info
    connection:
      type: mysql
      host: <DB_HOST>
      port: 3306
      user: ${SOURCE_DB_USERNAME}
      password: ${SOURCE_DB_PASSWORD}

targets:
  target:
    connection:
      type: redis
      host: <REDIS_TARGET_DB_HOST>
      port: <REDIS_TARGET_DB_PORT>
      password: ${TARGET_DB_PASSWORD}

processors:
  type: flink
  target_data_type: hash
```

Keep `type: flink` for new pipelines. The other processor properties have defaults,
so add them only when you need to change the default behavior.

## Build the file with an AI assistant

Copy the following prompt into your AI assistant. The prompt tells the assistant
to use the RDI documentation as its source of truth and to flag unsupported requests.

```text
Help me create a valid Redis Data Integration (RDI) config.yaml file.

Use only these pages as sources for configuration properties and behavior:
- https://redis.io/docs/latest/integrate/redis-data-integration/data-pipelines/pipeline-config/
- https://redis.io/docs/latest/integrate/redis-data-integration/reference/config-yaml-reference/
- https://redis.io/docs/latest/integrate/redis-data-integration/data-pipelines/prepare-dbs/

Do not invent property names. If a requested property is not documented, tell me.
Use ${NAME} secret references for credentials and certificates. Do not include secret
values in the file. Configure one target Redis database named `target`. Always use the
Flink processor by setting `processors.type` to `flink`.

Ask me for the following information one question at a time:
1. Source database type, host, and port.
2. Databases or schemas to capture.
3. Tables and columns to capture, including keys for tables without a primary key
   or unique constraint.
4. Whether the initial snapshot needs a row filter.
5. Target Redis host and port, and whether the connection uses TLS or mTLS.
6. Redis hash or JSON output.

After I answer, generate config.yaml. Then list the required secrets and link me to
the documented commands to set the secrets and deploy the pipeline.
```

## Sections

The main sections of the file configure [`sources`](#sources), [`targets`](#targets),
and [`processors`](#processors).

### Sources

The `sources` section has a subsection for the source that
you need to configure. The source section starts with a unique name
to identify the source (in the example, there is a source
called `mysql` but you can choose any name you like). The example
configuration contains the following data:

- `type`: The collector to use for the pipeline. Use `cdc` for MariaDB, MySQL,
  MongoDB, Oracle, PostgreSQL, or SQL Server. Use `flink` for Google Cloud
  Spanner. Use `riotx` for Snowflake. Use `external` when you provide and manage
  the collector. RDI doesn't create collector resources for an `external` source,
  so omit the other properties in the source section.
- `connection`: The connection details for the source database: `type`, `host`, `port`,
  and credentials (`user` and `password`).
  See the [configuration file reference]({{< relref "/integrate/redis-data-integration/reference/config-yaml-reference#sourcesconnection" >}})
  for the required fields for each source database type.
  - If you use [TLS](https://en.wikipedia.org/wiki/Transport_Layer_Security)/
    or [mTLS](https://en.wikipedia.org/wiki/Mutual_authentication#mTLS) to connect
    to the source database, you may need to specify additional properties in the
    `advanced` section with references to the corresponding certificates depending
    on the source database type. Note that these properties **must** be references to
    secrets that you should set as described in [Set secrets]({{< relref "/integrate/redis-data-integration/data-pipelines/deploy#set-secrets" >}}).
- `databases`: List of all databases to collect data from for source database types
  that support multiple databases, such as `mysql` and `mariadb`.
- `schemas`: List of all schemas to collect data from for source database types
  that support multiple schemas, such as `oracle`, `postgresql`, and `sqlserver`.
- `tables`: List of all tables to collect data from. Each table is identified by its
  full name, including a database or schema prefix. If there is a single
  database or schema, this prefix can be omitted.
  For each table, you can specify:
  - `columns`: A list of the columns you are interested in (the default is to
    include all columns)
  - `keys`: A list of columns to create a composite key if your table
    doesn't already have a [`PRIMARY KEY`](https://www.w3schools.com/sql/sql_primarykey.asp) or
    [`UNIQUE`](https://www.w3schools.com/sql/sql_unique.asp) constraint.
  - `snapshot_sql`: A query to be used when performing the initial snapshot.
    By default, a query that contains all listed columns of all listed tables will be used.
- `advanced`: These optional properties configure other Debezium-specific features.
  The available sub-sections are:
  - `source`: Properties for reading from the source database.
    See the Debezium [Source connectors](https://debezium.io/documentation/reference/stable/connectors/)
    pages for more information about the properties available for each database type.
  - `sink`: Properties for writing to Redis streams in the RDI database.
    See the Debezium [Redis stream properties](https://debezium.io/documentation/reference/stable/operations/debezium-server.html#_redis_stream)
    page for the full set of available properties.
  - `quarkus`: Properties for the Debezium server, such as the log level. See the
    Quarkus [Configuration options](https://quarkus.io/guides/all-config)
    docs for the full set of available properties.
  - `java_options`: controls the JAVA_OPTS environment variable (for RDI 1.15.1 and above). Use it to modify the default values for Java heap size and other Java options for the Debezium server.
    For example, set it to `"-Xmx2g -Xms512m"` to set the maximum heap size to 2 GB and the initial heap size to 512 MB.

### Targets

Use this section to provide the connection details for the target Redis
database. RDI supports one target database. Name the target `target`.
In the `connection` section, you can specify the
`type` of the target database, which must be `redis`, along with
connection details such as `host`, `port`, and credentials (`user` and `password`).
If you use [TLS](https://en.wikipedia.org/wiki/Transport_Layer_Security)/
or [mTLS](https://en.wikipedia.org/wiki/Mutual_authentication#mTLS) to connect
to the target database, you must specify the CA certificate (for TLS),
and the client certificate and private key (for mTLS) in `cacert`, `cert`, and `key`.
Note that these certificates **must** be references to secrets
that you should set as described in [Set secrets]({{< relref "/integrate/redis-data-integration/data-pipelines/deploy#set-secrets" >}})
(it is not possible to include these certificates as plain text in the file).

### Processors

The `processors` section selects the stream processor and configures its behavior.
Use the Flink processor for new pipelines:

```yaml
processors:
  type: flink
```

See [Differences between the classic and Flink processors]({{< relref "/integrate/redis-data-integration/architecture/classic-vs-flink" >}})
and [Migrate from the classic processor to the Flink processor]({{< relref "/integrate/redis-data-integration/installation/migration-classic-to-flink" >}})
for existing pipelines.

### Tune Classic processor performance

The Classic processor uses the top-level batch, queue, initial-sync, and stream
polling properties. Larger batches can improve throughput but use more memory and
can increase latency while RDI waits for a batch to fill.

```yaml
processors:
  type: classic
  read_batch_size: 2000
  read_batch_timeout_ms: 100
  write_batch_size: 200
  enable_async_processing: true
  batch_queue_size: 3
  ack_queue_size: 10
  initial_sync_processes: 4
  idle_sleep_time_ms: 200
  idle_streams_check_interval_ms: 1000
  busy_streams_check_interval_ms: 5000
```

### Tune Flink processor performance

The Flink processor uses `processors.advanced` for batch behavior, parallelism,
and memory. Don't use Classic queue and initial-sync properties to tune Flink.

```yaml
processors:
  type: flink
  advanced:
    source:
      batch.size: 2000
      batch.timeout.ms: 100
      discovery.interval.ms: 1000
    target:
      batch.size: 200
      flush.interval.ms: 100
    flink:
      taskmanager.numberOfTaskSlots: 1
      taskmanager.memory.process.size: 2048m
    resources:
      taskManager:
        replicas: 2
```

For Kubernetes installations, the number of available task slots is the number
of TaskManager replicas multiplied by `taskmanager.numberOfTaskSlots`. When you
omit `parallelism.default`, Flink uses the available task slots. Adding task slots
can increase initial snapshot throughput. Size `taskmanager.memory.process.size`
for the work done by each TaskManager, especially when jobs use transformations.

The `advanced.source.batch.size`, `advanced.source.batch.timeout.ms`, and
`advanced.target.batch.size` properties override their top-level aliases when
both forms are present. Change other Flink settings only when instructed by Redis
support. See the [configuration file reference]({{< relref "/integrate/redis-data-integration/reference/config-yaml-reference#processorsadvanced" >}})
for all Flink processor properties.

### Choose the Redis data type

Set `target_data_type` to `hash` (the default) or `json`. The `json` option
requires JSON support in the target database. A job file can override this
setting for its output.

```yaml
processors:
  type: flink
  target_data_type: hash
```

See [Job files]({{< relref "/integrate/redis-data-integration/data-pipelines/transform-examples" >}})
for the data types available to job outputs.

### Confirm writes reached a replica

Use these properties only when target database replication is enabled and a
healthy replica is available:

```yaml
processors:
  type: flink
  wait_enabled: true
  wait_timeout: 1000
  retry_on_replica_failure: true
```

For the Flink processor, the corresponding properties under
`processors.advanced.target` take priority over these top-level properties.

See also the
[RDI configuration file reference]({{< relref "/integrate/redis-data-integration/reference/config-yaml-reference#processors" >}})
for full details of the other available properties.

## Extended configuration example

This example combines the commonly used options from this page. Remove properties
that you don't need. See the
[configuration file reference]({{< relref "/integrate/redis-data-integration/reference/config-yaml-reference" >}})
for every supported property.

```yaml
sources:
  mysql:
    type: cdc
    logging:
      level: info
    connection:
      type: mysql
      host: <DB_HOST> # e.g. localhost
      port: 3306
      # User and password are injected from the secrets.
      user: ${SOURCE_DB_USERNAME}
      password: ${SOURCE_DB_PASSWORD}
    # Additional properties for the source collector:
    # List of databases to include (optional).
    # databases:
    #   - database1
    #   - database2

    # List of tables to be synced (optional).
    # tables:
    #   If only one database is specified in the databases property above,
    #   then tables can be defined without the database prefix.
    #   <DATABASE_NAME>.<TABLE_NAME>:
    #     List of columns to be synced (optional).
    #     columns:
    #       - <COLUMN_NAME>
    #       - <COLUMN_NAME>
    #     List of columns to be used as keys (optional).
    #     keys:
    #       - <COLUMN_NAME>

    # Example: Sync specific tables.
    # tables:
    #   Sync a specific table with all its columns:
    #   redislabscdc.account: {}
    #   Sync a specific table with selected columns:
    #   redislabscdc.emp:
    #     columns:
    #       - empno
    #       - fname
    #       - lname

    # Advanced collector properties (optional):
    # advanced:
    #   Sink collector properties - see the full list at
    #     https://debezium.io/documentation/reference/stable/operations/debezium-server.html#_redis_stream
    #   sink:
    #     Optional hard limits on memory usage of RDI streams.
    #     redis.memory.limit.mb: 300
    #     redis.memory.threshold.percentage: 85

    #     Uncomment for production so RDI Collector will wait on replica
    #     when writing entries.
    #     redis.wait.enabled: true
    #     redis.wait.timeout.ms: 1000
    #     redis.wait.retry.enabled: true
    #     redis.wait.retry.delay.ms: 1000

    #   Source specific properties - see the full list at
    #     https://debezium.io/documentation/reference/stable/connectors/
    #   source:
    #     snapshot.mode: initial
    #     Uncomment if you want a snapshot to include only a subset of the rows
    #     in a table. This property affects snapshots only.
    #     snapshot.select.statement.overrides: <DATABASE_NAME>.<TABLE_NAME>
    #     The specified SELECT statement determines the subset of table rows to
    #     include in the snapshot.
    #     snapshot.select.statement.overrides.<DATABASE_NAME>.<TABLE_NAME>: <SELECT_STATEMENT>

    #     Example: Snapshot filtering by order status.
    #     To include only orders with non-pending status from customers.orders
    #     table:
    #     snapshot.select.statement.overrides: customer.orders
    #     snapshot.select.statement.overrides.customer.orders: SELECT * FROM customers.orders WHERE status != 'pending' ORDER BY order_id DESC

    #   Quarkus framework properties - see the full list at
    #     https://quarkus.io/guides/all-config
    #   quarkus:
    #     banner.enabled: "false"

    #   `java_options` (for RDI 1.15.1 and above) controls the JAVA_OPTS environment variable. Use it to modify the default values for
    #       Java heap size and other Java options for the Debezium server.
    #   java_options: "-Xmx2g -Xms512m"

targets:
  # Redis target database connection.
  # RDI supports one target database. Name it 'target'.
  target:
    connection:
      type: redis
      # Host of the Redis database to which RDI will
      # write the processed data.
      host: <REDIS_TARGET_DB_HOST> # e.g. localhost
      # Port for the Redis database to which RDI will
      # write the processed data.
      port: <REDIS_TARGET_DB_PORT> # e.g. 12000
      # User of the Redis database to which RDI will write the processed data.
      # Uncomment if you are not using the default user.
      # user: ${TARGET_DB_USERNAME}
      # Password for Redis target database.
      password: ${TARGET_DB_PASSWORD}
      # SSL/TLS configuration: Uncomment to enable secure connections.
      # key: ${TARGET_DB_KEY}
      # key_password: ${TARGET_DB_KEY_PASSWORD}
      # cert: ${TARGET_DB_CERT}
      # cacert: ${TARGET_DB_CACERT}
processors:
  type: flink
  # Target data type: hash or json.
  # target_data_type: hash
  # Enable merge as the default strategy for writing JSON documents.
  # json_update_strategy: merge
  # Confirm that writes reached a target database replica.
  # wait_enabled: false
  # wait_timeout: 1000
  # retry_on_replica_failure: true
  # Flink processor performance settings.
  # advanced:
  #   source:
  #     batch.size: 2000
  #     batch.timeout.ms: 100
  #     discovery.interval.ms: 1000
  #   target:
  #     batch.size: 200
  #     flush.interval.ms: 100
  #   flink:
  #     taskmanager.numberOfTaskSlots: 1
  #     taskmanager.memory.process.size: 2048m
  #   resources:
  #     taskManager:
  #       replicas: 2
```
