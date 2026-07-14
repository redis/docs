---
Title: Redis Data Integration configuration file
linkTitle: RDI configuration file
description: Redis Data Integration configuration file reference
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases:
---

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
|[**connection**](#sourcesconnection)<br/>(Source database connection)|`object`|Connection configuration for a non-Redis source database. The exact set of properties depends on the database type.<br/>|yes|
|**name**<br/>(Source name)|`string`|Human-readable name for the source collector. Maximum 100 characters.<br/>Maximal Length: `100`<br/>|no|
|**type**<br/>(Collector type)|`string`|Type of the source collector. Use `cdc` (default) for change data capture using [Debezium](https://debezium.io/). Use `flink` for Spanner change streams using the Apache Flink-based collector. Use `riotx` for Snowflake CDC using [RIOT-X](https://redis.github.io/riotx/).<br/>Default: `"cdc"`<br/>Enum: `"cdc"`, `"flink"`, `"riotx"`<br/>|yes|
|**active**<br/>(Collector enabled)|`boolean`|When `true`, the collector runs; when `false`, the collector is disabled and produces no events.<br/>Default: `true`<br/>|no|
|[**logging**](#sourceslogging)<br/>(Logging configuration)|`object`|Logging settings for this source collector.<br/>|no|
|[**tables**](#sourcestables)<br/>(Tables to capture)|`object`|Tables to capture from the source database, keyed by table name. The value configures column selection and key handling for that table.<br/>|no|
|[**schemas**](#sourcesschemas)<br/>(Schema names)|`string[]`|Schema names to capture from the source database. Maps to the underlying connector's `schema.include.list`.<br/>|no|
|[**databases**](#sourcesdatabases)<br/>(Database names)|`string[]`|Database names to capture from the source database. Maps to the underlying connector's `database.include.list`.<br/>|no|
|[**advanced**](#sourcesadvanced)<br/>(Advanced configuration)|`object`|Advanced configuration that overrides the underlying engine's defaults. Only required for non-standard tuning.<br/>|no|


<a name="sourcesconnection"></a>
### sources\.connection: Source database connection

Connection configuration for a non-Redis source database. The exact set of properties depends on the database type.


**Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|[**SQL database**](#sourcesconnectionsqldatabase)<br/>(SQL database)|`object`|Connection configuration for a supported SQL database.<br/>||
|[**MongoDB**](#sourcesconnectionmongodb)|`object`|Connection configuration for a MongoDB database.<br/>|yes|
|[**Spanner**](#sourcesconnectionspanner)|`object`|Connection configuration for a Google Cloud Spanner database.<br/>|yes|
|[**Snowflake**](#sourcesconnectionsnowflake)|`object`|Connection configuration for a Snowflake database.<br/>|yes|

**Example**

```yaml
SQL database:
  hr:
    type: postgresql
    host: localhost
    port: 5432
    database: postgres
    user: postgres
    password: postgres
MongoDB:
  mongodb-source:
    type: mongodb
    connection_string: mongodb://localhost:27017/?replicaSet=rs0
    user: debezium
    password: dbz
    database: db1,db2
Spanner:
  spanner-source:
    type: spanner
    project_id: example-12345
    instance_id: example
    database_id: example
    change_streams:
      change_stream_all:
        retention_period_hours: 24
Snowflake:
  snowflake:
    type: snowflake
    url: jdbc:snowflake://myaccount.snowflakecomputing.com/
    user: myuser
    password: mypassword
    database: MYDB
    warehouse: COMPUTE_WH

```

<a name="sourcesconnectionsqldatabase"></a>
#### sources\.connection\.SQL database: SQL database

Connection configuration for a supported SQL database.


**Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|**type**<br/>(Database type)|`string`|SQL database engine.<br/>Enum: `"mariadb"`, `"mysql"`, `"oracle"`, `"postgresql"`, `"sqlserver"`<br/>||
|**host**<br/>(Database host)|`string`|Hostname or IP address of the SQL database server.<br/>||
|**port**<br/>(Database port)|`integer`|Network port on which the SQL database server is listening.<br/>Minimum: `1`<br/>Maximum: `65535`<br/>||
|**database**<br/>(Database name)|`string`|Name of the database to connect to.<br/>||
|**user**<br/>(Database user)|`string`|Username for authentication to the SQL database.<br/>||
|**password**<br/>(Database password)|`string`|Password for authentication to the SQL database.<br/>||

**Additional Properties:** not allowed  
**Example**

```yaml
hr:
  type: postgresql
  host: localhost
  port: 5432
  database: postgres
  user: postgres
  password: postgres

```

**Example**

```yaml
my-oracle:
  type: oracle
  host: 172.17.0.4
  port: 1521
  user: c##dbzuser
  password: dbz

```

<a name="sourcesconnectionmongodb"></a>
#### sources\.connection\.MongoDB: MongoDB

Connection configuration for a MongoDB database.


**Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|**type**<br/>(Database type)|`string`|Database type identifier. Always `mongodb` for this connection.<br/>Constant Value: `"mongodb"`<br/>|yes|
|**connection\_string**|`string`|MongoDB connection URI including host, port, and any connection options.<br/>|yes|
|**user**<br/>(MongoDB user)|`string`|Username for authentication to MongoDB.<br/>|no|
|**password**<br/>(MongoDB password)|`string`|Password for authentication to MongoDB.<br/>|no|
|**database**<br/>(MongoDB databases)|`string`|Comma-separated list of MongoDB databases to monitor.<br/>|no|

**Additional Properties:** not allowed  
**Example**

```yaml
mongodb-source:
  type: mongodb
  connection_string: mongodb://localhost:27017/?replicaSet=rs0
  user: debezium
  password: dbz
  database: db1,db2

```

<a name="sourcesconnectionspanner"></a>
#### sources\.connection\.Spanner: Spanner

Connection configuration for a Google Cloud Spanner database.


**Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|**type**<br/>(Database type)|`string`|Database type identifier. Always `spanner` for this connection.<br/>Constant Value: `"spanner"`<br/>|yes|
|**project\_id**<br/>(Spanner project ID)|`string`|Google Cloud project ID that hosts the Spanner instance.<br/>|yes|
|**instance\_id**<br/>(Spanner instance ID)|`string`|Spanner instance identifier within the project.<br/>|yes|
|**database\_id**<br/>(Spanner database ID)|`string`|Spanner database identifier within the instance.<br/>|yes|
|**emulator\_host**<br/>(Spanner emulator host)|`string`|Host and port of the Spanner emulator. Used for local development; leave unset against real Spanner.<br/>|no|
|**use\_credentials\_file**|`boolean`|When `true`, RDI authenticates using a service account credentials file; when `false`, it uses application default credentials.<br/>Default: `false`<br/>|no|
|[**change\_streams**](#sourcesconnectionspannerchange_streams)<br/>(Change streams configuration)|`object`|Spanner change streams to capture, keyed by change stream name.<br/>|yes|

**Additional Properties:** not allowed  
**Example**

```yaml
spanner-source:
  type: spanner
  project_id: example-12345
  instance_id: example
  database_id: example
  change_streams:
    change_stream_all:
      retention_period_hours: 24

```

<a name="sourcesconnectionspannerchange_streams"></a>
##### sources\.connection\.Spanner\.change\_streams: Change streams configuration

Spanner change streams to capture, keyed by change stream name.


**Additional Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|[**Additional Properties**](#sourcesconnectionspannerchange_streamsadditionalproperties)|`object`, `null`|||

**Minimal Properties:** 1  
<a name="sourcesconnectionspannerchange_streamsadditionalproperties"></a>
###### sources\.connection\.Spanner\.change\_streams\.additionalProperties: object,null

**Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|**retention\_period\_hours**<br/>(Change stream retention period hours)|`integer`, `string`|Retention period for the change stream, in hours.<br/>Pattern: `^\${.*}$`<br/>Minimum: `1`<br/>||

**Additional Properties:** not allowed  
<a name="sourcesconnectionsnowflake"></a>
#### sources\.connection\.Snowflake: Snowflake

Connection configuration for a Snowflake database.


**Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|**type**<br/>(Database type)|`string`|Database type identifier. Always `snowflake` for this connection.<br/>Constant Value: `"snowflake"`<br/>|yes|
|**url**<br/>(JDBC URL)|`string`|Snowflake JDBC connection URL, for example `jdbc:snowflake://account.snowflakecomputing.com/`.<br/>|yes|
|**user**<br/>(Snowflake user)|`string`|Username for authentication to Snowflake.<br/>|yes|
|**password**<br/>(Snowflake password)|`string`|Password for authentication to Snowflake. For key-pair authentication, omit this field and provide the private key via the `source-db-ssl` secret (`client.key` field).<br/>|no|
|**database**<br/>(Snowflake database)|`string`|Name of the Snowflake database to connect to.<br/>|yes|
|**warehouse**<br/>(Snowflake warehouse)|`string`|Name of the Snowflake warehouse used for compute.<br/>|yes|
|**role**<br/>(Snowflake role)|`string`|Snowflake role used for the connection.<br/>|no|
|**cdcDatabase**<br/>(CDC database)|`string`|Database hosting the CDC streams. Defaults to the main `database` if not set.<br/>|no|
|**cdcSchema**<br/>(CDC schema)|`string`|Schema hosting the CDC streams. Defaults to the main schema if not set.<br/>|no|

**Additional Properties:** not allowed  
**Example**

```yaml
snowflake:
  type: snowflake
  url: jdbc:snowflake://myaccount.snowflakecomputing.com/
  user: myuser
  password: mypassword
  database: MYDB
  warehouse: COMPUTE_WH

```

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
|[**sink**](#sourcesadvancedsink)<br/>(RDI Collector stream writer configuration)|`object`|Advanced configuration properties for the RDI Collector stream writer connection and behaviour. **Applies to the `cdc` and `flink` collector types.**<br/>||
|[**source**](#sourcesadvancedsource)<br/>(Advanced source settings)|`object`|Advanced configuration properties for the source database connection and CDC behavior. **Applies to the `cdc` and `flink` collector types.**<br/>||
|[**quarkus**](#sourcesadvancedquarkus)<br/>(Quarkus runtime settings)|`object`|Advanced configuration properties for the Quarkus runtime that hosts Debezium Server. **Only applies to the `cdc` collector type.** See the [Debezium Server documentation](https://debezium.io/documentation/reference/stable/operations/debezium-server.html) for runtime configuration options. When using a property from that page, omit the `quarkus.` prefix.<br/>||
|[**flink**](#sourcesadvancedflink)<br/>(Advanced Flink settings)|`object`|Advanced configuration properties forwarded to the Flink runtime that hosts the collector. Any property listed in the [Flink configuration documentation](https://nightlies.apache.org/flink/flink-docs-release-2.0/docs/deployment/config/) can be set here and will override the RDI default. **Only applies to the `flink` collector type.**<br/>||
|[**resources**](#sourcesadvancedresources)<br/>(Collector resource settings)|`object`|Compute resources allocated to the collector. **Only applies to the `cdc` collector type.**<br/>||
|[**riotx**](#sourcesadvancedriotx)<br/>(Advanced RIOT\-X settings)|`object`|Advanced configuration properties for the RIOT-X Snowflake collector. **Only applies to the `riotx` collector type.**<br/>||
|**java\_options**<br/>(Advanced Java options)|`string`|These Java options will be passed to the command line command when launching the source collector. **Only applies to the `cdc` collector type.**<br/>||

**Additional Properties:** not allowed  
**Minimal Properties:** 1  
**Example**

```yaml
sink:
  redis.batch.size: 1000
  redis.flush.interval.ms: 100
  redis.connection.timeout.ms: 2000
  redis.socket.timeout.ms: 2000
  redis.retry.max.attempts: 5
  redis.retry.initial.delay.ms: 100
  redis.retry.max.delay.ms: 3000
  redis.retry.backoff.multiplier: 2
  redis.oom.retry.initial.delay.ms: 1000
  redis.oom.retry.max.delay.ms: 10000
  redis.oom.retry.backoff.multiplier: 2
  redis.wait.enabled: false
  redis.wait.write.timeout.ms: 1000
  redis.wait.retry.enabled: false
  redis.wait.retry.delay.ms: 1000
source:
  spanner.version.retention.period.hours: 1
  spanner.fetch.timeout.ms: 500
  spanner.fetch.heartbeat.ms: 100
  spanner.max.rows.per.partition: 10000
  spanner.dialect: GOOGLESQL
quarkus: {}
flink:
  taskmanager.numberOfTaskSlots: 1
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

Advanced configuration properties for the RDI Collector stream writer connection and behaviour. **Applies to the `cdc` and `flink` collector types.**<br/><br/>For the `cdc` collector type, see the full list of properties at [Debezium Server — Redis Stream sink](https://debezium.io/documentation/reference/stable/operations/debezium-server.html#_redis_stream). When using a property from that page, omit the `debezium.sink.` prefix.<br/><br/>**The properties listed below only apply to the `flink` collector type.**


**Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|**redis\.batch\.size**<br/>(Sink batch size)|`integer`|Maximum number of records the collector sink writes to Redis in a single batch.<br/>Default: `1000`<br/>Minimum: `1`<br/>||
|**redis\.flush\.interval\.ms**<br/>(Sink flush interval)|`integer`|Maximum time in milliseconds the collector sink waits to fill a batch before flushing it to Redis.<br/>Default: `100`<br/>Minimum: `1`<br/>||
|**redis\.connection\.timeout\.ms**<br/>(Sink connection timeout)|`integer`|Connection timeout in milliseconds for the target Redis client used by the collector sink.<br/>Default: `2000`<br/>Minimum: `1`<br/>||
|**redis\.socket\.timeout\.ms**<br/>(Sink socket timeout)|`integer`|Socket read/write timeout in milliseconds for the target Redis client used by the collector sink.<br/>Default: `2000`<br/>Minimum: `1`<br/>||
|**redis\.retry\.max\.attempts**<br/>(Sink retry max attempts)|`integer`|Maximum number of retry attempts for failed Redis operations.<br/>Default: `5`<br/>Minimum: `1`<br/>||
|**redis\.retry\.initial\.delay\.ms**<br/>(Sink retry initial delay)|`integer`|Initial delay in milliseconds before the first retry of a failed Redis operation.<br/>Default: `100`<br/>Minimum: `1`<br/>||
|**redis\.retry\.max\.delay\.ms**<br/>(Sink retry max delay)|`integer`|Maximum delay in milliseconds between retry attempts for failed Redis operations.<br/>Default: `3000`<br/>Minimum: `1`<br/>||
|**redis\.retry\.backoff\.multiplier**<br/>(Sink retry backoff multiplier)|`number`|Exponential backoff multiplier between retry attempts for failed Redis operations.<br/>Default: `2`<br/>Minimum: `1`<br/>||
|**redis\.oom\.retry\.initial\.delay\.ms**<br/>(Sink OOM retry initial delay)|`integer`|Initial delay in milliseconds before the first retry after a Redis out-of-memory error.<br/>Default: `1000`<br/>Minimum: `1`<br/>||
|**redis\.oom\.retry\.max\.delay\.ms**<br/>(Sink OOM retry max delay)|`integer`|Maximum delay in milliseconds between retry attempts after a Redis out-of-memory error.<br/>Default: `10000`<br/>Minimum: `1`<br/>||
|**redis\.oom\.retry\.backoff\.multiplier**<br/>(Sink OOM retry backoff multiplier)|`number`|Exponential backoff multiplier between retry attempts after a Redis out-of-memory error.<br/>Default: `2`<br/>Minimum: `1`<br/>||
|**redis\.wait\.enabled**<br/>(Sink replica wait enabled)|`boolean`|When `true`, the collector verifies that each write has been replicated to the configured number of Redis replica shards before acknowledging it.<br/>Default: `false`<br/>||
|**redis\.wait\.write\.timeout\.ms**<br/>(Sink replica wait timeout)|`integer`|Maximum time in milliseconds to wait for replica write acknowledgements.<br/>Default: `1000`<br/>Minimum: `1`<br/>||
|**redis\.wait\.retry\.enabled**<br/>(Sink replica wait retry enabled)|`boolean`|When `true`, the collector keeps retrying a write until replica acknowledgement succeeds; when `false`, it gives up after the first failure.<br/>Default: `false`<br/>||
|**redis\.wait\.retry\.delay\.ms**<br/>(Sink replica wait retry delay)|`integer`|Delay in milliseconds between replica wait retry attempts.<br/>Default: `1000`<br/>Minimum: `1`<br/>||

**Additional Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|**Additional Properties**|`string`, `number`, `boolean`|||

**Minimal Properties:** 1  
**Example**

```yaml
redis.batch.size: 1000
redis.flush.interval.ms: 100
redis.connection.timeout.ms: 2000
redis.socket.timeout.ms: 2000
redis.retry.max.attempts: 5
redis.retry.initial.delay.ms: 100
redis.retry.max.delay.ms: 3000
redis.retry.backoff.multiplier: 2
redis.oom.retry.initial.delay.ms: 1000
redis.oom.retry.max.delay.ms: 10000
redis.oom.retry.backoff.multiplier: 2
redis.wait.enabled: false
redis.wait.write.timeout.ms: 1000
redis.wait.retry.enabled: false
redis.wait.retry.delay.ms: 1000

```

<a name="sourcesadvancedsource"></a>
#### sources\.advanced\.source: Advanced source settings

Advanced configuration properties for the source database connection and CDC behavior. **Applies to the `cdc` and `flink` collector types.**<br/><br/>For the `cdc` collector type, available properties depend on the source database — refer to the relevant Debezium connector documentation: [MySQL](https://debezium.io/documentation/reference/stable/connectors/mysql.html), [MariaDB](https://debezium.io/documentation/reference/stable/connectors/mariadb.html), [PostgreSQL](https://debezium.io/documentation/reference/stable/connectors/postgresql.html), [Oracle](https://debezium.io/documentation/reference/stable/connectors/oracle.html), [SQL Server](https://debezium.io/documentation/reference/stable/connectors/sqlserver.html), [Db2](https://debezium.io/documentation/reference/stable/connectors/db2.html), [MongoDB](https://debezium.io/documentation/reference/stable/connectors/mongodb.html). When using a property from those pages, omit the `debezium.source.` prefix.<br/><br/>**The properties listed below only apply to the `flink` collector type (Spanner).**


**Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|**spanner\.version\.retention\.period\.hours**<br/>(Spanner version retention period)|`integer`|Retention period in hours for Spanner change stream versions. Determines how far back the collector can resume after an outage.<br/>Default: `1`<br/>Minimum: `1`<br/>||
|**spanner\.fetch\.timeout\.ms**<br/>(Spanner fetch timeout)|`integer`|Timeout in milliseconds for a single change stream fetch request to Spanner.<br/>Default: `500`<br/>Minimum: `1`<br/>||
|**spanner\.fetch\.heartbeat\.ms**<br/>(Spanner fetch heartbeat interval)|`integer`|Interval in milliseconds at which Spanner sends heartbeat records when no data changes are available.<br/>Default: `100`<br/>Minimum: `1`<br/>||
|**spanner\.max\.rows\.per\.partition**<br/>(Spanner max rows per partition)|`integer`|Maximum number of rows the collector reads from a single Spanner change stream partition before yielding.<br/>Default: `10000`<br/>Minimum: `1`<br/>||
|**spanner\.dialect**<br/>(Spanner SQL dialect)|`string`|SQL dialect of the Spanner database. Use `GOOGLESQL` for Google Standard SQL or `POSTGRESQL` for the PostgreSQL interface.<br/>Default: `"GOOGLESQL"`<br/>Enum: `"GOOGLESQL"`, `"POSTGRESQL"`<br/>||

**Additional Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|**Additional Properties**|`string`, `number`, `boolean`|||

**Minimal Properties:** 1  
**Example**

```yaml
spanner.version.retention.period.hours: 1
spanner.fetch.timeout.ms: 500
spanner.fetch.heartbeat.ms: 100
spanner.max.rows.per.partition: 10000
spanner.dialect: GOOGLESQL

```

<a name="sourcesadvancedquarkus"></a>
#### sources\.advanced\.quarkus: Quarkus runtime settings

Advanced configuration properties for the Quarkus runtime that hosts Debezium Server. **Only applies to the `cdc` collector type.** See the [Debezium Server documentation](https://debezium.io/documentation/reference/stable/operations/debezium-server.html) for runtime configuration options. When using a property from that page, omit the `quarkus.` prefix.


**Additional Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|**Additional Properties**|`string`, `number`, `boolean`|||

**Minimal Properties:** 1  
<a name="sourcesadvancedflink"></a>
#### sources\.advanced\.flink: Advanced Flink settings

Advanced configuration properties forwarded to the Flink runtime that hosts the collector. Any property listed in the [Flink configuration documentation](https://nightlies.apache.org/flink/flink-docs-release-2.0/docs/deployment/config/) can be set here and will override the RDI default. **Only applies to the `flink` collector type.**<br/><br/>The properties listed below are the ones most likely to require adjustment. **Changing any other Flink property is not recommended unless instructed by Redis support.**


**Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|**parallelism\.default**<br/>(Default parallelism)|`integer`|Default parallelism for Flink jobs and operators. When unset, Flink uses the number of available task slots across all task managers (`taskManager.replicas × taskmanager.numberOfTaskSlots`). See [parallel execution](https://nightlies.apache.org/flink/flink-docs-release-2.0/docs/dev/datastream/execution/parallel/).<br/>Minimum: `1`<br/>||
|**taskmanager\.numberOfTaskSlots**<br/>(Task slots per task manager)|`integer`|Number of parallel task slots per task manager pod. Each slot can run one parallel pipeline instance, so this caps the parallelism a single task manager can absorb. See [task slots and resources](https://nightlies.apache.org/flink/flink-docs-release-2.0/docs/concepts/flink-architecture/#task-slots-and-resources).<br/>Default: `1`<br/>Minimum: `1`<br/>||
|**taskmanager\.memory\.process\.size**<br/>(Task manager process memory)|`string`|Total memory budget for each task manager JVM process, expressed with a unit suffix such as `2048m` or `4g`. See [task manager memory configuration](https://nightlies.apache.org/flink/flink-docs-release-2.0/docs/deployment/memory/mem_setup_tm/).<br/>||

**Additional Properties**

|Name|Type|Description|Required|
|----|----|-----------|--------|
|**Additional Properties**|`string`, `number`, `boolean`|||

**Minimal Properties:** 1  
**Example**

```yaml
taskmanager.numberOfTaskSlots: 1

```

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
|**port**<br/>(Database port)|`integer`|Network port on which the Redis server is listening.<br/>Minimum: `1`<br/>Maximum: `65535`<br/>|yes|
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
|**type**<br/>(Processor type)|`string`|Processor implementation to run. `classic` runs the classic processor; `flink` runs the Apache Flink-based processor.<br/>Default: `"classic"`<br/>Enum: `"classic"`, `"flink"`<br/>||
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
|**wait\_enabled**<br/>(Enable replica wait)|`boolean`|When `true`, RDI verifies that each write has been replicated to the target database's replica shards before acknowledging it. Enable this only when target database replication is enabled and a healthy replica is available. For the Flink processor, `processors.advanced.target.wait.enabled` takes priority.<br/>Default: `false`<br/>||
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
|**wait\.enabled**<br/>(Target replica wait enabled)|`boolean`|When `true`, RDI verifies that each write has been replicated to the target database's replica shards before acknowledging it. Enable this only when target database replication is enabled and a healthy replica is available. Alias for `processors.wait_enabled`; takes priority when both are set.<br/>Default: `false`<br/>||
|**wait\.write\.timeout\.ms**<br/>(Target replica wait timeout)|`integer`|Maximum time in milliseconds to wait for target replica write verification. Alias for `processors.wait_timeout`; takes priority when both are set.<br/>Default: `1000`<br/>Minimum: `1`<br/>||
|**wait\.retry\.enabled**<br/>(Target replica wait retry enabled)|`boolean`|When `true`, RDI keeps retrying a target write until replica replication is confirmed; when `false`, it gives up after the first failure. Alias for `processors.retry_on_replica_failure`; takes priority when both are set. When enabled, the Flink processor retries indefinitely. Failed checkpoints can restart the job, after which the retries resume. The classic processor retries once.<br/>Default: `true`<br/>||
|**wait\.retry\.delay\.ms**<br/>(Target replica wait retry delay)|`integer`|Delay in milliseconds between target replica wait retry attempts.<br/>Default: `1000`<br/>Minimum: `1`<br/>||

{{< warning >}}
If target database replication is disabled, `wait.enabled: true` with the
default `wait.retry.enabled: true` prevents the processor from making progress.
Target writes can succeed, but replica verification returns
`WAIT failed: 0/1 replicas`. Flink retries indefinitely. Records remain pending
rather than rejected, the target can appear as disconnected, checkpoints fail,
the job can retry or restart, and the initial snapshot does not complete. Later
records accumulate behind the blocked sink batches.

To recover, enable target database replication or remove `wait.enabled` (or set
it to `false`) and redeploy. A reset is not required. RDI replays the pending
records and clears them after a successful checkpoint. Target writes can be
repeated during recovery because RDI provides at-least-once delivery.

Setting `wait.retry.enabled: false` lets processing continue after a failed
replica acknowledgement, so it does not provide the durability guarantee that
`wait.enabled` is intended to enforce.
{{< /warning >}}

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
