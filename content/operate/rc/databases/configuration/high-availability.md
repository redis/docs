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
aliases: 
  - /operate/rc/databases/high-availability
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

- Free Redis Cloud Essentials plans do not support replication.
- Paid Redis Cloud Essentials plans and Redis Cloud Pro plans let you choose between multi-zone or single-zone replication when creating a subscription. You can also turn off replication.

Whether or not you can change your replication settings after database creation depends on your plan type and what type of replication you originally selected.

- For Redis Cloud Essentials, you select the kind of replication when you create your database. If you selected Multi-zone replication when you created your database, you can't change it to Single-zone or turn it off after database creation. However, if you selected No Replication or Single-zone replication, you can switch between the two at any time by [editing your Essentials subscription]({{< relref "/operate/rc/subscriptions/view-essentials-subscription#change-high-availability-and-persistence" >}}). 
- For Redis Cloud Pro, you select whether Multi-zone replication is enabled when you create your subscription. You can't change this setting or any [Zone settings]({{< relref "/operate/rc/databases/configuration/high-availability#zone-setting-maintenance" >}}) after subscription creation. However, you can activate or deactivate replication for each database within the subscription at any time by [editing your database]({{< relref "/operate/rc/databases/view-edit-database" >}}).

## Performance impact 

Replication can affect performance as traffic increases to synchronize all copies. 

## Dataset size

For both Redis Cloud Essentials and Redis Cloud Pro, replication requires a memory limit that is double the dataset size of your database.

For Redis Cloud Essentials, the size of the plan you choose includes replication. Therefore, if you choose replication, the dataset size you can use is half of the stated plan size. For example, if you choose a 1 GB plan, Redis allocates 512 MB for the dataset size, and the other 512 MB for replication.

For Redis Cloud Pro, you select your dataset size when you create your database, and we calculate your memory limit based on the replication settings you choose.

## Zone setting maintenance

Zone settings can only be defined when a subscription is created.  You cannot change these settings once the subscription becomes active.

This means you can't convert a multi-zone subscription to a single zone (or vice-versa).  

To use different zone settings, create a new subscription with the preferred settings and then [migrate data]({{< relref "/operate/rc/databases/migrate-databases.md" >}}) from the original subscription.

## Availability zones

You can reduce network transfer costs and network latency by ensuring your Redis Cloud Pro cluster and your application are located in the same availability zone. 

To specify the availability zone(s) for your cluster, [create your Pro database with custom settings]({{< relref "/operate/rc/databases/create-database/create-pro-database-new" >}}), and select *Manual Selection* under **Allowed Availability Zones** in **Advanced options**.

For Google Cloud clusters and [Redis Cloud BYOC]({{< relref "/operate/rc/subscriptions/bring-your-own-cloud/" >}}), select an availability zone from the **Zone name** list.

{{<image filename="images/rc/availability-zones-no-multi-az.png" width="95%" alt="Select one availability zone when Multi-AZ is turned off." >}}

For all other AWS clusters, select an availability zone ID from the **Zone IDs** list. For more information on how to find an availability zone ID, see the [AWS docs](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-regions-availability-zones.html#concepts-availability-zones).

{{<image filename="images/rc/availability-zones-aws-hosted-no-multi-az.png" width="80%" alt="For hosted AWS clusters, select availability zone IDs from the Zone IDs list." >}}

If **Multi-AZ** is enabled, you must select three availability zones from the list.

{{<image filename="images/rc/availability-zones-multi-az.png" width="80%" alt="Select Manual selection to select three availability zones when Multi-AZ is enabled." >}}

For more information on availability zones, see the [Google Cloud docs](https://cloud.google.com/compute/docs/regions-zones/#available) or the [AWS docs](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-regions-availability-zones.html#concepts-availability-zones).

## More info

To learn more about high availability and replication, see:
- [Highly Available Redis](https://redislabs.com/redis-enterprise/technology/highly-available-redis/)
- [Database replication]({{< relref "/operate/rs/databases/durability-ha/replication.md" >}})
