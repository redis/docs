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
url: '/operate/rs/7.8/installing-upgrading/install/install-on-linux/'
---

After you [download a Redis Enterprise Software installation package]({{< relref "/operate/rs/installing-upgrading/install/prepare-install/download-install-package" >}}), install it on one of the nodes in the cluster.

For installation on machines without an internet connection, see [Offline installation]({{< relref "/operate/rs/installing-upgrading/install/offline-installation" >}}).

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

1. To start the installation process, run the installation script. See [installation script options]({{< relref "/operate/rs/installing-upgrading/install/install-script" >}}) for a list of command-line options you can add to the following command:

    ```sh
    sudo ./install.sh
    ```

    {{< note >}}
- The Redis Enterprise Software files are installed in the default [file locations]({{< relref "/operate/rs/installing-upgrading/install/plan-deployment/file-locations.md" >}}). 
- By default, Redis Enterprise Software runs on the OS as the `redislabs` user and `redislabs` group. If needed, you can [specify a different user and group]({{< relref "/operate/rs/installing-upgrading/install/customize-user-and-group.md" >}}) during the installation.
- You must either be the root user or use `sudo` to run the installation script.
    {{< /note >}}

1. Answer the [installation questions]({{< relref "/operate/rs/installing-upgrading/install/manage-installation-questions.md" >}}) when shown to complete the installation process.

    {{< note >}}
To skip the installation questions, use one of the following methods:

- Run `./install.sh -y` to answer yes to all of the questions.
- Create an [answer file]({{< relref "/operate/rs/installing-upgrading/install/manage-installation-questions#configure-file-to-answer" >}}) to answer installation questions automatically.
    {{< /note >}}

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

If you want to use Auto Tiering for your databases, review the prerequisites, storage requirements, and [other considerations]({{< relref "/operate/rs/databases/auto-tiering/" >}}) for Auto Tiering databases and prepare and format the flash memory.

After you [install on Linux](#install-on-linux), use the `prepare_flash` script to prepare and format flash memory:

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

- [CentOS/RHEL firewall configuration]({{< relref "/operate/rs/installing-upgrading/configuring/centos-rhel-firewall.md" >}})
- [Change socket file location]({{< relref "/operate/rs/installing-upgrading/configuring/change-location-socket-files.md" >}})
- [Cluster DNS configuration]({{< relref "/operate/rs/networking/cluster-dns.md" >}})
- [Cluster load balancer setup]({{< relref "/operate/rs/networking/cluster-lba-setup.md" >}})
- [mDNS client prerequisites]({{< relref "/operate/rs/networking/mdns.md" >}})
- [File locations]({{< relref "/operate/rs/installing-upgrading/install/plan-deployment/file-locations.md" >}})
- [Supported platforms]({{< relref "/operate/rs/installing-upgrading/install/plan-deployment/supported-platforms.md" >}})

## Limitations

Several Redis Enterprise Software installation reference files are installed to the directory `/etc/opt/redislabs/` even if you use [custom installation directories]({{< relref "/operate/rs/installing-upgrading/install/customize-install-directories" >}}).

As a workaround to install Redis Enterprise Software without using any root directories, do the following before installing Redis Enterprise Software:

1. Create all custom, non-root directories you want to use with Redis Enterprise Software.

1. Mount `/etc/opt/redislabs` to one of the custom, non-root directories.

## Next steps

1. [Create]({{< relref "/operate/rs/clusters/new-cluster-setup.md" >}})
    or [join]({{< relref "/operate/rs/clusters/add-node.md" >}}) an existing Redis Enterprise Software cluster.

1. [Create a database]({{< relref "/operate/rs/databases/create" >}}).

    For geo-distributed Active-Active replication, create an [Active-Active]({{< relref "/operate/rs/databases/active-active/create.md" >}}) database.

1. [Add users]({{< relref "/operate/rs/security/access-control/create-users" >}}) to the cluster with specific permissions.  To begin, start with [Access control]({{< relref "/operate/rs/security/access-control" >}}).
