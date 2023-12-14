---
Title: Create a Fixed subscription
alwaysopen: false
categories:
- docs
- operate
- rc
description: null
weight: 30
---
Fixed Size subscription plans support low throughput workflows.  Several tiers are available, each designed for different memory sizes and integration requirements.

When creating your subscription, you'll need to know which tier to choose.

If you're new to Redis Cloud, the [quick start]({{< relref "/operate/rc/rc-quickstart.md" >}}) helps you create an account with a free subscription and an initial database.  You also learn how to connect to your database.


## Fixed plan subscription tiers

Fixed plan pricing scales according to the memory size of all databases defined in the subscription.  Additional limits also apply, as shown here (updated November 2022):

| **Max DB size &nbsp;** | **Number of<br/>databases** | **Concurrent<br/>connections<br/>per database** | **CIDR<br/> allow rules** |
|---|---|---|---|
| (Free) 30 MB &nbsp;&nbsp;&nbsp;&nbsp; | 1 | 30 | 1 |
| 250 MB &nbsp;&nbsp;&nbsp;&nbsp; | 8 | 256 | 4-8 |
| 1 GB &nbsp;&nbsp;&nbsp;&nbsp; | 16 | 1024 | 4-8 |
| 2.5 GB &nbsp;&nbsp;&nbsp;&nbsp; | 24 | Unlimited | 4-8 |
| 5 GB &nbsp;&nbsp;&nbsp;&nbsp; | 32 | Unlimited | 4-16 |
| 12 GB &nbsp;&nbsp;&nbsp;&nbsp; | 64 | Unlimited | 4-32 |

The 30 MB Fixed plan is free; it's designed for training and prototype purposes.

All paid (250 MB and above) Fixed plans support replication and backups (daily and instant).

If you need additional resources, you can update your subscription at any time.

## Create a Fixed subscription

To create a Fixed subscription:

1.  From the Redis Cloud subscriptions list, select the **Add new subscription** button.  

    {{<image filename="images/rc/button-subscription-new.png" alt="The New subscriptions button in the admin console menu." >}}{{< /image >}}

2. When the **New subscription** page appears, select **Fixed plan** and then scroll to the cloud vendor options.

    {{<image filename="images/rc/subscription-new-plan-options.png" alt="Available subscription plan options." >}}{{< /image >}}

3.  Choose a **Cloud Provider** and a **Region**.

    {{<image filename="images/rc/subscription-new-cloud-vendor-options-redis-7-preview.png" alt="Available cloud vendor options and Redis 7.2 regions." >}}{{</image>}}

    [Redis 7.2]({{< relref "/operate/rc/changelog/june-2023#redis-72-preview" >}}) is available for selected regions in AWS and GCP. Redis 7.2 introduces several changes to existing Redis commands; see the list of [breaking changes]({{< relref "/operate/rc/changelog/june-2023#redis-72-breaking-changes" >}}) for more details.
    
    If you want to try out Redis 7.2, turn on the **Redis 7.2 regions** toggle to show the regions where it is available:

    {{<image filename="images/rc/subscription-new-redis-7-preview-toggle.png" width="200px" alt="Turn on the Redis 7.2 regions toggle." >}}{{< /image >}}

4.  In the **Availability Settings** panel, select your replication settings.  

    - **No-replication** means that you will have a single copy of your database.
    - **Single-zone replication** means that your database will have a primary and a replica located in the same cloud region.  If anything happens to the primary, the replica takes over and becomes the new primary.
    - **Multi-zone replication** means that the primary and the replicas are stored in different region zones, which provides additional protection by distributing the replicas.

5.  Select the desired plan size.   

    To create a Free subscription, select the 30 MB plan size.  

    {{<image filename="images/rc/subscription-new-fixed-tiers.png" alt="Available tiers for Fixed size subscription plans." >}}{{< /image >}}

6.  Enter a subscription name and payment details.

7.  Select the **Create Subscription** button.

    {{<image filename="images/rc/button-subscription-create.png" alt="The Create Subscription button." >}}{{< /image >}}

Here are few details to keep in mind:

- You can create a Free subscription without being prompted for payment details.

- You can only have one free subscription at a time.

- If you're creating a paid subscription and haven't previously entered a payment method, use the **Add Credit Card** button to add one.

    {{<image filename="images/rc/icon-add-credit-card.png" alt="The Add credit card icon." >}}{{< /image >}}

When you create your subscription, there's a brief pause while your request is processed and then you're taken to the **Subscription details** page.

{{<image filename="images/rc/subscription-fixed-databases-none.png" alt="The Subscription details screen with no databases." >}}{{< /image >}}

To create your first database, select the **New Database** button and then fill in the appropriate details.

To learn more, see [Create a database]({{< relref "/operate/rc/databases/create-database.md" >}}).
