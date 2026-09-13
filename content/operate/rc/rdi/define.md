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

Creating a pipeline has six steps:

1. [**Settings**](#settings): Select the shared target, default data structure, and processor properties.
1. [**Add sources**](#pipeline-setup): Select source types and give each source a unique name.
1. [**Configure source**](#source-configuration): Configure and test connectivity and credentials for each source.
1. [**Select data**](#dataset): Select schemas, tables, and columns for each source.
1. [**Add transformations**](#transformations): Add jobs and assign them to sources.
1. [**Review & deploy**](#review-and-deploy): Review all sources and deploy the pipeline.

## Settings

1. Select the target from the **Target database** list. All sources write to this database.
1. Select **Hash** or **JSON** as the **Default data structure**. Transformation jobs can override how individual records are written.
1. If needed, configure **Processor properties**. These apply to the whole pipeline, not to an individual source. See the [processor configuration reference]({{< relref "/integrate/redis-data-integration/reference/config-yaml-reference#processors-data-processing-configuration" >}}).
1. Select **Continue**.

New RDI 2.0.0 pipelines use the Flink processor by default. Existing pipelines retain their configured processor. Check [processor differences]({{< relref "/integrate/redis-data-integration/architecture/classic-vs-flink" >}}) before using processor-specific properties or transformations.

## Add sources {#pipeline-setup}

1. Select a source database type: **MySQL**, **MariaDB**, **Oracle**, **SQL Server**, **PostgreSQL**, **MongoDB**, or **Snowflake** (Preview).
1. Enter a unique **Source name**, for example `inventory-mysql`. Use up to 22 characters: lowercase letters, numbers, and hyphens. Start with a lowercase letter and end with a letter or number. The names `rdi`, `source`, `target`, and `api` are reserved for new sources.
1. To include another source, select **Add source** in the **Sources** list and repeat these steps. You can combine different database types or add several sources of the same type.
1. Select **Continue**.

The source name identifies the source in the pipeline configuration and transformation jobs; it is not just a display label. Keep the names and job assignments of an existing single-source pipeline when you add another source. Existing sources retain their names even if those names would not be accepted for a new source.

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
- For **Public Endpoint**, enter the source IP address or hostname. Add the Redis Cloud outbound IP address shown in the console to your source database's allowlist.

Configure connectivity for each source separately. Sources in the same pipeline can use different connectivity methods.

### Secrets

Enter the Amazon Resource Name (ARN) of the selected source's [database credentials secret]({{< relref "/operate/rc/rdi/setup#create-database-credentials-secrets" >}}) in **Credentials Secret ARN**.

For Snowflake, select the authentication method matching your secret:

- **Password**: The credentials secret contains `username` and `password`.
- **Key-pair**: The credentials secret contains `username`; any `password` is ignored. Provide the private key secret ARN. The private key is stored in plain text PEM format.

Under **Transit security**, select the mode required by your source:

- **TLS** (Transport Layer Security): Provide the CA certificate secret ARN when your source requires it.
- **mTLS** (mutual TLS): Provide the CA certificate, client certificate, and client private key secret ARNs. Also provide the client key passphrase secret ARN if the key is encrypted.

For MySQL, MariaDB, and MongoDB sources, RDI 2.0.0 derives the Debezium keystore settings from the source certificate secrets. You do not need to add `database.ssl.keystore` or `mongodb.ssl.keystore` and their passwords to the advanced source properties. Explicit advanced settings still override the derived values.

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

RDI derives `topic.prefix` from the source name. Do not set `topic.prefix` in the advanced source properties.

## Select data {#dataset}

Select each source in the **Sources** list and choose the data to ingest from that source.

{{< warning >}}
Do not write data directly to the target database outside of RDI. Writing to the target database from other sources can cause transformation failures and data inconsistencies. If you need to reset the pipeline and resync from the source, any data written to the target outside of RDI will be lost.
{{< /warning >}}

1. Select a schema in **Schemas** to see its tables.
1. Select the tables to ingest in **Tables**.
1. Select a table to see its **Columns**, then select the columns to ingest.
1. If a table has no unique key, use the key control next to the column that identifies each record. Review any missing-key warnings before continuing.
1. Repeat for the other sources, then select **Continue**.

The available schema, table, and column controls depend on the source type. Each source keeps its own selection, including when two sources contain tables with the same name.

## Add transformations {#transformations}

Transformation jobs are optional. Without a matching job, RDI writes records using the pipeline's default data structure.

1. Select **Upload jobs** to upload the [transformation job files]({{< relref "/integrate/redis-data-integration/data-pipelines/transform-examples" >}}) needed for your selected tables.
1. Check the **Source name** assignment for each job. In a multi-source pipeline, `source.server_name` identifies the source the job reads from. Use the source name for new sources. For an upgraded single-source pipeline, preserve the existing assignment, such as `rdi` for a Debezium source.
1. Review each job's validation status and correct errors.
1. Select **Continue to review & deploy**.

For the Flink processor, source matchers can use lists or entries prefixed with `regex:` to select several tables. Jobs must not overlap on the same table. See [Transformation examples]({{< relref "/integrate/redis-data-integration/data-pipelines/transform-examples" >}}).

## Review and deploy {#review-and-deploy}

Review every source's connection, selected data, and transformation jobs, together with the shared target and settings. Use the source actions to return to a section that needs changes.

Select **Deploy pipeline** to start the pipeline. Each source performs its initial snapshot and then captures ongoing changes. Snapshot duration depends on the amount of selected data and source performance.

Open the pipeline's [Dashboard and Metrics tabs]({{<relref "/operate/rc/rdi/view-edit">}}) to follow progress for each source.
