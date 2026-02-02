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
| [**jobs**](#jobs)                                                 | `object[]`       |                                                                                                                                                                           |          |

**Additional Properties:** not allowed  
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

| Name                                                                        | Type                | Description                                                                                                                                                                                                    | Required |
| --------------------------------------------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **type**<br/>(Processor type)                                               | `string`            | Processor type, either 'classic' or 'flink'<br/>Default: `"classic"`<br/>Enum: `"classic"`, `"flink"`<br/>                                                                                                     |          |
| **on_failed_retry_interval**<br/>(Retry interval on failure)                | `integer`, `string` | Number of seconds to wait before retrying a failed operation<br/>Default: `5`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>                                                                                    |          |
| **read_batch_size**                                                         | `integer`, `string` | Maximum number of records to process in a single batch<br/>Default: `2000`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>                                                                                       |          |
| **read_batch_timeout_ms**<br/>(Read batch timeout)                          | `integer`           | Maximum time in milliseconds to wait for a batch to fill before processing<br/>Default: `100`<br/>Minimum: `1`<br/>                                                                                            |          |
| **enable_async_processing**                                                 | `boolean`           | Enable async processing to improve throughput<br/>Default: `true`<br/>                                                                                                                                         |          |
| **batch_queue_size**                                                        | `integer`           | Maximum number of batches to queue for processing<br/>Default: `3`<br/>Minimum: `1`<br/>                                                                                                                       |          |
| **ack_queue_size**                                                          | `integer`           | Maximum number of batches to queue for asynchronous acknowledgement<br/>Default: `10`<br/>Minimum: `1`<br/>                                                                                                    |          |
| **dedup**<br/>(Enable deduplication)                                        | `boolean`           | Enable the deduplication mechanism to handle duplicate records<br/>Default: `false`<br/>                                                                                                                       |          |
| **dedup_max_size**<br/>(Deduplication set size)                             | `integer`           | Maximum number of entries to store in the deduplication set<br/>Default: `1024`<br/>Minimum: `1`<br/>                                                                                                          |          |
| **dedup_strategy**<br/>(Deduplication strategy)                             | `string`            | (DEPRECATED)<br/>Property 'dedup_strategy' is now deprecated. The only supported strategy is 'ignore'. Please remove from the configuration.<br/>Default: `"ignore"`<br/>Enum: `"reject"`, `"ignore"`<br/>     |          |
| **duration**<br/>(Batch duration limit)                                     | `integer`, `string` | Maximum time in milliseconds to wait for a batch to fill before processing<br/>Default: `100`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>                                                                    |          |
| **write_batch_size**                                                        | `integer`, `string` | Maximum number of records to write to target Redis database in a single batch<br/>Default: `200`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>                                                                 |          |
| **error_handling**<br/>(Error handling strategy)                            | `string`            | Strategy for handling errors: ignore to skip errors, dlq to store rejected messages in dead letter queue<br/>Default: `"dlq"`<br/>Pattern: `^\${.*}$\|ignore\|dlq`<br/>                                        |          |
| **dlq_max_messages**<br/>(DLQ message limit)                                | `integer`, `string` | Maximum number of messages to store in dead letter queue per stream<br/>Default: `1000`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>                                                                          |          |
| **target_data_type**<br/>(Target Redis data type)                           | `string`            | Data type to use in Redis: hash for Redis Hash, json for RedisJSON (requires RedisJSON module)<br/>Default: `"hash"`<br/>Pattern: `^\${.*}$\|hash\|json`<br/>                                                  |          |
| **json_update_strategy**                                                    | `string`            | Strategy for updating JSON data in Redis: replace to overwrite the entire JSON object, merge to merge new data with existing JSON object<br/>Default: `"replace"`<br/>Pattern: `^\${.*}$\|replace\|merge`<br/> |          |
| **initial_sync_processes**                                                  | `integer`, `string` | Number of parallel processes for performing initial data synchronization<br/>Default: `4`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>Maximum: `32`<br/>                                                      |          |
| **idle_sleep_time_ms**<br/>(Idle sleep interval)                            | `integer`, `string` | Time in milliseconds to sleep between processing batches when idle<br/>Default: `200`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>Maximum: `999999`<br/>                                                      |          |
| **idle_streams_check_interval_ms**<br/>(Idle streams check interval)        | `integer`, `string` | Time in milliseconds between checking for new streams when processor is idle<br/>Default: `1000`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>Maximum: `999999`<br/>                                           |          |
| **busy_streams_check_interval_ms**<br/>(Busy streams check interval)        | `integer`, `string` | Time in milliseconds between checking for new streams when processor is busy<br/>Default: `5000`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>Maximum: `999999`<br/>                                           |          |
| **wait_enabled**<br/>(Enable replica wait)                                  | `boolean`           | Enable verification that data has been written to replica shards<br/>Default: `false`<br/>                                                                                                                     |          |
| **wait_timeout**<br/>(Replica wait timeout)                                 | `integer`, `string` | Maximum time in milliseconds to wait for replica write verification<br/>Default: `1000`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>                                                                          |          |
| **retry_max_attempts**<br/>(Maximum retry attempts)                         | `integer`, `string` | Maximum number of attempts for failed operations<br/>Default: `5`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>                                                                                                |          |
| **retry_initial_delay_ms**<br/>(Initial retry delay)                        | `integer`, `string` | Initial delay in milliseconds before retrying a failed operation<br/>Default: `1000`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>Maximum: `999999`<br/>                                                       |          |
| **retry_max_delay_ms**<br/>(Maximum retry delay)                            | `integer`, `string` | Maximum delay in milliseconds between retry attempts<br/>Default: `10000`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>Maximum: `999999`<br/>                                                                  |          |
| **retry_on_replica_failure**                                                | `boolean`           | Continue retrying writes until successful replication to replica shards is confirmed<br/>Default: `true`<br/>                                                                                                  |          |
| [**logging**](#processorslogging)<br/>(Logging configuration)               | `object`            | Logging configuration for the processor<br/>                                                                                                                                                                   |          |
| **use_native_json_merge**<br/>(Use native JSON merge from RedisJSON module) | `boolean`           | Use native JSON merge from RedisJSON module if available<br/>Default: `true`<br/>                                                                                                                              |          |
| [**advanced**](#processorsadvanced)<br/>(Advanced configuration)            | `object`            | Advanced configuration options for fine-tuning the processor<br/>                                                                                                                                              |          |

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
| [**flink**](#processorsadvancedflink)<br/>(Advanced Flink settings)             | `object` | Advanced configuration properties for Flink<br/>         |          |

**Additional Properties:** not allowed  
**Minimal Properties:** 1  
**Example**

```yaml
source: {}
sink: {}
processor: {}
flink: {}
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
<a name="processorsadvancedflink"></a>

#### processors\.advanced\.flink: Advanced Flink settings

Advanced configuration properties for Flink

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

**Properties (Pattern)**

| Name                                                      | Type     | Description | Required |
| --------------------------------------------------------- | -------- | ----------- | -------- |
| [**\.\***](#secret-providers)<br/>(Secret provider entry) | `object` |             | yes      |

<a name="secret-providers"></a>

#### secret\-providers\.\.\*: Secret provider entry

**Properties**

| Name                                                                    | Type     | Description                                                       | Required |
| ----------------------------------------------------------------------- | -------- | ----------------------------------------------------------------- | -------- |
| **type**<br/>(Provider type)                                            | `string` | Type of secret provider service<br/>Enum: `"aws"`, `"vault"`<br/> | yes      |
| [**parameters**](#secret-providersparameters)<br/>(Provider parameters) | `object` | Configuration parameters for the secret provider<br/>             | yes      |

**Additional Properties:** not allowed  
**Example**

```yaml
parameters:
  objects:
    - {}
```

<a name="secret-providersparameters"></a>

##### secret\-providers\.\.\*\.parameters: Provider parameters

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

###### secret\-providers\.\.\*\.parameters\.objects\[\]: Secrets objects array

List of secret objects to fetch from the provider

**Items: Secret object**

**No properties.**

**Example**

```yaml
- {}
```

<a name="jobs"></a>

## jobs\[\]: array

**Items**

**No properties.**

**Example**

```yaml
- {}
```
