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
description: Start a new backup into the configured 'backupdirname'.
group: server
hidden: false
linkTitle: BACKUP START
railroad_diagram: /images/railroad/backup-start.svg
since: 8.10.0
summary: Start a new backup into the configured 'backupdirname'.
syntax_fmt: BACKUP START
title: BACKUP START
---
Starts a new backup, opening a backup window and producing a fresh BASE snapshot in the directory named by the `backupdirname` configuration setting.

## Examples

```
127.0.0.1:6379> BACKUP START
OK
```

## Details

`BACKUP START` moves the backup state machine from `idle` to `snapshotting` and begins producing a fresh BASE snapshot through an append-only file rewrite (AOFRW). It works whether or not AOF persistence is enabled:

* If AOF is enabled, Redis reuses the existing [multi-part AOF]({{< relref "/operate/oss_and_stack/management/persistence" >}}#append-only-file) directly.
* If AOF is disabled, Redis temporarily starts the AOF machinery without changing the configured `appendonly` value.
* If an AOFRW is already active or scheduled and can be reused, the backup attaches to it.
* If another child process is active, the backup enters the `pending` state and starts when an AOFRW can run.

After the snapshot rewrite completes, Redis hard-links the BASE file into the backup directory and enters the `incrementing` state, where it continues to accumulate incremental writes until you call [`BACKUP SEAL`]({{< relref "/commands/backup-seal" >}}).

The backup directory (named by `backupdirname` and resolved under the Redis working directory `dir`) must be empty when you call `BACKUP START`. Only one backup can be in progress at a time.

For the full workflow and restore procedure, see [Redis persistence]({{< relref "/operate/oss_and_stack/management/persistence" >}}#online-backups-with-the-backup-command-family).

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="backup-start-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

{{< /multitabs >}}

## See also

[`BACKUP SEAL`]({{< relref "commands/backup-seal/" >}}) | [`BACKUP STATUS`]({{< relref "commands/backup-status/" >}}) | [`BACKUP LIST`]({{< relref "commands/backup-list/" >}}) | [`BACKUP ABORT`]({{< relref "commands/backup-abort/" >}}) | [`BACKUP CLEANUP`]({{< relref "commands/backup-cleanup/" >}})

## Related topics

- [Redis persistence]({{< relref "/operate/oss_and_stack/management/persistence" >}})
