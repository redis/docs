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
url: '/operate/rs/7.4/installing-upgrading/install/'
---

After you [plan your deployment]({{< relref "/operate/rs/7.4/installing-upgrading/install/plan-deployment" >}}), [download a Redis Enterprise Software installation package]({{< relref "/operate/rs/7.4/installing-upgrading/install/prepare-install/download-install-package" >}}), and finish [installation preparation]({{< relref "/operate/rs/7.4/installing-upgrading/install/prepare-install" >}}):

1. [Install the Redis Enterprise Software package]({{< relref "/operate/rs/7.4/installing-upgrading/install/install-on-linux" >}}) on one of the nodes in the cluster.

1. Repeat this process for each node in the cluster.

For installation on machines without an internet connection, see [Offline installation]({{< relref "/operate/rs/7.4/installing-upgrading/install/offline-installation" >}}).

## Permissions and access

- Redis Enterprise Software installation creates the `redislabs:redislabs` user and group. 

    Assigning other users to the `redislabs` group is optional. Users belonging to the `redislabs` group have permission to read and execute (e.g. use the `rladmin` status command) but are not allowed to write (or delete) files or directories.

- Redis Enterprise Software is certified to run with permissions set to `750`, an industry standard.

    {{<warning>}}
Do not reduce permissions to `700`. This configuration has not been tested and is not supported.
    {{</warning>}}

## More info and options

If you've already installed Redis Enterprise Software, you can also:

- [Upgrade an existing deployment]({{< relref "/operate/rs/7.4/installing-upgrading/upgrading" >}}).

- [Uninstall an existing deployment]({{< relref "/operate/rs/7.4/installing-upgrading/uninstalling.md" >}}).

To learn more about customization and find answers to related questions, see:

- [CentOS/RHEL Firewall configuration]({{< relref "/operate/rs/7.4/installing-upgrading/configuring/centos-rhel-firewall.md" >}})
- [Change socket file location]({{< relref "/operate/rs/7.4/installing-upgrading/configuring/change-location-socket-files.md" >}})
- [Cluster DNS configuration]({{< relref "/operate/rs/7.4/networking/cluster-dns.md" >}})
- [Cluster load balancer setup]({{< relref "/operate/rs/7.4/networking/cluster-lba-setup.md" >}})
- [File locations]({{< relref "/operate/rs/7.4/installing-upgrading/install/plan-deployment/file-locations.md" >}})
- [Supported platforms]({{< relref "/operate/rs/7.4/installing-upgrading/install/plan-deployment/supported-platforms.md" >}})
- [Manage installation questions]({{< relref "/operate/rs/7.4/installing-upgrading/install/manage-installation-questions.md" >}})
- [mDNS client prerequisites]({{< relref "/operate/rs/7.4/networking/mdns.md" >}})
- [User and group ownership]({{< relref "/operate/rs/7.4/installing-upgrading/install/customize-user-and-group.md" >}})

## Next steps

After your cluster is set up with nodes, you can:

- [Add users]({{< relref "/operate/rs/7.4/security/access-control/create-users" >}}) to the cluster with specific permissions.  To begin, start with [Access control]({{< relref "/operate/rs/7.4/security/access-control" >}}).
- [Create databases]({{< relref "/operate/rs/7.4/databases/create" >}}) to use with your applications.

