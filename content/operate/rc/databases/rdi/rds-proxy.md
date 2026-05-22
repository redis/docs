---
Title: RDS Proxy setup for RDI
alwaysopen: false
categories:
- docs
- operate
- rc
description: Set up RDS Proxy for Redis Data Integration (not recommended).
hidden: true
hideListLinks: true
weight: 99
---

{{<warning>}}
We do not recommend using RDS Proxy for RDI connections. The [Lambda function approach]({{< relref "/operate/rc/databases/rdi/setup#setup-lambda-function" >}}) provides better failover handling and is the recommended solution for production environments.

Additionally, RDS Proxy does not work with RDS PostgreSQL and Aurora PostgreSQL because it does not support PostgreSQL logical replication.

Only use RDS Proxy if you have specific requirements that necessitate it.
{{</warning>}}

## Overview

RDS Proxy is a fully managed, highly available database proxy for Amazon RDS. While it can be used with RDI, we recommend the Lambda function approach instead for the following reasons:

- **PostgreSQL incompatibility**: RDS Proxy does not support PostgreSQL logical replication, which is required for CDC (Change Data Capture).
- **Added complexity**: RDS Proxy adds an additional layer between RDI and your database.
- **Lambda provides better failover**: The Lambda function approach handles failover scenarios more efficiently.

If you still need to use RDS Proxy, follow the instructions below.

## Prerequisites

Before setting up RDS Proxy, ensure you have:

- An RDS or Aurora database (MySQL or SQL Server only)
- AWS Secrets Manager secret containing your database credentials
- AWS KMS encryption key for the secret
- Appropriate IAM permissions

## Create RDS Proxy

Follow the AWS documentation to create an RDS Proxy:

- [Creating an RDS Proxy](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-proxy-setup.html) (AWS documentation)
- [How RDS Proxy works](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-proxy.howitworks.html) (AWS documentation)
- [RDS Proxy TLS/SSL](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-proxy.howitworks.html#rds-proxy-security.tls) (AWS documentation)

### IAM permissions

The Proxy's IAM role must have the following permissions to access the database using the credentials secret and encryption key:

- `secretsmanager:GetSecretValue`
- `secretsmanager:DescribeSecret`
- `kms:Decrypt`

Example IAM policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "secretsmanager:GetSecretValue",
                "secretsmanager:DescribeSecret"
            ],
            "Resource": "arn:aws:secretsmanager:region:account-id:secret:secret-name"
        },
        {
            "Effect": "Allow",
            "Action": "kms:Decrypt",
            "Resource": "arn:aws:kms:region:account-id:key/key-id"
        }
    ]
}
```

## Get the RDS Proxy IP address

After creating the RDS Proxy, you need to get its static IP address to use when configuring the Network Load Balancer.

To get the static IP address of your RDS Proxy, run the following command on an EC2 instance in the same VPC as the Proxy:

```sh
$ nslookup <proxy-endpoint>
```

Replace `<proxy-endpoint>` with the endpoint of your RDS Proxy. Save this IP address for use in the Network Load Balancer configuration.

## Configure the Network Load Balancer

When you [create the Network Load Balancer]({{< relref "/operate/rc/databases/rdi/setup#create-network-load-balancer-rds" >}}), use the RDS Proxy IP address instead of the database IP address:

1. In **Register targets**, enter the static IP address of your RDS Proxy (obtained in the previous step).
2. Enter the port number where your RDS Proxy is exposed.
3. Select **Include as pending below**.
4. Complete the remaining Network Load Balancer setup as described in the [main setup guide]({{< relref "/operate/rc/databases/rdi/setup#create-network-load-balancer-rds" >}}).

## Next steps

After setting up RDS Proxy and the Network Load Balancer:

1. [Create an endpoint service]({{< relref "/operate/rc/databases/rdi/setup#create-endpoint-service-rds" >}}) through AWS PrivateLink.
2. [Share your source database credentials]({{< relref "/operate/rc/databases/rdi/setup#share-source-database-credentials" >}}) with Redis Cloud.
3. Continue with the [RDI pipeline configuration]({{< relref "/operate/rc/databases/rdi/define" >}}).

{{<note>}}
When using RDS Proxy, you do not need to set up the Lambda function for failover handling, as the proxy provides a static endpoint.
{{</note>}}

