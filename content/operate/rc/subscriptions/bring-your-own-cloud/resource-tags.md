---
Title: Manage Cloud Provider resource tags
linkTitle: Manage resource tags
alwaysopen: false
categories:
- docs
- operate
- rc
description: Describes how to apply resource tags to Redis Cloud Bring your own Cloud (BYOC) resources.
weight: $weight
---

For Redis Cloud [Bring Your Own Cloud (BYOC)]({{< relref "/operate/rc/subscriptions/bring-your-own-cloud" >}}) deployments, Redis Cloud provisions infrastructure directly within your Cloud Provider account. Many organizations enforce tagging policies for cost allocation, governance, and compliance. In some environments, resource creation may fail if required tags are not present at creation time. 

To address this, Redis Cloud allows you to define resource tags at the subscription level, ensuring consistent tagging across all infrastructure resources created under that subscription.

You can define key-value tags for your Redis Cloud BYOC resources [during database creation](#new-subscription) or by [updating an existing subscription](#existing-subscription). These tags are automatically applied to supported Cloud Provider resources and you can manage them centrally at the subscription level.

## Supported resources

BYOC Resource tags are applied to the following AWS resources:
- EC2 instances
- EBS volumes
- EBS snapshots
- VPCs
- Subnets
- Route tables
- Internet Gateways
- Security Groups
- SSH key pairs
- Elastic Network Interfaces (ENIs)
- VPC peering connections
- Transit Gateway attachments
- Resource Gateways
- Resource Configurations

## Add resource tags to a new subscription {#new-subscription}

To add resource tags when you create a new BYOC subscription:

1. [Create a new Pro subscription]({{< relref "/operate/rc/databases/create-database/create-pro-database-new" >}}) and select **Custom settings**.

1. On the **Setup** step, go to **Advanced options > Deployment account** to see the **AWS Resource tags** section.

1. Select **Add additional tag** to add a tag. 

    {{<image filename="images/rc/tags-button-add-additional-tag.png" alt="The Add additional tag button." width="200px" >}}

1. Enter a **Key** and **Value** for the tag.

    {{<image filename="images/rc/byoc-resource-tags-add-tags-new.png" alt="The Add additional tag button." >}}

    After you add your first tag, you can:

    - Select the **Key** or **Value** field of an existing tag and enter new text to edit it.

    - Select **Delete** next to a tag to delete it.

        {{<image filename="images/rc/icon-delete-lb.png" width="36px" alt="Delete button." >}}

    - Select **Add additional tag** to add another tag.

        {{<image filename="images/rc/tags-button-add-additional-tag.png" alt="The Add additional tag button." width="200px" >}}

1. Continue creating your subscription.

Redis Cloud applies your tags automatically to all [supported resources](#supported-resources) when they are created, ensuring that your resources will comply with all tagging policies from the start.

## Add resource tags to an existing subscription {#existing-subscription}

You can add, edit, or remove resource tags on an existing BYOC subscription at any time.

1. Sign in to the [Redis Cloud console](https://cloud.redis.io/#/) and select your subscription from the **Subscriptions** list.

1. Select the **Overview** tab.

1. In **General > AWS Resource tags**, select **Edit**.

    {{<image filename="images/rc/icon-edit-subscription-name.png" alt="Use the **Edit** button to edit resource tags." >}}

    This opens the **AWS Resource tags** sidebar. 

    {{<image filename="images/rc/byoc-resource-tags-edit-existing.png" alt="The AWS Resource tags sidebar." >}}

1. From here, you can:

    - Select the **Key** or **Value** field of an existing tag and enter new text to edit it.

    - Select **Delete** next to a tag to delete it.

        {{<image filename="images/rc/icon-delete-lb.png" width="36px" alt="Delete button." >}}

    - Select **Add additional tag** to add another tag.

        {{<image filename="images/rc/tags-button-add-additional-tag.png" alt="The Add additional tag button." width="200px" >}}

1. Select **Save tags** to save your changes.

{{< note >}}
Redis Cloud applies resource tags only to resources created after you add or update the tags. Existing resources keep their previous tags.
{{< /note >}}
