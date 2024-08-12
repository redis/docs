---
Title: Ingest
aliases: null
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: null
group: di
hideListLinks: false
linkTitle: Ingest
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 10
---

If you use a relational database as the *system of record* for your app,
you may eventually find
that its performance doesn't scale well as your userbase grows. It may be
acceptable for a few thousand users but for a few million, it can become a
major problem. If you don't have the option of abandoning the relational
database, you should consider using a fast
database, such as Redis, to cache data from read queries. Since read queries
are typically many times more common than writes, the cache will greatly
improve performance and let your app scale without a major redesign.

RDI keeps a Redis cache up to date with changes in the primary database, using a
[*Change Data Capture (CDC)*](https://en.wikipedia.org/wiki/Change_data_capture) mechanism.
It also lets you *transform* the data from relational tables into convenient
and fast data structures that match your app's requirements. You specify the
transformations using a configuration system, so no coding is necessary.

## Features

RDI provides enterprise-grade streaming data pipelines with the following features:

- **Near realtime pipeline** - The CDC system captures changes in very short time intervals,
  then ships and processes them in *micro-batches* to provide near real time updates to Redis.
- **At least once guarantee** - RDI will deliver any change to the selected data set at least
  once to the target Redis database.
- **Data integrity** - RDI keeps the data change order per source table or unique key.
- **High availability** - All stateless components have hot failover or quick automatic recovery.
  RDI state is always highly available using Redis Enterprise replication.
- **Easy to install and operate** - Use a self documenting command line interface (CLI)
  for all installation and day-two operations.
- **No coding needed** - Create and test your pipelines using Redis Insight.
- **Data-in-transit encryption** - RDI never persists data to disk. All data in-flight is
  protected using TLS or mTLS connections.
- **Observability - Metrics** - RDI collects data processing counters at source table granularity
  along with data processing performance metrics. These are available via GUI, CLI and 
  [Prometheus](https://prometheus.io/) endpoints.
- **Observability - logs** - RDI saves rotating logs to a single folder. They are in a JSON format,
  so you can collect and process them with your favorite observability tool.
- **Backpressure mechanism** - RDI is designed to backoff writing data when the cache gets
  disconnected, which prevents cascading failure. Since the change data is persisted in the source
  database and Redis is very fast, RDI can easily catch up with missed changes after a short period of
  disconnection. See [Backpressure mechanism]({{< relref "/integrate/redis-data-integration/ingest/architecture #backpressure-mechanism">}}) for more information.
- **Recovering from full failure** - If the cache fails or gets disconnected for a long time,
  RDI can reconstruct the cache data in Redis using a full snapshot of the defined dataset.
- **High throughput** - Because RDI uses Redis for staging and writes to Redis as a target,
  it has very high throughput. With a single processor core and records of about 1KB in size,
  RDI processes around 10,000 records per second. While taking the initial full *snapshot* of
  the source database, RDI automatically scales to a configurable number of processing units,
  to fill the cache as fast as possible.

## When to use RDI Ingest

RDI is designed to support apps that must use a disk based database as the system of record
but must also be fast and scalable. This is a common requirement for mobile and web
apps with a rapidly-growing number of users; the performance of the main database is fine at first
but it will soon struggle to handle the increasing demand without a cache.

You should use RDI when:

- You must use a slow database as the system of record for the app 
- The app must always *write* its data to the slow database
- You already intend to use Redis for the app cache
- The data changes frequently in small increments
- Your app can tolerate *eventual* consistency of data in the Redis cache

You should *not* use RDI when:

- You are migrating an existing data set into Redis only once
- The data is updated infrequently and in big batches
- Your app needs *immediate* cache consistency rather than *eventual* consistency
- The data is ingested from two replicas of Active-Active at the same time
- The app must *write* data to the Redis cache, which then updates the source database
- Your data set will only ever be small

## Supported source databases

RDI can capture data from any of the following sources:
| Database                    | Versions               |
| --------------------------- | ---------------------- |
| Oracle                      | 12c, 19c, 21c          |
| MariaDB                     | >= 10.5                |
| MySQL                       | 5.7, 8.0.x             |
| Postgres                    | 10, 11, 12, 13, 14, 15 |
| SQL Server                  | 2017, 2019             |
| Google Cloud SQL MySQL      | 8.0                    |
| Google Cloud SQL Postgres   | 15                     |
| Google Cloud SQL SQL Server | 2019                   |
| Google Cloud AlloyDB for PostgreSQL | |


## Documentation

Learn more about RDI ingest from the other pages in this section: