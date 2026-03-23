---
title: Connect providers in Featureform
description: Register offline providers and Redis online stores for Featureform workflows.
linkTitle: Providers
weight: 30
---

Use providers to connect Featureform to the systems where your data already lives.

In most deployments, you'll register:

- offline providers store or compute source data and transformed data
- online providers serve low-latency feature values to applications

Redis is the online provider in the Featureform workflow.

## Before you begin

Before you register providers, make sure you have:

- network access from Featureform to the systems you want to register
- credentials for each provider
- a clear decision about which system is authoritative for offline feature computation
- a Redis deployment for online serving

Featureform's current provider APIs rely heavily on catalog configuration. For Snowflake and Databricks, make sure you choose the catalog model before you register providers or datasets.

## Offline providers

Featureform supports several offline systems, including:

- Snowflake
- BigQuery
- Databricks or Spark

Register the offline provider that matches your existing analytics or feature engineering environment.

## Online provider

Register Redis as the inference store for low-latency serving:

```python
redis = client.register_redis(
    name="redis-prod",
    host="redis.example.com",
    port=6379,
    password="redis_password",
)
```

If your deployment requires TLS or ACL configuration, use the connection options supported by your current Featureform release and align them with your Redis security standards.

For secured Redis deployments, you can also configure ACL usernames and TLS settings explicitly:

```python
import featureform as ff

redis = client.register_redis(
    name="redis-cloud",
    host="redis.example.com",
    port=6379,
    username="default",
    password="super-secret",
    ssl_mode=True,
    tls=ff.RedisTLSConfig(
        ca_cert=redis_ca_pem,
        server_name="redis.example.com",
    ),
)
```

## Snowflake

Configure the catalog first, then register Snowflake with key-pair authentication. Key-pair authentication is the recommended method, and password authentication is being deprecated.

```python
import featureform as ff
from featureform import SnowflakeCatalog, SnowflakeDynamicTableConfig, RefreshMode, Initialize

catalog = SnowflakeCatalog(
    external_volume="my_external_volume",
    base_location="s3://my-bucket/iceberg/",
    catalog_table_config=SnowflakeDynamicTableConfig(
        refresh_mode=RefreshMode.FULL,
        initialize=Initialize.ON_CREATE,
        target_lag="1 hour",
    ),
)

snowflake = client.register_snowflake(
    name="snowflake-prod",
    account="your_account",
    organization="your_org",
    username="featureform_user",
    key_pair=ff.SnowflakeKeyPairConfig(
        private_key_path="/secrets/snowflake/private_key.pem",
    ),
    database="FEATURE_DB",
    schema="PUBLIC",
    warehouse="COMPUTE_WH",
    catalog=catalog,
)
```

Use Snowflake when your feature engineering workflow already centers on warehouse-native tables, Iceberg-backed tables, or dynamic table pipelines.

If you are migrating from password authentication, update your provider configuration to use `SnowflakeKeyPairConfig(...)`.

## BigQuery

```python
bigquery = client.register_bigquery(
    name="bigquery-prod",
    project_id="your-gcp-project",
    dataset_id="feature_dataset",
    credentials_path="/path/to/service-account.json",
)
```

Use BigQuery when your source data and transformations already run in Google Cloud.

## Databricks or Spark

Use Databricks or Spark when you need DataFrame transformations, Delta tables, or lakehouse-oriented pipelines.

Register a catalog first, then register a filestore and Spark provider. For Databricks with Unity Catalog:

```python
import featureform as ff
from featureform import UnityCatalog, TableFormat

unity = UnityCatalog(
    catalog="my_catalog",
    schema="my_schema",
    table_format=TableFormat.DELTA,
)

aws_creds = ff.AWSStaticCredentials(
    access_key="your_aws_access_key",
    secret_key="your_aws_secret_key",
)

s3 = client.register_s3(
    name="s3-store",
    credentials=aws_creds,
    bucket_name="my-featureform-bucket",
    bucket_region="us-east-1",
)

databricks = ff.DatabricksCredentials(
    host="https://your-workspace.cloud.databricks.com",
    token="your_databricks_token",
    cluster_id="your_cluster_id",
)

spark = client.register_spark(
    name="databricks-prod",
    executor=databricks,
    filestore=s3,
    catalog=unity,
)
```

The Databricks credentials surface also supports OAuth machine-to-machine authentication:

```python
import featureform as ff

databricks = ff.DatabricksCredentials(
    host="https://your-workspace.cloud.databricks.com",
    client_id="my-service-principal-client-id",
    client_secret="my-service-principal-secret",
    cluster_id="1234-567890-abcd123",
)
```

If you want ephemeral Databricks job clusters instead of an always-on cluster, use `cluster_config` instead of `cluster_id`:

```python
import featureform as ff

cluster_config = ff.DatabricksClusterConfig(
    spark_version="14.3.x-scala2.12",
    node_type_id="i3.xlarge",
    num_workers=4,
)

databricks = ff.DatabricksCredentials(
    host="https://your-workspace.cloud.databricks.com",
    token="your_databricks_token",
    cluster_config=cluster_config,
)
```

Use either `cluster_id` or `cluster_config`, not both.

## Catalog options

Featureform supports several catalog models for offline data:

```python
from featureform import UnityCatalog, GlueCatalog, SnowflakeCatalog, TableFormat

unity = UnityCatalog(
    catalog="my_catalog",
    schema="my_schema",
    table_format=TableFormat.DELTA,
)

glue = GlueCatalog(
    region="us-east-1",
    database="my_database",
    warehouse="s3://my-bucket/warehouse/",
    assume_role_arn="arn:aws:iam::123456789:role/GlueRole",
    table_format=TableFormat.ICEBERG,
)
```

Choose the catalog that matches the table format and governance model in your environment.

## Retrieve previously registered providers

Once providers are registered, you can retrieve them by name:

```python
snowflake = client.get_snowflake("snowflake-prod")
spark = client.get_spark("databricks-prod")
redis = client.get_redis("redis-prod")
```

## Choose providers

- Choose the offline provider that is already authoritative for your feature data.
- Configure the catalog model before you register Snowflake or Databricks providers.
- Choose Redis when you need low-latency online serving.
- Keep credentials and network access aligned with your platform security standards.
- Minimize the number of providers in early projects so registration and troubleshooting stay simple.

## What to read next

- [Define datasets and transformations]({{< relref "/develop/ai/featureform/datasets-and-transformations" >}})
- [Define features and labels]({{< relref "/develop/ai/featureform/features-and-labels" >}})
