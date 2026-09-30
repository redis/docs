---
Title: Install Redis Enterprise Software on Linux
alwaysopen: false
categories:
- docs
- operate
- rs
description: Install Redis Enterprise Software on Linux.
linkTitle: Install on Linux
weight: 10
url: '/operate/rs/7.22/installing-upgrading/install/install-on-linux/'
---

After you [download a Redis Enterprise Software installation package](/content/operate/rs/7.22/installing-upgrading/install/prepare-install/download-install-package.md), install it on one of the nodes in the cluster.

For installation on machines without an internet connection, see [Offline installation](/content/operate/rs/7.22/installing-upgrading/install/offline-installation.md).

## Install on Linux

To install Redis Enterprise Software, use the command line:

1. Copy the installation package to the node.

1. On the node, change to the directory where the installation package is located and extract the installation files:

    ```sh
    tar vxf <tarfile name>
    ```

1.  _(Optional)_ Use the {{< download "GPG key file" "../GPG-KEY-redislabs-packages.gpg" >}} to confirm the authenticity of Ubuntu/Debian or RHEL RPM packages:

    - For Ubuntu:
        1. Import the key:
        ```sh
        gpg --import <path to GPG key>
        ```
        2. Verify the package signature:
        ```sh
        dpkg-sig --verify </path-to/package.deb>
        ```

    - For RHEL:
        1. Import the key:
        ```sh
        rpm --import <path to GPG key>
        ```
        2. Verify the package signature:
         ```sh
         rpm --checksig </path-to/package.rpm>
         ```

1. To start the installation process, run the installation script. See [installation script options](/content/operate/rs/7.22/installing-upgrading/install/install-script.md) for a complete list of command-line options.

    **For default installation:**
    ```sh
    sudo ./install.sh
    ```

    **For custom installation directories:**

    If you need to specify custom storage paths for persistent or ephemeral storage during cluster setup, you must install Redis Enterprise Software to custom directories.

    ```sh
    sudo ./install.sh --install-dir <path> --config-dir <path> --var-dir <path>
    ```

    For detailed information about custom installations, see [Customize installation directories](/content/operate/rs/7.22/installing-upgrading/install/customize-install-directories.md).

    > [!NOTE]
    > - The Redis Enterprise Software files are installed in the default [file locations](/content/operate/rs/7.22/installing-upgrading/install/plan-deployment/file-locations.md) unless you specify custom directories.
    > - By default, Redis Enterprise Software runs on the OS as the `redislabs` user and `redislabs` group. If needed, you can [specify a different user and group](/content/operate/rs/7.22/installing-upgrading/install/customize-user-and-group.md) during the installation.
    > - You must either be the root user or use `sudo` to run the installation script.

1. Answer the [installation questions](/content/operate/rs/7.22/installing-upgrading/install/manage-installation-questions.md) when shown to complete the installation process.

    > [!NOTE]
    > To skip the installation questions, use one of the following methods:
    >
    > - Run `./install.sh -y` to answer yes to all of the questions.
    > - Create an [answer file](/content/operate/rs/7.22/installing-upgrading/install/manage-installation-questions.md#configure-file-to-answer) to answer installation questions automatically.

1. When installation completes successfully, the output displays the Cluster Manager UI's IP address:

    ```sh
    Summary:
    -------
    ALL TESTS PASSED.
    2017-04-24 10:54:15 [!] Please logout and login again to make
    sure all environment changes are applied.
    2017-04-24 10:54:15 [!] Point your browser at the following
    URL to continue:
    2017-04-24 10:54:15 [!] https://<your_ip_here>:8443
    ```

1. Repeat this process for each node in the cluster.


## Auto Tiering installation

If you want to use Auto Tiering for your databases, review the prerequisites, storage requirements, and [other considerations](/content/operate/rs/7.22/databases/auto-tiering/_index.md) for Auto Tiering databases and prepare and format the flash memory.

After you install Redis Enterprise Software, use the `prepare_flash` script to prepare and format flash memory:

```sh
sudo /opt/redislabs/sbin/prepare_flash.sh
```

This script finds unformatted disks and mounts them as RAID partitions in `/var/opt/redislabs/flash`.

To verify the disk configuration, run:

```sh
sudo lsblk
```

## More info and options

To learn more about customization and find answers to related questions, see:

- [CentOS/RHEL firewall configuration](/content/operate/rs/7.22/installing-upgrading/configuring/centos-rhel-firewall.md)
- [Change socket file location](/content/operate/rs/7.22/installing-upgrading/configuring/change-location-socket-files.md)
- [Cluster DNS configuration](/content/operate/rs/7.22/networking/cluster-dns.md)
- [Cluster load balancer setup](/content/operate/rs/7.22/networking/cluster-lba-setup.md)
- [mDNS client prerequisites](/content/operate/rs/7.22/networking/mdns.md)
- [File locations](/content/operate/rs/7.22/installing-upgrading/install/plan-deployment/file-locations.md)
- [Supported platforms](/content/operate/rs/7.22/installing-upgrading/install/plan-deployment/supported-platforms.md)

## Limitations

Several Redis Enterprise Software installation reference files are installed to the directory `/etc/opt/redislabs/` even if you use [custom installation directories](/content/operate/rs/7.22/installing-upgrading/install/customize-install-directories.md).

As a workaround to install Redis Enterprise Software without using any root directories, do the following before installing Redis Enterprise Software:

1. Create all custom, non-root directories you want to use with Redis Enterprise Software.

1. Mount `/etc/opt/redislabs` to one of the custom, non-root directories.

## Next steps

1. [Create](/content/operate/rs/7.22/clusters/new-cluster-setup.md)
    or [join](/content/operate/rs/7.22/clusters/add-node.md) an existing Redis Enterprise Software cluster.

1. [Create a database](/content/operate/rs/7.22/databases/create.md).

    For geo-distributed Active-Active replication, create an [Active-Active](/content/operate/rs/7.22/databases/active-active/create.md) database.

1. [Add users](/content/operate/rs/7.22/security/access-control/create-users.md) to the cluster with specific permissions.  To begin, start with [Access control](/content/operate/rs/7.22/security/access-control/_index.md).
