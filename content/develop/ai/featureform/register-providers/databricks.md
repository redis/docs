---
title: Register Databricks providers
description: Register Databricks compute, Unity Catalog, and secret providers with Redis Feature Form.
linkTitle: Databricks
weight: 10
---

Use Databricks with Redis Feature Form by registering each required provider record separately. A typical Spark workflow needs at least one `unity-catalog` provider and one `databricks` compute provider. Register an additional provider for each physical catalog, secret backend, or online store the workflow uses.

## Understand the Databricks providers

| Provider type | Purpose | Required for Databricks compute |
| --- | --- | --- |
| `unity-catalog` | Identifies a catalog and provides credentials for catalog health, Feature Form dataframe reads, and optional Volume artifact storage | Yes |
| `databricks` | Selects Databricks compute, the managed-output catalog, table format defaults, and artifact storage | Yes |
| `databricks-secret` | Resolves existing Databricks secret scope and key values | No |

The `databricks` provider fills the `offline-store` and `compute` roles. It doesn't provide online serving. A feature view also needs a supported `online-store` provider such as Redis.

## Before you begin

Make sure you have:

- A Feature Form [workspace](/content/develop/ai/featureform/manage-workspace.md).
- An HTTPS [Databricks workspace URL](https://docs.databricks.com/aws/en/workspace/workspace-details).
- A personal access token (PAT), or an OAuth machine-to-machine (M2M) client ID and client secret.
- A non-Databricks [secret provider](/content/develop/ai/featureform/register-providers/_index.md#configure-secret-providers) that can resolve the PAT or OAuth client secret.
- Every Unity Catalog catalog the workflow needs, plus a schema and Volume for execution artifacts. One catalog can serve multiple purposes.
- Either an existing cluster or the configuration required to create Jobs compute.

The `databricks` provider's principal needs permission to inspect or create its selected compute, submit Databricks Jobs work, and delete Feature Form-managed tables. Databricks runs also need Unity Catalog privileges on every catalog they read or write. See [Grant Unity Catalog privileges](#grant-unity-catalog-privileges).

> [!NOTE]
> Don't use a `databricks@<provider>:<scope>#<key>` reference to authenticate a `databricks` or `unity-catalog` provider. Feature Form rejects that bootstrap cycle. Use `env`, Vault, Kubernetes secrets, or AWS Secrets Manager for these credentials.

## Register providers in dependency order

For a new Feature Form workspace, register providers in this order:

1. Register a non-Databricks secret provider for the Databricks personal access token (PAT) or OAuth machine-to-machine (M2M) client secret.
2. Register one `unity-catalog` provider for each physical output or artifact catalog. Register a provider for each input catalog before you apply datasets that use it.
3. Register the `databricks` compute provider.
4. Register `databricks-secret` if another provider needs a value from a Databricks secret scope.
5. Register the Redis `online-store` provider used by feature views.

The Python `DatabricksWorkspaceConfig` object in the examples is a reusable configuration object. It isn't a separate provider record.

## Plan permissions and network access

Provider registration and workload execution use different identities and network paths:

| Component or identity | Required access |
| --- | --- |
| Feature Form server | The bootstrap secret backend, Databricks workspace APIs, configured catalogs and clusters, and Redis for provider health checks and inference-time feature reads |
| Unity Catalog provider principal | Catalog lookup and Feature Form dataframe reads; read and write access to a configured artifact Volume when used |
| Databricks provider principal | Inspect existing compute or submit Jobs compute; delete Feature Form-managed output tables |
| Databricks run principal | Read input catalogs, write the output catalog, read and write execution artifacts, read the Redis password secret, and connect to Redis during feature-view materialization |

Allow each connection independently. A successful connection from the Feature Form server doesn't prove that Databricks compute can reach the same endpoint. See the [Unity Catalog privilege reference](https://docs.databricks.com/aws/en/data-governance/unity-catalog/access-control/privileges-reference) for catalog permissions and the [Databricks authentication documentation](https://docs.databricks.com/aws/en/dev-tools/auth) for workspace authentication.

The Python examples use a workspace-scoped provider client and this shared Databricks workspace configuration. Each tab also shows the equivalent command-line interface (CLI) command.

```python
import featureform as ff
from featureform.types import (
    DatabricksPATAuth,
    DatabricksWorkspaceConfig,
    EnvSecretRef,
)

client = ff.Client.from_env()
providers = client.providers("<workspace-id>")
databricks_workspace = DatabricksWorkspaceConfig(
    workspace_url="https://<databricks-workspace-host>",
    auth=DatabricksPATAuth(
        token=EnvSecretRef(name="DATABRICKS_TOKEN"),
    ),
)
```

## Understand which identity accesses data

Databricks runs use one identity for every catalog they read or write: the Databricks run principal. By default, the run principal is the `databricks` provider's principal, which is the PAT owner or the OAuth M2M service principal. When `job_cluster.data_security_mode` is `SINGLE_USER`, Unity Catalog authorizes the run as the user named in `single_user_name` instead.

Feature Form passes only catalog names to Databricks runs, not `unity-catalog` provider credentials. Unity Catalog checks every catalog a run uses against the run principal's grants. If a run reads tables from three catalogs, the run principal needs access to all three, even when each catalog's provider uses a different principal.

Feature Form uses a `unity-catalog` provider's credentials only for work the Feature Form server does itself:

- Registration health checks
- Feature Form dataframe reads
- Uploading and deleting files in a configured artifact Volume

## Grant Unity Catalog privileges

Grant these [Unity Catalog privileges](https://docs.databricks.com/aws/en/data-governance/unity-catalog/access-control/privileges-reference) before the first apply:

| Principal | Object | Privileges |
| --- | --- | --- |
| Databricks run principal | Each input catalog, schema, and table | `USE CATALOG`, `USE SCHEMA`, and `SELECT` |
| Databricks run principal | Output catalog | `USE CATALOG` and `CREATE SCHEMA` |
| Databricks run principal | Artifact Volume, its schema, and its catalog | `USE CATALOG`, `USE SCHEMA`, and `READ VOLUME`; add `WRITE VOLUME` when you run incremental transformations |
| Databricks run principal | Databricks secret scope that holds the Redis password | `READ` permission on the secret scope |
| Artifact-store `unity-catalog` provider principal | Artifact Volume, its schema, and its catalog | `USE CATALOG`, `USE SCHEMA`, `READ VOLUME`, and `WRITE VOLUME` |
| Every `unity-catalog` provider principal | Its catalog | `USE CATALOG` for the registration health check |

Feature Form creates the schemas and tables it writes in the output catalog, so the run principal owns them. Don't transfer ownership of Feature Form-managed tables. If the run principal isn't the `databricks` provider's principal, also grant the provider's principal `MANAGE` on Feature Form-managed tables so it can delete them.

Feature Form doesn't create the artifact schema or Volume, so no `CREATE VOLUME` privilege is needed. If one principal backs both the `databricks` provider and the artifact-store provider, grant the Volume privileges once. Registration doesn't check these grants. A missing grant first appears as a failed apply.

## Register Unity Catalog

Register the catalog before the compute provider that refers to it:

{{< multitabs id="featureform-register-unity-catalog-provider"
    tab1="Python"
    tab2="ff CLI" >}}

```python
from featureform.types import ProviderType, UnityCatalogConfig

providers.register(
    name="<catalog-provider-name>",
    provider_type=ProviderType.UNITY_CATALOG,
    config=UnityCatalogConfig(
        workspace=databricks_workspace,
        catalog_name="<catalog-name>",
    ),
)
```

-tab-sep-

```bash
ff provider register <catalog-provider-name> \
  --workspace <workspace-id> \
  --type unity-catalog \
  --databricks-workspace-url https://<databricks-workspace-host> \
  --databricks-auth-type pat \
  --databricks-token-secret env:DATABRICKS_TOKEN \
  --unity-catalog-name <catalog-name>
```

{{< /multitabs >}}

For OAuth M2M authentication with a Kubernetes-backed client secret, first register the Kubernetes secret provider as described in [Configure secret providers](/content/develop/ai/featureform/register-providers/_index.md#register-kubernetes-secrets). Then replace the shared Python workspace configuration or the PAT flags with:

{{< multitabs id="featureform-configure-databricks-oauth"
    tab1="Python"
    tab2="ff CLI" >}}

```python
from featureform.types import DatabricksOAuthM2MAuth, K8sSecretRef

databricks_workspace = DatabricksWorkspaceConfig(
    workspace_url="https://<databricks-workspace-host>",
    auth=DatabricksOAuthM2MAuth(
        client_id="<client-id>",
        client_secret=K8sSecretRef(
            provider_name="<k8s-secret-provider-name>",
            name="<secret-name>",
            key="<client-secret-key>",
        ),
    ),
)
```

-tab-sep-

```text
--databricks-auth-type oauth_m2m
--databricks-oauth-client-id <client-id>
--databricks-oauth-client-secret k8s@<k8s-secret-provider-name>:<secret-name>#<client-secret-key>
```

{{< /multitabs >}}

One `unity-catalog` provider represents one physical Databricks catalog. You can reference the same provider for input tables, managed outputs, and execution artifacts when they use that catalog. Register a separate provider for each physical catalog:

| Catalog use | Where to reference the provider name |
| --- | --- |
| Existing input tables | The dataset location's `catalog_provider` field |
| Feature Form-managed outputs | `DatabricksConfig.output_catalog` or `--databricks-output-catalog` |
| Unity Catalog Volume artifacts | `artifact_store.provider` or `--databricks-artifact-store-provider` |

All catalog and compute providers used by one workload must be in the same Feature Form workspace and identify the same Databricks workspace host. They can use different Databricks credentials, but Databricks runs don't use those credentials; see [Understand which identity accesses data](#understand-which-identity-accesses-data). Register the output and artifact catalog providers before the compute provider. An input catalog provider must exist before you apply a dataset that refers to it. The compute examples on this page use the same `<catalog-provider-name>` for managed outputs and artifact storage.

### Refer to catalogs from datasets

A dataset location names a catalog provider, not a catalog. Feature Form reads the table from the catalog in that provider's `catalog_name`. To read tables from another catalog, register a `unity-catalog` provider for it and set that provider as the dataset location's `catalog_provider`. One provider serves every table in its catalog, so register it once and reuse it.

`output_catalog` controls only where Feature Form writes managed outputs: transformations, feature views, and training sets. Later resources that use those outputs read them from the output catalog. `output_catalog` doesn't change where datasets are read from.

## Choose compute

Feature Form exposes two Databricks compute targets:

| Target | Use it when | Required configuration |
| --- | --- | --- |
| `existing_cluster` | You manage a long-running cluster outside Feature Form | An accessible cluster ID |
| `job_cluster` | Each managed job should use Jobs compute | A runtime version, worker node type or instance pool, and fixed workers or autoscaling |

An existing-cluster health check authenticates and verifies that Feature Form can inspect the cluster. A Jobs compute health check authenticates and validates the configuration, but it doesn't create a cluster or submit a representative job.

## Register an existing cluster

{{< multitabs id="featureform-register-databricks-existing-cluster"
    tab1="Python"
    tab2="ff CLI" >}}

```python
from featureform.types import (
    DatabricksConfig,
    DatabricksUnityCatalogArtifactStoreConfig,
    ManagedTableFormat,
    ProviderType,
)

providers.register(
    name="<databricks-provider-name>",
    provider_type=ProviderType.DATABRICKS,
    config=DatabricksConfig(
        workspace=databricks_workspace,
        compute_target="existing_cluster",
        cluster_id="<cluster-id>",
        output_catalog="<catalog-provider-name>",
        artifact_store=DatabricksUnityCatalogArtifactStoreConfig(
            provider="<catalog-provider-name>",
            schema="<schema-name>",
            volume="<volume-name>",
        ),
        default_managed_table_format=ManagedTableFormat.DELTA_UNIFORM,
    ),
)
```

-tab-sep-

```bash
ff provider register <databricks-provider-name> \
  --workspace <workspace-id> \
  --type databricks \
  --databricks-workspace-url https://<databricks-workspace-host> \
  --databricks-auth-type pat \
  --databricks-token-secret env:DATABRICKS_TOKEN \
  --databricks-compute-target existing_cluster \
  --databricks-cluster-id <cluster-id> \
  --databricks-output-catalog <catalog-provider-name> \
  --databricks-artifact-store-type unity_catalog \
  --databricks-artifact-store-provider <catalog-provider-name> \
  --databricks-artifact-store-schema <schema-name> \
  --databricks-artifact-store-volume <volume-name> \
  --default-managed-table-format delta_uniform
```

{{< /multitabs >}}

If you author Python callable transformations, import `SparkCallableRuntime` from `featureform.types` and set `callable_runtime=SparkCallableRuntime(python_version="<python-version>", cloudpickle_version="<cloudpickle-version>")` on the Python `DatabricksConfig`. With the CLI, add:

```text
--databricks-callable-python-version <python-version>
--databricks-callable-cloudpickle-version <cloudpickle-version>
```

The versions must match the environment that serializes and executes the callable.

### Install the Feature Form Spark runtime

Runs on an existing cluster need the Feature Form Spark runtime, the `featureform-spark` Python wheel, installed on that cluster. Feature Form doesn't install it on an existing cluster. Install a wheel whose version matches your Feature Form server version exactly. Feature Form doesn't check the installed version, so a mismatch can cause run failures or incorrect results.

The wheel ships in the Feature Form server image. To copy it from the image version you deploy:

1. List the wheel file name:

    ```bash
    docker run --rm --entrypoint ls \
      redisfeatureform/featureform-server:<server-version> /opt/featureform
    ```

2. Copy the wheel whose file name starts with `featureform_spark-` followed by a version number. Don't use `featureform_spark-current.whl`, which is a link to that file and isn't a valid wheel file name:

    ```bash
    docker create --name featureform-runtime redisfeatureform/featureform-server:<server-version>
    docker cp featureform-runtime:/opt/featureform/<wheel-file-name> .
    docker rm featureform-runtime
    ```

3. Install the wheel as a [cluster library](https://docs.databricks.com/aws/en/libraries/cluster-libraries) from a location you control, such as your artifact repository or a Unity Catalog Volume.

Repeat these steps for every existing cluster Feature Form uses each time you upgrade the Feature Form server. With Jobs compute, Feature Form attaches the matching runtime to each run, so don't install another copy with an init script.

## Register Jobs compute

This example uses a fixed worker count:

{{< multitabs id="featureform-register-databricks-job-cluster"
    tab1="Python"
    tab2="ff CLI" >}}

```python
from featureform.types import (
    DatabricksConfig,
    DatabricksJobClusterConfig,
    DatabricksUnityCatalogArtifactStoreConfig,
    ManagedTableFormat,
    ProviderType,
)

providers.register(
    name="<databricks-provider-name>",
    provider_type=ProviderType.DATABRICKS,
    config=DatabricksConfig(
        workspace=databricks_workspace,
        compute_target="job_cluster",
        job_cluster=DatabricksJobClusterConfig(
            spark_version="<databricks-runtime-version>",
            node_type_id="<worker-node-type-id>",
            num_workers=int("<worker-count>"),
        ),
        output_catalog="<catalog-provider-name>",
        artifact_store=DatabricksUnityCatalogArtifactStoreConfig(
            provider="<catalog-provider-name>",
            schema="<schema-name>",
            volume="<volume-name>",
        ),
        default_managed_table_format=ManagedTableFormat.DELTA_UNIFORM,
    ),
)
```

-tab-sep-

```bash
ff provider register <databricks-provider-name> \
  --workspace <workspace-id> \
  --type databricks \
  --databricks-workspace-url https://<databricks-workspace-host> \
  --databricks-auth-type pat \
  --databricks-token-secret env:DATABRICKS_TOKEN \
  --databricks-compute-target job_cluster \
  --databricks-job-spark-version <databricks-runtime-version> \
  --databricks-job-node-type-id <worker-node-type-id> \
  --databricks-job-num-workers <worker-count> \
  --databricks-output-catalog <catalog-provider-name> \
  --databricks-artifact-store-type unity_catalog \
  --databricks-artifact-store-provider <catalog-provider-name> \
  --databricks-artifact-store-schema <schema-name> \
  --databricks-artifact-store-volume <volume-name> \
  --default-managed-table-format delta_uniform
```

{{< /multitabs >}}

### Apply a compute policy and tags

Use a compute policy to enforce workspace requirements. Set `apply_policy_default_values` when the Databricks Jobs application programming interface (API) should apply defaults defined by the policy. Registration validates these fields but doesn't create a cluster or prove that the principal can use the policy.

{{< multitabs id="featureform-configure-databricks-job-policy"
    tab1="Python"
    tab2="ff CLI" >}}

```python
job_cluster = DatabricksJobClusterConfig(
    spark_version="<databricks-runtime-version>",
    node_type_id="<worker-node-type-id>",
    num_workers=int("<worker-count>"),
    policy_id="<cluster-policy-id>",
    apply_policy_default_values=True,
    custom_tags={
        "team": "<team-name>",
        "purpose": "featureform",
    },
)
```

-tab-sep-

```text
--databricks-job-policy-id <cluster-policy-id>
--databricks-job-apply-policy-default-values
--databricks-job-custom-tag team=<team-name>
--databricks-job-custom-tag purpose=featureform
```

{{< /multitabs >}}

Databricks allows at most 45 custom cluster tags, and Feature Form enforces that platform limit during registration. Repeat `--databricks-job-custom-tag` for each `key=value` pair. See the [Databricks Jobs API reference](https://docs.databricks.com/api/jobs/v2) for cluster-tag constraints and the [Databricks compute policy reference](https://docs.databricks.com/aws/en/admin/clusters/policy-definition) for policy rules and default-value behavior.

In Python, set `instance_pool_id="<instance-pool-id>"` instead of `node_type_id` when the workspace uses an instance pool. With the CLI, use `--databricks-job-instance-pool-id <instance-pool-id>` instead of a worker node type.

To autoscale in Python, import `DatabricksAutoscaleConfig` from `featureform.types`, omit `num_workers`, and set `autoscale=DatabricksAutoscaleConfig(min_workers=int("<minimum-workers>"), max_workers=int("<maximum-workers>"))`. With the CLI, omit `--databricks-job-num-workers` and set both of these flags:

```text
--databricks-job-autoscale-min-workers <minimum-workers>
--databricks-job-autoscale-max-workers <maximum-workers>
```

Fixed workers and autoscaling are mutually exclusive. Common optional settings include a driver node type or pool, cluster policy, data security mode, runtime engine, custom tags, log delivery, init scripts, and disk settings. Run `ff provider register --help` for the current flags.

### Configure AWS attributes

Use Amazon Web Services (AWS) attributes only for Jobs compute in a Databricks workspace on AWS. In Python, create the following configuration and set `aws_attributes=aws_attributes` on `DatabricksJobClusterConfig`. With the CLI, append the equivalent flags to the registration command:

{{< multitabs id="featureform-configure-databricks-job-cluster-aws"
    tab1="Python"
    tab2="ff CLI" >}}

```python
from featureform.types import DatabricksAWSAttributesConfig

aws_attributes = DatabricksAWSAttributesConfig(
    availability="SPOT_WITH_FALLBACK",
    first_on_demand=1,
    spot_bid_price_percent=100,
    instance_profile_arn="<instance-profile-arn>",
)
```

-tab-sep-

```text
--databricks-job-aws-availability SPOT_WITH_FALLBACK
--databricks-job-aws-first-on-demand 1
--databricks-job-aws-spot-bid-price-percent 100
--databricks-job-aws-instance-profile-arn <instance-profile-arn>
```

{{< /multitabs >}}

This example keeps the driver on an on-demand instance, uses Spot instances with on-demand fallback for subsequent nodes, limits the Spot bid to the corresponding on-demand price, and attaches a preconfigured instance profile. The instance profile must already be added to the Databricks workspace.

| Python field | CLI flag | Meaning or constraint |
| --- | --- | --- |
| `availability` | `--databricks-job-aws-availability` | Databricks availability mode |
| `zone_id` | `--databricks-job-aws-zone-id` | AWS availability zone or Databricks automatic-zone value |
| `first_on_demand` | `--databricks-job-aws-first-on-demand` | Nonnegative number of initial on-demand nodes |
| `spot_bid_price_percent` | `--databricks-job-aws-spot-bid-price-percent` | Nonnegative percentage of the corresponding on-demand price |
| `ebs_volume_type` | `--databricks-job-aws-ebs-volume-type` | Databricks-supported Amazon Elastic Block Store (EBS) volume type |
| `ebs_volume_count` | `--databricks-job-aws-ebs-volume-count` | Nonnegative number of EBS volumes per instance |
| `ebs_volume_size` | `--databricks-job-aws-ebs-volume-size` | Nonnegative EBS volume size in gigabytes |
| `ebs_volume_iops` | `--databricks-job-aws-ebs-volume-iops` | Nonnegative provisioned input/output operations per second for supported volume types |
| `ebs_volume_throughput` | `--databricks-job-aws-ebs-volume-throughput` | Nonnegative throughput for supported volume types |
| `instance_profile_arn` | `--databricks-job-aws-instance-profile-arn` | Preconfigured AWS instance-profile Amazon Resource Name (ARN) |

See the [Databricks Jobs API reference](https://docs.databricks.com/aws/en/reference/jobs-2.0-api) for the allowed values, units, interactions, and cloud-specific constraints.

For a Python callable transformation on Jobs compute, import `SparkCallableRuntime` from `featureform.types` and set `callable_runtime=SparkCallableRuntime(python_version="<python-version>")`. With the CLI, set `--databricks-callable-python-version`. Don't set the provider-level cloudpickle version for `job_cluster`.

## Use different cluster settings for different workloads

Cluster settings belong to the `databricks` provider. `ff apply` has no compute options. Databricks providers don't support per-resource Spark job settings such as `transform_job_config`, `compute_job_config`, or `materialize_job_config`. To use different cluster settings for different workloads, register a provider for each compute profile or update a provider in place.

### Register a provider for each compute profile

Register several `databricks` providers that use the same Databricks workspace and the same `output_catalog` provider, each with its own Jobs compute settings. Then choose a provider for each resource in your definitions file:

```python
import featureform as ff
from featureform.types import MaterializationEngine

@ff.spark_sql_transformation(
    provider="<large-databricks-provider-name>",
    name="<transformation-name>",
    inputs=["<dataset-name>"],
)
def large_transformation():
    return "SELECT * FROM {{ <dataset-name> }}"

feature_view = ff.FeatureView(
    name="<feature-view-name>",
    entity="<entity-name>",
    features=["<feature-name>"],
    provider="<small-databricks-provider-name>",
    inference_store="<redis-provider-name>",
    materialization_engine=MaterializationEngine.SPARK,
    spark_provider="<small-databricks-provider-name>",
)
```

Set `provider` on a training set to choose its Databricks provider.

### Update a provider in place

Use `ff provider update` to change `compute_target`, `cluster_id`, or Jobs compute settings on an existing provider. The `output_catalog` and `artifact_store` settings can't change. Run `ff provider update --help` for the current flags.

An update applies to every later run on that provider, for every resource. An apply that's waiting in the queue when you update one of its providers fails with a `provider changed since the apply was submitted` error. Resubmit it after the update.

### Set Spark properties

Jobs compute settings don't include Spark configuration properties. Set them in a [compute policy](#apply-a-compute-policy-and-tags), in an init script, or on an existing cluster that you manage in Databricks.

## Understand how applies run on Databricks

Feature Form submits each step of an apply as a separate one-time Databricks run. It doesn't combine steps into one multi-task Databricks job.

You can't set the order of independent resources directly. To run one group of resources before another, apply each group separately with `ff apply --merge --wait --wait-for finished`.

With `job_cluster`, each run starts its own Jobs compute. To reduce startup time, use an instance pool, or use `existing_cluster` so runs share a running cluster.

## Choose artifact storage

Feature Form publishes temporary execution artifacts for Databricks jobs. Explicitly configure a Unity Catalog Volume for every new Databricks compute provider. If you omit `artifact_store`, Feature Form uses the legacy Workspace Files and DBFS policy for compatibility; this policy isn't recommended for new registrations.

To use a [Unity Catalog Volume](https://docs.databricks.com/aws/en/volumes/), create the schema and Volume first. Feature Form creates only directories inside the Volume. The artifact-store provider's principal uploads and deletes files, and the Databricks run principal reads them. Incremental transformations also write files, so the run principal needs `WRITE VOLUME` for them. See [Grant Unity Catalog privileges](#grant-unity-catalog-privileges) for the exact grants.

In Python, import `DatabricksUnityCatalogArtifactStoreConfig` from `featureform.types` and set `artifact_store=DatabricksUnityCatalogArtifactStoreConfig(provider="<catalog-provider-name>", schema="<schema-name>", volume="<volume-name>")` on `DatabricksConfig`. With the CLI, add these flags to the compute registration command:

```text
--databricks-artifact-store-type unity_catalog
--databricks-artifact-store-provider <catalog-provider-name>
--databricks-artifact-store-schema <schema-name>
--databricks-artifact-store-volume <volume-name>
```

The artifact catalog can use the same `unity-catalog` provider as the output catalog, as shown in the compute examples, or another provider. It must target the same Databricks workspace host. The output catalog and artifact-store policy are immutable; changing either requires a new Databricks compute provider.

### Share or separate artifact Volumes

Unity Catalog Volume privileges apply to the whole Volume. Any principal with `READ VOLUME` on a shared Volume can read execution artifacts from every Feature Form workspace that uses it. Any principal with `WRITE VOLUME` can delete them. When tenants must be isolated, give each Feature Form workspace its own Volume, and grant only that workspace's principals access to it.

### Migrate from legacy artifact storage

You can't change the artifact store of an existing provider. To move from the legacy Workspace Files and DBFS policy to a Unity Catalog Volume:

1. Create the schema and Volume, and grant the privileges in [Grant Unity Catalog privileges](#grant-unity-catalog-privileges).
2. Register a new `databricks` provider with the Unity Catalog artifact-store settings. It can use the same `output_catalog` provider as the old one.
3. In your definitions file, change resources to use the new provider: `provider` on transformations and training sets, and `provider` and `spark_provider` on feature views.
4. Run `ff apply --plan` and review the planned tasks.
5. Run `ff apply`.

Feature Form doesn't copy files from the legacy storage to the Volume.

## Choose a managed table format

The provider default applies when a managed transformation, feature view, or training set doesn't select a format.

| Value | Use with Feature Form dataframe reads | Important boundary |
| --- | --- | --- |
| `delta_uniform` | Yes | Default; exposes Iceberg-compatible metadata |
| `iceberg` | Yes | Not supported for incremental Databricks transformations |
| `delta` | No | Remains usable by Databricks compute, but not by the current dataframe path |

Changing the provider default affects new managed output versions. It doesn't rewrite existing outputs.

## Use Databricks secrets

Feature Form doesn't infer access to Databricks secret scopes from a `databricks` compute or `unity-catalog` provider. To use any value stored in a Databricks secret scope, register a separate `databricks-secret` provider. Every reference names that provider, the scope, and the key: `databricks@<databricks-secret-provider-name>:<scope>#<key>`.

A `databricks-secret` provider must authenticate before it can call the Databricks Secrets API. Feature Form therefore has to resolve the provider's PAT or OAuth client secret before it can retrieve any Databricks secret. The provider can't use a secret behind itself as that bootstrap credential.

Use this bootstrap order:

1. Register a non-Databricks secret provider, such as `env`, Vault, Kubernetes secrets, or AWS Secrets Manager.
2. Register `databricks-secret` with a PAT or OAuth client-secret reference from that provider.
3. Use the registered `databricks-secret` provider in references to existing Databricks scopes and keys.

The following PAT example uses the built-in `env` provider for the bootstrap credential:

{{< multitabs id="featureform-register-databricks-secret-provider"
    tab1="Python"
    tab2="ff CLI" >}}

```python
from featureform.types import (
    DatabricksSecretConfig,
    DatabricksSecretPATAuth,
    SecretProviderType,
)

secret_providers = client.secret_providers("<workspace-id>")
secret_providers.register(
    name="<databricks-secret-provider-name>",
    provider_type=SecretProviderType.DATABRICKS,
    config=DatabricksSecretConfig(
        workspace_url="https://<databricks-workspace-host>",
        auth=DatabricksSecretPATAuth(
            token_secret=EnvSecretRef(name="DATABRICKS_TOKEN"),
        ),
    ),
)
```

-tab-sep-

```bash
ff secret-provider register <databricks-secret-provider-name> \
  --workspace <workspace-id> \
  --type databricks-secret \
  --workspace-url https://<databricks-workspace-host> \
  --auth-type pat \
  --token-secret env:DATABRICKS_TOKEN
```

{{< /multitabs >}}

For OAuth M2M authentication, use the same non-Databricks bootstrap secret provider used by the catalog and compute providers:

{{< multitabs id="featureform-register-databricks-secret-provider-oauth"
    tab1="Python"
    tab2="ff CLI" >}}

```python
from featureform.types import (
    DatabricksSecretConfig,
    DatabricksSecretOAuthM2MAuth,
    K8sSecretRef,
    SecretProviderType,
)

secret_providers.register(
    name="<databricks-secret-provider-name>",
    provider_type=SecretProviderType.DATABRICKS,
    config=DatabricksSecretConfig(
        workspace_url="https://<databricks-workspace-host>",
        auth=DatabricksSecretOAuthM2MAuth(
            client_id="<client-id>",
            client_secret_secret=K8sSecretRef(
                provider_name="<k8s-secret-provider-name>",
                name="<secret-name>",
                key="<client-secret-key>",
            ),
        ),
    ),
)
```

-tab-sep-

```bash
ff secret-provider register <databricks-secret-provider-name> \
  --workspace <workspace-id> \
  --type databricks-secret \
  --workspace-url https://<databricks-workspace-host> \
  --auth-type oauth_m2m \
  --client-id <client-id> \
  --client-secret-secret k8s@<k8s-secret-provider-name>:<secret-name>#<client-secret-key>
```

{{< /multitabs >}}

This secret-provider type doesn't have a live health probe, so registration success doesn't prove that the scope and key can be read. Test a representative reference before relying on the provider.

## Connect Databricks compute to Redis

A feature view needs a Redis `online-store` provider for materialization and inference-time reads. Register Redis as described in [Register Redis providers](/content/develop/ai/featureform/register-providers/redis.md).

If the Redis password is stored in a Databricks secret scope, configure the provider with the registered `databricks-secret` provider:

{{< multitabs id="featureform-configure-databricks-redis-secret"
    tab1="Python"
    tab2="ff CLI" >}}

```python
from featureform.types import DatabricksSecretRef, ProviderType, RedisConfig

providers.register(
    name="<redis-provider-name>",
    provider_type=ProviderType.REDIS,
    config=RedisConfig(
        host="<redis-host>",
        port=int("<redis-port>"),
        username="<redis-username>",
        password_secret=DatabricksSecretRef(
            provider_name="<databricks-secret-provider-name>",
            scope="<secret-scope>",
            key="<redis-password-key>",
        ),
    ),
)
```

-tab-sep-

```bash
ff provider register <redis-provider-name> \
  --workspace <workspace-id> \
  --type redis \
  --redis-host <redis-host> \
  --redis-port <redis-port> \
  --redis-username <redis-username> \
  --redis-password-secret databricks@<databricks-secret-provider-name>:<secret-scope>#<redis-password-key>
```

{{< /multitabs >}}

For both `job_cluster` and `existing_cluster` Spark feature-view materialization, the Redis password must use a `databricks@<provider>:<scope>#<key>` reference. With `job_cluster`, Feature Form adds the reference to the job environment so Databricks can resolve it. With `existing_cluster`, the cluster resolves the scope and key directly.

The password never appears in a run definition or in an execution artifact. With `job_cluster`, the run definition shows only a `{{secrets/<scope>/<key>}}` template, which Databricks resolves when the cluster starts. With `existing_cluster`, the run reads the secret while it runs. In both cases, the Databricks run principal needs `READ` permission on the secret scope. The Redis username isn't a secret and appears in execution artifacts.

Keep Transport Layer Security (TLS) enabled when the Redis deployment requires it. For Spark materialization, Redis certificate paths must also be available to the Databricks runtime; secret-backed Redis TLS certificate fields aren't projected to Spark. Verify Redis connectivity separately from the Feature Form server and the Databricks compute environment.

## Control who can use Databricks providers

Providers and their credentials belong to one Feature Form [workspace](/content/develop/ai/featureform/concepts.md#workspaces), and resources can use only providers in their own workspace. Within a workspace, there's no permission for an individual provider. Any user with the `operator` role or higher can register or update data and compute providers in that workspace and apply resources that use it. Registering or updating a secret provider, such as `databricks-secret`, requires `workspace_admin` or higher. Databricks runs always use the provider's credential, not the identity of the user who runs `ff apply`.

To isolate tenants that share a Databricks workspace:

1. Create a Feature Form workspace for each tenant.
2. Register each tenant's `databricks` provider with a service principal used only by that tenant.
3. Grant that principal Unity Catalog privileges on the tenant's catalogs only, and give the tenant its own [artifact Volume](#share-or-separate-artifact-volumes).
4. Bind each tenant's users and groups to that tenant's workspace only.

For role-based access control (RBAC) roles and bindings, see [Configure authentication and RBAC](/content/operate/featureform/configure-auth.md).

## Databricks configuration reference

The tables in this section map the Python configuration fields to their `ff` CLI flags. All secret fields accept a registered secret reference, not a credential value.

### Workspace authentication and related providers

`unity-catalog` and `databricks` use `DatabricksWorkspaceConfig`:

| Python field | CLI flag | Requirement |
| --- | --- | --- |
| `workspace.workspace_url` | `--databricks-workspace-url` | Required HTTPS workspace URL |
| `workspace.auth.type` | `--databricks-auth-type` | `pat` or `oauth_m2m` |
| `DatabricksPATAuth.token` | `--databricks-token-secret` | Required for PAT authentication |
| `DatabricksOAuthM2MAuth.client_id` | `--databricks-oauth-client-id` | Required for OAuth M2M |
| `DatabricksOAuthM2MAuth.client_secret` | `--databricks-oauth-client-secret` | Required for OAuth M2M; use a non-Databricks secret reference |
| `UnityCatalogConfig.catalog_name` | `--unity-catalog-name` | Required for `unity-catalog` |

### Databricks compute

| Python field | CLI flag | Requirement or default |
| --- | --- | --- |
| `workspace` | Databricks workspace and authentication flags | Required |
| `compute_target` | `--databricks-compute-target` | `existing_cluster` by default; also accepts `job_cluster` |
| `cluster_id` | `--databricks-cluster-id` | Required for `existing_cluster` |
| `job_cluster` | `--databricks-job-*` | Required for `job_cluster`; see the Jobs compute table |
| `output_catalog` | `--databricks-output-catalog` | Required `unity-catalog` provider name |
| `default_managed_table_format` | `--default-managed-table-format` | `delta_uniform` by default; accepts `delta_uniform`, `iceberg`, or `delta` |
| `callable_runtime.python_version` | `--databricks-callable-python-version` | Required when you configure a callable runtime |
| `callable_runtime.cloudpickle_version` | `--databricks-callable-cloudpickle-version` | Required for an existing-cluster callable runtime; invalid for Jobs compute |
| `artifact_store.type` | `--databricks-artifact-store-type` | Use `unity_catalog` for new registrations; omission selects the legacy `legacy_workspace_dbfs` compatibility policy |
| `artifact_store.provider` | `--databricks-artifact-store-provider` | Required `unity-catalog` provider for Volume storage |
| `artifact_store.schema` | `--databricks-artifact-store-schema` | Required for Volume storage |
| `artifact_store.volume` | `--databricks-artifact-store-volume` | Required for Volume storage |

`output_catalog` and the artifact-store policy are immutable. Register a new compute provider to change either setting.

### Jobs compute

| Python field | CLI flag | Requirement or constraint |
| --- | --- | --- |
| `spark_version` | `--databricks-job-spark-version` | Required Databricks Runtime version |
| `node_type_id` | `--databricks-job-node-type-id` | A worker node type or worker instance pool is required |
| `driver_node_type_id` | `--databricks-job-driver-node-type-id` | Optional driver node type |
| `num_workers` | `--databricks-job-num-workers` | Positive fixed count; mutually exclusive with autoscaling |
| `autoscale.min_workers` | `--databricks-job-autoscale-min-workers` | Nonnegative; set with maximum workers |
| `autoscale.max_workers` | `--databricks-job-autoscale-max-workers` | Greater than minimum workers |
| `data_security_mode` | `--databricks-job-data-security-mode` | Optional Databricks access mode |
| `policy_id` | `--databricks-job-policy-id` | Optional compute policy ID |
| `apply_policy_default_values` | `--databricks-job-apply-policy-default-values` | `false` by default |
| `runtime_engine` | `--databricks-job-runtime-engine` | Optional runtime engine such as `PHOTON` |
| `custom_tags` | Repeat `--databricks-job-custom-tag <key>=<value>` | At most 45 entries; keys must be nonempty |
| `cluster_log_conf.s3` | `--databricks-job-cluster-log-s3-*` | Optional; see the log-delivery table |
| `init_scripts` | Repeat a `--databricks-job-init-script-*` flag | Optional; see the init-script table |
| `instance_pool_id` | `--databricks-job-instance-pool-id` | Worker pool; can replace `node_type_id` |
| `driver_instance_pool_id` | `--databricks-job-driver-instance-pool-id` | Optional driver pool |
| `enable_elastic_disk` | `--databricks-job-enable-elastic-disk` | `false` by default |
| `enable_local_disk_encryption` | `--databricks-job-enable-local-disk-encryption` | `false` by default |
| `single_user_name` | `--databricks-job-single-user-name` | Optional user for `SINGLE_USER` access mode |
| `aws_attributes` | `--databricks-job-aws-*` | Optional for Databricks on AWS; see [Configure AWS attributes](#configure-aws-attributes) |

### Log delivery and init scripts

Jobs compute supports Amazon Simple Storage Service (S3) cluster-log delivery:

| Python field under `cluster_log_conf.s3` | CLI flag |
| --- | --- |
| `destination` | `--databricks-job-cluster-log-s3-destination` |
| `region` | `--databricks-job-cluster-log-s3-region` |
| `endpoint` | `--databricks-job-cluster-log-s3-endpoint` |
| `canned_acl` | `--databricks-job-cluster-log-s3-canned-acl` |
| `enable_encryption` | `--databricks-job-cluster-log-s3-enable-encryption` |
| `encryption_type` | `--databricks-job-cluster-log-s3-encryption-type` |
| `kms_key` | `--databricks-job-cluster-log-s3-kms-key` |

Set `destination` and either `region` or `endpoint`. For init scripts, each `DatabricksInitScript` must configure exactly one destination:

| Python destination | CLI flag |
| --- | --- |
| `s3=DatabricksS3StorageInfo(...)` | Repeat `--databricks-job-init-script-s3 destination=<s3-uri>,region=<aws-region>` |
| `dbfs=DatabricksStorageInfo(...)` | Repeat `--databricks-job-init-script-dbfs <dbfs-path>` |
| `workspace=DatabricksStorageInfo(...)` | Repeat `--databricks-job-init-script-workspace <workspace-path>` |
| `volumes=DatabricksStorageInfo(...)` | Repeat `--databricks-job-init-script-volumes <volume-path>` |

The S3 init-script value also accepts `endpoint`, `canned_acl`, `enable_encryption`, `encryption_type`, and `kms_key` as comma-separated `key=value` entries. It requires either `region` or `endpoint`.

### Databricks secret provider

| Python field | CLI flag | Requirement |
| --- | --- | --- |
| `workspace_url` | `--workspace-url` or `--databricks-workspace-url` | Required HTTPS workspace URL |
| `auth.type` | `--auth-type` or `--databricks-auth-type` | `pat` or `oauth_m2m` |
| `DatabricksSecretPATAuth.token_secret` | `--token-secret` or `--databricks-token-secret` | Required for PAT authentication |
| `DatabricksSecretOAuthM2MAuth.client_id` | `--client-id` or `--databricks-client-id` | Required for OAuth M2M |
| `DatabricksSecretOAuthM2MAuth.client_secret_secret` | `--client-secret-secret` or `--databricks-client-secret-secret` | Required for OAuth M2M; use a non-Databricks secret reference |

## Understand registration health checks

| Provider type | Registration checks | Not checked |
| --- | --- | --- |
| `unity-catalog` | Workspace authentication and catalog lookup | Table writes, Volume access, or compute permissions |
| `databricks` with `existing_cluster` | Workspace authentication and cluster lookup | Job submission, libraries, catalog writes, artifacts, or Redis connectivity |
| `databricks` with `job_cluster` | Workspace authentication and static configuration | Cluster creation, policy authorization, runtime startup, catalog access, artifacts, or Redis connectivity |
| `databricks-secret` | Configuration validation | Live scope or key access |

Because registration doesn't run a representative workload, policy, permission, library, secret, and network errors can first appear during an apply operation.

## Verify the providers

```bash
ff provider get <catalog-provider-name> --workspace <workspace-id>
ff provider get <databricks-provider-name> --workspace <workspace-id>
ff provider get <redis-provider-name> --workspace <workspace-id>
ff secret-provider get <databricks-secret-provider-name> --workspace <workspace-id>
ff provider list --workspace <workspace-id>
```

In Python, use `providers.get()` or `providers.list()` for data providers and `secret_providers.get()` for the Databricks secret provider.

## Troubleshoot registration

| Symptom | What to check |
| --- | --- |
| Output catalog provider isn't found | Register it first and confirm its name and Feature Form workspace |
| Provider is the wrong type | Use `unity-catalog`, not a generic Iceberg catalog, for `output_catalog` or `--databricks-output-catalog` |
| Workspace hosts don't match | Use the same Databricks workspace host for compute, input, output, and artifact catalogs. A mismatched input catalog is reported when you apply the dataset, not when you register the provider |
| Existing-cluster health fails | Check the cluster ID, workspace authentication, server network access, and permission to inspect the cluster |
| Jobs compute validation fails | Supply a runtime, a node type or pool, and either fixed workers or valid autoscaling bounds |
| A Jobs run is rejected by a compute policy | Confirm that the provider principal can use the policy, required fixed values match, and policy defaults are applied when needed |
| A Jobs run starts but can't access a catalog | Check the Databricks run principal's grants on the input and output catalogs, schemas, tables, and storage locations, not the catalog provider's grants |
| A Databricks secret fails on first use | Check the bootstrap credential, Databricks secret scope and key, and the principal's secret access |
| Redis health passes but materialization can't connect | Test name resolution, routing, firewall rules, and TLS from the Databricks compute environment, not only from the Feature Form server |
| Existing-cluster materialization rejects the Redis password reference | Use a `databricks@<provider>:<scope>#<key>` reference for the Redis password |
| Volume publication fails | Check that the schema and Volume exist and that the artifact-store provider's principal has the [required grants](#grant-unity-catalog-privileges) |
| An incremental transformation fails writing to the Volume | Grant the Databricks run principal `WRITE VOLUME` on the artifact Volume |
| An existing-cluster run is rejected or can't import the Feature Form runtime | [Install the Feature Form Spark runtime](#install-the-feature-form-spark-runtime) that matches your server version on the cluster |
| Planning rejects `transform_job_config` | Databricks providers don't support per-resource Spark job settings; [register a provider for each compute profile](#register-a-provider-for-each-compute-profile) |
| An apply fails with `provider changed since the apply was submitted` | A provider it uses was updated while the apply was queued; resubmit the apply |
| A dataframe read rejects an output | Check the managed table format; `delta` isn't supported by the current dataframe path |

If registration succeeds but the first workload fails, start with the health-check boundaries, identity permissions, and network paths on this page. Then compare the submitted Jobs configuration with the [Databricks Jobs API reference](https://docs.databricks.com/aws/en/reference/jobs-2.0-api).
