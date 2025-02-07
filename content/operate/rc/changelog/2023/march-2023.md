---
Title: Redis Cloud changelog (March 2023)
alwaysopen: false
categories:
- docs
- operate
- rc
description: New features, enhancements, and other changes added to Redis Cloud during
  March 2023.
highlights: Redis 7.0 preview
linktitle: March 2023
weight: 88
aliases:
  - /operate/rc/changelog/march-2023
---

This changelog lists new features, enhancements, and other changes added to Redis Cloud during March 2023.

## New features and enhancements

### Redis 7.0 preview

A preview of Redis 7.0 is available for [Fixed subscriptions]({{< relref "/operate/rc/databases/create-database/create-essentials-database" >}}) in selected regions in AWS and GCP. However, some Redis 7.0 functionality might not be fully available during preview. Redis 7.0 also introduces several changes to existing Redis commands; see the [list of breaking changes](#redis-70-breaking-changes) for more details.

The following tables show which new open source Redis 7.0 commands are supported in Redis 7.0 subscriptions.

#### [Cluster management commands]({{< relref "/commands" >}}?group=cluster)

| <span style="min-width: 10em; display: table-cell">Command</span> | Supported |
|:--------|:----------|
| [CLUSTER ADDSLOTSRANGE]({{< relref "/commands/cluster-addslotsrange" >}}) | <span title="Not supported">&#x274c; Not supported</span> |
| [CLUSTER DELSLOTSRANGE]({{< relref "/commands/cluster-delslotsrange" >}}) | <span title="Not supported">&#x274c; Not supported</span> |
| [CLUSTER LINKS]({{< relref "/commands/cluster-links" >}}) | <span title="Not supported">&#x274c; Not supported</span> |
| [CLUSTER SHARDS]({{< relref "/commands/cluster-shards" >}}) | <span title="Not supported">&#x274c; Not supported</span> |

#### [Connection management commands]({{< relref "/commands" >}}?group=connection)

| <span style="min-width: 10em; display: table-cell">Command</span> | Supported |
|:--------|:----------|
| [CLIENT NO-EVICT]({{< relref "/commands/client-no-evict" >}}) | <span title="Not supported">&#x274c; Not supported</span> |

#### Data type commands

| Data type | Command | Supported |
|:----------|:--------|:----------|
| [List]({{< relref "/commands" >}}?group=list) | [BLMPOP]({{< relref "/commands/blmpop" >}}) | <span title="Supported">&#x2705; Supported</span>|
| [List]({{< relref "/commands" >}}?group=list) | [LMPOP]({{< relref "/commands/lmpop" >}}) | <span title="Supported">&#x2705; Supported</span>|
| [Set]({{< relref "/commands" >}}?group=set) | [SINTERCARD]({{< relref "/commands/sintercard" >}}) | <span title="Supported">&#x2705; Supported</span>|
| [Sorted set]({{< relref "/commands" >}}?group=sorted-set) | [BZMPOP]({{< relref "/commands/bzmpop" >}}) | <span title="Supported">&#x2705; Supported</span>|
| [Sorted set]({{< relref "/commands" >}}?group=sorted-set) | [ZINTERCARD]({{< relref "/commands/zintercard" >}}) | <span title="Supported">&#x2705; Supported</span>|
| [Sorted set]({{< relref "/commands" >}}?group=sorted-set) | [BZMPOP]({{< relref "/commands/bzmpop" >}}) | <span title="Supported">&#x2705; Supported</span>|

#### [Keys (generic) commands]({{< relref "/commands" >}}?group=generic)

| <span style="min-width: 10em; display: table-cell">Command</span> | Supported |
|:--------|:----------|
| [EXPIRETIME]({{< relref "/commands/expiretime" >}}) | <span title="Supported">&#x2705; Supported</span>|
| [PEXPIRETIME]({{< relref "/commands/pexpiretime" >}}) | <span title="Supported">&#x2705; Supported</span>|
| [SORT_RO]({{< relref "/commands/sort_ro" >}}) | <span title="Supported">&#x2705; Supported</span>|

#### [Pub/sub commands]({{< relref "/commands" >}}?group=pubsub)

| <span style="min-width: 10em; display: table-cell">Command</span> | Supported |
|:--------|:----------|
| [PUBSUB SHARDCHANNELS]({{< relref "/commands/pubsub-shardchannels" >}}) | <span title="Supported">&#x2705; Supported</span>|
| [PUBSUB SHARDNUMSUB]({{< relref "/commands/pubsub-shardnumsub" >}}) | <span title="Supported">&#x2705; Supported</span>|
| [SPUBLISH]({{< relref "/commands/spublish" >}}) | <span title="Not supported">&#x274c; Not supported</span> |
| [SSUBSCRIBE]({{< relref "/commands/ssubscribe" >}}) | <span title="Not supported">&#x274c; Not supported</span> |
| [SUNSUBSCRIBE]({{< relref "/commands/sunsubscribe" >}}) | <span title="Not supported">&#x274c; Not supported</span> |

#### [Scripting and function commands]({{< relref "/commands" >}}?group=scripting)

| <span style="min-width: 10em; display: table-cell">Command</span> | Supported |
|:--------|:----------|
| [EVAL_RO]({{< relref "/commands/eval_ro" >}}) | <span title="Not supported">&#x274c; Not supported</span> |
| [EVALSHA_RO]({{< relref "/commands/evalsha_ro" >}}) | <span title="Not supported">&#x274c; Not supported</span> |
| [FUNCTION DELETE]({{< relref "/commands/function-delete" >}}) | <span title="Supported">&#x2705; Supported</span>|
| [FUNCTION DUMP]({{< relref "/commands/function-dump" >}}) | <span title="Supported">&#x2705; Supported</span>|
| [FUNCTION FLUSH]({{< relref "/commands/function-flush" >}}) | <span title="Supported">&#x2705; Supported</span>|
| [FUNCTION HELP]({{< relref "/commands/function-help" >}}) | <span title="Supported">&#x2705; Supported</span>|
| [FUNCTION KILL]({{< relref "/commands/function-kill" >}}) | <span title="Supported">&#x2705; Supported</span>|
| [FUNCTION LIST]({{< relref "/commands/function-list" >}}) | <span title="Supported">&#x2705; Supported</span>|
| [FUNCTION LOAD]({{< relref "/commands/function-load" >}}) | <span title="Supported">&#x2705; Supported</span>|
| [FUNCTION RESTORE]({{< relref "/commands/function-restore" >}}) | <span title="Supported">&#x2705; Supported</span>|
| [FUNCTION STATS]({{< relref "/commands/function-stats" >}}) | <span title="Not supported">&#x274c; Not supported</span> |

#### [Server management commands]({{< relref "/commands" >}}?group=server)

| <span style="min-width: 10em; display: table-cell">Command</span> | Supported |
|:--------|:----------|
| [ACL DRYRUN]({{< relref "/commands/acl-dryrun" >}}) | <span title="Not supported">&#x274c; Not supported</span> |
| [COMMAND DOCS]({{< relref "/commands/command-docs" >}}) | <span title="Supported">&#x2705; Supported</span>|
| [COMMAND GETKEYSANDFLAGS]({{< relref "/commands/command-getkeysandflags" >}}) | <span title="Supported">&#x2705; Supported</span>|
| [COMMAND LIST]({{< relref "/commands/command-list" >}}) | <span title="Supported">&#x2705; Supported</span>|
| [MODULE LOADEX]({{< relref "/commands/module-loadex" >}}) | <span title="Not supported">&#x274c; Not supported</span> |
| [LATENCY HISTOGRAM]({{< relref "/commands/latency-histogram" >}}) | <span title="Not supported">&#x274c; Not supported</span> |

## Breaking changes

{{<embed-md "r7-breaking-changes.md">}}

## Deprecations

- [`CLUSTER SLOTS`]({{< relref "/commands/cluster-slots" >}}) is deprecated as of Redis 7.0
