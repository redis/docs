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
description: Remove a sealed backup's files and return to idle.
group: server
hidden: false
linkTitle: BACKUP CLEANUP
railroad_diagram: /images/railroad/backup-cleanup.svg
since: 8.10.0
summary: Remove a sealed backup's files and return to idle.
syntax_fmt: BACKUP CLEANUP
title: BACKUP CLEANUP
---
Removes a sealed backup's files and returns the backup state machine to idle.

## Examples

```
127.0.0.1:6379> BACKUP CLEANUP
OK
```

## Details

`BACKUP CLEANUP` removes the sealed (or failed) backup artifacts and releases the files that were pinned by hard links, moving the backup state machine from `sealed` back to `idle`. Call it after the data plane has finished copying the files reported by [`BACKUP LIST`]({{< relref "/commands/backup-list" >}}).

By default a sealed backup is kept until you clean it up explicitly. If the `backup-sealed-ttl` configuration setting is non-zero, Redis automatically cleans up a sealed backup after the configured number of seconds; a value of `0` disables automatic cleanup.

For the full workflow, see [Redis persistence]({{< relref "/operate/oss_and_stack/management/persistence" >}}#online-backups-with-the-backup-command-family).

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="backup-cleanup-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

{{< /multitabs >}}

## See also

[`BACKUP START`]({{< relref "commands/backup-start/" >}}) | [`BACKUP SEAL`]({{< relref "commands/backup-seal/" >}}) | [`BACKUP STATUS`]({{< relref "commands/backup-status/" >}}) | [`BACKUP LIST`]({{< relref "commands/backup-list/" >}}) | [`BACKUP ABORT`]({{< relref "commands/backup-abort/" >}})

## Related topics

- [Redis persistence]({{< relref "/operate/oss_and_stack/management/persistence" >}})
