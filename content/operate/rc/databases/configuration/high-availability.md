---
Title: High availability and replication
alwaysopen: false
categories:
- docs
- operate
- rc
description: Describes database replication and high availability as it affects Redis
  Cloud.
linkTitle: High availability
weight: $weight
---

Database replication helps ensure high availability. 

When replication is enabled, your dataset is duplicated to create a replica that is synchronized with the primary dataset.  

Replication allows for automatic failover and greater fault tolerance.  It can prevent data loss in the event of a hardware or zone failure. 

## Options and plan support

Redis Cloud supports three levels of replication:

- _No replication_ means that you will have a single copy of your database.

- _Single-zone replication_ means that your database will have a primary and a replica located in the same cloud zone. If anything happens to the primary, the replica takes over and becomes the new primary.

- _Multi-zone replication_ means that the primary and its replicas are stored in different zones. This means that your database can remain online even if an entire zone becomes unavailable.

Your replication options depend on your [subscription plan]({{< relref "/operate/rc/subscriptions/_index.md" >}}):

- _Free_ plans do not support replication.
- _Fixed_, _Flexible_ and _Annual_ paid plans let you choose between multi-zone or single-zone replication when creating a subscription. You can also turn off replication.

After database creation, you can still enable or turn off replication.  However, [zone settings]({{< relref "/operate/rc/databases/configuration/high-availability#zone-setting-maintenance" >}}) are only configurable during database creation.  

## Performance and cost impact 

Replication can affect performance as traffic increases to synchronize all copies. 

Database storage costs also increase:

- For Fixed plans, single-zone and multi-zone replication effectively doubles storage costs

- For Flexible and Annual plans, replication requires additional shards and can affect subscription costs

## Zone setting maintenance

Zone settings can only be defined when a subscription is created.  You cannot change these settings once the subscription becomes active.

This means you can't convert a multi-zone subscription to a single zone (or vice-versa).  

To use different zone settings, create a new subscription with the preferred settings and then [migrate data]({{< relref "/operate/rc/databases/migrate-databases.md" >}}) from the original subscription.

## More info

To learn more about high availability and replication, see:
- [Highly Available Redis](https://redislabs.com/redis-enterprise/technology/highly-available-redis/)
- [Database replication]({{< relref "/operate/rs/databases/durability-ha/replication.md" >}})
