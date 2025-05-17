---
Title: Database backup and import
alwaysopen: false
categories:
- docs
- operate
- rc
description: When you create or update a database, you can specify the backup path.
  The import API operation lets you import data from various source types and specified
  locations.
weight: 40
---

## Back up a database

When you create or update a database, you can specify the (optional) `periodicBackupPath` parameter
with a [backup path]({{< relref "/operate/rc/databases/back-up-data" >}}).
This parameter enables periodic and on-demand backup operations for the specified database.

{{<note>}}
The number of database backups that can run simultaneously on a cluster is limited to 4 by default.
{{</note>}}

For Redis Cloud Pro databases, back up a database with [`POST /subscriptions/{subscriptionId}/databases/{databaseId}/backup`]({{< relref "/operate/rc/api/api-reference#tag/Databases-Pro/operation/backupDatabase" >}}). For Redis Cloud Essentials databases, use [`POST /fixed/subscriptions/{subscriptionId}/databases/{databaseId}/backup`]({{< relref "/operate/rc/api/api-reference#tag/Databases-Essentials/operation/backupDatabase_1" >}}).
On-demand database backup is an [asynchronous operation]({{< relref "/operate/rc/api/get-started/process-lifecycle" >}}).

The backup database API does not require a body. Instead, the `periodicBackupPath` must be set to a valid path with available storage capacity to store the backup files for the specific database. You can set an `adhocBackupPath` in the body to specify a different backup location for this backup.

See [Set up backup storage locations]({{< relref "/operate/rc/databases/back-up-data#set-up-backup-storage-locations" >}}) to learn how to configure your backup storage locations.

## Import data to a database

You can import data into an existing database from multiple storage sources, including AWS S3, Redis, and FTP.
Database import is an [asynchronous operation]({{< relref "/operate/rc/api/get-started/process-lifecycle" >}}).

Use [`POST /v1/subscriptions/{subscriptionId}/databases/{databaseId}/import`]({{< relref "/operate/rc/api/api-reference#tag/Databases-Pro/operation/importDatabase" >}}) to import data to an existing Redis Cloud Pro database. For Redis Cloud Essentials databases, use [`POST /fixed/subscriptions/{subscriptionId}/databases/{databaseId}/backup`]({{< relref "/operate/rc/api/api-reference#tag/Databases-Essentials/operation/importDatabase_1" >}})

The requirements for data import are:

- The URI of the data
    - The source URI must be accessible to the importing database
    - The data format must be a Redis backup file or a Redis database
- The subscription ID and database ID of the destination database

The duration of the import process depends on the amount of data imported and the network bandwidth between the data source and the importing database.

{{< warning >}}
Data imported into an existing database overwrites any existing data.
{{< /warning >}}

You can specify the backup location with the `sourceType` and `importFromUri` values for these sources:

|Data location|`sourceType`|`importFromUri`|
|---|---|---|
|Amazon AWS S3|aws-s3|s3://bucketname/[path/]filename.rdb[.gz]|
|FTP|ftp|ftp://[username][:password]@[:port]/[path/]filename.rdb[.gz]|
|Google Blob Storage|google-blob-storage|gs://bucketname/[path/]filename.rdb[.gz]|
|Microsoft Azure Blob Storage|azure-blob-storage|abs://:storage_account_access_key@storage_account_name/[container/]filename.rdb[.gz]|
|Redis server|redis|redis://[db_password]@[host]:[port]|
|Web server|HTTP|HTTP://[username][:password]@[:port]/[path/]filename.rdb[.gz]|

See [Import data]({{< relref "/operate/rc/databases/import-data" >}}) to learn how to set up your storage locations for data import.
