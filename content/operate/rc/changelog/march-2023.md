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
---

This changelog lists new features, enhancements, and other changes added to Redis Cloud during March 2023.

## New features and enhancements

### Redis 7.0 preview

A preview of Redis 7.0 is available for [Fixed subscriptions]({{< relref "/operate/rc/subscriptions/create-fixed-subscription" >}}) in selected regions in AWS and GCP. However, some Redis 7.0 functionality might not be fully available during preview. Redis 7.0 also introduces several changes to existing Redis commands; see the [list of breaking changes](#redis-70-breaking-changes) for more details.

The following tables show which new open source Redis 7.0 commands are supported in Redis 7.0 subscriptions.

#### [Cluster management commands](https://redis.io/commands/?group=cluster)

| <span style="min-width: 10em; display: table-cell">Command</span> | Supported |
|:--------|:----------|
| [CLUSTER ADDSLOTSRANGE](https://redis.io/commands/cluster-addslotsrange) | <span title="Not supported">&#x274c; Not supported</span> |
| [CLUSTER DELSLOTSRANGE](https://redis.io/commands/cluster-delslotsrange) | <span title="Not supported">&#x274c; Not supported</span> |
| [CLUSTER LINKS](https://redis.io/commands/cluster-links) | <span title="Not supported">&#x274c; Not supported</span> |
| [CLUSTER SHARDS](https://redis.io/commands/cluster-shards) | <span title="Not supported">&#x274c; Not supported</span> |

#### [Connection management commands](https://redis.io/commands/?group=connection)

| <span style="min-width: 10em; display: table-cell">Command</span> | Supported |
|:--------|:----------|
| [CLIENT NO-EVICT](https://redis.io/commands/client-no-evict) | <span title="Not supported">&#x274c; Not supported</span> |

#### Data type commands

| Data type | Command | Supported |
|:----------|:--------|:----------|
| [List](https://redis.io/commands/?group=list) | [BLMPOP](https://redis.io/commands/blmpop) | <span title="Supported">&#x2705; Supported</span>|
| [List](https://redis.io/commands/?group=list) | [LMPOP](https://redis.io/commands/lmpop) | <span title="Supported">&#x2705; Supported</span>|
| [Set](https://redis.io/commands/?group=set) | [SINTERCARD](https://redis.io/commands/sintercard) | <span title="Supported">&#x2705; Supported</span>|
| [Sorted set](https://redis.io/commands/?group=sorted-set) | [BZMPOP](https://redis.io/commands/bzmpop) | <span title="Supported">&#x2705; Supported</span>|
| [Sorted set](https://redis.io/commands/?group=sorted-set) | [ZINTERCARD](https://redis.io/commands/zintercard) | <span title="Supported">&#x2705; Supported</span>|
| [Sorted set](https://redis.io/commands/?group=sorted-set) | [BZMPOP](https://redis.io/commands/bzmpop) | <span title="Supported">&#x2705; Supported</span>|

#### [Keys (generic) commands](https://redis.io/commands/?group=generic)

| <span style="min-width: 10em; display: table-cell">Command</span> | Supported |
|:--------|:----------|
| [EXPIRETIME](https://redis.io/commands/expiretime) | <span title="Supported">&#x2705; Supported</span>|
| [PEXPIRETIME](https://redis.io/commands/pexpiretime) | <span title="Supported">&#x2705; Supported</span>|
| [SORT_RO](https://redis.io/commands/sort_ro) | <span title="Supported">&#x2705; Supported</span>|

#### [Pub/sub commands](https://redis.io/commands/?group=pubsub)

| <span style="min-width: 10em; display: table-cell">Command</span> | Supported |
|:--------|:----------|
| [PUBSUB SHARDCHANNELS](https://redis.io/commands/pubsub-shardchannels) | <span title="Supported">&#x2705; Supported</span>|
| [PUBSUB SHARDNUMSUB](https://redis.io/commands/pubsub-shardnumsub) | <span title="Supported">&#x2705; Supported</span>|
| [SPUBLISH](https://redis.io/commands/spublish) | <span title="Not supported">&#x274c; Not supported</span> |
| [SSUBSCRIBE](https://redis.io/commands/ssubscribe) | <span title="Not supported">&#x274c; Not supported</span> |
| [SUNSUBSCRIBE](https://redis.io/commands/sunsubscribe) | <span title="Not supported">&#x274c; Not supported</span> |

#### [Scripting and function commands](https://redis.io/commands/?group=scripting)

| <span style="min-width: 10em; display: table-cell">Command</span> | Supported |
|:--------|:----------|
| [EVAL_RO](https://redis.io/commands/eval_ro) | <span title="Not supported">&#x274c; Not supported</span> |
| [EVALSHA_RO](https://redis.io/commands/evalsha_ro) | <span title="Not supported">&#x274c; Not supported</span> |
| [FUNCTION DELETE](https://redis.io/commands/function-delete) | <span title="Supported">&#x2705; Supported</span>|
| [FUNCTION DUMP](https://redis.io/commands/function-dump) | <span title="Supported">&#x2705; Supported</span>|
| [FUNCTION FLUSH](https://redis.io/commands/function-flush) | <span title="Supported">&#x2705; Supported</span>|
| [FUNCTION HELP](https://redis.io/commands/function-help) | <span title="Supported">&#x2705; Supported</span>|
| [FUNCTION KILL](https://redis.io/commands/function-kill) | <span title="Supported">&#x2705; Supported</span>|
| [FUNCTION LIST](https://redis.io/commands/function-list) | <span title="Supported">&#x2705; Supported</span>|
| [FUNCTION LOAD](https://redis.io/commands/function-load) | <span title="Supported">&#x2705; Supported</span>|
| [FUNCTION RESTORE](https://redis.io/commands/function-restore) | <span title="Supported">&#x2705; Supported</span>|
| [FUNCTION STATS](https://redis.io/commands/function-stats) | <span title="Not supported">&#x274c; Not supported</span> |

#### [Server management commands](https://redis.io/commands/?group=server)

| <span style="min-width: 10em; display: table-cell">Command</span> | Supported |
|:--------|:----------|
| [ACL DRYRUN](https://redis.io/commands/acl-dryrun) | <span title="Not supported">&#x274c; Not supported</span> |
| [COMMAND DOCS](https://redis.io/commands/command-docs) | <span title="Supported">&#x2705; Supported</span>|
| [COMMAND GETKEYSANDFLAGS](https://redis.io/commands/command-getkeysandflags) | <span title="Supported">&#x2705; Supported</span>|
| [COMMAND LIST](https://redis.io/commands/command-list) | <span title="Supported">&#x2705; Supported</span>|
| [MODULE LOADEX](https://redis.io/commands/module-loadex) | <span title="Not supported">&#x274c; Not supported</span> |
| [LATENCY HISTOGRAM](https://redis.io/commands/latency-histogram) | <span title="Not supported">&#x274c; Not supported</span> |

## Breaking changes

{{<embed-md "r7-breaking-changes.md">}}

## Deprecations

- [`CLUSTER SLOTS`](https://redis.io/commands/cluster-slots) is deprecated as of Redis 7.0
