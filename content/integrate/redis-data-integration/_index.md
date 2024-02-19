---
LinkTitle: RedisOM for Node.js
Title: RedisOM for Node.js
aliases: /connect/ /connect.md /redis-di/ /redis-di.md
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: null
group: library
headerRange: '[2]'
summary: Redis OM for Node.js is an object-mapping library for Redis.
type: integration
weight: '9'
---

Redis Data Integration (RDI) is a product that helps [Redis Enterprise](https://redis.com/redis-enterprise-software/overview/) users ingest data in near real-time, so that Redis becomes part of their data fabric without additional integration efforts.

RDI currently supports these scenarios:

* [Ingest scenario]({{<relref "/integrate/redis-data-integration/quickstart/ingest-guide">}}). RDI mirrors the application's primary database to Redis using a Capture Data Change (CDC) tool. RDI transforms the database model and types to a Redis model and types. This scenario is useful when the application database is not performant and scalable enough to serve the read queries. RDI helps to offload all read queries to Redis.

  {{< image filename="/images/rdi/ingest.png" >}}
  
* [Write-behind scenario (Preview)]({{<relref "/integrate/redis-data-integration/quickstart/write-behind-guide">}}). RDI applies data changes in Redis to one or more downstream data stores. RDI can map and transform Redis types and models to downstream types and models. This scenario is useful when the application needs fast writes and reads for some of the queries, but has to provide data to other downstream services that need them in different models for other uses.

  {{< image filename="/images/rdi/write-behind.png" >}}  

To learn more, see [Architecture]({{<relref "/integrate/redis-data-integration/architecture">}}).

## Supported sources (ingest)

RDI supports the following database sources using [Debezium Server](https://debezium.io/documentation/reference/stable/operations/debezium-server.html) connectors:

| Database                    | Versions               |Comments|
| --------------------------- | ---------------------- |--------|
| Oracle                      | 12c, 19c, 21c          ||
| MariaDB                     | >= 10.5                ||
| MongoDB                     | 4.2, 4.4, 5.0, 6.0     | Driver: 4.7  |
| MySQL                       | 5.7, 8.0.x             ||
| Percona XtraDB              | 5.7, 8.0.x             ||
| Postgres                    | 10, 11, 12, 13, 14, 15 ||
| SQL Server                  | 2017, 2019             ||
| Cassandra                   | >= 3.0                 ||
| Datastax Cassandra          | >= 6.8.0               ||
| Google Cloud SQL MySQL      | 8.0                    ||
| Google Cloud SQL Postgres   | 15                     ||
| Google Cloud SQL SQL Server | 2019                   ||

## Supported targets (write-behind)

| Database   |
| ---------- |
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
- Data persistence (see [Redis AOF](https://redis.io/docs/management/persistence/))
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
