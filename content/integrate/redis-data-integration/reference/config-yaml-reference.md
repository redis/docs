---
Title: Redis Data Integration configuration file
linkTitle: RDI configuration file
description: Redis Data Integration configuration file reference
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases:
---
# Redis Data Integration Configuration File

Configuration file for Redis Data Integration (RDI) source collectors and target connections.


**Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|[**sources**](#sources)<br/>(Source collectors)|`object`|Source collectors that capture changes from upstream databases. Each key is a unique source identifier; the value configures one collector.<br/>||
|[**targets**](#targets)<br/>(Target connections)|`object`|Target Redis databases where processed records are written. Each key is a target identifier; the value configures the connection.<br/>||
|[**processors**](#processors)<br/>(Data processing configuration)|`object`, `null`|Settings that control how data is processed, including batch sizes, error handling, and performance tuning.<br/>||
|[**secret\-providers**](#secret-providers)<br/>(Secret providers)|`object`|External secret providers used to resolve `${...}` references in the configuration.<br/>||
|[**metadata**](#metadata)<br/>(Pipeline metadata)|`object`|Optional metadata describing this pipeline, such as a display name and description.<br/>||

**Additional Properties:** not allowed  
<a name="sources"></a>
## sources: Source collectors

Source collectors that capture changes from upstream databases. Each key is a unique source identifier; the value configures one collector.


**Properties** (key: `.*`)

|Name|Type|Description|Required|
|----|----|-----------|--------|
|**connection**|||yes|
|**name**<br/>(Source name)|`string`|Human-readable name for the source collector. Maximum 100 characters.<br/>Maximal Length: `100`<br/>|no|
|**type**<br/>(Collector type)|`string`|Type of the source collector. Use `cdc` (default) for change data capture using [Debezium](https://debezium.io/). Use `riotx` for Snowflake CDC using [RIOT-X](https://redis.github.io/riotx/).<br/>Default: `"cdc"`<br/>Enum: `"cdc"`, `"riotx"`<br/>|yes|
|**active**<br/>(Collector enabled)|`boolean`|When `true`, the collector runs; when `false`, the collector is disabled and produces no events.<br/>Default: `true`<br/>|no|
|[**logging**](#sourceslogging)<br/>(Logging configuration)|`object`|Logging settings for this source collector.<br/>|no|
|[**tables**](#sourcestables)<br/>(Tables to capture)|`object`|Tables to capture from the source database, keyed by table name. The value configures column selection and key handling for that table.<br/>|no|
|[**schemas**](#sourcesschemas)<br/>(Schema names)|`string[]`|Schema names to capture from the source database. Maps to the underlying connector's `schema.include.list`.<br/>|no|
|[**databases**](#sourcesdatabases)<br/>(Database names)|`string[]`|Database names to capture from the source database. Maps to the underlying connector's `database.include.list`.<br/>|no|
|[**advanced**](#sourcesadvanced)<br/>(Advanced configuration)|`object`|Advanced configuration that overrides the underlying engine's defaults. Only required for non-standard tuning.<br/>|no|


<a name="sourceslogging"></a>
### sources\.logging: Logging configuration

Logging settings for this source collector.


**Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|**level**<br/>(Logging level)|`string`|Log verbosity for the source collector.<br/>Default: `"info"`<br/>Enum: `"trace"`, `"debug"`, `"info"`, `"warn"`, `"error"`<br/>||

**Additional Properties:** not allowed  
**Example**

```yaml
level: info

```

<a name="sourcestables"></a>
### sources\.tables: Tables to capture

Tables to capture from the source database, keyed by table name. The value configures column selection and key handling for that table.


**Additional Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|[**Additional Properties**](#sourcestablesadditionalproperties)|`object`, `null`|||

**Minimal Properties:** 1  
<a name="sourcestablesadditionalproperties"></a>
#### sources\.tables\.additionalProperties: object,null

**Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|**snapshot\_sql**|`string`|Custom SQL statement used during the initial snapshot, giving fine-grained control over the data captured.<br/>||
|[**columns**](#sourcestablesadditionalpropertiescolumns)<br/>(Columns to capture)|`string[]`|Specific columns to capture. When omitted, all columns are captured. Not supported for MongoDB connections.<br/>||
|[**exclude\_columns**](#sourcestablesadditionalpropertiesexclude_columns)<br/>(Columns to exclude)|`string[]`|Specific columns to exclude from capture. When omitted, no columns are excluded. Only supported for MongoDB connections.<br/>||
|[**keys**](#sourcestablesadditionalpropertieskeys)<br/>(Message keys)|`string[]`|Columns that together form a unique identifier for each row. Only required when the table lacks a primary key or unique constraint.<br/>||

**Additional Properties:** not allowed  
<a name="sourcestablesadditionalpropertiescolumns"></a>
##### sources\.tables\.additionalProperties\.columns\[\]: Columns to capture

Specific columns to capture. When omitted, all columns are captured. Not supported for MongoDB connections.


<a name="sourcestablesadditionalpropertiesexclude_columns"></a>
##### sources\.tables\.additionalProperties\.exclude\_columns\[\]: Columns to exclude

Specific columns to exclude from capture. When omitted, no columns are excluded. Only supported for MongoDB connections.


<a name="sourcestablesadditionalpropertieskeys"></a>
##### sources\.tables\.additionalProperties\.keys\[\]: Message keys

Columns that together form a unique identifier for each row. Only required when the table lacks a primary key or unique constraint.


<a name="sourcesschemas"></a>
### sources\.schemas\[\]: Schema names

Schema names to capture from the source database. Maps to the underlying connector's `schema.include.list`.


<a name="sourcesdatabases"></a>
### sources\.databases\[\]: Database names

Database names to capture from the source database. Maps to the underlying connector's `database.include.list`.


<a name="sourcesadvanced"></a>
### sources\.advanced: Advanced configuration

Advanced configuration that overrides the underlying engine's defaults. Only required for non-standard tuning.


**Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|[**sink**](#sourcesadvancedsink)<br/>(RDI Collector stream writer configuration)|`object`|Advanced configuration properties for the RDI Collector stream writer connection and behaviour. **Only applies to the `cdc` collector type.** See the full list of properties at [Debezium Server — Redis Stream sink](https://debezium.io/documentation/reference/stable/operations/debezium-server.html#_redis_stream). When using a property from that page, omit the `debezium.sink.` prefix.<br/>||
|[**source**](#sourcesadvancedsource)<br/>(Advanced source settings)|`object`|Advanced configuration properties for the source database connection and CDC behavior. **Only applies to the `cdc` collector type.** Available properties depend on the source database type — refer to the relevant Debezium connector documentation: [MySQL](https://debezium.io/documentation/reference/stable/connectors/mysql.html), [MariaDB](https://debezium.io/documentation/reference/stable/connectors/mariadb.html), [PostgreSQL](https://debezium.io/documentation/reference/stable/connectors/postgresql.html), [Oracle](https://debezium.io/documentation/reference/stable/connectors/oracle.html), [SQL Server](https://debezium.io/documentation/reference/stable/connectors/sqlserver.html), [Db2](https://debezium.io/documentation/reference/stable/connectors/db2.html), [MongoDB](https://debezium.io/documentation/reference/stable/connectors/mongodb.html). When using a property from those pages, omit the `debezium.source.` prefix.<br/>||
|[**quarkus**](#sourcesadvancedquarkus)<br/>(Quarkus runtime settings)|`object`|Advanced configuration properties for the Quarkus runtime that hosts Debezium Server. **Only applies to the `cdc` collector type.** See the [Debezium Server documentation](https://debezium.io/documentation/reference/stable/operations/debezium-server.html) for runtime configuration options. When using a property from that page, omit the `quarkus.` prefix.<br/>||
|[**resources**](#sourcesadvancedresources)<br/>(Collector resource settings)|`object`|Compute resources allocated to the collector. **Only applies to the `cdc` collector type.**<br/>||
|[**riotx**](#sourcesadvancedriotx)<br/>(Advanced RIOT\-X settings)|`object`|Advanced configuration properties for the RIOT-X Snowflake collector. **Only applies to the `riotx` collector type.**<br/>||
|**java\_options**<br/>(Advanced Java options)|`string`|These Java options will be passed to the command line command when launching the source collector. **Only applies to the `cdc` collector type.**<br/>||

**Additional Properties:** not allowed  
**Minimal Properties:** 1  
**Example**

```yaml
sink: {}
source: {}
quarkus: {}
resources: {}
riotx:
  poll: 30s
  snapshot: INITIAL
  streamPrefix: 'data:'
  clearOffset: false
  count: 0

```

<a name="sourcesadvancedsink"></a>
#### sources\.advanced\.sink: RDI Collector stream writer configuration

Advanced configuration properties for the RDI Collector stream writer connection and behaviour. **Only applies to the `cdc` collector type.** See the full list of properties at [Debezium Server — Redis Stream sink](https://debezium.io/documentation/reference/stable/operations/debezium-server.html#_redis_stream). When using a property from that page, omit the `debezium.sink.` prefix.


**Additional Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|**Additional Properties**|`string`, `number`, `boolean`|||

**Minimal Properties:** 1  
<a name="sourcesadvancedsource"></a>
#### sources\.advanced\.source: Advanced source settings

Advanced configuration properties for the source database connection and CDC behavior. **Only applies to the `cdc` collector type.** Available properties depend on the source database type — refer to the relevant Debezium connector documentation: [MySQL](https://debezium.io/documentation/reference/stable/connectors/mysql.html), [MariaDB](https://debezium.io/documentation/reference/stable/connectors/mariadb.html), [PostgreSQL](https://debezium.io/documentation/reference/stable/connectors/postgresql.html), [Oracle](https://debezium.io/documentation/reference/stable/connectors/oracle.html), [SQL Server](https://debezium.io/documentation/reference/stable/connectors/sqlserver.html), [Db2](https://debezium.io/documentation/reference/stable/connectors/db2.html), [MongoDB](https://debezium.io/documentation/reference/stable/connectors/mongodb.html). When using a property from those pages, omit the `debezium.source.` prefix.


**Additional Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|**Additional Properties**|`string`, `number`, `boolean`|||

**Minimal Properties:** 1  
<a name="sourcesadvancedquarkus"></a>
#### sources\.advanced\.quarkus: Quarkus runtime settings

Advanced configuration properties for the Quarkus runtime that hosts Debezium Server. **Only applies to the `cdc` collector type.** See the [Debezium Server documentation](https://debezium.io/documentation/reference/stable/operations/debezium-server.html) for runtime configuration options. When using a property from that page, omit the `quarkus.` prefix.


**Additional Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|**Additional Properties**|`string`, `number`, `boolean`|||

**Minimal Properties:** 1  
<a name="sourcesadvancedresources"></a>
#### sources\.advanced\.resources: Collector resource settings

Compute resources allocated to the collector. **Only applies to the `cdc` collector type.**


**Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|**cpu**<br/>(CPU resource value)|`string`|CPU request for the collector container, for example `1` or `500m`.<br/>||
|**memory**<br/>(Memory resource value)|`string`|Memory request for the collector container, for example `1024Mi` or `2Gi`.<br/>||

**Additional Properties:** not allowed  
**Minimal Properties:** 1  
<a name="sourcesadvancedriotx"></a>
#### sources\.advanced\.riotx: Advanced RIOT\-X settings

Advanced configuration properties for the RIOT-X Snowflake collector. **Only applies to the `riotx` collector type.**


**Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|**poll**<br/>(Polling interval)|`string`|Interval between polls for new stream changes, for example `30s` or `PT30S`.<br/>Default: `"30s"`<br/>||
|**snapshot**<br/>(Snapshot mode)|`string`|Initial-load behavior. `INITIAL` performs a one-time snapshot before streaming; `NEVER` skips the snapshot.<br/>Default: `"INITIAL"`<br/>Enum: `"INITIAL"`, `"NEVER"`<br/>||
|**streamPrefix**<br/>(Redis stream key prefix)|`string`|Prefix used when constructing Redis stream keys, for example `data:`.<br/>Default: `"data:"`<br/>||
|**streamLimit**<br/>(Maximum stream length)|`integer`|Maximum number of entries kept in each Redis stream before older entries are trimmed.<br/>Minimum: `1`<br/>||
|[**keyColumns**](#sourcesadvancedriotxkeycolumns)<br/>(Key columns)|`string[]`|Columns whose values form the unique message key for each row.<br/>||
|**clearOffset**<br/>(Clear existing offset)|`boolean`|When `true`, the stored offset is cleared on startup, forcing a fresh read.<br/>Default: `false`<br/>||
|**count**<br/>(Record count limit)|`integer`|Maximum number of records to process. Set to `0` for unlimited.<br/>Default: `0`<br/>Minimum: `0`<br/>||

**Additional Properties:** not allowed  
**Minimal Properties:** 1  
**Example**

```yaml
poll: 30s
snapshot: INITIAL
streamPrefix: 'data:'
clearOffset: false
count: 0

```

<a name="sourcesadvancedriotxkeycolumns"></a>
##### sources\.advanced\.riotx\.keyColumns\[\]: Key columns

Columns whose values form the unique message key for each row.


<a name="targets"></a>
## targets: Target connections

Target Redis databases where processed records are written. Each key is a target identifier; the value configures the connection.


**Properties** (key: `.*`)

|Name|Type|Description|Required|
|----|----|-----------|--------|
|[**connection**](#targetsconnection)<br/>(Database connection)|`object`|Connection configuration for a Redis database.<br/>|yes|
|**name**<br/>(Target name)|`string`|Human-readable name for the target connection. Maximum 100 characters.<br/>Maximal Length: `100`<br/>|no|


<a name="targetsconnection"></a>
### targets\.connection: Database connection

Connection configuration for a Redis database.


**Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|**type**<br/>(Database type)||Database type identifier. Always `redis` for this connection.<br/>Constant Value: `"redis"`<br/>|yes|
|**host**<br/>(Database host)|`string`|Hostname or IP address of the Redis server.<br/>|yes|
|**port**<br/>(Database port)||Network port on which the Redis server is listening.<br/>|yes|
|**user**<br/>(Database user)|`string`|Username for authentication to the Redis database.<br/>|no|
|**password**<br/>(Database password)|`string`|Password for authentication to the Redis database.<br/>|no|
|**key**<br/>(Private key file)|`string`|Path to the private key file used for SSL/TLS client authentication.<br/>|no|
|**key\_password**<br/>(Private key password)|`string`|Password used to decrypt the private key file.<br/>|no|
|**cert**<br/>(Client certificate)|`string`|Path to the client certificate file used for SSL/TLS client authentication.<br/>|no|
|**cacert**<br/>(CA certificate)|`string`|Path to the Certificate Authority (CA) certificate file used to verify the server's TLS certificate.<br/>|no|

**Additional Properties:** not allowed  
**Minimal Properties:** 3  
**If property *key* is defined**, property/ies *cert* is/are required.  
**If property *cert* is defined**, property/ies *key* is/are required.  
**If property *key_password* is defined**, property/ies *key* is/are required.  
<a name="processors"></a>
## processors: Data processing configuration

Settings that control how data is processed, including batch sizes, error handling, and performance tuning.


**Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|**type**<br/>(Processor type)|`string`|Processor implementation to run. `classic` runs the classic processor; `flink` runs the Apache Flink-based processor (Kubernetes deployments only).<br/>Default: `"classic"`<br/>Enum: `"classic"`, `"flink"`<br/>||
|**read\_batch\_size**|`integer`, `string`|Maximum number of records read from the source streams in a single batch.<br/>Default: `2000`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>||
|**read\_batch\_timeout\_ms**<br/>(Read batch timeout)|`integer`|Maximum time in milliseconds to wait for a batch to fill before processing it.<br/>Default: `100`<br/>Minimum: `1`<br/>||
|**duration**<br/>(Batch duration limit)|`integer`, `string`|(DEPRECATED)<br/>This property has no effect; use `read_batch_timeout_ms` instead.<br/>Default: `100`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>||
|**write\_batch\_size**|`integer`, `string`|Maximum number of records written to the target Redis database in a single batch.<br/>Default: `200`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>||
|**enable\_async\_processing**|`boolean`|When `true`, the processor handles batches asynchronously to improve throughput. **Classic processor only.**<br/>Default: `true`<br/>||
|**batch\_queue\_size**|`integer`|Maximum number of batches queued for processing. **Classic processor only.**<br/>Default: `3`<br/>Minimum: `1`<br/>||
|**ack\_queue\_size**|`integer`|Maximum number of batches queued for asynchronous acknowledgement. **Classic processor only.**<br/>Default: `10`<br/>Minimum: `1`<br/>||
|**dedup**<br/>(Enable deduplication)|`boolean`|When `true`, the processor deduplicates incoming records. **Classic processor only.**<br/>Default: `false`<br/>||
|**dedup\_max\_size**<br/>(Deduplication set size)|`integer`|Maximum number of entries kept in the deduplication set. **Classic processor only.**<br/>Default: `1024`<br/>Minimum: `1`<br/>||
|**dedup\_strategy**<br/>(Deduplication strategy)|`string`|(DEPRECATED)<br/>This property has no effect — the only supported strategy is `ignore`. Remove it from the configuration. **Classic processor only.**<br/>Default: `"ignore"`<br/>Enum: `"reject"`, `"ignore"`<br/>||
|**error\_handling**<br/>(Error handling strategy)|`string`|Strategy for handling failed records. `ignore` silently drops them; `dlq` writes them to the dead-letter queue.<br/>Default: `"dlq"`<br/>Pattern: `^\${.*}$\|ignore\|dlq`<br/>||
|**dlq\_max\_messages**<br/>(DLQ message limit)|`integer`, `string`|Maximum number of messages stored per dead-letter queue stream.<br/>Default: `1000`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>||
|**target\_data\_type**<br/>(Target Redis data type)|`string`|Data type used to store target records in Redis. `hash` writes a Redis Hash; `json` writes a RedisJSON document and requires the RedisJSON module.<br/>Default: `"hash"`<br/>Pattern: `^\${.*}$\|hash\|json`<br/>||
|**json\_update\_strategy**|`string`|Strategy for updating existing JSON documents in Redis. `replace` overwrites the entire document; `merge` merges incoming fields into it.<br/>Default: `"replace"`<br/>Pattern: `^\${.*}$\|replace\|merge`<br/>||
|**use\_native\_json\_merge**<br/>(Use native JSON merge from RedisJSON module)|`boolean`|Controls whether JSON merge operations use the native `JSON.MERGE` command (when `true`) or Lua scripts (when `false`). Introduced in RDI 1.15.0. The native command provides 2x performance improvement but handles null values differently:<br/><br/>**Previous behavior (Lua merge)**: When merging `{"field1": "value1", "field2": "value2"}` with `{"field2": null, "field3": "value3"}`, the result was `{"field1": "value1", "field2": null, "field3": "value3"}` (null value is preserved).<br/><br/>**New behavior (JSON.MERGE)**: The same merge produces `{"field1": "value1", "field3": "value3"}` (null value removes the field, following [RFC 7396](https://datatracker.ietf.org/doc/html/rfc7396)).<br/><br/>**Note**: The native `JSON.MERGE` command requires RedisJSON 2.6.0 or higher. If the target database has an older version of RedisJSON, RDI automatically falls back to Lua-based merge operations regardless of this setting.<br/><br/>**Impact**: If your application logic distinguishes between a field with a `null` value and a missing field, you may need to adjust your data handling. This follows the JSON Merge Patch RFC standard but differs from the previous Lua implementation. Set to `false` to revert to the previous Lua-based merge behavior if needed.<br/><br/>The Flink processor always uses the native `JSON.MERGE` command when the target database supports it. **Classic processor only.**<br/>Default: `true`<br/>||
|**initial\_sync\_processes**|`integer`, `string`|Number of parallel processes used to perform the initial data synchronization. For the Flink processor, parallelism is controlled by Flink properties instead. **Classic processor only.**<br/>Default: `4`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>Maximum: `32`<br/>||
|**idle\_sleep\_time\_ms**<br/>(Idle sleep interval)|`integer`, `string`|Time in milliseconds to sleep between processing batches when idle. **Classic processor only.**<br/>Default: `200`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>Maximum: `999999`<br/>||
|**idle\_streams\_check\_interval\_ms**<br/>(Idle streams check interval)|`integer`, `string`|Time in milliseconds between checks for new streams when the processor is idle. For the Flink processor, use `processors.advanced.source.discovery.interval.ms` instead to configure a single discovery interval regardless of load. **Classic processor only.**<br/>Default: `1000`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>Maximum: `999999`<br/>||
|**busy\_streams\_check\_interval\_ms**<br/>(Busy streams check interval)|`integer`, `string`|Time in milliseconds between checks for new streams when the processor is busy. For the Flink processor, use `processors.advanced.source.discovery.interval.ms` instead to configure a single discovery interval regardless of load. **Classic processor only.**<br/>Default: `5000`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>Maximum: `999999`<br/>||
|**retry\_max\_attempts**<br/>(Maximum retry attempts)|`integer`, `string`|Maximum number of attempts for a failed write to the target Redis database before giving up.<br/>Default: `5`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>||
|**retry\_initial\_delay\_ms**<br/>(Initial retry delay)|`integer`, `string`|Initial delay in milliseconds before the first retry of a failed write.<br/>Default: `1000`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>Maximum: `999999`<br/>||
|**retry\_max\_delay\_ms**<br/>(Maximum retry delay)|`integer`, `string`|Maximum delay in milliseconds between retry attempts.<br/>Default: `10000`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>Maximum: `999999`<br/>||
|**wait\_enabled**<br/>(Enable replica wait)|`boolean`|When `true`, RDI verifies that each write has been replicated to the target database's replica shards before acknowledging it.<br/>Default: `false`<br/>||
|**wait\_timeout**<br/>(Replica wait timeout)|`integer`, `string`|Maximum time in milliseconds to wait for replica write verification on the target database.<br/>Default: `1000`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>||
|**retry\_on\_replica\_failure**|`boolean`|When `true`, RDI keeps retrying a write until replica replication is confirmed; when `false`, it gives up after the first failure.<br/>Default: `true`<br/>||
|**on\_failed\_retry\_interval**<br/>(Retry interval on failure)|`integer`, `string`|(DEPRECATED)<br/>This property has no effect; remove it from the configuration.<br/>Default: `5`<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>||
|[**logging**](#processorslogging)<br/>(Logging configuration)|`object`|Logging settings for the processor. **Flink processor only.**<br/>||
|[**advanced**](#processorsadvanced)<br/>(Advanced configuration)|`object`|Advanced configuration for fine-tuning the processor. **All properties under `advanced` apply to the Flink processor only and are silently ignored by the classic processor.**<br/>||

**Additional Properties:** not allowed  
<a name="processorslogging"></a>
### processors\.logging: Logging configuration

Logging settings for the processor. **Flink processor only.**


**Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|**level**<br/>(Logging level)|`string`|Log verbosity for the processor.<br/>Default: `"info"`<br/>Enum: `"trace"`, `"debug"`, `"info"`, `"warn"`, `"error"`<br/>||

**Additional Properties:** not allowed  
**Example**

```yaml
level: info

```

<a name="processorsadvanced"></a>
### processors\.advanced: Advanced configuration

Advanced configuration for fine-tuning the processor. **All properties under `advanced` apply to the Flink processor only and are silently ignored by the classic processor.**


**Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|[**source**](#processorsadvancedsource)<br/>(Advanced source settings)|`object`|Advanced configuration properties for the source Redis client and streams reader. **Flink processor only.**<br/>||
|[**target**](#processorsadvancedtarget)<br/>(Advanced target settings)|`object`|Advanced configuration properties for the target Redis client and sink. **Flink processor only.**<br/>||
|[**dlq**](#processorsadvanceddlq)<br/>(Advanced DLQ settings)|`object`|Advanced configuration properties for the DLQ Redis client and sink. **Flink processor only.**<br/>||
|[**processor**](#processorsadvancedprocessor)<br/>(Advanced processor settings)|`object`|Advanced configuration properties for the processor. **Flink processor only.**<br/>||
|[**flink**](#processorsadvancedflink)<br/>(Advanced Flink settings)|`object`|Advanced configuration properties forwarded to the underlying Flink runtime. Any property listed in the [Flink configuration documentation](https://nightlies.apache.org/flink/flink-docs-release-2.0/docs/deployment/config/) can be set here and will override the RDI default. **Flink processor only.**<br/>||
|[**resources**](#processorsadvancedresources)<br/>(Advanced resource settings)|`object`|Compute resources allocated to the Flink job, such as the number of task manager pods. **Flink processor only.**<br/>||

**Additional Properties:** not allowed  
**Minimal Properties:** 1  
**Example**

```yaml
source:
  stream.name.pattern: data:*
  discovery.interval.ms: 1000
  batch.size: 2000
  batch.timeout.ms: 100
  connection.timeout.ms: 2000
  socket.timeout.ms: 2000
  retry.max.attempts: 5
  retry.initial.delay.ms: 100
  retry.max.delay.ms: 3000
  retry.backoff.multiplier: 2
target:
  batch.size: 200
  flush.interval.ms: 100
  connection.timeout.ms: 2000
  socket.timeout.ms: 2000
  retry.max.attempts: 5
  retry.initial.delay.ms: 1000
  retry.max.delay.ms: 10000
  retry.backoff.multiplier: 2
  wait.enabled: false
  wait.write.timeout.ms: 1000
  wait.retry.enabled: true
  wait.retry.delay.ms: 1000
dlq:
  max.len: 1000
  batch.size: 100
  flush.interval.ms: 100
  connection.timeout.ms: 2000
  socket.timeout.ms: 2000
  retry.max.attempts: 1
  retry.initial.delay.ms: 100
  retry.max.delay.ms: 3000
  retry.backoff.multiplier: 2
  wait.enabled: false
  wait.write.timeout.ms: 1000
  wait.retry.enabled: false
  wait.retry.delay.ms: 1000
processor:
  default.data.type: hash
  default.json.update.strategy: replace
  dlq.enabled: true
flink:
  taskmanager.numberOfTaskSlots: 1
  taskmanager.memory.process.size: 2048m
resources:
  taskManager: {}

```

<a name="processorsadvancedsource"></a>
#### processors\.advanced\.source: Advanced source settings

Advanced configuration properties for the source Redis client and streams reader. **Flink processor only.**


**Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|**stream\.name\.pattern**<br/>(Source stream name pattern)|`string`|Glob pattern used to discover input streams in the source Redis database, for example `data:*`.<br/>Default: `"data:*"`<br/>||
|**discovery\.interval\.ms**<br/>(Stream discovery interval)|`integer`|Time in milliseconds between checks for new input streams. Replaces the classic `processors.idle_streams_check_interval_ms` and `processors.busy_streams_check_interval_ms` properties.<br/>Default: `1000`<br/>Minimum: `0`<br/>||
|**batch\.size**<br/>(Source batch size)|`integer`|Maximum number of records the source operator reads in a single batch. Alias for `processors.read_batch_size`; takes priority when both are set.<br/>Default: `2000`<br/>Minimum: `1`<br/>||
|**batch\.timeout\.ms**<br/>(Source batch timeout)|`integer`|Maximum time in milliseconds to wait for a source batch to fill before processing. Alias for `processors.read_batch_timeout_ms`; takes priority when both are set.<br/>Default: `100`<br/>Minimum: `1`<br/>||
|**connection\.timeout\.ms**<br/>(Source connection timeout)|`integer`|Connection timeout in milliseconds for the source Redis client.<br/>Default: `2000`<br/>Minimum: `1`<br/>||
|**socket\.timeout\.ms**<br/>(Source socket timeout)|`integer`|Socket read/write timeout in milliseconds for the source Redis client.<br/>Default: `2000`<br/>Minimum: `1`<br/>||
|**retry\.max\.attempts**<br/>(Source retry max attempts)|`integer`|Maximum number of retry attempts for failed source Redis operations.<br/>Default: `5`<br/>Minimum: `1`<br/>||
|**retry\.initial\.delay\.ms**<br/>(Source retry initial delay)|`integer`|Initial delay in milliseconds before the first retry of a failed source Redis operation.<br/>Default: `100`<br/>Minimum: `1`<br/>||
|**retry\.max\.delay\.ms**<br/>(Source retry max delay)|`integer`|Maximum delay in milliseconds between retry attempts for source Redis operations.<br/>Default: `3000`<br/>Minimum: `1`<br/>||
|**retry\.backoff\.multiplier**<br/>(Source retry backoff multiplier)|`number`|Exponential backoff multiplier between retry attempts for source Redis operations.<br/>Default: `2`<br/>Minimum: `1`<br/>||

**Additional Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|**Additional Properties**|`string`, `number`, `boolean`|||

**Minimal Properties:** 1  
**Example**

```yaml
stream.name.pattern: data:*
discovery.interval.ms: 1000
batch.size: 2000
batch.timeout.ms: 100
connection.timeout.ms: 2000
socket.timeout.ms: 2000
retry.max.attempts: 5
retry.initial.delay.ms: 100
retry.max.delay.ms: 3000
retry.backoff.multiplier: 2

```

<a name="processorsadvancedtarget"></a>
#### processors\.advanced\.target: Advanced target settings

Advanced configuration properties for the target Redis client and sink. **Flink processor only.**


**Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|**batch\.size**<br/>(Target sink batch size)|`integer`|Maximum number of records the target sink writes in a single batch. Alias for `processors.write_batch_size`; takes priority when both are set.<br/>Default: `200`<br/>Minimum: `1`<br/>||
|**flush\.interval\.ms**<br/>(Target sink flush interval)|`integer`|Maximum time in milliseconds the target sink waits to fill a batch before flushing it to Redis.<br/>Default: `100`<br/>Minimum: `1`<br/>||
|**connection\.timeout\.ms**<br/>(Target connection timeout)|`integer`|Connection timeout in milliseconds for the target Redis client.<br/>Default: `2000`<br/>Minimum: `1`<br/>||
|**socket\.timeout\.ms**<br/>(Target socket timeout)|`integer`|Socket read/write timeout in milliseconds for the target Redis client.<br/>Default: `2000`<br/>Minimum: `1`<br/>||
|**retry\.max\.attempts**<br/>(Target retry max attempts)|`integer`|Maximum number of retry attempts for failed target Redis operations. Alias for `processors.retry_max_attempts`; takes priority when both are set.<br/>Default: `5`<br/>Minimum: `1`<br/>||
|**retry\.initial\.delay\.ms**<br/>(Target retry initial delay)|`integer`|Initial delay in milliseconds before the first retry of a failed target Redis operation. Alias for `processors.retry_initial_delay_ms`; takes priority when both are set.<br/>Default: `1000`<br/>Minimum: `1`<br/>||
|**retry\.max\.delay\.ms**<br/>(Target retry max delay)|`integer`|Maximum delay in milliseconds between retry attempts for target Redis operations. Alias for `processors.retry_max_delay_ms`; takes priority when both are set.<br/>Default: `10000`<br/>Minimum: `1`<br/>||
|**retry\.backoff\.multiplier**<br/>(Target retry backoff multiplier)|`number`|Exponential backoff multiplier between retry attempts for target Redis operations.<br/>Default: `2`<br/>Minimum: `1`<br/>||
|**wait\.enabled**<br/>(Target replica wait enabled)|`boolean`|When `true`, RDI verifies that each write has been replicated to the target database's replica shards before acknowledging it. Alias for `processors.wait_enabled`; takes priority when both are set.<br/>Default: `false`<br/>||
|**wait\.write\.timeout\.ms**<br/>(Target replica wait timeout)|`integer`|Maximum time in milliseconds to wait for target replica write verification. Alias for `processors.wait_timeout`; takes priority when both are set.<br/>Default: `1000`<br/>Minimum: `1`<br/>||
|**wait\.retry\.enabled**<br/>(Target replica wait retry enabled)|`boolean`|When `true`, RDI keeps retrying a target write until replica replication is confirmed; when `false`, it gives up after the first failure. Alias for `processors.retry_on_replica_failure`; takes priority when both are set. When enabled, the Flink processor retries indefinitely until the checkpoint timeout, unlike the classic processor which retries once.<br/>Default: `true`<br/>||
|**wait\.retry\.delay\.ms**<br/>(Target replica wait retry delay)|`integer`|Delay in milliseconds between target replica wait retry attempts.<br/>Default: `1000`<br/>Minimum: `1`<br/>||

**Additional Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|**Additional Properties**|`string`, `number`, `boolean`|||

**Minimal Properties:** 1  
**Example**

```yaml
batch.size: 200
flush.interval.ms: 100
connection.timeout.ms: 2000
socket.timeout.ms: 2000
retry.max.attempts: 5
retry.initial.delay.ms: 1000
retry.max.delay.ms: 10000
retry.backoff.multiplier: 2
wait.enabled: false
wait.write.timeout.ms: 1000
wait.retry.enabled: true
wait.retry.delay.ms: 1000

```

<a name="processorsadvanceddlq"></a>
#### processors\.advanced\.dlq: Advanced DLQ settings

Advanced configuration properties for the DLQ Redis client and sink. **Flink processor only.**


**Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|**max\.len**<br/>(DLQ sink max length)|`integer`|Maximum number of messages stored per dead letter queue stream. Alias for `processors.dlq_max_messages`; takes priority when both are set.<br/>Default: `1000`<br/>Minimum: `1`<br/>||
|**batch\.size**<br/>(DLQ sink batch size)|`integer`|Maximum number of records the DLQ sink writes in a single batch.<br/>Default: `100`<br/>Minimum: `1`<br/>||
|**flush\.interval\.ms**<br/>(DLQ sink flush interval)|`integer`|Maximum time in milliseconds the DLQ sink waits to fill a batch before flushing it to Redis.<br/>Default: `100`<br/>Minimum: `1`<br/>||
|**connection\.timeout\.ms**<br/>(DLQ connection timeout)|`integer`|Connection timeout in milliseconds for the DLQ Redis client.<br/>Default: `2000`<br/>Minimum: `1`<br/>||
|**socket\.timeout\.ms**<br/>(DLQ socket timeout)|`integer`|Socket read/write timeout in milliseconds for the DLQ Redis client.<br/>Default: `2000`<br/>Minimum: `1`<br/>||
|**retry\.max\.attempts**<br/>(DLQ retry max attempts)|`integer`|Maximum number of retry attempts for failed DLQ Redis operations.<br/>Default: `1`<br/>Minimum: `1`<br/>||
|**retry\.initial\.delay\.ms**<br/>(DLQ retry initial delay)|`integer`|Initial delay in milliseconds before the first retry of a failed DLQ Redis operation.<br/>Default: `100`<br/>Minimum: `1`<br/>||
|**retry\.max\.delay\.ms**<br/>(DLQ retry max delay)|`integer`|Maximum delay in milliseconds between retry attempts for DLQ Redis operations.<br/>Default: `3000`<br/>Minimum: `1`<br/>||
|**retry\.backoff\.multiplier**<br/>(DLQ retry backoff multiplier)|`number`|Exponential backoff multiplier between retry attempts for DLQ Redis operations.<br/>Default: `2`<br/>Minimum: `1`<br/>||
|**wait\.enabled**<br/>(DLQ replica wait enabled)|`boolean`|When `true`, RDI verifies that each DLQ write has been replicated to the DLQ database's replica shards before acknowledging it.<br/>Default: `false`<br/>||
|**wait\.write\.timeout\.ms**<br/>(DLQ replica wait timeout)|`integer`|Maximum time in milliseconds to wait for DLQ replica write verification.<br/>Default: `1000`<br/>Minimum: `1`<br/>||
|**wait\.retry\.enabled**<br/>(DLQ replica wait retry enabled)|`boolean`|When `true`, RDI keeps retrying a DLQ write until replica replication is confirmed; when `false`, it gives up after the first failure.<br/>Default: `false`<br/>||
|**wait\.retry\.delay\.ms**<br/>(DLQ replica wait retry delay)|`integer`|Delay in milliseconds between DLQ replica wait retry attempts.<br/>Default: `1000`<br/>Minimum: `1`<br/>||

**Additional Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|**Additional Properties**|`string`, `number`, `boolean`|||

**Minimal Properties:** 1  
**Example**

```yaml
max.len: 1000
batch.size: 100
flush.interval.ms: 100
connection.timeout.ms: 2000
socket.timeout.ms: 2000
retry.max.attempts: 1
retry.initial.delay.ms: 100
retry.max.delay.ms: 3000
retry.backoff.multiplier: 2
wait.enabled: false
wait.write.timeout.ms: 1000
wait.retry.enabled: false
wait.retry.delay.ms: 1000

```

<a name="processorsadvancedprocessor"></a>
#### processors\.advanced\.processor: Advanced processor settings

Advanced configuration properties for the processor. **Flink processor only.**


**Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|**default\.data\.type**<br/>(Default target data type)|`string`|Data type to use in Redis when not overridden per job: `hash` for Redis Hash, `json` for RedisJSON. Alias for `processors.target_data_type`; takes priority when both are set.<br/>Default: `"hash"`<br/>Enum: `"hash"`, `"json"`<br/>||
|**default\.json\.update\.strategy**<br/>(Default JSON update strategy)|`string`|Strategy for updating JSON data in Redis: `replace` to overwrite the entire JSON object, `merge` to merge new data with the existing JSON object. Alias for `processors.json_update_strategy`; takes priority when both are set.<br/>Default: `"replace"`<br/>Enum: `"replace"`, `"merge"`<br/>||
|**dlq\.enabled**<br/>(Enable DLQ)|`boolean`|When `true`, rejected messages are stored in the dead-letter queue; when `false`, errors are silently skipped. Alias for `processors.error_handling`; takes priority when both are set.<br/>Default: `true`<br/>||
|**log\.level**<br/>(Processor log level)|`string`|Log level for the processor. Takes priority over `processors.logging.level` when both are set.<br/>Enum: `"trace"`, `"debug"`, `"info"`, `"warn"`, `"error"`<br/>||

**Additional Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|**Additional Properties**|`string`, `number`, `boolean`|||

**Minimal Properties:** 1  
**Example**

```yaml
default.data.type: hash
default.json.update.strategy: replace
dlq.enabled: true

```

<a name="processorsadvancedflink"></a>
#### processors\.advanced\.flink: Advanced Flink settings

Advanced configuration properties forwarded to the underlying Flink runtime. Any property listed in the [Flink configuration documentation](https://nightlies.apache.org/flink/flink-docs-release-2.0/docs/deployment/config/) can be set here and will override the RDI default. **Flink processor only.**<br/><br/>The properties listed below are the ones most likely to require adjustment. **Changing any other Flink property is not recommended unless instructed by Redis support.**


**Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|**parallelism\.default**<br/>(Default parallelism)|`integer`|Default parallelism for jobs and operators. When unset, Flink uses the number of available task slots across all task managers (`taskManager.replicas × taskmanager.numberOfTaskSlots`). Increase to fan out work across more task slots; see [parallel execution](https://nightlies.apache.org/flink/flink-docs-release-2.0/docs/dev/datastream/execution/parallel/).<br/>Minimum: `1`<br/>||
|**taskmanager\.numberOfTaskSlots**<br/>(Task slots per task manager)|`integer`|Number of parallel task slots per task manager pod. Each slot can run one parallel pipeline instance, so this caps the parallelism a single task manager can absorb. See [task slots and resources](https://nightlies.apache.org/flink/flink-docs-release-2.0/docs/concepts/flink-architecture/#task-slots-and-resources).<br/>Default: `1`<br/>Minimum: `1`<br/>||
|**taskmanager\.memory\.process\.size**<br/>(Task manager process memory)|`string`|Total memory budget for each task manager JVM process (heap + managed + network + metaspace + JVM overhead), expressed with a unit suffix such as `2048m` or `4g`. See [task manager memory configuration](https://nightlies.apache.org/flink/flink-docs-release-2.0/docs/deployment/memory/mem_setup_tm/).<br/>Default: `"2048m"`<br/>||

**Additional Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|**Additional Properties**|`string`, `number`, `boolean`|||

**Minimal Properties:** 1  
**Example**

```yaml
taskmanager.numberOfTaskSlots: 1
taskmanager.memory.process.size: 2048m

```

<a name="processorsadvancedresources"></a>
#### processors\.advanced\.resources: Advanced resource settings

Compute resources allocated to the Flink job, such as the number of task manager pods. **Flink processor only.**


**Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|[**taskManager**](#processorsadvancedresourcestaskmanager)<br/>(Task manager resource settings)|`object`|Resource settings for Flink task manager pods.<br/>||

**Additional Properties:** not allowed  
**Minimal Properties:** 1  
**Example**

```yaml
taskManager: {}

```

<a name="processorsadvancedresourcestaskmanager"></a>
##### processors\.advanced\.resources\.taskManager: Task manager resource settings

Resource settings for Flink task manager pods.


**Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|**replicas**<br/>(Task manager replicas)|`integer`|Number of Flink task manager pods to run.<br/>Minimum: `1`<br/>||

**Additional Properties:** not allowed  
**Minimal Properties:** 1  
<a name="secret-providers"></a>
## secret\-providers: Secret providers

External secret providers used to resolve `${...}` references in the configuration.


**Properties** (key: `.*`)

|Name|Type|Description|Required|
|----|----|-----------|--------|
|**type**<br/>(Provider type)|`string`|Secret provider backend. `aws` uses AWS Secrets Manager; `vault` uses HashiCorp Vault.<br/>Enum: `"aws"`, `"vault"`<br/>|yes|
|[**parameters**](#secret-providersparameters)<br/>(Provider parameters)|`object`|Configuration parameters for the secret provider.<br/>|yes|


<a name="secret-providersparameters"></a>
### secret\-providers\.parameters: Provider parameters

Configuration parameters for the secret provider.


**Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|[**objects**](#secret-providersparametersobjects)<br/>(Secrets objects array)|`object[]`|Secret objects to fetch from the provider.<br/>|yes|

**Example**

```yaml
objects:
  - {}

```

<a name="secret-providersparametersobjects"></a>
#### secret\-providers\.parameters\.objects\[\]: Secrets objects array

Secret objects to fetch from the provider.


**Items: Secret object**

**No properties.**

**Example**

```yaml
- {}

```

<a name="metadata"></a>
## metadata: Pipeline metadata

Optional metadata describing this pipeline, such as a display name and description.


**Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|**name**<br/>(Pipeline name)|`string`|Human-readable name for the pipeline. Maximum 100 characters.<br/>Maximal Length: `100`<br/>||
|**description**<br/>(Pipeline description)|`string`|Free-form description of what the pipeline does. Maximum 500 characters.<br/>Maximal Length: `500`<br/>||

**Additional Properties:** not allowed  

