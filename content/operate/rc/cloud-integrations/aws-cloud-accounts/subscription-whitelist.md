---
Title: Configure subscription CIDR allow list 
alwaysopen: false
categories:
- docs
- operate
- rc
description: The CIDR allow list permits traffic between a range of IP addresses and
  the Redis Cloud VPC.
linkTitle: Subscription CIDR allow list
weight: $weight
---

The [CIDR](https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing) [allow list](https://en.wikipedia.org/wiki/Whitelist) lets you restrict traffic to your Redis Cloud database. When you configure an allow list, only the [IP addresses](https://en.wikipedia.org/wiki/IP_address) defined in the list can connect to the database. Traffic from all other IP addresses is blocked.

If you use a [self-managed, external cloud account]({{< relref "/operate/rc/cloud-integrations/aws-cloud-accounts" >}}) to host your Redis Cloud deployment, you can configure a subscription-wide allow list
to restrict traffic to all databases associated with the subscription.

The subscription CIDR allow list defines a range of IP addresses and [AWS security groups](https://docs.aws.amazon.com/managedservices/latest/userguide/about-security-groups.html) that control inbound and outbound traffic to the Redis Cloud [VPC](https://en.wikipedia.org/wiki/Virtual_private_cloud). When you add security groups to the allow list, you can also use the same security groups to manage access to your application.

{{< note >}}
The subscription-level allow list is available for Redis Cloud deployments hosted on a self-managed, external AWS account. If you do not have a self-managed account, you can configure a [CIDR allow list]({{< relref "/operate/rc/security/cidr-whitelist.md" >}}) for each database.
{{< /note >}}

## Allow IP address or security group

To add IP addresses or [AWS security groups](https://docs.aws.amazon.com/managedservices/latest/userguide/about-security-groups.html) to a subscription's allow list:

1. From the [Redis Cloud console](https://cloud.redis.io/) menu, select **Subscriptions** and then select your subscription from the list.

1. Select **Connectivity > Allow List**.

1. If the allow list is empty, select **Add allow list**.

1. Select an entry **Type** from the list:

    {{<image filename="images/rc/subscription-connectivity-allow-list-type-dropdown.png" alt="Select the type of entry to add to the allow list from the Type list." >}}

1. In the **Value** box, enter one of these options:

    - An IP address in CIDR format

    - The AWS security group ID

1. Select check to add the entry to the allow list.

1. To allow additional IP addresses or security groups:

    1. Select **Add entry**.

    1. Select the new entry's **Type**, enter the **Value**, and select check to add it to the allow list.

        {{<image filename="images/rc/subscription-connectivity-allow-list-add-entry.png" alt="Define the new entry and select the Submit entry button to add it to the allow list." >}}

1. Select **Apply all changes** to apply the allow list updates.