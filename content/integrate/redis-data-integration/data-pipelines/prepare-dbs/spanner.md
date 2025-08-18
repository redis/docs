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
database. In the streaming phase, RDI uses Spanner's Change Streams to capture changes related to 
the monitored schemas and tables.

You must have the necessary privileges to manage the database schema and create service accounts 
with the appropriate permissions, so that RDI can access the Spanner database.

## Prepare for snapshot

During the snapshot phase, RDI executes multiple transactions to capture data at an exact point 
in time that remains consistent across all queries. This is achieved using a Spanner feature called 
[Timestamp bounds with Exact staleness](https://cloud.google.com/spanner/docs/timestamp-bounds#exact_staleness). 

This feature relies on the 
[version_retention_period](https://cloud.google.com/spanner/docs/reference/rest/v1/projects.instances.databases#Database.FIELDS.version_retention_period), 
which is set to 1 hour by default. Depending on the database tier, the volume of data to be 
ingested into RDI, and the load on the database, this setting may need to be increased. You can 
update it using [this method](https://cloud.google.com/spanner/docs/use-pitr#set-period).

## Prepare for streaming

To enable streaming, you must create a change stream in Spanner at the database level. Use the 
option `value_capture_type = 'NEW_ROW_AND_OLD_VALUES'` to capture both the previous and updated 
row values.

Be sure to specify only the tables you want to ingest from—and optionally, the specific columns 
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

## Create a service account

To allow RDI to access the Spanner instance, you'll need to create a service account with the 
appropriate permissions. This service account will then be provided to RDI as a secret for 
authentication.

### Step 1: Create the service account

```bash
gcloud iam service-accounts create spanner-reader-account \
    --display-name="Spanner Reader Service Account" \
    --description="Service account for reading from Spanner databases" \
    --project=YOUR_PROJECT_ID
```

### Step 2: Grant required roles

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

### Step 3: Download the service account key

Save the credentials locally so they can be used later by RDI:

```bash
gcloud iam service-accounts keys create ~/spanner-reader-account.json \
    --iam-account=spanner-reader-account@YOUR_PROJECT_ID.iam.gserviceaccount.com \
    --project=YOUR_PROJECT_ID
```

## Set up secrets for Kubernetes deployment

Before deploying the RDI pipeline, you need to configure the necessary secrets for both the source 
and target databases. Instructions for setting up the target database secrets are available in the 
[RDI deployment guide](/integrate/redis-data-integration/data-pipelines/deploy#set-secrets-for-k8shelm-deployment-using-kubectl-command).

In addition to the target database secrets, you'll also need to create a Spanner-specific secret 
named `source-db-credentials`. This secret should contain the service account key file generated 
during the Spanner setup phase. Use the command below to create it:

```bash
kubectl create secret generic source-db-credentials --namespace=rdi \
--from-file=gcp-service-account.json=~/spanner-reader-account.json \
--save-config --dry-run=client -o yaml | kubectl apply -f -
```

Be sure to adjust the file path (`~/spanner-reader-account.json`) if your service account key is 
stored elsewhere.

## Configure RDI for Spanner

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

## Additional Kubernetes configuration

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
            - hostname # Replace with your Spanner DB hostname
```

## Next steps

After completing the Spanner preparation steps, you can proceed with:

1. [Installing RDI on Kubernetes](/integrate/redis-data-integration/installation/install-k8s)
2. [Deploying your RDI pipeline](/integrate/redis-data-integration/data-pipelines/deploy")
3. [Using Redis Insight to manage your RDI pipeline](/develop/tools/insight/rdi-connector)
