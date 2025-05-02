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
- [MySQL and mariaDB]({{<relref "/integrate/redis-data-integration/data-pipelines/prepare-dbs/my-sql-mariadb">}})
- [Oracle]({{<relref "/integrate/redis-data-integration/data-pipelines/prepare-dbs/oracle">}})
- [SQL Server]({{<relref "/integrate/redis-data-integration/data-pipelines/prepare-dbs/sql-server">}})
- [AWS Aurora PostgreSQL]({{<relref "/integrate/redis-data-integration/data-pipelines/prepare-dbs/aws-aur-pgsql">}})
- [AWS RDS PostgreSQL]({{<relref "/integrate/redis-data-integration/data-pipelines/prepare-dbs/postgresql">}})

See the [RDI architecture overview]({{< relref "/integrate/redis-data-integration/architecture#overview" >}}) for more information about CDC.

## Set up connectivity

To ensure that you can connect your Redis Cloud database to the source database, you need to set up an endpoint service through AWS PrivateLink. 

Choose the steps for your database setup:
- [Database hosted on an AWS EC2 instance](#database-hosted-on-an-aws-ec2-instance)
- [Database hosted on AWS RDS or AWS Aurora](#database-hosted-on-aws-rds-or-aws-aurora)

### Database hosted on an AWS EC2 instance

The following diagram shows the network setup for a database hosted on an AWS EC2 instance.

{{<image filename="images/rc/rdi/rdi-setup-diagram-ec2.png" alt="The network setup for a database hosted on an AWS EC2 instance." width=75% >}}

To do this:

1. [Create a network load balancer](#create-network-load-balancer-ec2) that will route incoming HTTP requests to your database.
1. [Create an endpoint service](#create-endpoint-service-ec2) through AWS PrivateLink.

#### Create network load balancer {#create-network-load-balancer-ec2}

In the [AWS Management Console](https://console.aws.amazon.com/), use the **Services** menu to locate and select **Compute** > **EC2**. [Create a network load balancer](https://docs.aws.amazon.com/elasticloadbalancing/latest/network/create-network-load-balancer.html#configure-load-balancer) with the following settings:

1. In **Basic configuration**: 
    - **Scheme**: Select **Internal**.
    - **Load balancer IP address type**: Select **IPv4**.
1. In **Network mapping**, select the VPC and availability zone associated with your source database.
1. In **Security groups**, select the security group associated with your source database.
1. In **Listeners and routing**: 
    1. Select **Create target group** to [create a target group](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/create-target-group.html) with the following settings:
        1. In **Specify group details**:
            - **Target type**: Select **Instances**.
            - **Protocol : Port**: Select **TCP**, and then enter the port number where your database is exposed.
            - The **IP address type** and **VPC** should be selected already and match the VPC you selected earlier.
        1. In **Register targets**, select the EC2 instance that runs your source database, enter the port, and select **Include as pending below**. Then, select **Create target group** to create your target group. Return **Listeners and routing** in the Network Load Balancer setup.
    1. Set the following **Listener** properties:
        - **Protocol**: Select **TCP**.
        - **Port**: Enter your source database's port.
        - **Default action**: Select the target group you created in the previous step.
1. Review the network load balancer settings, and then select **Create load balancer** to continue.
1. After the network load balancer is active, select **Security**, and then select the security group ID to open the Security group settings.
1. Select **Edit inbound rules**, then **Add rule** to add a rule with the following settings:
    - **Type**: Select **HTTP**.
    - **Source**: Select **Anywhere - IPv4**.
    Select **Save rules** to save your changes.

#### Create endpoint service {#create-endpoint-service-ec2}

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

### Database hosted on AWS RDS or AWS Aurora

The following diagram shows the network setup for a database hosted on AWS RDS or AWS Aurora.

{{<image filename="images/rc/rdi/rdi-setup-diagram-aurora.png" alt="The network setup for a database hosted on AWS RDS or AWS Aurora." width=75% >}}

To do this:

1. [Create an RDS Proxy](#create-rds-proxy) that will route requests to your database.
1. [Create a network load balancer](#create-network-load-balancer-rds) that will route incoming HTTP requests to the RDS proxy.
1. [Create an endpoint service](#create-endpoint-service-rds) through AWS PrivateLink.

#### Create RDS proxy {#create-rds-proxy}

In the [AWS Management Console](https://console.aws.amazon.com/), use the **Services** menu to locate and select **Database** > **Aurora and RDS**. [Create an RDS proxy](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-proxy-creating.html) that can access your database.

<--! TODO: HOW TO GET THE STATIC IP -->

#### Create network load balancer {#create-network-load-balancer-rds}

In the [AWS Management Console](https://console.aws.amazon.com/), use the **Services** menu to locate and select **Compute** > **EC2**. [Create a network load balancer](https://docs.aws.amazon.com/elasticloadbalancing/latest/network/create-network-load-balancer.html#configure-load-balancer) with the following settings:

1. In **Basic configuration**: 
    - **Scheme**: Select **Internal**.
    - **Load balancer IP address type**: Select **IPv4**.
1. In **Network mapping**, select the VPC and availability zone associated with your source database.
1. In **Security groups**, select the security group associated with your source database.
1. In **Listeners and routing**: 
    1. Select **Create target group** to [create a target group](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/create-target-group.html) with the following settings:
        1. In **Specify group details**:
            - **Target type**: Select **IP Addresses**.
            - **Protocol : Port**: Select **TCP**, and then enter the port number where your database is exposed.
            - The **IP address type** and **VPC** should be selected already and match the VPC you selected earlier.
        1. In **Register targets**, enter the static IP of your RDS proxy, enter the port, and select **Include as pending below**. Then, select **Create target group** to create your target group. Return **Listeners and routing** in the Network Load Balancer setup.
    1. Set the following **Listener** properties:
        - **Protocol**: Select **TCP**.
        - **Port**: Enter your source database's port.
        - **Default action**: Select the target group you created in the previous step.
1. Review the network load balancer settings, and then select **Create load balancer** to continue.
1. After the network load balancer is active, select **Security**, and then select the security group ID to open the Security group settings.
1. Select **Edit inbound rules**, then **Add rule** to add a rule with the following settings:
    - **Type**: Select **HTTP**.
    - **Source**: Select **Anywhere - IPv4**.
    Select **Save rules** to save your changes.

#### Create endpoint service {#create-endpoint-service-rds}

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

## Share source database credentials

You need to share your source database credentials and certificates in an Amazon secret with Redis Cloud so that the pipeline can connect to your database.

To do this, you need to:
1. [Create an encryption key](#create-encryption-key) using AWS Key Management Service with the right permissions.
1. [Create a secret](#create-database-credentials-secret) containing the source database credentials encrypted using that key.

### Create encryption key

In the [AWS Management Console](https://console.aws.amazon.com/), use the **Services** menu to locate and select **Security, Identity, and Compliance** > **Key Management Service**. [Create an encryption key](https://docs.aws.amazon.com/kms/latest/developerguide/create-keys.html) with the following settings:

1. In **Step 1 - Configure key**:
    - **Key type**: Select **Symmetric**.
    - **Key usage**: Select **Encrypt and decrypt**.
    - Under **Advanced options**, set the following:
        - **Key material origin**: Select **KMS - recommended**.
        - **Regionality**: Select **Single-Region key**.
1. In **Step 2 - Add labels**, add an alias and description for the key.
1. In **Step 3 - Define key administrative permissions**, under **Key deletion**, select **Allow key administrators to delete this key**.
1. In **Step 4 - Define key usage permissions**, under **Other AWS accounts**, select **Add another AWS account**. Enter the AWS account ID for the Redis Cloud cluster that you saved earlier.

### Create database credentials secret

In the [AWS Management Console](https://console.aws.amazon.com/), use the **Services** menu to locate and select **Security, Identity, and Compliance** > **Secrets Manager**. [Create a secret](https://docs.aws.amazon.com/secretsmanager/latest/userguide/create_secret.html) of type **Other type of secret** with the following settings:

- **Key/value pairs**: Enter the following key/value pairs.

    - `username`: Database username
    - `password`: Database password
    - `trust_certificate`: Server certificate in PEM format *(TLS only)*
    - `client_public_key`: [X.509 client certificate](https://en.wikipedia.org/wiki/X.509) or chain in PEM format *(mTLS only)*
    - `client_private_key`: Key for the client certificate or chain in PEM format *(mTLS only)*
    - `client_private_key_passphrase`: Passphrase or password for the client certificate or chain in PEM format *(mTLS only)*

    {{<note>}}
If your source database has TLS or mTLS enabled, we recommend that you enter the `trust_certificate`, `client_public_key`, and `client_private_key` into the secret editor using the **Key/Value** input method instead of the **JSON** input method. Pasting directly into the JSON editor may cause an error. 
    {{</note>}}

- **Encryption key**: Select the [encryption key](#create-encryption-key) you created earlier.

- **Resource permissions**: Add the following permissions to your secret to allow the Redis data pipeline to access your secret. Replace `<AWS ACCOUNT ID>` with the AWS account ID for the Redis Cloud cluster that you saved earlier.

    ```json
    {
        "Version" : "2012-10-17",
        "Statement" : [ {
            "Sid" : "RedisDataIntegrationRoleAccess",
            "Effect" : "Allow",
            "Principal" : "*",
            "Action" : [ "secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret" ],
            "Resource" : "*",
            "Condition" : {
                "StringLike" : {
                    "aws:PrincipalArn" : "arn:aws:iam::<AWS ACCOUNT ID>:role/redis-data-pipeline-secrets-role"
                }
            }
        } ]
    }
    ```

After you store this secret, you can view and copy the [Amazon Resource Name (ARN)](https://docs.aws.amazon.com/secretsmanager/latest/userguide/reference_iam-permissions.html#iam-resources) of your secret on the secret details page. 

## Next steps

After you have set up your source database and prepared connectivity and credentials, select **Define source database** to [define your source connection and data pipeline]({{<relref "/operate/rc/databases/rdi/define">}}).

{{<image filename="images/rc/rdi/rdi-define-source-database.png" alt="ADD ALT TEXT" width=200px >}}