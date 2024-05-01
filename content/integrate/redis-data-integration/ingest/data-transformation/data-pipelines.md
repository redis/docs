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
[architecture overview](architecture.md#overview)
for an introduction to pipelines.) There are 2 basic types of pipeline:

- *Ingest* pipelines capture data from an external source database
  and add it to a Redis target database.

- *Write-behind* pipelines capture data from a Redis source database
  and add it to an external target database.

RDI uses a set of [YAML](https://en.wikipedia.org/wiki/YAML)
files to configure each pipeline. The following diagram shows the folder
structure of the configuration:

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

The main sections of the file are `sources` and `targets`.

### Sources

The `sources` section has one or more subsections for the sources that
you need to configure. Each source section starts with a unique name
that you choose to identify the source (in the example we have one source
called `mysql`). The source configurations contain the following data:

- `type`: The type of collector to use for the pipeline. Currently, the only type
  we support is `cdc`.

- `connection`: The connection details for the source database: hostname, port, schema/ db name, database credentials and TLS/mTLS secrets.

- `tables`: The dataset to collect: Tables to include (all if not specified), the columns to include per table (all if not specified), In case the table doesn’t have a unique identifier (primary key or unique constraint), a composite unique identifier per table. 
- There are advanced source configurations per source database type that are generally not needed. Some of them are documented here [link to Debezium configuration reference revised for collector]

### Targets

The targets section in the ingest pipeline provides the redis connection details including credentials and TLS/mTLS secrets.
The main sections of this file are:

- `sources`: This specifies the connection details
  (such as the host, username, and password) for the database(s)
  that hold the source data and also the queries that extract the
  required subset of the data. An ingest pipeline has an external database
  as its source while the source of write-behind pipeline is a
  Redis database.

- `targets`: This specifies where the transformed data
  will be written. The target is a Redis database for an ingest
  pipeline, while a write-behind pipeline will target an external
  database.

The optional job files have a structure like the following example:

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

- `source`: This specifies the data items that you want to use.

- `transform`: This describes the transformation that the pipeline
  applies to the data before writing it to the target.

- `output`: This specifies the data structure that RDI will write to
  the target.

The sections below describes the contents of these files in more detail.


- The *transformation job* configuration describes the way that
  data will be extracted from the input, manipulated, and
  converted into the desired target representation.



## Pipeline overview  

A pipeline in RDI is made of the configurations of 4 entities:

- Sources - tracks and ships data changes from the source(s).
- Transformation Job - that describes the data mapping and manipulation for a particular collection of entries (Source Table for Ingest pipeline or Redis key pattern  for a write-behind pipeline)
- Targets - The target(s) to which pipeline processed data is written (Redis in case of Ingest or another supported target in case of write-behind)
- Processors - The configuration of the Stream Processor engine - specifies how many processors will be used during the pipeline full sync phase.
- Jobs - Optional set of files defining data transformations and mapping between source and target.

The Sources, Targets and Processors sections are defined in the main configuration file of the pipeline the `config.yaml` file

## Pipeline files structure

{{< image filename="images/rdi/ingest/ingest-pipeline-files.png" >}}

## Configuration in `config.yaml`




### Jobs

There are two types of jobs: the default job and the specific job per table. Both are optional.

1. Default job - The default job role is to provide general definitions that covers the data transformations in case a particular job has not been specified for this source table / collection. The main items in the default job are the Redis key-pattern in the target & the data type for the target.
2. Specific table job - The specific table job is a yaml file with a unique name in the jobs folder. Except for having a unique file name it also has to specify a valid table name as its source.

#### Default job

In situations where there is a need to perform a transformation on all ingested records without creating a specific job for specific tables, the default job is used. The transformation associated with this job will be applied to all tables that lack their own explicitly defined jobs. The default job must have a table name of “*”, and only one instance of this type of job is permitted.
For example, the default job can streamline tasks such as adding a prefix or postfix to Redis keys, or adding fields to new hashes and JSONs without customizing each source table.
Currently, the default job is supported for ingest pipelines only.
Example
This example demonstrates the process of adding an app_code field with a value of foo using the add_field block to all tables that lack explicitly defined jobs. Additionally, it appends an aws prefix and a gcp postfix to every generated hash key.
default.yaml

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

#### Ingest job structure

The ingest job has the following 3 sections:

- Source (mandatory) - the information to locate the source table for this job 
- Transformation (optional) - the information about filters and transformations to apply to all records coming from this source. See data transformation [link] for more information.
- Output (mandatory) - specified the Redis key-pattern & data type to use for records coming from this job. It also maps the data record fields to the right attributes of the Redis data type, allowing for more flexibility. 

Note that an ingest job output section might:

- Map one record to more than one key in Redis
- Map a record as an attribute of another JSON key in Redis (nesting)

## Ingest pipeline lifecycle

- Deploy - when a user deploys the pipeline it is validated and then based on the configurations, RDI operator creates and configures the Collector and the Stream Processor that will run this pipeline.
- Snapshot - The Collector will start the pipeline by creating a snapshot of the dataset specified in the pipeline from the source database and will stream into RDI Redis database. The Stream Processor will process the snapshot and write the records into the target Redis. Keep in mind that hydrating Redis with snapshot data might take a long time depending on the size of the data.
- CDC - When the creation of the snapshot is done, the Collector starts listening to updates made on the data. Committed changes are picked and shipped to RDI. In this mode RDI keeps processing and writing to the target ongoing changes. 
- Update - When the user updates the pipeline, the operator picks up the new version and applies it to the processor and the collector. Unless the user asked to stop and reset the pipeline, the changes will only apply to new data.
- Reset - In case the user wants to refresh the data in Redis or a very long disconnect (typically several hours) dictates a new full sync, RDI will make the pipeline go back to Snapshot mode. 




