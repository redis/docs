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

The API operation for on-demand backups is `POST /subscriptions/{subscriptionId}/databases/{databaseId}/backup`.
On-demand database backup is an [asynchronous operation]({{< relref "/operate/rc/api/get-started/process-lifecycle.md#asynchronous-operations" >}}).

```shell
POST "https://[host]/v1/subscriptions/<subscriptionId>/databases/<databaseId>/backup"    
```

The backup database API does not require a body.
Instead, the `periodicBackupPath` must be set to a valid path with available storage capacity to store the backup files for the specific database.

## Import a database

You can import data into an existing database from multiple storage sources, including AWS S3, Redis, and FTP.
Database import is an [asynchronous operation]({{< relref "/operate/rc/api/get-started/process-lifecycle.md#asynchronous-operations" >}}).

The API operation for performing on-demand backup is `POST /v1/subscriptions/{subscriptionId}/databases/{databaseId}/import`.

The requirements for data import are:

- The URI of the data
    - The source URI must be accessible to the importing database
    - The data format must be a Redis backup file or a Redis database
- The subscription ID and database ID of the destination database

The duration of the import process depends on the amount of data imported and the network bandwidth between the data source and the importing database.

{{< warning >}}
Data imported into an existing database overwrites any existing data.
{{< /warning >}}

To import the data, run:

```shell
POST "https://[host]/v1/subscriptions/<subscriptionId>/databases/{databaseId}/import" \
{
  "sourceType": "aws-s3",
  "importFromUri": [
      "s3://bucketname/filename-dbForAWSBackup-1_of_3.rdb.gz",
      "s3://bucketname/filename-dbForAWSBackup-2_of_3.rdb.gz",
      "s3://bucketname/filename-dbForAWSBackup-3_of_3.rdb.gz"
  ]
}
```

You can specify the backup location with the `sourceType` and `importFromUri` values for these sources:

|Data location|sourceType|importFromUri|
|---|---|---|
|Amazon AWS S3|aws-s3|s3://bucketname/[path/]filename.rdb[.gz]|
|FTP|ftp|ftp://[username][:password]@[:port]/[path/]filename.rdb[.gz]|
|Google Blob Storage|google-blob-storage|gs://bucketname/[path/]filename.rdb[.gz]|
|Microsoft Azure Blob Storage|azure-blob-storage|abs://:storage_account_access_key@storage_account_name/[container/]filename.rdb[.gz]|
|Redis server|redis|redis://[db_password]@[host]:[port]|
|Web server|HTTP|HTTP://[username][:password]@[:port]/[path/]filename.rdb[.gz]|
