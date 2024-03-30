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

By default, Redis will perform maintenance automatically while limiting service disruption as much as possible. If you want to control when Redis can perform maintenance for a Redis Cloud Pro subscription, you can [set manual maintenance windows]({{< relref "/operate/rc/subscriptions/maintenance/set-maintenance-windows" >}}).

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

### Urgent maintenance

Urgent maintenance refers to any activity that could affect service and cannot wait for scheduling. This includes applying urgent security patches.

Redis can perform urgent maintenance at any time, even if you have set a manual maintenance window or have temporarily [skipped maintenance]({{< relref "/operate/rc/subscriptions/maintenance/set-maintenance-windows#skip-maintenance-temporarily" >}}). Redis will notify you by email when urgent maintenance starts and ends.

## Notifications

Redis will notify you by email when maintenance starts and ends. If Redis needs an action from you to start maintenance, Redis will notify you with a reasonable amount of time before planned maintenance.

For major upgrades or upgrades that might include breaking changes, you will receive an advance notification with sufficient time to prepare before the upgrade.

If you want to receive maintenance notifications by email:

1. Go to [Access Management]({{< relref "/operate/rc/security/access-control/access-management" >}}) and select your account in the list.

1. Select the Edit button.

    {{<image filename="images/rc/icon-access-management-edit-user.png" width="30px" alt="Use the Edit button change details for a team member." >}}

1. Select **Operational emails** if it is not already turned on.

    {{<image filename="images/rc/access-mgmt-edit-user-dialog.png" width="50%" alt="Use the Edit User dialog to change the details for a user" >}}

1. Select **Save user** to save your changes.