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
description: Connect one or more source databases to a Redis Cloud target and define your data pipeline.
hideListLinks: true
weight: 4
---

After you have [prepared each source database]({{<relref "/operate/rc/rdi/setup">}}) and [created a workspace]({{<relref "/operate/rc/rdi/create-workspace">}}), you can create a pipeline. One pipeline can ingest data from several source databases into one Redis target.

In the [Redis Cloud console](https://cloud.redis.io/), open your target database's **Data Integration** tab and select **Add pipeline**. You can also open the workspace from the **Data Integration** page or your subscription's **Data Integration** tab. To continue an existing draft, open its actions menu and select **Resume pipeline setup**.

{{<image filename="images/rc/rdi/rdi-workspace-add-pipeline.png" alt="The Add pipeline control is available while the workspace is being created." width=80% >}}

To create a pipeline:

1. [**Settings**](#settings): Select the shared target, default data structure, and processor properties.
1. [**Add sources**](#pipeline-setup): Select source types and give each source a unique name.
1. [**Configure source**](#source-configuration): Configure and test connectivity and credentials for each source.
1. [**Select data**](#dataset): Select schemas, tables, and columns for each source.
1. [**Add transformations**](#transformations): Add jobs and assign them to sources.
1. [**Review & deploy**](#review-and-deploy): Review all sources and deploy the pipeline.

## Settings

1. Select the target from the **Target database** list. All sources write to this database.

    {{<image filename="images/rc/rdi/rdi-choose-target.png" alt="The target database list in pipeline Settings." width=80% >}}

1. Select **Hash** or **JSON** as the **Default data structure**. Transformation jobs can override how individual records are written.
1. If needed, configure **Processor properties**. These apply to the whole pipeline, not to an individual source. See the [processor configuration reference]({{< relref "/integrate/redis-data-integration/reference/config-yaml-reference#processors-data-processing-configuration" >}}).

    {{<image filename="images/rc/rdi/rdi-processor-advanced-properties.png" alt="The processor advanced properties editor with key and value fields." width=80% >}}

1. Select **Continue**.

RDI Cloud uses the Flink processor.

## Add sources {#pipeline-setup}

1. Select a source database type: **MySQL**, **MariaDB**, **Oracle**, **SQL Server**, **PostgreSQL**, **MongoDB**, or **Snowflake** (Preview).
1. Enter a unique **Source name**, for example `inventory-mysql`. Use up to 22 characters: lowercase letters, numbers, and hyphens. Start with a lowercase letter and end with a letter or number. The names `rdi`, `source`, `target`, and `api` cannot be used for sources.
1. To include another source, select **Add source** in the **Sources** list and repeat these steps. You can combine different database types or add several sources of the same type.
1. Select **Continue**.

The source name identifies the source in the pipeline configuration and transformation jobs; it is not just a display label. These naming rules were introduced with RDI 2.0.0. Sources that existed before the upgrade retain their names, even if they do not meet these rules.

Select a source in the **Sources** list to configure its connection and dataset. Each source has separate progress indicators for its details, configuration, and data selection.

## Configure source {#source-configuration}

Repeat the following configuration for every source. The **Configure source** step has three expandable sections:

1. [Source connectivity](#source-connectivity)
1. [Secrets](#secrets)
1. [Source configuration](#source-configuration-section)

Complete the sections and select **Test source**. Correct any reported errors before continuing. Select each other source and test its configuration, then select **Continue** to open **Select data**.

### Source connectivity

Choose **AWS Private Link** or **Public Endpoint** for the selected source, according to its [connectivity requirements]({{<relref "/operate/rc/rdi#prerequisites">}}).

- For **AWS Private Link**, enter the **Private Link service name** from your [endpoint service]({{< relref "/operate/rc/rdi/setup#set-up-connectivity" >}}). Select **Connect to Private Link** and wait for connectivity to complete. If the connection fails, check the service name and its allowed principal.

    {{<image filename="images/rc/rdi/rdi-source-configuration-source-connectivity-privatelink.png" alt="AWS Private Link connectivity with the service name and Connect to Private Link control." width=80% >}}

- For **Public Endpoint**, enter the source IP address or hostname. Add the Redis Cloud outbound IP address shown in the console to your source database's allowlist.

    {{<image filename="images/rc/rdi/rdi-source-configuration-source-connectivity-public.png" alt="Public endpoint connectivity with source hostname and Redis Cloud outbound IP addresses." width=80% >}}

Configure connectivity for each source separately. Sources in the same pipeline can use different connectivity methods.

### Secrets

Enter the Amazon Resource Name (ARN) of the selected source's [database credentials secret]({{< relref "/operate/rc/rdi/setup#create-database-credentials-secrets" >}}) in **Credentials Secret ARN**.

{{<image filename="images/rc/rdi/rdi-source-configuration-secrets.png" alt="The Credentials Secret ARN field, transit security options, and Validate control." width=80% >}}

For Snowflake, select the authentication method matching your secret:

- **Password**: The credentials secret contains `username` and `password`.
- **Key-pair**: The credentials secret contains `username`; any `password` is ignored. Provide the private key secret ARN. The private key is stored in plain text PEM format.

Under **Transit security**, select the mode required by your source:

- **TLS** (Transport Layer Security): Provide the CA certificate secret ARN when your source requires it.

    {{<image filename="images/rc/rdi/rdi-define-tls.png" alt="TLS transit security with the CA Certificate Secret ARN field." width=80% >}}

- **mTLS** (mutual TLS): Provide the CA certificate, client certificate, and client private key secret ARNs. Also provide the client key passphrase secret ARN if the key is encrypted.

    {{<image filename="images/rc/rdi/rdi-define-mtls.png" alt="mTLS transit security with certificate, private key, and optional password secret ARN fields." width=80% >}}

Select **Validate** to check access to the selected source's secrets. Repeat this for each source. The AWS secret contents and permissions are described in [Share source database credentials]({{< relref "/operate/rc/rdi/setup#share-source-database-credentials" >}}).

### Source configuration {#source-configuration-section}

Enter the selected source's database settings. The fields depend on the database type and can include:

- **Port**: The source database port.
- **Database(s)**: The database name, or a comma-separated list for source types that support multiple databases.
- **Database Server ID**: A replication client ID for MySQL or MariaDB. Use a different ID for each collector connecting to the same database server.
- **PDB**: The Oracle pluggable database.
- **Connection string**: The MongoDB connection information.

{{<image filename="images/rc/rdi/rdi-2-source-configuration.png" alt="Source-specific database, port, and collector properties." width=80% >}}

Use **Collector properties** for additional source and sink settings. These settings apply to the selected source. See the [collector source properties]({{< relref "/integrate/redis-data-integration/reference/config-yaml-reference#sourcesadvancedsource-advanced-source-settings" >}}) and [collector sink properties]({{< relref "/integrate/redis-data-integration/reference/config-yaml-reference#sourcesadvancedsink-rdi-collector-stream-writer-configuration" >}}).

{{<image filename="images/rc/rdi/rdi-source-configuration-collector-properties.png" alt="The Edit advanced properties control under Collector properties." width=500px >}}

{{<image filename="images/rc/rdi/rdi-advanced-properties.png" alt="The advanced properties dialog with separate collector source and sink properties." width=80% >}}

## Select data {#dataset}

Select each source in the **Sources** list and choose the data to ingest from that source.

{{< warning >}}
Do not write data directly to keys managed by RDI. Changes from another application can cause transformation failures or data inconsistencies, and RDI can overwrite them. A pipeline reset does not flush the target database. **Flush target database** is a separate action that deletes all target data, including data written outside RDI. See [Data recovery]({{< relref "/operate/rc/rdi/faq#data-recovery" >}}).
{{< /warning >}}

1. Select a schema in **Schemas** to see its tables.
1. Select the tables to ingest in **Tables**.

    {{<image filename="images/rc/rdi/rdi-dataset-schema-selected.png" alt="Selecting a schema shows its tables for ingestion." width=75% >}}

1. Select a table to see its **Columns**, then select the columns to ingest.

    {{<image filename="images/rc/rdi/rdi-select-columns.png" alt="Selecting a table shows its columns and the columns selected for ingestion." width=75% >}}

1. If a table has no unique key, use the key control next to the column that identifies each record. Review any missing-key warnings before continuing.

    {{<image filename="images/rc/rdi/rdi-dataset-missing-unique-key.png" alt="The missing unique key warning with the affected table and its columns." width=75% >}}

    {{<image filename="images/rc/rdi/rdi-unique-key-selected.png" alt="The key control beside the column used to identify a record." width=500px >}}

1. Repeat for the other sources, then select **Continue**.

The available schema, table, and column controls depend on the source type. Each source keeps its own selection, including when two sources contain tables with the same name.

## Add transformations {#transformations}

Transformation jobs are optional. Without a matching job, RDI writes records using the pipeline's default data structure.

1. Select **Upload jobs** to upload the [transformation job files]({{< relref "/integrate/redis-data-integration/data-pipelines/transform-examples" >}}) needed for your selected tables.
1. Check the **Source name** assignment for each job. In a multi-source pipeline, `source.server_name` identifies the source the job reads from. Select the source name you chose during setup.
1. Review each job's validation status and correct errors.

    {{<image filename="images/rc/rdi/rdi-2-transformation-jobs.png" alt="Example transformation jobs with their source assignments and validation status." width=100% >}}

1. Select **Continue to review & deploy**.

For the Flink processor, source matchers can use lists or entries prefixed with `regex:` to select several tables. Jobs must not overlap on the same table. See [Transformation examples]({{< relref "/integrate/redis-data-integration/data-pipelines/transform-examples" >}}).

## Review and deploy {#review-and-deploy}

Review every source's connection, selected data, and transformation jobs, together with the shared target and settings. Use the source actions to return to a section that needs changes.

Select **Deploy pipeline** to start the pipeline. Each source performs its initial snapshot and then captures ongoing changes. Snapshot duration depends on the amount of selected data and source performance.

{{<image filename="images/rc/rdi/rdi-confirm-deploy.png" alt="The Deploy pipeline button." width=175px >}}

Open the pipeline's [Dashboard and Metrics tabs]({{<relref "/operate/rc/rdi/view-edit">}}) to follow progress for each source.
