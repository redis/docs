---
Title: Ingest FQA
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
linkTitle: Ingest FAQ
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 10
---

## General questions

### Which License RDI uses?

RDI uses a commercial license. RDI license includes additional 2 Redis Enterprise shards (primary & replica) for its data staging Redis database.

### When should I use RDI ingest and when I shouldn't?

RDI is designed for cases where an application must use a disk based database as its system of records but has to speed and scale data access. This is typically true for mobile and web applications that serves a growing audiences and can not meet the required scale and user experience without cache. RDI is best suitable for dynamic data sets where data is constantly updated by the application or other applications.

RDI is not the recommended tool for the following scenarios:

- Ad hoc migration where data needs to be migrated from a static data set
- Caching data that is being update in the database once or few times a day in large bulk updates.

### Does RDI have any external dependencies?

RDI is packaged with all of its dependencies except for two dependencies for IBM Db2 as a source:

- Db2 JDBC driver.
- IBM Infopshere Data Replication license.

### How does RDI trace data changes in the source database

RDI uses queries against database mechanisms specific for each source type:

- Oracle:  RDI uses `logminer` that parse the Oracle `binary log` and `archive logs` and provides changes into a view that RDI queries.
- mySQL & Maria Db: RDI uses the `binary log replication` to get all the commits.
- PostgreSQL:  RDI uses the `pgoutput` plugin
- SQL Server: RDI uses the CDC mechanism
- Cassandra: RDI uses the CDC log
- MongoDB: RDI uses the change streams


### How much data can RDI process?

RDI uses the concept of processing units. Each processing unit uses 1 CPU core and can process 10,000 records per second, assuming the records are in the range of 1KB. This throughput might slightly change according to the number of columns, number of data transformations and network speed.
Typically one processing unit is sufficient for RDI to deal with a traffic coming from a relational database.

### Can RDI work with any Redis database?

RDI is designed and tested to work only with Redis Enterprise.
RDI staging database must be of version 6.4 or beyond.
RDI target Redis database can be of any version and can be a replica of Active Active replication setup or Auto tiering.
