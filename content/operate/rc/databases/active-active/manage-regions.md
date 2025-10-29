---
Title: Manage regions in Active-Active databases
alwaysopen: false
categories:
- docs
- operate
- rc
description: Learn how to add and edit regions for an Active-Active deployment.
linkTitle: Manage regions
weight: 10
---

You can add and edit regions for an Active-Active deployment after it has been created by going to the **Regions** tab of the [subscription page]({{< relref "/operate/rc/subscriptions/view-pro-subscription" >}}). 

{{<image filename="images/rc/subscription-details-regions-tab.png" alt="The Regions tab lets you manage the regions in your Active-Active subscription." >}}

## Add a new region

To add a new region to an Active-Active deployment:

1. In the **Regions** tab of the subscription page, select **Add region**.

    {{<image filename="images/rc/subscription-details-regions-tab-add.png" width="128px" alt="Select Add region to add a new region to your Active-Active subscription." >}}

1. In the **Region setup** step:

    {{<image filename="images/rc/subscription-add-region-setup.png" alt="The Region setup step." >}}

    1. Select the desired region from the **Region** list.

    1. If you chose to deploy your Active-Active database to an existing [Bring your own Cloud]({{< relref "/operate/rc/subscriptions/bring-your-own-cloud" >}}) account, you can define the VPC ID for the new region. Select **In existing VPC** and the set the VPC ID for the region.

    1. Enter a unique CIDR address for the region.  
    
        {{< embed-md "rc-aa-cidr.md" >}}

    Select **Continue**.

1. In the **Throughput** step, enter the desired read and write throughput for the new region. 

    {{<image filename="images/rc/subscription-add-region-throughput.png" alt="The Throughput step." >}}

    You can also select **Set throughput as existing region** to duplicate the throughput settings from an existing region.

1. Review the required resources and updated price for the database in the **Required resources** step. 

    {{<image filename="images/rc/subscription-add-region-required-resources.png" alt="The Required resources step." >}}

    Select **Continue** to add the region to your Active-Active deployment.

Redis Cloud will provision the new region in the background and add it to all databases in the subscription. You aren't allowed to make changes to the database settings while this process is running. 

Your database will still be available, but you may notice some increased latency. This process will take some time depending on the size of your database.

## Edit regions

To edit the local throughput settings for a database instance or remove a region from the deployment, select **Edit regions** in the **Regions** tab of the subscription page.

{{<image filename="images/rc/subscription-details-regions-tab-edit.png" alt="Select Edit regions to update regions for your Active-Active subscription." >}}

From here, you can:

- [Edit local throughput](#edit-local-throughput) for a database instance
- [Remove a region](#remove-region) from the subscription

After making the desired changes, [save and confirm the changes](#save-and-confirm-changes).

### Edit local throughput

To edit the local throughput settings for a database instance:

1. Select the region you want to edit. 

1. Add or reduce the local read and write throughput for each database in that region in the **Local reads ops/sec** and **Local writes ops/sec** fields.

    {{<image filename="images/rc/subscription-edit-region-throughput.png" alt="The Edit regions page, with throughput settings changed." >}}

### Remove region

To remove a region from an Active-Active deployment, select the **Delete** button for the region you want to remove.

{{<image filename="images/rc/subscription-edit-region-delete.png" alt="Select the Delete button to remove a region from your Active-Active subscription." >}}

### Save and confirm changes

After making your changes, select **Save changes** to apply them. You'll need to review and confirm the changes and any updated costs before they are applied. Select **Confirm** to apply the changes. 

Redis Cloud will make the desired changes in the background. You aren't allowed to make changes to the database settings while this process is running. 

Your databases will still be available, but you may notice some increased latency. This process will take some time depending on the size of your database.
