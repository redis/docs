---
Title: crdb-cli crdb upgrade
alwaysopen: false
categories:
- docs
- operate
- rs
description: Upgrades an Active-Active database.
linkTitle: upgrade
weight: $weight
---

Upgrades the Redis version and modules of an Active-Active database.

```sh
crdb-cli crdb upgrade --crdb-guid <guid>
         [--redis-version <version>]
         [--preserve-roles]
         [--parallel-shards-upgrade <number>]
         [--keep-crdt-protocol-version]
         [--keep-crdt-featureset-version]
         [--discard-data]
         [--force-discard]
         [--force-restart]
         [--no-wait]
```

Before you run this command, upgrade Redis Software to version 8.0.18 or later on each participating cluster in the Active-Active database and complete the other [upgrade prerequisites](/content/operate/rs/installing-upgrading/upgrading/upgrade-active-active.md#upgrade-prerequisites). For the full procedure, see [Upgrade an Active-Active database](/content/operate/rs/installing-upgrading/upgrading/upgrade-active-active.md).

### Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| crdb-guid \<guid\> | string | GUID of the Active-Active database (required) |
| redis-version \<version\> | string | Upgrades the database to the specified Redis version instead of the latest version bundled with Redis Software |
| preserve-roles | | Preserves the shards' primary and replica roles. Requires an extra failover. |
| parallel-shards-upgrade \<number\> | integer or `all` | Maximum number of shards to upgrade in parallel (default: all) |
| keep-crdt-protocol-version | | Keeps the current CRDB protocol version. See [CRDB protocol version guidelines](/content/operate/rs/installing-upgrading/upgrading/upgrade-active-active.md#crdb-protocol-version-guidelines). |
| keep-crdt-featureset-version | | Keeps the current CRDB feature set version. See [Feature set version guidelines](/content/operate/rs/installing-upgrading/upgrading/upgrade-active-active.md#feature-set-version-guidelines). |
| discard-data | | Discards data in a non-replicated, non-persistent database |
| force-discard | | Discards data even if the database is replicated or persistent |
| force-restart | | Restarts the shards even if the version doesn't change |
| no-wait | | Does not wait for the task to complete |

### Returns

Returns the task ID of the task that is upgrading the database.

If `--no-wait` is specified, the command exits. Otherwise, it waits for the upgrade to finish and returns `finished`. To check the status of a task started with `--no-wait`, use [`crdb-cli task status`](/content/operate/rs/references/cli-utilities/crdb-cli/task/status.md).

### Examples

The following example upgrades an Active-Active database to the default Redis version and preserves the shards' roles:

```sh
$ crdb-cli crdb upgrade --crdb-guid <crdb-guid> --preserve-roles
Task <task-id> created
  ---> CRDB GUID Assigned: crdb:<crdb-guid>
  ---> Status changed: queued -> started
  ---> Status changed: started -> finished
```

The following example upgrades an Active-Active database to a specific Redis version:

```sh
$ crdb-cli crdb upgrade --crdb-guid <crdb-guid> --redis-version <version> --preserve-roles
Task <task-id> created
  ---> CRDB GUID Assigned: crdb:<crdb-guid>
  ---> Status changed: queued -> started
  ---> Status changed: started -> finished
```
