---
acl_categories:
- '@admin'
- '@slow'
- '@dangerous'
arity: 2
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- oss
- kubernetes
- clients
command_flags:
- admin
- stale
complexity: O(1)
description: Report the current backup state.
group: server
hidden: false
linkTitle: BACKUP STATUS
railroad_diagram: /images/railroad/backup-status.svg
since: 8.10.0
summary: Report the current backup state.
syntax_fmt: BACKUP STATUS
title: BACKUP STATUS
---
Reports the current backup state.

## Examples

```
127.0.0.1:6379> BACKUP STATUS
1) "state"
2) "incrementing"
3) "error"
4) ""
5) "start_time"
6) "1717921800"
7) "end_time"
8) "0"
```

## Details

`BACKUP STATUS` reports the current state of the backup state machine along with timing and error information. The reply contains the following fields:

| Field | Description |
|:------|:------------|
| `state` | The current backup state (see below). |
| `error` | The error message if the backup failed; an empty string otherwise. |
| `start_time` | The Unix time, in seconds, when the current backup started; `0` if no backup has started. |
| `end_time` | The Unix time, in seconds, when the current backup was sealed; `0` if it has not been sealed. |

The `state` field is one of the following:

| State | Description |
|:------|:------------|
| `idle` | No backup is in progress. |
| `pending` | A backup was requested but is waiting for an append-only file rewrite (AOFRW) to become available. |
| `snapshotting` | Redis is producing the BASE snapshot. |
| `incrementing` | The BASE snapshot is complete and pinned; Redis is accumulating incremental writes and waiting to be sealed. |
| `sealed` | The backup is frozen; the file set is complete and immutable, awaiting data-plane consumption and cleanup. |
| `failed` | The backup failed or was aborted. A new backup can be started. |

For lightweight monitoring, `INFO persistence` also exposes a `backup_in_progress` boolean. Full backup state, error, and timestamps are available only through `BACKUP STATUS`.

For the full workflow, see [Redis persistence]({{< relref "/operate/oss_and_stack/management/persistence" >}}#online-backups-with-the-backup-command-family).

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="backup-status-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): a flat array of field-value pairs describing the current backup state.

-tab-sep-

[Map reply](../../develop/reference/protocol-spec#maps): a map of fields to values describing the current backup state.

{{< /multitabs >}}

## See also

[`BACKUP START`]({{< relref "commands/backup-start/" >}}) | [`BACKUP SEAL`]({{< relref "commands/backup-seal/" >}}) | [`BACKUP LIST`]({{< relref "commands/backup-list/" >}}) | [`BACKUP ABORT`]({{< relref "commands/backup-abort/" >}}) | [`BACKUP CLEANUP`]({{< relref "commands/backup-cleanup/" >}})

## Related topics

- [Redis persistence]({{< relref "/operate/oss_and_stack/management/persistence" >}})
