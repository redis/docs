---
Title: Prepare source database
alwaysopen: false
categories:
- docs
- operate
- rc
description: Prepare your source database, network setup, and database credentials for Data integration.
hideListLinks: true
weight: 1
---

## Create new data pipeline

1. In the [Redis Cloud console](https://cloud.redis.io/), go to your target database and select the **Data Pipeline** tab.
1. Select **Create data pipeline**.
    {{<image filename="images/rc/rdi/rdi-create-data-pipeline.png" alt="The create data pipeline button." width=200px >}}
1. Select your source database type. The following database types are supported:
    - MySQL
    - mariaDB
    - Oracle
    - SQL Server
    - PostgreSQL
    {{<image filename="images/rc/rdi/rdi-select-source-db.png" alt="The select source database type list." width=500px >}}
1. If you know the size of your source database, enter it into the **Source dataset size** field.
    {{<image filename="images/rc/rdi/rdi-source-dataset-size.png" alt="Enter the amount of source data you plan to ingest." width=400px >}}
1. Under **Setup connectivity**, save the provided ARN and extract the AWS account ID for the account associated with your Redis Cloud cluster from it. 

    {{<image filename="images/rc/rdi/rdi-setup-connectivity-arn.png" alt="The select source database type list." width=80% >}}

    The AWS account ID is the string of numbers after `arn:aws:iam::` in the ARN. For example, if the ARN is `arn:aws:iam::123456789012:role/redis-data-pipeline`, the AWS account ID is `123456789012`.

## Prepare source database

Before using the pipeline, you must first prepare your source database to use the Debezium connector for change data capture (CDC). See [Prerequisites]({{<relref "/operate/rc/databases/rdi#prerequisites">}}) to find a list of supported source databases and database versions.

See [Prepare source databases]({{<relref "/integrate/redis-data-integration/data-pipelines/prepare-dbs/">}}) to find steps for your database type:
- Hosted on an AWS EC2 instance:
    - [MySQL and mariaDB]({{<relref "/integrate/redis-data-integration/data-pipelines/prepare-dbs/my-sql-mariadb">}})
    - [Oracle]({{<relref "/integrate/redis-data-integration/data-pipelines/prepare-dbs/oracle">}})
    - [SQL Server]({{<relref "/integrate/redis-data-integration/data-pipelines/prepare-dbs/sql-server">}})
    - [PostgreSQL]({{<relref "/integrate/redis-data-integration/data-pipelines/prepare-dbs/postgresql">}})
- Hosted on AWS RDS or AWS Aurora:
    - [AWS Aurora PostgreSQL and AWS RDS PostgreSQL]({{<relref "/integrate/redis-data-integration/data-pipelines/prepare-dbs/aws-aurora-rds/aws-aur-pgsql">}})
    - [AWS Aurora MySQL and AWS RDS MySQL]({{<relref "/integrate/redis-data-integration/data-pipelines/prepare-dbs/aws-aurora-rds/aws-aur-mysql">}})
    - [AWS RDS SQL Server]({{<relref "/integrate/redis-data-integration/data-pipelines/prepare-dbs/aws-aurora-rds/aws-rds-sqlserver">}})

See the [RDI architecture overview]({{< relref "/integrate/redis-data-integration/architecture#overview" >}}) for more information about CDC.

## Set up connectivity

To ensure that you can connect your Redis Cloud database to the source database, you need to set up an endpoint service through AWS PrivateLink. 

The following diagrams show the network setup for the different database setups:

- Database hosted on an AWS EC2 instance:

    {{<image filename="images/rc/rdi/rdi-setup-diagram-ec2.png" alt="The network setup for a database hosted on an AWS EC2 instance." width=80% >}}

- Database hosted on AWS RDS or AWS Aurora:

    {{<image filename="images/rc/rdi/rdi-setup-diagram-aurora.png" alt="The network setup for a database hosted on AWS RDS or AWS Aurora." width=80% >}}

Select the steps for your database setup.

{{< multitabs id="rdi-cloud-connectivity"
      tab1="EC2 instance"
      tab2="AWS RDS or Aurora" >}}

To set up PrivateLink for a database hosted on an EC2 instance:

1. [Create a network load balancer](#create-network-load-balancer-ec2) that will route incoming HTTP requests to your database.
1. [Create an endpoint service](#create-endpoint-service-ec2) through AWS PrivateLink.

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
            - **Target type**: Select **Instances**.
            - **Protocol : Port**: Select **TCP**, and then enter the port number where your database is exposed.
            - The **IP address type** and **VPC** should be selected already and match the VPC you selected earlier.
        1. In **Register targets**, select the EC2 instance that runs your source database, enter the port, and select **Include as pending below**. Then, select **Create target group** to create your target group. Return to **Listeners and routing** in the Network Load Balancer setup.
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

--tab-sep--

To set up PrivateLink for a database hosted on AWS RDS or AWS Aurora:

{{<warning>}}
The RDS Proxy does not work with RDS PostgreSQL and Aurora PostgreSQL because it does not support PostgreSQL logical replication.

For PostgreSQL databases, use one of the following alternatives instead:
- **For test environments**: Connect the Network Load Balancer directly to the database IP address (skip the RDS Proxy step).
- **For production environments**: Use the AWS Lambda approach described in [Access Amazon RDS across VPCs using AWS PrivateLink and Network Load Balancer](https://aws.amazon.com/blogs/database/access-amazon-rds-across-vpcs-using-aws-privatelink-and-network-load-balancer/).
{{</warning>}}

1. [Create an RDS Proxy](#create-rds-proxy) that will route requests to your database (MySQL and SQL Server only).
1. [Create a network load balancer](#create-network-load-balancer-rds) that will route incoming requests to the RDS proxy (or directly to the database for PostgreSQL).
1. [Create an endpoint service](#create-endpoint-service-rds) through AWS PrivateLink.

### Create RDS proxy {#create-rds-proxy}

{{<note>}}
For RDS PostgreSQL and Aurora PostgreSQL, skip this step and proceed directly to [Create network load balancer](#create-network-load-balancer-rds) and configure it to connect directly to your database IP address.
{{</note>}}

In the [AWS Management Console](https://console.aws.amazon.com/), use the **Services** menu to locate and select **Database** > **Aurora and RDS**. [Create an RDS proxy](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-proxy-creating.html) that can access your database.

The Proxy's IAM role must have the following permissions to access the database using the credentials secret and encryption key:
- `secretsmanager:GetSecretValue`
- `secretsmanager:DescribeSecret`
- `kms:Decrypt`

You can set the proxy's IAM role during creation in the **Authentication** section.

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
        1. In **Register targets**, enter the static IP address of your RDS proxy (for MySQL and SQL Server) or your database (for PostgreSQL), enter the port, and select **Include as pending below**. Then, select **Create target group** to create your target group. Return to **Listeners and routing** in the Network Load Balancer setup.

            **For MySQL and SQL Server**: To get the static IP address of your RDS Proxy, run the following command on an EC2 instance in the same VPC as the Proxy:
            ```sh
            $ nslookup <proxy-endpoint>
            ```
            Replace `<proxy-endpoint>` with the endpoint of your RDS proxy.

            **For PostgreSQL**: To get the static IP address of your database, run the following command on an EC2 instance in the same VPC as the database:
            ```sh
            $ nslookup <database-endpoint>
            ```
            Replace `<database-endpoint>` with the endpoint of your RDS or Aurora PostgreSQL database.
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

{{< /multitabs >}}

## Share source database credentials

You need to share your source database credentials and certificates in an Amazon secret with Redis Cloud so that the pipeline can connect to your database.

To do this, you need to:
1. [Create an encryption key](#create-encryption-key) using AWS Key Management Service with the right permissions.
1. [Create secrets](#create-database-credentials-secrets) containing the source database credentials encrypted using that key.

### Create encryption key

In the [AWS Management Console](https://console.aws.amazon.com/), use the **Services** menu to locate and select **Security, Identity, and Compliance** > **Key Management Service**. [Create an encryption key](https://docs.aws.amazon.com/kms/latest/developerguide/create-symmetric-cmk.html) with the following settings:

1. In **Step 1 - Configure key**:
    - **Key type**: Select **Symmetric**.
    - **Key usage**: Select **Encrypt and decrypt**.
    - Under **Advanced options**, set the following:
        - **Key material origin**: Select **KMS - recommended**.
        - **Regionality**: Select **Single-Region key**.
1. In **Step 2 - Add labels**, add an alias and description for the key.
1. In **Step 3 - Define key administrative permissions**, under **Key deletion**, select **Allow key administrators to delete this key**.
1. In **Step 4 - Define key usage permissions**, under **Other AWS accounts**, select **Add another AWS account**. Enter the AWS account ID for the Redis Cloud cluster that you saved earlier.

Review the key policy and key settings, and then select **Finish** to create the key.

### Create database credentials secrets

To let Redis Cloud access your source database, you need to create AWS secrets for the source database's credentials and certificates. 

The required secrets depend on your source database's security configuration. The following table shows the required secrets for each configuration:

| Security configuration | Required secrets |
| :-- | :-- |
| Username and password only | <ul><li>Credentials secret (username and password for the RDI pipeline user)</li></ul> |
| TLS connection | <ul><li>Credentials secret (username and password for the RDI pipeline user)</li><li>CA Certificate secret (server certificate)</li></ul> |
| mTLS connection | <ul><li>Credentials secret (username and password for the RDI pipeline user)</li><li>CA Certificate secret (server certificate)</li><li>Client certificate secret</li><li>Client key secret</li></ul> |
| mTLS connection with client key passphrase | <ul><li>Credentials secret (username and password for the RDI pipeline user)</li><li>CA Certificate secret (server certificate)</li><li>Client certificate secret</li><li>Client key secret</li><li>Client key passphrase secret</li></ul> |

Select a tab to learn how to create the required secret.

{{< multitabs id="rdi-cloud-secrets"
      tab1="Credentials secret"
      tab2="CA Certificate secret"
      tab3="Client certificate secret"
      tab4="Client key secret"
      tab5="Client key passphrase secret" >}}

In the [AWS Management Console](https://console.aws.amazon.com/), use the **Services** menu to locate and select **Security, Identity, and Compliance** > **Secrets Manager**. [Create a secret](https://docs.aws.amazon.com/secretsmanager/latest/userguide/create_secret.html) of type **Other type of secret** with the following settings:

- **Key/value pairs**: Enter the following key/value pairs.

    - `username`: Database username for the RDI pipeline user
    - `password`: Database password for the RDI pipeline user

{{< embed-md "rc-rdi-secrets-encryption-permissions.md" >}}

--tab-sep--

In the [AWS Management Console](https://console.aws.amazon.com/), use the **Services** menu to locate and select **Security, Identity, and Compliance** > **Secrets Manager**. [Create a secret](https://docs.aws.amazon.com/secretsmanager/latest/userguide/create_secret.html) of type **Other type of secret** with the following settings:

- **Key/value pairs**: Select **Plaintext** and enter the server certificate.

{{< embed-md "rc-rdi-secrets-encryption-permissions.md" >}}

--tab-sep--

In the [AWS Management Console](https://console.aws.amazon.com/), use the **Services** menu to locate and select **Security, Identity, and Compliance** > **Secrets Manager**. [Create a secret](https://docs.aws.amazon.com/secretsmanager/latest/userguide/create_secret.html) of type **Other type of secret** with the following settings:

- **Key/value pairs**: Select **Plaintext** and enter the client certificate.

{{< embed-md "rc-rdi-secrets-encryption-permissions.md" >}}

--tab-sep--

Use the [AWS CLI create-secret command](https://docs.aws.amazon.com/cli/latest/reference/secretsmanager/create-secret.html) or the [AWS CreateSecret API endpoint](https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_CreateSecret.html) to create a binary secret containing the client key.

For example, using the AWS CLI, run the following command:

```sh
aws secretsmanager create-secret \
    --name <secret-name> \
    --secret-binary fileb://<path-to-client-key> \
    --kms-key-id <encryption-key-arn> 
```

Where:
- `<secret-name>` - Name of the secret
- `<path-to-client-key>` - Path to the client key file
- `<encryption-key-arn>` - ARN of the [encryption key](#create-encryption-key) you created earlier

After you create the secret, you need to add permissions to allow the data pipeline to access it. 

In the [AWS Management Console](https://console.aws.amazon.com/), use the **Services** menu to locate and select **Security, Identity, and Compliance** > **Secrets Manager**. Select the private key secret you just created and then select **Edit permissions**. 

Add the following permissions to your secret. Replace `<AWS ACCOUNT ID>` with the AWS account ID for the Redis Cloud cluster that you saved earlier.

{{< embed-md "rc-rdi-secrets-permissions.md" >}}

--tab-sep--

In the [AWS Management Console](https://console.aws.amazon.com/), use the **Services** menu to locate and select **Security, Identity, and Compliance** > **Secrets Manager**. [Create a secret](https://docs.aws.amazon.com/secretsmanager/latest/userguide/create_secret.html) of type **Other type of secret** with the following settings:

- **Key/value pairs**: Select **Plaintext** and enter the client key passphrase.

{{< embed-md "rc-rdi-secrets-encryption-permissions.md" >}}

{{< /multitabs >}}

## Next steps

After you have set up your source database and prepared connectivity and credentials, select **Define source database** to [define your source connection and data pipeline]({{<relref "/operate/rc/databases/rdi/define">}}).

{{<image filename="images/rc/rdi/rdi-define-source-database.png" alt="ADD ALT TEXT" width=200px >}}