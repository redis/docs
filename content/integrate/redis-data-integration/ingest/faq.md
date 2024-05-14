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

### If my source data change for example new table or column, can RDI automatically track these changes?

Yes, if RDI was not instructed to follow a specific set of tables in the schema, it will detect new tables added.
If RDI was not instructed to follow a specific set of columns, it will report new columns if the table changed.
The same is true for changes in column names.
Keep in mind that these changes will only reflect in Redis keys corresponding to changed rows in the database.

### What happens when RDI can not write to the target Redis database?

RDI will keep attempting to write the changes to the target and if needed to reconnect to the  target.
This means that RDI streams will keep receiving new change events from the source database and store them in order in streams until RDI runs out of space in its staging Redis database.
In this case RDI applies a back pressure mechanism and will throttle down it's reporting from the source database. Since the source changes are recorded in logs / tables that are retained for at least few hours, RDI will be able to catchup when the connection is restored or when the target has space for new keys.

### What does RDI do if the data is corrupted or invalid?

RDI collector reports the data in structured JSON format. In case the payload can not be parsed or there is a bug in the transformation job and RDI can not transform the data, the original data and the rejection reason will be stored in a Dead Letter Queue which is a capped stream in RDI staging Redis database. The user can see rejected records and can browse them using Redis Insight or using the `redis-di get-rejected` command.


