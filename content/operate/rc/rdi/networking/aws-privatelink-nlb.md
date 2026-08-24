---
Title: Set up AWS PrivateLink connectivity
alwaysopen: false
categories:
- docs
- operate
- rc
description: Connect your Data Integration pipeline to a private source database through AWS PrivateLink and a Network Load Balancer.
hideListLinks: true
linkTitle: AWS PrivateLink
weight: 1
---

If your source database is not accessible via a public endpoint, you need to set up an endpoint service through AWS PrivateLink to be able to connect to it.

{{< note >}}
If your source database is accessible via a public endpoint and you want to use public connectivity for your data pipeline, you don't need PrivateLink. Proceed to [Share source database credentials]({{<relref "/operate/rc/rdi/setup#share-source-database-credentials">}}).
{{< /note >}}

## How traffic flows {#how-traffic-flows}

With PrivateLink, the pipeline and your database are in separate address spaces that never mix. Each component only connects to one address, and that address does not change during a failover.

- Database hosted in your AWS VPC (for example, on AWS RDS, AWS Aurora, or an EC2 instance):

    ```text
    Redis Cloud VPC                        Your AWS VPC
    (workspace CIDR)
    ┌──────────────────┐                  ┌─────────────────────────────────────┐
    │  RDI pipeline    │                  │                                     │
    │       │          │   PrivateLink    │  ┌───────────────┐   ┌───────────┐  │
    │       ▼          │ ───────────────▶ │  │ Network Load  │──▶│ Source DB │  │
    │  VPC endpoint    │                  │  │ Balancer      │   │ (RDS,     │  │
    │                  │                  │  │ (private IPs) │   │  Aurora,  │  │
    └──────────────────┘                  │  └───────────────┘   │  or EC2)  │  │
                                          │                      └───────────┘  │
                                          └─────────────────────────────────────┘
    ```

- Database on premises, reachable from your AWS VPC over [AWS Direct Connect](https://aws.amazon.com/directconnect/):

    ```text
    Redis Cloud VPC                Your AWS VPC                    Your data center
    (workspace CIDR)
    ┌────────────────┐            ┌──────────────────┐            ┌──────────────┐
    │  RDI pipeline  │            │                  │            │              │
    │       │        │ PrivateLink│  ┌────────────┐  │   Direct   │  ┌────────┐  │
    │       ▼        │ ─────────▶ │  │ NLB        │──┼──Connect──▶│  │ Source │  │
    │  VPC endpoint  │            │  │ (target    │  │            │  │ DB     │  │
    │                │            │  │  type: IP) │  │            │  └────────┘  │
    └────────────────┘            │  └────────────┘  │            └──────────────┘
                                  └──────────────────┘
    ```

    In this setup, register your on-premises database's IP address in the NLB target group with target type **IP addresses**. Make sure your VPC's route tables and security groups allow traffic from the NLB subnets to the database's IP address and port over the Direct Connect link.

The following table shows which address each component sees:

| Component | Connects to | What it sees |
|:--|:--|:--|
| RDI pipeline | The VPC endpoint for your endpoint service | Only the endpoint's addresses, which come from the workspace CIDR. It never sees your database's real IP address. |
| Network Load Balancer | The registered target (instance or IP address) | Your database's real address. The target group is the only place where that address appears, and the only thing that changes during a failover. |
| Source database | Nothing. It only receives connections. | Incoming connections from the **NLB's private IP addresses**, and never from Redis Cloud addresses. Allow the NLB subnets in your database's firewall or allow list. |

Traffic arrives at your NLB from AWS's internal PrivateLink range (`100.64.0.0/10`), and the NLB forwards it to the database from its own node IP addresses. Redis Cloud addresses are never visible anywhere in your network.

Because the two address spaces never mix, the workspace CIDR can overlap with your own VPC or on-premises ranges. It only needs to be valid on the Redis Cloud side. See [Create a Data Integration workspace]({{<relref "/operate/rc/rdi/create-workspace">}}) for the workspace CIDR requirements.

## Set up PrivateLink {#set-up-privatelink}

The following diagrams show the network setup for the different database setups:

- Database hosted on an AWS EC2 instance:

    {{<image filename="images/rc/rdi/rdi-setup-diagram-ec2.png" alt="The network setup for a database hosted on an AWS EC2 instance." width=80% >}}

- Database hosted on AWS RDS or AWS Aurora:

    {{<image filename="images/rc/rdi/rdi-setup-diagram-aurora.png" alt="The network setup for a database hosted on AWS RDS or AWS Aurora." width=80% >}}

Select the steps for your database setup. For an on-premises database reachable over Direct Connect, follow the **EC2 instance** steps and use a target group with target type **IP addresses** that points to the database's on-premises IP address.

{{< multitabs id="rdi-cloud-connectivity"
      tab1="EC2 instance"
      tab2="AWS RDS or Aurora"
      tab3="MongoDB Atlas" >}}

To set up PrivateLink for a database hosted on an EC2 instance:

1. [Create a network load balancer](#create-network-load-balancer-ec2) that will route incoming HTTP requests to your database.
1. [Create an endpoint service](#create-endpoint-service-ec2) through AWS PrivateLink.
1. Optionally, [automate failover handling](#automate-failover-ec2) so the NLB is repointed automatically when your database fails over to another server.

### Create network load balancer {#create-network-load-balancer-ec2}

In the [AWS Management Console](https://console.aws.amazon.com/), use the **Services** menu to locate and select **Compute** > **EC2**. [Create a network load balancer](https://docs.aws.amazon.com/elasticloadbalancing/latest/network/create-network-load-balancer.html#configure-load-balancer) with the following settings:

1. In **Basic configuration**: 
    - **Scheme**: Select **Internal**.
    - **Load balancer IP address type**: Select **IPv4**.
1. In **Network mapping**, select the VPC and availability zone associated with your source database.
1. In **Security groups**, select the security group associated with your source database, or another security group that allows traffic from PrivateLink and allows traffic to the database.
1. In **Listeners and routing**: 
    1. Select **Create target group** to [create a target group](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/create-target-group.html) with the following settings:
        1. In **Specify group details**:
            - **Target type**: Select **Instances**. For an on-premises database reachable over Direct Connect, select **IP addresses** instead.
            - **Protocol : Port**: Select **TCP**, and then enter the port number where your database is exposed.
            - The **IP address type** and **VPC** should be selected already and match the VPC you selected earlier.
        1. In **Register targets**, select the EC2 instance that runs your source database (or enter the database's IP address), enter the port, and select **Include as pending below**. Then, select **Create target group** to create your target group. Return to **Listeners and routing** in the Network Load Balancer setup.
    1. Set the following **Listener** properties:
        - **Protocol**: Select **TCP**.
        - **Port**: Enter your source database's port.
        - **Default action**: Select the target group you created in the previous step.
1. Review the network load balancer settings, and then select **Create load balancer** to continue.
1. After the network load balancer is active, select **Security**. 

    If you selected the same security group as your source database, you must not enforce security group rules on PrivateLink traffic. Select **Edit** and then deselect **Enforce inbound rules on PrivateLink traffic**, and then select **Save changes**.

1. Select the security group ID to open the Security group settings.
1. Select **Edit inbound rules**, then **Add rule** to add a rule with the following settings:
    - **Type**: Select **HTTP**.
    - **Source**: Select **Anywhere - IPv4**.
    Select **Save rules** to save your changes.
1. Select **Actions** > **Edit Load Balancer Attributes**.
    - Under **Load balancer targets selection policy** select **Enable cross-zone load balancing**.
    Click the **Save Changes** button.

### Create endpoint service {#create-endpoint-service-ec2}

In the [AWS Management Console](https://console.aws.amazon.com/), use the **Services** menu to locate and select **Networking & Content Delivery** > **VPC**. There, select **PrivateLink and Lattice** > **Endpoint services**. [Create an endpoint service](https://docs.aws.amazon.com/vpc/latest/privatelink/create-endpoint-service.html) with the following settings:

1. In **Available load balancers**, select the [network load balancer](#create-network-load-balancer-ec2) you created.
1. In **Additional settings**, choose the following settings:
    - **Require acceptance for endpoint**: Select **Acceptance required**.
    - **Supported IP address types**: Select **IPv4**.
1. Select **Create** to create the endpoint service.

After you create the endpoint service, you need to add Redis Cloud as an Allowed Principal on your [endpoint service VPC permissions](https://docs.aws.amazon.com/vpc/latest/privatelink/configure-endpoint-service.html#add-remove-permissions). 

1. In the Redis Cloud Console, copy the Amazon Resource Name (ARN) provided in the **Setup connectivity** section.
1. Return to the endpoint service list on the [Amazon VPC console](https://console.aws.amazon.com/vpc/). Select the endpoint service you just created.
1. Navigate to **Allow principals** tab.
1. Add the Redis Cloud ARN you copied and choose **Allow principals**.
1. Save the service name for later. 

For more details on AWS PrivateLink, see [Share your services through AWS PrivateLink](https://docs.aws.amazon.com/vpc/latest/privatelink/privatelink-share-your-services.html).

### Automate failover handling {#automate-failover-ec2}

The NLB target group points to one server. If your database can move to another server, something must update the target group to point to the new server. For example, this can happen when a high availability replica is promoted, or when a disaster recovery server is restored from backup. Nothing changes on the Redis Cloud side. The pipeline keeps connecting to the same VPC endpoint, retries while the path is down, and catches up automatically once the target group points to a healthy server.

You can automate the target group update with a Lambda function driven by the NLB's own health checks:

1. The NLB target group health check, which is a TCP check on the database port, marks the target unhealthy.
1. A CloudWatch alarm on the target group's `UnHealthyHostCount` metric fires.
1. The alarm publishes to an SNS topic, which invokes a Lambda function.
1. The Lambda function finds candidate database servers by an EC2 tag (for example, `failover-candidate=true`), registers a running candidate in the target group, and deregisters the failed one.

Discovering servers by tag means the Lambda function does not need a hardcoded server list. A replacement server that was restored from backup with a new IP address is picked up as soon as it is running and tagged. The Lambda function only calls AWS APIs (`elasticloadbalancing:DescribeTargetHealth`, `RegisterTargets`, `DeregisterTargets`, and `ec2:DescribeInstances`), so it does not need access to your VPC or your database.

Keep the following in mind:

- **Set the CloudWatch alarm period to 60 seconds.** The NLB publishes the `UnHealthyHostCount` metric once per minute. With a shorter period, most evaluation windows contain no data. Missing data is treated as healthy, so the alarm never fires.
- **Expect the switch to take minutes, not seconds.** Health check detection, metric publishing delay, and alarm evaluation add up to several minutes end to end. The pipeline tolerates the outage and catches up on its own.
- **Add an email subscription to the same SNS topic** so that a person always knows that a failover happened. This matters because some failures need a manual follow-up on the pipeline. For example, if the database was restored from a backup, the pipeline must be reset.

If your database publishes its own failover events, you can skip the health check detection delay by publishing to the SNS topic directly from the database server. For example, a script on a SQL Server node can publish to the SNS topic when the server changes roles.

--tab-sep--

To set up PrivateLink for a database hosted on AWS RDS or AWS Aurora:

To connect to your RDS or Aurora database, we recommend using a Lambda function approach. This provides a reliable and secure connection method for all database types.

1. [Create a network load balancer](#create-network-load-balancer-rds) that will route incoming requests to your database.
1. [Create an endpoint service](#create-endpoint-service-rds) through AWS PrivateLink.
1. [Set up Lambda function connectivity](#setup-lambda-function) to route requests to your database.

{{<note>}}
If you have specific requirements that necessitate using RDS Proxy instead of the recommended Lambda function approach, see the [RDS Proxy setup guide]({{< relref "/operate/rc/rdi/rds-proxy" >}}). Note that RDS Proxy is not recommended and does not work with PostgreSQL.
{{</note>}}

### Create network load balancer {#create-network-load-balancer-rds}

In the [AWS Management Console](https://console.aws.amazon.com/), use the **Services** menu to locate and select **Compute** > **EC2**. [Create a network load balancer](https://docs.aws.amazon.com/elasticloadbalancing/latest/network/create-network-load-balancer.html#configure-load-balancer) with the following settings:

1. In **Basic configuration**:
    - **Scheme**: Select **Internal**.
    - **Load balancer IP address type**: Select **IPv4**.
1. In **Network mapping**, select the VPC and availability zone associated with your source database.
1. In **Security groups**, select the security group associated with your source database, or another security group that allows traffic from PrivateLink and allows traffic to the database.
1. In **Listeners and routing**:
    1. Select **Create target group** to [create a target group](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/create-target-group.html) with the following settings:
        1. In **Specify group details**:
            - **Target type**: Select **IP Addresses**.
            - **Protocol : Port**: Select **TCP**, and then enter the port number where your database is exposed.
            - The **IP address type** and **VPC** should be selected already and match the VPC you selected earlier.
        1. In **Register targets**, enter the static IP address of your database, enter the port, and select **Include as pending below**. Then, select **Create target group** to create your target group. Return to **Listeners and routing** in the Network Load Balancer setup.

            To get the static IP address of your database, run the following command on an EC2 instance in the same VPC as the database:
            ```sh
            $ nslookup <database-endpoint>
            ```
            Replace `<database-endpoint>` with the endpoint of your RDS or Aurora database.
    1. Set the following **Listener** properties:
        - **Protocol**: Select **TCP**.
        - **Port**: Enter your source database's port.
        - **Default action**: Select the target group you created in the previous step.
1. Review the network load balancer settings, and then select **Create load balancer** to continue.
1. After the network load balancer is active, select **Security**.

    If you selected the same security group as your source database, you must not enforce security group rules on PrivateLink traffic. Select **Edit** and then deselect **Enforce inbound rules on PrivateLink traffic**, and then select **Save changes**.

1. Select the security group ID to open the Security group settings.

1. Select **Edit inbound rules**, then **Add rule** to add a rule with the following settings:
    - **Type**: Select **HTTP**.
    - **Source**: Select **Anywhere - IPv4**.
    Select **Save rules** to save your changes.
1. Select **Actions** > **Edit Load Balancer Attributes**.
    - Under **Load balancer targets selection policy** select **Enable cross-zone load balancing**.
    Click the **Save Changes** button.

### Create endpoint service {#create-endpoint-service-rds}

In the [AWS Management Console](https://console.aws.amazon.com/), use the **Services** menu to locate and select **Networking & Content Delivery** > **VPC**. There, select **PrivateLink and Lattice** > **Endpoint services**. [Create an endpoint service](https://docs.aws.amazon.com/vpc/latest/privatelink/create-endpoint-service.html) with the following settings:

1. In **Available load balancers**, select the [network load balancer](#create-network-load-balancer-rds) you created.
1. In **Additional settings**, choose the following settings:
    - **Require acceptance for endpoint**: Select **Acceptance required**.
    - **Supported IP address types**: Select **IPv4**.
1. Select **Create** to create the endpoint service.

After you create the endpoint service, you need to add Redis Cloud as an Allowed Principal on your [endpoint service VPC permissions](https://docs.aws.amazon.com/vpc/latest/privatelink/configure-endpoint-service.html#add-remove-permissions). 

1. In the Redis Cloud Console, copy the Amazon Resource Name (ARN) provided in the **Setup connectivity** section.
1. Return to the endpoint service list on the [Amazon VPC console](https://console.aws.amazon.com/vpc/). Select the endpoint service you just created.
1. Navigate to **Allow principals** tab.
1. Add the Redis Cloud ARN you copied and choose **Allow principals**.
1. Save the service name for later. 

For more details on AWS PrivateLink, see [Share your services through AWS PrivateLink](https://docs.aws.amazon.com/vpc/latest/privatelink/privatelink-share-your-services.html).

### Set up Lambda function connectivity {#setup-lambda-function}

{{<note>}}
Setting up the Lambda function is optional but recommended for production environments. The Lambda function provides automatic failover handling and a more robust connection to your RDS or Aurora database.
{{</note>}}

The Lambda function monitors RDS failover events and automatically updates the NLB Target Group to point to the new primary instance's IP address. This ensures RDI reconnects automatically after a failover.

#### Option 1: Use the Redis Terraform module

Redis provides a ready-to-use Terraform module that automates the Lambda function deployment. This is the recommended approach.

##### Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli) >= 1.5.7
- [AWS CLI](https://aws.amazon.com/cli/) configured with credentials
- The ARNs from the Network Load Balancer and Endpoint Service you created in the previous steps

##### Required variables

Before deploying the Lambda module, gather the following information:

| Variable | Description | Where to find it |
|----------|-------------|------------------|
| `identifier` | A unique name for the Lambda resources | Choose a descriptive name (e.g., `rdi-failover-handler`) |
| `db_endpoint` | Your RDS cluster or instance endpoint | AWS Console → RDS → Your database → Connectivity |
| `db_port` | Your database port | AWS Console → RDS → Your database → Connectivity (default: `5432` for PostgreSQL, `3306` for MySQL, `1433` for SQL Server) |
| `elb_tg_arn` | The NLB Target Group ARN | AWS Console → EC2 → Target Groups → Your target group |
| `rds_arn` | The RDS cluster or instance ARN | AWS Console → RDS → Your database → Configuration |
| `rds_cluster_identifier` | The RDS cluster identifier | AWS Console → RDS → Your cluster name |

##### Deploy the Lambda module

1. Clone the Redis cloud automation repository:

    ```bash
    git clone https://github.com/redis/rdi-cloud-automation.git
    cd rdi-cloud-automation/modules/aws-rds-lambda
    ```

1. Create a `terraform.tfvars` file with your configuration:

    ```hcl
    identifier             = "rdi-failover-handler"
    db_endpoint            = "your-cluster.cluster-xxxxxxxxx.us-east-1.rds.amazonaws.com"
    db_port                = 5432
    elb_tg_arn             = "arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/your-tg/xxxxxxxxx"
    rds_arn                = "arn:aws:rds:us-east-1:123456789012:cluster:your-cluster"
    rds_cluster_identifier = "your-cluster"
    ```

1. Initialize and apply Terraform:

    ```bash
    terraform init
    terraform apply
    ```

##### How the Lambda function works

The deployed Lambda function:

1. **Monitors RDS events**: Subscribes to RDS failover events via SNS
1. **Detects failover**: When a failover occurs, RDS triggers an SNS notification
1. **Resolves new IP**: The Lambda function queries DNS to get the new primary's IP address
1. **Updates NLB target**: Automatically updates the NLB Target Group with the new IP

This process typically completes within 30-60 seconds for Aurora, or 60-120 seconds for standard RDS.

##### Verify the deployment

After deployment, verify the Lambda function is configured correctly:

1. Check the Lambda function in AWS Console → Lambda → Functions
1. Verify the environment variables are set correctly:
    - `Cluster_EndPoint`: Your RDS endpoint
    - `RDS_Port`: Your database port
    - `NLB_TG_ARN`: Your NLB Target Group ARN
1. Check the SNS subscription in AWS Console → SNS → Subscriptions

#### Option 2: Full infrastructure deployment

For new deployments, Redis provides a complete Terraform example that deploys the entire infrastructure including the RDS database, NLB, PrivateLink, and Lambda function.

See the [AWS RDS PrivateLink Failover Example](https://github.com/redis/rdi-cloud-automation/tree/main/examples/aws-rds-privatelink-failover) for:

- Multi-engine support (PostgreSQL, MySQL, SQL Server)
- Automatic CDC user creation
- Complete VPC and networking setup
- Lambda-based failover handling

#### Option 3: Manual Lambda setup

For custom implementations, refer to the AWS documentation:
[Access Amazon RDS across VPCs using AWS PrivateLink and Network Load Balancer](https://aws.amazon.com/blogs/database/access-amazon-rds-across-vpcs-using-aws-privatelink-and-network-load-balancer/)

--tab-sep--

To set up Private Link for a MongoDB Atlas source database:

MongoDB Atlas manages its own endpoint service. The flow is a two-way handshake — you get an endpoint service ID from Atlas, give it to Redis Cloud, and then take the VPC Endpoint ID that Redis Cloud returns back to Atlas to complete the connection.

{{< note >}}
Create the Atlas private endpoint in the same AWS region as your Redis Cloud target database.
{{< /note >}}

### Create a private endpoint in MongoDB Atlas

1. In the [MongoDB Atlas UI](https://cloud.mongodb.com/), go to **Security** > **Network Access**.
1. Select the **Private Endpoint** tab, then select **Dedicated Cluster**.
1. Select **Add Private Endpoint**.
    - Select **AWS** as the cloud provider.
    - Select the AWS region that matches your Redis Cloud target database.
    - Select **Next**.
1. Atlas displays an **Endpoint Service ID** (for example, `vpce-svc-xxxxxxxxxxxxxxxxx`). Copy this value.

### Register the endpoint service with Redis Cloud

1. In the Redis Cloud console, in the pipeline creation flow, go to the **Source connectivity** step.
1. In the **Private Link service name** field, paste the Endpoint Service ID you copied from Atlas.
1. Redis Cloud creates a VPC endpoint and displays a **VPC Endpoint ID** (for example, `vpce-xxxxxxxxxxxxxxxxx`). Copy this value.

### Complete the connection in MongoDB Atlas

1. Return to the **Add Private Endpoint** page in the Atlas UI. In the **Your VPC Endpoint ID** field, enter the VPC Endpoint ID you copied from the Redis Cloud console. Select **Create**.
1. Wait for the endpoint status to show as **Available**. This can take a few minutes.
1. In the Atlas UI, go to your cluster and select **Connect** > **Private Endpoint**.
1. Choose the private endpoint you just registered (the `vpce-` ID you entered above).
1. Choose a connection method, then select **Shell**.
1. Copy the connection string shown.

    {{< note >}}
Copy the connection string from the **Private Endpoint** connection method only. The standard connection string does not route traffic through the private endpoint.
    {{< /note >}}

### Finish pipeline setup

1. Return to the Redis Cloud pipeline creation flow and paste the connection string into the **Source configuration** section.

{{< /multitabs >}}

## Next steps

After you have set up connectivity, [share your source database credentials]({{<relref "/operate/rc/rdi/setup#share-source-database-credentials">}}) with Redis Cloud, and then [define your source connection and data pipeline]({{<relref "/operate/rc/rdi/define">}}).
