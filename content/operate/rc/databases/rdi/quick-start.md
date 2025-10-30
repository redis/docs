---
Title: RDI on Redis Cloud quick start
linkTitle: Quick start
alwaysopen: false
categories:
- docs
- operate
- rc
description: Learn how to create a data pipeline between a PostgreSQL source database created with Terraform and a Redis Cloud target database.
hideListLinks: true
weight: 1
---

The [`rdi-cloud-automation` GitHub repository](https://github.com/redis-field-engineering/rdi-cloud-automation) contains a Terraform script that quickly sets up a PostgreSQL source database on an EC2 instance and all required permissions and network setup to connect it to a Redis Cloud target database.

{{< note >}}
This guide is for demonstration purposes only. It is not recommended for production use.
{{< /note >}}

## Prerequisites

To follow this guide, you need to:

1. Create a [Redis Cloud Pro database]({{< relref "/operate/rc/databases/create-database/create-pro-database-new" >}}) hosted on Amazon Web Services (AWS).

    Turn on Multi-AZ replication and [manually select the availability zones]({{< relref "/operate/rc/databases/configuration/high-availability#availability-zones" >}}) when creating the database.

1. Install the [AWS CLI](https://aws.amazon.com/cli/) and set up [credentials for the CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html).

1. Install [Terraform](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli).

## Create a data pipeline

1. On the [Redis Cloud console](https://cloud.redis.io/), go to your target database and select the **Data Pipeline** tab.
1. Select **Create pipeline**.
    {{<image filename="images/rc/rdi/rdi-create-data-pipeline.png" alt="The create pipeline button." width=200px >}}
1. Select **PostgreSQL** as the source database type.
    {{<image filename="images/rc/rdi/rdi-select-source-db.png" alt="The select source database type list." width=500px >}}
1. Under **Setup connectivity**, save the provided ARN and extract the AWS account ID for the account associated with your Redis Cloud cluster from it. 

    {{<image filename="images/rc/rdi/rdi-setup-connectivity-arn.png" alt="The select source database type list." width=80% >}}

    The AWS account ID is the string of numbers after `arn:aws:iam::` in the ARN. For example, if the ARN is `arn:aws:iam::123456789012:role/redis-data-pipeline`, the AWS account ID is `123456789012`.

## Create the source database and network resources

1. Clone or download the [`rdi-cloud-automation` GitHub repository](https://github.com/redis-field-engineering/rdi-cloud-automation).

1. In a terminal window, go to the `examples` directory.

1. Run `terraform init` to initialize the Terraform working directory.

1. Open the `example.tfvars` file and edit the following variables:

    - `region`: The AWS region where your Redis Cloud database is deployed.
    - `azs`: The availability zone IDs where your Redis Cloud database is deployed.
    - `port`: The port number for the new PostgreSQL source database.
    - `name`: A prefix for all of the created AWS resources
    - `redis-account`: The AWS account ID for your Redis Cloud cluster you saved earlier.

1. To view the configuration, run:

    ```sh
    terraform plan -var-file=example.tfvars
    ```

1. To create the AWS resources, run:

    ```sh
    terraform apply -var-file=example.tfvars
    ```

    This example creates the following resources on your AWS account:

    - An AWS KMS key with the required permissions for RDI
    - A VPC with a public and private subnet and all necessary route tables
    - An EC2 instance running a PostgreSQL database with a security group that allows access from Redis Cloud
    - An AWS Secrets Manager secret for the PostgreSQL database credentials
    - A Network Load Balancer (NLB), a listener, and target group to route traffic to the EC2 instance with AWS PrivateLink
    - An AWS PrivateLink endpoint service for the PostgreSQL database

Creating the AWS resources will take some time. After the resources are created, you'll be able to view them in the AWS management console.

Save the following outputs:

- `database`: The name of the PostgreSQL database.
- `port`: The port number for the PostgreSQL database.
- `secret_arn`: The ARN of the AWS Secrets Manager secret for the PostgreSQL database credentials.
- `vpc_endpoint_service_name`: The name of the AWS PrivateLink endpoint service for the PostgreSQL database.

If you lose any outputs, run `terraform output` to view them again.

## Define source connection

1. Return to the [Redis Cloud console](https://cloud.redis.io/). Go to your target database and select the **Data Pipeline** tab.
1. Select **Define source database**.
    {{<image filename="images/rc/rdi/rdi-define-source-database.png" alt="The define source database button." width=200px >}}
1. Enter a **Pipeline name**. 
    {{<image filename="images/rc/rdi/rdi-define-pipeline-cidr.png" alt="The pipeline name and deployment CIDR fields." >}}
1. A **Deployment CIDR** is automatically generated for you. If, for any reason, a CIDR is not generated, enter a valid CIDR that does not conflict with your applications or other databases.
1. Enter the terraform outputs in the following fields:
    - **PrivateLink service name**: `vpc_endpoint_service_name`
    - **Database**: `database`
    - **Port**: `port`
    - **Source database secrets ARN**: `secret_arn`
1. Select **Start pipeline setup**.
    {{<image filename="images/rc/rdi/rdi-start-pipeline-setup.png" alt="The start pipeline setup button." width=200px >}}

At this point, Redis Cloud will provision the pipeline infrastructure that will allow you to define your data pipeline. 

{{<image filename="images/rc/rdi/rdi-pipeline-setup-in-progress.png" alt="The Pipeline setup in progress screen." width=75% >}}

Pipelines are provisioned in the background. You aren't allowed to make changes to your data pipeline or to your database during provisioning. This process will take about an hour, so you can close the window and come back later.

When your pipeline is provisioned, select **Complete setup**.

{{<image filename="images/rc/rdi/rdi-complete-setup.png" alt="The complete setup button." width=200px >}}

## Define data pipeline

After your pipeline is provisioned, you will be able to define your pipeline. You will select the database schemas, tables, and columns that you want to import and synchronize with your primary database.

See [Define data pipeline]({{<relref "/operate/rc/databases/rdi/define#define-data-pipeline">}}) for detailed steps on defining your data pipeline.

After you define your data pipeline, it will ingest data from the source database to your target Redis database. This process will take time, especially if you have a lot of records in your source database. 

After this initial sync is complete, the data pipeline enters the *change streaming* phase, where changes are captured as they happen. Changes in the source database are added to the target within a few seconds of capture. You can see this by connecting to your source database and making changes to the data, and then connecting to your target Redis database and verifying that the changes are reflected there.

You can view the status of your data pipeline in the **Data pipeline** tab of your database. See [View and edit data pipeline]({{<relref "/operate/rc/databases/rdi/view-edit">}}) to learn more.

## Delete sample resources

{{< warning >}}
Make sure to [delete your data pipeline]({{<relref "/operate/rc/databases/rdi/view-edit#delete-pipeline">}}) before deleting the sample resources.
{{< /warning >}}

To delete the sample resources created by Terraform, run:

```sh
terraform destroy -var-file=example.tfvars
```
