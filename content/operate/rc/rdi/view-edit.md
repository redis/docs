---
Title: View and edit data pipeline
aliases:
    - /operate/rc/databases/rdi/view-edit/
    - /operate/rc/databases/rdi/view-edit
alwaysopen: false
categories:
- docs
- operate
- rc
description: Observe and change your data pipeline.
hideListLinks: true
weight: 4
---

To view or manage your data pipeline, select it from your workspace from the **Data Integration** page or from the **Data Integration** tab in your subscription or database.

<!-- TODO: CHANGE IMAGE
{{<image filename="images/rc/rdi/rdi-status-metrics-tables.png" alt="The select source database type list." width=80% >}}
-->

The pipeline page has the following tabs:

- [Dashboard](#dashboard)
- [Metrics](#metrics)
- [Configuration](#configuration)
- [Dataset](#dataset)
- [Transformations](#transformations)

The following sections describe each of these tabs.

## Dashboard

The **Dashboard** tab shows an overview and high-level statistics for the data pipeline.

- **Pipeline health**: The status of the data pipeline. Possible statuses include:
    | Status | Description |
    |--------|-------------|
    | **Streaming** | The data pipeline is capturing new changes from the source database as they happen. Changes in the source database are added to the target database within a few seconds. |
    | **Stopped**| The data pipeline has been [stopped](#stop-and-restart-data-pipeline). |
    | **Error** | There is an error in the data pipeline. [Reset the pipeline](#reset-data-pipeline) and contact support if the issue persists. |
- **Total ingested**: Total number of records ingested from the source database.
- **Total inserted**: Total number of records inserted into the target database.
- **Total filtered**: Total number of records filtered from being inserted into the target database.
- **Total rejected**: Total number of records that could not be parsed or inserted into the target database.

## Metrics

The **Metrics** tab shows the following metrics for each data stream:
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

### View metrics endpoints

You can use [Prometheus and Grafana]({{< relref "/integrate/prometheus-with-redis-cloud/" >}}) to track and display metrics for the data pipeline. 

To view the metrics endpoints for the source collector and pipeline processor, select **More actions**, and then **Show metrics**. You can add these endpoints as Prometheus targets to start tracking your RDI metrics.

Prometheus endpoints are exposed on Redis Cloud's internal network. To access this network, enable [VPC peering]({{< relref "/operate/rc/security/vpc-peering" >}}) or [AWS Transit Gateway]({{< relref "/operate/rc/security/aws-transit-gateway" >}}). See [Prometheus and Grafana with Redis Cloud]({{< relref "/integrate/prometheus-with-redis-cloud/" >}}) for more information.

For more information about available RDI metrics, see [Observability]({{< relref "/integrate/redis-data-integration/observability" >}}).

## Configuration

The **Configuration** tab shows your source connectivity, secrets, and collector configuration properties. If you accidentally overwrite the access for your load balancer or secrets, you can find the required ARNs here.

### Edit collector properties

From the **Configuration** tab of your pipeline, select **Edit collector properties** to change your collector properties.

{{<image filename="images/rc/rdi/rdi-advanced-properties.png" alt="The advanced properties section." width=80% >}}

You can add any [Debezium source property](https://debezium.io/documentation/reference/stable/connectors/) for your source database type in the **Collector source properties** section and any [Redis server Debezium sink property](https://debezium.io/documentation/reference/stable/operations/debezium-server.html#_redis_stream) in the **Collector sink properties** section. Select **Save properties** to save the collector properties.

## Dataset

The **Dataset** tab shows the data from your source database that is ingested into your target database.

### Edit dataset

To change the dataset for your data pipeline:

1. From the **Dataset** tab of your pipeline, select **Edit**.

1. In the **Schemas** section, select the schema(s) you want to migrate to the target database from the list.

    {{<image filename="images/rc/rdi/rdi-dataset-schema-selected.png" alt="The dataset step with a schema selected." width=75% >}}

1. When you select a schema, you will see its tables in the **Tables** section. Redis Cloud will automatically select all tables for import. You can de-select any columns you do not wish to import to your Redis database.

1. Select a table to view its columns in the **Columns** section. You can de-select any columns you do not wish to import.

    {{<image filename="images/rc/rdi/rdi-select-columns.png" alt="The columns section, with a few columns selected from one table" width=75% >}}

    If any tables are missing a unique key, a warning will appear in the **Data modeling** section. Select **Show affected** to filter the **Tables** section to the tables without a unique key.
    
    {{<image filename="images/rc/rdi/rdi-dataset-missing-unique-key.png" alt="The dataset step filtered to show tables that are missing a unique key." width=75% >}}

    For these tables, select the key icon next to the column that defines a unique key. 

    {{<image filename="images/rc/rdi/rdi-unique-key-selected.png" alt="The unique key icon." width=500px >}}

1. Select **Save changes** to save your changes.

1. Review the tables you selected in and select how you want to update the data pipeline:

    - **Apply to new data changes only**: The data pipeline will only synchronize new updates to the schema and tables selected. The data pipeline will not ingest any data from new schemas or tables that are selected.
    - **Reset pipeline (re-process all data)**: The data pipeline will re-ingest all of the selected data.
    - **Flush cached data and reset pipeline**: The data pipeline will flush the target Redis database, and then re-ingest all of the selected data from the source database.

1. Select **Apply changes** or **Apply and restart** to proceed.

At this point, the data pipeline will apply the changes. If you selected **Reset pipeline** or **Flush cached data and reset pipeline**, the data pipeline will ingest data from the source database to the target database. After this initial sync is complete, the data pipeline enters the *change streaming* phase, where changes are captured as they happen.

If you selected **Apply to new data changes only**, the data pipeline will enter the *change streaming* phase without ingesting data.

## Transformations

The **Transformations** tab shows the default data structure for records in your target database and any transformation jobs or processor properties you've set for your pipeline.

### Edit transformations

To edit any of the information in the **Transformations** tab:

1. From the **Transformations** tab of your pipeline, select **Edit**.

1. Select how your records will be stored in Redis. You can choose **Hash** or **JSON**.

1. Under **Transformation jobs**, you can supply one or more [transformation job files]({{< relref "/integrate/redis-data-integration/data-pipelines/transform-examples" >}}) that specify how you want to transform the captured data before writing it to the target. Select **Upload jobs** to upload your job files. When you upload job files, Redis Cloud will validate the job files to check for errors. 

1. Select **Edit advanced properties** to add any processor properties to control how the data is processed. 

    {{<image filename="images/rc/rdi/rdi-processor-advanced-properties.png" alt="The Advanced Processor properties." >}}

    See the [RDI configuration file reference]({{< relref "/integrate/redis-data-integration/reference/config-yaml-reference#processors" >}}) for all available processor properties.

1. Select **Save changes**.

1. Review your changes. 

    Changing the data structure or processor properties requires the data pipeline to flush and re-ingest all of the data from the source database to avoid conflicts.

    If you only changed transformation jobs, select how you want to update the data pipeline:

    - **Apply to new data changes only**: The data pipeline will only synchronize new updates to the schema and tables selected. The data pipeline will not ingest any data from new schemas or tables that are selected.
    - **Reset pipeline (re-process all data)**: The data pipeline will re-ingest all of the selected data.
    - **Flush cached data and reset pipeline**: The data pipeline will flush the target Redis database, and then re-ingest all of the selected data from the source database.

1. Select **Apply changes** or **Apply and restart** to proceed.

## Reset data pipeline

Resetting the data pipeline creates a new baseline snapshot from the current state of your source database, and re-processes the data from the source database to the target Redis database. You may want to reset the pipeline if the source and target databases were disconnected or you made large changes to the data pipeline.

To reset the data pipeline and restart the ingest process:

1. From your pipeline, select **More actions**, and then **Reset pipeline**.

1. If you want to flush the database, check **Flush target database**. 

1. Select **Reset data pipeline**.

At this point, the data pipeline will re-ingest data from the source database to your target Redis database.

## Stop and restart data pipeline

To stop the data pipeline from synchronizing new data:

1. From your pipeline, select **More actions**, and then **Stop pipeline**.

1. Select **Stop data pipeline** to confirm.

Stopping the data pipeline will suspend data processing. To restart the pipeline from the **Data pipeline** tab, select **More actions**, and then **Start pipeline**.

## Delete pipeline

To delete the data pipeline:

1. From your pipeline, select **More actions**, and then **Delete pipeline**.

1. Select **Delete data pipeline** to confirm.

Deleted data pipelines cannot be recovered.