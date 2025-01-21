---
Title: Redis Data Integration configuration file
linkTitle: RDI configuration file
description: Reference for the RDI `config.yaml` file
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases: /integrate/redis-data-integration/ingest/reference/config-yaml-reference/
---

## Top level objects

These objects define the sections at the root level of `config.yaml`.

### Properties

| Name | Type | Description | Required |
| -- | -- | -- | -- |
| [**sources**](#sources) | `object` | Source collectors ||
| [**processors**](#processors)| `object`, `null` | RDI Processors ||
| [**targets**](#targets) | `object` | Target connections ||

## sources: Source collectors {#sources}

Each source database type has its own connector, but the basic configuration properties are
the same for all databases.

See the Debezium documentation for more information about the specific connectors:

- [MySQL/MariaDB](https://debezium.io/documentation/reference/stable/connectors/mysql.html)
- [Oracle](https://debezium.io/documentation/reference/stable/connectors/oracle.html)
- [PostgreSQL](https://debezium.io/documentation/reference/stable/connectors/postgresql.html)
- [SQL Server](https://debezium.io/documentation/reference/stable/connectors/sqlserver.html)

### Essential properties

[**connection:**](#connection)<br/>
|Name|Type|Default|Source Databases|Description|
|--|--|--|--|--|
|host|string| |MariaDB, MySQL, Oracle, PostgreSQL, SQLServer|The address of the database instance.|
|port| int||MariaDB, MySQL, Oracle, PostgreSQL, SQLServer | The port of the database instance.|
|database|string||MariaDB, MySQL, Oracle, PostgreSQL, SQLServer|The name of the database from which to stream the changes. For `SQL Server` you can define the database as comma-separated list of the SQL Server database names from which to stream the changes.|
|database.pdb.name|string|ORCLPDB1|Oracle|The name of the [Oracle Pluggable Database](https://docs.oracle.com/en/database/oracle/oracle-database/19/riwin/about-pluggable-databases-in-oracle-rac.html) that the connector captures changes from. For non-CDB installation, do not specify this property.|
|database.encrypt|boolean|false|MySQL|If SSL is enabled for a SQL Server database, enable SSL by setting the value of this property to true. |
|database.server.id|int|1|MySQL|A numeric ID of this database client, which must be unique across all currently-running database processes in the MySQL cluster.|
|database.url|string||Oracle|Specifies the raw database JDBC URL. Use this property to provide flexibility in defining that database connection. Valid values include raw TNS names and RAC connection strings.|
|topic.prefix|string|rdi|MariaDB, MySQL, Oracle, PostgreSQL, SQLServer | A prefix for all topic names that receive events emitted by this connector.|

### Advanced properties

[**Sink:**](#sink)<br/>
|Name|Type|Default|Description|
|--|--|--|--|
| redis.null.key | string | default | Redis does not support the notion of data without key, so this string will be used as key for records without primary key. |
| redis.null.value | string | default | Redis does not support the notion of null payloads, as is the case with tombstone events. This string will be used as value for records without a payload. |
| redis.batch.size | int | 500 | Number of change records to insert in a single batch write (Pipelined transaction).|
| redis.memory.limit.mb | int | 300 | The connector stops sending events when Redis size exceeds this threshold.|
| redis.wait.enabled | boolean | false | In case Redis is configured with a replica shard, this allows to verify that the data has been written to the replica. |
| redis.wait.timeout.ms | int | 1000 | Defines the timeout in milliseconds when waiting for replica. |
| redis.wait.retry.enabled | boolean | false | Enables retry on wait for replica failure.|
| redis.wait.retry.delay.ms | int | 1000 | Defines the delay of retry on wait for replica failure. |
| redis.retry.initial.delay.ms | int | 300 | Initial retry delay when encountering Redis connection or OOM issues. This value will be doubled upon every retry but won’t exceed `redis.retry.max.delay.ms`. |
| redis.retry.max.delay.ms | int | 10000 | Max delay when encountering Redis connection or OOM issues. |

[**Source:**](#source)<br/>
|Name|Type|Default|Source Databases|Description|
|--|--|--|--|--|
|snapshot.mode|string|initial|MariaDB, MySQL, Oracle, PostgreSQL, SQLServer|Specifies the mode that the connector uses to take snapshots of a captured table.|
|topic.prefix|string|rdi|MySQL, Oracle, PostgreSQL, SQLServer|A prefix for all topic names that receive events emitted by this connector.|
|database.exclude.list|string||MariaDB, MySQL|An optional, comma-separated list of regular expressions that match the names of databases for which you do not want to capture changes. The connector captures changes in any database whose name is not included in `database.exclude.list`. Do not specify the `database` field in the `connection` configuration if you are using the `database.exclude.list` property to filter out databases.|
|schema.exclude.list|string||Oracle, PostgreSQL, SQLServer|An optional, comma-separated list of regular expressions that match names of schemas for which you do not want to capture changes. The connector captures changes in any schema whose name is not included in `schema.exclude.list`. Do no specify the `schemas` section if you are using the `schema.exclude.list` property to filter out schemas. |
|table.exclude.list|string||MariaDB, MySQL, Oracle, PostgreSQL, SQLServer|An optional comma-separated list of regular expressions that match fully-qualified table identifiers for the tables that you want to exclude from being captured; The connector captures all tables that are not included in `table.exclude.list`. Do not specify the `tables` block in the configuration if you are using the `table.exclude.list` property to filter out tables. |
| column.exclude.list | string| | MariaDB, MySQL, Oracle, PostgreSQL, SQLServer | An optional comma-separated list of regular expressions that match the fully-qualified names of columns that should be excluded from change event message values. Fully-qualified names for columns are of the form `schemaName.tableName.columnName`. Do not specify the `columns` block in the configuration if you are using the `column.exclude.list` property to filter out columns. |
|snapshot.select.statement.overrides|String||MariaDB, MySQL, Oracle, PostgreSQL, SQLServer|Specifies the table rows to include in a snapshot. Use the property if you want a snapshot to include only a subset of the rows in a table. This property affects snapshots only. It does not apply to events that the connector reads from the log.|
|log.enabled|boolean|false|Oracle|Enables capturing and serialization of large object (CLOB, NCLOB, and BLOB) column values in change events.|
|unavailable.value.placeholder|\_\_debezium_unavailable_value |Oracle|Specifies the constant that the connector provides to indicate that the original value is unchanged and not provided by the database.|

### Using queries in the initial snapshot (relevant for MySQL, Oracle, PostgreSQL and SQLServer)

- In case you want a snapshot to include only a subset of the rows in a table, you need to add the property `snapshot.select.statement.overrides` and add a comma-separated list of [fully-qualified table names](#fully-qualified-table-name). The list should include every table for which you want to add a SELECT statement.

- **For each table in the list above, add a further configuration property** that specifies the `SELECT` statement for the connector to run on the table when it takes a snapshot.

 The specified `SELECT` statement determines the subset of table rows to include in the snapshot.

 Use the following format to specify the name of this `SELECT` statement property:

 - Oracle, SQLServer, PostrgreSQL: `snapshot.select.statement.overrides: <SCHEMA_NAME>.<TABLE_NAME>`
 - MySQL: `snapshot.select.statement.overrides: <DATABASE_NAME>.<TABLE_NAME>`

- Add the list of columns you want to include in the `SELECT` statement using fully-qualified names. Each column should be specified in the configuration as shown below:

 ```yaml
 tables:
 schema_name.table_name: # For MySQL: use database_name.table_name
 columns:
 - column_name1 # Each column on a new line
 - column_name2
 - column_name3
 ```

- To capture all columns from a table, use empty curly braces `{}` instead of listing individual columns:

 ```yaml
 tables:
 schema_name.table_name: {} # Captures all columns
 ```

### Example

To select the columns `CustomerId`, `FirstName` and `LastName` from `customer` table and join it with `invoice` table in order to get customers with total invoices greater than 8000, we need to add the following properties to the `config.yaml` file:

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

### Form custom message key(s) for change event records

- By default, Debezium uses the primary key column(s) of a table as the message key for records that it emits.
 In place of the default, or to specify a key for tables that lack a primary key, you can configure custom message keys based on one or more columns.

- To establish a custom message key for a table, list the table followed by the column to use as the message key. Each list entry takes the following format:

 ```yaml
 # To include entries for multiple tables, simply add each table with its corresponding columns and keys under the 'tables' field.
 tables:
 <DATABASE_NAME>.<TABLE_NAME>:
 columns:
 - <COLUMN(S)_LIST> # List of columns to include
 keys:
 - <COLUMN(S)_LIST> # Column(s) to be used as the primary key
 ```

 Notes:

 - When specifying columns in the `keys` field, ensure that these same columns are also listed under the `columns` field in your configuration.
 - There is no limit to the number of columns that can be used to create custom message keys. However, it’s best to use the minimum required number of columns to specify a unique key.

### Fully-qualified table name

In this document we refer to the fully-qualified table name as `<databaseName>.<tableName>`. This format is for MySQL database. For Oracle, SQLServer and Postgresql databases use `<schemaName>`.`<tableName>` instead.

| Database Type | Fully-qualified Table Name |
| -- | -- |
| Oracle, SQLServer, PostrgreSQL | `<schemaName>.<tableName>` |
| MySQL | `<databaseName>.<tableName>` |

{{< note >}}You can specify the fully-qualified table name `<databaseName>.<tableName>` as
a regular expression instead of providing the full name of the `databaseName` and `tableName`.
{{< /note >}}

### Examples

- The primary key of the tables `customer` and `employee` is `ID`.

 To establish custom messages keys based on `FirstName` and `LastName` for the tables `customer` and `employee`, add the following block to the `config.yaml` file:

 ```yaml
 tables:
 # Sync a specific table with all its columns:
 chinook.customer:
 columns:
 - ID
 - FirstName
 - LastName
 - Company
 - Address
 - Email
 keys:
 - FirstName
 - LastName
 chinook.employee:
 columns:
 - ID
 - FirstName
 - LastName
 - ReportsTo
 - Address
 - City
 - State
 keys:
 - FirstName
 - LastName
 ```

## processors: RDI processors {#processors}

### Properties

|Name|Type|Description|Required|
|--|--|--|--|
|**on_failed_retry_interval**<br/>(Interval \(in seconds\) on which to perform retry on failure)|`integer`, `string`|Default: `5`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>||
|**read_batch_size**<br/>(The batch size for reading data from source database)|`integer`, `string`|Default: `2000`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>||
|**debezium_lob_encoded_placeholder**<br/>(Enable Debezium LOB placeholders)|`string`|Default: `"X19kZWJleml1bV91bmF2YWlsYWJsZV92YWx1ZQ=="`<br/>||
|**dedup**<br/>(Enable deduplication mechanism)|`boolean`|Default: `false`<br/>||
|**dedup_max_size**<br/>(Max size of the deduplication set)|`integer`|Default: `1024`<br/>Minimum: `1`<br/>||
|**dedup_strategy**<br/>(Deduplication strategy: reject \- reject messages\(dlq\), ignore \- ignore messages)|`string`|(DEPRECATED)<br/>Property 'dedup_strategy' is now deprecated. The only supported strategy is 'ignore'. Please remove from the configuration.<br/>Default: `"ignore"`<br/>Enum: `"reject"`, `"ignore"`<br/>||
|**duration**<br/>(Time \(in ms\) after which data will be read from stream even if read_batch_size was not reached)|`integer`, `string`|Default: `100`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>||
|**write_batch_size**<br/>(The batch size for writing data to target Redis database\. Should be less or equal to the read_batch_size)|`integer`, `string`|Default: `200`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>||
|**error_handling**<br/>(Error handling strategy: ignore \- skip, dlq \- store rejected messages in a dead letter queue)|`string`|Default: `"dlq"`<br/>Pattern: `^\${.*}$|ignore|dlq`<br/>||
|**dlq_max_messages**<br/>(Dead letter queue max messages per stream)|`integer`, `string`|Default: `1000`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>||
|**target_data_type**<br/>(Target data type: hash/json \- RedisJSON module must be in use in the target DB)|`string`|Default: `"hash"`<br/>Pattern: `^\${.*}$|hash|json`<br/>||
|**json_update_strategy**<br/>(Target update strategy: replace/merge \- RedisJSON module must be in use in the target DB)|`string`|(DEPRECATED)<br/>Property 'json_update_strategy' will be deprecated in future releases. Use 'on_update' job-level property to define the json update strategy.<br/>Default: `"replace"`<br/>Pattern: `^\${.*}$|replace|merge`<br/>||
|**initial_sync_processes**<br/>(Number of processes RDI Engine creates to process the initial sync with the source)|`integer`, `string`|Default: `4`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>Maximum: `32`<br/>||
|**idle_sleep_time_ms**<br/>(Idle sleep time \(in milliseconds\) between batches)|`integer`, `string`|Default: `200`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>Maximum: `999999`<br/>||
|**idle_streams_check_interval_ms**<br/>(Interval \(in milliseconds\) for checking new streams when the stream processor is idling)|`integer`, `string`|Default: `1000`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>Maximum: `999999`<br/>||
|**busy_streams_check_interval_ms**<br/>(Interval \(in milliseconds\) for checking new streams when the stream processor is busy)|`integer`, `string`|Default: `5000`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>Maximum: `999999`<br/>||
|**wait_enabled**<br/>(Checks if the data has been written to the replica shard)|`boolean`|Default: `false`<br/>||
|**wait_timeout**<br/>(Timeout in milliseconds when checking write to the replica shard)|`integer`, `string`|Default: `1000`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>||
|**retry_on_replica_failure**<br/>(Ensures that the data has been written to the replica shard and keeps retrying if not)|`boolean`|Default: `true`<br/>||
| |

### Additional properties

Not allowed 

## targets: Target connections {#targets}

**Properties**

| Name | Type | Description | Required |
| -- | -- | -- | -- |
| [**connection**](#targetsconnection) | `object` | Connection details | |

### targets\.connection: Connection details {#targetsconnection}

**Properties (Pattern)**

| Name | Type | Description | |
| -- | -- | -- | -- |
| host | string | Host of the Redis database to which Redis Data Integration will write the processed data. |
| port | int | Port for the Redis database to which Redis Data Integration will write the processed data. | |
| user | string | User of the Redis database to which Redis Data Integration will write the processed data. Uncomment if not using default user. |
| password | string | Password for Redis target database. |
| key | string | uncomment the following lines if you are using SSL/TLS. |
| key_password | string | uncomment the following lines if you are using SSL/TLS. |
| cert | string | uncomment the following lines if you are using SSL/TLS. |
| cacert | string | uncomment the following lines if you are using SSL/TLS. |
