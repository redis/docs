---
Title: View and edit Redis Cloud Pro plan
alwaysopen: false
categories:
- docs
- operate
- rc
description: null
linktitle: View and edit Pro plan
weight: 40
---
To view the details of a Redis Cloud Pro subscription:

1.  Sign in to the [Redis Cloud console](https://cloud.redis.io/#) and select **Subscriptions**.

1.  If you have more than one subscription, select the target subscription from the subscription list.

    {{<image filename="images/rc/subscription-list-select.png" alt="The Subscription list shows your current subscriptions." width=50% >}}

1.  Your subscription details appear, along with a summary of your database details.

    {{<image filename="images/rc/subscription-flexible-databases-tab-pending.png" alt="The Databases tab of the subscription details page is the default view." >}}

From here, you can:

- Select **Create database in this subscription** to [add a database to your subscription]({{< relref "/operate/rc/databases/create-database/create-pro-database-existing" >}}).

    {{<image filename="images/rc/button-add-new-to-pro.png" alt="The Create database in this subscription button." width=400px >}}

- View the Status icon to learn the status of your subscription.  Active subscriptions display a green circle with a check mark. Pending subscriptions display an animated yellow circle.

    {{<image filename="images/rc/icon-database-status-active.png#no-click" alt="When a subscription is active, the status icon displays a green circle with a checkmark." class="inline" >}} &nbsp; {{<image filename="images/rc/icon-subscription-status-pending.png#no-click" alt="When a subscription is pending, the status icon displays a gre, animated circle." class="inline">}}

Because subscriptions represent active deployments, there aren't many details you can change.  If your needs change, [create a new subscription]({{< relref "/operate/rc/databases/create-database/create-pro-database-new" >}}) and then [migrate the existing data]({{< relref "/operate/rc/databases/migrate-databases" >}}) to the new databases.

In addition, you can view and edit the following subscription details:

1.  The **Databases** tab lists the databases in your subscription and summarizes their settings.

2.  The **Overview** tab displays subscription settings for your Redis Cloud Pro subscription.

3.  The **Connectivity** tab lets you limit access to the subscription by defining a VPC peering or other connectivity options.

4.  The **Security** tab lets you set security settings for the databases in your subscription.

5.  The **Regions** tab lets you manage the regions in your Active-Active subscription (_Active-Active subscriptions only_).

The following sections provide more info.

## **Databases** tab

The **Databases** tab summarizes the databases in your subscription.  

{{<image filename="images/rc/subscription-flexible-databases-tab-pending.png" alt="The Databases tab of the subscription details page is the default view." >}}

The following details are provided:

| Detail | Description |
|:---------|:--------------|
| **Status** | An icon indicating whether the database is active (a green circle) or pending (yellow circle)<br/>{{<image filename="images/rc/icon-database-detail-status-active.png#no-click" alt="Active status is indicated by a teal circle." class="inline" >}}&nbsp;{{<image filename="images/rc/icon-database-detail-status-pending.png#no-click" alt="Pending status is indicated by a yellow circle." class="inline">}} |
| **Name** | The database name |
| **Endpoint** | Use the **Copy** button to copy the endpoint URI to the Clipboard |
| **Memory** | Memory size of the database, showing the current size and the maximum size |
| **Throughput** | Maximum operations per second supported for the database |
| **Capabilities** | Identifies advanced capabilities attached to the database |
| **Options** | Icons showing options associated with the database |

To view full details of a database, click its name in the list.

## **Overview** tab

The **Overview** summarizes the options used to create the subscription.

{{<image filename="images/rc/subscription-details-overview-flexible.png" alt="The Overview tab displays the settings used to create your Redis Cloud Pro subscription." >}}

- The general settings panel describes the cloud vendor, region, and high-availability settings for your subscription.

    Select **Edit** to change the name of the subscription.

    {{<image filename="images/rc/icon-edit-subscription-name.png" alt="Use the **Edit** button to change the subscription name." >}}


    | Setting | Description |
    |:---------|:--------------|
    | **Cloud vendor** | Your subscription cloud vendor |
    | **Plan description** | Brief summary of subscription, including the plan type, cloud provider, and region |
    | **Auto Tiering** | Checked when Auto Tiering is enabled |
    | **Multi-AZ** | Checked when multiple availability zones are enabled |
    | **Active-Active Redis** | Checked when Active-Active Redis is enabled for your subscription |
    | **Region** | Describes the region your subscription is deployed to |
    | **Availability Zones** | The availability zones your subscription is deployed in (Visible if you selected availability zones on creation) |


- The **Price** panel shows the monthly cost of your Redis Cloud Pro subscription.

- The **Payment Method** panel shows the current payment details.

    Select the **Edit payment method** button to change the credit card associated with this subscription.

    {{< image filename="/images/rc/icon-subscription-detail-change-payment-flexible.png" alt="The edit payment method button, selected and showing a credit card." width=400px >}}

    Select **Add credit card** to add a new credit card.

- The **Maintenance Window** panel shows your current [maintenance window settings]({{< relref "/operate/rc/subscriptions/maintenance/set-maintenance-windows" >}}).

    See [Maintenance]({{< relref "/operate/rc/subscriptions/maintenance" >}}) for more information about subscription maintenance on Redis Cloud.

- The **Provisioned cloud resources** panel shows the storage resources used by your subscription.

  If your subscription is attached to a cloud account, the details appear in the panel header.

- The **Redis price** panel breaks down your subscription price.

## **Connectivity** tab

The **Connectivity** tabs helps secure your subscription.  

{{<image filename="images/rc/subscription-details-connectivity-tab-flexible.png" alt="The Connectivity tab helps you secure your subscription." >}}

Here, you can:

- Set up a [VPC peering]({{< relref "/operate/rc/security/vpc-peering.md" >}}) relationship between the virtual private cloud (VPC) hosting your subscription and another VPC.

- Set up a [CIDR allow list]({{< relref "/operate/rc/subscriptions/bring-your-own-cloud/subscription-whitelist" >}}) containing IP addresses or security groups permitted to access your subscription (_[Bring your own Cloud]({{< relref "/operate/rc/subscriptions/bring-your-own-cloud" >}}) only_).

- Set up [Private Service Connect]({{< relref "/operate/rc/security/private-service-connect" >}}) (*Google Cloud only*), [Transit Gateway]({{< relref "/operate/rc/security/aws-transit-gateway" >}}) (*AWS only*), or [AWS PrivateLink]({{< relref "/operate/rc/security/aws-privatelink" >}}) (*AWS only*).

See the individual links to learn more.

## **Security** tab

The **Security** tab lets you set security settings for the databases in your subscription.

Here, you can [block public endpoints]({{< relref "/operate/rc/security/database-security/block-public-endpoints" >}}) for all databases in the subscription.

## **Regions** tab

The **Regions** tab is only available for Active-Active subscriptions.  It lets you manage the regions in your Active-Active subscription.

{{<image filename="images/rc/subscription-details-regions-tab.png" alt="The Regions tab lets you manage the regions in your Active-Active subscription." >}}

See [Manage regions for an Active-Active database]({{< relref "/operate/rc/databases/active-active/manage-regions" >}}) for more information.
