---
Title: Redis Data Integration configuration file
linkTitle: RDI configuration file
description: Reference for the RDI `config.yaml` file
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases: /integrate/redis-data-integration/ingest/reference/config-yaml-reference/
---

This document describes the RDI `config.yaml` file in detail. See
[Configure data pipelines]({{< relref "/integrate/redis-data-integration/data-pipelines/data-pipelines" >}})
for more information about the role `config.yaml` plays in defining a pipeline.

## Note about fully-qualified table names

Throughout this document we use the format `<databaseName>.<tableName>` to refer to a fully-qualified table name. This format is actually the one used by MySQL/MariaDB, but for Oracle,
SQLServer, and PostgreSQL, you should use `<schemaName>`.`<tableName>` instead.

{{< note >}}You can specify the fully-qualified table name `<databaseName>.<tableName>` as
a regular expression instead of providing the full name of the `databaseName` and `tableName`.
{{< /note >}}

The example below shows the MySQL format specifying the desired columns for the
`chinook.customer` and `chinook.employee` tables:

```yaml
tables:
   chinook.customer:
       columns:
           - CustID
           - FirstName
           - LastName
           - Company
           - Address
           - Email
   chinook.employee:
       columns:
           - EmpID
           - FirstName
           - LastName
           - ReportsTo
           - Address
           - City
           - State
 ```

## Top level objects

These objects define the sections at the root level of `config.yaml`.

### Properties

| Name | Type | Description |
| -- | -- | -- |
| [`sources`](#sources) | `object` | Source collectors |
| [`processors`](#processors)| `object`, `null` | RDI Processors |
| [`targets`](#targets) | `object` | Target connections |

## `sources`: Source collectors {#sources}

Each source database type has its own connector, but the basic configuration properties are
the same for all databases.

See the Debezium documentation for more information about the specific connectors:

- [MySQL/MariaDB](https://debezium.io/documentation/reference/stable/connectors/mysql.html)
- [Oracle](https://debezium.io/documentation/reference/stable/connectors/oracle.html)
- [PostgreSQL](https://debezium.io/documentation/reference/stable/connectors/postgresql.html)
- [SQL Server](https://debezium.io/documentation/reference/stable/connectors/sqlserver.html)

### Essential properties

#### `connection`

| Name | Type | Source Databases | Description |
| -- | -- | -- | -- |
| `host` | `string` | MariaDB, MySQL, Oracle, PostgreSQL, SQLServer| The IP address of the database instance. |
| `port` | `integer` | MariaDB, MySQL, Oracle, PostgreSQL, SQLServer | The port of the database instance. |
| `database` | `string` | Oracle, PostgreSQL, SQLServer| The name of the database to capture changes from. For `SQL Server` you can define this as comma-separated list of database names. |
| `database.encrypt` | `string` | SQL Server| If SSL is enabled for your SQL Server database, you should also enable SSL in RDI by setting the value of this property to `true`.<br/> Default: `false` |
| `database.server.id` | `integer` | MariaDB, MySQL | Numeric ID of this database client, which must be unique across all currently-running database processes in the MySQL cluster.<br/> Default: 1|
| `database.url` | `string` | Oracle | Specifies the raw database JDBC URL. Use this property to define a custom database connection. Valid values include raw TNS names and RAC connection strings.|
| `topic.prefix` | `string` | MariaDB, MySQL, Oracle, PostgreSQL, SQLServer | A prefix for all topic names that receive events emitted by this connector.<br/> Default: `"rdi"` |

### Advanced properties

#### `sink`

| Name | Type | Description |
| -- | -- | -- |
| `redis.null.key` | `string` | Redis does not allow data objects without keys. This string will be used as the key for records that don't have a primary key.<br/> Default: `"default"` |
| `redis.null.value` | `string` | Redis does not allow null object values (these occur with tombstone events, for example). This string will be used as the value for records without a payload.<br/> Default: `"default"` |
| `redis.batch.size` | `integer` | Number of change records to insert in a single batch write (pipelined transaction).<br/> Default: `500` |
| `redis.memory.limit.mb` | `integer` | The connector stops sending events when the Redis database size exceeds this size (in MB).<br/> Default: `300` |
| `redis.wait.enabled` | `string` | If Redis is configured with a replica shard, this lets you verify that the data has been written to the replica.<br/> Default: `false` |
| `redis.wait.timeout.ms` | `integer` | Defines the timeout in milliseconds when waiting for the replica.<br/> Default: `1000` |
| `redis.wait.retry.enabled` | `string` | Enables retry on wait for replica failure.<br/> Default: `false` |
| `redis.wait.retry.delay.ms` | `integer` | Defines the delay (in milliseconds) for retry on wait for replica failure.<br/> Default: `1000` |
| `redis.retry.initial.delay.ms` | `integer` | Initial retry delay (in milliseconds) when encountering Redis connection or OOM issues. This value will be doubled upon every retry but won’t exceed `redis.retry.max.delay.ms`.<br/> Default: `300` |
| `redis.retry.max.delay.ms` | `integer` | Maximum delay (in milliseconds) when encountering Redis connection or OOM issues.<br/> Default: `10000` |

#### `source`

| Name | Type | Source Databases | Description |
|--|--|--|--|
| `snapshot.mode` | `string` | MariaDB, MySQL, Oracle, PostgreSQL, SQLServer | Specifies the mode that the connector uses to take snapshots of a captured table. See the [Debezium documentation](https://debezium.io/documentation/reference/stable/operations/debezium-server.html) for more details about the available options and configuration.<br/> Default: `"initial"` |
| `topic.prefix` | `string` | MariaDB, MySQL, Oracle, PostgreSQL, SQLServer| A prefix for all topic names that receive events emitted by this connector.<br/>Default: `"rdi"` |
| `database.exclude.list` | `string` | MariaDB, MySQL | An optional, comma-separated list of regular expressions that match the names of databases for which you do not want to capture changes. The connector captures changes in any database whose name is not included in `database.exclude.list`. Do not specify the `database` field in the `connection` configuration if you are using the `database.exclude.list` property to filter out databases. |
| `database.pdb.name` | `string` | Oracle |The name of the [Oracle Pluggable Database](https://docs.oracle.com/en/database/oracle/oracle-database/19/riwin/about-pluggable-databases-in-oracle-rac.html) that the connector captures changes from. Do not specify this property for a non-CDB installation.<br/> Default: `"ORCLPDB1"` |
| `schema.exclude.list` | `string` | Oracle, PostgreSQL, SQLServer | An optional, comma-separated list of regular expressions that match names of schemas for which you do not want to capture changes. The connector captures changes in any schema whose name is not included in `schema.exclude.list`. Do not specify the `schemas` section if you are using the `schema.exclude.list` property to filter out schemas. |
| `table.exclude.list` | `string` | MariaDB, MySQL, Oracle, PostgreSQL, SQLServer | An optional comma-separated list of regular expressions that match fully-qualified table identifiers for the tables that you want to exclude from being captured; The connector captures all tables that are not included in `table.exclude.list`. Do not specify the `tables` block in the configuration if you are using the `table.exclude.list` property to filter out tables. |
| `column.exclude.list` | `string` | MariaDB, MySQL, Oracle, PostgreSQL, SQLServer | An optional comma-separated list of regular expressions that match the fully-qualified names of columns that should be excluded from change event message values. Fully-qualified names for columns are of the form `schemaName.tableName.columnName`. Do not specify the `columns` block in the configuration if you are using the `column.exclude.list` property to filter out columns. |
| `snapshot.select.statement.overrides` | `string` | MariaDB, MySQL, Oracle, PostgreSQL, SQLServer |Specifies the table rows to include in a snapshot. Use this property if you want a snapshot to include only a subset of the rows in a table. This property affects snapshots only. It does not apply to events that the connector reads from the log. See [Using custom queries in the initial snapshot](#custom-initial-query) below for more information. |
| `lob.enabled` | `string` | Oracle | Enables capturing and serialization of large object (CLOB, NCLOB, and BLOB) column values in change events.<br/>Default: `false` |
| `unavailable.value.placeholder` | Special | Oracle | Specifies the constant that the connector provides to indicate that the original value is unchanged and not provided by the database (this has the type `__debezium_unavailable_value`). |

### Using custom queries in the initial snapshot {#custom-initial-query}

{{< note >}}This section is relevant only for MySQL/MariaDB, Oracle, PostgreSQL, and SQLServer.
{{< /note >}}

By default, the initial snapshot captures all rows from each table.
If you want the snapshot to include only a subset of the rows in a table, you can use a
custom `SELECT` statement to override the default and select only the rows you are interested in.
To do this, you must first specify the tables whose `SELECT` statement you want to override by adding a `snapshot.select.statement.overrides` in the `source` section with a comma-separated list of [fully-qualified table names](#fully-qualified-table-name).

After the `snapshot.select.statement.overrides` list, you must then add another configuration property for each table in the list to specify the custom `SELECT` statement for that table.
The format of the property name depends on the database you are using:

- For Oracle, SQLServer, and PostrgreSQL, use `snapshot.select.statement.overrides.<SCHEMA_NAME>.<TABLE_NAME>`
- For MySQL and MariaDB, use: `snapshot.select.statement.overrides<DATABASE_NAME>.<TABLE_NAME>`

For example, with PostgreSQL, you would have a configuration like the following:

```yaml
source:
    snapshot.select.statement.overrides: myschema.mytable
    snapshot.select.statement.overrides.myschema.mytable: |
        SELECT ...
```

For MySQL, you would have:

```yaml
source:
    snapshot.select.statement.overrides: mydatabase.mytable
    snapshot.select.statement.overrides.mydatabase.mytable: |
        SELECT ...
```

You must also add the list of columns you want to include in the custom `SELECT` statement using fully-qualified names under "sources.tables". Specify each column in the configuration as shown below:

```yaml
tables:
    # For MySQL and MariaDB: use database_name.table_name
    schema_name.table_name:
        columns:
            - column_name1 # Each column on a new line
            - column_name2
            - column_name3
```

If you want to capture all columns from a table, you can use empty curly braces `{}` instead of listing all the individual columns:

 ```yaml
 tables:
    # Captures all columns. For MySQL and MariaDB: use database_name.table_name.
    schema_name.table_name: {}
 ```

The example configuration below selects the columns `CustomerId`, `FirstName` and `LastName` from the `customer` table and joins it with the `invoice` table to select customers with total invoices greater than 8000:

```yaml
tables:
 chinook.customer:
    columns:
        - CustomerID
        - FirstName
        - LastName

advanced:
    source:
        snapshot.select.statement.overrides: chinook.customer
        snapshot.select.statement.overrides.chinook.customer: |
            SELECT c.CustomerId, c.FirstName, c.LastName
            FROM chinook.customer c
            INNER JOIN chinook.invoice inv
            ON c.CustomerId = inv.CustomerId
            WHERE inv.total > 8000
```

### Specifying custom message keys for change event records

By default, Debezium uses the primary key column(s) of a table as the message key for the
records that it emits. However, you might want to configure custom message keys based on
one or more columns to override this default behavior, or to specify message keys for tables
that don't have a primary key.

Use the `sources.tables` section of `config.yaml` to specify a custom message key for 
one or more tables. List the columns you want to capture from the table under `columns` and
list the columns you want to use for the message key under `keys`, as shown below:

 ```yaml
 # To include entries for multiple tables, simply add each table with its corresponding columns and keys under the 'tables' field.
 tables:
    <DATABASE_NAME>.<TABLE_NAME>:
        columns:
            - <COLUMN(S)_LIST> # List of columns to include
        keys:
            - <COLUMN(S)_LIST> # Column(s) to be used together as the primary key
 ```

Note that you must add the columns you use for the message key to both the `keys` list and the
`columns` list. You can use as many columns as you like to create the custom message keys but we
recommend you use only the minimum set of columns required to guarantee a unique key for each
message.

## `processors`: RDI processors {#processors}

### Properties

| Name | Type | Description |
| -- | -- | -- |
| `on_failed_retry_interval` |`integer`, `string`| Interval (in seconds) between attempts to retry on failure.<br/>Default: `5`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`|
| `read_batch_size` |`integer`, `string`| Batch size for reading data from the source database.<br/>Default: `2000`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`|
| `debezium_lob_encoded_placeholder` |`string`| Enable Debezium LOB placeholders.<br/>Default: `"__debezium_unavailable_value"`|
| `dedup` |`boolean`| Enable deduplication mechanism.<br/>Default: `false`<br/>||
| `dedup_max_size` |`integer`| Maximum number of items in the deduplication set.<br/> Default: `1024`<br/>Minimum: `1`<br/>|
| `dedup_strategy` |`string`| Deduplication strategy: `reject` - reject messages (dlq), `ignore` \- ignore messages.<br/> (DEPRECATED)<br/>The property `dedup_strategy` is now deprecated. The only supported strategy is `ignore`. Please remove from the configuration.<br/>Default: `"ignore"`<br/>Enum: `"reject"`, `"ignore"`<br/>|
| `duration` |`integer`, `string`| Time (in ms) after which data will be read from stream even if `read_batch_size` was not reached.<br/> Default: `100`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>|
| `write_batch_size` |`integer`, `string`| The batch size for writing data to target Redis database\. Should be less or equal to `read_batch_size`.<br/> Default: `200`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>|
| `error_handling` |`string`| Error handling strategy: `ignore` - skip, `dlq` - store rejected messages in a dead letter queue.<br/> Default: `"dlq"`<br/>Pattern: `^\${.*}$\|ignore\|dlq`<br/>|
| `dlq_max_messages` |`integer`, `string`| Maximum number of messages per stream in the dead letter queue .<br/> Default: `1000`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>|
| `target_data_type` |`string`| Target data type: `hash`/`json` (the RedisJSON module must be enabled in the target database to use JSON).<br/> Default: `"hash"`<br/>Pattern: `^\${.*}$\|hash\|json`<br/>|
| `json_update_strategy` |`string`| Target update strategy: `replace`/`merge` (the RedisJSON module must be enabled in the target DB to use JSON).<br/> (DEPRECATED)<br/>The property `json_update_strategy` will be deprecated in future releases. Use the job-level property `on_update` to define the JSON update strategy.<br/>Default: `"replace"`<br/>Pattern: `^\${.*}$\|replace\|merge`<br/>|
| `initial_sync_processes` |`integer`, `string`| Number of processes the RDI Engine creates to process the initial sync with the source.<br/> Default: `4`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>Maximum: `32`<br/>|
| `idle_sleep_time_ms` |`integer`, `string`| Idle sleep time (in milliseconds) between batches.<br/>Default: `200`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>Maximum: `999999`<br/>|
| `idle_streams_check_interval_ms` |`integer`, `string`| Interval (in milliseconds) for checking new streams when the stream processor is idling.<br/> Default: `1000`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>Maximum: `999999`<br/>|
| `busy_streams_check_interval_ms` |`integer`, `string`| Interval (in milliseconds) for checking new streams when the stream processor is busy.<br/> Default: `5000`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>Maximum: `999999`<br/>|
| `wait_enabled` |`boolean`| Check that the data has been written to the replica shard.<br/> Default: `false`<br/>|
| `wait_timeout` |`integer`, `string`| Timeout in milliseconds when checking writes to the replica shard.<br/> Default: `1000`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>|
| `retry_on_replica_failure` |`boolean`| Checks that the data has been written to the replica shard and keeps retrying if not.<br/> Default: `true`<br/>|

### Additional properties

Not allowed 

## `targets`: Target connections {#targets}

## Properties

| Name | Type | Description |
| -- | -- | -- |
| [`connection`](#targetsconnection) | `object` | Connection details |

### `targets.connection`: Connection details {#targetsconnection}

### Properties

| Name | Type | Description |
| -- | -- | -- |
| `host` | `string` | IP address of the Redis database where RDI will write the processed data. |
| `port` | `integer` | Port of the Redis database where RDI will write the processed data. |
| `user` | `string` | User of the Redis database where RDI will write the processed data. Uncomment this if you are not using the default user. |
| `password` | `string` | Password for Redis target database. |
| `key` | `string` | Uncomment this line if you are using SSL/TLS. |
| `key_password` | `string` | Uncomment this line if you are using SSL/TLS. |
| `cert` | `string` | Uncomment this line if you are using SSL/TLS. |
| `cacert` | `string` | Uncomment this line if you are using SSL/TLS. |
