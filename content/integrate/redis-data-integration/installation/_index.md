---
Title: Install and upgrade
aliases: /integrate/redis-data-integration/ingest/installation/
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Learn how to install and upgrade RDI
group: di
hideListLinks: false
linkTitle: Install/upgrade
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 20
---

The guides in this section explain the options you have for installing and upgrading RDI on your own servers. See the [Redis Cloud RDI guide](/content/operate/rc/rdi/_index.md) to 
learn how to set up RDI for a cloud database.
Before you use RDI, you must also configure each of your source databases to enable CDC. See the
[Prepare source databases](/content/integrate/redis-data-integration/data-pipelines/prepare-dbs/_index.md)
section to learn how to do this.

To run RDI across two sites for disaster recovery (DR), see
[Disaster recovery (DR)](/content/integrate/redis-data-integration/installation/disaster-recovery/_index.md).
A DR setup requires an external lease for leader election.
