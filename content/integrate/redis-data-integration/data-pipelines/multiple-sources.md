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

> [!NOTE]
> You must use RDI API v2 to manage a pipeline with several sources. RDI API v1 supports only
> single-source pipelines. See the
> [RDI API migration guide](/content/integrate/redis-data-integration/reference/api-migration.md) for more information.

## Name your sources

Each source is an entry in the `sources` section of
[`config.yaml`](/content/integrate/redis-data-integration/data-pipelines/pipeline-config.md),
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

> [!WARNING]
> If your pipeline has a source created before RDI supported multiple sources, do not name a new
> source after any schema or database of that older source. The change data streams of the older
> source do not contain a source name segment, so a new source named after one of its schemas would claim keys
> that belong to the older source, and resetting or removing the new source would delete the older
> source's data. See
> [Existing names are kept after an upgrade](#existing-names-are-kept-after-an-upgrade).

RDI derives the environment variables that contain the source's credentials from the source
name. For example, the `connection` section of a source named `mysql` references `${MYSQL_DB_USERNAME}`
and `${MYSQL_DB_PASSWORD}`. See
[Set secrets](/content/integrate/redis-data-integration/data-pipelines/deploy.md#set-secrets)
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
| Change data streams | `data:{rdi}:mysql.<qualified_table_name>` |
| Dead-letter queue streams | `dlq:data:{rdi}:mysql.<qualified_table_name>` |
| Metric collection | `collector-mysql_metrics` |
| Metrics endpoint path on a VM installation | `/collector-mysql/metrics` |

In the stream names, `<qualified_table_name>` is the qualified table name:
`<database>.<table>` for MySQL and MariaDB, `<database>.<collection>` for MongoDB,
`<schema>.<table>` for Oracle, PostgreSQL, Snowflake, and Spanner, and
`<database>.<schema>.<table>` for SQL Server.

Each source also accepts an optional `name` property, which is a display name
of up to 100 characters. Unlike the source name, it is not used as an identifier,
so there is no restriction on the characters you can use.

## Configure several sources

Add one entry per source in the `config.yaml` file (see
[Pipeline configuration file](/content/integrate/redis-data-integration/data-pipelines/pipeline-config.md)
for a full description of this file).
[`redis-di scaffold`](/content/integrate/redis-data-integration/reference/cli/redis-di-scaffold.md)
generates a configuration with one source, named by its `--source-name` option, so add any
further sources by editing `config.yaml`.

Sources of different types can be mixed freely, but a source's collector `type` and its
`connection` type have to match. Use `cdc`, the default, for the relational databases and
MongoDB, `flink` for a Spanner connection, and `riotx` for a Snowflake connection. RDI
rejects any other combination when you deploy the pipeline. See
[Prepare source databases](/content/integrate/redis-data-integration/data-pipelines/prepare-dbs/_index.md)
to learn how to prepare each source database.

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
      public.clients: {}
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
[Transport Layer Security (TLS)](/content/integrate/redis-data-integration/data-pipelines/deploy.md#set-secrets)
connections, `CACERT`, `CERT`, `KEY`, and `KEY_PASSWORD`. Use `--db target` for the
target database: `redis-di set-secret PASSWORD --db target <password>`.

Each source's `connection` section then references its own secrets: `${MYSQL_DB_USERNAME}` and
`${MYSQL_DB_PASSWORD}` for `mysql`, `${POSTGRESQL_DB_USERNAME}` and `${POSTGRESQL_DB_PASSWORD}`
for `postgresql`, and `${TARGET_DB_PASSWORD}` for the target.

See [Set secrets](/content/integrate/redis-data-integration/data-pipelines/deploy.md#set-secrets)
for the full secret reference.

## Select sources in jobs

A [job](/content/integrate/redis-data-integration/data-pipelines/transform-examples/_index.md)
selects the source it processes by setting `server_name` to the source name:

```yaml
source:
  server_name: mysql
  db: inventory
  table: customers
```

When a pipeline has more than one source, every job must set `server_name`, and the value
must match one of the sources in `config.yaml`. RDI rejects the pipeline when a job has no
`server_name`, or when its `server_name` matches no source. The one exception is the default
job for `table: "*"`: it is a source-agnostic catch-all, so it needs no `server_name`.

For a source that existed before RDI supported multiple sources, set `server_name` to `rdi`
rather than to the name the source has in `config.yaml`. See
[Existing names are kept after an upgrade](#existing-names-are-kept-after-an-upgrade).

In a pipeline with a single source, `server_name` is optional. If you omit it, the
job does not filter by source.

No two jobs may select the same records, so make sure the source selectors of your jobs do
not overlap. RDI rejects the pipeline when it finds two jobs that intersect.

With the [Flink processor](/content/integrate/redis-data-integration/architecture/classic-vs-flink.md),
`server_name` also accepts a list of source names, and an entry prefixed with `regex:` selects
all sources that match the regular expression, so one job can process multiple tables,
potentially from different sources, databases, or schemas. See
[Job files](/content/integrate/redis-data-integration/data-pipelines/transform-examples/_index.md)
for details.

## Add or remove a source

To add a source, set its secrets first, then add it to `config.yaml` and deploy. Adding a
source does not interrupt other sources that are already running.

To remove a source, delete its entry from `config.yaml` and deploy. RDI removes the source's
collector and deletes that source's data from the RDI database, including its change data streams,
Debezium offsets, schema history, dead-letter queue entries, statistics, deduplication state,
and record counters. The other sources keep their data, and RDI stops the whole pipeline
while the deletion runs and starts it again afterwards. No further action is
needed for this cleanup, but it means that a source you add later under the same name starts
from a new
[initial snapshot](/content/integrate/redis-data-integration/architecture/_index.md)
rather than from the position it had reached.

The source's secrets are not deleted, so remove them yourself with
[`redis-di delete-secret`](/content/integrate/redis-data-integration/reference/cli/redis-di-delete-secret.md)
if you no longer need them. The records the pipeline wrote to the target database are not deleted
either.

Adding the same source again is straightforward, unless the source you removed predates RDI's support
for multiple sources. For such a source the names from before the upgrade are kept only while it
exists, so any source you add under the same name is treated as a new source, for which RDI derives the
names instead. Adapt the configuration accordingly:

- Set the source's secrets again, for example
  `redis-di set-secret PASSWORD --db mysql <password>`.
- Change the secret references in its `connection` section from `${SOURCE_DB_*}` to
  `${MYSQL_DB_*}`, for a source named `mysql`.
- Change `server_name` from `rdi` to the source name in every job associated with it.

See
[Redeploying a configuration after clearing a pipeline](#redeploying-a-configuration-after-clearing-a-pipeline)
for a before and after example, and
[Existing names are kept after an upgrade](#existing-names-are-kept-after-an-upgrade)
for the full list of names involved.

Note that renaming a source is not supported. Renaming a source in `config.yaml` is equivalent
to removing the source and adding a new source with the new name. This implies in particular:

- You must create the source's secrets under the new name and update `${...}` references in
  its `connection` section.
- You must update `server_name` for every job that reads from the source.
- The data present in the RDI database under the old name is deleted, as it is for any removed source.
- The source starts with a new
  [initial snapshot](/content/integrate/redis-data-integration/architecture/_index.md).

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
source's resources in place. RDI records a captured position for each source, so when you restart a collector, it resumes from where it stopped.

Resetting a single source deletes that source's data from the RDI database, including its change data streams, Debezium
offsets, schema history, dead-letter queue entries, statistics, deduplication state, and record counters.
A new [initial snapshot](/content/integrate/redis-data-integration/architecture/_index.md) is then
taken for that source, while every other source keeps its data. RDI stops the whole pipeline while
the reset runs and starts it again afterwards, exactly as it does for a reset of the whole
pipeline.

## Monitor each source

Use [`redis-di describe`](/content/integrate/redis-data-integration/reference/cli/redis-di-describe.md)
to see the state of every source at once.

In its output, the `Sources` section lists each source with its sync mode and
whether it is connected.
The `Components` section lists one collector per source. Errors are reported against the
component they came from. See the
[`redis-di describe`](/content/integrate/redis-data-integration/reference/cli/redis-di-describe.md)
reference page for more details.

Note that while the sources are independent of each other in the data they capture, the
pipeline status is not broken down per source. RDI reports the whole pipeline in an error state when a
single source fails, so you should use the `Components` section to find out which one has failed.

Each Debezium collector has its own metric collection, named after the collector, such as
`collector-mysql_metrics`. The Flink and RIOT-X collectors don't have metric collections.

In Prometheus, you can break the per-stream record counters down per source, since the stream
name contains the source name. With the
[Flink processor](/content/integrate/redis-data-integration/architecture/classic-vs-flink.md)
the counters are reported by
`flink_jobmanager_job_operator_coordinator_stream_type_rdiRecords`, which has a `stream`
label; with the classic processor they are reported by `rdi_incoming_entries`, which has an
equivalent `data_source` label. See
[Flink processor metrics](/content/integrate/redis-data-integration/observability.md#flink-processor-metrics),
[Stream processor metrics](/content/integrate/redis-data-integration/observability.md#stream-processor-metrics),
and, for the per-source collector endpoints,
[Accessing the metrics](/content/integrate/redis-data-integration/observability.md#accessing-the-metrics).

Dead-letter queue streams have Redis keys containing a
`<source>.<qualified_table_name>` section.
This makes it easy to attribute rejected records to their source. See
[Rejected records](/content/integrate/redis-data-integration/data-pipelines/rejected-records.md) for more information.

## Existing names are kept after an upgrade

Before RDI supported multiple sources per pipeline, every source-scoped resource had
a name including the word `source` instead of the actual source name in `config.yaml`.
For a source that existed before you upgraded to a version that supports multiple sources,
those names are kept unchanged, regardless of what the source is called in `config.yaml`.
In particular, for such a source:

- Its secret environment variables are still named `SOURCE_DB_*`, so its `connection` section
  can keep referencing these secrets.
- Its Kubernetes secrets are still named `source-db` and `source-db-ssl`.
- Its Kubernetes deployment and other resources are still named `collector-source`.
- Its data streams are still named `data:{rdi}:<qualified_table_name>`, and its offset
  and schema history keys are still `metadata:debezium:offsets` and
  `metadata:debezium:schema_history`.
- Its `server_name` is still `rdi`, or, for a Spanner source, its instance ID.

RDI keeps these names in a mapping from the source name in `config.yaml` to
the internal name the source had before the upgrade. This mapping lasts only as long as the source
does: RDI discards it as soon as the source is removed from the configuration, whether you remove that one
source or
[clear the whole pipeline](/content/integrate/redis-data-integration/data-pipelines/deploy.md#clear-a-pipeline).
A source you add afterwards under the same name is treated as a new source, so
RDI derives its names from the source name. See
[Add or remove a source](#add-or-remove-a-source) for what you have to change in that case.

For a source you add after the upgrade under any other name, RDI derives all of these names
from the source name, as described on this page.

See [Upgrading RDI](/content/integrate/redis-data-integration/installation/upgrade.md)
for more information.

## Redeploying a configuration after clearing a pipeline

A configuration exported from an upgraded pipeline still references the names from before the
upgrade, so deploying it again after
[clearing the pipeline](/content/integrate/redis-data-integration/data-pipelines/deploy.md#clear-a-pipeline)
fails, because the mapping that made those names resolve is gone.

A source and a job of such an upgraded pipeline:

```yaml
sources:
  mysql:
    connection:
      user: ${SOURCE_DB_USERNAME}
      password: ${SOURCE_DB_PASSWORD}
```

```yaml
source:
  server_name: rdi
  db: inventory
  table: customers
```

The same source and job, adapted to deploy as a new source named `mysql`:

```yaml
sources:
  mysql:
    connection:
      user: ${MYSQL_DB_USERNAME}
      password: ${MYSQL_DB_PASSWORD}
```

```yaml
source:
  server_name: mysql
  db: inventory
  table: customers
```

Set the source's secrets under its actual name before you deploy:

```bash
redis-di set-secret USERNAME --db mysql <username>
redis-di set-secret PASSWORD --db mysql <password>
```

The source then takes a fresh
[initial snapshot](/content/integrate/redis-data-integration/architecture/_index.md), because the position it had
reached was deleted along with the rest of its data. Records the pipeline already wrote to the
target database are not deleted, so the snapshot overwrites them.
