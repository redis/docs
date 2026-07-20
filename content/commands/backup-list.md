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
description: List the immutable backup file paths pinned so far.
group: server
hidden: false
linkTitle: BACKUP LIST
railroad_diagram: /images/railroad/backup-list.svg
since: 8.10.0
summary: List the immutable backup file paths pinned so far.
syntax_fmt: BACKUP LIST
title: BACKUP LIST
---
Returns the absolute paths of the immutable backup files pinned so far.

## Examples

While the backup is still in the `incrementing` state, only the BASE file is pinned:

```
127.0.0.1:6379> BACKUP LIST
1) "/var/lib/redis/backupdir/appendonly.aof.3.base.rdb"
```

After [`BACKUP SEAL`]({{< relref "/commands/backup-seal" >}}), the INCR file and the manifest are pinned as well:

```
127.0.0.1:6379> BACKUP LIST
1) "/var/lib/redis/backupdir/appendonly.aof.3.base.rdb"
2) "/var/lib/redis/backupdir/appendonly.aof.3.incr.aof"
3) "/var/lib/redis/backupdir/appendonly.aof.manifest"
```

## Details

`BACKUP LIST` reports the absolute paths of the files that have been pinned by hard links so far. This lets the data plane start uploading the BASE snapshot while Redis is still accumulating incremental writes, before the backup is sealed. Once the backup is sealed, the list also includes the INCR file and the manifest.

For the full workflow, see [Redis persistence]({{< relref "/operate/oss_and_stack/management/persistence" >}}#online-backups-with-the-backup-command-family).

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="backup-list-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): the absolute paths of the immutable files pinned so far.

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): the absolute paths of the immutable files pinned so far.

{{< /multitabs >}}

## See also

[`BACKUP START`]({{< relref "commands/backup-start/" >}}) | [`BACKUP SEAL`]({{< relref "commands/backup-seal/" >}}) | [`BACKUP STATUS`]({{< relref "commands/backup-status/" >}}) | [`BACKUP ABORT`]({{< relref "commands/backup-abort/" >}}) | [`BACKUP CLEANUP`]({{< relref "commands/backup-cleanup/" >}})

## Related topics

- [Redis persistence]({{< relref "/operate/oss_and_stack/management/persistence" >}})
