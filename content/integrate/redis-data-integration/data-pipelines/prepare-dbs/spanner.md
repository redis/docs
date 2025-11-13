---
Title: Prepare Spanner for RDI
aliases: /integrate/redis-data-integration/ingest/data-pipelines/prepare-dbs/spanner/
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Prepare Google Cloud Spanner databases to work with RDI
group: di
linkTitle: Prepare Spanner
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 2
---

Google Cloud Spanner requires specific configuration to enable change data capture (CDC) with RDI.
RDI operates in two phases with Spanner: snapshot (initial sync) and streaming. During the snapshot
phase, RDI uses the JDBC driver to connect directly to Spanner and read the current state of the
database. In the streaming phase, RDI uses [Spanner's Change Streams](https://cloud.google.com/spanner/docs/change-streams) to capture changes related to
the monitored schemas and tables.

{{< note >}}
Spanner is only supported with RDI deployed on Kubernetes/Helm. RDI VM mode does not support Spanner as a source database.
{{< /note >}}

```checklist {id="spannerlist" nointeractive="true" }
- [ ] [Prepare for snapshot](#1-prepare-for-snapshot)
- [ ] [Prepare for streaming](#2-prepare-for-streaming)
- [ ] [Create a service account](#3-create-a-service-account)
- [ ] [Set up secrets for Kubernetes deployment (optional)](#4-set-up-secrets-for-kubernetes-deployment-optional)
- [ ] [Configure RDI for Spanner](#5-configure-rdi-for-spanner)
- [ ] [Additional Kubernetes configuration](#6-additional-kubernetes-configuration)
```

## 1. Prepare for snapshot

During the snapshot phase, RDI executes multiple transactions to capture data at an exact point 
in time that remains consistent across all queries. This is achieved using a Spanner feature called 
[Timestamp bounds with exact staleness](https://cloud.google.com/spanner/docs/timestamp-bounds#exact_staleness). 

This feature relies on the 
[version_retention_period](https://cloud.google.com/spanner/docs/reference/rest/v1/projects.instances.databases#Database.FIELDS.version_retention_period), 
which is set to one hour by default. Depending on the database tier, the volume of data to be 
ingested into RDI, and the load on the database, this setting may need to be increased. You can 
update it using [this method](https://cloud.google.com/spanner/docs/use-pitr#set-period).

## 2. Prepare for streaming

To enable streaming, you must create a change stream in Spanner at the database level. Use the 
option `value_capture_type = 'NEW_ROW_AND_OLD_VALUES'` to capture both the previous and updated 
row values.

Be sure to specify only the tables you want to ingest from and, optionally, the specific columns 
you're interested in. Here's an example using Google SQL syntax:

```sql
CREATE CHANGE STREAM change_stream_table1_and_table2
  FOR table1, table2
  OPTIONS (
    value_capture_type = 'NEW_ROW_AND_OLD_VALUES'
  );
```

Refer to the [official documentation](https://cloud.google.com/spanner/docs/change-streams/manage#googlesql) 
for more details, including additional configuration options and dialect-specific syntax.

## 3. Create a service account

To allow RDI to access the Spanner instance, you'll need to create a service account with the
appropriate permissions. By default, RDI uses Google Cloud Workload Identity authentication. In this case RDI will assume the [service account is assigned to the GKE cluster](https://cloud.google.com/kubernetes-engine/docs/how-to/workload-identity#enable_on_clusters_and_node_pools). Alternatively, you can provide the
service account credentials as a Kubernetes secret (see step 4 for details).

```checklist {id="spanner-service-account" nointeractive="true" }
- [ ] [Create the service account](#create-the-service-account)
- [ ] [Grant required roles](#grant-required-roles)
- [ ] [Download the service account key](#download-the-service-account-key)
```

1. <a id="create-the-service-account"></a>Create the service account

    ```bash
    gcloud iam service-accounts create spanner-reader-account \
        --display-name="Spanner Reader Service Account" \
        --description="Service account for reading from Spanner databases" \
        --project=YOUR_PROJECT_ID
    ```

1. <a id="grant-required-roles"></a>Grant required roles

    **Database Reader** (read access to Spanner data):

    ```bash
    gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
        --member="serviceAccount:spanner-reader-account@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
        --role="roles/spanner.databaseReader"
    ```

    **Database User** (query execution and metadata access):

    ```bash
    gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
        --member="serviceAccount:spanner-reader-account@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
        --role="roles/spanner.databaseUser"
    ```

    **Viewer** (viewing instance and database configuration):

    ```bash
    gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
        --member="serviceAccount:spanner-reader-account@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
        --role="roles/spanner.viewer"
    ```

1. <a id="download-the-service-account-key"></a>Download the service account key

    Save the credentials locally so they can be used later by RDI:

    ```bash
    gcloud iam service-accounts keys create ~/spanner-reader-account.json \
        --iam-account=spanner-reader-account@YOUR_PROJECT_ID.iam.gserviceaccount.com \
        --project=YOUR_PROJECT_ID
    ```

### Authentication methods

RDI supports two authentication methods for accessing Spanner:

1. **Workload Identity (default)**: The service account is assigned to the GKE cluster, and RDI
   automatically uses the cluster's identity to authenticate. This is the recommended approach
   as it's more secure and doesn't require managing credential files.

2. **Service account credentials file**: You provide the service account key file as a Kubernetes
   secret. This method requires setting `use_credentials_file: true` in your RDI configuration.

## 4. Set up secrets for Kubernetes deployment (optional)

Before deploying the RDI pipeline, you need to configure the necessary secrets for the target
database. Instructions for setting up the target database secrets are available in the
[RDI deployment guide]({{< relref "/integrate/redis-data-integration/data-pipelines/deploy#set-secrets-for-k8shelm-deployment-using-kubectl-command" >}}).

**Optional**: If you prefer to use a service account credentials file instead of Workload Identity
authentication, you'll need to create a Spanner-specific secret named `source-db-credentials`.
This secret should contain the service account key file generated during the Spanner setup phase.
Use the command below to create it:

```bash
kubectl create secret generic source-db-credentials --namespace=rdi \
--from-file=gcp-service-account.json=~/spanner-reader-account.json \
--save-config --dry-run=client -o yaml | kubectl apply -f -
```

Be sure to adjust the file path (`~/spanner-reader-account.json`) if your service account key is
stored elsewhere.

{{< note >}}
If you create the `source-db-credentials` secret, you must also set `use_credentials_file: true`
in your RDI configuration to use the credentials file instead of Workload Identity authentication.
{{< /note >}}

## 5. Configure RDI for Spanner

When configuring your RDI pipeline for Spanner, use the following example configuration in your 
`config.yaml` file:

```yaml
sources:
  source:
    type: flink
    connection:
      type: spanner
      project_id: your-project-id
      instance_id: your-spanner-instance
      database_id: your-spanner-database
      # use_credentials_file: false  # Default: uses Workload Identity. Set to true to use service account credentials file instead
      change_streams:
        change_stream_all:
          {}
          # retention_hours: 24
    # schemas:
    #  - DEFAULT
    # tables:
    #   products: {}
    #   orders: {}
    #   order_items: {}
    # logging:
    #   level: debug
    # advanced:
    #   source:
    #     spanner.change.stream.retention.hours: 24
    #     spanner.fetch.timeout.milliseconds: 20000
    #     spanner.dialect: POSTGRESQL
    #   flink:
    #     jobmanager.rpc.port: 7123
    #     jobmanager.memory.process.size: 1024m
    #     taskmanager.numberOfTaskSlots: 3
    #     taskmanager.rpc.port: 7122
    #     taskmanager.memory.process.size: 2g
    #     blob.server.port: 7124
    #     rest.port: 8082
    #     parallelism.default: 4
    #     restart-strategy.type: fixed-delay
    #     restart-strategy.fixed-delay.attempts: 3
targets:
  target:
    connection:
      type: redis
      host: ${HOST_IP}
      port: 12000
      user: ${TARGET_DB_USERNAME}
      password: ${TARGET_DB_PASSWORD}
processors:
  target_data_type: hash
```

Make sure to replace the relevant connection details with your own for both the Spanner and target 
Redis databases.

## 6. Additional Kubernetes configuration

In your `rdi-values.yaml` file for Kubernetes deployment, make sure to configure the `dataPlane` 
section like this:

```yaml
operator:
  dataPlane:
    flinkCollector:
      enabled: true
      jobManager:
        ingress:
          enabled: true
          className: traefik # Replace with your ingress controller
          hosts:
            - hostname # Replace with your desired ingress hostname
```

## 7. Configuration is complete

Once you have followed the steps above, your Google Spanner database is ready for RDI to use.
