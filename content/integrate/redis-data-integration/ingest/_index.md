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

Most applications are still built using a relational database as the system of record. However, applications moved from serving thousands of employees to millions of customers. While it is often hard or impossible to stop using the relational database, it is imperative to offload the read queries, which are in orders of magnitude larger than writes, to Redis. This is the only way the application can scale and provide the required user experience while the business and number of users keep growing.

RDI keeps Redis in sync with the primary database, using a Capture Data Change (CDC) mechanism.
In addition, RDI allows developers to map and transform the data so it will match the application requirements and allow for fast and efficient queries. RDI processes the database streaming changes, using a configuration based pipeline so coding is not required.

RDI provides enterprise grade streaming data pipelines:

- **Near realtime pipeline** - RDI CDC picks changes in very short intervals, ship and process them in micro batches to provide near real time updates to Redis.
- **At least once guarantee** - RDI will deliver any change to the selected data set at least once to the target Redis database.
- **Data integrity** - RDI keeps the data change order per source table or unique key.
- **High availability** - All RDI stateless components have hot failover or quick auto recovery. RDI state is always highly available using Redis Enterprise replication.
- **Easy to install and operate** - RDI installation as well as day two operations are all done via self documenting CLI.
- **No coding needed** - Pipeline creation and testing is sone via dedicated set of screens in Redis Insight.
- **Data in transit encryption** - RDI never persist data to disk. All data in-flight is protected using TLS or mTLS connections.
- **Observability - Metrics** - RDI collect data processing counters at source table granularity as well as data processing performance metrics. These are available via GUI, CLI and Prometheus endpoints.
- **Observability - logs** - RDI provides JSON format rotating logs in a single folder so they can be collected and processed by your preferred observability tool.
- **back pressure mechanism** - RDI is designed to backoff writing in case of network disconnect to prevent cascading failure. Taking advantage of persistent source and Redis performance, RDI can easily catchup with minutes of network disconnect.
- **Recovering from full failure** - In case of target failure or very long disconnect, RDI can reset data in Redis using a full snapshot of the defined dataset.
- **high throughput** - Using Redis for staging and writing to Redis as a target, RDI has high throughput. With a single processing unit, RDI processes around 10,000 records per second. During full snapshot, RDI automatically scale to a configurable number of processing units, multiplying its throughput to speed up Cache backfill.

## When to use RDI Ingest

RDI should be used in the following conditions:

- Application writes data to the source database and this is the source of truth for this particular data set.
- The data set at stake is updated on a regular basis by the application (not few times in large batches).
- Redis will be used to offload reads from the source database in order to speed, scale and save on database replicas. Data coming from RDI will not be modified directly in Redis by the application.
- In case the pipeline target is Redis Active Active, RDI only writes to one replica at any given time.