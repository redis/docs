---
Title: Install, set up, and upgrade Redis Enterprise Software
alwaysopen: false
categories:
- docs
- operate
- rs
description: Learn how to install, set up, and upgrade Redis Enterprise Software.
hideListLinks: true
linkTitle: Install and upgrade
toc: 'true'
weight: 35
url: '/operate/rs/7.8/installing-upgrading/'
---

You can run self-managed Redis Enterprise Software in an on-premises data center or on your preferred cloud platform. 

If you prefer a fully managed Redis database-as-a-service, available on major public cloud services, consider setting up a [Redis Cloud]({{<relref "/operate/rc">}}) subscription. You can [try Redis Cloud](https://redis.io/try-free/) for free.

## Quickstarts

If you want to try out Redis Enterprise Software, see the following quickstarts:

- [Redis Enterprise Software quickstart]({{< relref "/operate/rs/7.8/installing-upgrading/quickstarts/redis-enterprise-software-quickstart" >}})

- [Docker quickstart for Redis Enterprise Software]({{< relref "/operate/rs/7.8/installing-upgrading/quickstarts/docker-quickstart" >}})

## Install Redis Enterprise Software

To install Redis Enterprise Software on a [supported platform]({{< relref "/operate/rs/7.8/installing-upgrading/install/plan-deployment/supported-platforms" >}}), you need to:

1. [Plan your deployment]({{< relref "/operate/rs/7.8/installing-upgrading/install/plan-deployment" >}}).

1. [Prepare to install]({{< relref "/operate/rs/7.8/installing-upgrading/install/prepare-install" >}}).

1. [Perform the install]({{< relref "/operate/rs/7.8/installing-upgrading/install" >}}).

Depending on your needs, you may also want to [customize the installation](#more-info-and-options).

## Upgrade existing deployment

If you already installed Redis Enterprise Software, you can:

- [Upgrade a cluster]({{< relref "/operate/rs/7.8/installing-upgrading/upgrading/upgrade-cluster" >}})

- [Upgrade a database]({{< relref "/operate/rs/7.8/installing-upgrading/upgrading/upgrade-database" >}})

- [Upgrade an Active-Active database]({{< relref "/operate/rs/7.8/installing-upgrading/upgrading/upgrade-active-active" >}})

## Uninstall Redis Enterprise Software

- [Uninstall existing deployment]({{< relref "/operate/rs/7.8/installing-upgrading/uninstalling" >}})

## More info and options

More information is available to help with customization and related questions:

- [CentOS/RHEL firewall configuration]({{< relref "/operate/rs/7.8/installing-upgrading/configuring/centos-rhel-firewall.md" >}})
- [Change socket file location]({{< relref "/operate/rs/7.8/installing-upgrading/configuring/change-location-socket-files.md" >}})
- [Cluster DNS configuration]({{< relref "/operate/rs/7.8/networking/cluster-dns.md" >}})
- [Cluster load balancer setup]({{< relref "/operate/rs/7.8/networking/cluster-lba-setup.md" >}})
- [File locations]({{< relref "/operate/rs/7.8/installing-upgrading/install/plan-deployment/file-locations.md" >}})
- [Linux swap space configuration]({{< relref "/operate/rs/7.8/installing-upgrading/configuring/linux-swap.md" >}})
- [mDNS client prerequisites]({{< relref "/operate/rs/7.8/networking/mdns.md" >}})
- [User and group ownership]({{< relref "/operate/rs/7.8/installing-upgrading/install/customize-user-and-group.md" >}})

## Next steps

After you install Redis Enterprise Software and set up your cluster, you can:

- [Add users]({{< relref "/operate/rs/7.8/security/access-control/create-users" >}}) to the cluster with specific permissions.  To begin, start with [Access control]({{< relref "/operate/rs/7.8/security/access-control" >}}).

- [Create databases]({{< relref "/operate/rs/7.8/databases/create" >}}) to use with your applications.

