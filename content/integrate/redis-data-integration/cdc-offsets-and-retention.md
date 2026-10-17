---
Title: Understand CDC offsets and source retention
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Learn why RDI can lose access to source change history during an interruption and how to plan for recovery.
group: di
hideListLinks: false
linkTitle: CDC offsets and retention
summary: Understand saved capture positions, source history, and how retention affects recovery after an interruption.
type: integration
weight: 31
---

Redis Data Integration (RDI) can resume after an interruption only if the source still provides the change history and capture state it needs. Saving a position does not preserve that history.

Imagine that RDI stops on Friday and starts again on Sunday. Your application keeps writing to Oracle during those two days. RDI remembers where it stopped, but Oracle has removed some of the redo logs needed to continue. The collector reports that its saved system change number (SCN) is no longer available.

The source tables still exist. RDI has not forgotten its position. What is missing is the history between that position and the present.

Two days is only an example. There is no universal expiration time for an RDI offset. The outcome depends on the database, its settings, the amount of change, and how far capture had already fallen behind.

## Think of an offset as a bookmark

Change data capture (CDC) lets RDI follow changes instead of repeatedly reading the entire source dataset. Four concepts explain how it works:

- A **snapshot** reads the current dataset to establish a starting point.
- **Change history** records subsequent inserts, updates, and deletes. Depending on the database, this history lives in logs, change tables, or a change stream.
- An **offset** records the collector's progress through that history. Think of it as a bookmark, not a copy of the pages.
- **Retention** determines how long, or how much of, that history remains available.

The source continues maintaining its history while RDI is disconnected. If the required history remains available, RDI can read the missed changes. If the source removes it, the bookmark alone cannot reconstruct those changes.

![Two timelines show RDI resuming when its bookmark is inside retained history and failing when required history has been removed.](/images/rdi/cdc-retention/bookmark.svg)
{width="560"}

*These timelines are illustrations, not database defaults. The important boundary is the oldest history still available when capture resumes.*

The collector's offset is also different from the processor's **checkpoint**. The offset tracks capture from the source. The checkpoint tracks processing of events already captured into RDI. A processor can be behind even while capture is current. If the backlog eventually stops capture through [backpressure](/content/integrate/redis-data-integration/architecture/_index.md#backpressure-mechanism), source retention becomes important again.

## See how each source keeps history

The bookmark idea applies across sources, but the way each database retains history differs. The examples assume capture was working before the interruption. A source restart, replacement, or failover can introduce separate capture-state requirements.

### Oracle: keep the required redo history

Oracle records changes in redo logs. With LogMiner, RDI reads online and archived redo logs and tracks progress using SCNs. An SCN identifies a position in database history; it is not a timestamp with a fixed lifetime.

Online redo logs are reused. Archived logs let a reader reach further back, but only while the required files remain available to the mining process. If cleanup removes a required archive during an outage, the collector can no longer continue from its saved position. Having newer logs does not fill the gap.

![Oracle timelines show a saved SCN with all required redo available, then a saved SCN whose required archived redo has been removed.](/images/rdi/cdc-retention/oracle.svg)
{width="560"}

Plan archive retention and storage with your database administrator. Check the archive destination RDI actually reads, not only whether backups exist elsewhere. Long-running transactions can also require older redo than the most recent visible activity suggests.

XStream uses an Oracle capture process and an outbound server, with its own restart position and capture checkpoints. Preserve the history and state required by that capture process; do not apply a LogMiner error diagnosis unchanged to XStream. See [Prepare Oracle](/content/integrate/redis-data-integration/data-pipelines/prepare-dbs/oracle.md), [Oracle LogMiner](https://docs.oracle.com/en/database/oracle/oracle-database/19/sutil/oracle-logminer-utility.html), and [XStream restartability](https://docs.oracle.com/en/database/oracle/oracle-database/19/xstrm/xstream-out-concepts.html).

### MySQL and MariaDB: keep the binary logs

MySQL and MariaDB record changes in binary logs, often called *binlogs*. A resume position identifies the required place in this history. Using transaction identifiers does not preserve the underlying events after their logs are removed.

Automatic expiration or a manual purge can remove a file that a disconnected collector still needs. Increasing retention after that purge does not bring the file back.

![Binary-log timelines show successful resume while the required file remains, then failed resume after that file is purged.](/images/rdi/cdc-retention/mysql-mariadb.svg)
{width="560"}

Set retention for the interruption you need to tolerate and leave enough disk space for peak writes. Coordinate manual cleanup with CDC readers. Managed services can expose different retention controls, so use the instructions for your deployment in [Prepare MySQL and MariaDB](/content/integrate/redis-data-integration/data-pipelines/prepare-dbs/my-sql-mariadb.md). The [MySQL purge reference](https://dev.mysql.com/doc/refman/8.0/en/purge-binary-logs.html) and [MariaDB binary-log guide](https://mariadb.com/docs/server/server-management/server-monitoring-logs/binary-log/using-and-maintaining-the-binary-log) describe the underlying cleanup behavior.

### PostgreSQL: retain history without filling the disk

PostgreSQL records changes in its write-ahead log (WAL). RDI reads through a logical replication slot and tracks a log sequence number (LSN).

A slot can retain WAL that its reader still needs, even while RDI is stopped. This makes PostgreSQL different from a simple rolling time window: the immediate problem may be growing disk usage rather than removed history.

Retention is not unconditional. A configured slot retention limit can allow required WAL to be removed. Newer PostgreSQL versions also support invalidating slots after an idle timeout. A dropped or invalidated slot cannot be treated as a healthy saved bookmark.

![PostgreSQL timelines show WAL retained during an outage with growing storage, required WAL removed after a size limit, and an inactive slot invalidated by a timeout.](/images/rdi/cdc-retention/postgresql.svg)
{width="560"}

Monitor slot health, retained WAL, and free disk together. Choose limits that balance recovery time with database storage capacity. Parameter names and available controls differ across PostgreSQL versions; see [Manage WAL retention](/content/integrate/redis-data-integration/data-pipelines/prepare-dbs/postgresql.md#manage-wal-retention).

The same model applies to Supabase, Neon, AlloyDB for PostgreSQL, Amazon Aurora PostgreSQL, and other managed PostgreSQL services. Check provider-specific slot cleanup, storage, and failover policies rather than assuming that every service retains an idle slot indefinitely.

### SQL Server: retain the captured change rows

SQL Server CDC captures changes from the transaction log into change tables. RDI reads those captured changes using an LSN-based position.

The CDC cleanup process removes old entries from the change tables. If RDI returns after its required entries have been cleaned up, keeping transaction-log backups alone does not make those entries available through the CDC reader.

![SQL Server timelines show an LSN inside retained CDC change-table history, then outside the available range after cleanup.](/images/rdi/cdc-retention/sql-server.svg)
{width="560"}

Plan CDC change-table retention for consumer interruptions. Monitor both capture progress into those tables and RDI's progress through them. Capture delays and reader delays are different problems. See [Prepare SQL Server](/content/integrate/redis-data-integration/data-pipelines/prepare-dbs/sql-server.md) and Microsoft's [CDC administration guide](https://learn.microsoft.com/en-us/sql/relational-databases/track-changes/administer-and-monitor-change-data-capture-sql-server).

### MongoDB: keep enough operation-log history

MongoDB change streams provide a **resume token** that identifies where reading can continue. Resuming requires enough history in the replica set's operation log, or *oplog*.

For a size-limited oplog, a busy day can retain fewer hours of history than a quiet day. A collector that resumes successfully after one weekend might fail after another weekend with a large write burst.

![MongoDB timelines show a resume token whose history remains in the oplog, then history overwritten during a write burst.](/images/rdi/cdc-retention/mongodb.svg)
{width="560"}

Monitor the actual oplog time window. Size it for peak activity, and consider a minimum retention period where available. A minimum retention period can require the oplog to grow beyond its configured size, so account for storage too. Managed-service controls vary. See [Prepare MongoDB](/content/integrate/redis-data-integration/data-pipelines/prepare-dbs/mongodb.md) and the [MongoDB oplog guide](https://www.mongodb.com/docs/manual/core/replica-set-oplog/).

### Spanner: distinguish two retention windows

Spanner change streams retain change records for a configured period. RDI needs its streaming resume point to remain within the available change-stream history. Once those records expire, a later restart cannot read them from the stream.

![Spanner timelines show a streaming resume point within change-stream retention and a point older than the retained records.](/images/rdi/cdc-retention/spanner.svg)
{width="560"}

Spanner also has **database version retention**. That separate setting matters when RDI reads a consistent snapshot at a particular timestamp. Increasing version retention does not substitute for sufficient change-stream retention during streaming.

Plan the change-stream window for interruptions and the version window for snapshot duration. See [Prepare Spanner](/content/integrate/redis-data-integration/data-pipelines/prepare-dbs/spanner.md) and Google's [change-stream overview](https://docs.cloud.google.com/spanner/docs/change-streams).

### Snowflake: consume changes before the stream becomes stale

Snowflake streams track an offset against source-table history. The stream does not hold an independent, permanent copy of every change. If the history needed by its offset is no longer retained, the stream becomes **stale**.

![Snowflake timelines show a usable stream offset with retained table history and a stale stream after required history is no longer retained.](/images/rdi/cdc-retention/snowflake.svg)
{width="560"}

Monitor stream staleness and the reported `STALE_AFTER` time. Account for table retention and Snowflake's retention-extension rules; do not assume that a stream keeps history indefinitely. Reading a stream with a query alone does not necessarily advance its offset: Snowflake distinguishes querying from consuming changes in a committed transaction.

Snowflake support in RDI is in preview. See [Prepare Snowflake](/content/integrate/redis-data-integration/data-pipelines/prepare-dbs/snowflake.md) and Snowflake's [stream retention and staleness guidance](https://docs.snowflake.com/en/user-guide/streams-intro#data-retention-period-and-staleness).

## Plan for the whole interruption

RDI does not have to be completely down for history to become unavailable. A network failure, lost source access, or sustained capture lag can leave its position behind. A slow target can build a backlog until backpressure stops capture. Source cleanup continues independently.

Use a conservative planning budget:

**Existing capture lag + longest expected interruption + catch-up allowance + safety margin.**

This is a planning aid, not a universal database setting. For example, a 48-hour outage budget needs more than 48 hours of retained history if capture was already behind. Catch-up also needs spare processing capacity while the application continues writing.

Before maintenance, check capture progress, available history, and storage. For size-based limits, estimate how much history peak writes produce, not just average writes. Where history is retained by a slot, check how much additional disk an outage could consume.

Alert while there is still time to act. Combine [RDI monitoring](/content/integrate/redis-data-integration/observability.md) with source-database checks. A running process or a saved offset does not prove that capture is advancing or that its history remains available. Confirm managed-service limits and cleanup policies with the database owner.

## Recover when the history is gone

First identify whether required history is missing or temporarily inaccessible. A permissions or archive-access problem needs a different correction from deleted history.

If the database can make the original history available again through a supported procedure, resuming may still be possible. Otherwise, rebuilding from a fresh snapshot establishes a new starting point. Increasing retention protects future history; it cannot recreate removed records.

A snapshot reads what exists now. It does not recover every intermediate event. Consider a row that existed in Redis on Friday but was deleted from the source on Saturday: Sunday's snapshot contains no row to overwrite that old Redis key. Recovery must account for such stale target data as well as current source rows.

Use the [pipeline reset guidance](/content/integrate/redis-data-integration/data-pipelines/deploy.md#reset-a-pipeline) with your source's snapshot configuration and target reconciliation plan. Do not manually move an offset forward to silence an error: that can skip changes. Verify recovered inserts, updates, and deletes before relying on the target again.
