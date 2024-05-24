---
Title: Pipelines
linkTitle: Pipelines
description: Learn how to configure ingest pipelines 
weight: 4
alwaysopen: false
categories: ["redis-di"]
aliases:
---

RDI implements
[change data capture](https://en.wikipedia.org/wiki/Change_data_capture) (CDC)
with *pipelines*. (See the
[architecture overview]({{< relref "/integrate/redis-data-integration/ingest/architecture#overview" >}})
for an introduction to pipelines.) There are 2 basic types of pipeline:

- *Ingest* pipelines capture data from an external source database
  and add it to a Redis target database.
- *Write-behind* pipelines capture data from a Redis source database
  and add it to an external target database.

## Overview

RDI uses a set of [YAML](https://en.wikipedia.org/wiki/YAML)
files to configure each pipeline. The following diagram shows the folder
structure of the configuration:

{{< image filename="images/rdi/ingest/ingest-config-folders.svg" >}}

The main configuration for the pipeline is in the `config.yaml` file.
This specifies the connection details for the source database(s) (such
as host, username, and password) and also the queries that RDI will use
to extract the required data. You can also specify one or more optional *job* configurations in the `Jobs` folder. Use these to specify custom
transformations to apply to the source data before writing it to the target.

The sections below describe these 2 types of configuration files in more detail.

## The `config.yaml` file

Here is an example of a `config.yaml` file:

```yaml
sources:
  mysql:
    type: cdc
    logging:
      level: info
    connection:
      type: mysql
      host: ${RDI_REDIS_HOST}
      port: 13000
      database: redislabscdc
      user: ${SOURCE_DB_USERNAME}
      password: ${SOURCE_DB_PASSWORD}
    tables:
          emp:
            snapshot_sql: "SELECT * from redislabscdc.emp WHERE empno < 1000"
            columns:
              - empno
              - fname
              - lname
            keys:
              - empno
targets:
  my-redis:
    connection:
      type: redis
      host: localhost
      port: 12000
```

The main sections of the file configure [`sources`](#sources) and [`targets`](#targets).

### Sources

The `sources` section has one or more subsections for each of the sources that
you need to configure. Every source section starts with a unique name
to identify the source (in the example we have a source
called `mysql` but you can choose any name you like). The example
configuration contains the following data:

- `type`: The type of collector to use for the pipeline. Currently, the only type we support is `cdc`.
- `connection`: The connection details for the source database: hostname, port, schema/ db name, database credentials and
[TLS](https://en.wikipedia.org/wiki/Transport_Layer_Security)/
[mTLS](https://en.wikipedia.org/wiki/Mutual_authentication#mTLS) secrets.
- `tables`: The dataset you want to collect from the source. This subsection
  specifies:
  - `snapshot_sql`: A query that selects the tables to include in the dataset
    (the default is to include all tables if you don't specify a query here).
  - `columns`: A list of the columns you are interested in (the default is to
    include all columns if you don't supply a list)
  - `keys`: A list of primary keys, one for each table. If the table doesn't
    have a column with a
    [`PRIMARY KEY`](https://www.w3schools.com/sql/sql_primarykey.asp) or
    [`UNIQUE`](https://www.w3schools.com/sql/sql_unique.asp) constraint then you can
    supply a unique composite key.
 
There are also some advanced source configurations that are specific to each
type of source database but you usually won't need these. Some of them are documented here [link to Debezium configuration reference revised for collector]

### Targets

Use this section to provide the connection details for the target Redis
database(s). As with the sources, you should start each target section
with a unique name that you are free to choose (here, we have used
`my-redis` as an example). In the `connection` section, you can supply the
`type` of target database, which will generally be `redis` along with the
`host` and `port` of the server. You can also supply connection credentials
and TLS/mTLS secrets here if you use them.

## Job files

You can optionally supply one or more job files that specify how you want to transform the captured data before writing it to the target. Each job file contains a YAML
configuration that controls the transformation for a particular table from the source
database. For ingest pipelines, you can also add a `default-job.yaml` file to provide
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
  use. The `table`
  property refers to the table name you supplied in `config.yaml`. The default
  job doesn't apply to a specific table, so use "*" in place of the table name
  for this job only.

- `transform`: This is an optional section describing the transformation
  that the pipeline
  applies to the data before writing it to the target.

- `output`: This is a mandatory section to specify the data structure(s) that
  RDI will write to
  the target along with the text pattern for the key(s) that will access it.
  Note that you can map one record to more than one key in Redis or nest
  a record as a field of a JSON structure.

See [reference section pages when they are ready] for full details about the
available source, transform, and target configuration options and also a set
of example job configurations.

## Ingest pipeline lifecycle

Once you have created the configuration for a pipeline, it goes through the
following phases:

1. *Deploy* - when you deploy the pipeline, RDI first validates it before use.
Then, the [operator]({{< relref "/integrate/redis-data-integration/ingest/architecture#how-rdi-is-deployed">}}) creates and configures the collector and stream processor that will run the pipeline.
1. *Snapshot* - The collector starts the pipeline by creating a snapshot of the full
dataset. This involves reading all the relevant source data, transforming it and then
writing it into the Redis target. You should expect this phase to take minutes or
hours to complete if you have a lot of data.
1. *CDC* - Once the snapshot is complete, the collector starts listening for updates to
the source data. Whenever a change is committed to the source, the collector captures
it and adds it to the target through the pipeline. This phase continues indefinitely
unless you change the pipeline configuration. 
1. *Update* - If you update the pipeline configuration, the operator starts applying it
to the processor and the collector. Note that the changes only affect newly-captured
data unless you reset the pipeline completely. Once RDI has accepted the updates, the
pipeline returns to the CDC phase with the new configuration.
1. *Reset* - There are circumstances where you might want to rebuild the dataset
completely. For example, you might want to apply a new transformation to all the source
data or refresh the dataset if RDI is disconnected from the
source for a long time. In situations like these, you can *reset* the pipeline back
to the snapshot phase. When this is complete, the pipeline continues with CDC as usual. 
