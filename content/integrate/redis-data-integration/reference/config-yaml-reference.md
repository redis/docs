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
| [**secret\-providers**](#secret-providers)<br/>(Secret providers) | `object`         |                                                                                                                                                                           |          |

<a name="sources"></a>

## sources: Source collectors

Defines source collectors and their configurations. Each key represents a unique source identifier, and its value contains specific configuration for that collector

**Properties (Pattern)**

| Name     | Type | Description | Required |
| -------- | ---- | ----------- | -------- |
| **\.\*** |      |             |          |

<a name="processors"></a>

## processors: Data processing configuration

Configuration settings that control how data is processed, including batch sizes, error handling, and performance tuning

**Properties**

| Name                                                                 | Type                | Description                                                                                                                                                                                                                          | Required |
| -------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| **on_failed_retry_interval**<br/>(Retry interval on failure)         | `integer`, `string` | Number of seconds to wait before retrying a failed operation<br/>Default: `5`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>                                                                                                          |          |
| **read_batch_size**                                                  | `integer`, `string` | Maximum number of records to process in a single batch<br/>Default: `2000`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>                                                                                                             |          |
| **debezium_lob_encoded_placeholder**<br/>(Debezium LOB placeholder)  | `string`            | Placeholder value for LOB fields in Debezium<br/>Default: `"__debezium_unavailable_value"`<br/>                                                                                                                                      |          |
| **dedup**<br/>(Enable deduplication)                                 | `boolean`           | Enable the deduplication mechanism to handle duplicate records<br/>Default: `false`<br/>                                                                                                                                             |          |
| **dedup_max_size**<br/>(Deduplication set size)                      | `integer`           | Maximum number of entries to store in the deduplication set<br/>Default: `1024`<br/>Minimum: `1`<br/>                                                                                                                                |          |
| **dedup_strategy**<br/>(Deduplication strategy)                      | `string`            | (DEPRECATED)<br/>Property 'dedup_strategy' is now deprecated. The only supported strategy is 'ignore'. Please remove from the configuration.<br/>Default: `"ignore"`<br/>Enum: `"reject"`, `"ignore"`<br/>                           |          |
| **duration**<br/>(Batch duration limit)                              | `integer`, `string` | Maximum time in milliseconds to wait for a batch to fill before processing<br/>Default: `100`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>                                                                                          |          |
| **write_batch_size**                                                 | `integer`, `string` | Maximum number of records to write to target Redis database in a single batch<br/>Default: `200`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>                                                                                       |          |
| **error_handling**<br/>(Error handling strategy)                     | `string`            | Strategy for handling errors: ignore to skip errors, dlq to store rejected messages in dead letter queue<br/>Default: `"dlq"`<br/>Pattern: `^\${.*}$\|ignore\|dlq`<br/>                                                              |          |
| **dlq_max_messages**<br/>(DLQ message limit)                         | `integer`, `string` | Maximum number of messages to store in dead letter queue per stream<br/>Default: `1000`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>                                                                                                |          |
| **target_data_type**<br/>(Target Redis data type)                    | `string`            | Data type to use in Redis: hash for Redis Hash, json for RedisJSON (requires RedisJSON module)<br/>Default: `"hash"`<br/>Pattern: `^\${.*}$\|hash\|json`<br/>                                                                        |          |
| **json_update_strategy**                                             | `string`            | (DEPRECATED)<br/>Property 'json_update_strategy' will be deprecated in future releases. Use 'on_update' job-level property to define the json update strategy.<br/>Default: `"replace"`<br/>Pattern: `^\${.*}$\|replace\|merge`<br/> |          |
| **use_native_json_merge**<br/>(Use native JSON merge)               | `boolean`           | Controls whether to use the native `JSON.MERGE` command (when `true`) or Lua scripts (when `false`) for JSON merge operations. Introduced in RDI 1.15.0. The native command provides 2x performance improvement but handles null values differently:<br/><br/>**Previous behavior (Lua merge)**: When merging `{"field1": "value1", "field2": "value2"}` with `{"field2": null, "field3": "value3"}`, the result was `{"field1": "value1", "field2": null, "field3": "value3"}` (null value is preserved)<br/><br/>**New behavior (JSON.MERGE)**: The same merge produces `{"field1": "value1", "field3": "value3"}` (null value removes the field, following [RFC 7396](https://datatracker.ietf.org/doc/html/rfc7396))<br/><br/>**Note**: The native `JSON.MERGE` command requires RedisJSON 2.6.0 or higher. If the target database has an older version of RedisJSON, RDI will automatically fall back to using Lua-based merge operations regardless of this setting.<br/><br/>**Impact**: If your application logic distinguishes between a field with a `null` value and a missing field, you may need to adjust your data handling. This follows the JSON Merge Patch RFC standard but differs from the previous Lua implementation. Set to `false` to revert to the previous Lua-based merge behavior if needed.<br/>Default: `true`<br/>                                                                                                                                      |          |
| **initial_sync_processes**                                           | `integer`, `string` | Number of parallel processes for performing initial data synchronization<br/>Default: `4`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>Maximum: `32`<br/>                                                                            |          |
| **idle_sleep_time_ms**<br/>(Idle sleep interval)                     | `integer`, `string` | Time in milliseconds to sleep between processing batches when idle<br/>Default: `200`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>Maximum: `999999`<br/>                                                                            |          |
| **idle_streams_check_interval_ms**<br/>(Idle streams check interval) | `integer`, `string` | Time in milliseconds between checking for new streams when processor is idle<br/>Default: `1000`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>Maximum: `999999`<br/>                                                                 |          |
| **busy_streams_check_interval_ms**<br/>(Busy streams check interval) | `integer`, `string` | Time in milliseconds between checking for new streams when processor is busy<br/>Default: `5000`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>Maximum: `999999`<br/>                                                                 |          |
| **wait_enabled**<br/>(Enable replica wait)                           | `boolean`           | Enable verification that data has been written to replica shards<br/>Default: `false`<br/>                                                                                                                                           |          |
| **wait_timeout**<br/>(Replica wait timeout)                          | `integer`, `string` | Maximum time in milliseconds to wait for replica write verification<br/>Default: `1000`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>                                                                                                |          |
| **retry_on_replica_failure**                                         | `boolean`           | Continue retrying writes until successful replication to replica shards is confirmed<br/>Default: `true`<br/>                                                                                                                        |          |

**Additional Properties:** not allowed  
<a name="targets"></a>

## targets: Target connections

Configuration for target Redis databases where processed data will be written

**Properties (Pattern)**

| Name     | Type | Description | Required |
| -------- | ---- | ----------- | -------- |
| **\.\*** |      |             |          |

<a name="secret-providers"></a>

## secret\-providers: Secret providers

**Properties (Pattern)**

| Name                                                      | Type     | Description | Required |
| --------------------------------------------------------- | -------- | ----------- | -------- |
| [**\.\***](#secret-providers)<br/>(Secret provider entry) | `object` |             | yes      |

<a name="secret-providers"></a>

#### secret\-providers\.\.\*: Secret provider entry

**Properties**

| Name                                                                    | Type     | Description                   | Required |
| ----------------------------------------------------------------------- | -------- | ----------------------------- | -------- |
| **type**<br/>(Provider type)                                            | `string` | Enum: `"aws"`, `"vault"`<br/> | yes      |
| [**parameters**](#secret-providersparameters)<br/>(Provider parameters) | `object` |                               | yes      |

**Additional Properties:** not allowed  
**Example**

```yaml
parameters:
  objects:
    - {}
```

<a name="secret-providersparameters"></a>

##### secret\-providers\.\.\*\.parameters: Provider parameters

**Properties**

| Name                                                                          | Type       | Description | Required |
| ----------------------------------------------------------------------------- | ---------- | ----------- | -------- |
| [**objects**](#secret-providersparametersobjects)<br/>(Secrets objects array) | `object[]` |             | yes      |

**Example**

```yaml
objects:
  - {}
```

<a name="secret-providersparametersobjects"></a>

###### secret\-providers\.\.\*\.parameters\.objects\[\]: Secrets objects array

**Items: Secret object**

**No properties.**

**Example**

```yaml
- {}
```
