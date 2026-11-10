---
Title: Configure Oracle archive log retention for RDI
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Configure Oracle backup and cleanup jobs to keep the archived logs that RDI needs.
group: di
hideListLinks: false
linkTitle: Archive log retention
summary: Configure Oracle archived log retention so that RDI can keep capturing changes.
type: integration
weight: 1
---

After the snapshot, RDI captures changes by reading the online redo logs and the archived logs. If the collector needs a log that has been deleted, the pipeline stops and needs a reset with a new snapshot.

With XStream, the capture process is registered in the database, and RMAN does not delete the archived logs it still needs. Oracle still deletes them when the fast recovery area has no space for a new log, and cleanup jobs can remove them with `DELETE ... FORCE` or by deleting files from the operating system or ASM. The sizing and cleanup guidance below applies to XStream as well.

With LogMiner, Oracle does not know which archived logs RDI still needs, so your backup and cleanup configuration must keep them available. If a needed log has been deleted, the collector stops with `None of the log files contain offset SCN` or `this is no longer available on the server`. The collector reads only the current online redo log of each thread. Everything older must come from an archived log in the destination the collector uses. If you are upgrading from a version before 1.18.1, see [Upgrade from RDI versions before 1.18.1](#upgrade-from-rdi-versions-before-1181).

## How long to keep archived logs

We recommend keeping at least 24 hours of archived logs. Keep them longer if the sum of the following is longer:

- the longest of the snapshot duration and the longest collector stop you want to recover from without a new snapshot, for example during maintenance, an upgrade, or while the database refuses connections
- the time the collector needs to catch up after that stop
- with LogMiner, the transaction retention, `log.mining.transaction.retention.ms`, which is 30 minutes by default in RDI
- a safety margin

Age-based cleanup also counts the time the database is shut down. If the database is stopped for long periods, for example over a weekend, the archived logs that RDI still needs can be older than the retention time when the database starts again, and a cleanup job that runs at startup removes them. In that case, keep archived logs for longer than the shutdown plus the retention time, or run the cleanup only after the collector has caught up.

With LogMiner, the collector needs the log that contains the start of the oldest open transaction, even while it is running. Any transaction in the database counts, including one that changes no table that RDI captures. RDI drops a transaction once it has been open longer than the transaction retention, so a single transaction can hold the collector back by up to that time. Heartbeats keep the stored position moving on tables with few changes, but they cannot move it past an open transaction.

With Oracle RAC, keep the archived logs of every instance on shared storage, such as ASM, that the collector can read, and apply the same retention to all of them. The collector needs the logs of every thread.

After an outage, keep the archived logs until the collector has caught up. See [Understand CDC offsets and source retention](/content/integrate/redis-data-integration/cdc-offsets-and-retention.md) to plan for the whole interruption.

## Archived logs in the fast recovery area

Oracle deletes archived logs from the fast recovery area (FRA) only when it needs space, and only logs that are reclaimable under the RMAN archive log deletion policy. By default, a log becomes reclaimable as soon as it is backed up. To keep logs for a minimum time, for example 24 hours, back up and delete only logs older than that:

```sql
-- Make logs reclaimable in the FRA only after one backup
CONFIGURE ARCHIVELOG DELETION POLICY TO BACKED UP 1 TIMES TO DEVICE TYPE <DISK|SBT>;

-- Back up only logs older than 24 hours, so the FRA cannot reclaim younger logs
BACKUP ARCHIVELOG ALL COMPLETED BEFORE 'SYSDATE-1' NOT BACKED UP 1 TIMES;

-- Delete only logs that are older than 24 hours and backed up
DELETE NOPROMPT ARCHIVELOG ALL COMPLETED BEFORE 'SYSDATE-1' BACKED UP 1 TIMES TO DEVICE TYPE <DISK|SBT>;
```

Logs that are younger than 24 hours are never backed up, so the FRA cannot reclaim them. If you need to back up archived logs soon after they are written, use a [dedicated destination](#archived-logs-in-a-dedicated-destination) for RDI instead, because the FRA can delete any backed up log when it needs space. Also:

- Remove backup and cleanup steps that bypass the time limit, such as `DELETE INPUT`, `DELETE ALL INPUT`, `DELETE ... FORCE`, `BACKUP ... PLUS ARCHIVELOG` without `COMPLETED BEFORE`, and deleting files from the operating system or ASM. Deleting logs right after a backup can remove a log the collector is reading.
- Size the FRA for at least the retention time of peak redo, plus the backups and flashback logs stored there. If the FRA fills with logs that are not reclaimable, the archiver stops and the database refuses connections with `ORA-00257`.
- Monitor FRA usage in `V$RECOVERY_AREA_USAGE` and alert at about 70 to 75%.

Without backups, no log in the FRA becomes reclaimable, so the cleanup job you schedule sets the retention. Use the same time limit in it, and size the FRA for the retention time plus the interval between cleanup runs.

## Archived logs in a dedicated destination

Oracle never deletes archived logs outside the FRA. Only the cleanup jobs you configure remove them, so a dedicated destination gives RDI a retention that does not depend on backups or free space:

1. Add a local destination outside the FRA, and make it `OPTIONAL` so that a problem with it cannot stop the database:

    ```sql
    ALTER SYSTEM SET LOG_ARCHIVE_DEST_2='LOCATION=/u02/arch_rdi OPTIONAL' SCOPE=BOTH;
    ALTER SYSTEM SET LOG_ARCHIVE_DEST_STATE_2=ENABLE SCOPE=BOTH;
    ```

1. With LogMiner, select it for the collector as described in [Set the archive log destination](/content/integrate/redis-data-integration/data-pipelines/prepare-dbs/oracle/_index.md#4-set-the-archive-log-destination).
1. Delete logs from it only after the retention time, for example:

    ```sql
    # Delete logs older than 24 hours from the RDI destination only
    DELETE NOPROMPT ARCHIVELOG LIKE '/u02/arch_rdi/%' COMPLETED BEFORE 'SYSDATE-1';
    ```

1. Make sure that other backup and cleanup jobs do not delete its copies. `DELETE ALL INPUT` and `DELETE ARCHIVELOG ALL` without a `LIKE` clause remove the logs from every destination.
1. Size the destination for the retention time plus the cleanup interval, and monitor its usage and its status in `V$ARCHIVE_DEST_STATUS`. If the destination fails, Oracle stops archiving to it, and the collector cannot read the logs written during the failure from it.

The collector reads only local destinations. Copies kept only on a remote destination, such as a Data Guard standby, do not count.

## Upgrade from RDI versions before 1.18.1

With LogMiner, RDI versions before 1.18.1 could read redo from an online redo log that was no longer current when its archived log had already been deleted, as long as Oracle had not overwritten that online log yet. A cleanup job that deleted archived logs too early could therefore go unnoticed, especially on a database or RAC thread that switches logs only a few times a day.

RDI 1.18.1 and later read only the current online redo log of each thread, and read everything older from archived logs. After you upgrade, a cleanup job that deletes archived logs minutes after they are written, or right after it backs them up, stops the pipeline. Before you upgrade, check your backup and cleanup jobs against the retention described on this page.
