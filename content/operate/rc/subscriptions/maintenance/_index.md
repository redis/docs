---
LinkTitle: Maintenance
Title: Subscription and database maintenance
alwaysopen: false
categories:
- docs
- operate
- rc
description: Describes maintenance that Redis performs on a Redis Cloud subscription.
headerRange: '[1-3]'
hideListLinks: true
toc: 'true'
weight: $weight
---

Redis will maintain your Redis Cloud subscriptions and databases as needed to ensure your databases are running the most stable and up-to-date version of Redis.

## Maintenance windows

Maintenance windows define when Redis can perform maintenance on your subscriptions and databases. Maintenance window options depend on your subscription type.

### Redis Cloud Pro

For Redis Cloud Pro plans, Redis will perform maintenance automatically while limiting service disruption as much as possible. If you want to control when we can perform maintenance for a Redis Cloud Pro subscription, you can [set manual maintenance windows]({{< relref "/operate/rc/subscriptions/maintenance/set-maintenance-windows#set-manual-maintenance-windows" >}}).

### Redis Cloud Essentials

Redis Cloud Essentials databases have a set maintenance window based on the cloud provider region. The maintenance window for Redis Cloud Essentials databases is **daily from 12 AM to 6 AM** in the region's local time zone. We won't use more than one maintenance window per week unless we need to do [urgent maintenance]({{< relref "/operate/rc/subscriptions/maintenance#urgent-maintenance" >}}), and we won't perform any maintenance that introduces breaking changes during these maintenance windows.

## Maintenance activities

During maintenance, Redis ensures the stability of your subscriptions and databases. 

This includes, but is not limited to:

- Upgrading Redis or an advanced capability to the latest version
- Cluster optimization
- Replacing a cluster node
- Adding more memory to a node
- Applying security patches

Redis will notify users by email when maintenance starts and ends. For more details, see [Notifications](#notifications).

During maintenance, your database will be operational, but you may notice some latency when connecting to your databases.

Your application may also disconnect from your database for a few seconds. Most Redis clients are set to refresh their DNS address when they reconnect to the database, and you will not be required to perform any further action. If you encounter connectivity problems for more than a minute during maintenance, please refresh your DNS entries.

{{<tip>}}
To make sure your applications are set to reconnect after maintenance activity, see [Develop highly available and resilient apps with Redis Cloud]({{< relref "/operate/rc/resilient-apps" >}}).
{{</tip>}}

### Urgent maintenance

Urgent maintenance refers to any activity that could affect service and cannot wait for scheduling. This includes applying urgent security patches.

Redis can perform urgent maintenance at any time, even if you have set a manual maintenance window or have temporarily [skipped maintenance]({{< relref "/operate/rc/subscriptions/maintenance/set-maintenance-windows#skip-maintenance-temporarily" >}}). Redis will notify you by email when urgent maintenance starts and ends.

### Major upgrades

We won't schedule major upgrades or upgrades that might include breaking changes until you opt-in to those changes. You can control your Redis major version on the [subscription page]({{< relref "/operate/rc/subscriptions/view-pro-subscription" >}}).

## Notifications

Redis will notify you by email when maintenance starts and ends. If Redis needs an action from you to start maintenance, we will notify you with a reasonable amount of time before planned maintenance.

If you want to receive advance notifications, you must [set manual maintenance windows]({{< relref "/operate/rc/subscriptions/maintenance/set-maintenance-windows#set-manual-maintenance-windows" >}}).

To receive maintenance notifications by email:
 
1. Go to [Access Management]({{< relref "/operate/rc/security/access-control/access-management" >}}) and select your account in the list.

1. Select the Edit button.

    {{<image filename="images/rc/icon-edit.png" width="30px" alt="Use the Edit button change details for a team member." >}}

1. Select **Operational emails** if it is not already turned on.

    {{<image filename="images/rc/access-mgmt-edit-user-dialog.png" width="50%" alt="Use the Edit User dialog to change the details for a user" >}}

1. Select **Save user** to save your changes.