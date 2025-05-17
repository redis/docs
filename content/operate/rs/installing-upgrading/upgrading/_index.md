---
Title: Upgrade an existing Redis Software deployment
alwaysopen: false
categories:
- docs
- operate
- rs
description: How to upgrade a cluster's Redis Software version, database version, and operating system.
hideListLinks: true
linkTitle: Upgrade
weight: 60
---

## Upgrade Redis Software

To upgrade Redis Software:

1. Verify appropriate [network ports]({{< relref "/operate/rs/networking/port-configurations.md" >}}) are either open or used by Redis Software.

1. Complete all [prerequisites]({{<relref "/operate/rs/installing-upgrading/upgrading/upgrade-cluster#upgrade-prerequisites">}}) before starting the upgrade.

1. Upgrade the software on all nodes of the cluster using one of the following methods:
    
    - [In-place upgrade]({{<relref "/operate/rs/installing-upgrading/upgrading/upgrade-cluster#in-place-upgrade">}}) - Directly upgrade Redis Software on each node in the cluster. Although this method is simpler than the rolling upgrade method, it might cause brief service interruptions as each node is upgraded.
    
    - [Rolling upgrade]({{<relref "/operate/rs/installing-upgrading/upgrading/upgrade-cluster#rolling-upgrade">}}) - Minimize downtime by adding new nodes with an updated Redis Software version to the cluster, one at a time, while keeping the rest of the cluster operational. This method is recommended for production environments that require continuous availability.

## Upgrade Redis database

[Upgrade each database]({{< relref "/operate/rs/installing-upgrading/upgrading/upgrade-database" >}}) in the cluster or [upgrade an Active-Active database]({{< relref "/operate/rs/installing-upgrading/upgrading/upgrade-active-active" >}}) to enable new features and important fixes.

## Upgrade operating system

To upgrade the cluster's operating system:

1. Complete all [prerequisites]({{<relref "/operate/rs/installing-upgrading/upgrading/upgrade-os#prerequisites">}})  before starting the upgrade.

2. Use one of the following rolling upgrade methods:

    - [Extra node method]({{<relref "/operate/rs/installing-upgrading/upgrading/upgrade-os#extra-node-upgrade">}}) - Recommended if you have additional resources available.

    - [Replace node method]({{<relref "/operate/rs/installing-upgrading/upgrading/upgrade-os#replace-node-upgrade">}}) - Recommended if you cannot temporarily allocate additional resources.