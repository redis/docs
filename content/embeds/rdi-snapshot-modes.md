The collector saves an *offset*: its position in the source's change history.
A missing offset means there is no saved position, as on first deployment or after a
reset. An unavailable position means an offset exists, but the source no longer has
the log history needed to resume from it.

With the default `initial` mode, the collector snapshots when there is no saved
position, then streams changes. A restart with a completed snapshot and a valid saved
position resumes streaming. Deployment or restart alone does not require a new snapshot.
If the saved position is no longer available, `initial` does not automatically
re-snapshot to recover, and the collector can report an error.

With `when_needed`, the collector also takes a new snapshot when it detects that the
saved position is no longer available. This can reload all selected data after an
outage without a manual reset. The snapshot captures current rows, rather than
reconstructing every missed change.

#### Missed deletes can leave stale target records {#missed-deletes}

{{< embed-md "rdi-snapshot-gap.md" >}}

#### Compare snapshot modes

The available modes and their exact behavior depend on the source connector and its
version. The following table describes the six values listed in the RDI configuration
reference. A listed value is not necessarily supported by every connector.

| Mode | Existing source data | Restart with a saved position | After a reset clears the position |
| :-- | :-- | :-- | :-- |
| `initial` (default) | Snapshot when no offset exists, then stream changes. | Resume after a completed snapshot if the position is valid. No automatic snapshot recovery for unavailable log history. | Snapshot, then stream changes. |
| `when_needed` | Snapshot when no offset exists, then stream changes. | Resume if the position is valid. Snapshot again if the connector detects an unavailable position. | Snapshot, then stream changes. |
| `always` | Snapshot on every collector start, then stream changes. | Take a new snapshot even if the position is valid. | Snapshot, then stream changes. |
| `initial_only` | Take an initial snapshot without streaming subsequent changes. | Restart an interrupted initial snapshot; do not capture subsequent changes after it completes. | Snapshot without ongoing change capture. |
| `no_data` | Skip existing rows. Initialize any required schema or source position, then stream changes. | Resume streaming if the position is valid. No data snapshot to recover unavailable history. | Skip existing rows and start streaming according to the connector's rules. |
| `never` | Skip the data snapshot where this mode is supported. | Resume according to the connector's rules; no data snapshot recovery. | Connector-specific startup behavior; existing rows are not reloaded. |

An interrupted initial snapshot can restart when the collector starts again, including
with `initial` and `initial_only`.

For Debezium 3.5, note these connector differences:

- PostgreSQL `no_data` performs no snapshot. It resumes from a saved log sequence
  number (LSN), or from the replication slot's creation position when no LSN is saved.
  This requires the relevant write-ahead log (WAL) history to remain available.
- Other connectors can capture schema or initialize a position without copying
  existing rows in `no_data` mode.
- `never` is a deprecated alias for `no_data` in PostgreSQL and MongoDB. MySQL and
  MariaDB retain `never` with connector-specific prerequisites. Oracle and SQL Server
  do not offer `never`; use `no_data` to skip existing rows.

See the Debezium 3.5 connector references for [MariaDB](https://debezium.io/documentation/reference/3.5/connectors/mariadb.html),
[MongoDB](https://debezium.io/documentation/reference/3.5/connectors/mongodb.html),
[MySQL](https://debezium.io/documentation/reference/3.5/connectors/mysql.html),
[Oracle](https://debezium.io/documentation/reference/3.5/connectors/oracle.html),
[PostgreSQL](https://debezium.io/documentation/reference/3.5/connectors/postgresql.html),
and [SQL Server](https://debezium.io/documentation/reference/3.5/connectors/sqlserver.html).
