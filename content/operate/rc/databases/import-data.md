---
Title: Import data into a database
alwaysopen: false
categories:
- docs
- operate
- rc
description: null
linktitle: Import data
weight: 20
---
You can import an existing dataset into your Redis Cloud instance from an existing Redis server or an RDB file.

{{< warning >}}
Data imported into an existing database overwrites any existing data.
{{< /warning >}}
<br/>
{{< note >}}
Expired keys are not imported.
As a result, the number of keys in the source and destination databases can be different after the import is complete.
{{< /note >}}

## Prerequisites

Make sure the Redis version of the source database is compatible with the database where the data will be imported.

## Import from a Redis server {#redis-server}

To import a dataset from any publicly available Redis community edition server:

1. Select **Databases** from the Redis Cloud console menu and then select the target database from the database list.
1. Select **Import**.
1. Enter the source database details:
    - Source type - Select **Redis**.
    - Redis Hostname/IP Address - Enter the hostname or the public IP address of the source Redis server.
    - Redis port - Enter the port of the source Redis server if it is not the default value of `6379`.
    - Password - Enter the password, if required by the source Redis database.
1. Select **Import**.

## Restore from an RDB file

If you have an RDB or a compressed RDB file from a previous backup, you can restore data from that file into your Redis Cloud database.

### Via FTP or HTTP

To import an RDB file stored on an FTP or HTTP server:

1. Select **Databases** from the Redis Cloud console menu and then select your database from the list.
1. Select **Import**.
1. Enter the details for the RDB file:
    - Source type - Select **FTP** or **HTTP**.
    - Source path - Enter the URL for the RDB file: `<protocol>://[username][:password]@hostname[:port]/[path/]filename.rdb[.gz]`

    Where:

    - `protocol` - Server protocol: ftp, ftps, http, https
    - `username` - Your username, if necessary
    - `password` - Your password, if necessary
    - `hostname` - Hostname or IP address of the server
    - `port` - Port number of the server, if not `6379`
    - `path` - Path to the file, if necessary
    - `filename` - Filename of the RDB file, including the `.gz` suffix if the file is compressed

    {{< note >}}
If your FTP username or password contains special characters such as `@`, `\`, or `:`, you must URL encode (also known as Percent encode) these special characters. If you don't, your database may become stuck.
    {{< /note >}}

1. For sharded databases with multiple RDB files, select **Add source** to add another RDB file.

1. Select **Import**.

### Via AWS S3

To use the Redis Cloud console to import your data, you must first share the file from the Amazon Web Services (AWS) management console.

To share and import an RDB file that is stored in an AWS Simple Storage Service (S3) bucket:

1. In the [AWS Management Console](https://console.aws.amazon.com/), configure the bucket's [bucket policy](https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucket-policies.html) to give access to Redis Cloud:
    1. Use the **Services** menu to locate and select **Storage** > **S3**.  This takes you to the Amazon S3 admin panel.

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



1. In the [Redis Cloud console](https://cloud.redis.io/), select the target database from the database list.
1. Select **Import**.
1. Enter the details for the RDB file:
    - Source type - Select **AWS S3**.
    - Source path - Enter the URL for the RDB file: `s3://bucketname/[path/]filename.rdb[.gz]`

        Where:

        - `bucketname` - Name of the S3 bucket
        - `path` - Path to the file, if necessary
        - `filename` - Filename of the RDB file, including the .gz suffix if the file is compressed

1. For sharded databases with multiple RDB files, select **Add source** to add another RDB file.

1. Select **Import**.

### Via Google Cloud Storage

To use the Redis Cloud console to import your data, you must first share the file from the Google Cloud console.

To share and import an RDB file that is stored in a Google Cloud Storage bucket:

1. In the Google Cloud Storage bucket, edit the file's Access Control List to give read access to Redis Cloud:
    1. Select **Edit access** in the RDB file menu.
    1. Select **Add item**.
    1. Enter the user details and access:
       - In the Entity field of the new item, select **User**.
       - In the Name field of the new item, enter: `service@redislabs-prod-clusters.iam.gserviceaccount.com`
       - In the Access field of the new item, select **Reader**.
    1. Select **Save**.

    For more info, see [Set ACLs](https://cloud.google.com/storage/docs/access-control/create-manage-lists#set-an-acl).

1. In the [Redis Cloud console](https://cloud.redis.io/), select the target database from the database list.
1. Select **Import**.
1. Enter the details for the RDB file:
    - Source type - Select **Google Cloud Storage**.
    - Source path - Enter the URL for the RDB file: `gs://bucketname/[path/]filename.rdb[.gz]`

        Where:
        - `bucketname` - Name of the GCS bucket
        - `path` - Path to the file
        - `filename` - Filename of the RDB file, including the .gz suffix if the file is compressed

1. For sharded databases with multiple RDB files, select **Add source** to add another RDB file.

1. Select **Import**.

### Via Azure Blob Storage container

To import an RDB file stored in a Microsoft Azure Blog storage container:

1. In the Redis Cloud console, select the target database from the database list.
1. Select **Import**.
1. Enter the details for the RDB file:
    - Source type - Select **Azure Blob Storage**.
    - Source path - Enter the URL for the RDB file:
        ```text
        abs://:storage_account_access_key@storage_account_name/[container/]filename.rdb[.gz]     
        ```

        Where:
        - `storage_account_access_key` - Primary access key to the storage account
        - `storage_account_name` - Name of the storage account
        - `url` - URL of the storage account
        - `container` - Name of the container, if necessary
        - `filename` - Filename of the RDB file, including the .gz suffix if the file is compressed

1. For sharded databases with multiple RDB files, select **Add source** to add another RDB file.

1. Select **Import**.
