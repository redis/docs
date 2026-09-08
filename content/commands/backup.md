---
acl_categories:
- '@slow'
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
complexity: Depends on subcommand.
description: A container for backup management commands.
group: server
hidden: true
linkTitle: BACKUP
railroad_diagram: /images/railroad/backup.svg
since: 8.10.0
summary: A container for backup management commands.
syntax_fmt: BACKUP
title: BACKUP
---
This is a container command for backup management commands.

To see the list of available commands you can call [`BACKUP HELP`]({{< relref "/commands/backup-help" >}}).

For a conceptual overview of how the `BACKUP` command family creates online backups, see [Redis persistence]({{< relref "/operate/oss_and_stack/management/persistence" >}}#online-backups-with-the-backup-command-family).
