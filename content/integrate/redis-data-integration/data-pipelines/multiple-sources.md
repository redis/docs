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

One RDI pipeline can capture changes from several source databases and write them all to
the same Redis target. Each source gets its own collector, its own credentials, and its
own set of Redis streams, so the sources stay independent. The sources can be of different 
database types.

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

RDI derives the names of resources associated with the source from its name. See the
following section for additional details.

Each source also accepts an optional `name` property, which is a free-text display name
of up to 100 characters. Unlike the source name, it is not used as an identifier.

## What a source name determines

The source name determines the prefix of the environment variables that hold the
source's credentials. RDI builds the prefix by upper-casing the name, replacing each
dash with an underscore, and appending `_DB`:

| Source name | Environment variable prefix | Credential references in `config.yaml` |
| :-- | :-- | :-- |
| `mysql` | `MYSQL_DB` | `${MYSQL_DB_USERNAME}`, `${MYSQL_DB_PASSWORD}` |
| `orders-eu` | `ORDERS_EU_DB` | `${ORDERS_EU_DB_USERNAME}`, `${ORDERS_EU_DB_PASSWORD}` |

Such references must be used in a source's `connection` section to reference credentials
saved as pipeline secrets.

If you manage the RDI cluster yourself, you also see the source name in the names of the
resources RDI creates for it. For a source named `mysql`, the Kubernetes secret is
`mysql-db`, the collector deployment is `collector-mysql`, and the Redis streams are
`data:{rdi}:mysql.<schema>.<table>`.

## Configure several sources

Add one entry per source. The following example captures from a MySQL database and a
PostgreSQL database, each with its own credentials:

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

The secrets can then be referenced in the corresponding source configuration as `${MYSQL_DB_USERNAME}`,
`${MYSQL_DB_PASSWORD}`, `${POSTGRESQL_DB_USERNAME}`, `${POSTGRESQL_DB_PASSWORD}`, `${TARGET_DB_PASSWORD}`,
as in the previous example.

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

In a pipeline with a single source, `server_name` is optional. Omitting it means the
job does not filter by source.

## Add or remove a source

To add a source, set its secrets first, then add it to `config.yaml` and deploy. Adding a 
source does not interrupt other sources that are already running.

To remove a source, delete its entry from `config.yaml` and deploy. RDI removes the
source's collector. Its secrets, streams, and dead-letter queue entries remain and have
to be cleaned up manually.

Note that renaming a source is not supported; renaming a source in `config.yaml` is equivalent
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

Two behaviors are worth knowing:

- A single source runs only while its pipeline runs. Starting one source does not start a
  stopped pipeline.
- Stopping one source leaves the others running. Similarly, when one source fails, the other
  sources keep capturing changes.

A source of type `external` has no collector, so you cannot start or stop it.

## Monitor each source

Use [`redis-di describe`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-describe" >}})
to see the state of every source at once.

Its `Sources` section lists each source with its sync mode and whether it is connected, and
its `Components` section lists one collector per source. Errors are reported against the
component they came from. See the reference page for the command for more details.

Each source's collector has its own metric collection, named after the collector, such as
`collector-mysql_metrics`. In Prometheus, the stream processor's `rdi_incoming_entries` and
`rdi_stream_event_latency_ms` metrics carry a `data_source` label that includes the source
name, so you can break both of them down per source. See
[Stream processor metrics]({{< relref "/integrate/redis-data-integration/observability#stream-processor-metrics" >}})
and, for the per-source collector endpoints,
[Accessing the metrics]({{< relref "/integrate/redis-data-integration/observability#accessing-the-metrics" >}}).

Dead-letter queue tables are reported as `<source>.<schema>.<table>`, so rejected records
are attributed to their source. See
[Rejected records]({{< relref "/integrate/redis-data-integration/data-pipelines/rejected-records" >}}).

## Existing sources are unaffected by the changes

Before RDI supported several sources, every source-scoped resource was named using `source`
in place of the actual source name in `config.yaml`. Pipeline sources that existed
before upgrading to RDI 2.0.0 keep using those names to ensure continuity:

- The `source-db` and `source-db-ssl` secrets, and the `SOURCE_DB_*` environment
  variables, so its `connection` keeps referencing `${SOURCE_DB_USERNAME}` and
  `${SOURCE_DB_PASSWORD}` regardless of its name.
- The `collector-source` collector.
- Its existing streams, `data:{rdi}:<schema>.<table>`, and its captured position.
- `rdi` as its `server_name`.

See [Upgrading RDI]({{< relref "/integrate/redis-data-integration/installation/upgrade" >}}).
