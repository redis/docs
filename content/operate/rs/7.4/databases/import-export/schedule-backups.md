---
Title: Schedule periodic backups
alwaysopen: false
categories:
- docs
- operate
- rs
description: Schedule backups of your databases to make sure you always have valid backups.
linktitle: Schedule backups
weight: 40
url: '/operate/rs/7.4/databases/import-export/schedule-backups/'
---

Periodic backups provide a way to restore data with minimal data loss.  With Redis Enterprise Software, you can schedule periodic backups to occur once a day (every 24 hours), twice a day (every twelve hours), every four hours, or every hour.

As of v6.2.8, you can specify the start time in UTC for 24-hour or 12-hour backups.

To make an on-demand backup, [export your data]({{< relref "/operate/rs/7.4/databases/import-export/export-data.md" >}}).

You can schedule backups to a variety of locations, including:

- FTP server
- SFTP server
- Local mount point
- Amazon Simple Storage Service (S3)
- Azure Blob Storage
- Google Cloud Storage

The backup process creates compressed (.gz) RDB files that you can [import into a database]({{< relref "/operate/rs/7.4/databases/import-export/import-data.md" >}}).

When you back up a database configured for database clustering,
Redis Enterprise Software creates a backup file for each shard in the configuration.  All backup files are copied to the storage location.

{{< note >}}

- Make sure that you have enough space available in your storage location.
    If there is not enough space in the backup location, the backup fails.
- The backup configuration only applies to the database it is configured on.
- To limit the parallel backup for shards, set both [`tune cluster max_simultaneous_backups`]({{< relref "/operate/rs/7.4/references/cli-utilities/rladmin/tune#tune-cluster" >}}) and [`tune node max_redis_forks`]({{< relref "/operate/rs/7.4/references/cli-utilities/rladmin/tune#tune-node" >}}). `max_simultaneous_backups` is set to 4 by default.

{{< /note >}}

## Schedule periodic backups

Before scheduling periodic backups, verify that your storage location exists and is available to the user running Redis Enterprise Software (`redislabs` by default).  You should verify that:

- Permissions are set correctly.
- The user running Redis Enterprise Software is authorized to access the storage location.
- The authorization credentials work.

Storage location access is verified before periodic backups are scheduled.

To schedule periodic backups for a database:

1. Sign in to the Redis Enterprise Software Cluster Manager UI using admin credentials.

1. From the **Databases** list, select the database, then select **Configuration**.

1. Select the **Edit** button.

1. Expand the **Scheduled backup** section.

1. Select **Add backup path** to open the **Path configuration** dialog.

1. Select the tab that corresponds to your storage location type, enter the location details, and select **Done**. 

    See [Supported storage locations](#supported-storage-locations) for more information about each storage location type.

1. Set the backup **Interval** and **Starting time**.

    | Setting | Description |
    |--------------|-------------|
    | **Interval** | Specifies the frequency of the backup; that is, the time between each backup snapshot.<br/><br/>Supported values include _Every 24 hours_, _Every 12 hours_, _Every 4 hours_, and _Every hour_. |
    | **Starting time** | _v6.2.8 or later:&nbsp;_ Specifies the start time in UTC for the backup; available when **Interval** is set to _Every 24 hours_ or _Every 12 hours_.<br/><br/>If not specified, defaults to a time selected by Redis Enterprise Software. |

7. Select **Save**.

Access to the storage location is verified when you apply your updates.  This means the location, credentials, and other details must exist and function before you can enable periodic backups.

## Default backup start time

If you do _not_ specify a start time for twenty-four or twelve hour backups, Redis Enterprise Software chooses a random starting time in UTC for you.

This choice assumes that your database is deployed to a multi-tenant cluster containing multiple databases.  This means that default start times are staggered (offset) to ensure availability.  This is done by calculating a random offset which specifies a number of seconds added to the start time.  

Here's how it works:

- Assume you're enabling the backup at 4:00 pm (1600 hours).
- You choose to back up your database every 12 hours.
- Because you didn't set a start time, the cluster randomly chooses an offset of 4,320 seconds (or 72 minutes).

This means your first periodic backup occurs 72 minutes after the time you enabled periodic backups (4:00&nbsp;pm&nbsp;+&nbsp;72&nbsp;minutes).  Backups repeat every twelve hours at roughly same time.

The backup time is imprecise because they're started by a trigger process that runs every five minutes.  When the process wakes, it compares the current time to the scheduled backup time.  If that time has passed, it triggers a backup.  

If the previous backup fails, the trigger process retries the backup until it succeeds.

In addition, throttling and resource limits also affect backup times.

For help with specific backup issues, [contact support](https://redis.com/company/support/).


## Supported storage locations {#supported-storage-locations}

Database backups can be saved to a local mount point, transferred to [a URI](https://en.wikipedia.org/wiki/Uniform_Resource_Identifier) using FTP/SFTP, or stored on cloud provider storage.

When saved to a local mount point or a cloud provider, backup locations need to be available to [the group and user]({{< relref "/operate/rs/7.4/installing-upgrading/install/customize-user-and-group.md" >}}) running Redis Enterprise Software, `redislabs:redislabs` by default.  

Redis Enterprise Software needs the ability to view permissions and update objects in the storage location. Implementation details vary according to the provider and your configuration. To learn more, consult the provider's documentation.

The following sections provide general guidelines.  Because provider features change frequently, use your provider's documentation for the latest info.

### FTP server

Before enabling backups to an FTP server, verify that:

- Your Redis Enterprise cluster can connect and authenticate to the FTP server.
- The user specified in the FTP server location has read and write privileges.

To store your backups on an FTP server, set its **Backup Path** using the following syntax:

`ftp://[username]:[password]@[host]:[port]/[path]/`

Where:

- *protocol*: the server's protocol, can be either `ftp` or `ftps`.
- *username*: your username, if needed.
- *password*: your password, if needed.
- *hostname*: the hostname or IP address of the server.
- *port*: the port number of the server, if needed.
- *path*: the backup path, if needed.

Example: `ftp://username:password@10.1.1.1/home/backups/`

The user account needs permission to write files to the server.

### SFTP server

Before enabling backups to an SFTP server, make sure that:

- Your Redis Enterprise cluster can connect and authenticate to the SFTP server.
- The user specified in the SFTP server location has read and write privileges.
- The SSH private keys are specified correctly.  You can use the key generated by the cluster or specify a custom key.

    To use the cluster auto generated key:
    
    1. Go to **Cluster > Security > Certificates**.

    1. Expand **Cluster SSH Public Key**.
    
    1. Download or copy the cluster SSH public key to the appropriate location on the SFTP server.

        Use the server documentation to determine the appropriate location for the SSH public key.

To backup to an SFTP server, enter the SFTP server location in the format:

```sh
sftp://user:password@host<:custom_port>/path/
```

For example: `sftp://username:password@10.1.1.1/home/backups/`

### Local mount point

Before enabling periodic backups to a local mount point, verify that:

- The node can connect to the destination server, the one hosting the mount point.
- The `redislabs:redislabs` user has read and write privileges on the local mount point
and on the destination server.
- The backup location has enough disk space for your backup files. Backup files
are saved with filenames that include the timestamp, which means that earlier backups are not overwritten.

To back up to a local mount point:

1. On each node in the cluster, create the mount point:
    1. Connect to a shell running on Redis Enterprise Software server hosting the node.
    1. Mount the remote storage to a local mount point.

        For example:

        ```sh
        sudo mount -t nfs 192.168.10.204:/DataVolume/Public /mnt/Public
        ```

1. In the path for the backup location, enter the mount point.

    For example: `/mnt/Public`

1. Verify that the user running Redis Enterprise Software has permissions to access and update files in the mount location.

### AWS Simple Storage Service

To store backups in an Amazon Web Services (AWS) Simple Storage Service (S3) [bucket](https://docs.aws.amazon.com/AmazonS3/latest/userguide/creating-buckets-s3.html):

1.  Sign in to the [AWS Management Console](https://console.aws.amazon.com/).

1. [Create an S3 bucket](https://docs.aws.amazon.com/AmazonS3/latest/userguide/creating-buckets-s3.html) if you do not already have one.

1. [Create an IAM User](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users_create.html#id_users_create_console) with permission to add objects to the bucket.

1. [Create an access key](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html#Using_CreateAccessKey) for that user if you do not already have one.

1. In the Redis Enterprise Software Cluster Manager UI, when you enter the backup location details:

    - Select the **AWS S3** tab on the **Path configuration** dialog.

    - In the **Path** field, enter the path of your bucket.

    - In the **Access Key ID** field, enter the access key ID.

    - In the **Secret Access Key** field, enter the secret access key.

You can also connect to a storage service that uses the S3 protocol but is not hosted by Amazon AWS. The storage service must have a valid SSL certificate.

To connect to an S3-compatible storage location:

1. Configure the S3 URL with [`rladmin cluster config`]({{<relref "/operate/rs/7.4/references/cli-utilities/rladmin/cluster/config">}}): 

    ```sh
    rladmin cluster config s3_url <URL>
    ```

    Replace `<URL>` with the hostname or IP address of the S3-compatible storage location.

1. Configure the S3 CA certificate:

    ```sh
    rladmin cluster config s3_ca_cert <filepath>
    ```

    Replace `<filepath>` with the location of the S3 CA certificate `ca.pem`.

### Google Cloud Storage

For [Google Cloud](https://developers.google.com/console/) subscriptions, store your backups in a Google Cloud Storage bucket:

1. Sign in to the Google Cloud Platform console.

1. [Create a JSON service account key](https://cloud.google.com/iam/docs/creating-managing-service-account-keys#creating) if you do not already have one.

1. [Create a bucket](https://cloud.google.com/storage/docs/creating-buckets#create_a_new_bucket) if you do not already have one.

1. [Add a principal](https://cloud.google.com/storage/docs/access-control/using-iam-permissions#bucket-add) to your bucket:

    - In the **New principals** field, add the `client_email` from the service account key.

    - Select "Storage Legacy Bucket Writer" from the **Role** list.

1. In the Redis Enterprise Software Cluster Manager UI, when you enter the backup location details:

    - Select the **Google Cloud Storage** tab on the **Path configuration** dialog.

    - In the **Path** field, enter the path of your bucket.

    - In the **Client ID** field, enter the `client_id` from the service account key.

    - In the **Client Email** field, enter the `client_email` from the service account key.

    - In the **Private Key ID** field, enter the `private_key_id` from the service account key.

    - In the **Private Key** field, enter the `private_key` from the service account key.
      Replace `\n` with new lines.

### Azure Blob Storage

To store your backup in Microsoft Azure Blob Storage, sign in to the Azure portal and then:

To export to Microsoft Azure Blob Storage, sign in to the Azure portal and then:

1. [Create an Azure Storage account](https://docs.microsoft.com/en-us/azure/storage/common/storage-account-create) if you do not already have one.

1. [Create a container](https://docs.microsoft.com/en-us/azure/storage/blobs/storage-quickstart-blobs-portal#create-a-container) if you do not already have one.

1. [Manage storage account access keys](https://docs.microsoft.com/en-us/azure/storage/common/storage-account-keys-manage) to find the storage account name and account keys.

1. In the Redis Enterprise Software Cluster Manager UI, when you enter the backup location details:

    - Select the **Azure Blob Storage** tab on the **Path configuration** dialog.

    - In the **Path** field, enter the path of your bucket.

    - In the **Azure Account Name** field, enter your storage account name.

    - In the **Azure Account Key** field, enter the storage account key.

To learn more, see [Authorizing access to data in Azure Storage](https://docs.microsoft.com/en-us/azure/storage/common/storage-auth).
