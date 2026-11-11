---
bannerText: The Redis Arrow Flight server is a pre-1.0 project that changes frequently. Behavior, storage formats, and supported SQL can change between releases.
categories:
- docs
- integrate
- oss
- rs
- rc
description: Access Redis over the network with Apache Arrow Flight, Flight SQL, and JDBC.
group: service
hideListLinks: true
linkTitle: Redis Arrow Flight server
summary: The Redis Arrow Flight server exposes Redis to SQL, Arrow, and JDBC clients over a single gRPC endpoint.
title: Redis Arrow Flight server
type: integration
weight: 2
---

The Redis Arrow Flight server is a Go service that exposes Redis through one
network endpoint. Clients connect with
[Apache Arrow Flight](https://arrow.apache.org/docs/format/Flight.html) or
[Flight SQL](https://arrow.apache.org/docs/format/FlightSql.html), over gRPC (a
remote procedure call framework). You can reach it from Python and Go with
Arrow libraries, and from Java Database Connectivity (JDBC) tools such as
DBeaver, with the Flight SQL JDBC driver.

The [Redis Arrow Flight server project](https://github.com/redis/redis-apache-arrow-flight)
is open source.

## When to use the server

To build an application, use the
[Redis client library](/content/develop/clients/_index.md) for your
programming language. Use the Flight server when a tool needs SQL or Arrow
over the network and can't load the
[Redis ADBC driver](https://github.com/redis/redis-adbc-driver) itself, such
as a JDBC application, or when you want one shared endpoint for several
clients.

## Two ways to use Redis through the server

The server offers two interfaces on the same endpoint:

| | Flight SQL | Flight datasets |
| :-- | :-- | :-- |
| Use it for | Filters, aggregates, joins, updates, and bulk loading | Uploading, downloading, and listing named Arrow tables |
| How data is stored | One Redis hash per row, with a Query Engine index per table | Arrow data stored by column and batch under the `arrowflight:` key prefix |
| Reading data | SQL predicates, projections, and aggregations | Selected columns and batch ranges |
| Clients | ADBC, JDBC, and other Flight SQL clients | Arrow Flight clients such as `pyarrow.flight` |

You can combine them: upload a dataset, then load selected rows from it into
a SQL table.

The SQL interface runs on the
[Redis ADBC driver](/content/integrate/redis-adbc-driver/_index.md), so SQL
tables follow the driver's data model and SQL dialect.

## Requirements

The SQL interface needs a Redis database with the Query Engine (Search)
enabled, as the ADBC driver does. See the
[ADBC driver requirements](/content/integrate/redis-adbc-driver/_index.md#requirements)
for supported deployments and the databases that aren't supported.

## Limitations

- **The published server has no authentication or TLS.** Every client runs
  with the Redis credentials in the server's `REDIS_URI`, and traffic between
  clients and the server, and between the server and Redis, isn't encrypted.
  The authentication and TLS options exist, but the published release and
  container image refuse to start when you use them. Run the server only on a
  trusted network. See [Run the server](/content/integrate/redis-arrow-flight/install.md).
- **Tables aren't shared with current ADBC driver releases.** The server
  embeds its own snapshot of the ADBC driver, which is older than the latest
  `adbc-driver-redis` package. The two use different storage formats, and the
  driver refuses to open a database that the server has already created tables
  in. Use one or the other for a given database.
- **There are no transactions.** Every statement commits on its own.
  Transactions, savepoints, and Substrait plans aren't supported.
- **The health check reports `UNKNOWN`.** Verify that the server is ready by
  running a query.

For the full capabilities list, see the project's
[Flight endpoint capabilities](https://redis.github.io/redis-apache-arrow-flight/docs/flight-capabilities/).

## Data tools

The project documents how to connect these tools and records what it tested.
Each guide lists its own limitations, and some tools haven't been tested.

| Tool | Connects with | Guide |
| :-- | :-- | :-- |
| Python and PyArrow | Flight SQL through ADBC, and `pyarrow.flight` | [Python guide](https://redis.github.io/redis-apache-arrow-flight/docs/integrations/python/) |
| Go | Flight SQL or Flight clients | [Go guide](https://redis.github.io/redis-apache-arrow-flight/docs/integrations/go/) |
| Java | Flight SQL JDBC driver | [Java guide](https://redis.github.io/redis-apache-arrow-flight/docs/integrations/java/) |
| DBeaver | Flight SQL JDBC driver | [DBeaver guide](https://redis.github.io/redis-apache-arrow-flight/docs/dbeaver/) |
| Other JDBC applications | Flight SQL JDBC driver | [JDBC applications guide](https://redis.github.io/redis-apache-arrow-flight/docs/integrations/jdbc-applications/) |
| Metabase | Community Flight SQL plugin | [Metabase guide](https://redis.github.io/redis-apache-arrow-flight/docs/integrations/metabase/) |
| Apache Airflow | Flight SQL through ADBC | [Airflow guide](https://redis.github.io/redis-apache-arrow-flight/docs/integrations/airflow/) |
| Dagster | Flight SQL through ADBC | [Dagster guide](https://redis.github.io/redis-apache-arrow-flight/docs/integrations/dagster/) |

The project's
[client compatibility matrix](https://redis.github.io/redis-apache-arrow-flight/docs/client-compatibility/)
lists tested versions and the scope of each check.

## Next steps

- [Run the server](/content/integrate/redis-arrow-flight/install.md)
- [Connect and query](/content/integrate/redis-arrow-flight/connect.md)
