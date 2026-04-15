---
Title: Get started with Flex databases for Redis Software
alwaysopen: false
categories:
- docs
- operate
- rs
description: Configure Flex databases on your Redis Software cluster.
linkTitle: Get started
weight: 20
---
This page guides you through a quick setup of [Flex]({{< relref "/operate/rs/flex" >}}) with a single node for testing and demo purposes.

For production environments, see [Plan a Flex deployment for Redis Software]({{<relref "/operate/rs/flex/plan">}}) and more detailed installation instructions in the [install and setup]({{< relref "/operate/rs/installing-upgrading" >}}) section.

To set up a Redis Software cluster using Flex with a single node:

1. Review the [version requirements](#version-requirements).

1. [Install Redis Software](#install-redis-software) or run it in a [Docker container](#dockerbased-installation).

1. [Prepare and format flash memory](#prepare-and-format-flash-memory).

1. [Set up a cluster](#setup-cluster-flash) with flash storage.

1. [Create a new database](#create-a-database) with flash enabled.

1. [Connect to your new database](#connect-to-your-database).

## Version requirements

To create Flex databases, you need:

- Redis Software cluster version 8.0.2-17 or later

- Redis database version 8.2 or later

## Install Redis Software

### Bare metal, VM, Cloud instance

To install on bare metal, a virtual machine, or a Cloud instance:

1. Download the Redis Software binaries from the [download center](https://redis.io/downloads/#Redis_Software).

1. Upload the binaries to a Linux-based operating system.

1. Extract the image:

    ```sh
    tar -vxf <downloaded tar file name>
    ```

1. After the `tar` command completes, you can find a new `install.sh` script in the current directory:

    ```sh
    sudo ./install.sh -y
    ```

### Docker-based installation {#dockerbased-installation}

For testing purposes, you can run a Redis Software Docker container:

```sh
docker run -d --cap-add sys_resource --name rp -p 8443:8443 -p 12000:12000 redislabs/redis:latest
```

## Prepare and format flash memory

After you [install Redis Software](#install-redis-software), use the `prepare_flash` script to prepare and format flash memory:

```sh
sudo /opt/redislabs/sbin/prepare_flash.sh
```

This script finds unformatted disks and mounts them as RAID partitions in `/var/opt/redislabs/flash`.

To verify the disk configuration, run:

```sh
sudo lsblk
```

## Set up a cluster with flash storage {#setup-cluster-flash}

1. Direct your browser to `https://localhost:8443` on the host machine to
see the Redis Software Cluster Manager UI.

    {{<note>}}
Depending on your browser, you may see a certificate error.
Choose "continue to the website" to go to the setup screen.
    {{</note>}}

1. Click **Create new cluster**.

1. Set up account credentials for a cluster administrator, then click **Next** to proceed to cluster setup.

1. Enter your cluster license key if you have one. Otherwise, the cluster uses the trial version.

1. Provide a cluster FQDN such as `mycluster.local`, then click **Next**.

1. In the **Storage configuration** section, turn on the **Enable flash storage** toggle.

1. Click **Create cluster**.

1. Click **OK** to confirm that you are aware of the replacement of the HTTPS TLS certificate on the node, and proceed through the browser warning.

## Create a database

On the **Databases** screen:

1. Select **Quick database**.

1. Verify **Flash** is selected for **Runs on**.

    {{<image filename="images/rs/screenshots/databases/quick-db-flash-7-8-2.png" width="350px" alt="Create a quick database with Runs on Flash selected." >}}

1. Enter `12000` for the endpoint **Port** number.

1. Optionally, select **Full options** to see available alerts.

1. Click **Create**.

You now have a Flex database.

## Connect to your database

After you create the database, you can connect to it and store data. See [Test client connection]({{<relref "/operate/rs/databases/connect/test-client-connectivity">}}) for connection options and examples.

## Next steps

To see the true performance and scale of Flex, you must tune your I/O path and set the flash path to the mounted path of SSD or NVMe flash memory.
