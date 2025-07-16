---
Title: Back up and export a database
alwaysopen: false
categories:
- docs
- operate
- rc
description: null
linktitle: Back up database and export 
weight: 25
aliases:
    - /operate/rc/administration/configuration/backups
---

The backup options for Redis Cloud databases depend on your plan:

- Redis Cloud Pro subscriptions can back up or export a database on-demand and schedule daily backups that occur during a set hour.

- Paid Redis Cloud Essentials plans can back up or export a database on-demand and schedule backups that occur every 24 hours.  

- Free plans cannot back up or export a database through the Redis Cloud console.

{{<note>}}
The number of database backups that can run simultaneously on a subscription is limited to 4 by default.
{{</note>}}

Backups are saved to predefined storage locations available to your subscription. Backup locations need to be available before you turn on database backups.  To learn more, see [Set up backup storage locations](#set-up-backup-storage-locations).

Backups are saved in RDB format. If the database is comprised of multiple shards, an RDB file will be created for each shard of the database. For more information on restoring data from a backup, see [Restore from an RDB file]({{< relref "/operate/rc/databases/import-data#restore-from-an-rdb-file" >}}).

Here, you'll learn how to store backups using different cloud providers.

## Turn on backups

To turn on database backups:

1. Sign in to the [Redis Cloud console](https://cloud.redis.io/). 

1.  Select the database to open the **Database** page and then select **Edit**.

    {{<image filename="images/rc/database-details-configuration-tab-general-flexible.png" alt="The Configuration tab of the Database details screen." >}}

1.  In the **Durability** section of the **Configuration** tab, locate the **Remote backup** setting:

    {{<image filename="images/rc/database-details-configuration-tab-durability-flexible.png" alt="The Remote backup setting is located in the Durability section of the Configuration tab of the database details screen." >}}

When you enable **Remote backup**, additional options appear.  The options vary according to your subscription.

{{<image filename="images/rc/database-details-configuration-durability-backup.png" alt="Backup settings appear when you enable the Remote backup settings." >}}

|Setting name|Description|
|:-----------|:----------|
| **Interval** | Defines the frequency of automatic backups.  Paid Redis Cloud Essentials databases are backed up every 24 hours.  Redis Cloud Pro databases can be set to 24, 12, 6, 4, 2, or 1 hour backup intervals. |
| **Set backup time** | When checked, this lets you set the hour of the **Backup time**. (_Redis Cloud Pro only_) |
| **Backup time** | Defines the hour automatic backups are made.  Note that actual backup times will vary up in order to minimize customer access disruptions.  (_Redis Cloud Pro only_)<br/> Times are expressed in [Coordinated Universal Time](https://en.wikipedia.org/wiki/Coordinated_Universal_Time) (UTC).|
| **Storage type** | Defines the provider of the storage location, which can be: `AWS S3`, `Google Cloud Storage`, `Azure Blob Storage`, or `FTP` (FTPS). |
| **Backup destination** | Defines a URI representing the backup storage location. |

## Back up and export data on demand

After backups are turned on, you can back up your data at any time.  Use the **Backup now** button in the **Durability** section.

{{<image filename="images/rc/button-database-backup-now.png" alt="Use the Backup Now button to make backups on demand." >}}

You can only use the **Backup now** button after you turn on backups.

## Set up backup storage locations

Database backups can be stored to a cloud provider service or saved to a URI using FTP/FTPS.

Your subscription needs the ability to view permissions and update objects in the storage location.  Specific details vary according to the provider.  To learn more, consult the provider's documentation.

Be aware that provider features change frequently.  For best results, use your provider's documentation for the latest info.

Select the tab for your storage location type.

{{< multitabs id="backup-storage-locations" 
    tab1="AWS S3" 
    tab2="Google Cloud Storage"
    tab3="Azure Blob Storage"
    tab4="FTP/FTPS Server" >}}

To store backups in an Amazon Web Services (AWS) Simple Storage Service (S3) [bucket](https://docs.aws.amazon.com/AmazonS3/latest/userguide/creating-buckets-s3.html):

1. In the [AWS Management Console](https://console.aws.amazon.com/), use the **Services** menu to locate and select **Storage** > **S3**.  This takes you to the Amazon S3 admin panel.

1.  Use the **Buckets** list to locate and select your bucket.  When the settings appear, select the **Permissions** tab, locate the **Bucket policy** section, and then click **Edit**.

    -  If there is no existing bucket policy, add the following JSON bucket policy. Replace `UNIQUE-BUCKET-NAME` with the name of your bucket.

        ```json
        {
            "Version": "2012-10-17",
            "Id": "MyBucketPolicy",
            "Statement": [
                {
                    "Sid": "RedisCloudBackupsAccess",
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": "arn:aws:iam::168085023892:root"
                    },
                    "Action": [
                        "s3:PutObject",
                        "s3:getObject",
                        "s3:DeleteObject"
                    ],
                    "Resource": "arn:aws:s3:::UNIQUE-BUCKET-NAME/*"
                }
            ]
        }
        ```

    - If a bucket policy already exists, add the following JSON policy statement to the list of statements. Replace `UNIQUE-BUCKET-NAME` with the name of your bucket.

        ```json
        {
            "Sid": "RedisCloudBackupsAccess",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::168085023892:root"
            },
            "Action": [
                "s3:PutObject",
                "s3:getObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::UNIQUE-BUCKET-NAME/*"
        }
        ```


1. Save your changes.

1. If the bucket is encrypted using [SSE-KMS](https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingKMSEncryption.html), add the following statement to your [key policy](https://docs.aws.amazon.com/kms/latest/developerguide/key-policy-modifying.html). If you do not have a key policy, see [Creating a key policy](https://docs.aws.amazon.com/kms/latest/developerguide/key-policy-overview.html). Replace `UNIQUE-BUCKET-NAME` with the name of your bucket and `CUSTOM-KEY-ARN` with your key's [Amazon Resource Name (ARN)](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference-arns.html).

    ```json
    {
        "Sid": "Allow use of the key",
        "Effect": "Allow",
        "Principal": {
            "AWS": "arn:aws:iam::168085023892:root"
        },
        "Action": [
            "kms:Encrypt",
            "kms:Decrypt",
            "kms:ReEncrypt*",
            "kms:GenerateDataKey*",
            "kms:DescribeKey"
        ],
        "Resource": [
            "arn:aws:s3:::UNIQUE-BUCKET-NAME/*",
            "CUSTOM-KEY-ARN"
        ]
    }
    ```

Once the bucket is available and the permissions are set, use the name of your bucket as the **Backup destination** for your database's Remote backup settings. For example, suppose your bucket is named *backups-bucket*.  In that case, set **Backup destination** to `s3://backups-bucket`.

To learn more, see [Using bucket policies](https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucket-policies.html) on the AWS docs.

{{< note >}}
An AWS S3 bucket can be used by only one Redis Cloud account. If you have more than one Redis Cloud account, repeat the setup steps for multiple buckets. 
{{< /note >}}

-tab-sep-

To store backups in a Google Cloud Storage [bucket](https://cloud.google.com/storage/docs/creating-buckets):

1. Sign in to the Google Cloud console.

1. In the console menu, locate the _Storage_ section, then select **Cloud Storage&nbsp;>&nbsp;Buckets**.

1. Create or select a bucket.

1. Select the **Permissions** tab.

1. Select the **Grant Access** button and then add:

    ```sh
    service@redislabs-prod-clusters.iam.gserviceaccount.com
    ```

1. Set **Role** to **Storage Legacy Bucket Writer**.

1. Save your changes.

1. Verify that your bucket does _not_ have a set retention policy.  

    To do so:

    1. View the details of your bucket.

    1. Select the **Configuration** tab.

    1. Verify **Protection** -> **Bucket retention policy** is set to **none**.  

    If a policy is defined and you cannot delete it, you need to use a different bucket.

Use the bucket details **Configuration** tab to locate the **gsutil URI**.  This is the value you'll assign to your resource's backup path.

To learn more, see [Use IAM permissions](https://cloud.google.com/storage/docs/access-control/using-iam-permissions#bucket-iam).

-tab-sep-

To store your backup in Microsoft Azure Blob Storage, sign in to the Azure portal and then:

1. [Create an Azure Storage account](https://docs.microsoft.com/en-us/azure/storage/common/storage-account-create) if you do not already have one.

1. [Create a container](https://docs.microsoft.com/en-us/azure/storage/blobs/storage-quickstart-blobs-portal#create-a-container) if you do not already have one.

1. Find your storage account's primary access key. See [Manage storage account access keys](https://docs.microsoft.com/en-us/azure/storage/common/storage-account-keys-manage) for instructions.

Set your resource's **Backup Path** to the path of your storage account.

The syntax for creating the backup varies according to your authorization mechanism.  For example:

```
abs://storage_account_access_key@storage_account_name/container_name/[path/]
```

Where:

- *storage_account_access_key:* the primary access key to the
    storage account
- *storage_account_name:* the storage account name
- *container_name:* the name of the container, if needed.
- *path*: the backups path, if needed.

To learn more, see [Authorizing access to data in Azure Storage](https://docs.microsoft.com/en-us/azure/storage/common/storage-auth).

-tab-sep-

To store your backups on an FTP server, set its **Backup Path** using the following syntax:

```sh
<protocol>://[username]:[password]@[hostname]:[port]/[path]/
```


Where:

- *protocol*: the server's protocol, can be either `ftp` or `ftps`.
- *username*: your username, if needed.
- *password*: your password, if needed.
- *hostname*: the hostname or IP address of the server.
- *port*: the port number of the server, if needed.
- *path*: the backup path, if needed.

    {{< note >}}
If your FTP username or password contains special characters such as `@`, `\`, or `:`, you must URL encode (also known as Percent encode) these special characters. If you don't, your database may become stuck.
    {{< /note >}}

The user account needs permission to write files to the server.

{{< /multitabs >}}
