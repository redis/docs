---
LinkTitle: Set maintenance windows
Title: Set maintenance windows
alwaysopen: false
categories:
- docs
- operate
- rc
description: Shows how to set manual maintenance windows and skip maintenance.
headerRange: '[1-3]'
toc: 'true'
weight: $weight
---

By default, Redis will maintain your Redis Cloud subscriptions and databases as needed. During maintenance, you may notice some latency when connecting to your databases. For more information about the types of maintenance and how Redis maintains your subscriptions, see [Maintenance](/content/operate/rc/subscriptions/maintenance/_index.md).

> [!NOTE]
> If your subscription includes an [RDI data pipeline](/content/operate/rc/rdi/_index.md#data-pipeline-architecture), maintenance windows apply to the pipeline as well. The pipeline may experience brief interruptions during the configured maintenance window.

For Redis Cloud Pro plans, Redis will perform maintenance automatically while limiting service disruption as much as possible. If you want to control when Redis performs maintenance for a Redis Cloud Pro subscription, you can [set manual maintenance windows](#set-manual-maintenance-windows) to ensure non-urgent maintenance will occur at set times. Configuring or altering the maintenance window will not have any impact on your subscription or databases.

> [!NOTE]
> You can only set manual maintenance windows for Redis Cloud Pro plans. A Redis Cloud Essentials database has a set maintenance window based on the region where it is located. See [Essentials maintenance](/content/operate/rc/subscriptions/maintenance/_index.md#redis-cloud-essentials) for more information.

## Set manual maintenance windows

To set manual maintenance windows for a single Redis Cloud Pro subscription:

1. From the [Redis Cloud console](https://cloud.redis.io/), select the **Subscriptions** menu and then select your subscription from the list.

1. Select the **Overview** tab.

1. In the **Maintenance Windows** panel, select **Manual**.

1. Click **Activate** to confirm your selection.

1. Enter the maintenance window time frame details.

    {{<image filename="images/rc/subscriptions-set-maintenance-window.png" alt="The set maintenance windows panel" >}}

    - Select the days that Redis can perform maintenance in the **Days** drop-down.
    - Select the time that Redis can start performing maintenance on those days in the **From** drop-down.
    - Select the amount of time that Redis can perform maintenance in the **Duration** drop-down.
    - Select **+ Time Frame** to add another time frame for maintenance.
    - Select **Advance notification** if you want to be notified of maintenance in advance.

    > [!NOTE]
    > You must [contact support](https://redis.io/support/) to request and be approved for advance maintenance notifications, otherwise skip this step as the this option does not appear by default.
    >

    Redis recommends allowing maintenance on at least two different days for 8 hours on each day.

1. Click **Save**.

## Skip maintenance temporarily

To skip maintenance temporarily for a subscription:

1. From the [Redis Cloud console](https://cloud.redis.io/), select the **Subscriptions** menu and then select your subscription from the list.

1. Select the **Overview** tab.

1. In the **Maintenance Windows** panel, select **Skip the next 14 days**.

1. Click **Continue** to confirm your selection.

You will only be allowed to skip maintenance once per month. 

During the skipped maintenance period, Redis will not perform any minor or major upgrades. Redis may perform [urgent maintenance](/content/operate/rc/subscriptions/maintenance/_index.md#urgent-maintenance) on your subscription, but only if it is absolutely necessary.


