---
Title: Install Redis Enterprise Software
alwaysopen: false
categories:
- docs
- operate
- rs
description: Install Redis Enterprise Software on Linux.
hideListLinks: true
linkTitle: Install
weight: 35
url: '/operate/rs/7.22/installing-upgrading/install/'
---

After you [plan your deployment](/content/operate/rs/7.22/installing-upgrading/install/plan-deployment/_index.md), [download a Redis Enterprise Software installation package](/content/operate/rs/7.22/installing-upgrading/install/prepare-install/download-install-package.md), and finish [installation preparation](/content/operate/rs/7.22/installing-upgrading/install/prepare-install/_index.md):

1. [Install the Redis Enterprise Software package](/content/operate/rs/7.22/installing-upgrading/install/install-on-linux.md) on one of the nodes in the cluster.

1. Repeat this process for each node in the cluster.

For installation on machines without an internet connection, see [Offline installation](/content/operate/rs/7.22/installing-upgrading/install/offline-installation.md).

## Permissions and access

- Redis Enterprise Software installation creates the `redislabs:redislabs` user and group. 

    Assigning other users to the `redislabs` group is optional. Users belonging to the `redislabs` group have permission to read and execute (e.g. use the `rladmin` status command) but are not allowed to write (or delete) files or directories.

- Redis Enterprise Software is certified to run with permissions set to `750`, an industry standard.

    > [!WARNING]
    > Do not reduce permissions to `700`. This configuration has not been tested and is not supported.

- Redis Enterprise Software requires `umask` to be `0022` during installation to correctly set permissions for the installed directories and files.

## More info and options

If you've already installed Redis Enterprise Software, you can also:

- [Upgrade an existing deployment](/content/operate/rs/7.22/installing-upgrading/upgrading/_index.md).

- [Uninstall an existing deployment](/content/operate/rs/7.22/installing-upgrading/uninstalling.md).

To learn more about customization and find answers to related questions, see:

- [CentOS/RHEL Firewall configuration](/content/operate/rs/7.22/installing-upgrading/configuring/centos-rhel-firewall.md)
- [Change socket file location](/content/operate/rs/7.22/installing-upgrading/configuring/change-location-socket-files.md)
- [Cluster DNS configuration](/content/operate/rs/7.22/networking/cluster-dns.md)
- [Cluster load balancer setup](/content/operate/rs/7.22/networking/cluster-lba-setup.md)
- [File locations](/content/operate/rs/7.22/installing-upgrading/install/plan-deployment/file-locations.md)
- [Supported platforms](/content/operate/rs/7.22/installing-upgrading/install/plan-deployment/supported-platforms.md)
- [Manage installation questions](/content/operate/rs/7.22/installing-upgrading/install/manage-installation-questions.md)
- [mDNS client prerequisites](/content/operate/rs/7.22/networking/mdns.md)
- [User and group ownership](/content/operate/rs/7.22/installing-upgrading/install/customize-user-and-group.md)

## Next steps

After your cluster is set up with nodes, you can:

- [Add users](/content/operate/rs/7.22/security/access-control/create-users.md) to the cluster with specific permissions.  To begin, start with [Access control](/content/operate/rs/7.22/security/access-control/_index.md).
- [Create databases](/content/operate/rs/7.22/databases/create.md) to use with your applications.

