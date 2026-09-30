---
Title: Upgrade an existing Redis Enterprise Software deployment
alwaysopen: false
categories:
- docs
- operate
- rs
description: null
hideListLinks: true
linkTitle: Upgrade
weight: 60
url: '/operate/rs/7.4/installing-upgrading/upgrading/'
---
To upgrade Redis Enterprise Software:

1. Verify appropriate [network ports](/content/operate/rs/7.4/networking/port-configurations.md) are either open or used by Redis Enterprise Software.

1. [Upgrade the software on all nodes of the cluster.](/content/operate/rs/7.4/installing-upgrading/upgrading/upgrade-cluster.md)

2. _(Optional)_ [Upgrade each database](/content/operate/rs/7.4/installing-upgrading/upgrading/upgrade-database.md) in the cluster or [upgrade an Active-Active database](/content/operate/rs/7.4/installing-upgrading/upgrading/upgrade-active-active.md) to enable new features and important fixes.
