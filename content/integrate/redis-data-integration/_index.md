---
LinkTitle: Redis Data Integration
Title: Redis Data Integration
aliases: /connect/ /connect.md /redis-di/ /redis-di.md
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: null
group: di
headerRange: '[2]'
hideListLinks: true
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 1
---

Redis Data Integration (RDI) is a product for [Redis Enterprise](https://redis.com/redis-enterprise-software/overview/),
that helps you ingest data in near real-time. Redis then becomes an integral part of your data fabric without any
extra effort from you.

RDI currently supports two scenarios:

* [**Ingest scenario**]({{< relref "/integrate/redis-data-integration/ingest" >}}): RDI mirrors the application's
  primary database to Redis using a *change data capture* (CDC) tool. RDI transforms the database model and
  types to a Redis model and types. This scenario is useful when the application database is not performant
  and scalable enough to serve the read queries. RDI helps you offload all read queries to Redis.

  {{<note>}}
  Ingest is supported with Redis database or [CRDB](https://redis.com/redis-enterprise/technology/active-active-geo-distribution/) (Active Active Replication) targets.
  {{</note>}}

  {{< image filename="/images/rdi/ingest.png" >}}
  
* [**Write-behind scenario** (Preview)]({{< relref "/integrate/redis-data-integration/write-behind" >}}): RDI applies data
  changes in Redis to one or more downstream data stores. RDI can map and transform Redis types and models to downstream types and models. This scenario is useful when the application needs fast writes and reads for some of the queries, but has to provide data to other downstream services that need them in different models for other uses.

  {{<note>}}
  Write-behind is *not* supported with [CRDB](https://redis.com/redis-enterprise/technology/active-active-geo-distribution/) (Active Active Replication)
  {{</note>}}

  {{< image filename="/images/rdi/write-behind.png" >}}  

See the 
[Ingest architecture guide]({{< relref "/integrate/redis-data-integration/ingest/architecture" >}})
and the
[Write-behind architecture guide]({{< relref "/integrate/redis-data-integration/write-behind/architecture" >}})
for more information.

## Supported sources (ingest)

RDI supports the following database sources using [Debezium Server](https://debezium.io/documentation/reference/stable/operations/debezium-server.html) connectors:

| Database                    | Versions               |
| :-------------------------- | :--------------------- |
| Oracle                      | 12c, 19c, 21c          |
| MariaDB                     | >= 10.5                |
| MySQL                       | 5.7, 8.0.x             |
| Postgres                    | 10, 11, 12, 13, 14, 15 |
| SQL Server                  | 2017, 2019             |
| Google Cloud SQL MySQL      | 8.0                    |
| Google Cloud SQL Postgres   | 15                     |
| Google Cloud SQL SQL Server | 2019                   |
| Google Cloud AlloyDB for PostgreSQL | |

## Supported targets (write-behind)

| Database   |
| :--------- |
| Oracle     |
| MariaDB    |
| MySQL      |
| Postgres   |
| SQL Server |
| Cassandra  |

## Features

RDI is an enterprise-grade product with an extensive set of features.

### Performance and scalability

- Up to two seconds from source to target
- Multi-shard support (each shard supports 28K ops/sec)

### Resiliency, high availability, and data delivery guarantees

- At least once guarantee, end to end
- Data in transit is replicated to replica a shard
- Data persistence (see [Redis AOF]({{< relref "/operate/oss_and_stack/management/persistence" >}}))
- A back-pressure mechanism that prevents cascading failures
- Reconnect on failure and write retries

### Developer tools and data transformation

- Declarative data filtering, mapping, and transformations
- Support for SQL and [JMESPath](https://jmespath.org/) expressions in transformations
- Additional JMESPath custom functions, simplifying transformation expressions
- Transformation jobs validation
- Zero downtime pipeline reconfiguration
- Hard failures routing to dead-letter queue stream for troubleshooting
- Trace tool

### Operator tools and lifecycle management

- CLI with built-in help and validations
- Installation using CLI
- Zero downtime upgrade of RDI
- Status tool for health and data provenance
- Monitoring using [Prometheus](https://prometheus.io/) and [Grafana](https://grafana.com/)
