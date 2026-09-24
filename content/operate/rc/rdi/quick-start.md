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

This example creates one PostgreSQL source. You can [add more sources]({{< relref "/operate/rc/rdi/view-edit#add-source" >}}) after the pipeline is running.

1. On the [Redis Cloud console](https://cloud.redis.io/), open your target database's **Data Integration** tab and select **Add pipeline**.

    {{<image filename="images/rc/rdi/rdi-workspace-add-pipeline.png" alt="The Add pipeline control is available while the workspace is being created." width=80% >}}

1. In **Settings**, select your target database and choose **Hash** or **JSON** as the default data structure, then select **Continue**.
1. In **Add sources**, select **PostgreSQL**.
1. Enter a **Source name** of your choice, for example `inventory-postgres`.
1. Select **Continue** to open **Configure source**.
1. Under **Source connectivity**, copy the **Role ARN**. Use it as `redis_privatelink_arn` in the Terraform configuration.

    {{<image filename="images/rc/rdi/rdi-setup-connectivity-arn.png" alt="The source connectivity Role ARN and availability zones." width=80% >}}

1. Under **Secrets**, copy the **Role ARN**. Use it as `redis_secrets_arn` in the Terraform configuration.

    {{<image filename="images/rc/rdi/rdi-credentials-arn.png" alt="The Role ARN in the Secrets section." width=80% >}}

1. Select **Save & exit** while you create the source resources.

## Create the source database and network resources

1. Clone or download the [`rdi-cloud-automation` GitHub repository](https://github.com/redis/rdi-cloud-automation).

1. In a terminal window, go to the `examples/aws-ec2-privatelink` directory.

1. Run `terraform init` to initialize the Terraform working directory.

1. Open the `example.tfvars` file and edit the following variables:

    - `region`: The AWS region where your Redis Cloud database is deployed.
    - `azs`: The availability zone IDs where your Redis Cloud database is deployed.
    - `port`: The port number for the new PostgreSQL source database.
    - `name`: A prefix for all of the created AWS resources.
    - `redis_secrets_arn`: The role ARN from **Secrets** in the Redis Cloud console.
    - `redis_privatelink_arn`: The role ARN from **Source connectivity** in the Redis Cloud console.

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

1. Return to your database's **Data Integration** tab in the [Redis Cloud console](https://cloud.redis.io/).
1. Open the draft pipeline's actions menu and select **Resume pipeline setup**.
1. Open **Configure source** and select your PostgreSQL source in the **Sources** list.
1. Under **Source connectivity**, enter the Terraform `vpc_endpoint_service_name` output as the **Private Link service name**.
1. Select **Connect to Private Link** and wait for connectivity to complete.

    {{<image filename="images/rc/rdi/rdi-source-configuration-source-connectivity-privatelink.png" alt="AWS Private Link connectivity with the service name and Connect to Private Link control." width=80% >}}

1. Under **Secrets**, enter the `secret_arn` output as **Credentials Secret ARN**.
1. Select **Validate** to check access to the secret.

    {{<image filename="images/rc/rdi/rdi-source-configuration-secrets.png" alt="The Credentials Secret ARN field, transit security options, and Validate control." width=80% >}}

1. Under **Source configuration**, enter the `database` and `port` Terraform outputs in the matching fields.
1. Select **Test source** and correct any validation errors, then select **Continue**.
1. In **Select data**, select the schemas, tables, and columns to ingest. Review the selected key for each table.

    {{<image filename="images/rc/rdi/rdi-dataset-schema-selected.png" alt="Selecting a schema shows its tables for ingestion." width=75% >}}

    {{<image filename="images/rc/rdi/rdi-select-columns.png" alt="Selecting a table shows its columns and the columns selected for ingestion." width=75% >}}

1. Select **Continue** to open **Add transformations**. For this example, you can keep the default mapping without adding jobs.
1. Select **Continue to review & deploy**.
1. Review the source and target, then select **Deploy pipeline**.

    {{<image filename="images/rc/rdi/rdi-confirm-deploy.png" alt="The Deploy pipeline button." width=175px >}}

The source first imports its selected data, then captures ongoing changes. Open the pipeline's **Dashboard** or **Metrics** tab to follow its progress.

The following example shows the metrics for one selected source in a pipeline with multiple sources.

{{<image filename="images/rc/rdi/rdi-2-metrics.png" alt="Metrics for one selected source in a pipeline, including snapshot progress and per-table record counts." width=80% >}}

See [View and edit data pipeline]({{<relref "/operate/rc/rdi/view-edit">}}) for source actions, dataset changes, and monitoring.

## Delete sample resources

{{< warning >}}
Make sure to [delete your data pipeline]({{<relref "/operate/rc/rdi/view-edit#delete-pipeline">}}) before deleting the sample resources.
{{< /warning >}}

To delete the sample resources created by Terraform, run:

```sh
terraform destroy -var-file=example.tfvars
```
