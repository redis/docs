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

{{< note >}}Multiple sources require RDI API v2. RDI API v1 supports only single-source
pipelines. See the
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

The source name determines the environment variables that carry the source's credentials, so
a source named `mysql` references `${MYSQL_DB_USERNAME}` and `${MYSQL_DB_PASSWORD}` in its
`connection` section. See
[Set secrets]({{< relref "/integrate/redis-data-integration/data-pipelines/deploy#set-secrets" >}})
for details of how RDI derives those names and for the full list of secret keys.

The source name also appears in the resources RDI creates for the source. For example,
a source named `mysql`, would have a collector deployment named `collector-mysql` and
its Redis streams would be of the form `data:{rdi}:mysql.<schema>.<table>`.

Each source also accepts an optional `name` property, which is a display name
of up to 100 characters. Unlike the source name, it is not used as an identifier,
so there is no restriction on the characters you can use.

## Configure several sources

Add one entry per source in the `config.yaml` file (see
[Pipeline configuration file]({{< relref "/integrate/redis-data-integration/data-pipelines/pipeline-config" >}})
for a full description of this file). The following example captures from a MySQL database
and a PostgreSQL database, each with its own credentials:

```yaml
sources:
  mysql:
    type: cdc
    connection:
      type: mysql
      host: <mysql-host>
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
      host: <postgresql-host>
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
      host: <redis-target-host>
      port: <redis-target-port>
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

## Route jobs to a source

A [job]({{< relref "/integrate/redis-data-integration/data-pipelines/transform-examples" >}})
selects the source it processes by setting `server_name` to the source name:

```yaml
source:
  server_name: mysql
  db: inventory
  table: customers
```

When a pipeline has more than one source, every job must set `server_name`.

In a pipeline with a single source, `server_name` is optional. If you omit it, the
job does not filter by source.

`server_name` also accepts a list of source names, and an entry prefixed with `regex:` is
matched as a regular expression, so one job can serve several sources. See
[Job files]({{< relref "/integrate/redis-data-integration/data-pipelines/transform-examples" >}})
for details.

## Add or remove a source

To add a source, set its secrets first, then add it to `config.yaml` and deploy. Adding a 
source does not interrupt other sources that are already running.

To remove a source, delete its entry from `config.yaml` and deploy. RDI removes the
source's collector but the source's secrets are not deleted, so remove them yourself with
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

## Monitor each source

Use [`redis-di describe`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-describe" >}})
to see the state of every source at once.

In its output, the `Sources` section lists each source with its sync mode and
whether it is connected.
The `Components` section lists one collector per source. Errors are reported against the
component they came from. See the
[`redis-di describe`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-describe" >}})
reference page for more details.

Each source's collector has its own metric collection, named after the collector, such as
`collector-mysql_metrics`. In Prometheus, the stream processor's `rdi_incoming_entries` and
`rdi_stream_event_latency_ms` metrics carry a `data_source` label that identifies the stream
the value belongs to, including the source name, so you can break both of them down per
source. See
[Stream processor metrics]({{< relref "/integrate/redis-data-integration/observability#stream-processor-metrics" >}})
and, for the per-source collector endpoints,
[Accessing the metrics]({{< relref "/integrate/redis-data-integration/observability#accessing-the-metrics" >}}).

Dead-letter queue streams have Redis keys containing a `<source>.<schema>.<table>` section.
This makes it easy to attribute rejected records to their source. See
[Rejected records]({{< relref "/integrate/redis-data-integration/data-pipelines/rejected-records" >}}) for more information.

## Upgraded pipelines keep their existing names

Before RDI supported multiple sources per pipeline, every source-scoped resource had
a name including the word `source`
instead of the actual source name in `config.yaml`. A source that existed before you
upgraded to RDI 2.0.0 keeps those names, whatever it is called in `config.yaml`, so that it
keeps running unchanged. In particular, the following are still available:

- The `source-db` and `source-db-ssl` secrets and the `SOURCE_DB_*` environment variables,
  so its `connection` section keeps referencing `${SOURCE_DB_USERNAME}` and
  `${SOURCE_DB_PASSWORD}`.
- The `collector-source` collector.
- Its existing streams, `data:{rdi}:<schema>.<table>`, and its captured position.
- `rdi` as its `server_name`.

Sources you add after the upgrade use only their own names, as described on this page.

See [Upgrading RDI]({{< relref "/integrate/redis-data-integration/installation/upgrade" >}})
for more information.
