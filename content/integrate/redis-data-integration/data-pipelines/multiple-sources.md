---
Title: Multiple sources in one pipeline
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Learn how to ingest from several source databases into one Redis target.
group: di
linkTitle: Multiple sources
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 4
---

One RDI pipeline can capture changes from several source databases and write them all to the
same Redis target. The sources can be of different database types and each has its
own collector, its own credentials, and its own set of Redis streams to ensure it
is independent of the other sources.

{{< note >}}Use RDI API v2 to manage a pipeline with several sources. RDI API v1 supports only
single-source pipelines. See the
[RDI API migration guide]({{< relref "/integrate/redis-data-integration/reference/api-migration" >}}).{{< /note >}}

## Name your sources

Each source is an entry in the `sources` section of
[`config.yaml`]({{< relref "/integrate/redis-data-integration/data-pipelines/pipeline-config" >}}),
with the source name as key:

```yaml
sources:
  mysql: # this source is named 'mysql'
    type: cdc
```

A source name must:

- Start with a lowercase letter.
- Contain only lowercase letters, digits, and dashes.
- End with a letter or a digit.
- Be at most 22 characters long.

The names `rdi` and `target` are reserved and cannot be used for sources.

RDI derives the environment variables that contain the source's credentials from the source
name, so the `connection` section of a source named `mysql` references `${MYSQL_DB_USERNAME}`
and `${MYSQL_DB_PASSWORD}`. See
[Set secrets]({{< relref "/integrate/redis-data-integration/data-pipelines/deploy#set-secrets" >}})
for details of how RDI derives those names and for the full list of secret keys.

The source name also appears in the resources RDI creates for the source. The table below
lists the names derived from a source named `mysql`.

| Resource | Name |
| :-- | :-- |
| Credentials secret | `mysql-db` |
| TLS secret | `mysql-db-ssl` |
| Environment variable prefix | `MYSQL_DB_` |
| Certificate directory | `/etc/certificates/mysql_db/` |
| Collector deployment | `collector-mysql` |
| Change data streams | `data:{rdi}:mysql.<schema_or_database>.<table>` |
| Dead-letter queue streams | `dlq:data:{rdi}:mysql.<schema_or_database>.<table>` |
| Metric collection | `collector-mysql_metrics` |
| Metrics endpoint path on a VM installation | `/collector-mysql/metrics` |

Each source also accepts an optional `name` property, which is a display name
of up to 100 characters. Unlike the source name, it is not used as an identifier,
so there is no restriction on the characters you can use.

## Configure several sources

Add one entry per source in the `config.yaml` file (see
[Pipeline configuration file]({{< relref "/integrate/redis-data-integration/data-pipelines/pipeline-config" >}})
for a full description of this file).
[`redis-di scaffold`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-scaffold" >}})
generates a configuration with one source, named by its `--source-name` option, so add any
further sources by editing `config.yaml`.

Sources of different types can be mixed freely, but a source's collector `type` and its
`connection` type have to match. Use `cdc`, the default, for the relational databases and
MongoDB, `flink` for a Spanner connection, and `riotx` for a Snowflake connection. RDI
rejects any other combination when you deploy the pipeline. See
[Prepare source databases]({{< relref "/integrate/redis-data-integration/data-pipelines/prepare-dbs" >}})
for how to prepare each source database.

The following example captures from a MySQL database and a PostgreSQL database, each with its
own credentials:

```yaml
sources:
  mysql:
    type: cdc
    connection:
      type: mysql
      host: <MYSQL_DB_HOST>
      port: 3306
      user: ${MYSQL_DB_USERNAME}
      password: ${MYSQL_DB_PASSWORD}
    databases:
      - inventory
    tables:
      inventory.customers: {}
      inventory.orders: {}
  postgresql:
    type: cdc
    connection:
      type: postgresql
      host: <POSTGRESQL_DB_HOST>
      port: 5432
      database: billing
      user: ${POSTGRESQL_DB_USERNAME}
      password: ${POSTGRESQL_DB_PASSWORD}
    schemas:
      - public
    tables:
      public.customers: {}
targets:
  target:
    connection:
      type: redis
      host: <TARGET_DB_HOST>
      port: 6379
      password: ${TARGET_DB_PASSWORD}
```

## Set secrets for each source

Set a source's credentials with the source name in the `--db` option:

```bash
redis-di set-secret USERNAME --db mysql <username>
redis-di set-secret PASSWORD --db mysql <password>
redis-di set-secret USERNAME --db postgresql <username>
redis-di set-secret PASSWORD --db postgresql <password>
```

The secret keys used as CLI arguments are the same for every source: `USERNAME`, `PASSWORD`, and, for
[Transport Layer Security (TLS)]({{< relref "/integrate/redis-data-integration/data-pipelines/deploy#set-secrets" >}})
connections, `CACERT`, `CERT`, `KEY`, and `KEY_PASSWORD`. Use `--db target` for the
target database: `redis-di set-secret PASSWORD --db target <password>`.

Each source's `connection` section then references its own secrets: `${MYSQL_DB_USERNAME}` and
`${MYSQL_DB_PASSWORD}` for `mysql`, `${POSTGRESQL_DB_USERNAME}` and `${POSTGRESQL_DB_PASSWORD}`
for `postgresql`, and `${TARGET_DB_PASSWORD}` for the target.

See [Set secrets]({{< relref "/integrate/redis-data-integration/data-pipelines/deploy#set-secrets" >}})
for the full secret reference.

## Select sources in jobs

A [job]({{< relref "/integrate/redis-data-integration/data-pipelines/transform-examples" >}})
selects the source it processes by setting `server_name` to the source name:

```yaml
source:
  server_name: mysql
  db: inventory
  table: customers
```

When a pipeline has more than one source, every job must set `server_name`, and the value has
to match one of the sources in `config.yaml`. RDI rejects the pipeline when a job has no
`server_name`, or when its `server_name` matches no source.

In a pipeline with a single source, `server_name` is optional. If you omit it, the
job does not filter by source.

No two jobs may select the same records, so make sure the source selectors of your jobs do
not overlap. RDI rejects the pipeline when it finds two jobs that intersect.

With the [Flink processor]({{< relref "/integrate/redis-data-integration/architecture/classic-vs-flink" >}}),
`server_name` also accepts a list of source names, and an entry prefixed with `regex:` selects
all sources that match the regular expression, so one job can process multiple tables,
potentially from different sources, databases, or schemas. See
[Job files]({{< relref "/integrate/redis-data-integration/data-pipelines/transform-examples" >}})
for details.

## Add or remove a source

To add a source, set its secrets first, then add it to `config.yaml` and deploy. Adding a
source does not interrupt other sources that are already running.

To remove a source, delete its entry from `config.yaml` and deploy. RDI removes the source's
collector and deletes the source's keys from the RDI database. No further action is
needed for this cleanup, but it means that a source you add later under the same name starts
from a new
[initial snapshot]({{< relref "/integrate/redis-data-integration/architecture" >}})
rather than resuming from the position it had reached.

The source's secrets are not deleted, so remove them yourself with
[`redis-di delete-secret`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-delete-secret" >}})
if you no longer need them.

Note that renaming a source is not supported. Renaming a source in `config.yaml` is equivalent
to removing the source and adding a new source with the new name. This implies in particular:

- The source's secrets have to be created under the new name and `${...}` references in
  its `connection` section updated.
- `server_name` has to be updated for every job that reads from the source.
- The source starts with a new
  [initial snapshot]({{< relref "/integrate/redis-data-integration/architecture" >}}).

## Start, stop, and reset a single source

Pass `--source` to act on a single source instead of the whole pipeline:

```bash
redis-di stop --source mysql
redis-di start --source mysql
redis-di reset --source mysql
```

A source runs only while its pipeline runs, so starting one source does not start a stopped
pipeline. Generally, stopping one source leaves the others running, and when one source fails, the other sources keep capturing changes. The only exception to this is a source of type
`external`. RDI creates no collector for this, so you cannot start or stop it.

Stopping a source scales its collector down to zero replicas and leaves the rest of the
source's resources in place. RDI records a captured position per source, so a collector you
start again resumes from where it stopped.

Resetting a single source deletes only that source's keys, so a new
[initial snapshot]({{< relref "/integrate/redis-data-integration/architecture" >}}) is taken for that source,
while the stream processor and the other sources keep running.

## Monitor each source

Use [`redis-di describe`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-describe" >}})
to see the state of every source at once.

In its output, the `Sources` section lists each source with its sync mode and
whether it is connected.
The `Components` section lists one collector per source. Errors are reported against the
component they came from. See the
[`redis-di describe`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-describe" >}})
reference page for more details.

Note that while the sources are independent of each other in the data they capture, the
pipeline status is not per source. RDI reports the whole pipeline in an error state when a
single source fails, so use the `Components` section to find out which one it is.

Each source's collector has its own metric collection, named after the collector, such as
`collector-mysql_metrics`. In Prometheus, the stream processor's `rdi_incoming_entries` and
`rdi_stream_event_latency_ms` metrics contain a `data_source` label that identifies the stream
the value belongs to, including the source name, so you can break both of them down per
source. See
[Stream processor metrics]({{< relref "/integrate/redis-data-integration/observability#stream-processor-metrics" >}})
and, for the per-source collector endpoints,
[Accessing the metrics]({{< relref "/integrate/redis-data-integration/observability#accessing-the-metrics" >}}).

Dead-letter queue streams have Redis keys containing a
`<source>.<schema_or_database>.<table>` section.
This makes it easy to attribute rejected records to their source. See
[Rejected records]({{< relref "/integrate/redis-data-integration/data-pipelines/rejected-records" >}}) for more information.

## Existing names are kept after an upgrade

Before RDI supported multiple sources per pipeline, every source-scoped resource had
a name including the word `source` instead of the actual source name in `config.yaml`.
For a source that existed before you upgraded to a version that supports multiple sources,
those names are kept unchanged, whatever the source is called in `config.yaml`.
In particular, for such a source:

- Its secret environment variables are still named `SOURCE_DB_*`, so its `connection` section
  can keep referencing these secrets.
- Its Kubernetes secrets are still named `source-db` and `source-db-ssl`.
- Its Kubernetes deployment and other resources are still named `collector-source`.
- Its data streams are still named `data:{rdi}:<schema_or_database>.<table>`, and its offset
  and schema history keys are still `metadata:debezium:offsets` and
  `metadata:debezium:schema_history`.
- Its `server_name` is still `rdi`.

For a source you add after the upgrade, RDI derives all of these names from the source name,
as described on this page.

See [Upgrading RDI]({{< relref "/integrate/redis-data-integration/installation/upgrade" >}})
for more information.
