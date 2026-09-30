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

To manage a pipeline, select it from your workspace on the **Data Integration** page or from the **Data Integration** tab of your subscription or database.

The pipeline page has the following tabs:

- [Dashboard](#dashboard)
- [Metrics](#metrics)
- [Settings](#settings)
- [Configuration](#configuration)
- [Dataset](#dataset)
- [Transformations](#transformations)

Use the **Sources** list in **Metrics**, **Configuration**, and **Dataset** to select the source you want to inspect. **Settings** applies to the whole pipeline. **Transformations** lists jobs with their source assignments.

## Dashboard

The **Dashboard** shows pipeline health, processor and target status, throughput, pending records, record health, and processor load. It also shows the number of sources, selected tables, and transformation jobs.

{{<image filename="images/rc/rdi/rdi-2-dashboard.png" alt="Pipeline dashboard with throughput, pending records, record health, and processor load." width=100% >}}

Each source has a card showing its database type, name, activity, and status. Expand a card for more details. Open the source's **More actions** menu to view its configuration, edit its dataset or transformations, or manage the source.

{{<image filename="images/rc/rdi/rdi-2-sources.png" alt="Three source cards: one PostgreSQL source and two MySQL sources, all streaming." width=460px >}}

{{<image filename="images/rc/rdi/rdi-2-source-actions.png" alt="Source actions for configuration, dataset, transformations, stop, reset, and deletion." width=350px >}}

A pipeline can be streaming, stopped, or in an error or transitional state. If there is a problem, you can use the source cards and **Metrics** tab to identify the affected source before taking remedial action. Pipeline health and individual source status can differ, for example when one source is stopped.

### Add a source {#add-source}

1. On **Dashboard**, select **Add source**.
1. In **Add sources**, select **Add source** in the **Sources** list, choose the new database type, and enter a unique source name. Existing sources remain listed with their connection details read-only.
1. Complete **Configure source**, **Select data**, and **Add transformations** for the new source. See [Create data pipeline]({{< relref "/operate/rc/rdi/define" >}}) for the configuration steps.
1. Review the changes in **Review & deploy** and select **Deploy pipeline**.

{{<image filename="images/rc/rdi/rdi-2-add-sources.png" alt="Add-source wizard showing existing sources and the Add source control." width=100% >}}

Adding a source keeps the existing pipeline's shared target and settings, so the wizard starts at **Add sources**. A source with an incomplete setup appears with **Pending setup** in the workspace. You can resume an existing draft setup at any time to complete it. If you remove a source, wait for the removal process to finish before adding another source.

When extending an older single-source pipeline, preserve the original source name and its existing job assignments. You do not need to recreate the pipeline to add a source.

### Stop and start a source {#stop-and-start-source}

1. On **Dashboard**, open the source card's **More actions** menu.
1. Select **Stop source**, then confirm with **Stop source**.

Stopping one source pauses data capture from that source without stopping the other sources. Starting it again resumes from its saved position. To resume a source, open its **More actions** menu and select **Start source**, then confirm with **Start source**. A source processes data only while the pipeline is running. See [How does stopping sources affect billing?]({{< relref "/operate/rc/rdi/faq#stopping-and-billing" >}}).

### Reset a source {#reset-source}

Resetting one source starts a new snapshot and reprocesses its selected data.

1. On **Dashboard**, open the source card's **More actions** menu.
1. Select **Reset source**.
1. Review the effect and confirm with **Reset source**.

{{<image filename="images/rc/rdi/rdi-2-reset-source.png" alt="Reset source confirmation explaining that other sources retain their data and the pipeline temporarily stops." width=600px >}}

The reset clears that source's internal RDI streams, offsets, schema history, rejected records, and processing counters. The whole pipeline and all its sources restart during the reset. Other sources keep their saved positions and resume streaming. All records already in the shared target database remain, including those from the reset source. The new snapshot can overwrite records for that source. See [What happens when I reset one source?]({{< relref "/operate/rc/rdi/faq#reset-one-source" >}}).

### Remove a source {#remove-source}

Before deleting a source, remove or reassign transformation jobs that refer to it and apply the changes. RDI rejects deletion while a transformation job still refers to the source.

1. On **Dashboard**, open the source card's **More actions** menu.
1. Select **Delete source**.
1. Review the confirmation and select **Delete source**.

{{<image filename="images/rc/rdi/rdi-2-delete-source.png" alt="Delete source confirmation for the selected PostgreSQL source." width=600px >}}

Deleting a source removes its data selection and internal RDI state, including streams, offsets, schema history, rejected records, and processing counters. Records already written to the target Redis database remain there. Other sources retain their data. The whole pipeline stops while RDI cleans up the removed source and starts again afterwards.

Source deletion cannot be undone. To remove its records from the target, see [Can I flush data for a single source?]({{< relref "/operate/rc/rdi/faq#flush-one-source" >}}).

### Change target database

You can change the target to another database in the same subscription.

1. On **Dashboard**, open the target card's **More actions** menu and select **Change pipeline target**.
1. Select the new target database.
1. Confirm with **Change target**.

All sources share the new target. Changing the target restarts the pipeline but does not automatically re-ingest existing records. [Reset the pipeline](#reset-data-pipeline) if you need to copy the existing source data to the new target.

## Metrics

Select a source in the **Sources** list to see its connection status, snapshot progress, queue usage, errors, and table-level record counts. Available collector diagnostics depend on the source type. Expand **Diagnostics** to see additional metrics for the selected source.

{{<image filename="images/rc/rdi/rdi-2-metrics.png" alt="Metrics for the selected PostgreSQL source, including collector diagnostics and table-level counts." width=100% >}}

| Metric | Description |
|--------|-------------|
| **Source table** | Name of the data stream. Each stream corresponds to a table from the source database.  |
| **Total** | Total number of records that arrived from the source table. |
| **Pending** | Number of records from the source table that are waiting to be processed. |
| **Inserted** | Number of new records from the source table that have been written to the target database. |
| **Updated** | Number of updated records from the source table that have been updated in the target database. |
| **Deleted** | Number of deleted records from the source table that have been deleted in the target database. |
| **Filtered** | Number of records from the source table that were filtered from being inserted into the target database. |
| **Rejected** | Number of records from the source table that could not be parsed or inserted into the target database. Select a rejected count to open the [Rejected records](#rejected-records) view for that table. |

### View metrics endpoints

On **Metrics**, select **Connect to Prometheus** to view the available collector and processor endpoints. Add the required endpoints to your Prometheus configuration. Select the relevant source when inspecting per-source metrics.

Prometheus endpoints are exposed on Redis Cloud's internal network. To access this network, enable [VPC peering]({{< relref "/operate/rc/security/vpc-peering" >}}) or [AWS Transit Gateway]({{< relref "/operate/rc/security/aws-transit-gateway" >}}). See [Prometheus and Grafana with Redis Cloud]({{< relref "/integrate/prometheus-with-redis-cloud/" >}}) for more information.

{{< note >}}
VPC peering and AWS Transit Gateway are the tested and supported methods for accessing Prometheus endpoints. AWS PrivateLink support for this feature is under evaluation and is not currently supported.
{{< /note >}}

For more information about available RDI metrics, see [Observability]({{< relref "/integrate/redis-data-integration/observability" >}}).


## Rejected records

The **Rejected records** view shows records that RDI sent to the dead letter queue (DLQ) because processing failed. Open it from the rejected count on the **Dashboard** tab or from a table-level rejected count on the **Metrics** tab.

The view shows:

- The total number of rejected records.
- The number of affected tables.
- The affected tables and their rejected counts.
- Rejected record IDs and rejection times.
- Safe troubleshooting metadata, such as the rejection reason, operation, affected table, and transformation job details when available. See [Using the operation code]({{< relref "/integrate/redis-data-integration/data-pipelines/transform-examples/redis-opcode-example" >}}) for the operation labels.

Redis Cloud uses the RDI DLQ API to show a sanitized view of rejected records. It
does not show the original source record payload or every field stored in the
DLQ stream. To inspect the full DLQ entry, connect to the RDI database and read
the corresponding DLQ stream directly.

For more information about why records are rejected and how RDI stores them, see [Rejected records]({{< relref "/integrate/redis-data-integration/data-pipelines/rejected-records" >}}).


## Settings

The **Settings** tab contains the default data structure (**Hash** or **JSON**) and advanced processor properties. These settings apply to all sources in the pipeline.

{{<image filename="images/rc/rdi/rdi-2-settings.png" alt="Pipeline-wide Settings tab with default data structure and processor properties." width=100% >}}

Select **Edit** to change these settings, then **Save changes** and **Apply and restart**. RDI Cloud uses the Flink processor. Review [processor properties]({{< relref "/integrate/redis-data-integration/reference/config-yaml-reference#processors-data-processing-configuration" >}}) before changing them.

{{<image filename="images/rc/rdi/rdi-processor-advanced-properties.png" alt="The processor advanced properties editor with key and value fields." width=80% >}}

## Configuration

Select a source in the **Sources** list to view its connectivity, secret references, and collector configuration. The connection details and secrets of a deployed source are read-only in this view.

### Edit collector properties

1. Select the source in **Configuration**.
1. Select **Edit collector properties**.
1. Update the [collector source properties]({{< relref "/integrate/redis-data-integration/reference/config-yaml-reference#sourcesadvancedsource-advanced-source-settings" >}}) or [collector sink properties]({{< relref "/integrate/redis-data-integration/reference/config-yaml-reference#sourcesadvancedsink-rdi-collector-stream-writer-configuration" >}}) for that source.

    {{<image filename="images/rc/rdi/rdi-advanced-properties.png" alt="The advanced properties dialog with separate collector source and sink properties." width=80% >}}

1. Save the properties and review the restart confirmation before applying the changes.

## Dataset

Select a source in the **Sources** list to view the schemas, tables, columns, and keys selected for ingestion from that source.

{{<image filename="images/rc/rdi/rdi-2-dataset.png" alt="Dataset tab with a source selector and selected schema, tables, and columns." width=100% >}}

### Edit dataset

1. Select the source, then select **Edit**.

    {{<image filename="images/rc/rdi/rdi-view-edit-button.png" alt="The Edit button." width=100px >}}

1. Select the schemas, tables, and columns to ingest. Review the record key for each selected table and correct any missing-key warnings.

    {{<image filename="images/rc/rdi/rdi-dataset-schema-selected.png" alt="Selecting a schema shows its tables for ingestion." width=75% >}}

    {{<image filename="images/rc/rdi/rdi-select-columns.png" alt="Selecting a table shows its columns and the columns selected for ingestion." width=75% >}}

    {{<image filename="images/rc/rdi/rdi-dataset-missing-unique-key.png" alt="The missing unique key warning with the affected table and its columns." width=75% >}}

    {{<image filename="images/rc/rdi/rdi-unique-key-selected.png" alt="The key control beside the column used to identify a record." width=500px >}}

1. Select **Save changes**.
1. Review the restart warning and select **Apply and restart**.

Dataset changes belong to the selected source. Applying changes restarts the pipeline and can temporarily interrupt processing. Use [Reset a source](#reset-source) when you need a new snapshot of that source.

## Transformations

The **Transformations** tab lists the pipeline's jobs, their source assignments, matching databases, schemas and tables, and validation status.

{{<image filename="images/rc/rdi/rdi-2-transformation-jobs.png" alt="Transformation jobs assigned to three different sources, with verified status." width=100% >}}

### Edit transformations

1. Select **Edit** on **Transformations**.
1. Add, upload, or edit the [transformation jobs]({{< relref "/integrate/redis-data-integration/data-pipelines/transform-examples" >}}) needed for your tables.
1. Select the **Source name** for each job.
1. Resolve job validation errors and select **Save changes**.
1. Review the restart warning and select **Apply and restart**.

The Flink processor accepts lists and `regex:` entries in source selection patterns, but rejects jobs where more than one job can apply to a given table. The default data structure and processor properties are in [Settings](#settings).

## Reset data pipeline

Resetting the whole pipeline clears its internal RDI state for all sources. A running pipeline restarts and takes a new snapshot for every source. A stopped pipeline remains stopped until you [start it](#stop-and-restart-data-pipeline). RDI reprocesses the selected data using the current transformations. Reset alone does not delete records from the target database. See [What happens when I reset the pipeline?]({{< relref "/operate/rc/rdi/faq#reset-pipeline" >}}).

1. Open **Pipeline actions** and select **Reset pipeline**.
1. Review the confirmation and select **Reset data pipeline**.

To re-run the snapshot for just one source while preserving other sources' internal data, see [Reset a source](#reset-source).

## Stop and restart data pipeline

1. Open **Pipeline actions** and select **Stop pipeline**.
1. Confirm with **Stop pipeline**.

Stopping the pipeline pauses processing for all sources. To resume, open **Pipeline actions**, select **Start pipeline**, and confirm with **Start pipeline**. Use the [source actions](#stop-and-start-source) to control an individual source separately. Stopping all sources individually leaves the processor running. See [Billing]({{< relref "/operate/rc/rdi/faq#billing" >}}) for the difference in charges.

## Flush the target database

Flushing permanently deletes **all data** from the target database, including records from every source and data written outside RDI. It does not reset source positions or automatically reload the data.

1. [Stop the pipeline](#stop-and-restart-data-pipeline) and wait until it is stopped.
1. Open **Pipeline actions** and select **Flush target database**. This action is disabled while the pipeline is running.
1. Check the target database and confirm with **Flush target database**.

To refill the target, follow [How do I reload data after a flush?]({{< relref "/operate/rc/rdi/faq#reload-after-flush" >}}).

## Delete pipeline

1. Return to the workspace list on the **Data Integration** page or your database's **Data Integration** tab.
1. Open the pipeline's actions menu and select **Delete pipeline**.
1. Review and confirm the deletion.

Deleted pipelines cannot be recovered. If the pipeline has an associated setup draft, deletion also removes that draft. You can then [delete the workspace]({{<relref "/operate/rc/rdi/create-workspace#delete-workspace">}}) when it is no longer needed.
