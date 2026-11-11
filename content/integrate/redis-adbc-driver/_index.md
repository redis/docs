---
bannerText: The Redis ADBC driver is a pre-1.0 project that changes frequently. Behavior, storage formats, and supported SQL can change between releases.
categories:
- docs
- integrate
- oss
- rs
- rc
description: Query Redis with SQL and exchange data as Apache Arrow.
group: library
linkTitle: Redis ADBC driver
summary: The Redis ADBC driver lets data tools query Redis with SQL and move data as Apache Arrow.
title: Redis ADBC driver
type: integration
weight: 1
---

The Redis Arrow Database Connectivity (ADBC) driver lets you query Redis with
SQL and exchange data as [Apache Arrow](https://arrow.apache.org/) record
batches. [ADBC](https://arrow.apache.org/adbc/) is an Arrow standard for
database drivers, so any tool that can load an ADBC driver can connect to
Redis with it. Examples include pandas, Polars, DuckDB, SQLAlchemy, Apache
Airflow, and Dagster.

The [Redis ADBC driver project](https://github.com/redis/redis-adbc-driver)
is open source under the Apache 2.0 license.

## When to use the driver

To build an application, use the
[Redis client library](/content/develop/clients/_index.md) for your
programming language. The ADBC driver is an alternative for work that fits SQL
and Arrow, such as analytics, notebooks, dashboards, and data pipelines.

The driver supports:

- SQL reads, inserts, updates, and deletes.
- Analytical queries with filters, grouping, and aggregates.
- Bulk loading of Arrow data.
- Typed Arrow results, with supported filters and aggregations run by the
  Redis [Query Engine](/content/develop/ai/search-and-query/_index.md).

Tools that can't load an ADBC driver, such as JDBC applications, can connect
through the [Redis Arrow Flight server](/content/integrate/redis-arrow-flight/_index.md)
instead. The server embeds its own, older copy of the driver, and the two
don't share a database.

## How it works

You create SQL tables through the driver. Each table has a Query Engine index,
and the driver stores each row as a Redis hash under keys that it manages. The
key names are internal, so use SQL or the driver's tools to read and change
table data rather than reading or writing those keys directly.

Hashes that your applications already write don't appear as SQL tables
automatically. The driver's `redis-adbc` command-line tool can copy them into a
table or adopt them in place. See
[Existing HASH collections](https://redis.github.io/redis-adbc-driver/docs/driver-reference/#existing-hash-collections-redis-adbc)
in the driver reference.

The driver doesn't upgrade tables that earlier storage formats created, so a
driver upgrade can require you to re-create or reload tables. Check the
[driver reference](https://redis.github.io/redis-adbc-driver/docs/driver-reference/)
before you upgrade a database that holds data you need to keep.

## Requirements

The driver needs a Redis database with the Query Engine (Search) enabled. It
checks for Search when it connects and refuses to connect without it. The
project tests against:

- Redis Open Source 8.6.2, standalone and clustered
- Redis Software, with Redis 8.8 databases
- Redis Cloud, with Redis 8.6.2 databases

For Redis Software and Redis Cloud databases that support it, set the
[query performance factor](/content/operate/oss_and_stack/stack-with-enterprise/search/query-performance-factor.md)
(QPF) to 4× and provision enough CPU for it. QPF is a performance
recommendation, not a connection requirement.

The driver doesn't support:

- Redis Flex databases.
- Valkey, or Redis 7.2 derivatives such as Amazon ElastiCache and Google Cloud
  Memorystore.

For tested versions and results, see the project's
[compatibility details](https://redis.github.io/redis-adbc-driver/docs/compatibility/).

## Limitations

- **The driver is autocommit only.** Every statement commits on its own.
  `BEGIN` and `COMMIT` are accepted for compatibility with SQL written for
  PostgreSQL, but they have no effect. `ROLLBACK` undoes nothing: a row that
  you insert between `BEGIN` and `ROLLBACK` stays in the table. `SAVEPOINT` is
  not supported.
- **Wheels cover limited platforms.** The Python package includes the native
  driver for Linux (x86-64 and ARM64, glibc 2.28 or later) and macOS on Apple
  silicon (macOS 15 or later). There are no wheels for Windows, Intel Macs, or
  musl-based Linux.
- **Unconstrained `NUMERIC` expressions can break some readers.** A
  calculation such as `SUM(quantity * unit_price)` returns a 256-bit Arrow
  decimal whose precision depends on the data. Some readers, including recent
  Polars versions, can't import it. Cast the result to a fixed precision, such
  as `CAST(SUM(quantity * unit_price) AS NUMERIC(12,2))`.

For the complete list of supported SQL and limits, see the
[driver reference](https://redis.github.io/redis-adbc-driver/docs/driver-reference/).

## Data tools

The project documents how to connect these tools. Each guide lists its own
version requirements and limitations, and some tools need custom code rather
than a ready-made integration.

| Tool | Guide |
| :-- | :-- |
| pandas | [pandas guide](https://redis.github.io/redis-adbc-driver/docs/integrations/pandas/) |
| Polars | [Polars guide](https://redis.github.io/redis-adbc-driver/docs/integrations/polars/) |
| SQLAlchemy | [SQLAlchemy guide](https://redis.github.io/redis-adbc-driver/docs/integrations/sqlalchemy/) |
| Apache Superset | [Superset guide](https://redis.github.io/redis-adbc-driver/docs/integrations/superset/) |
| DuckDB | [DuckDB guide](https://redis.github.io/redis-adbc-driver/docs/duckdb/) |
| Apache Airflow | [Airflow guide](https://redis.github.io/redis-adbc-driver/docs/integrations/airflow/) |
| Dagster | [Dagster guide](https://redis.github.io/redis-adbc-driver/docs/integrations/dagster/) |
| Prefect | [Prefect guide](https://redis.github.io/redis-adbc-driver/docs/integrations/prefect/) |
| dlt | [dlt guide](https://redis.github.io/redis-adbc-driver/docs/integrations/dlt/) |

The project's
[ecosystem comparison](https://redis.github.io/redis-adbc-driver/docs/data-engineering-adbc-support/)
covers about 50 tools, including which connection paths are tested and which
need custom work.

## Next steps

- [Install and connect](/content/integrate/redis-adbc-driver/install.md)
- [Query Redis with SQL and Arrow](/content/integrate/redis-adbc-driver/quick-start.md)
