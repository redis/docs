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
      user: ${MYSQL_DB_USERNAME}
      password: ${MYSQL_DB_PASSWORD}

targets:
  target:
    connection:
      type: redis
      host: <TARGET_DB_HOST>
      port: 6379
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

The `sources` section has one subsection per source database. Each subsection starts
with the source name, which identifies the source and must be unique (in the example,
the source is called `mysql`).

RDI also derives the environment variables that contain the source's credentials from the
source name, for example `${MYSQL_DB_USERNAME}` and `${MYSQL_DB_PASSWORD}` for a source
named `mysql`. See
[Multiple sources in one pipeline]({{< relref "/integrate/redis-data-integration/data-pipelines/multiple-sources" >}})
for the source naming rules and for capturing from more than one source database.

The example configuration contains the following data:

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

The example below is the configuration that
[`redis-di scaffold`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-scaffold" >}})
generates for a MySQL source named `mysql`, with every property documented inline. Uncomment what
you need and delete the rest. See the
[configuration file reference]({{< relref "/integrate/redis-data-integration/reference/config-yaml-reference" >}})
for every supported property.

```yaml
# Configuration of the RDI sources, targets, and processor. Commented-out properties are optional, and where a default
# exists the value shown is that default.
# For an introduction to the pipeline configuration, see
# https://redis.io/docs/latest/integrate/redis-data-integration/data-pipelines/pipeline-config/
# For a reference of every configuration property, see
# https://redis.io/docs/latest/integrate/redis-data-integration/reference/config-yaml-reference/

# Source databases that are used to capture changes from. Each key is a unique source name.
sources:
  mysql:
    # Type of the source collector. Use `cdc` for Debezium, `flink` for Spanner, or `riotx` for Snowflake.
    type: cdc

    # Log verbosity of the source collector, one of `trace`, `debug`, `info`, `warn`, or `error`.
    logging:
      level: info

    # Connection to the source database.
    connection:
      type: mysql
      # Hostname or IP address of the source database server, for example `localhost`.
      host: <DB_HOST>
      # Port that the source database server listens on.
      port: 3306
      # User and password are resolved from the source database secret.
      user: ${MYSQL_DB_USERNAME}
      password: ${MYSQL_DB_PASSWORD}

    # Databases to capture from the source database. When omitted, all databases are captured.
    # databases:
      # - <DATABASE_NAME>

    # Tables to capture from the source database, keyed by table name. A table with no properties, or with an empty
    # mapping, captures all of its columns. If only one database is listed above, table names can omit the
    # database prefix.
    # tables:
      # <DATABASE_NAME>.<TABLE_NAME1>: {}
      # <DATABASE_NAME>.<TABLE_NAME2>:
        # Columns to capture. When omitted, all columns are captured.
        # columns:
          # - <COLUMN_NAME>
        # Columns that form a unique identifier. Only needed when the table has no primary key or unique constraint.
        # keys:
          # - <COLUMN_NAME>

    # Advanced properties that override the collector defaults. Only needed for non-standard tuning.
    # advanced:
      # Properties of the RDI Collector stream writer. See the full list in
      # https://debezium.io/documentation/reference/stable/operations/debezium-server.html#_redis_stream
      # sink:
        # Number of records that the sink writes to Redis in a single batch. Raise it, together with the source
        # `max.batch.size` and `max.queue.size`, for higher snapshot throughput.
        # redis.batch.size: 2048

        # Back pressure on the RDI streams. The sink stops writing once the used memory of the RDI database reaches
        # `redis.memory.threshold.percentage` of its `maxmemory`, or of `redis.memory.limit.mb` when that is set.
        # redis.memory.limit.mb: 0
        # redis.memory.threshold.percentage: 85

        # Whether every write to the RDI streams is verified to have reached a replica shard, which prevents losing
        # captured changes when the primary shard fails over. It costs write latency, and it has no effect unless the
        # RDI database is replicated. `redis.wait.retry.enabled` keeps retrying when the verification times out.
        # redis.wait.enabled: false
        # redis.wait.timeout.ms: 1000
        # redis.wait.retry.enabled: false
        # redis.wait.retry.delay.ms: 1000

      # Properties of the source database connection and of Debezium. See the full list for your source database in
      # https://debezium.io/documentation/reference/stable/connectors/
      # source:
        # When and whether the collector takes an initial snapshot of the source database.
        # snapshot.mode: initial

        # Performance tuning of the Debezium collector. Rows read from the source database are buffered in a queue of
        # `max.queue.size` records, serialized by `record.processing.threads` worker threads, and passed on in batches
        # of `max.batch.size` records, which the sink then writes to Redis in batches of `sink.redis.batch.size`.
        # Lower this to 2 or 1 when fewer CPUs are available to the collector.
        # record.processing.threads: 4

        # Interval between two polls of the source database for new changes in milliseconds. Lower it to 100 or below
        # for lower CDC latency.
        # poll.interval.ms: 500

        # Raise both sizes, together with `sink.redis.batch.size`, for higher snapshot throughput, and keep the queue
        # about four times the batch. A larger queue needs a larger heap, so raise `advanced.resources.memory` and set
        # `-Xmx` in `advanced.java_options` accordingly.
        # max.batch.size: 2048
        # max.queue.size: 8192

        # Restrict the snapshot of a table to the rows that the given statement selects. This affects the snapshot only,
        # for example to skip orders that are still pending.
        # snapshot.select.statement.overrides: <DATABASE_NAME>.<TABLE_NAME>
        # snapshot.select.statement.overrides.<DATABASE_NAME>.<TABLE_NAME>: <SELECT_STATEMENT>

        # Let the client retrieve the public key of the server for the TLS handshake. Uncomment when the source
        # database user authenticates with `caching_sha2_password` over a connection that is not encrypted.
        # database.allowPublicKeyRetrieval: true

      # Properties of the Quarkus runtime that hosts Debezium Server. See the full list in
      # https://quarkus.io/guides/all-config
      # quarkus:
        # banner.enabled: "false"

# Target Redis databases that the processed records are written to. RDI currently only supports a single target that
# must be named `target`.
targets:
  target:
    # Connection to the target Redis database.
    connection:
      type: redis
      # Hostname or IP address of the target Redis database, for example `localhost`.
      host: <TARGET_DB_HOST>
      # Port that the target Redis database listens on.
      port: 6379
      # User of the target Redis database, uncomment when not using the default user.
      # user: ${TARGET_DB_USERNAME}
      # Password of the target Redis database.
      password: ${TARGET_DB_PASSWORD}
      # TLS configuration, uncomment to connect securely. The key and the certificate must be set together, and the key
      # password only when the key is protected by one.
      # cacert: ${TARGET_DB_CACERT}
      # cert: ${TARGET_DB_CERT}
      # key: ${TARGET_DB_KEY}
      # key_password: ${TARGET_DB_KEY_PASSWORD}

# Settings that control how the processor writes the captured records to the targets.
processors:
  # Processor implementation to run, one of `classic` or `flink`.
  # The default is `classic` for backward compatibility, while `flink` is strongly recommended for new pipelines.
  # See https://redis.io/docs/latest/integrate/redis-data-integration/faq/#which-processor-should-i-use
  type: flink

  # Maximum number of records read from the source streams in a single batch.
  # read_batch_size: 2000

  # Maximum time in milliseconds to wait for a read batch to fill before processing it.
  # read_batch_timeout_ms: 100

  # Maximum number of records written to a target database in a single batch. Must not exceed read_batch_size.
  # write_batch_size: 200

  # Whether batches are processed asynchronously, which improves throughput and reduces latency. Applies to the classic
  # processor only.
  # enable_async_processing: true

  # Maximum number of batches queued for processing. Applies to the classic processor only.
  # batch_queue_size: 3

  # Maximum number of batches queued for asynchronous acknowledgement. Applies to the classic processor only.
  # ack_queue_size: 10

  # Whether incoming records are deduplicated. Applies to the classic processor only.
  # dedup: false

  # Maximum number of entries kept in the deduplication set. Applies to the classic processor only.
  # dedup_max_size: 1024

  # How failed records are handled. `ignore` drops them, and `dlq` writes them to the dead letter queue.
  # error_handling: dlq

  # Maximum number of messages stored per dead letter queue stream.
  # dlq_max_messages: 1000

  # Data type that the records are stored as. `hash` writes a Redis hash, and `json` writes a RedisJSON document, which
  # requires the RedisJSON module in the target database.
  # target_data_type: hash

  # How existing JSON documents are updated. `replace` overwrites the whole document, and `merge` merges the incoming
  # fields into it.
  # json_update_strategy: replace

  # Whether JSON documents are merged with the native JSON.MERGE command rather than with Lua scripts. Applies to the
  # classic processor only.
  # use_native_json_merge: true

  # Number of parallel processes that perform the initial synchronization. Applies to the classic processor only.
  # initial_sync_processes: 4

  # Time in milliseconds to sleep between batches while idle. Applies to the classic processor only.
  # idle_sleep_time_ms: 200

  # Time in milliseconds between two checks for new streams while idle. Applies to the classic processor only.
  # idle_streams_check_interval_ms: 1000

  # Time in milliseconds between two checks for new streams while busy. Applies to the classic processor only.
  # busy_streams_check_interval_ms: 5000

  # Maximum number of attempts for a failed write to a target database before giving up.
  # retry_max_attempts: 5

  # Initial delay in milliseconds before the first retry of a failed write.
  # retry_initial_delay_ms: 1000

  # Maximum delay in milliseconds between two retries of a failed write.
  # retry_max_delay_ms: 10000

  # Whether every write is verified to have reached the replica shards of the target database. Enable this only when the
  # target database is replicated and a healthy replica is available.
  # wait_enabled: false

  # Maximum time in milliseconds to wait for the replica write verification.
  # wait_timeout: 1000

  # Whether a write is retried until the replica verification succeeds, rather than given up on after the first failure.
  # retry_on_replica_failure: true

  # Logging settings of the processor. Applies to the Flink processor only.
  # logging:
    # Log verbosity of the processor, one of `trace`, `debug`, `info`, `warn`, or `error`.
    # level: info
```
