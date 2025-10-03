---
LinkTitle: View and Upgrade Essentials or Flex plan
Title: View and Upgrade Redis Cloud Essentials or Redis Flex plan
alwaysopen: false
categories:
- docs
- operate
- rc
description: null
hideListLinks: true
weight: 30
---
To view the details of a Redis Cloud Essentials or Redis Flex subscription:

1.  Sign in to the [Redis Cloud console](https://cloud.redis.io/) and select the **Subscriptions** list.

1.  Select the target subscription from the subscription list.

    {{<image filename="images/rc/subscription-list-select.png" alt="The Subscription list shows your current subscriptions." width=50% >}}

1.  Your subscription details appear, along with a summary of your database details.

    {{<image filename="images/rc/subscription-details-fixed-databases-tab.png" alt="The Databases tab of the subscription details page is the default view." >}}

From here, you can:

- Select the **Upgrade** button to update your subscription plan, high availability settings, or payment method.

    {{<image filename="images/rc/button-subscription-upgrade-plan.png" alt="Select the Upgrade plan button to update your subscription settings." width=100px >}}

- Select the **Overview** tab to view and edit subscription details.

The following sections provide more details.

## Upgrade plan

Use the **Upgrade** button to update your Redis Cloud Essentials or Redis Flex plan, your high availability settings, or your payment method. Upgrading your database between Redis Cloud Essentials or Redis Flex plans does not impact database availability during the update.

{{<image filename="images/rc/button-subscription-upgrade-plan.png" alt="Use the Upgrade plan button to change selected Redis Cloud Essentials subscription detils." width=100px >}}

For information on how to upgrade to Redis Cloud Pro, see [upgrade subscription plan from Essentials to Pro]({{< relref "/operate/rc/subscriptions/upgrade-essentials-pro" >}}).

### Change subscription plan

To change your subscription plan, select the desired plan from the list and select the **Upgrade plan** button:

{{<image filename="images/rc/subscription-change-fixed-tiers.png" width="100%" alt="Select the desired subscription plan from the ones shown." >}}

Each Redis Cloud Essentials or Redis Flex plan provides a variety of benefits, including increased memory and number of connections.
For a comparison of available plans, see [Redis Cloud Essentials plans]({{< relref "/operate/rc/subscriptions/view-essentials-subscription/essentials-plan-details" >}}).

When you change your plan, your data and endpoints are not disrupted.  

If you upgrade a free plan to a paid plan, you need to add a payment method.

If you change your subscription to a lower plan, make sure your data fits within the limits of the new plan; otherwise, the change attempt will fail.

{{< note >}}
{{< embed-md "rc-fixed-upgrade-limitation.md" >}}
{{< /note >}}

### Change high availability and persistence

To change your plan's [high availability]({{< relref "/operate/rc/databases/configuration/high-availability" >}}) and [data persistence]({{< relref "/operate/rc/databases/configuration/data-persistence" >}}) settings, change them in the **Durability settings** panel.

{{<image filename="images/rc/subscription-fixed-high-availability-panel.png" alt="Use the Durability settings panel to set Essentials subscription settings." >}}

You can switch between **No replication** and **Single-zone replication** at any time, but you cannot choose **Multi-zone replication** after your subscription is created. You also cannot switch from **Multi-zone replication** to another high availability option.

### Change payment method

To change your subscription payment method, update the **Credit card** settings.  You can select a known payment method from the drop-down list or use the **Add** button to add a new one.

{{<image filename="images/rc/subscription-change-credit-card.png" alt="Use the Credit card drop-down to set your subscription payment method." >}}

Payment method changes require the Owner or Billing Admin roles. To verify your role, select **Access Management** from the admin menu and then locate your credentials in the **Team** tab.

### Save changes

Use the **Update Database** button to save changes.

{{<image filename="images/rc/button-subscription-upgrade-plan-blue.png" alt="Use the Upgrade plan button to save your subscription plan changes." >}}

## Subscription overview

The **Overview** tab summarizes your Redis Cloud Essentials subscription details using a series of panels:

{{<image filename="images/rc/subscription-details-fixed-overview-tab.png" width="75%" alt="The Overview tab displays the details of your Fixed subscription." >}}

The following details are displayed:

| Detail | Description |
|:---------|:--------------|
| **Subscription description** | Brief summary of subscription, including the plan type, cloud provider, region, and data size limit |
| **Cloud vendor** | Your database's cloud vendor |
| **Availability** | Describes high availability settings |
| **Region** | The region your subscription is deployed to |
| **Plan** | The maximum database size of your Essentials plan. Also displays the cost for paid plans. |
| **Databases** | Maximum number of databases for your plan |
| **Connections** | Maximum number of concurrent connections |
| **CIDR allow rules** | Maximum number of authorization rules |
| **Data persistence** | Indicates whether persistence is supported for your subscription |
| **Daily & instant backups** | Indicates whether backups are supported for your subscription |
| **Replication** | Indicates whether replication is supported for your subscription |
| **Clustering** | Indicates whether clustering is supported for your subscription |

The **Delete Database** button lets you [delete your database]({{< relref "/operate/rc/databases/delete-database" >}}).

{{<image filename="images/rc/button-delete-database-essentials-overview.png" alt="Use the Delete subscription button to delete your subscription plan." >}}
