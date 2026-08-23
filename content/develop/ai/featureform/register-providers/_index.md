---
title: Register providers
description: Register storage, compute, catalog, and secret providers in a Redis Feature Form workspace.
linkTitle: Register providers
weight: 30
aliases:
- /develop/ai/featureform/streaming/
---

Register the providers and secret backends Redis Feature Form needs before you author features or transformations. Providers connect a workspace to external systems, and definitions files reference them by name.

## Prerequisites

Before you register a provider, make sure you have:

- A [workspace]({{< relref "/develop/ai/featureform/manage-workspace" >}}).
- The [`redis-featureform` Python package]({{< relref "/develop/ai/featureform/quickstart#install-the-ff-cli" >}}) installed. It includes the Python client and the `ff` command-line interface (CLI).
- Network access from the Feature Form server and its workers to the external system.
- A registered secret provider for each credential reference in the provider configuration.

The examples show Python first and the equivalent `ff` command second. [Configure authentication]({{< relref "/operate/featureform/configure-auth" >}}) through an active profile or environment variables before you use either interface. `ff.Client.from_env()` reads that configuration, including `FEATUREFORM_BASE_URL` and `FEATUREFORM_TOKEN` when set. The CLI connects to `localhost:9090` by default; use `--server <host:port>` or configure another endpoint when the server is elsewhere.

The Python examples on this page use these workspace-scoped clients:

```python
import featureform as ff

client = ff.Client.from_env()
providers = client.providers("<workspace-id>")
secret_providers = client.secret_providers("<workspace-id>")
```

Provider names are unique within a workspace. Use stable names because definitions files and other providers can refer to them.

## Choose a provider

A provider fills one or more literal roles: `offline-store`, `online-store`, `compute`, or `streaming`. Registration support doesn't mean every resource accepts every provider.

| Provider | Roles | Use it for |
| --- | --- | --- |
| [Databricks]({{< relref "/develop/ai/featureform/register-providers/databricks" >}}) | `offline-store`, `compute` | Managed Spark compute with Unity Catalog outputs |
| [Snowflake]({{< relref "/develop/ai/featureform/register-providers/snowflake" >}}) | `offline-store`, `compute` | Snowflake datasets and SQL compute |
| [PostgreSQL]({{< relref "/develop/ai/featureform/register-providers/postgresql" >}}) | `offline-store`, `compute` | PostgreSQL datasets and SQL compute |
| [S3]({{< relref "/develop/ai/featureform/register-providers/s3" >}}) | `offline-store` | Object storage and Spark data or staging access |
| Redis | `online-store` | Low-latency feature serving |
| Spark | `compute` | Generic Spark execution |
| Iceberg catalog | `offline-store` | Catalog-backed Iceberg tables |

Use `ff provider register --help` to see the complete list of provider types and their current options.

## Configure secret providers

Feature Form never stores credentials in any form. A provider configuration contains secret references, and the Feature Form process that needs a credential resolves it from the registered backend.

Each workspace includes an `env` secret provider. An `env:PG_PASSWORD` reference reads `PG_PASSWORD` from the Feature Form server's environment, not from the shell where you run `ff`.

Check the built-in provider:

```bash
ff secret-provider list --workspace <workspace-id>
ff secret-provider get env --workspace <workspace-id>
```

For production deployments, register the backend that manages your credentials before registering data providers that use it.

### Register an environment secret provider

Use an environment provider for local development or bootstrap. A prefix helps separate its variables from other process configuration.

{{< multitabs id="featureform-register-env-secret-provider"
    tab1="Python"
    tab2="ff CLI" >}}

```python
from featureform.types import EnvSecretConfig, SecretProviderType

secret_providers.register(
    name="<secret-provider-name>",
    provider_type=SecretProviderType.ENV,
    config=EnvSecretConfig(prefix="FF_"),
)
```

-tab-sep-

```bash
ff secret-provider register <secret-provider-name> \
  --workspace <workspace-id> \
  --type env-var \
  --env-prefix FF_
```

{{< /multitabs >}}

### Register Vault

The Feature Form server must be able to authenticate to Vault. The provider uses the key-value version 2 secrets engine.

{{< multitabs id="featureform-register-vault-secret-provider"
    tab1="Python"
    tab2="ff CLI" >}}

```python
from featureform.types import SecretProviderType, VaultSecretConfig

secret_providers.register(
    name="<secret-provider-name>",
    provider_type=SecretProviderType.VAULT,
    config=VaultSecretConfig(
        address="https://<vault-host>",
        token_path="<vault-token-path>",
    ),
)
```

-tab-sep-

```bash
ff secret-provider register <secret-provider-name> \
  --workspace <workspace-id> \
  --type vault \
  --vault-address https://<vault-host> \
  --vault-token-path <vault-token-path>
```

{{< /multitabs >}}

### Register Kubernetes secrets

For a Kubernetes deployment, use in-cluster authentication. The Feature Form server's service account needs permission to read secrets in the target namespace.

{{< multitabs id="featureform-register-kubernetes-secret-provider"
    tab1="Python"
    tab2="ff CLI" >}}

```python
from featureform.types import KubernetesSecretConfig, SecretProviderType

secret_providers.register(
    name="<secret-provider-name>",
    provider_type=SecretProviderType.K8S,
    config=KubernetesSecretConfig(
        namespace="<namespace>",
        secret_name="<secret-name>",
        in_cluster=True,
    ),
)
```

-tab-sep-

```bash
ff secret-provider register <secret-provider-name> \
  --workspace <workspace-id> \
  --type k8s-secret \
  --k8s-namespace <namespace> \
  --k8s-secret-name <secret-name> \
  --k8s-in-cluster
```

{{< /multitabs >}}

If Feature Form runs outside Kubernetes, omit `in_cluster=True` or use `--no-k8s-in-cluster`. The Feature Form server then uses `~/.kube/config` and its current context. It doesn't use kubeconfig from the computer where you run `ff`.

### Register AWS Secrets Manager

The Feature Form server authenticates with the standard Amazon Web Services (AWS) credential chain.

{{< multitabs id="featureform-register-aws-secret-provider"
    tab1="Python"
    tab2="ff CLI" >}}

```python
from featureform.types import AWSSecretsManagerSecretConfig, SecretProviderType

secret_providers.register(
    name="<secret-provider-name>",
    provider_type=SecretProviderType.AWS,
    config=AWSSecretsManagerSecretConfig(region="<aws-region>"),
)
```

-tab-sep-

```bash
ff secret-provider register <secret-provider-name> \
  --workspace <workspace-id> \
  --type aws-secrets-manager \
  --aws-region <aws-region>
```

{{< /multitabs >}}

## Register Redis for online serving

Register Redis when a feature view needs an `online-store` provider for inference-time reads.

{{< multitabs id="featureform-register-redis-provider"
    tab1="Python"
    tab2="ff CLI" >}}

```python
from featureform.types import ProviderType, RedisConfig

providers.register(
    name="<redis-provider-name>",
    provider_type=ProviderType.REDIS,
    config=RedisConfig(
        host="<redis-host>",
        port=int("<redis-port>"),
    ),
)
```

-tab-sep-

```bash
ff provider register <redis-provider-name> \
  --workspace <workspace-id> \
  --type redis \
  --redis-host <redis-host> \
  --redis-port <redis-port>
```

{{< /multitabs >}}

See [Serve features]({{< relref "/develop/ai/featureform/serve-features" >}}) for the serving workflow. To provision a managed Redis deployment, see the [Redis Cloud quick start]({{< relref "/operate/rc/rc-quickstart" >}}).

## Keep health checks enabled

Provider registration validates configuration and runs a synchronous health check before persistence by default. The exact check is provider-specific and might require write permissions.

Use `--skip-health-check`, or `skip_health_check=True` in Python, only when the external system is deliberately unavailable during registration. This skips the synchronous check but does not disable recurring monitoring. Use `--disable-monitoring`, or `disable_monitoring=True`, to skip the initial check and disable recurring checks.

{{< note >}}
A successful health check verifies only the operations documented for that provider. It doesn't prove that every future dataset, table, policy, or workload is accessible.
{{< /note >}}

## Verify registration

```bash
ff provider list --workspace <workspace-id>
ff provider get <provider-name> --workspace <workspace-id>
```

Pass `--output json` or `--output yaml` for machine-readable output. If the provider isn't returned, rerun the registration command and review its validation or health-check error.

In Python, use `providers.list()` or `providers.get("<provider-name>")`.

## Update or delete a provider

```bash
ff provider update <provider-name> \
  --workspace <workspace-id> \
  <provider-options>

ff provider delete <provider-name> \
  --workspace <workspace-id>
```

Provider-specific fields can be mutable, force-required, or immutable. `--force` allows a force-required change after Feature Form checks known direct uses. It doesn't override immutable fields, migrate external data, or guarantee that no indirect references exist. Review definitions and provider-to-provider references before an update or deletion.

In Python, use `providers.update()` and `providers.delete()`. Pass `force=True` to `providers.update()` only after the same review required for `--force`.

## Automate repeatable registration

`register()` creates a provider and returns an error when that name already exists. For a repeatable automation script, register missing providers and update existing providers of the same type:

```python
import featureform as ff


def ensure_registered(registry, name, provider_type, config):
    try:
        current = registry.get(name)
    except ff.NotFoundError:
        return registry.register(
            name=name,
            provider_type=provider_type,
            config=config,
        )

    if current.type != provider_type:
        raise ValueError(
            f"{name!r} is registered as {current.type}, not {provider_type}"
        )

    return registry.update(
        name=name,
        config=config,
        provider_type=provider_type,
    )
```

You can pass either `providers` or `secret_providers` as `registry`. The helper deliberately doesn't force an update. A force-required or immutable change fails so you can review its effect before changing the provider.

## Next steps

After you register the required providers, [define and deploy features]({{< relref "/develop/ai/featureform/define-and-deploy-features" >}}).
