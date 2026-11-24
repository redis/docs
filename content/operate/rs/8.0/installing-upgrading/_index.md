---
Title: Install, set up, and upgrade Redis Software
alwaysopen: false
categories:
- docs
- operate
- rs
description: Learn how to install, set up, and upgrade Redis Software.
hideListLinks: true
linkTitle: Install and upgrade
toc: 'true'
weight: 35
url: '/operate/rs/8.0/installing-upgrading/'
---

You can run self-managed Redis Software in an on-premises data center or on your preferred cloud platform. 

If you prefer a fully managed Redis database-as-a-service, available on major public cloud services, consider setting up a [Redis Cloud](/content/operate/rc/_index.md) subscription. You can [try Redis Cloud](https://redis.io/try-free/) for free.

## Quickstarts

If you want to try out Redis Software, see the following quickstarts:

- [Redis Software quickstart](/content/operate/rs/8.0/installing-upgrading/quickstarts/redis-enterprise-software-quickstart.md)

- [Docker quickstart for Redis Software](/content/operate/rs/8.0/installing-upgrading/quickstarts/docker-quickstart.md)

## Install Redis Software

To install Redis Software on a [supported platform](/content/operate/rs/8.0/installing-upgrading/install/plan-deployment/supported-platforms.md), you need to:

1. [Plan your deployment](/content/operate/rs/8.0/installing-upgrading/install/plan-deployment/_index.md).

1. [Prepare to install](/content/operate/rs/8.0/installing-upgrading/install/prepare-install/_index.md).

1. [Perform the install](/content/operate/rs/8.0/installing-upgrading/install/_index.md).

Depending on your needs, you may also want to [customize the installation](#more-info-and-options).

## Upgrade existing deployment

If you already installed Redis Software, you can:

- [Upgrade a cluster](/content/operate/rs/8.0/installing-upgrading/upgrading/upgrade-cluster.md)

- [Upgrade a database](/content/operate/rs/8.0/installing-upgrading/upgrading/upgrade-database.md)

- [Upgrade an Active-Active database](/content/operate/rs/8.0/installing-upgrading/upgrading/upgrade-active-active.md)

## Uninstall Redis Software

- [Uninstall existing deployment](/content/operate/rs/8.0/installing-upgrading/uninstalling.md)

## More info and options

More information is available to help with customization and related questions:

- [CentOS/RHEL firewall configuration](/content/operate/rs/8.0/installing-upgrading/configuring/centos-rhel-firewall.md)
- [Change socket file location](/content/operate/rs/8.0/installing-upgrading/configuring/change-location-socket-files.md)
- [Cluster DNS configuration](/content/operate/rs/8.0/networking/cluster-dns.md)
- [Cluster load balancer setup](/content/operate/rs/8.0/networking/cluster-lba-setup.md)
- [File locations](/content/operate/rs/8.0/installing-upgrading/install/plan-deployment/file-locations.md)
- [Linux swap space configuration](/content/operate/rs/8.0/installing-upgrading/configuring/linux-swap.md)
- [mDNS client prerequisites](/content/operate/rs/8.0/networking/mdns.md)
- [User and group ownership](/content/operate/rs/8.0/installing-upgrading/install/customize-user-and-group.md)

## Next steps

After you install Redis Software and set up your cluster, you can:

- [Add users](/content/operate/rs/8.0/security/access-control/create-users.md) to the cluster with specific permissions.  To begin, start with [Access control](/content/operate/rs/8.0/security/access-control/_index.md).

- [Create databases](/content/operate/rs/8.0/databases/create.md) to use with your applications.

