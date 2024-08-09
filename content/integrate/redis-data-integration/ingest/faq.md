---
Title: Ingest FAQ
aliases: null
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Find answers to common questions about RDI ingest
group: di
hideListLinks: false
linkTitle: Ingest FAQ
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 50
---

## Which license does RDI use?

You must purchase a commercial license for RDI with Redis Enterprise. This includes two extra
Redis Enterprise shards (primary and replica) for the staging database.

## Does RDI have any external dependencies?

RDI is packaged with all of its dependencies except for two dependencies that
you need if you use IBM Db2 as a source:

- [Db2 JDBC driver](https://www.ibm.com/support/pages/db2-jdbc-driver-versions-and-downloads)
- [IBM Infopshere Data Replication license](https://www.ibm.com/docs/en/db2/10.5?topic=information-licensing-replication)

## How does RDI track data changes in the source database?

RDI uses mechanisms that are specific for each of the supported
source databases:

- **Oracle**:  RDI uses `logminer` to parse the Oracle `binary log` and `archive logs`. This
  lists any changes in a database view that RDI can query.
- **MySQL/MariaDB**: RDI uses `binary log replication` to get all the commits.
- **PostgreSQL**:  RDI uses the `pgoutput` plugin.
- **SQL Server**: RDI uses the CDC mechanism.

## How much data can RDI process?

RDI uses the concept of *processing units*. Each processing unit uses 1 CPU core and can process
about 10,000 records per second, assuming the records have a size of about 1KB each. This throughput
might change slightly depending on the number of columns, the number of data transformations,
and the speed of the network. Typically, one processing unit is enough for RDI to deal with the
traffic from a relational database.

## Can RDI work with any Redis database?

No. RDI is designed and tested to work only with Redis Enterprise. The staging database can
only use version 6.4 or above. The target Redis database can be of any version and can be a
replica of an Active-Active replication setup or an Auto tiering database.

## Can RDI automatically track changes to the source database schema?

If you don't configure RDI to capture a specific set of tables in the schema then it will
detect any new tables when they are added. Similarly, RDI will capture new table columns
and changes to column names unless you configure it for a specific set of columns.
Bear in mind that the Redis keys in the target database will change to reflect the
new or renamed tables and columns.

## Should I be concerned when the log says RDI is out of memory? {#rdi-oom}

Sometimes the Debezium log will contain a message saying that RDI is out of
memory. This is not an error but an informative message to say that RDI
is applying *backpressure* to Debezium. See
[Backpressure mechanism]({{< relref "/integrate/redis-data-integration/ingest/architecture#backpressure-mechanism" >}})
in the Architecture guide for more information.

## What happens when RDI can't write to the target Redis database?

RDI will keep attempting to write the changes to the target and will also attempt
to reconnect to it, if necessary. While the target is disconnected, RDI
will keep capturing change events from the source database and adding them to its
streams in the staging database. This continues until the staging database gets
low on space to store new events. When RDI detects this, it applies a "back pressure"
mechanism to capture data from the source less frequently, which reduces the risk of running
out of space altogether. The systems that the source databases use to record changes can
retain the change data for at least a few hours, and RDI can catch up with the
changes as soon as the target connection recovers or the staging database has
more space available.

## What does RDI do if the data is corrupted or invalid?

The collector reports the data to RDI in a structured JSON format. If
the structure of the JSON data is invalid or if there is a fatal bug in the transformation
job then RDI can't transform the data. When this happens, RDI will store the original data
in a "dead letter queue" along with a message to say why it was rejected. The dead letter
queue is stored as a capped stream in the RDI staging database. You can see its contents
with Redis Insight or with the 
[`redis-di get-rejected`]({{< relref "/integrate/redis-data-integration/ingest/reference/cli/redis-di-get-rejected" >}})
command from the CLI.
