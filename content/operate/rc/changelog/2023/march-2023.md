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
tags:
- changelog
weight: 88
aliases:
  - /operate/rc/changelog/march-2023
---

This changelog lists new features, enhancements, and other changes added to Redis Cloud during March 2023.

## New features and enhancements

### Redis 7.0 preview

A preview of Redis 7.0 is available for [Fixed subscriptions](/content/operate/rc/databases/create-database/create-essentials-database.md) in selected regions in AWS and GCP. However, some Redis 7.0 functionality might not be fully available during preview. Redis 7.0 also introduces several changes to existing Redis commands; see the [list of breaking changes](#redis-70-breaking-changes) for more details.

The following tables show which new open source Redis 7.0 commands are supported in Redis 7.0 subscriptions.

#### [Cluster management commands](/content/commands?group=cluster)

| <span style="min-width: 10em; display: table-cell">Command</span> | Supported |
|:--------|:----------|
| [CLUSTER ADDSLOTSRANGE](/content/commands/cluster-addslotsrange.md) | <span title="Not supported">&#x274c; Not supported</span> |
| [CLUSTER DELSLOTSRANGE](/content/commands/cluster-delslotsrange.md) | <span title="Not supported">&#x274c; Not supported</span> |
| [CLUSTER LINKS](/content/commands/cluster-links.md) | <span title="Not supported">&#x274c; Not supported</span> |
| [CLUSTER SHARDS](/content/commands/cluster-shards.md) | <span title="Not supported">&#x274c; Not supported</span> |

#### [Connection management commands](/content/commands?group=connection)

| <span style="min-width: 10em; display: table-cell">Command</span> | Supported |
|:--------|:----------|
| [CLIENT NO-EVICT](/content/commands/client-no-evict.md) | <span title="Not supported">&#x274c; Not supported</span> |

#### Data type commands

| Data type | Command | Supported |
|:----------|:--------|:----------|
| [List](/content/commands?group=list) | [BLMPOP](/content/commands/blmpop.md) | <span title="Supported">&#x2705; Supported</span>|
| [List](/content/commands?group=list) | [LMPOP](/content/commands/lmpop.md) | <span title="Supported">&#x2705; Supported</span>|
| [Set](/content/commands?group=set) | [SINTERCARD](/content/commands/sintercard.md) | <span title="Supported">&#x2705; Supported</span>|
| [Sorted set](/content/commands?group=sorted-set) | [BZMPOP](/content/commands/bzmpop.md) | <span title="Supported">&#x2705; Supported</span>|
| [Sorted set](/content/commands?group=sorted-set) | [ZINTERCARD](/content/commands/zintercard.md) | <span title="Supported">&#x2705; Supported</span>|
| [Sorted set](/content/commands?group=sorted-set) | [BZMPOP](/content/commands/bzmpop.md) | <span title="Supported">&#x2705; Supported</span>|

#### [Keys (generic) commands](/content/commands?group=generic)

| <span style="min-width: 10em; display: table-cell">Command</span> | Supported |
|:--------|:----------|
| [EXPIRETIME](/content/commands/expiretime.md) | <span title="Supported">&#x2705; Supported</span>|
| [PEXPIRETIME](/content/commands/pexpiretime.md) | <span title="Supported">&#x2705; Supported</span>|
| [SORT_RO](/content/commands/sort_ro.md) | <span title="Supported">&#x2705; Supported</span>|

#### [Pub/sub commands](/content/commands?group=pubsub)

| <span style="min-width: 10em; display: table-cell">Command</span> | Supported |
|:--------|:----------|
| [PUBSUB SHARDCHANNELS](/content/commands/pubsub-shardchannels.md) | <span title="Supported">&#x2705; Supported</span>|
| [PUBSUB SHARDNUMSUB](/content/commands/pubsub-shardnumsub.md) | <span title="Supported">&#x2705; Supported</span>|
| [SPUBLISH](/content/commands/spublish.md) | <span title="Not supported">&#x274c; Not supported</span> |
| [SSUBSCRIBE](/content/commands/ssubscribe.md) | <span title="Not supported">&#x274c; Not supported</span> |
| [SUNSUBSCRIBE](/content/commands/sunsubscribe.md) | <span title="Not supported">&#x274c; Not supported</span> |

#### [Scripting and function commands](/content/commands?group=scripting)

| <span style="min-width: 10em; display: table-cell">Command</span> | Supported |
|:--------|:----------|
| [EVAL_RO](/content/commands/eval_ro.md) | <span title="Not supported">&#x274c; Not supported</span> |
| [EVALSHA_RO](/content/commands/evalsha_ro.md) | <span title="Not supported">&#x274c; Not supported</span> |
| [FUNCTION DELETE](/content/commands/function-delete.md) | <span title="Supported">&#x2705; Supported</span>|
| [FUNCTION DUMP](/content/commands/function-dump.md) | <span title="Supported">&#x2705; Supported</span>|
| [FUNCTION FLUSH](/content/commands/function-flush.md) | <span title="Supported">&#x2705; Supported</span>|
| [FUNCTION HELP](/content/commands/function-help.md) | <span title="Supported">&#x2705; Supported</span>|
| [FUNCTION KILL](/content/commands/function-kill.md) | <span title="Supported">&#x2705; Supported</span>|
| [FUNCTION LIST](/content/commands/function-list.md) | <span title="Supported">&#x2705; Supported</span>|
| [FUNCTION LOAD](/content/commands/function-load.md) | <span title="Supported">&#x2705; Supported</span>|
| [FUNCTION RESTORE](/content/commands/function-restore.md) | <span title="Supported">&#x2705; Supported</span>|
| [FUNCTION STATS](/content/commands/function-stats.md) | <span title="Not supported">&#x274c; Not supported</span> |

#### [Server management commands](/content/commands?group=server)

| <span style="min-width: 10em; display: table-cell">Command</span> | Supported |
|:--------|:----------|
| [ACL DRYRUN](/content/commands/acl-dryrun.md) | <span title="Not supported">&#x274c; Not supported</span> |
| [COMMAND DOCS](/content/commands/command-docs.md) | <span title="Supported">&#x2705; Supported</span>|
| [COMMAND GETKEYSANDFLAGS](/content/commands/command-getkeysandflags.md) | <span title="Supported">&#x2705; Supported</span>|
| [COMMAND LIST](/content/commands/command-list.md) | <span title="Supported">&#x2705; Supported</span>|
| [MODULE LOADEX](/content/commands/module-loadex.md) | <span title="Not supported">&#x274c; Not supported</span> |
| [LATENCY HISTOGRAM](/content/commands/latency-histogram.md) | <span title="Not supported">&#x274c; Not supported</span> |

## Breaking changes

{{<embed-md "r7-breaking-changes.md">}}

## Deprecations

- [`CLUSTER SLOTS`](/content/commands/cluster-slots.md) is deprecated as of Redis 7.0
