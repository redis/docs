---
Title: Server management commands compatibility
alwaysopen: false
categories:
- docs
- operate
- rs
description: Server management commands compatibility.
linkTitle: Server management
toc: 'true'
weight: 10
---

The following tables show which open source Redis [server management commands](https://redis.io/commands/?group=server) are compatible with standard and Active-Active databases in Redis Enterprise Software and Redis Cloud.

## Access control commands

Several access control list (ACL) commands are not available in Redis Enterprise. Instead, you can manage access controls from the admin consoles for [Redis Enterprise Software]({{< relref "/operate/rs/security/access-control" >}}) and [Redis Cloud]({{< relref "/operate/rc/security/access-control/data-access-control/role-based-access-control.md" >}}).

| <span style="min-width: 9em; display: table-cell">Command</span> | Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:--------|:----------------------|:-----------------|:------|
| [ACL CAT](https://redis.io/commands/acl-cat) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | Not supported for [scripts](https://redis.io/docs/manual/programmability/). |
| [ACL DELUSER](https://redis.io/commands/acl-deluser) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [ACL DRYRUN](https://redis.io/commands/acl-dryrun) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | Might reply with "unknown user" for LDAP users even if `AUTH` succeeds. |
| [ACL GENPASS](https://redis.io/commands/acl-genpass) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [ACL GETUSER](https://redis.io/commands/acl-getuser) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | Not supported for [scripts](https://redis.io/docs/manual/programmability/). |
| [ACL HELP](https://redis.io/commands/acl-help) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | Not supported for [scripts](https://redis.io/docs/manual/programmability/). |
| [ACL LIST](https://redis.io/commands/acl-list) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | Not supported for [scripts](https://redis.io/docs/manual/programmability/). |
| [ACL LOAD](https://redis.io/commands/acl-load) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [ACL LOG](https://redis.io/commands/acl-log) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [ACL SAVE](https://redis.io/commands/acl-save) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [ACL SETUSER](https://redis.io/commands/acl-setuser) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [ACL USERS](https://redis.io/commands/acl-users) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | Not supported for [scripts](https://redis.io/docs/manual/programmability/). |
| [ACL WHOAMI](https://redis.io/commands/acl-whoami) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | Not supported for [scripts](https://redis.io/docs/manual/programmability/). |


## Configuration commands

| <span style="min-width: 9em; display: table-cell">Command</span> | Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:--------|:----------------------|:-----------------|:------|
| [CONFIG GET](https://redis.io/commands/config-get) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | [Only supports a subset of configuration settings.]({{< relref "/operate/rs/references/compatibility/config-settings" >}}) |
| [CONFIG RESETSTAT](https://redis.io/commands/config-resetstat) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [CONFIG REWRITE](https://redis.io/commands/config-rewrite) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |
| [CONFIG SET](https://redis.io/commands/config-set) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | [Only supports a subset of configuration settings.]({{< relref "/operate/rs/references/compatibility/config-settings" >}}) |


## General server commands

| <span style="min-width: 9em; display: table-cell">Command</span> | Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:--------|:----------------------|:-----------------|:------|
| [COMMAND](https://redis.io/commands/command) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |
| [COMMAND COUNT](https://redis.io/commands/command-count) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |
| [COMMAND DOCS](https://redis.io/commands/command-docs) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |
| [COMMAND GETKEYS](https://redis.io/commands/command-getkeys) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |
| [COMMAND GETKEYSANDFLAGS](https://redis.io/commands/command-getkeysandflags) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |
| [COMMAND HELP](https://redis.io/commands/command-help) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |
| [COMMAND INFO](https://redis.io/commands/command-info) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |
| [COMMAND LIST](https://redis.io/commands/command-list) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |
| [DEBUG](https://redis.io/commands/debug/) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [FLUSHALL](https://redis.io/commands/flushall) | <span title="Supported">&#x2705; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active\*</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | \*Can use the [Active-Active flush API request]({{< relref "/operate/rs/references/rest-api/requests/crdbs/flush" >}}). |
| [FLUSHDB](https://redis.io/commands/flushdb) | <span title="Supported">&#x2705; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active\*</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | \*Can use the [Active-Active flush API request]({{< relref "/operate/rs/references/rest-api/requests/crdbs/flush" >}}). |
| [LOLWUT](https://redis.io/commands/lolwut) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |
| [SHUTDOWN](https://redis.io/commands/shutdown) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [SWAPDB](https://redis.io/commands/swapdb) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [TIME](https://redis.io/commands/time) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |


## Module commands

For Redis Enterprise Software, you can [manage Redis modules]({{< relref "/operate/oss_and_stack/stack-with-enterprise/install/" >}}) from the admin console or with [REST API requests](/rs/references/rest-api/requests/modules/).

Redis Cloud manages modules for you and lets you [enable modules](/rc/databases/create-database#modules) when you create a database.

| <span style="min-width: 9em; display: table-cell">Command</span> | Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:--------|:----------------------|:-----------------|:------|
| [MODULE HELP](https://redis.io/commands/module-help) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [MODULE LIST](https://redis.io/commands/module-list) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |
| [MODULE LOAD](https://redis.io/commands/module-load) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [MODULE LOADEX](https://redis.io/commands/module-loadex) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [MODULE UNLOAD](https://redis.io/commands/module-unload) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |


## Monitoring commands

Although Redis Enterprise does not support certain monitoring commands, you can use the admin consoles to view Redis Enterprise Software [metrics](/rs/clusters/monitoring/) and [logs](/rs/clusters/logging/) or Redis Cloud [metrics](/rc/databases/monitor-performance/) and [logs](/rc/databases/system-logs/).

| <span style="min-width: 9em; display: table-cell">Command</span> | Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:--------|:----------------------|:-----------------|:------|
| [DBSIZE](https://redis.io/commands/dbsize) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |
| [INFO](https://redis.io/commands/info) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | Not supported for [scripts](https://redis.io/docs/manual/programmability/). |
| [LATENCY DOCTOR](https://redis.io/commands/latency-doctor) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [LATENCY GRAPH](https://redis.io/commands/latency-graph) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [LATENCY HELP](https://redis.io/commands/latency-help) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [LATENCY HISTOGRAM](https://redis.io/commands/latency-histogram) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |
| [LATENCY HISTORY](https://redis.io/commands/latency-history) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [LATENCY LATEST](https://redis.io/commands/latency-latest) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [LATENCY RESET](https://redis.io/commands/latency-reset) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [MEMORY DOCTOR](https://redis.io/commands/memory-doctor) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [MEMORY HELP](https://redis.io/commands/memory-help) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |
| [MEMORY MALLOC-STATS](https://redis.io/commands/memory-malloc-stats) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [MEMORY PURGE](https://redis.io/commands/memory-purge) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [MEMORY STATS](https://redis.io/commands/memory-stats) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [MEMORY USAGE](https://redis.io/commands/memory-usage) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |
| [MONITOR](https://redis.io/commands/monitor) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |
| [SLOWLOG GET](https://redis.io/commands/slowlog-get) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | Not supported for [scripts](https://redis.io/docs/manual/programmability/). |
| [SLOWLOG LEN](https://redis.io/commands/slowlog-len) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | Not supported for [scripts](https://redis.io/docs/manual/programmability/). |
| [SLOWLOG RESET](https://redis.io/commands/slowlog-reset) | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | Not supported for [scripts](https://redis.io/docs/manual/programmability/). |


## Persistence commands

Data persistence and backup commands are not available in Redis Enterprise. Instead, you can [manage data persistence]({{< relref "/operate/rs/databases/configure/database-persistence" >}}) and [backups]({{< relref "/operate/rs/databases/import-export/schedule-backups" >}}) from the admin consoles for Redis Enterprise Software and [Redis Cloud]({{< relref "/operate/rc/databases/view-edit-database#durability-section" >}}).

| <span style="min-width: 9em; display: table-cell">Command</span> | Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:--------|:----------------------|:-----------------|:------|
| [BGREWRITEAOF](https://redis.io/commands/bgrewriteaof) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [BGSAVE](https://redis.io/commands/bgsave) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [LASTSAVE](https://redis.io/commands/lastsave) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [SAVE](https://redis.io/commands/save) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |


## Replication commands

Redis Enterprise automatically manages [replication]({{< relref "/operate/rs/databases/durability-ha/replication" >}}).

| <span style="min-width: 9em; display: table-cell">Command</span> | Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:--------|:----------------------|:-----------------|:------|
| [FAILOVER](https://redis.io/commands/failover) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [MIGRATE](https://redis.io/commands/migrate) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [PSYNC](https://redis.io/commands/psync) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [REPLCONF](https://redis.io/commands/replconf) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [REPLICAOF](https://redis.io/commands/replicaof) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [RESTORE-ASKING](https://redis.io/commands/restore-asking) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [ROLE](https://redis.io/commands/role) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
| [SLAVEOF](https://redis.io/commands/slaveof) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | Deprecated as of Redis v5.0.0. |
| [SYNC](https://redis.io/commands/sync) | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |
