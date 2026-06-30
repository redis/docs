---
Title: RDI on Redis Cloud quick start
linkTitle: Quick start
aliases:
    - /operate/rc/databases/rdi/quick-start/
    - /operate/rc/databases/rdi/quick-start
alwaysopen: false
categories:
- docs
- operate
- rc
description: Learn how to create a data pipeline between a PostgreSQL source database created with Terraform and a Redis Cloud target database.
hideListLinks: true
weight: 1
---

The [`rdi-cloud-automation` GitHub repository](https://github.com/redis/rdi-cloud-automation) contains a Terraform script that quickly sets up a PostgreSQL source database on an EC2 instance and all required permissions and network setup to connect it to a Redis Cloud target database.

{{< note >}}
This guide is for demonstration purposes only. It is not recommended for production use.
{{< /note >}}

## Prerequisites

To follow this guide, you need to:

1. Create a [Redis Cloud Pro database]({{< relref "/operate/rc/databases/create-database/create-pro-database-new" >}}) hosted on Amazon Web Services (AWS).

    Turn on Multi-AZ replication and [manually select the availability zones]({{< relref "/operate/rc/databases/configuration/high-availability#availability-zones" >}}) when creating the database.

1. Install the [AWS CLI](https://aws.amazon.com/cli/) and set up [credentials for the CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html).

1. Install [Terraform](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli).

## Create a data integration workspace

Before you can create your first Data Integration pipeline for a Redis Cloud subscription, you must first deploy the cloud infrastructure needed to host the pipeline and run the workers associated with the pipeline. In Redis Cloud, this is called a **Workspace**. See [Create and manage Data Integration workspace]({{<relref "/operate/rc/rdi/create-workspace">}}) for more information.

{{< embed-md "rc-rdi-create-rdi-workspace.md" >}}

## Get required ARNs

1. On the [Redis Cloud console](https://cloud.redis.io/), go to your target database and select the **Data Integration** tab.
1. Select **Add pipeline**.
    {{<image filename="images/rc/rdi/rdi-workspace-add-pipeline.png" alt="The workspace section of the Data Integration tab for a database. Select Add pipeline to add a pipeline." width=80% >}}
1. Select **PostgreSQL** as the source database type.
    {{<image filename="images/rc/rdi/rdi-select-source-db.png" alt="The select source database type list." width=80% >}}
1. Enter a name for your source database in the **Source name** field. This is a name for the source database that will appear on Redis Cloud.
1. Select **Continue to source** to move to the **Source configuration** step.

    {{<image filename="images/rc/rdi/rdi-continue-to-source-button.png" alt="The select source database type list." width=200px >}}
1. Under **Source connectivity**, save the provided ARN. This will be the `redis_privatelink_arn` you will need later.

    {{<image filename="images/rc/rdi/rdi-setup-connectivity-arn.png" alt="The setup connectivity section containing the private link ARN." width=80% >}}

1. Under **Secrets**, save the provided ARN. This will be the `redis_secrets_arn` you will need later.

    {{<image filename="images/rc/rdi/rdi-credentials-arn.png" alt="The setup connectivity section containing the credentials ARN." width=80% >}}

## Create the source database and network resources

1. Clone or download the [`rdi-cloud-automation` GitHub repository](https://github.com/redis/rdi-cloud-automation).

1. In a terminal window, go to the `examples/aws-ec2-privatelink` directory.

1. Run `terraform init` to initialize the Terraform working directory.

1. Open the `example.tfvars` file and edit the following variables:

    - `region`: The AWS region where your Redis Cloud database is deployed.
    - `azs`: The availability zone IDs where your Redis Cloud database is deployed.
    - `port`: The port number for the new PostgreSQL source database.
    - `name`: A prefix for all of the created AWS resources.
    - `redis_secrets_arn`: The source database credentials and certificates ARN from the Redis Cloud console.
    - `redis_privatelink_arn`: The PrivateLink ARN from the Redis Cloud console.

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

## Resume pipeline setup

1. Return to the [Redis Cloud console](https://cloud.redis.io/). Go to your target database and select the **Data Integration** tab.
1. You'll see a draft pipeline in the workspace you created. Select **More actions > Resume pipeline setup** to continue with pipeline setup.

    {{<image filename="images/rc/rdi/rdi-workspace-resume-setup.png" alt="The workspace section of the Data Integration tab for a database with a draft pipeline. Select Resume pipeline setup to continue." width=80% >}}

1. Continue to the **Source configuration** step.

1. In the **Source connectivity** section, enter the `vpc_endpoint_service_name` output in the **PrivateLink service name** field.

    {{<image filename="images/rc/rdi/rdi-source-configuration-source-connectivity-privatelink.png" alt="The Source database connectivity section for PrivateLink connection." >}}

1. Select **Connect to Private Link** to test your Private Link connectivity. This will take a few minutes, but you can continue while it's testing.

1. In the **Secrets** section, enter the `secret_arn` output in the **Credentials secret ARN** field.

    {{<image filename="images/rc/rdi/rdi-source-configuration-secrets.png" alt="The Secrets section." >}}

1. Select **Validate** to check that Redis Cloud can access your secrets. 

1. In the **Source configuration** section, enter the terraform outputs in the following fields.
    - **Database**: `database`
    - **Port**: `port`

1. Select **Test source** to test Redis Cloud's connection with the source database. After the test completes, select **Continue to dataset**.

    {{<image filename="images/rc/rdi/rdi-continue-to-dataset-button.png" alt="The Continue to dataset button." width=200px >}}

1. In the **Schemas** section, select the schema(s) you want to migrate to the target database from the list.

    {{<image filename="images/rc/rdi/rdi-dataset-schema-selected.png" alt="The dataset step with a schema selected." width=75% >}}

1. When you select a schema, you will see its tables in the **Tables** section. Redis Cloud will automatically select all tables for import. You can de-select any columns you do not wish to import to your Redis database.

1. Select a table to view its columns in the **Columns** section. You can de-select any columns you do not wish to import.

    {{<image filename="images/rc/rdi/rdi-select-columns.png" alt="The columns section, with a few columns selected from one table" width=75% >}}

1. Select **Continue to transformations** to move to the **Transformations** step.

    {{<image filename="images/rc/rdi/rdi-continue-to-transformations-button.png" alt="The Continue to dataset button." width=200px >}}

1. Select how your records will be stored in Redis. You can choose **Hash** or **JSON**.

    {{<image filename="images/rc/rdi/rdi-transformations.png" alt="The Transformations step." >}}

1. Review the tables you selected in the **Review and deploy** step. If everything looks correct, select **Deploy pipeline** to start ingesting data from your source database.

    {{<image filename="images/rc/rdi/rdi-confirm-deploy.png" alt="The Deploy pipeline button." width=175px >}}

At this point, the data pipeline will ingest data from the source database to your target Redis database. This process will take time, especially if you have a lot of records in your source database. 

After this initial sync is complete, the data pipeline enters the *change streaming* phase, where changes are captured as they happen. Changes in the source database are added to the target within a few seconds of capture. 

You can view the status of your data pipeline in the **Data pipeline** tab of your database. See [View and edit data pipeline]({{<relref "/operate/rc/rdi/view-edit">}}) to learn more.

## Delete sample resources

{{< warning >}}
Make sure to [delete your data pipeline]({{<relref "/operate/rc/rdi/view-edit#delete-pipeline">}}) before deleting the sample resources.
{{< /warning >}}

To delete the sample resources created by Terraform, run:

```sh
terraform destroy -var-file=example.tfvars
```
