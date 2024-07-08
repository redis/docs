---
Title: Configure data pipelines
linkTitle: Configure
description: Learn how to configure ingest pipelines for data transformation
weight: 1
alwaysopen: false
categories: ["redis-di"]
aliases:
---

RDI implements
[change data capture](https://en.wikipedia.org/wiki/Change_data_capture) (CDC)
with *pipelines*. (See the
[architecture overview]({{< relref "/integrate/redis-data-integration/ingest/architecture#overview" >}})
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

The data tranformation involves two separate stages. First, the data ingested by
[Debezium](https://debezium.io/) is automatically transformed to a JSON format. Then,
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

{{< image filename="/images/rdi/data-transformation-pipeline.png" >}}

## Pipeline configuration

RDI uses a set of [YAML](https://en.wikipedia.org/wiki/YAML)
files to configure each pipeline. The following diagram shows the folder
structure of the configuration:

{{< image filename="images/rdi/ingest/ingest-config-folders.svg" >}}

The main configuration for the pipeline is in the `config.yaml` file.
This specifies the connection details for the source database (such
as host, username, and password) and also the queries that RDI will use
to extract the required data. You should place job configurations in the `Jobs`
folder if you want to specify your own data transformations.

The sections below describe the two types of configuration file in more detail.

## The `config.yaml` file

Here is an example of a `config.yaml` file. Note that the values of the
form "${name}" refer to environment variables that are set elsewhere. In particular,
you should normally use environment variables as shown to set the source
username and password rather than storing them in the clear in this
file (see [Set secrets](#set-secrets) below for more information).

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
  # Advanced collector properties (optional):
  # advanced:
  # Sink collector properties - see the full list at https://debezium.io/documentation/reference/stable/operations/debezium-server.html#_redis_stream
  #   sink:
  #     redis.memory.limit.mb: 100
  #     redis.memory.threshold.percentage: 85
  # Source specific properties - see the full list at https://debezium.io/documentation/reference/stable/connectors/
  #   source:
  #     snapshot.mode: initial
  # Quarkus framework properties - see the full list at https://quarkus.io/guides/all-config
  #   quarkus:
  #     banner.enabled: "false"
targets:
  my-redis:
    connection:
      type: redis
      host: localhost
      port: 12000
# The names of the following files should match the ones you used
# when setting the TLS/mTLS secrets. Set only `cacert` if you are using
# TLS, but set all three if you are using mTLS:
#     key: /etc/certificates/target_db/redis.key
#     cert: /etc/certificates/target_db/redis.crt
#     cacert: /etc/certificates/target_db/ca.crt
```

The main sections of the file configure [`sources`](#sources) and [`targets`](#targets).

### Sources

The `sources` section has a subsection for the source that
you need to configure. The source section starts with a unique name
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
- `advanced`: These optional properties configure other Debezium-specific features.
  The available sub-sections are:
  - `sink`: All advanced properties for writing to RDI (TLS, memory threshold, etc).
    See the Debezium [Redis stream properties](https://debezium.io/documentation/reference/stable/operations/debezium-server.html#_redis_stream)
    page for the full set of available properties.
  - `source`: All advanced connector properties (for example, RAC nodes).
    See [Database-specific connection properties](#db-connect-props) below and also
    see the
    Debezium [Connectors](https://debezium.io/documentation/reference/stable/connectors/)
    pages for more information about the properties available for each database type.
  - `quarkus`: All advanced properties for Debezium server, such as the log level. See the
    Quarkus [Configuration options](https://quarkus.io/guides/all-config)
    docs for the full set of available properties.

    

### Targets

Use this section to provide the connection details for the target Redis
database(s). As with the sources, you should start each target section
with a unique name that you are free to choose (here, we have used
`my-redis` as an example). In the `connection` section, you can supply the
`type` of target database, which will generally be `redis` along with the
`host` and `port` of the server. You can also supply connection credentials
and TLS/mTLS secrets here if you use them.

### Database-specific connection properties {#db-connect-props}

Use the following properties in the [`sources.advanced.source`](#sources) section
of `config.yaml` for more control over RDI's connection to your database.

#### MySQL/MariaDB

See the
[Debezium SSL mode properties](https://debezium.io/documentation/reference/stable/connectors/mysql.html#mysql-property-database-ssl-mode)
for a full list of properties specific to MySQL/MariaDB.

- [`database.ssl.keystore`](https://debezium.io/documentation/reference/stable/connectors/mysql.html#mysql-property-database-ssl-keystore):
  (Optional) The location of the key store file. Use this for two-way authentication between
  your client and the MySQL/MariaDB Server.
- [`database.ssl.keystore.password`](https://debezium.io/documentation/reference/stable/connectors/mysql.html#mysql-property-database-ssl-keystore-password):
  (Optional) The password for the key store file. You only need this if you have also configured
  `database.ssl.keystore`.
- [`database.ssl.truststore`](https://debezium.io/documentation/reference/stable/connectors/mysql.html#mysql-property-database-ssl-truststore):
  The location of the trust store file to use for server certificate verification.
- [`database.ssl.truststore.password`](https://debezium.io/documentation/reference/stable/connectors/mysql.html#mysql-property-database-ssl-truststore-password):
  The password for the trust store file. This is required both to check the integrity of the truststore
  and to unlock it.

#### PostgreSQL

See the
[Debezium connector properties](https://debezium.io/documentation/reference/stable/connectors/postgresql.html#postgresql-connector-properties)
for a full list of properties specific to PostgreSQL.

- [`database.sslcert`](https://debezium.io/documentation/reference/stable/connectors/postgresql.html#postgresql-property-database-sslcert):
  The file path for the client's SSL certificate for the client. See
  [Database Connection Control Functions](https://www.postgresql.org/docs/current/libpq-connect.html)
  in the PostgreSQL docs for more information.
- [`database.sslkey`](https://debezium.io/documentation/reference/stable/connectors/postgresql.html#postgresql-property-database-sslkey):
  The file path for the client's SSL private key. See
  [Database Connection Control Functions](https://www.postgresql.org/docs/current/libpq-connect.html)
  in the PostgreSQL docs for more information.
- [`database.sslpassword`](https://debezium.io/documentation/reference/stable/connectors/postgresql.html#postgresql-property-database-sslpassword):
  The password for the client's private key file as specified `database.sslkey`. See
  [Database Connection Control Functions](https://www.postgresql.org/docs/current/libpq-connect.html)
  in the PostgreSQL docs for more information.
- [`database.sslrootcert`](https://debezium.io/documentation/reference/stable/connectors/postgresql.html#postgresql-property-database-sslrootcert):
  The file path for the root certificate(s) used to validate the server. See
  [Database Connection Control Functions](https://www.postgresql.org/docs/current/libpq-connect.html)
  in the PostgreSQL docs for more information.

#### Oracle

See the Kafka
[configuration docs](https://kafka.apache.org/documentation.html#configuration)
for a full list of properties relevant to Oracle configuration.
Where a property has a `<role>` element, you can set the role to be
either `producer` or `consumer`, as appropriate.

- [`schema.history.internal.<role>.security.protocol`](https://kafka.apache.org/documentation.html#consumerconfigs_security.protocol):
  The protocol for communicating with brokers. This can take the values
  `PLAINTEXT`, `SSL`, `SASL_PLAINTEXT`, and `SASL_SSL`.
- [`schema.history.internal.<role>.ssl.keystore.location`](https://kafka.apache.org/documentation.html#producerconfigs_ssl.keystore.location):
  The file path for the keystore.
- [`schema.history.internal.<role>.ssl.keystore.password`](https://kafka.apache.org/documentation.html#producerconfigs_ssl.keystore.password):
  The password for the keystore file. You only need this you have also set
  `schema.history.internal.<role>.ssl.keystore.location`.
- [`schema.history.internal.<role>.ssl.truststore.location`](https://kafka.apache.org/documentation.html#producerconfigs_ssl.truststore.location):
  The file path for the truststore.
- [`schema.history.internal.<role>.ssl.truststore.password`](https://kafka.apache.org/documentation.html#producerconfigs_ssl.truststore.password):
  The password for the trust store file. If you don't set a password, RDI will still use the trust store
  file specified in `schema.history.internal.<role>.ssl.truststore.location` but without integrity
  checking.
- [`schema.history.internal.<role>.ssl.key.password`](https://kafka.apache.org/documentation.html#producerconfigs_ssl.key.password):
  The password for the private key in the keystore file specified in
  `schema.history.internal.<role>.ssl.keystore.location`.
- [`database.dbname`](https://debezium.io/documentation/reference/stable/connectors/oracle.html#oracle-property-database-dbname):
  The name of the database you want to connect to. If you are using a container database environment,
  then you should set this to the name of the root container database (CDB), rather than an included
  pluggable database (PDB).
- [`database.pdb.name`](https://debezium.io/documentation/reference/stable/connectors/oracle.html#oracle-property-database-pdb-name):
  The name of the Oracle pluggable database you want to connect to. You can only use this with
  container database (CDB) installations.
- [`decimal.handling.mode`](https://debezium.io/documentation/reference/stable/connectors/oracle.html#oracle-property-decimal-handling-mode):
  This specifies the data format for floating point values in `NUMBER`, `DECIMAL` and `NUMERIC`
  columns. This can take the values `precise` (store values with any number of decimal places),
  `double` (use double-precision floating point), or `string` (encode numbers as strings).
  The default value is `precise`. See
  [Oracle numeric types](https://debezium.io/documentation/reference/stable/connectors/oracle.html#oracle-numeric-types)
  for more information about decimal handling.
- `key.converter.schemas.enable` and `value.converter.schemas.enable`:
  Boolean values specifying whether or not you want to add JSON schemas to
  serialized data. See Kafka's [connect transforms](https://kafka.apache.org/documentation/#connect_transforms)
  docs for an example.


## Job files

You can optionally supply one or more job files that specify how you want to
transform the captured data before writing it to the target.
Each job file contains a YAML
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
  use. You can add the following properties here:
  - `server_name`: Logical server name (optional). This corresponds to the `debezium.source.topic.prefix`
  property specified in the Debezium Server's `application.properties` config file.
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
  [data transformation reference]({{< relref "/integrate/redis-data-integration/ingest/reference/data-transformation" >}})
  for more details about the supported transformation blocks, and also the
  [JMESPath custom functions]({{< relref "/integrate/redis-data-integration/ingest/reference/jmespath-custom-functions" >}}) reference.

  {{< note >}}If you set `row_format` to `full` under the `source` settings, you can access extra data from the
  change record in the transformation:
  - Use the expression `key.key` to get the generated Redis key as a string.
  - Use `before.<FIELD_NAME>` to get the value of a field *before* it was updated in the source database
    (the field name by itself gives you the value *after* the update).{{< /note >}}
 
- `output`: This is a mandatory section to specify the data structure(s) that
  RDI will write to
  the target along with the text pattern for the key(s) that will access it.
  Note that you can map one record to more than one key in Redis or nest
  a record as a field of a JSON structure (see
  [Data denormalization]({{< relref "/integrate/redis-data-integration/ingest/data-pipelines/data-denormalization" >}})
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
[`rename_field`]({{< relref "/integrate/redis-data-integration/ingest/reference/data-transformation/rename_field" >}}) block. It also demonstrates how you can set the key of this record instead of relying on
the default logic. (See the
[Transformation examples]({{< relref "/integrate/redis-data-integration/ingest/data-pipelines/transform-examples" >}})
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
[RDI configuration file]({{< relref "/integrate/redis-data-integration/ingest/reference/config-yaml-reference" >}})
reference for full details about the
available source, transform, and target configuration options and see
also the
[data transformation reference]({{< relref "/integrate/redis-data-integration/ingest/reference/data-transformation" >}})
for details of all the available transformation blocks.

## Source preparation

Before using the pipeline you must first prepare your source database to use
the Debezium connector for *change data capture (CDC)*. See the
[architecture overview]({{< relref "/integrate/redis-data-integration/ingest/architecture#overview" >}})
for more information about CDC.
Each database type has a different set of preparation steps. You can
find the preparation guides for the databases that RDI supports in the
[Prepare source databases]({{< relref "/integrate/redis-data-integration/ingest/data-pipelines/prepare-dbs" >}})
section.

## Set secrets

Before you deploy your pipeline, you must set the authentication secrets for the
source and target databases. Each secret has a corresponding property name that
you can pass to the
[`redis-di set-secret`]({{< relref "/integrate/redis-data-integration/ingest/reference/cli/redis-di-set-secret" >}})
command to set the property's value. For example, you would use the
following command line to set the source database username to `myUserName`:

```bash
redis-di set-secret SOURCE_DB_USERNAME myUserName
```

The table below shows the property name for each secret. Note that the
username and password are required for the source and target, but the other
secrets are only relevant to TLS/mTLS connections.

| Property name | Description |
| :-- | :-- |
| `SOURCE_DB_USERNAME` | Username for the source database |
| `SOURCE_DB_PASSWORD` | Password for the source database |
| `SOURCE_DB_CACERT` | (For TLS only) Source database trust certificate |
| `SOURCE_DB_KEY` | (For mTLS only) Source database private key |
| `SOURCE_DB_CERT` | (For mTLS only) Source database public key |
| `SOURCE_DB_KEY_PASSWORD` | (For mTLS only) Source database private key password |
| `TARGET_DB_USERNAME` | Username for the target database |
| `TARGET_DB_PASSWORD` | Password for the target database |
| `TARGET_DB_CACERT` | (For TLS only) Target database trust certificate |
| `TARGET_DB_KEY` | (For mTLS only) Target database private key |
| `TARGET_DB_CERT` | (For mTLS only) Target database public key |
| `TARGET_DB_KEY_PASSWORD` | (For mTLS only) Target database private key password |

## Deploy a pipeline

If you are hosting RDI on your own VMs, you can use the
[`deploy`]({{< relref "/integrate/redis-data-integration/ingest/reference/cli/redis-di-deploy" >}})
command to deploy a configuration, including the jobs, once you have created them.

If your RDI CLI is deployed as a pod in a Kubernetes cluster, you should perform the following
steps to deploy a pipeline:

- Create a [ConfigMap](https://kubernetes.io/docs/concepts/configuration/configmap/) from the
  YAML files in your `jobs` folder:

  ```bash
  kubectl create configmap redis-di-jobs --from-file=jobs/
  ```

- Deploy your jobs:

  ```bash
  kubectl exec -it pod/redis-di-cli -- redis-di deploy
  ```

{{< note >}}When you create or modify a ConfigMap, it will be available in the `redis-di-cli` pod
after a short delay. Wait around 30 seconds before running the `redis-di deploy` command.{{< /note >}}

You have two options to update the ConfigMap:

- For smaller changes, you can edit the ConfigMap directly with this command:

  ```bash
  kubectl edit configmap redis-di-jobs
  ```

- For bigger changes, such as adding another job file, edit the files in your local `jobs` folder and then run this command:

  ```bash
  kubectl create configmap redis-di-jobs --from-file=jobs/ --dry-run=client -o yaml | kubectl apply -f -
  ```

{{< note >}} You must run `kubectl exec -it pod/redis-di-cli -- redis-di deploy` after updating the ConfigMap with either option.{{< /note >}}

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
