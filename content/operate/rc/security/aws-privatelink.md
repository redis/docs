---
Title: Connect to Amazon Web Services PrivateLink
alwaysopen: false
categories:
- docs
- operate
- rc
description: null
linkTitle: AWS PrivateLink
weight: 80
bannerText: AWS PrivateLink is currently in preview. Features and behavior are subject to change. Redis does not recommend using AWS PrivateLink in production environments.
---

[Amazon Web Services (AWS) PrivateLink](https://docs.aws.amazon.com/vpc/latest/privatelink/privatelink-access-resources.html) allows service providers to securely expose specific services without exposing the entire service provider and consumer VPCs to each other. With AWS PrivateLink, Redis Cloud exposes a VPC endpoint service that you connect to as a consumer from your own VPC. Traffic stays within the AWS network and is isolated from external networks. 

{{< note >}}
Connecting to Redis Cloud with an AWS PrivateLink is available only with Redis Cloud Pro.  It is not supported for Redis Cloud Essentials.
{{< /note >}}

You can use PrivateLink as an alternative to Layer 3 connectivity options like [VPC peering]({{< relref "/operate/rc/security/vpc-peering" >}}) and [Transit Gateway]({{< relref "/operate/rc/security/aws-transit-gateway" >}}).

AWS PrivateLink provides the following benefits:

- **Improved Security**: PrivateLink exposes the Redis cluster and database(s) as a unidirectional endpoint inside your consumer VPC, thereby avoiding exposing entire VPC subnets to each other and eliminating some possible attack vectors.
- **Network Flexibility**: PrivateLink enables cross-account and cross-VPC connectivity and can be configured even when the Redis Cloud VPC and your consumer VPC have overlapping CIDR/IP ranges.
- **Simplified architecture and low latency**: PrivateLink does not require NAT, internet gateways, or VPNs. It provides simplified network routing, without the need for a network load balancer between the application and the Redis database.

## Limitations

Be aware of the following limitations when using PrivateLink with Redis Cloud:
- You cannot use the [OSS Cluster API]({{< relref "/operate/rc/databases/configuration/clustering#oss-cluster-api" >}}) with PrivateLink during preview.
- You cannot use Layer 3 connectivity options like VPC peering or Transit Gateway with PrivateLink during private preview. 
- Redis Cloud subscriptions with AWS PrivateLink are limited to a maximum of 55 databases. [Contact support](https://redis.com/company/support/) if you need more than 55 databases in one subscription with AWS PrivateLink.
- Your subnets must have at least 16 available IP addresses for the resource endpoint.
- Some AWS regions do not support PrivateLink Resource Endpoints. See [AWS VPC Lattice Pricing](https://aws.amazon.com/vpc/lattice/pricing/) for a list of regions that support AWS PrivateLink Resource Endpoints.
- Redis Cloud's PrivateLink implementation uses PrivateLink Resource Endpoints, which is based on Amazon VPC Lattice, so the [VPC Lattice quotas](https://docs.aws.amazon.com/vpc-lattice/latest/ug/quotas.html) apply. Currently, the following availability zones are not supported with Amazon VPC Lattice: 
    - `use1-az3`
    - `usw1-az2`
    - `apne1-az3`
    - `apne2-az2`
    - `euc1-az2`
    - `euw1-az4`
    - `cac1-az3`
    - `ilc1-az2`

    We recommend avoiding these availability zones when creating your Redis Cloud database if you plan to use AWS PrivateLink.
- Redis Cloud [Bring your Own Cloud]({{< relref "/operate/rc/subscriptions/bring-your-own-cloud" >}}) subscriptions are not supported with PrivateLink.

## Prerequisites

Before you can connect to Redis Cloud with an AWS PrivateLink VPC resource endpoint, you must have:

- A [Redis Cloud Pro database]({{< relref "/operate/rc/databases/create-database/create-pro-database-new" >}})
- An [AWS VPC](https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html) with the following:
    - A [security group](https://docs.aws.amazon.com/vpc/latest/userguide/creating-security-groups.html) that allows ingress traffic to the following ports: 
        - The database port range (port 10000-19999)
        - The Redis Cloud metrics port (port 8070), if desired
    - Subnets in the same region as your Redis Cloud database.
    - Settings to allow **DNS resolution** and **DNS hostnames**. See [View and update DNS attributes for your VPC](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-dns-updating.html) for more information.
- Permission to create and manage VPC endpoints or Service networks in AWS.

## Set up PrivateLink connection

To set up a connection to Redis Cloud with an AWS PrivateLink VPC resource endpoint, you need to:

1. [Associate the Redis Cloud Resource share with one or more AWS principals](#associate-resource-share).
1. [Add a connection](#add-connection) from your consumer account using a VPC resource endpoint or a VPC Lattice service network.

### Associate Redis Cloud resource share with a principal {#associate-resource-share}

In this step, you will associate the Redis Cloud resource share with an AWS principal, such as an AWS Account.

1. From the [Redis Cloud console](https://cloud.redis.io/), select the **Subscriptions** menu and then select your subscription from the list.

1. Select **Connectivity > PrivateLink** to view the PrivateLink settings.

1. In the **Resource Share** section, select **Manage Principals** to open the **Manage Principals** window.

    {{<image filename="images/rc/privatelink-resource-share.png" width="80%" alt="The Resource Share section, with the manage principals button." >}}

    {{<image filename="images/rc/privatelink-manage-principals.png" width="80%" alt="The Manage Principals window lets you add and remove principals from the resource share." >}}

1. Select the **Add** button in the **AWS consumer principals** section to add a principal to the resource share.

    {{<image filename="images/rc/icon-add.png" width="30px" alt="The Add button adds principals to the resource share." >}}

1. Select the type of principal you want to add from the **Principal type** list. You can choose from the following principal types:

    - AWS account
    - [Organization](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_introduction.html)
    - [Organizational unit (OU)](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_ous.html)
    - [Identity and Access Management (IAM) role](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles.html)
    - [IAM user](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users.html)
    - Service principal

1. Enter the principal's ID in the **Principal ID** field. You can also add an optional alias in the **AWS principal alias** field.

    {{<image filename="images/rc/privatelink-aws-consumer-principals.png" width="80%" alt="The AWS consumer principals section with an AWS account added as a principal." >}}

1. Select **Share** to share the resource share with the principal. The first resource share may take a few minutes.

1. After sharing the resource share with the principal, [accept the resource share in the Resource Access Manager](https://docs.aws.amazon.com/ram/latest/userguide/working-with-shared-invitations.html) or copy the **Accept resource share** command and run it with the AWS CLI.

After you accept the resource share, the Redis Cloud console will show the principal as **Accepted**.

{{<image filename="images/rc/privatelink-principal-accepted.png" width="80%" alt="The Consumer Principals section, with the consumer principal shown as accepted." >}}

You can add additional principals to the resource share at any time.

### Add a connection {#add-connection}

In this step, you will add a connection from your consumer account using a VPC resource endpoint or a VPC lattice service network. 

From the **Connectivity > PrivateLink** tab in your Redis Cloud subscription, open the **Add connection** section.

{{<image filename="images/rc/privatelink-add-connection.png" width="80%" alt="The Add connection section." >}}

Here, choose whether you want to connect to Redis using a **Resource endpoint** or a **Service network**. 

{{< multitabs id="privatelink-connection-type" 
    tab1="Resource endpoint" 
    tab2="Service network" >}}

You can connect with a VPC resource endpoint through the AWS Console or with the AWS CLI.

#### AWS Console

Follow the guide to [create a VPC resource endpoint in the AWS console](https://docs.aws.amazon.com/vpc/latest/privatelink/use-resource-endpoint.html#create-resource-endpoint-aws) with the following settings:

- **Type**: Select **Resources**.
- **Resource configurations**: Select the configuration with the same Resource Configuration ID as the one shown in the Redis Cloud console.
- **VPC**: Select your VPC from the list.
- **Addtional settings**: Select **Enable private DNS name** and set **Private DNS Preference** to **Verified domains only** or **Verified domains and specified domains**.
- **Subnets**: Select the subnets to create endpoint network resources in.
- **Security groups**: Select any security groups you want to associate with the resource endpoint, including the security group that allows access to the necessary ports, as described in the [prerequisites](#prerequisites)

#### AWS CLI

To use the AWS CLI to add a VPC resource endpoint, select **Copy** under the **AWS CLI Command** to save the command to your clipboard. Enter the saved command in a terminal shell to create the resource endpoint and replace the following parameters with your own values:

- `<vpc id>`: The ID of your VPC
- `<subnet ids>`: The IDs of the subnets to create endpoint network resources in
- `<security group ids>`: The IDs of any security groups you want to associate with the resource endpoint, including the security group that allows access to the necessary ports, as described in the [prerequisites](#prerequisites)

-tab-sep-

You can connect with an existing [VPC lattice service network](https://docs.aws.amazon.com/vpc-lattice/latest/ug/service-networks.html) through the AWS Console or with the AWS CLI.

#### AWS Console

Follow the guide to [Manage resource configuration associations](https://docs.aws.amazon.com/vpc-lattice/latest/ug/service-network-associations.html#service-network-resource-config-association) for your service network. Select the configuration with the same Resource Configuration ID as the one shown in the Redis Cloud console.

#### AWS CLI

To use the AWS CLI to connect to an already existing service network, select **Copy** under the **AWS CLI Command** to save the command to your clipboard. Enter the saved command in a terminal shell to connect to the service network and replace `<service network id>` with the ID of your service network. 

{{< /multitabs >}}

## Connect to your database with PrivateLink

After you've connected to Redis Cloud with a VPC resource endpoint or a VPC lattice service network, you can find the endpoints for your databases and cluster metrics in the AWS UI by going to the **Associations** tab for your endpoint or service network and viewing the Private DNS entries. You will have one entry for each database and one entry for the metrics endpoint.

{{<image filename="images/rc/privatelink-aws-endpoint-associations.png" width="80%" alt="The Associations tab for a VPC resource endpoint, showing the Private DNS entries for the databases and metrics endpoint." >}}

To view them on Redis Cloud, download the **Discovery script** from the Redis Cloud console and run it in your consumer VPC to discover the database endpoints.

The script returns a list of database endpoints that you can connect to from your consumer VPC.

```json
[
  {
    "type": "metrics",
    "dns-entry": "<METRICS DNS ENTRY>",
    "private-dns-entry": "<METRIC PRIVATE DNS ENTRY>",
    "port": 8070
  },
  {
    "type": "database",
    "dns-entry": "<DATABASE DNS ENTRY>",
    "private-dns-entry": "<PRIVATE DNS ENTRY>",
    "port": 12345,
    "database_id": 1234567890
  }
]
```

You can connect to your database by using the database `private-dns-entry` and `port` from your consumer VPC. You can also connect to the metrics endpoint with services like [Prometheus and Grafana]({{< relref "/integrate/prometheus-with-redis-cloud/" >}}) by using the metrics `private-dns-entry` and `port`.

After you've connected to your database, you can view the connection details in the Redis Cloud console in your subscription's **Connectivity > PrivateLink** tab or by going to the [connection wizard]({{< relref "/operate/rc/databases/connect" >}}) for your database. The private endpoint will point to the PrivateLink VPC resource endpoint or service network that you created.

## Disassociate connection

To disassociate a PrivateLink connection:

1. Go to the **Connectivity > PrivateLink** tab in your Redis Cloud subscription. 

1. In the **Connections** section, select **Disassociate** button next to the connection you want to disassociate.

    {{<image filename="images/rc/privatelink-disassociate-connection.png" width="80%" alt="The Disassociate button next to a VPC endpoint connection." >}}

1. Select **Disassociate VPC endpoint** or **Disassociate service network** to confirm.

After disassociating the connection, you can delete the VPC resource endpoint or service network in the AWS console.
