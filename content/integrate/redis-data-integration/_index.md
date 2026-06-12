---
Title: Redis Data Integration
aliases: /integrate/redis-data-integration/ingest
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: null
group: di
hideListLinks: false
linkTitle: Redis Data Integration
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 1
---

Redis Data Integration (RDI) keeps your Redis cache in sync with a primary system-of-record database in near real time.

RDI's purpose is to help Redis customers sync Redis Enterprise with live data from their slow disk based databases in order to:

- Meet the required speed and scale of read queries and provide an excellent and predictable user experience.
- Save resources and time when building pipelines and coding data transformations.
- Reduce the total cost of ownership by saving money on expensive database read replicas.

If you use a relational database as the system of record for your app,
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
transformations using a configuration system, so no coding is necessary. RDI supports both standard Redis databases and [Active-Active (CRDB)](https://redis.io/active-active/) replication targets.

## RDI in Redis Cloud

RDI is also available as a fully managed service on Redis Cloud, removing the need to install or maintain the underlying infrastructure. Redis manages the compute, scaling, and upgrades for you. You define the source connection and pipeline configuration using the Redis Cloud console.

The Cloud service currently supports AWS-hosted source databases (Amazon RDS, Amazon Aurora, and Amazon EC2), as well as MongoDB Atlas and Snowflake, writing to a Redis Cloud Pro target database.

See [Data Integration]({{< relref "/operate/rc/rdi" >}}) in the Redis Cloud documentation for
full setup instructions, prerequisites, and a quick start guide.

## Features

RDI provides enterprise-grade streaming data pipelines with the following features:

- **Near realtime pipeline** - The CDC system captures changes in very short time intervals,
  then ships and processes them in *micro-batches* to provide near real time updates to Redis.
- **At least once guarantee** - RDI will deliver any change to the selected data set at least
  once to the target Redis database.
- **Data integrity** - RDI keeps the data change order per source table or unique key.
- **High availability** - All stateless components have hot failover or quick automatic recovery.
  RDI state is always highly available using Redis Enterprise replication.
- **Easy to install and operate** - Use a self-documenting command line interface (CLI)
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
  disconnection. See [Backpressure mechanism]({{< relref "/integrate/redis-data-integration/architecture#backpressure-mechanism">}}) for more information.
- **Recovering from full failure** - If the cache fails or gets disconnected for a long time,
  RDI can reconstruct the cache data in Redis using a full snapshot of the defined dataset.
- **High throughput** - Because RDI uses Redis for staging and writes to Redis as a target,
  it has very high throughput. With a single processor core and records of about 1KB in size,
  RDI processes around 10,000 records per second. While taking the initial full *snapshot* of
  the source database, RDI automatically scales to a configurable number of processing units,
  to fill the cache as fast as possible.

## When to use RDI

RDI is highly configurable but it is not intended to be a general
solution for all data integration tasks. See
[When to use RDI]({{< relref "/integrate/redis-data-integration/when-to-use" >}})
to find out if your use case is a good fit for RDI's features.

## Supported source databases

RDI can capture data from a range of sources, including PostgreSQL, MySQL,
MariaDB, Oracle, SQL Server, and MongoDB. See
[Prepare source databases]({{< relref "/integrate/redis-data-integration/data-pipelines/prepare-dbs" >}})
for the full list of supported databases and versions, along with instructions
to get each one ready for use with RDI.

## Continue learning with Redis University

* [Redis Data Integration Lab](https://university.redis.io/course/2qa1u1ss21vsy5?tab=details)

## Documentation

Learn more about RDI from the other pages in this section: