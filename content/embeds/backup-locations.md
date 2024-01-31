### FTP server

Before you choose to backup to an FTP server, make sure that:

- The RS cluster has network connectivity to the FTP server.
- The user that you specify in the FTP server location has read and write priviledges.

To backup to an FTP server, enter the FTP server location in the format:

```sh
ftp://user:password@host<:custom_port>/path/
```

For example: `ftp://username:password@10.1.1.1/home/backups/`

### SFTP server

Before you choose to backup to an SFTP server, make sure that:

- The RS cluster has network connectivity to the SFTP server.
- The user that you specify in the SFTP server location has read and write priviledges.
- The RS server and SFTP server have the correct TLS certificates. You can select either:
    - **Use the cluster auto generated key** - Go to **settings** and copy the **Cluster SSH Public Key**
        to the SFTP server.
    - **Use a custom key** - Generate a TLS key pair for the SFTP server, copy the private key to
        the **SSH Private Key** box, and copy the public key to the location required by the SFTP server.

To backup to an SFTP server, enter the SFTP server location in the format:

```sh
sftp://user:password@host:<:custom_port>/path/
```

For example: `sftp://username:password@10.1.1.1/home/backups/`

### AWS S3

Before you choose to backup to Amazon AWS S3, make sure that you have:

- Storage location path in the format: `s3://bucketname/path/`
- Access key ID
- Secret access key

You can also connect to a storage service that uses the S3 protocol but is not hosted by Amazon AWS.
The storage service must have a valid SSL certificate.
To connect to an S3-compatible storage location, run: `rladmin cluster config s3_url <url>`

### Local mount point

Before you choose to backup to a local mount point, make sure that:

- The node has network connectivity to the destination server of the mount point.
- The `redislabs:redislabs` user has read and write priviledges on the local mount point
and on the destination server.
- The backup location has enough disk space for your backup files. The backup files
are saved with filenames that include the timestamp so that backup files are not overwritten.

To backup to a local mount point for a node:

1. On each node in the cluster, create the mount point:
    1. Connect to the terminal of the RS server that the node is running on.
    1. Mount the remote storage to a local mount point.

        For example:

        ```sh
        sudo mount -t nfs 192.168.10.204:/DataVolume/Public /mnt/Public
        ```

1. In the path for the backup location, enter the mount point.

    For example: `/mnt/Public`

### Azure Blob Storage

Before you choose to backup to Azure Blob Storage, make sure that you have:

- Storage location path in the format: `/container_name/[path/]/`
- Account name
- An authentication token, either an account key or an Azure [shared access signature](https://docs.microsoft.com/en-us/rest/api/storageservices/delegate-access-with-shared-access-signature) (SAS).

Azure SAS support requires Redis Software version 6.0.20.  To learn more about Azure SAS, see [Grant limited access to Azure Storage resources using shared access signatures](https://docs.microsoft.com/en-us/azure/storage/common/storage-sas-overview).

### Google Cloud Storage

Before you choose to backup to Google Cloud Storage, make sure that you have:

- Storage location path in the format: `/bucket_name/[path/]/`
- Client ID
- Client email
- Private key ID
- Private key

{{< note >}}

You can find the client and key details in your service account in the Google Cloud console (**API & Services** > **Credentials** > **Create Credentials**).

- Make sure that the service account has the `Storage Legacy Bucket Writer` permission on the target bucket.
- Make sure that the bucket doesn't use a retention policy because it can interfere with the process.
- The format of the private key from the downloaded JSON is in a single string where new lines are marked with `\n` characters.
    When you paste the key into the RS admin console, replace each `\n` character with a new line.

{{< /note >}}
