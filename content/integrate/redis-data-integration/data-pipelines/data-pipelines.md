---
Title: Configure data pipelines
linkTitle: Configure
description: Learn how to configure ingest pipelines for data transformation
weight: 1
alwaysopen: false
categories: ["redis-di"]
aliases: /integrate/redis-data-integration/ingest/data-pipelines/data-pipelines/
---

RDI implements
[change data capture](https://en.wikipedia.org/wiki/Change_data_capture) (CDC)
with *pipelines*. (See the
[architecture overview]({{< relref "/integrate/redis-data-integration/architecture#overview" >}})
for an introduction to pipelines.)

## Overview

An RDI pipeline captures change data records from the source database, and transforms them
into Redis data structures. It writes each of these new structures to a Redis target
database under its own key. 

By default, RDI transforms the source data into
[hashes]({{< relref "/develop/data-types/hashes" >}}) or
[JSON objects]({{< relref "/develop/data-types/json" >}}) for the target with a
standard data mapping and a standard format for the key.
However, you can also provide your own custom transformation [jobs](#job-files)
for each source table, using your own data mapping and key pattern. You specify these
jobs declaratively with YAML configuration files that require no coding.

The data tranformation involves two separate stages. First, the data ingested
during CDC is automatically transformed to a JSON format. Then,
this JSON data gets passed on to your custom transformation for further processing.

You can provide a job file for each source table you want to transform, but you
can also add a *default job* for any tables that don't have their own.
You must specify the full name of the source table in the job file (or the special
name "*" in the default job) and you
can also include filtering logic to skip data that matches a particular condition.
As part of the transformation, you can specify whether you want to store the
data in Redis as
[JSON objects]({{< relref "/develop/data-types/json" >}}),
[hashes]({{< relref "/develop/data-types/hashes" >}}),
[sets]({{< relref "/develop/data-types/sets" >}}),
[streams]({{< relref "/develop/data-types/streams" >}}),
[sorted sets]({{< relref "/develop/data-types/sorted-sets" >}}), or
[strings]({{< relref "/develop/data-types/strings" >}}).

The diagram below shows the flow of data through the pipeline:

{{< image filename="/images/rdi/ingest/RDIPipeDataflow.webp" >}}

## Pipeline configuration

RDI uses a set of [YAML](https://en.wikipedia.org/wiki/YAML)
files to configure each pipeline. The following diagram shows the folder
structure of the configuration:

{{< image filename="images/rdi/ingest/ingest-config-folders.webp" width="600px" >}}

The main configuration for the pipeline is in the `config.yaml` file.
This specifies the connection details for the source database (such
as host, username, and password) and also the queries that RDI will use
to extract the required data. You should place job configurations in the `Jobs`
folder if you want to specify your own data transformations.

The sections below describe the two types of configuration file in more detail.

## The `config.yaml` file

Here is an example of a `config.yaml` file. Note that the values of the
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

The main sections of the file configure [`sources`](#sources) and [`targets`](#targets).

### Sources

The `sources` section has a subsection for the source that
you need to configure. The source section starts with a unique name
to identify the source (in the example we have a source
called `mysql` but you can choose any name you like). The example
configuration contains the following data:

- `type`: The type of collector to use for the pipeline. 
  Currently, the only types we support are `cdc` and `external`.
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
with a unique name that you are free to choose (here, we have used
`target` as an example). In the `connection` section, you can specify the
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
VM. For this reason, we recommend that you don't use `localhost` for the address. However,
if you do encounter this problem, you can fix it using the following commands on the VM
that is running RDI itself:

```bash
sudo k3s kubectl delete nodes --all
sudo service k3s restart
```
{{< /note >}}

## Job files

You can optionally supply one or more job files that specify how you want to
transform the captured data before writing it to the target.
Each job file contains a YAML
configuration that controls the transformation for a particular table from the source
database. You can also add a `default-job.yaml` file to provide
a default transformation for tables that don't have a specific job file of their own.

The job files have a structure like the following example. This configures a default
job that:

- Writes the data to a Redis hash
- Adds a field `app_code` to the hash with a value of `foo`
- Adds a prefix of `aws` and a suffix of `gcp` to the key

```yaml
source:
  table: "*"
  row_format: full
transform:
  - uses: add_field
    with:
      fields:
        - field: after.app_code
          expression: "`foo`"
          language: jmespath
output:
  - uses: redis.write
    with:
      data_type: hash
      key:
        expression: concat(['aws', '#', table, '#', keys(key)[0], '#', values(key)[0], '#gcp'])
        language: jmespath
```

The main sections of these files are:

- `source`: This is a mandatory section that specifies the data items that you want to 
  use. You can add the following properties here:
  - `server_name`: Logical server name (optional).
  - `db`: Database name (optional)
  - `schema`: Database schema (optional)
  - `table`: Database table name. This refers to a table name you supplied in `config.yaml`. The default
  job doesn't apply to a specific table, so use "*" in place of the table name for this job only.
  - `row_format`: Format of the data to be transformed. This can take the values `data_only` (default) to
  use only the payload data, or `full` to use the complete change record. See the `transform` section below
  for details of the extra data you can access when you use the `full` option.
  - `case_insensitive`: This applies to the `server_name`, `db`, `schema`, and `table` properties
  and is set to `true` by default. Set it to `false` if you need to use case-sensitive values for these
  properties.

- `transform`: This is an optional section describing the transformation that the pipeline
  applies to the data before writing it to the target. The `uses` property specifies a
  *transformation block* that will use the parameters supplied in the `with` section. See the 
  [data transformation reference]({{< relref "/integrate/redis-data-integration/reference/data-transformation" >}})
  for more details about the supported transformation blocks, and also the
  [JMESPath custom functions]({{< relref "/integrate/redis-data-integration/reference/jmespath-custom-functions" >}}) reference. You can test your transformation logic using the [dry run]({{< relref "/integrate/redis-data-integration/reference/api-reference/#tag/secure/operation/job_dry_run_api_v1_pipelines_jobs_dry_run_post" >}}) feature in the API.

  {{< note >}}If you set `row_format` to `full` under the `source` settings, you can access extra data from the
  change record in the transformation:
  - Use the `key` object to access the attributes of the key. For example, `key.id` will give you the value of the `id` column as long as it is part of the primary key.
  - Use `before.<FIELD_NAME>` to get the value of a field *before* it was updated in the source database
  - Use `after.<FIELD_NAME>` to get the value of a field *after* it was updated in the source database
  - Use `after.<FIELD_NAME>` when adding new fields during transformations
  
  See [Row Format]({{< relref "/integrate/redis-data-integration/data-pipelines/transform-examples/redis-row-format#full" >}}) for a more detailed explanation of the full format.
  {{< /note >}}
 
- `output`: This is a mandatory section to specify the data structure(s) that
  RDI will write to
  the target along with the text pattern for the key(s) that will access it.
  Note that you can map one record to more than one key in Redis or nest
  a record as a field of a JSON structure (see
  [Data denormalization]({{< relref "/integrate/redis-data-integration/data-pipelines/data-denormalization" >}})
  for more information about nesting). You can add the following properties in the `output` section:
  - `uses`: This must have the value `redis.write` to specify writing to a Redis data
  structure. You can add more than one block of this type in the same job.
  - `with`:
    - `connection`: Connection name as defined in `config.yaml` (by default, the connection named `target` is used).
    - `data_type`: Target data structure when writing data to Redis. The supported types are `hash`, `json`, `set`,
   `sorted_set`, `stream` and `string`.
    - `key`: This lets you override the default key for the data structure with custom logic:
      - `expression`: Expression to generate the key.
      - `language`: Expression language, which must be `jmespath` or `sql`.
    - `expire`: Positive integer value indicating a number of seconds for the key to expire.
    If you don't specify this property, the key will never expire.

{{< note >}}In a job file, the `transform` section is optional, but if you don't specify
a `transform`, you must specify custom key logic in `output.with.key`. You can include
both of these sections if you want both a custom transform and a custom key.{{< /note >}}

Another example below shows how you can rename the `fname` field to `first_name` in the table `emp`
using the
[`rename_field`]({{< relref "/integrate/redis-data-integration/reference/data-transformation/rename_field" >}}) block. It also demonstrates how you can set the key of this record instead of relying on
the default logic. (See the
[Transformation examples]({{< relref "/integrate/redis-data-integration/data-pipelines/transform-examples" >}})
section for more examples of job files.)

```yaml
source:
  server_name: redislabs
  schema: dbo
  table: emp
transform:
  - uses: rename_field
    with:
      from_field: fname
      to_field: first_name
output:
  - uses: redis.write
    with:
      connection: target
      key:
        expression: concat(['emp:fname:',fname,':lname:',lname])
        language: jmespath
```

See the
[RDI configuration file]({{< relref "/integrate/redis-data-integration/reference/config-yaml-reference" >}})
reference for full details about the
available source, transform, and target configuration options and see
also the
[data transformation reference]({{< relref "/integrate/redis-data-integration/reference/data-transformation" >}})
for details of all the available transformation blocks.

## Source preparation

Before using the pipeline you must first prepare your source database to use
the Debezium connector for *change data capture (CDC)*. See the
[architecture overview]({{< relref "/integrate/redis-data-integration/architecture#overview" >}})
for more information about CDC.
Each database type has a different set of preparation steps. You can
find the preparation guides for the databases that RDI supports in the
[Prepare source databases]({{< relref "/integrate/redis-data-integration/data-pipelines/prepare-dbs" >}})
section.

## Provide authentication secrets

You must provide authentication secrets for your source and target databases
before deploying a pipeline. You can supply the secrets to RDI directly
or for K8s deployments, you can also use an external secret provider, such as
[Vault](https://developer.hashicorp.com/vault) or
[AWS Secrets Manager](https://aws.amazon.com/secrets-manager/).

See [Set secrets]({{< relref "/integrate/redis-data-integration/data-pipelines/set-secrets" >}}) and
[Using an external secret provider]({{< relref "/integrate/redis-data-integration/data-pipelines/secret-providers" >}})
for more information.


## Deploy a pipeline

When you have created your configuration, including the [jobs]({{< relref "/integrate/redis-data-integration/data-pipelines/data-pipelines#job-files" >}}), you are
ready to deploy. Use [Redis Insight]({{< relref "/develop/tools/insight/rdi-connector" >}})
to configure and deploy pipelines for both VM and K8s installations.

For VM installations, you can also use the
[`redis-di deploy`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-deploy" >}})
command to deploy a pipeline:

```bash
redis-di deploy --dir <path to pipeline folder>
```

## Pipeline lifecycle

A pipeline goes through the following phases:

1. *Deploy* - when you deploy the pipeline, RDI first validates it before use.
Then, the [operator]({{< relref "/integrate/redis-data-integration/architecture#how-rdi-is-deployed">}}) creates and configures the collector and stream processor that will run the pipeline.
1. *Snapshot* - The collector starts the pipeline by creating a snapshot of the full
dataset. This involves reading all the relevant source data, transforming it and then
writing it into the Redis target. You should expect this phase to take minutes or
hours to complete if you have a lot of data.
1. *CDC* - Once the snapshot is complete, the collector starts listening for updates to
the source data. Whenever a change is committed to the source, the collector captures
it and adds it to the target through the pipeline. This phase continues indefinitely
unless you change the pipeline configuration. 
1. *Update* - If you update the pipeline configuration, the operator applies it
to the collector and the stream processor. Note that the changes only affect newly-captured
data unless you reset the pipeline completely. Once RDI has accepted the updates, the
pipeline returns to the CDC phase with the new configuration.
1. *Reset* - There are circumstances where you might want to rebuild the dataset
completely. For example, you might want to apply a new transformation to all the source
data or refresh the dataset if RDI is disconnected from the
source for a long time. In situations like these, you can *reset* the pipeline back
to the snapshot phase. When this is complete, the pipeline continues with CDC as usual. 
