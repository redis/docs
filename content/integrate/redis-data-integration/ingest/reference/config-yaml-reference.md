---
Title: Redis Data Integration configuration file
linkTitle: RDI configuration file
description: Redis Data Integration configuration file reference
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases:
---

**Properties**

| Name                                                                                           | Type             | Description | Required |
| ---------------------------------------------------------------------------------------------- | ---------------- | ----------- | -------- |
| [**sources**](#sources)<br/>(Source collectors)                                                | `object`         |             |          |
| [**processors**](#processors)<br/>(Configuration details of Redis Data Integration Processors) | `object`, `null` |             |          |
| [**targets**](#targets)<br/>(Target connections)                                               | `object`         |             |          |

<a name="sources"></a>

## sources: Source collectors

**Additional Properties**

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |

<a name="processors"></a>

## processors: Configuration details of Redis Data Integration Processors

**Properties**

| Name                                                                                                                                 | Type                | Description                                                                                                                                                                                                      | Required |
| ------------------------------------------------------------------------------------------------------------------------------------ | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------ | --- |
| **on_failed_retry_interval**<br/>(Interval \(in seconds\) on which to perform retry on failure)                                      | `integer`, `string` | Default: `5`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>                                                                                                                                                       |          |
| **read_batch_size**<br/>(The batch size for reading data from source database)                                                       | `integer`, `string` | Default: `2000`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>                                                                                                                                                    |          |
| **debezium_lob_encoded_placeholder**<br/>(Enable Debezium LOB placeholders)                                                          | `string`            | Default: `"X19kZWJleml1bV91bmF2YWlsYWJsZV92YWx1ZQ=="`<br/>                                                                                                                                                       |          |
| **dedup**<br/>(Enable deduplication mechanism)                                                                                       | `boolean`           | Default: `false`<br/>                                                                                                                                                                                            |          |
| **dedup_max_size**<br/>(Max size of the deduplication set)                                                                           | `integer`           | Default: `1024`<br/>Minimum: `1`<br/>                                                                                                                                                                            |          |
| **dedup_strategy**<br/>(Deduplication strategy: reject \- reject messages\(dlq\), ignore \- ignore messages)                         | `string`            | (DEPRECATED)<br/>Property 'dedup_strategy' is now deprecated. The only supported strategy is 'ignore'. Please remove from the configuration.<br/>Default: `"ignore"`<br/>Enum: `"reject"`, `"ignore"`<br/>       |          |
| **duration**<br/>(Time \(in ms\) after which data will be read from stream even if read_batch_size was not reached)                  | `integer`, `string` | Default: `100`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>                                                                                                                                                     |          |
| **write_batch_size**<br/>(The batch size for writing data to target Redis database\. Should be less or equal to the read_batch_size) | `integer`, `string` | Default: `200`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>                                                                                                                                                     |          |
| **error_handling**<br/>(Error handling strategy: ignore \- skip, dlq \- store rejected messages in a dead letter queue)              | `string`            | Default: `"dlq"`<br/>Pattern: ``^\${.\*}$                                                                                                                                                                        | ignore   | dlq``<br/>   |     |
| **dlq_max_messages**<br/>(Dead letter queue max messages per stream)                                                                 | `integer`, `string` | Default: `1000`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>                                                                                                                                                    |          |
| **target_data_type**<br/>(Target data type: hash/json \- RedisJSON module must be in use in the target DB)                           | `string`            | Default: `"hash"`<br/>Pattern: ``^\${.\*}$                                                                                                                                                                       | hash     | json``<br/>  |     |
| **json_update_strategy**<br/>(Target update strategy: replace/merge \- RedisJSON module must be in use in the target DB)             | `string`            | (DEPRECATED)<br/>Property 'json_update_strategy' will be deprecated in future releases. Use 'on_update' job-level property to define the json update strategy.<br/>Default: `"replace"`<br/>Pattern: ``^\${.\*}$ | replace  | merge``<br/> |     |
| **initial_sync_processes**<br/>(Number of processes RDI Engine creates to process the initial sync with the source)                  | `integer`, `string` | Default: `4`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>Maximum: `32`<br/>                                                                                                                                     |          |
| **idle_sleep_time_ms**<br/>(Idle sleep time \(in milliseconds\) between batches)                                                     | `integer`, `string` | Default: `200`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>Maximum: `999999`<br/>                                                                                                                               |          |
| **idle_streams_check_interval_ms**<br/>(Interval \(in milliseconds\) for checking new streams when the stream processor is idling)   | `integer`, `string` | Default: `1000`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>Maximum: `999999`<br/>                                                                                                                              |          |
| **busy_streams_check_interval_ms**<br/>(Interval \(in milliseconds\) for checking new streams when the stream processor is busy)     | `integer`, `string` | Default: `5000`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>Maximum: `999999`<br/>                                                                                                                              |          |
| **wait_enabled**<br/>(Checks if the data has been written to the replica shard)                                                      | `boolean`           | Default: `false`<br/>                                                                                                                                                                                            |          |
| **wait_timeout**<br/>(Timeout in milliseconds when checking write to the replica shard)                                              | `integer`, `string` | Default: `1000`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>                                                                                                                                                    |          |
| **retry_on_replica_failure**<br/>(Ensures that the data has been written to the replica shard and keeps retrying if not)             | `boolean`           | Default: `true`<br/>                                                                                                                                                                                             |          |

**Additional Properties:** not allowed  
<a name="targets"></a>

## targets: Target connections

**Properties**

| Name                                                          | Type     | Description | Required |
| ------------------------------------------------------------- | -------- | ----------- | -------- |
| [**connection**](#targetsconnection)<br/>(Connection details) | `object` |             |          |

<a name="targetsconnection"></a>

### targets\.connection: Connection details

**Properties (Pattern)**

| Name                     | Type | Description | Required |
| ------------------------ | ---- | ----------- | -------- |
| **\.\***                 |      |             |          |
| **additionalProperties** |      |             |          |
