---
Title: Enable VPC peering
alwaysopen: false
categories:
- docs
- operate
- rc
description: VPC peering uses private IP addresses to route traffic between a Redis
  Cloud VPC and an application VPC.
linkTitle: VPC peering
weight: 80
---

VPC peering uses private IP addresses to allow network connections between two [virtual private clouds](https://en.wikipedia.org/wiki/Virtual_private_cloud) (VPCs).

You can connect your VPC in the Redis Cloud subscription to the VPC of your application. This lets your application connect securely to your Redis Cloud database using VPC peering to optimize the performance of your application.

{{< note >}}
VPC peering is available only with Redis Cloud Pro.  It is not supported for Redis Cloud Essentials.
{{< /note >}}

VPC peering configuration requires you to initiate VPC peering on your Redis Cloud subscription and then accept the VPC peering request for the AWS VPC that you want to peer with.

## AWS VPC peering

If you want to peer a Redis Cloud VPC with an AWS VPC, you need to:

1. [Configure and initiate VPC peering](#config-aws-vpc-peering) for your Redis Cloud subscription.

1. [Approve the VPC peering request](#approve-aws-vpc-peering).

1. [Update the routes tables](#update-route-tables).

### Configure VPC peering {#config-aws-vpc-peering}

To set up VPC peering:

1. From the [Redis Cloud console](https://cloud.redis.io/), select the **Subscriptions** menu and then select your subscription from the list.

1. Select **Connectivity > VPC Peering**.

1. Select **Add peering**.

1. Enter **VPC peering** details:

    | Setting | Description |
    |-------------------|-------------|
    | _Consumer AWS Account_ | Your AWS account ID (see [Finding your AWS account ID](https://docs.aws.amazon.com/IAM/latest/UserGuide/console_account-alias.html#FindingYourAWSId)) |
    | _Consumer region_ | AWS VPC region |
    | _Consumer VPC ID_ | The VPC ID for the application that needs to access your Redis Cloud VPC (see [Finding a VPC ID](https://docs.aws.amazon.com/managedservices/latest/userguide/find-vpc.html)) |
    | _Consumer VPC CIDRs_ | [CIDR-formatted](https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing) IP addresses for the AWS VPC that needs to access your Redis Cloud VPC; must not overlap with the _Redis producer VPC CIDR_ (see [View your VPCs](https://docs.aws.amazon.com/vpc/latest/userguide/working-with-vpcs.html#view-vpc)) |

1. You can provide up to five VPC CIDRs.
    
    To add multiple VPC CIDRs:

    1. Select **Add CIDR**.
    1. Enter additional CIDR-formatted IP address in the box:

        {{<image filename="images/rc/subscription-connectivity-vpc-peering-add-multiple-cidrs.png" width="300px" alt="Select the Add CIDR button to add another VPC CIDR." >}}

1. Select **Initiate peering**.
1. Note the **Peering ID** of the VPC peering request.

    {{<image filename="images/rc/subscription-connectivity-vpc-peering-aws.png" width="350px" alt="View VPC peering list." >}}

### Approve VPC peering request {#approve-aws-vpc-peering}

After you set up and intitiate VPC peering, you need to approve the VPC peering request:

1. Follow the AWS guide to [accept the VPC peering connection](https://docs.aws.amazon.com/vpc/latest/peering/accept-vpc-peering-connection.html).

1. After you accept the peering request, select **Modify my route tables now**. This button can be found in the green header once the peering connection is **active**.

{{<image filename="images/rc/modify_route_tables_aws.png" width="800px" alt="Modify Route Table." >}}

### Update route tables {#update-route-tables}

To finish VPC peering setup, [update your route tables for the peering connection](https://docs.aws.amazon.com/vpc/latest/peering/vpc-peering-routing.html). There may be many different route tables assigned to different VPCs. It is important to choose the route table assigned to the VPC you specified in the [Configure VPC Peering](#config-aws-vpc-peering) section with the following details:

1. In the **Destination** field, enter the Redis Cloud VPC CIDR shown when you accepted the peering request.

    This is the Redis Cloud VPC CIDR address, to which your application's VPC connects.

1. In the **Target** field, select **Peering Connection** and select the relevant **Peering ID**.

Once VPC peering is established, we recommend switching your application connection string to the private endpoint.

{{< note >}}
{{< embed-md "rc-vpc-peering-cidr-list.md"  >}}
{{< /note >}}

## Google Cloud VPC peering {#gcp-vpc-peering}

If you want to peer a Redis Cloud VPC with a Google Cloud VPC, you need to:

1. [Configure and initiate VPC peering](#config-gcp-vpc-peering) for your Redis Cloud subscription.

1. [Approve the VPC peering request](#approve-gcp-vpc-peering).

### Configure VPC peering {#config-gcp-vpc-peering}

To set up VPC peering:

1. Select **Subscriptions** from the [Redis Cloud console](https://cloud.redis.io/) menu and then select your subscription from the list.

1. Select **Connectivity > VPC Peering**.

1. Select **Add peering**.

1. Enter the VPC peering details:

    | Setting&nbsp;name | Description |
    |-------------------|-------------|
    | **Project ID** | Google Cloud project ID (see [Identifying projects](https://cloud.google.com/resource-manager/docs/creating-managing-projects#identifying_projects)) |
    | **Network name** | Google Cloud VPC network you want to peer with (see [View networks](https://cloud.google.com/vpc/docs/create-modify-vpc-networks#viewing-networks)) |

1. Copy the **Google cloud command** after you enter the other VPC peering settings. You need this command to accept the peering request later:

    {{<image filename="images/rc/subscription-connectivity-vpc-peering-gcloud-command.png" width="350px" alt="The Initiate peering button creates a VPC peering request." >}}

1. Select **Initiate peering**.
1. Note the **Cloud peering ID** of the VPC peering request.

    {{<image filename="images/rc/subscription-connectivity-vpc-peering-gcp.png" width="350px" alt="View VPC peering list." >}}

### Approve VPC peering request {#approve-gcp-vpc-peering}

To approve the VPC peering request between Redis Cloud and Google Cloud, use the [`gcloud` CLI](https://cloud.google.com/sdk/gcloud) to run the **Google cloud command** that you copied before you initiated VPC peering.

Once VPC peering is established, we recommend switching your application connection string to the private endpoint.

{{< note >}}
{{< embed-md "rc-vpc-peering-cidr-list.md"  >}}
{{< /note >}}

## Continue learning with Redis University

{{< university-links >}}