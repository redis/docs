---
Title: Import and export data
alwaysopen: false
categories:
- docs
- operate
- rs
description: How to import, export, flush, and migrate your data.
linkTitle: Import and export
weight: 30
---
You can [import]({{< relref "/operate/rs/databases/import-export/import-data" >}}), [export]({{< relref "/operate/rs/databases/import-export/export-data" >}}),
or [back up]({{< relref "/operate/rs/databases/import-export/schedule-backups.md" >}})
 a Redis Enterprise database.

## [Import data]({{< relref "/operate/rs/databases/import-export/import-data" >}})

Import data from a backup or another Redis database. You can import from a single file or multiple files, such as when you want to import a backup of a clustered database.

## [Export data]({{< relref "/operate/rs/databases/import-export/export-data.md" >}})

Export data from a Redis Enterprise database to a local mount point, an FTP or SFTP server, or cloud provider storage.

## [Schedule automatic backups]({{< relref "/operate/rs/databases/import-export/schedule-backups.md" >}})

Schedule backups of your databases to make sure you always have valid backups.

## [Migrate to Active-Active]({{< relref "/operate/rs/databases/import-export/migrate-to-active-active.md" >}})

Migrate a database to an [Active-Active]({{< relref "/operate/rs/databases/active-active/_index.md" >}}) database using [Replica Of]({{< relref "/operate/rs/databases/import-export/replica-of/" >}}).
