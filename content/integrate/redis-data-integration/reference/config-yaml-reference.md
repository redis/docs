---
Title: Redis Data Integration configuration file
linkTitle: RDI configuration file
description: Redis Data Integration configuration file reference
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases:
---

Configuration file for Redis Data Integration (RDI) source collectors and target connections

**Properties**

| Name                                                              | Type             | Description                                                                                                                                                               | Required |
| ----------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| [**sources**](#sources)<br/>(Source collectors)                   | `object`         | Defines source collectors and their configurations. Each key represents a unique source identifier, and its value contains specific configuration for that collector<br/> |          |
| [**processors**](#processors)<br/>(Data processing configuration) | `object`, `null` | Configuration settings that control how data is processed, including batch sizes, error handling, and performance tuning<br/>                                             |          |
| [**targets**](#targets)<br/>(Target connections)                  | `object`         | Configuration for target Redis databases where processed data will be written<br/>                                                                                        |          |
| [**secret\-providers**](#secret-providers)<br/>(Secret providers) | `object`         | Configuration for secret management providers<br/>                                                                                                                        |          |

**Additional Properties:** not allowed  
<a name="sources"></a>

## sources: Source collectors

Defines source collectors and their configurations. Each key represents a unique source identifier, and its value contains specific configuration for that collector

**Properties** (key: `.*`)

| Name                                                          | Type       | Description                                                                          | Required |
| ------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------ | -------- |
| **connection**                                                |            |                                                                                      | yes      |
| **type**<br/>(Collector type)                                 | `string`   | Type of the source collector.<br/>Default: `"cdc"`<br/>Enum: `"cdc"`, `"flink"`<br/> | yes      |
| **active**<br/>(Collector enabled)                            | `boolean`  | Flag to enable or disable the source collector<br/>Default: `true`<br/>              | no       |
| [**logging**](#sourceslogging)<br/>(Logging configuration)    | `object`   | Logging configuration for the source collector<br/>                                  | no       |
| [**tables**](#sourcestables)<br/>(Tables to capture)          | `object`   | Defines which tables to capture and how to handle their data<br/>                    | no       |
| [**schemas**](#sourcesschemas)<br/>(Schema names)             | `string[]` | Schema names to capture from the source database (schema.include.list)<br/>          | no       |
| [**databases**](#sourcesdatabases)<br/>(Database names)       | `string[]` | Database names to capture from the source database (database.include.list)<br/>      | no       |
| [**advanced**](#sourcesadvanced)<br/>(Advanced configuration) | `object`   | Advanced configuration options for fine-tuning the collector<br/>                    | no       |

<a name="sourceslogging"></a>

### sources\.logging: Logging configuration

Logging configuration for the source collector

**Properties**

| Name                          | Type     | Description                                                                                                                     | Required |
| ----------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **level**<br/>(Logging level) | `string` | Logging level for the source collector<br/>Default: `"info"`<br/>Enum: `"trace"`, `"debug"`, `"info"`, `"warn"`, `"error"`<br/> |          |

**Additional Properties:** not allowed  
**Example**

```yaml
level: info
```

<a name="sourcestables"></a>

### sources\.tables: Tables to capture

Defines which tables to capture and how to handle their data

**Additional Properties**

| Name                                                            | Type             | Description | Required |
| --------------------------------------------------------------- | ---------------- | ----------- | -------- |
| [**Additional Properties**](#sourcestablesadditionalproperties) | `object`, `null` |             |          |

**Minimal Properties:** 1  
<a name="sourcestablesadditionalproperties"></a>

#### sources\.tables\.additionalProperties: object,null

**Properties**

| Name                                                                                              | Type       | Description                                                                                                                                                                            | Required |
| ------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **snapshot_sql**                                                                                  | `string`   | Custom SQL statement to use for the initial data snapshot, allowing fine-grained control over what data is captured<br/>                                                               |          |
| [**columns**](#sourcestablesadditionalpropertiescolumns)<br/>(Columns to capture)                 | `string[]` | List of specific columns to capture for changes. If not specified, all columns will be captured. Note: This property cannot be used for MongoDB connections<br/>                       |          |
| [**exclude_columns**](#sourcestablesadditionalpropertiesexclude_columns)<br/>(Columns to exclude) | `string[]` | List of specific columns to exclude from capture. If not specified, no columns will be excluded. Note: This property can only be used for MongoDB connections<br/>                     |          |
| [**keys**](#sourcestablesadditionalpropertieskeys)<br/>(Message keys)                             | `string[]` | Optional list of columns to use as a composite unique identifier. Only required when the table lacks a primary key or unique constraint. Must form a unique combination of fields<br/> |          |

**Additional Properties:** not allowed  
<a name="sourcestablesadditionalpropertiescolumns"></a>

##### sources\.tables\.additionalProperties\.columns\[\]: Columns to capture

List of specific columns to capture for changes. If not specified, all columns will be captured. Note: This property cannot be used for MongoDB connections

<a name="sourcestablesadditionalpropertiesexclude_columns"></a>

##### sources\.tables\.additionalProperties\.exclude_columns\[\]: Columns to exclude

List of specific columns to exclude from capture. If not specified, no columns will be excluded. Note: This property can only be used for MongoDB connections

<a name="sourcestablesadditionalpropertieskeys"></a>

##### sources\.tables\.additionalProperties\.keys\[\]: Message keys

Optional list of columns to use as a composite unique identifier. Only required when the table lacks a primary key or unique constraint. Must form a unique combination of fields

<a name="sourcesschemas"></a>

### sources\.schemas\[\]: Schema names

Schema names to capture from the source database (schema.include.list)

<a name="sourcesdatabases"></a>

### sources\.databases\[\]: Database names

Database names to capture from the source database (database.include.list)

<a name="sourcesadvanced"></a>

### sources\.advanced: Advanced configuration

Advanced configuration options for fine-tuning the collector

**Properties**

| Name                                                                             | Type     | Description                                                                                                                                                                                                                                                                                                                                                                                                                | Required |
| -------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| [**sink**](#sourcesadvancedsink)<br/>(RDI Collector stream writer configuration) | `object` | Advanced configuration properties for RDI Collector stream writer connection and behaviour. When using collector type 'cdc', see the full list of properties at - https://debezium.io/documentation/reference/stable/operations/debezium-server.html#_redis_stream . When using a property from that list, remove the `debezium.sink.` prefix. When using collector type 'flink', see the full list of properties at <br/> |          |
| [**source**](#sourcesadvancedsource)<br/>(Advanced source settings)              | `object` | Advanced configuration properties for the source database connection and CDC behavior<br/>                                                                                                                                                                                                                                                                                                                                 |          |
| [**quarkus**](#sourcesadvancedquarkus)<br/>(Quarkus runtime settings)            | `object` | Advanced configuration properties for the Quarkus runtime environment<br/>                                                                                                                                                                                                                                                                                                                                                 |          |
| [**flink**](#sourcesadvancedflink)<br/>(Advanced Flink settings)                 | `object` | Advanced configuration properties for Flink<br/>                                                                                                                                                                                                                                                                                                                                                                           |          |
| **java_options**<br/>(Advanced Java options)                                     | `string` | These Java options will be passed to the command line command when launching the source collector<br/>                                                                                                                                                                                                                                                                                                                     |          |

**Additional Properties:** not allowed  
**Minimal Properties:** 1  
**Example**

```yaml
sink: {}
source: {}
quarkus: {}
flink: {}
```

<a name="sourcesadvancedsink"></a>

#### sources\.advanced\.sink: RDI Collector stream writer configuration

Advanced configuration properties for RDI Collector stream writer connection and behaviour. When using collector type 'cdc', see the full list of properties at - https://debezium.io/documentation/reference/stable/operations/debezium-server.html#_redis_stream . When using a property from that list, remove the `debezium.sink.` prefix. When using collector type 'flink', see the full list of properties at

**Additional Properties**

| Name                      | Type                          | Description | Required |
| ------------------------- | ----------------------------- | ----------- | -------- |
| **Additional Properties** | `string`, `number`, `boolean` |             |          |

**Minimal Properties:** 1  
<a name="sourcesadvancedsource"></a>

#### sources\.advanced\.source: Advanced source settings

Advanced configuration properties for the source database connection and CDC behavior

**Additional Properties**

| Name                      | Type                          | Description | Required |
| ------------------------- | ----------------------------- | ----------- | -------- |
| **Additional Properties** | `string`, `number`, `boolean` |             |          |

**Minimal Properties:** 1  
<a name="sourcesadvancedquarkus"></a>

#### sources\.advanced\.quarkus: Quarkus runtime settings

Advanced configuration properties for the Quarkus runtime environment

**Additional Properties**

| Name                      | Type                          | Description | Required |
| ------------------------- | ----------------------------- | ----------- | -------- |
| **Additional Properties** | `string`, `number`, `boolean` |             |          |

**Minimal Properties:** 1  
<a name="sourcesadvancedflink"></a>

#### sources\.advanced\.flink: Advanced Flink settings

Advanced configuration properties for Flink

**Additional Properties**

| Name                      | Type                          | Description | Required |
| ------------------------- | ----------------------------- | ----------- | -------- |
| **Additional Properties** | `string`, `number`, `boolean` |             |          |

**Minimal Properties:** 1  
<a name="processors"></a>

## processors: Data processing configuration

Configuration settings that control how data is processed, including batch sizes, error handling, and performance tuning

**Properties**

| Name                                                                        | Type                | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Required |
| --------------------------------------------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **type**<br/>(Processor type)                                               | `string`            | Processor type, either 'classic' or 'flink'<br/>Default: `"classic"`<br/>Enum: `"classic"`<br/>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |          |
| **on_failed_retry_interval**<br/>(Retry interval on failure)                | `integer`, `string` | Number of seconds to wait before retrying a failed operation<br/>Default: `5`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |          |
| **read_batch_size**                                                         | `integer`, `string` | Maximum number of records to process in a single batch<br/>Default: `2000`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |          |
| **read_batch_timeout_ms**<br/>(Read batch timeout)                          | `integer`           | Maximum time in milliseconds to wait for a batch to fill before processing<br/>Default: `100`<br/>Minimum: `1`<br/>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |          |
| **enable_async_processing**                                                 | `boolean`           | Enable async processing to improve throughput<br/>Default: `true`<br/>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |          |
| **batch_queue_size**                                                        | `integer`           | Maximum number of batches to queue for processing<br/>Default: `3`<br/>Minimum: `1`<br/>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |          |
| **ack_queue_size**                                                          | `integer`           | Maximum number of batches to queue for asynchronous acknowledgement<br/>Default: `10`<br/>Minimum: `1`<br/>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |          |
| **dedup**<br/>(Enable deduplication)                                        | `boolean`           | Enable the deduplication mechanism to handle duplicate records<br/>Default: `false`<br/>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |          |
| **dedup_max_size**<br/>(Deduplication set size)                             | `integer`           | Maximum number of entries to store in the deduplication set<br/>Default: `1024`<br/>Minimum: `1`<br/>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |          |
| **dedup_strategy**<br/>(Deduplication strategy)                             | `string`            | (DEPRECATED)<br/>Property 'dedup_strategy' is now deprecated. The only supported strategy is 'ignore'. Please remove from the configuration.<br/>Default: `"ignore"`<br/>Enum: `"reject"`, `"ignore"`<br/>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |          |
| **duration**<br/>(Batch duration limit)                                     | `integer`, `string` | Maximum time in milliseconds to wait for a batch to fill before processing<br/>Default: `100`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |          |
| **write_batch_size**                                                        | `integer`, `string` | Maximum number of records to write to target Redis database in a single batch<br/>Default: `200`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |          |
| **error_handling**<br/>(Error handling strategy)                            | `string`            | Strategy for handling errors: ignore to skip errors, dlq to store rejected messages in dead letter queue<br/>Default: `"dlq"`<br/>Pattern: `^\${.*}$\|ignore\|dlq`<br/>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |          |
| **dlq_max_messages**<br/>(DLQ message limit)                                | `integer`, `string` | Maximum number of messages to store in dead letter queue per stream<br/>Default: `1000`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |          |
| **target_data_type**<br/>(Target Redis data type)                           | `string`            | Data type to use in Redis: hash for Redis Hash, json for RedisJSON (requires RedisJSON module)<br/>Default: `"hash"`<br/>Pattern: `^\${.*}$\|hash\|json`<br/>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |          |
| **json_update_strategy**                                                    | `string`            | Strategy for updating JSON data in Redis: replace to overwrite the entire JSON object, merge to merge new data with existing JSON object<br/>Default: `"replace"`<br/>Pattern: `^\${.*}$\|replace\|merge`<br/>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |          |
| **initial_sync_processes**                                                  | `integer`, `string` | Number of parallel processes for performing initial data synchronization<br/>Default: `4`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>Maximum: `32`<br/>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |          |
| **idle_sleep_time_ms**<br/>(Idle sleep interval)                            | `integer`, `string` | Time in milliseconds to sleep between processing batches when idle<br/>Default: `200`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>Maximum: `999999`<br/>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |          |
| **idle_streams_check_interval_ms**<br/>(Idle streams check interval)        | `integer`, `string` | Time in milliseconds between checking for new streams when processor is idle<br/>Default: `1000`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>Maximum: `999999`<br/>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |          |
| **busy_streams_check_interval_ms**<br/>(Busy streams check interval)        | `integer`, `string` | Time in milliseconds between checking for new streams when processor is busy<br/>Default: `5000`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>Maximum: `999999`<br/>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |          |
| **wait_enabled**<br/>(Enable replica wait)                                  | `boolean`           | Enable verification that data has been written to replica shards of the target database<br/>Default: `false`<br/>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |          |
| **wait_timeout**<br/>(Replica wait timeout)                                 | `integer`, `string` | Maximum time in milliseconds to wait for replica write verification of the target database<br/>Default: `1000`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |          |
| **retry_max_attempts**<br/>(Maximum retry attempts)                         | `integer`, `string` | Maximum number of attempts for failed operations<br/>Default: `5`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |          |
| **retry_initial_delay_ms**<br/>(Initial retry delay)                        | `integer`, `string` | Initial delay in milliseconds before retrying a failed operation<br/>Default: `1000`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>Maximum: `999999`<br/>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |          |
| **retry_max_delay_ms**<br/>(Maximum retry delay)                            | `integer`, `string` | Maximum delay in milliseconds between retry attempts<br/>Default: `10000`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>Maximum: `999999`<br/>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |          |
| **retry_on_replica_failure**                                                | `boolean`           | Continue retrying writes until successful replication to replica shards is confirmed<br/>Default: `true`<br/>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |          |
| [**logging**](#processorslogging)<br/>(Logging configuration)               | `object`            | Logging configuration for the processor<br/>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |          |
| **use_native_json_merge**<br/>(Use native JSON merge from RedisJSON module) | `boolean`           | Controls whether to use the native `JSON.MERGE` command (when `true`) or Lua scripts (when `false`) for JSON merge operations. Introduced in RDI 1.15.0. The native command provides 2x performance improvement but handles null values differently:<br/><br/>**Previous behavior (Lua merge)**: When merging `{"field1": "value1", "field2": "value2"}` with `{"field2": null, "field3": "value3"}`, the result was `{"field1": "value1", "field2": null, "field3": "value3"}` (null value is preserved)<br/><br/>**New behavior (JSON.MERGE)**: The same merge produces `{"field1": "value1", "field3": "value3"}` (null value removes the field, following [RFC 7396](https://datatracker.ietf.org/doc/html/rfc7396))<br/><br/>**Note**: The native `JSON.MERGE` command requires RedisJSON 2.6.0 or higher. If the target database has an older version of RedisJSON, RDI will automatically fall back to using Lua-based merge operations regardless of this setting.<br/><br/>**Impact**: If your application logic distinguishes between a field with a `null` value and a missing field, you may need to adjust your data handling. This follows the JSON Merge Patch RFC standard but differs from the previous Lua implementation. Set to `false` to revert to the previous Lua-based merge behavior if needed.<br/>Default: `true`<br/> |          |
| [**advanced**](#processorsadvanced)<br/>(Advanced configuration)            | `object`            | Advanced configuration options for fine-tuning the processor<br/>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |          |

**Additional Properties:** not allowed  
<a name="processorslogging"></a>

### processors\.logging: Logging configuration

Logging configuration for the processor

**Properties**

| Name                          | Type     | Description                                                                                                              | Required |
| ----------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------ | -------- |
| **level**<br/>(Logging level) | `string` | Logging level for the processor<br/>Default: `"info"`<br/>Enum: `"trace"`, `"debug"`, `"info"`, `"warn"`, `"error"`<br/> |          |

**Additional Properties:** not allowed  
**Example**

```yaml
level: info
```

<a name="processorsadvanced"></a>

### processors\.advanced: Advanced configuration

Advanced configuration options for fine-tuning the processor

**Properties**

| Name                                                                            | Type     | Description                                              | Required |
| ------------------------------------------------------------------------------- | -------- | -------------------------------------------------------- | -------- |
| [**source**](#processorsadvancedsource)<br/>(Advanced source settings)          | `object` | Advanced configuration properties for the source<br/>    |          |
| [**sink**](#processorsadvancedsink)<br/>(Advanced sink settings)                | `object` | Advanced configuration properties for the sink<br/>      |          |
| [**processor**](#processorsadvancedprocessor)<br/>(Advanced processor settings) | `object` | Advanced configuration properties for the processor<br/> |          |

**Additional Properties:** not allowed  
**Minimal Properties:** 1  
**Example**

```yaml
source: {}
sink: {}
processor: {}
```

<a name="processorsadvancedsource"></a>

#### processors\.advanced\.source: Advanced source settings

Advanced configuration properties for the source

**Additional Properties**

| Name                      | Type                          | Description | Required |
| ------------------------- | ----------------------------- | ----------- | -------- |
| **Additional Properties** | `string`, `number`, `boolean` |             |          |

**Minimal Properties:** 1  
<a name="processorsadvancedsink"></a>

#### processors\.advanced\.sink: Advanced sink settings

Advanced configuration properties for the sink

**Additional Properties**

| Name                      | Type                          | Description | Required |
| ------------------------- | ----------------------------- | ----------- | -------- |
| **Additional Properties** | `string`, `number`, `boolean` |             |          |

**Minimal Properties:** 1  
<a name="processorsadvancedprocessor"></a>

#### processors\.advanced\.processor: Advanced processor settings

Advanced configuration properties for the processor

**Additional Properties**

| Name                      | Type                          | Description | Required |
| ------------------------- | ----------------------------- | ----------- | -------- |
| **Additional Properties** | `string`, `number`, `boolean` |             |          |

**Minimal Properties:** 1  
<a name="targets"></a>

## targets: Target connections

Configuration for target Redis databases where processed data will be written

**Properties (Pattern)**

| Name     | Type | Description | Required |
| -------- | ---- | ----------- | -------- |
| **\.\*** |      |             |          |

<a name="secret-providers"></a>

## secret\-providers: Secret providers

Configuration for secret management providers

**Properties** (key: `.*`)

| Name                                                                    | Type     | Description                                                       | Required |
| ----------------------------------------------------------------------- | -------- | ----------------------------------------------------------------- | -------- |
| **type**<br/>(Provider type)                                            | `string` | Type of secret provider service<br/>Enum: `"aws"`, `"vault"`<br/> | yes      |
| [**parameters**](#secret-providersparameters)<br/>(Provider parameters) | `object` | Configuration parameters for the secret provider<br/>             | yes      |

<a name="secret-providersparameters"></a>

### secret\-providers\.parameters: Provider parameters

Configuration parameters for the secret provider

**Properties**

| Name                                                                          | Type       | Description                                            | Required |
| ----------------------------------------------------------------------------- | ---------- | ------------------------------------------------------ | -------- |
| [**objects**](#secret-providersparametersobjects)<br/>(Secrets objects array) | `object[]` | List of secret objects to fetch from the provider<br/> | yes      |

**Example**

```yaml
objects:
  - {}
```

<a name="secret-providersparametersobjects"></a>

#### secret\-providers\.parameters\.objects\[\]: Secrets objects array

List of secret objects to fetch from the provider

**Items: Secret object**

**No properties.**

**Example**

```yaml
- {}
```
