---
Title: Define data pipeline
alwaysopen: false
categories:
- docs
- operate
- rc
description: Define the source connection and data pipeline.
hideListLinks: true
weight: 3
---

After you have [prepared your source database]({{<relref "/operate/rc/databases/rdi/setup">}}) and connection information, you can set up your new pipeline. To do this:

1. [Define the source connection](#define-source-connection) by entering all required source database information.
2. [Define the data pipeline](#define-data-pipeline) by selecting the data that you want to sync from your source database to the target database.

## Define source connection

1. In the [Redis Cloud console](https://cloud.redis.io/), go to your target database and select the **Data Pipeline** tab.
1. Select **Define source database**.
    {{<image filename="images/rc/rdi/rdi-define-source-database.png" alt="The define source database button." width=200px >}}
1. Enter a **Pipeline name**. 
    {{<image filename="images/rc/rdi/rdi-define-pipeline-cidr.png" alt="The pipeline name and deployment CIDR fields." >}}
1. A **Deployment CIDR** is automatically generated for you. If, for any reason, a CIDR is not generated, enter a valid CIDR that does not conflict with your applications or other databases.
1. In the **Source database connectivity** section, enter the **PrivateLink service name** of the [PrivateLink connected to your source database]({{< relref "/operate/rc/databases/rdi/setup#set-up-connectivity" >}}).
    {{<image filename="images/rc/rdi/rdi-define-connectivity.png" alt="The Source database connectivity section, with database connection details and connectivity options." >}}
1. Enter your database details. This depends on your database type, and includes:
    - **Port**: The database's port
    - **Database**: Your database's name, or the root database *(PostgreSQL, Oracle only)*, or a comma-separated list of one or more databases you want to connect to *(SQL Server only)*
    - **Database Server ID**: Unique ID for the replication client. Enter a number that is not used by any existing replication clients *(mySQL and mariaDB only)*
    - **PDB**: Name of the Oracle pluggable database *(Oracle only)*
1. Enter the ARN of your [database credentials secret]({{< relref "/operate/rc/databases/rdi/setup#create-database-credentials-secrets" >}}) in the **Source database secrets ARN** field.
1. If your database requires TLS, select **Use TLS**. Enter the ARN of your [CA certificate secret]({{< relref "/operate/rc/databases/rdi/setup#create-database-credentials-secrets" >}}) in the **CA Cert Secret ARN** field.
    {{<image filename="images/rc/rdi/rdi-define-tls.png" alt="The Source database connectivity section, with Use TLS selected and the CA Cert Secret ARN field." >}}
1. If your database requires mTLS, select **Use mTLS**. Enter the ARN of your [Client certificate secret]({{< relref "/operate/rc/databases/rdi/setup#create-database-credentials-secrets" >}}) in the **Client Certificate Secret ARN** field and the ARN of your [Client key secret]({{< relref "/operate/rc/databases/rdi/setup#create-database-credentials-secrets" >}}) in the **Client Key Secret ARN** field.
    {{<image filename="images/rc/rdi/rdi-define-mtls.png" alt="The Source database connectivity section, with Use TLS selected and the Client Certificate Secret ARN and Client Key Secret ARN fields." >}}
1. If your database requires mTLS with a client key passphrase, enter the ARN of your [Client key passphrase secret]({{< relref "/operate/rc/databases/rdi/setup#create-database-credentials-secrets" >}}) in the **Please add a secret ARN for the password to use with the secret store** field.
1. Select **Start pipeline setup**.
    {{<image filename="images/rc/rdi/rdi-start-pipeline-setup.png" alt="The start pipeline setup button." width=200px >}}
1. Redis Cloud will attempt to connect to PrivateLink. If your PrivateLink does not allow automatic acceptance of incoming connections, accept the incoming connection on AWS PrivateLink to proceed. See [Accept or Reject PrivateLink connection requests](https://docs.aws.amazon.com/vpc/latest/privatelink/configure-endpoint-service.html#accept-reject-connection-requests).

    If Redis Cloud can't find your PrivateLink connection, make sure that the PrivateLink service name is correct and that Redis Cloud is listed as an Allowed Principal for your VPC. See [Set up connectivity]({{<relref "/operate/rc/databases/rdi/setup#set-up-connectivity">}}) for more info.

At this point, Redis Cloud will provision the pipeline infrastructure that will allow you to define your data pipeline. 

{{<image filename="images/rc/rdi/rdi-pipeline-setup-in-progress.png" alt="The Pipeline setup in progress screen." width=75% >}}

Pipelines are provisioned in the background. You aren't allowed to make changes to your data pipeline or to your database during provisioning. This process will take about an hour, so you can close the window and come back later.

When your pipeline is provisioned, select **Complete setup**. You will then [define your data pipeline](#define-data-pipeline).

{{<image filename="images/rc/rdi/rdi-complete-setup.png" alt="The complete setup button." width=200px >}}

## Define data pipeline

After your pipeline is provisioned, you will be able to define your pipeline. You will select the database schemas, tables, and columns that you want to import and synchronize with your primary database.

### Configure a new pipeline

1. In the [Redis Cloud console](https://cloud.redis.io/), go to your target database and select the **Data Pipeline** tab. If your pipeline is already provisioned, select **Complete setup** to go to the **Data modeling** section.
    {{<image filename="images/rc/rdi/rdi-complete-setup.png" alt="The complete setup button." width=200px >}}
1. Select the Schema and Tables you want to migrate to the target database from the list. 
    {{<image filename="images/rc/rdi/rdi-select-source-data.png" alt="The data modeling section. " width=75% >}}

    Select **Manage Columns** to choose which columns you want to import.

    {{<image filename="images/rc/rdi/rdi-manage-columns.png" alt="The manage columns button." width=150px >}}

    You can select any number of columns from a table.

    {{<image filename="images/rc/rdi/rdi-select-columns.png" alt="The manage columns screen, with a few columns selected from one table" width=75% >}}

    If any tables are missing a unique constraint, a warning will appear in the **Data modeling** section. Select **Manage columns** to select the columns that define a unique constraint for those tables.

    {{<image filename="images/rc/rdi/rdi-missing-unique-constraint.png" alt="The missing unique constraint list." width=75% >}}

    {{<image filename="images/rc/rdi/rdi-select-constraints.png" alt="The missing unique constraint list with columns selected." width=75% >}}

    Select **Save** to save your column changes and go back to schema selection.

    {{<image filename="images/rc/button-save.png" alt="The save button." width=100px >}}

    Select **Add schema** to add more database schemas.

    {{<image filename="images/rc/rdi/rdi-add-schema.png" alt="The add schema button." width=150px >}}
    
    Select **Delete** to delete a schema. You must have at least one schema to continue.

    {{<image filename="images/rc/rdi/rdi-delete-schema.png" alt="The delete schema button." width=50px >}}

    After you've selected the schemas and tables you want to sync, select **Continue**.

     {{<image filename="images/rc/rdi/rdi-continue-button.png" alt="The continue button." width=150px >}}
    
1. Select the Redis data type to write keys to the target. You can choose **Hash** or **JSON** if the target database supports JSON. 
    {{<image filename="images/rc/rdi/rdi-configure-new-pipeline.png" alt="The pipeline definition screen." width=75% >}}

    You can also supply one or more [transformation job files]({{< relref "/integrate/redis-data-integration/data-pipelines/transform-examples" >}}) that specify how you want to transform the captured data before writing it to the target. Select **Upload jobs** to upload your job files.

    {{<image filename="images/rc/rdi/rdi-transformation-jobs.png" alt="The transformation jobs section. Select Upload jobs to upload transformation jobs." >}}

    When you upload job files, Redis Cloud will validate the job files to check for errors. 

    Select **Continue**.
    {{<image filename="images/rc/rdi/rdi-continue-button.png" alt="The continue button." width=150px >}}

1. Review the tables you selected in the **Review and deploy** section. If everything looks correct, select **Confirm & Deploy** to start ingesting data from your source database.

    {{<image filename="images/rc/rdi/rdi-confirm-deploy.png" alt="The Confirm & Deploy button." width=175px >}}

At this point, the data pipeline will ingest data from the source database to your target Redis database. This process will take time, especially if you have a lot of records in your source database. 

After this initial sync is complete, the data pipeline enters the *change streaming* phase, where changes are captured as they happen. Changes in the source database are added to the target within a few seconds of capture. 

You can view the status of your data pipeline in the **Data pipeline** tab of your database. See [View and edit data pipeline]({{<relref "/operate/rc/databases/rdi/view-edit">}}) to learn more.