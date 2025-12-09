---
Title: View and edit data pipeline
alwaysopen: false
categories:
- docs
- operate
- rc
description: Observe and change your data pipeline.
hideListLinks: true
weight: 4
---

Use the **Data pipeline** tab in your database to view and edit your data pipeline.

The **Data pipeline** tab gives an overview of your data pipeline and lets you view your data stream metrics. 

{{<image filename="images/rc/rdi/rdi-status-metrics-tables.png" alt="The select source database type list." width=80% >}}

The **Status** table shows statistics for the whole data pipeline: 
- **Status**: The status of the data pipeline. Possible statuses include:
    | Status | Description |
    |--------|-------------|
    | {{<image filename="images/rc/rdi/pipeline-status-initial-sync.png#no-click" height=30px alt="Initial Sync" class="inline" >}} | The data pipeline is ingesting all records from the source database into the target database. |
    | {{<image filename="images/rc/rdi/pipeline-status-streaming.png#no-click" height=30px alt="Streaming" class="inline" >}} | The data pipeline is capturing new changes from the source database as they happen. Changes in the source database are added to the target database within a few seconds. |
    | {{<image filename="images/rc/rdi/pipeline-status-stopped.png#no-click" height=30px alt="Stopped" class="inline" >}}| The data pipeline has been [stopped](#stop-and-restart-data-pipeline). |
    | {{<image filename="images/rc/rdi/pipeline-status-error.png#no-click" height=30px alt="Error" class="inline" >}} | There is an error in the data pipeline. [Reset the pipeline](#reset-data-pipeline) and contact support if the issue persists. |
- **Total ingested**: Total number of records ingested from the source database.
- **Total inserted**: Total number of records inserted into the target database.
- **Total filtered**: Total number of records filtered from being inserted into the target database.
- **Total rejected**: Total number of records that could not be parsed or inserted into the target database.

The **Data stream metrics** table shows the following metrics for each data stream:
| Metric | Description |
|--------|-------------|
| **Name** | Name of the data stream. Each stream corresponds to a table from the source database.  |
| **Total** | Total number of records that arrived from the source table. |
| **Pending** | Number of records from the source table that are waiting to be processed. |
| **Inserted** | Number of new records from the source table that have been written to the target database. |
| **Updated** | Number of updated records from the source table that have been updated in the target database. |
| **Deleted** | Number of deleted records from the source table that have been deleted in the target database. |
| **Filtered** | Number of records from the source table that were filtered from being inserted into the target database. |
| **Rejected** | Number of records from the source table that could not be parsed or inserted into the target database. |

## Edit data pipeline

To change the data you want to ingest from the data pipeline:

1. From the **Data pipeline** tab, select **Edit**.

    {{<image filename="images/rc/rdi/rdi-edit-button.png" alt="The edit pipeline button." width=100px >}}

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

1. Review the tables you selected in and select how you want to update the data pipeline:

    {{<image filename="images/rc/rdi/rdi-update-preferences.png" alt="The Select update preferences section." width=25% >}}

    - **Apply to new data changes only**: The data pipeline will only synchronize new updates to the schema and tables selected. The data pipeline will not ingest any data from new schemas or tables that are selected.
    - **Reset pipeline (re-process all data)**: The data pipeline will re-ingest all of the selected data.
    - **Flush cached data and reset pipeline**: The data pipeline will flush the target Redis database, and then re-ingest all of the selected data from the source database.

1. Select **Apply changes**.

    {{<image filename="images/rc/rdi/rdi-apply-changes.png" alt="The apply changes button." width=150px >}}

At this point, the data pipeline will apply the changes. If you selected **Reset pipeline** or **Flush cached data and reset pipeline**, the data pipeline will ingest data from the source database to the target database. After this initial sync is complete, the data pipeline enters the *change streaming* phase, where changes are captured as they happen.

If you selected **Apply to new data changes only**, the data pipeline will enter the *change streaming* phase without ingesting data.

## View metrics endpoints

You can use [Prometheus and Grafana]({{< relref "/integrate/prometheus-with-redis-cloud/" >}}) to track and display metrics for the data pipeline. 

To view the metrics endpoints for the source collector and pipeline processor, go to the **Data pipeline** tab and select **More actions**, and then **Show metrics**. You can add these endpoints as Prometheus targets to start tracking your RDI metrics.

Prometheus endpoints are exposed on Redis Cloud's internal network. To access this network, enable [VPC peering]({{< relref "/operate/rc/security/network-security/connect-private-endpoint/vpc-peering" >}}) or [AWS Transit Gateway]({{< relref "/operate/rc/security/network-security/connect-private-endpoint/aws-transit-gateway" >}}). See [Prometheus and Grafana with Redis Cloud]({{< relref "/integrate/prometheus-with-redis-cloud/" >}}) for more information.

For more information about available RDI metrics, see [Observability]({{< relref "/integrate/redis-data-integration/observability" >}}).

## Reset data pipeline

Resetting the data pipeline creates a new baseline snapshot from the current state of your source database, and re-processes the data from the source database to the target Redis database. You may want to reset the pipeline if the source and target databases were disconnected or you made large changes to the data pipeline.

To reset the data pipeline and restart the ingest process:

1. From the **Data pipeline** tab, select **More actions**, and then **Reset pipeline**.

1. If you want to flush the database, check **Flush target database**. 

1. Select **Reset data pipeline**.

At this point, the data pipeline will re-ingest data from the source database to your target Redis database.

## Stop and restart data pipeline

To stop the data pipeline from synchronizing new data:

1. From the **Data pipeline** tab, select **More actions**, and then **Stop pipeline**.

1. Select **Stop data pipeline** to confirm.

Stopping the data pipeline will suspend data processing. To restart the pipeline from the **Data pipeline** tab, select **More actions**, and then **Start pipeline**.

## Delete pipeline

To delete the data pipeline:

1. From the **Data pipeline** tab, select **More actions**, and then **Delete pipeline**.

1. Select **Delete data pipeline** to confirm.

Deleted data pipelines cannot be recovered.