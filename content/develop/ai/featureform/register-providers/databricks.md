---
title: Register Databricks providers
description: Register Databricks compute, Unity Catalog, and Databricks secret providers with Redis Feature Form.
linkTitle: Databricks
weight: 10
---

Use Databricks with Redis Feature Form by registering Unity Catalog first and then registering a `databricks` compute provider. The two provider records have separate configuration and permissions, even when they use the same Databricks identity.

## Understand the Databricks providers

| Provider type | Purpose | Required for Databricks compute |
| --- | --- | --- |
| `unity-catalog` | Identifies a catalog and provides credentials for catalog health, direct reads, and optional Volume artifact storage | Yes |
| `databricks` | Selects Databricks compute, the managed-output catalog, table format defaults, and artifact storage | Yes |
| `databricks-secret` | Resolves existing Databricks secret scope and key values | No |

The `databricks` provider fills the `offline-store` and `compute` roles. It doesn't provide online serving. A feature view also needs a supported `online-store` provider such as Redis.

## Before you begin

Make sure you have:

- A Feature Form [workspace]({{< relref "/develop/ai/featureform/manage-workspace" >}}).
- A Databricks workspace URL.
- A personal access token (PAT), or an OAuth machine-to-machine (M2M) client ID and client secret.
- A non-Databricks [secret provider]({{< relref "/develop/ai/featureform/register-providers#configure-secret-providers" >}}) that can resolve the PAT or OAuth client secret.
- A Unity Catalog catalog that the configured principal can read.
- Either an existing cluster or the configuration required to create Jobs compute.

The compute principal needs permission to inspect or create its selected compute, submit Databricks Jobs work, access the output catalog, and delete Feature Form-managed tables. Workloads need read and write access to the required catalog locations.

{{< note >}}
Don't use a `databricks@<provider>:<scope>#<key>` reference to authenticate a `databricks` or `unity-catalog` provider. Feature Form rejects that bootstrap cycle. Use `env`, Vault, Kubernetes secrets, or AWS Secrets Manager for these credentials.
{{< /note >}}

The Python examples use a workspace-scoped provider client and this shared Databricks workspace configuration:

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

For OAuth M2M authentication, replace the shared Python workspace configuration or the PAT flags with:

{{< multitabs id="featureform-configure-databricks-oauth"
    tab1="Python"
    tab2="ff CLI" >}}

```python
from featureform.types import DatabricksOAuthM2MAuth

databricks_workspace = DatabricksWorkspaceConfig(
    workspace_url="https://<databricks-workspace-host>",
    auth=DatabricksOAuthM2MAuth(
        client_id="<client-id>",
        client_secret=EnvSecretRef(name="DATABRICKS_CLIENT_SECRET"),
    ),
)
```

-tab-sep-

```text
--databricks-auth-type oauth_m2m
--databricks-oauth-client-id <client-id>
--databricks-oauth-client-secret env:DATABRICKS_CLIENT_SECRET
```

{{< /multitabs >}}

The Unity Catalog provider and every Databricks compute provider that uses it must be in the same Feature Form workspace. Their Databricks workspace URLs must identify the same host.

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
from featureform.types import DatabricksConfig, ManagedTableFormat, ProviderType

providers.register(
    name="<databricks-provider-name>",
    provider_type=ProviderType.DATABRICKS,
    config=DatabricksConfig(
        workspace=databricks_workspace,
        compute_target="existing_cluster",
        cluster_id="<cluster-id>",
        output_catalog="<catalog-provider-name>",
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
  --default-managed-table-format delta_uniform
```

{{< /multitabs >}}

If you author Python callable transformations, import `SparkCallableRuntime` from `featureform.types` and set `callable_runtime=SparkCallableRuntime(python_version="<python-version>", cloudpickle_version="<cloudpickle-version>")` on the Python `DatabricksConfig`. With the CLI, add:

```text
--databricks-callable-python-version <python-version>
--databricks-callable-cloudpickle-version <cloudpickle-version>
```

The versions must match the environment that serializes and executes the callable.

## Register Jobs compute

This example uses a fixed worker count:

{{< multitabs id="featureform-register-databricks-job-cluster"
    tab1="Python"
    tab2="ff CLI" >}}

```python
from featureform.types import (
    DatabricksConfig,
    DatabricksJobClusterConfig,
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
  --default-managed-table-format delta_uniform
```

{{< /multitabs >}}

In Python, set `instance_pool_id="<instance-pool-id>"` instead of `node_type_id` when the workspace uses an instance pool. With the CLI, use `--databricks-job-instance-pool-id <instance-pool-id>` instead of a worker node type.

To autoscale in Python, import `DatabricksAutoscaleConfig` from `featureform.types`, omit `num_workers`, and set `autoscale=DatabricksAutoscaleConfig(min_workers=int("<minimum-workers>"), max_workers=int("<maximum-workers>"))`. With the CLI, omit `--databricks-job-num-workers` and set both of these flags:

```text
--databricks-job-autoscale-min-workers <minimum-workers>
--databricks-job-autoscale-max-workers <maximum-workers>
```

Fixed workers and autoscaling are mutually exclusive. Common optional settings include a driver node type or pool, cluster policy, data security mode, runtime engine, custom tags, log delivery, init scripts, disk settings, and Amazon Web Services (AWS) attributes. Run `ff provider register --help` for the current flags.

For a Python callable transformation on Jobs compute, import `SparkCallableRuntime` from `featureform.types` and set `callable_runtime=SparkCallableRuntime(python_version="<python-version>")`. With the CLI, set `--databricks-callable-python-version`. Don't set the provider-level cloudpickle version for `job_cluster`.

## Choose artifact storage

Feature Form publishes temporary execution artifacts for Databricks jobs. If you omit artifact-store flags, it uses the legacy Databricks workspace storage policy.

To use a Unity Catalog Volume, create the schema and Volume first. The Unity Catalog provider's principal needs create, read, and delete access through the Databricks Files application programming interface (API). The Databricks run principal needs read access.

In Python, import `DatabricksUnityCatalogArtifactStoreConfig` from `featureform.types` and set `artifact_store=DatabricksUnityCatalogArtifactStoreConfig(provider="<catalog-provider-name>", schema="<schema-name>", volume="<volume-name>")` on `DatabricksConfig`. With the CLI, add these flags to the compute registration command:

```text
--databricks-artifact-store-type unity_catalog
--databricks-artifact-store-provider <catalog-provider-name>
--databricks-artifact-store-schema <schema-name>
--databricks-artifact-store-volume <volume-name>
```

The artifact catalog can be the output catalog or another `unity-catalog` provider. It must target the same Databricks workspace host. The output catalog and artifact-store policy are immutable; changing either requires a new Databricks compute provider.

## Choose a managed table format

The provider default applies when a managed transformation, feature view, or training set doesn't select a format.

| Value | Use with Feature Form dataframe reads | Important boundary |
| --- | --- | --- |
| `delta_uniform` | Yes | Default; exposes Iceberg-compatible metadata |
| `iceberg` | Yes | Not supported for incremental Databricks transformations |
| `delta` | No | Remains usable by Databricks compute, but not by the current dataframe path |

Changing the provider default affects new managed output versions. It doesn't rewrite existing outputs.

## Use Databricks secrets

Register `databricks-secret` only when Feature Form must resolve existing Databricks scope and key values for a supported consumer. Its own PAT or OAuth client secret must come from another secret provider.

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

Reference a secret as `databricks@<databricks-secret-provider-name>:<scope>#<key>`. This secret-provider type doesn't have a live health probe, so registration success doesn't prove that the scope and key can be read.

## Verify the providers

```bash
ff provider get <catalog-provider-name> --workspace <workspace-id>
ff provider get <databricks-provider-name> --workspace <workspace-id>
ff provider list --workspace <workspace-id>
```

In Python, use `providers.get()` for each provider name or `providers.list()`.

## Troubleshoot registration

| Symptom | What to check |
| --- | --- |
| Output catalog provider isn't found | Register it first and confirm its name and Feature Form workspace |
| Provider is the wrong type | Use `unity-catalog`, not a generic Iceberg catalog, for `output_catalog` or `--databricks-output-catalog` |
| Workspace hosts don't match | Use the same Databricks workspace host for compute, output, and artifact catalogs |
| Existing-cluster health fails | Check the cluster ID, workspace authentication, server network access, and permission to inspect the cluster |
| Jobs compute validation fails | Supply a runtime, a node type or pool, and either fixed workers or valid autoscaling bounds |
| Volume publication fails | Check that the schema and Volume exist and that both principals have the required Files API access |
| A dataframe read rejects an output | Check the managed table format; `delta` isn't supported by the current dataframe path |

Provider health doesn't run a representative Spark job or prove catalog write, library, policy, artifact, or runtime permissions. Validate those requirements before applying production resources.
