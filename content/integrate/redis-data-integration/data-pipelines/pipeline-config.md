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
---

The main configuration details for an RDI pipeline are in the `config.yaml` file.
This file specifies the connection details for the source and target databases,
and also the set of tables you want to capture. You can also add one or more
[job files]({{< relref "/integrate/redis-data-integration/data-pipelines/transform-examples" >}})
if you want to apply custom transformations to the captured data.

## Example

Below is an example of a `config.yaml` file. Note that the values of the
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

targets:
  # Redis target database connections.
  # The default connection must be named 'target' and is used when no
  # connection is specified in jobs or no jobs
  # are deployed. However multiple connections can be defined here and used
  # in the job definition output blocks:
  # (e.g. target1, my-cloud-redis-db2, etc.)
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
  # Interval (in seconds) on which to perform retry on failure.
  # on_failed_retry_interval: 5
  # The batch size for reading data from the source database.
  # read_batch_size: 2000
  # Time (in ms) after which data will be read from stream even if
  # read_batch_size was not reached.
  # duration: 100
  # Data type to use in Redis target database: `hash` for Redis Hash,
  # `json` for JSON (which requires the RedisJSON module).
  # target_data_type: hash
  # The batch size for writing data to the target Redis database. Should be
  # less than or equal to the read_batch_size.
  # write_batch_size: 200
  # Enable deduplication mechanism (default: false).
  # dedup: <DEDUP_ENABLED>
  # Max size of the deduplication set (default: 1024).
  # dedup_max_size: <DEDUP_MAX_SIZE>
  # Error handling strategy: ignore - skip, dlq - store rejected messages
  # in a dead letter queue
  # error_handling: dlq
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

- `type`: The type of collector to use for the pipeline. 
  Currently, the only types RDI supports are `cdc` and `external`.
  If the source type is set to `external`, no collector resources will be created by the operator, 
  and all other source sections should be empty or not specified at all.
- `connection`: The connection details for the source database: `type`, `host`, `port`, 
  and credentials (`username` and `password`).
  - `type` is the source database type, one of `mariadb`, `mysql`, `oracle`, `postgresql`, or `sqlserver`.
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

### Targets

Use this section to provide the connection details for the target Redis
database(s). As with the sources, you should start each target section
with a unique name that you are free to choose (here, the example uses the name
`target`). In the `connection` section, you can specify the
`type` of the target database, which must be `redis`, along with 
connection details such as `host`, `port`, and credentials (`username` and `password`).
If you use [TLS](https://en.wikipedia.org/wiki/Transport_Layer_Security)/
or [mTLS](https://en.wikipedia.org/wiki/Mutual_authentication#mTLS) to connect 
to the target database, you must specify the CA certificate (for TLS), 
and the client certificate and private key (for mTLS) in `cacert`, `cert`, and `key`.
Note that these certificates **must** be references to secrets
that you should set as described in [Set secrets]({{< relref "/integrate/redis-data-integration/data-pipelines/deploy#set-secrets" >}})
(it is not possible to include these certificates as plain text in the file).

{{< note >}}If you specify `localhost` as the address of either the source or target server during
installation then the connection will fail if the actual IP address changes for the local
VM. For this reason, it is recommended that you don't use `localhost` for the address. However,
if you do encounter this problem, you can fix it using the following commands on the VM
that is running RDI itself:

```bash
sudo k3s kubectl delete nodes --all
sudo service k3s restart
```
{{< /note >}}

### Processors

The `processors` section configures the behavior of the pipeline. The [example](#example)
configuration above contains the following properties:

- `on_failed_retry_interval`: Number of seconds to wait before retrying a failed operation.
  The default is 5 seconds.
- `read_batch_size`: Maximum number of records to read from the source database. RDI will
  wait for the batch to fill up to `read_batch_size` or for `duration` to elapse,
  whichever happens first. The default is 2000.
- `target_data_type`: Data type to use in the target Redis database. The options are `hash`
  for Redis Hash (the default), or `json` for RedisJSON, which is available only if you have added the
  RedisJSON module to the target database. Note that this setting is mainly useful when you
  don't provide any custom jobs. When you do provide jobs, you can specify the
  target data type in each job individually and choose from a wider range of data types.
  See [Job files]({{< relref "/integrate/redis-data-integration/data-pipelines/transform-examples" >}})
  (which requires the RedisJSON module) for more information. 
- `duration`: Time (in ms) after which data will be read from the stream even if
  `read_batch_size` was not reached. The default is 100 ms.
- `write_batch_size`: The batch size for writing data to the target Redis database. This should be
  less than or equal to the `read_batch_size`. The default is 200.
- `dedup`: Boolean value to enable the deduplication mechanism. The default is `false`.
- `dedup_max_size`: Maximum size of the deduplication set. The default is 1024.
- `error_handling`: The strategy to use when an invalid record is encountered. The available
  strategies are `ignore` and  `dlq` (store rejected messages in a dead letter queue). 
  The default is `dlq`. See
  [What does RDI do if the data is corrupted or invalid?]({{< relref "/integrate/redis-data-integration/faq#what-does-rdi-do-if-the-data-is-corrupted-or-invalid" >}})
  for more information about the dead letter queue.

See also the
[RDI configuration file reference]({{< relref "/integrate/redis-data-integration/reference/config-yaml-reference#processors" >}})
for full details of the other available properties.
