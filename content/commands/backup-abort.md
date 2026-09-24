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
description: Cancel a backup that has not been sealed yet.
group: server
hidden: false
linkTitle: BACKUP ABORT
railroad_diagram: /images/railroad/backup-abort.svg
since: 8.10.0
summary: Cancel a backup that has not been sealed yet.
syntax_fmt: BACKUP ABORT
title: BACKUP ABORT
---
Cancels a backup that has not been sealed yet.

## Examples

```
127.0.0.1:6379> BACKUP ABORT
OK
```

## Details

`BACKUP ABORT` cancels an in-progress backup and moves the backup state machine to `failed`. It is valid from the `pending`, `snapshotting`, and `incrementing` states. After the backup has been sealed, use [`BACKUP CLEANUP`](/content/commands/backup-cleanup.md) instead.

After aborting, you can start a new backup with [`BACKUP START`](/content/commands/backup-start.md).

For the full workflow, see [Redis persistence](/content/operate/oss_and_stack/management/persistence.md#online-backups-with-the-backup-command-family).

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="backup-abort-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

{{< /multitabs >}}

## See also

[`BACKUP START`](/content/commands/backup-start.md) | [`BACKUP SEAL`](/content/commands/backup-seal.md) | [`BACKUP STATUS`](/content/commands/backup-status.md) | [`BACKUP LIST`](/content/commands/backup-list.md) | [`BACKUP CLEANUP`](/content/commands/backup-cleanup.md)

## Related topics

- [Redis persistence](/content/operate/oss_and_stack/management/persistence.md)
