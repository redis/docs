---
Title: Server management commands compatibility
alwaysopen: false
categories:
- docs
- operate
- rs
- rc
description: Server management commands compatibility.
linkTitle: Server management
toc: 'true'
weight: 10
---

The following tables show which Redis Open Source [server management commands](/commands/?group=server) are compatible with standard and Active-Active databases in Redis Software and Redis Cloud.

## Access control commands

Several access control list (ACL) commands are not available in Redis Software. Instead, you can manage access controls from the [Redis Software Cluster Manager UI](/content/operate/rs/security/access-control/_index.md) and the [Redis Cloud console](/content/operate/rc/security/access-control/data-access-control/role-based-access-control.md).

| <span style="min-width: 9em; display: table-cell">Command</span> | Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:--------|:----------------------|:-----------------|:------|
| [ACL CAT](/content/commands/acl-cat.md) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | Not supported for [scripts](/content/develop/programmability/_index.md). |
| [ACL DELUSER](/content/commands/acl-deluser.md) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [ACL DRYRUN](/content/commands/acl-dryrun.md) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | Might reply with "unknown user" for LDAP users even if `AUTH` succeeds. |
| [ACL GENPASS](/content/commands/acl-genpass.md) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [ACL GETUSER](/content/commands/acl-getuser.md) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | Not supported for [scripts](/content/develop/programmability/_index.md). |
| [ACL HELP](/content/commands/acl-help.md) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | Not supported for [scripts](/content/develop/programmability/_index.md). |
| [ACL LIST](/content/commands/acl-list.md) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | Not supported for [scripts](/content/develop/programmability/_index.md). |
| [ACL LOAD](/content/commands/acl-load.md) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [ACL LOG](/content/commands/acl-log.md) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [ACL SAVE](/content/commands/acl-save.md) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [ACL SETUSER](/content/commands/acl-setuser.md) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [ACL USERS](/content/commands/acl-users.md) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | Not supported for [scripts](/content/develop/programmability/_index.md). |
| [ACL WHOAMI](/content/commands/acl-whoami.md) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | Not supported for [scripts](/content/develop/programmability/_index.md). |


## Configuration commands

| <span style="min-width: 9em; display: table-cell">Command</span> | Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:--------|:----------------------|:-----------------|:------|
| [CONFIG GET](/content/commands/config-get.md) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | [Only supports a subset of configuration settings.](/content/operate/rs/references/compatibility/config-settings.md) |
| [CONFIG RESETSTAT](/content/commands/config-resetstat.md) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [CONFIG REWRITE](/content/commands/config-rewrite.md) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |
| [CONFIG SET](/content/commands/config-set.md) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | [Only supports a subset of configuration settings.](/content/operate/rs/references/compatibility/config-settings.md) |


## General server commands

| <span style="min-width: 9em; display: table-cell">Command</span> | Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:--------|:----------------------|:-----------------|:------|
| [COMMAND](/content/commands/command.md) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |
| [COMMAND COUNT](/content/commands/command-count.md) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |
| [COMMAND DOCS](/content/commands/command-docs.md) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |
| [COMMAND GETKEYS](/content/commands/command-getkeys.md) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |
| [COMMAND GETKEYSANDFLAGS](/content/commands/command-getkeysandflags.md) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |
| [COMMAND HELP](/content/commands/command-help.md) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |
| [COMMAND INFO](/content/commands/command-info.md) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |
| [COMMAND LIST](/content/commands/command-list.md) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |
| [DEBUG](/content/commands/debug.md) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [FLUSHALL](/content/commands/flushall.md) | <span title="Supported">&#x2705; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active\*</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | \*Can use the [Active-Active flush API request](/content/operate/rs/references/rest-api/requests/crdbs/flush.md). |
| [FLUSHDB](/content/commands/flushdb.md) | <span title="Supported">&#x2705; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active\*</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | \*Can use the [Active-Active flush API request](/content/operate/rs/references/rest-api/requests/crdbs/flush.md). |
| [HOTKEYS GET](/content/commands/hotkeys-get.md) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |
| [HOTKEYS HELP](/content/commands/hotkeys-help.md) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |
| [HOTKEYS RESET](/content/commands/hotkeys-reset.md) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |
| [HOTKEYS START](/content/commands/hotkeys-start.md) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |
| [HOTKEYS STOP](/content/commands/hotkeys-stop.md) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |
| [LOLWUT](/content/commands/lolwut.md) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |
| [SHUTDOWN](/content/commands/shutdown.md) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [SWAPDB](/content/commands/swapdb.md) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [TIME](/content/commands/time.md) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |


## Module commands

For Redis Software, you can [manage Redis modules](/content/operate/oss_and_stack/stack-with-enterprise/install/_index.md) from the Cluster Manager UI or with [REST API requests](/content/operate/rs/references/rest-api/requests/modules/_index.md).

Redis Cloud manages modules for you and lets you [enable modules](/content/operate/rc/databases/create-database/_index.md#modules) when you create a database.

| <span style="min-width: 9em; display: table-cell">Command</span> | Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:--------|:----------------------|:-----------------|:------|
| [MODULE HELP](/content/commands/module-help.md) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [MODULE LIST](/content/commands/module-list.md) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |
| [MODULE LOAD](/content/commands/module-load.md) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [MODULE LOADEX](/content/commands/module-loadex.md) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [MODULE UNLOAD](/content/commands/module-unload.md) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |


## Monitoring commands

Although Redis Software does not support certain monitoring commands, you can use the Cluster Manager UI to view Redis Software [metrics](/content/operate/rs/monitoring/_index.md) and [logs](/content/operate/rs/clusters/logging/_index.md) or the Redis Cloud console to view Redis Cloud [metrics](/content/operate/rc/databases/monitor-performance.md) and [logs](/content/operate/rc/logs-reports/system-logs.md).

| <span style="min-width: 9em; display: table-cell">Command</span> | Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:--------|:----------------------|:-----------------|:------|
| [DBSIZE](/content/commands/dbsize.md) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |
| [INFO](/content/commands/info.md) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | In Redis Software, `INFO` returns a different set of fields than Redis Open Source.<br />Not supported for [scripts](/content/develop/programmability/_index.md). |
| [LATENCY DOCTOR](/content/commands/latency-doctor.md) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [LATENCY GRAPH](/content/commands/latency-graph.md) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [LATENCY HELP](/content/commands/latency-help.md) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [LATENCY HISTOGRAM](/content/commands/latency-histogram.md) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |
| [LATENCY HISTORY](/content/commands/latency-history.md) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [LATENCY LATEST](/content/commands/latency-latest.md) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [LATENCY RESET](/content/commands/latency-reset.md) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [MEMORY DOCTOR](/content/commands/memory-doctor.md) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [MEMORY HELP](/content/commands/memory-help.md) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | Not supported for [scripts](/content/develop/programmability/_index.md) in Redis versions earlier than 7. |
| [MEMORY MALLOC-STATS](/content/commands/memory-malloc-stats.md) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [MEMORY PURGE](/content/commands/memory-purge.md) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [MEMORY STATS](/content/commands/memory-stats.md) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [MEMORY USAGE](/content/commands/memory-usage.md) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | Not supported for [scripts](/content/develop/programmability/_index.md) in Redis versions earlier than 7. |
| [MONITOR](/content/commands/monitor.md) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |
| [SLOWLOG GET](/content/commands/slowlog-get.md) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | Not supported for [scripts](/content/develop/programmability/_index.md). |
| [SLOWLOG LEN](/content/commands/slowlog-len.md) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | Not supported for [scripts](/content/develop/programmability/_index.md). |
| [SLOWLOG RESET](/content/commands/slowlog-reset.md) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | Not supported for [scripts](/content/develop/programmability/_index.md). |


## Persistence commands

Data persistence and backup commands are not available in Redis Software. Instead, you can [manage data persistence](/content/operate/rs/databases/configure/database-persistence.md) and [backups](/content/operate/rs/databases/import-export/schedule-backups.md) from the Redis Software Cluster Manager UI and the [Redis Cloud console](/content/operate/rc/databases/view-edit-database.md#durability-section).

| <span style="min-width: 9em; display: table-cell">Command</span> | Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:--------|:----------------------|:-----------------|:------|
| [BGREWRITEAOF](/content/commands/bgrewriteaof.md) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [BGSAVE](/content/commands/bgsave.md) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [LASTSAVE](/content/commands/lastsave.md) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [SAVE](/content/commands/save.md) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |


## Replication commands

Redis Software automatically manages [replication](/content/operate/rs/databases/durability-ha/replication.md).

| <span style="min-width: 9em; display: table-cell">Command</span> | Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:--------|:----------------------|:-----------------|:------|
| [FAILOVER](/content/commands/failover.md) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [MIGRATE](/content/commands/migrate.md) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [PSYNC](/content/commands/psync.md) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [REPLCONF](/content/commands/replconf.md) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [REPLICAOF](/content/commands/replicaof.md) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [RESTORE-ASKING](/content/commands/restore-asking.md) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [ROLE](/content/commands/role.md) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [SLAVEOF](/content/commands/slaveof.md) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | Deprecated as of Redis v5.0.0. |
| [SYNC](/content/commands/sync.md) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
