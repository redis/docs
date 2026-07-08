---
Title: Create data pipeline
aliases:
    - /operate/rc/databases/rdi/define/
    - /operate/rc/databases/rdi/define
alwaysopen: false
categories:
- docs
- operate
- rc
description: Define the source connection and data pipeline.
hideListLinks: true
weight: 4
---

After you have [prepared your source database]({{<relref "/operate/rc/rdi/setup">}}) and connection information, and [created the workspace for your pipeline]({{<relref "/operate/rc/rdi/create-workspace">}}), you can set up your new pipeline.

In the [Redis Cloud console](https://cloud.redis.io/), go to your target database and select the **Data Integration** tab. You'll see your subscription's workspace. Select **Add pipeline** to add a pipeline to the workspace. 

You can also go to the **Pipelines** page from the left-hand menu and select **Add pipeline** from your workspace. Or, you can go to the **Data Integration** tab of your subscription and select **Add pipeline** from your workspace.

{{<image filename="images/rc/rdi/rdi-workspace-add-pipeline.png" alt="The workspace section of the Data Integration tab for a database. Select Add pipeline to add a pipeline." width=80% >}}

If you've started to create a pipeline, you'll see a draft pipeline. Select **More actions > Resume pipeline setup** to continue with pipeline setup.

{{<image filename="images/rc/rdi/rdi-workspace-resume-setup.png" alt="The workspace section of the Data Integration tab for a database with a draft pipeline. Select Resume pipeline setup to continue." width=80% >}}

Creating a pipeline is split into the following steps:

1. [**Pipeline setup**](#pipeline-setup): Defines the source database type and the target database.
2. [**Source configuration**](#source-configuration): Defines and tests the source database connectivity and credentials.
3. [**Dataset**](#dataset): Defines the data to import to your Redis database.
4. [**Transformations**](#transformations): Defines how records are stored in Redis.
5. [**Review & deploy**](#review-and-deploy): Shows your pipeline details and deploys it.

## Pipeline setup

In the **Pipeline setup** step:

1. Select your source database type. The following database types are supported:
    - MySQL
    - mariaDB
    - Oracle
    - SQL Server
    - PostgreSQL
    - Snowflake _(Preview)_
    {{<image filename="images/rc/rdi/rdi-select-source-db.png" alt="The select source database type list and source name field." width=80% >}}

1. Enter a name for your source database in the **Source name** field. This is a name for the source database that will appear on Redis Cloud.
1. Select the target Redis Cloud database from the **Target database** list.

    {{<image filename="images/rc/rdi/rdi-choose-target.png" alt="The target database list." width=80% >}}

Select **Continue to source** to move to the **Source configuration** step.

{{<image filename="images/rc/rdi/rdi-continue-to-source-button.png" alt="The Continue to source button." width=200px >}}

## Source configuration

During the **Source configuration** step, you'll share the connectivity information and credentials you created when you prepared your source database.

This step is separated into three expandable sections:

1. [Source connectivity](#source-connectivity) defines the connectivity method for your source database.
2. [Secrets](#secrets) defines the authentication needed for your source database.
3. [Source configuration](#source-configuration-section) defines the source-specific settings for your database connection.

When you've completed all three sections, select **Test source** to test Redis Cloud's connection with the source database. After the test completes, select **Continue to dataset** to move to the [**Dataset**](#dataset) step.

{{<image filename="images/rc/rdi/rdi-continue-to-dataset-button.png" alt="The Continue to dataset button." width=200px >}}

### Source connectivity

Select whether you want your pipeline to connect to your database using **AWS Private Link** or using the **Public endpoint**.

- If your pipeline uses AWS PrivateLink, enter the **Private Link service name** of the [PrivateLink connected to your source database]({{< relref "/operate/rc/rdi/setup#set-up-connectivity" >}}).

    {{<image filename="images/rc/rdi/rdi-source-configuration-source-connectivity-privatelink.png" alt="The Source database connectivity section for PrivateLink connection." >}}

    Select **Connect to Private Link** to test your Private Link connectivity. This will take a few minutes.
    
    If Redis Cloud can't find your PrivateLink connection, make sure that the PrivateLink service name is correct and that Redis Cloud is listed as an Allowed Principal for your VPC. See [Set up connectivity]({{<relref "/operate/rc/rdi/setup#set-up-connectivity">}}) for more info.

- If your pipeline uses the public endpoint, enter the source IP address or hostname in the **Source IP address / Hostname** field.

    {{<image filename="images/rc/rdi/rdi-source-configuration-source-connectivity-public.png" alt="The Source database connectivity section for Public endpoint connection." >}}

### Secrets

{{<image filename="images/rc/rdi/rdi-source-configuration-secrets.png" alt="The Secrets section." >}}

Enter the ARN of your [database credentials secret]({{< relref "/operate/rc/rdi/setup#create-database-credentials-secrets" >}}) in the **Credentials secret ARN** field.

For Snowflake source databases, select the authentication method that matches the [credentials secret]({{< relref "/operate/rc/rdi/setup#create-database-credentials-secrets" >}}) you created:

- **Password**: The credentials secret must contain both `username` and `password`.
- **Key-pair**: The credentials secret must contain the `username` (if a `password` is present, it is ignored). Enter the ARN of your [client key secret]({{< relref "/operate/rc/rdi/setup#create-database-credentials-secrets" >}}) in the **Private Key Secret ARN** field. This secret must contain the private key in plain text PEM format.

Under **Transit security**:

- If your database requires TLS, select **TLS**. Enter the ARN of your [CA certificate secret]({{< relref "/operate/rc/rdi/setup#create-database-credentials-secrets" >}}) in the **CA Certificate Secret ARN** field.
    {{<image filename="images/rc/rdi/rdi-define-tls.png" alt="The Source database connectivity section, with TLS selected and the CA Cert Secret ARN field." >}}
- If your database requires mTLS, select **mTLS**. 
    {{<image filename="images/rc/rdi/rdi-define-mtls.png" alt="The Source database connectivity section, with mTLS selected and the Client Certificate Secret ARN and Client Key Secret ARN fields." >}}

    Enter the following secrets in the fields:
    - **CA Certificate Secret ARN**: [CA certificate secret]({{< relref "/operate/rc/rdi/setup#create-database-credentials-secrets" >}})
    - **Client Certificate Secret ARN**: [Client certificate secret]({{< relref "/operate/rc/rdi/setup#create-database-credentials-secrets" >}})
    - **Client Private Key Secret ARN**: [Client key secret]({{< relref "/operate/rc/rdi/setup#create-database-credentials-secrets" >}})
    - **Password secret ARN for secret store** (_Optional_): [Client key passphrase secret]({{< relref "/operate/rc/rdi/setup#create-database-credentials-secrets" >}})

Select **Validate** to check that Redis Cloud can access your secrets. 

### Source configuration {#source-configuration-section}

In this section, you'll enter your database details. This depends on your database type, and can include:

- **Port**: The database's port
- **Database(s)**: Your database's name, or the root database *(PostgreSQL, Oracle only)*, or a comma-separated list of one or more databases you want to connect to *(SQL Server and MongoDB only)*
- **Database Server ID**: Unique ID for the replication client. Enter a number that is not used by any existing replication clients *(mySQL and mariaDB only)*
- **PDB**: Name of the Oracle pluggable database *(Oracle only)*
- **Connection string**: The connection information for your database *(MongoDB only)*

Under **Collector properties**, Select **Edit advanced properties** to configure additional optional properties for your pipeline.

{{<image filename="images/rc/rdi/rdi-source-configuration-collector-properties.png" alt="The collector properties section." width=500px >}}

{{<image filename="images/rc/rdi/rdi-advanced-properties.png" alt="The advanced properties section." width=80% >}}

You can add collector source properties in the **Collector source properties** section and collector sink properties in the **Collector sink properties** section. See the RDI configuration file reference for all available [collector source properties]({{< relref "/integrate/redis-data-integration/reference/config-yaml-reference#sourcesadvancedsource" >}}) and [collector sink properties]({{< relref "/integrate/redis-data-integration/reference/config-yaml-reference#sourcesadvancedsink" >}}). Select **Save properties** to return to Source configuration.

## Dataset

In this step, you'll select the data that you want to import and synchronize with your primary database. 

{{< note >}}
This step may change depending on your source database.
{{< /note >}} 

{{<image filename="images/rc/rdi/rdi-dataset-empty.png" alt="The dataset step." width=75% >}}

1. In the **Schemas** section, select the schema(s) you want to migrate to the target database from the list.

    {{<image filename="images/rc/rdi/rdi-dataset-schema-selected.png" alt="The dataset step with a schema selected." width=75% >}}

1. When you select a schema, you will see its tables in the **Tables** section. Redis Cloud will automatically select all tables for import. You can de-select any columns you do not wish to import to your Redis database.

1. Select a table to view its columns in the **Columns** section. You can de-select any columns you do not wish to import.

    {{<image filename="images/rc/rdi/rdi-select-columns.png" alt="The columns section, with a few columns selected from one table" width=75% >}}

    If any tables are missing a unique key, a warning will appear in the **Data modeling** section. Select **Show affected** to filter the **Tables** section to the tables without a unique key.
    
    {{<image filename="images/rc/rdi/rdi-dataset-missing-unique-key.png" alt="The dataset step filtered to show tables that are missing a unique key." width=75% >}}

    For these tables, select the key icon next to the column that defines a unique key. 

    {{<image filename="images/rc/rdi/rdi-unique-key-selected.png" alt="The unique key icon." width=500px >}}

Select **Continue to transformations** to move to the **Transformations** step.

{{<image filename="images/rc/rdi/rdi-continue-to-transformations-button.png" alt="The Continue to dataset button." width=200px >}}

## Transformations

In this step, you'll choose how the pipeline will store your data in Redis.

{{<image filename="images/rc/rdi/rdi-transformations.png" alt="The Transformations step." >}}

1. Select how your records will be stored in Redis. You can choose **Hash** or **JSON**.

1. Under **Transformation jobs**, you can supply one or more [transformation job files]({{< relref "/integrate/redis-data-integration/data-pipelines/transform-examples" >}}) that specify how you want to transform the captured data before writing it to the target. Select **Upload jobs** to upload your job files. When you upload job files, Redis Cloud will validate the job files to check for errors. 

1. Select **Edit advanced properties** to add any processor properties to control how the data is processed. 

    {{<image filename="images/rc/rdi/rdi-processor-advanced-properties.png" alt="The Advanced Processor properties." >}}

    See the [RDI configuration file reference]({{< relref "/integrate/redis-data-integration/reference/config-yaml-reference#processors" >}}) for all available processor properties.

## Review and deploy

Review the tables you selected in the **Review and deploy** step. If everything looks correct, select **Deploy pipeline** to start ingesting data from your source database.

{{<image filename="images/rc/rdi/rdi-confirm-deploy.png" alt="The Deploy pipeline button." width=175px >}}

At this point, the data pipeline will ingest data from the source database to your target Redis database. This process will take time, especially if you have a lot of records in your source database. 

After this initial sync is complete, the data pipeline enters the *change streaming* phase, where changes are captured as they happen. Changes in the source database are added to the target within a few seconds of capture. 

You can view the status of your data pipeline in the **Data pipeline** tab of your database. See [View and edit data pipeline]({{<relref "/operate/rc/rdi/view-edit">}}) to learn more.
