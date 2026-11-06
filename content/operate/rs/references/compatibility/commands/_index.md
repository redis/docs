---
Title: Compatibility with Redis Open Source commands
alwaysopen: false
categories:
- docs
- operate
- rs
- rc
description: Redis Open Source commands compatible with Redis Software.
hideListLinks: true
linkTitle: Commands
weight: 30
---

Each [command reference](/content/commands/_index.md) page shows the command's compatibility with Redis Software and [Redis Cloud](/content/operate/rc/_index.md). To list the commands that aren't fully supported, filter the command reference by compatibility:

- [Redis Software](/content/commands/_index.md?compat=software)
- [Redis Software Active-Active databases](/content/commands/_index.md?compat=software-active_active)
- [Redis Software Flex databases](/content/commands/_index.md?compat=software-flex)
- [Redis Cloud](/content/commands/_index.md?compat=cloud)
- [Redis Cloud Active-Active databases](/content/commands/_index.md?compat=cloud-active_active)

## Cluster commands

[Clustering in Redis Software](/content/operate/rs/databases/durability-ha/clustering.md) and [Redis Cloud](/content/operate/rc/databases/configuration/clustering.md) differs from the [Redis Open Source cluster](/content/operate/oss_and_stack/management/scaling.md) and works with all standard Redis clients.

Redis Software blocks most [cluster commands](/content/commands?group=cluster). If you try to use a blocked cluster command, it returns an error.

## Access control commands

Several access control list (ACL) commands are not available in Redis Software. Instead, you can manage access controls from the [Redis Software Cluster Manager UI](/content/operate/rs/security/access-control/_index.md) and the [Redis Cloud console](/content/operate/rc/security/access-control/data-access-control/role-based-access-control.md).

## Module commands

For Redis Software, you can [manage Redis modules](/content/operate/rs/installing-upgrading/modules/_index.md) from the Cluster Manager UI or with [REST API requests](/content/operate/rs/references/rest-api/requests/modules/_index.md).

Redis Cloud manages modules for you and lets you [enable modules](/content/operate/rc/databases/create-database/_index.md#modules) when you create a database.

## Monitoring commands

Although Redis Software does not support certain monitoring commands, you can use the Cluster Manager UI to view Redis Software [metrics](/content/operate/rs/monitoring/_index.md) and [logs](/content/operate/rs/clusters/logging/_index.md) or the Redis Cloud console to view Redis Cloud [metrics](/content/operate/rc/databases/monitor-performance.md) and [logs](/content/operate/rc/logs-reports/system-logs.md).

## Persistence commands

Data persistence and backup commands are not available in Redis Software. Instead, you can [manage data persistence](/content/operate/rs/databases/configure/database-persistence.md) and [backups](/content/operate/rs/databases/import-export/schedule-backups.md) from the Redis Software Cluster Manager UI and the [Redis Cloud console](/content/operate/rc/databases/view-edit-database.md#durability-section).

## Replication commands

Redis Software automatically manages [replication](/content/operate/rs/databases/durability-ha/replication.md).
