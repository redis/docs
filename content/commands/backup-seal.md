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
- noscript
complexity: O(1)
description: Freeze the current backup (BASE + INCR + manifest).
group: server
hidden: false
linkTitle: BACKUP SEAL
railroad_diagram: /images/railroad/backup-seal.svg
since: 8.10.0
summary: Freeze the current backup (BASE + INCR + manifest).
syntax_fmt: BACKUP SEAL
title: BACKUP SEAL
---
Freezes the current backup, producing the final immutable file set: the BASE snapshot, the incremental append-only file (INCR), and a standalone manifest.

## Examples

```
127.0.0.1:6379> BACKUP SEAL
OK
```

## Details

`BACKUP SEAL` moves the backup state machine from `incrementing` to `sealed`. Restore loads `BASE + INCR`, so the restored dataset reflects the state at the seal boundary, not merely the earlier BASE snapshot. Sealing performs the following steps:

* Flushes and fsyncs the current INCR file.
* Hard-links the INCR file into the backup directory.
* Writes a standalone manifest that references only this backup's `{BASE, INCR}` file set.
* Rotates the live AOF when AOF persistence is enabled.
* Stops and removes the temporary AOF state when the backup created it for an `appendonly no` instance.

After sealing, the file set is complete and immutable. The data plane can copy the files reported by [`BACKUP LIST`]({{< relref "/commands/backup-list" >}}), then call [`BACKUP CLEANUP`]({{< relref "/commands/backup-cleanup" >}}) to release them.

For the full workflow and restore procedure, see [Redis persistence]({{< relref "/operate/oss_and_stack/management/persistence" >}}#online-backups-with-the-backup-command-family).

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="backup-seal-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

{{< /multitabs >}}

## See also

[`BACKUP START`]({{< relref "commands/backup-start/" >}}) | [`BACKUP STATUS`]({{< relref "commands/backup-status/" >}}) | [`BACKUP LIST`]({{< relref "commands/backup-list/" >}}) | [`BACKUP ABORT`]({{< relref "commands/backup-abort/" >}}) | [`BACKUP CLEANUP`]({{< relref "commands/backup-cleanup/" >}})

## Related topics

- [Redis persistence]({{< relref "/operate/oss_and_stack/management/persistence" >}})
