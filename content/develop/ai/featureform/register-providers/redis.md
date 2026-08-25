---
title: Register Redis providers
description: Register standalone Redis and Redis Cluster online-store providers with Redis Feature Form.
linkTitle: Redis
weight: 50
---

Register a Redis provider when feature views need an `online-store` for materialization and inference-time reads. A Redis provider doesn't supply offline storage or compute.

## Choose a Redis provider type

Choose the type that matches the topology of the Redis deployment:

| Provider type | Use it for | Connection configuration | Database |
| --- | --- | --- | --- |
| `redis` | A single endpoint that doesn't use Redis Cluster topology discovery | Host and port | Database 0 by default; Python supports databases 0 through 15 |
| `redis-cluster` | An open source Redis Cluster topology | One or more startup endpoints in `host:port` format | Database 0 |

The `redis-cluster` provider discovers the cluster topology from its startup endpoints. It doesn't mean every Redis service or deployment with multiple nodes uses the Redis Cluster protocol. Confirm the connection mode and endpoint format for your deployment before choosing the provider type.

## Before you begin

Make sure you have:

- A Feature Form [workspace]({{< relref "/develop/ai/featureform/manage-workspace" >}}).
- Network access to Redis from the Feature Form server and any compute runtime that materializes feature views.
- A Redis host and port, or at least one Redis Cluster startup endpoint.
- A registered [secret provider]({{< relref "/develop/ai/featureform/register-providers#configure-secret-providers" >}}) for the Redis password, if authentication is enabled.
- Certificate material available to each runtime that needs it, if Redis requires TLS or mutual TLS (mTLS).

The Python examples use this workspace-scoped provider client:

```python
import featureform as ff

client = ff.Client.from_env()
providers = client.providers("<workspace-id>")
```

## Choose authentication

Redis authentication configuration is the same for both provider types:

| Redis authentication | Configuration |
| --- | --- |
| No authentication | Omit `username` and `password_secret` |
| Password only | Set `password_secret` and omit `username` |
| Access control list (ACL) | Set both `username` and `password_secret` |

Feature Form rejects a username without a password secret. Use a secret reference such as `env:REDIS_PASSWORD`; don't put a password value in the provider definition. An environment reference resolves in the Feature Form server environment, not in the shell where you run the CLI.

## Register standalone Redis

This example uses Redis ACL authentication:

{{< multitabs id="featureform-register-standalone-redis"
    tab1="Python"
    tab2="ff CLI" >}}

```python
from featureform.types import EnvSecretRef, ProviderType, RedisConfig

providers.register(
    name="<redis-provider-name>",
    provider_type=ProviderType.REDIS,
    config=RedisConfig(
        host="<redis-host>",
        port=int("<redis-port>"),
        username="<redis-username>",
        password_secret=EnvSecretRef(name="REDIS_PASSWORD"),
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
  --redis-password-secret env:REDIS_PASSWORD
```

{{< /multitabs >}}

Omit the username and password fields for a deployment without authentication. For password-only authentication, omit only the username.

Standalone Redis uses database 0 by default. The Python client also supports databases 0 through 15 by setting `database` in `RedisConfig`. The CLI doesn't currently expose a database option, so CLI registration uses database 0.

## Register Redis Cluster

Supply one or more startup endpoints. They aren't required to list every node because the provider discovers the cluster topology.

{{< multitabs id="featureform-register-redis-cluster"
    tab1="Python"
    tab2="ff CLI" >}}

```python
from featureform.types import EnvSecretRef, ProviderType, RedisClusterConfig

providers.register(
    name="<redis-cluster-provider-name>",
    provider_type=ProviderType.REDIS_CLUSTER,
    config=RedisClusterConfig(
        endpoints=[
            "<redis-host-1>:<redis-port>",
            "<redis-host-2>:<redis-port>",
        ],
        username="<redis-username>",
        password_secret=EnvSecretRef(name="REDIS_PASSWORD"),
    ),
)
```

-tab-sep-

```bash
ff provider register <redis-cluster-provider-name> \
  --workspace <workspace-id> \
  --type redis-cluster \
  --redis-cluster-startup-endpoints <redis-host-1>:<redis-port>,<redis-host-2>:<redis-port> \
  --redis-username <redis-username> \
  --redis-password-secret env:REDIS_PASSWORD
```

{{< /multitabs >}}

With the CLI, pass all startup endpoints as one comma-delimited `--redis-cluster-startup-endpoints` value. Don't repeat the flag. Redis Cluster uses database 0.

## Configure TLS

Set a TLS mode when the Redis deployment requires an encrypted connection:

| Mode | Behavior | Required certificate configuration |
| --- | --- | --- |
| `disabled` | Plaintext connection | None |
| `enabled` | TLS using the runtime's trust store and normal hostname verification | None; `insecure_skip_verify` is available only with this mode for development or testing |
| `verify-ca` | TLS with a supplied CA certificate; verifies the certificate chain but not the hostname | CA certificate path or secret |
| `verify-full` | TLS with a supplied CA certificate; verifies the certificate chain and hostname | CA certificate path or secret |
| `mtls` | Full server verification plus a client certificate and key | CA certificate, client certificate, and client key, each as a path or secret |

TLS 1.2 is the default minimum. Set the minimum version to `1.2` or `1.3` when you need to make it explicit. For `verify-full` and `mtls`, set `server_name` when the name used for certificate verification differs from the connection host.

This mTLS example uses file paths so the same configuration can be used by Feature Form and a Spark materialization runtime:

{{< multitabs id="featureform-register-redis-mtls"
    tab1="Python"
    tab2="ff CLI" >}}

```python
from featureform.types import (
    EnvSecretRef,
    ProviderType,
    RedisConfig,
    RedisTLSConfig,
    RedisTLSMode,
)

providers.register(
    name="<redis-provider-name>",
    provider_type=ProviderType.REDIS,
    config=RedisConfig(
        host="<redis-host>",
        port=int("<redis-port>"),
        username="<redis-username>",
        password_secret=EnvSecretRef(name="REDIS_PASSWORD"),
        tls=RedisTLSConfig(
            mode=RedisTLSMode.MTLS,
            ca_cert_path="<runtime-visible-ca-cert-path>",
            server_name="<redis-server-name>",
            client_cert_path="<runtime-visible-client-cert-path>",
            client_key_path="<runtime-visible-client-key-path>",
            min_version="1.2",
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
  --redis-password-secret env:REDIS_PASSWORD \
  --redis-tls-mode mtls \
  --redis-tls-ca-cert-path <runtime-visible-ca-cert-path> \
  --redis-tls-server-name <redis-server-name> \
  --redis-tls-client-cert-path <runtime-visible-client-cert-path> \
  --redis-tls-client-key-path <runtime-visible-client-key-path> \
  --redis-tls-min-version 1.2
```

{{< /multitabs >}}

Certificate paths are resolved by the Feature Form server, not by the machine where you run the CLI. If Spark materializes the feature view, mount the same paths in the Spark runtime. Direct Feature Form connections can instead use the certificate secret fields, but Spark materialization doesn't project secret-backed Redis TLS certificates; use runtime-visible file paths for that workflow.

## Use Redis with Databricks

The Feature Form server and Databricks compute must both be able to reach the Redis endpoint.

For both `job_cluster` and `existing_cluster` Spark materialization, configure `password_secret` as a Databricks secret reference. With `job_cluster`, Feature Form adds the reference to the job environment so Databricks can resolve it. With `existing_cluster`, the cluster resolves the scope and key directly. An environment, Kubernetes, Vault, or AWS secret reference can't be projected to either Databricks compute target. First register the Databricks secret provider, then use this reference format:

```text
databricks@<databricks-secret-provider-name>:<secret-scope>#<redis-password-key>
```

See [Connect Databricks compute to Redis]({{< relref "/develop/ai/featureform/register-providers/databricks#connect-databricks-compute-to-redis" >}}) for equivalent Python and CLI examples and the Databricks secret bootstrap requirements.

Redis TLS certificate paths must also be mounted at the configured locations in the Databricks runtime. Secret-backed Redis TLS certificate fields aren't projected to Spark.

## Configuration reference

### Standalone Redis

| Python field | CLI flag | Requirement or default |
| --- | --- | --- |
| `RedisConfig.host` | `--redis-host` | Required hostname or IP address |
| `RedisConfig.port` | `--redis-port` | Defaults to `6379` |
| `RedisConfig.database` | Not available | Defaults to `0`; Python accepts 0 through 15 |
| `RedisConfig.username` | `--redis-username` | Optional; requires a password secret |
| `RedisConfig.password_secret` | `--redis-password-secret` | Optional secret reference |

### Redis Cluster

| Python field | CLI flag | Requirement or default |
| --- | --- | --- |
| `RedisClusterConfig.endpoints` | `--redis-cluster-startup-endpoints` | Required; CLI accepts one comma-delimited value |
| `RedisClusterConfig.username` | `--redis-username` | Optional; requires a password secret |
| `RedisClusterConfig.password_secret` | `--redis-password-secret` | Optional secret reference |

### Redis TLS

| Python field | CLI flag | Requirement or default |
| --- | --- | --- |
| `RedisTLSConfig.mode` | `--redis-tls-mode` | `disabled`, `enabled`, `verify-ca`, `verify-full`, or `mtls` |
| `ca_cert_path` | `--redis-tls-ca-cert-path` | Server-visible CA certificate path |
| `ca_cert_secret` | `--redis-tls-ca-cert-secret` | CA certificate secret reference; alternative to a path |
| `server_name` | `--redis-tls-server-name` | Optional TLS server name override |
| `client_cert_path` | `--redis-tls-client-cert-path` | Client certificate path for mTLS |
| `client_cert_secret` | `--redis-tls-client-cert-secret` | Client certificate secret reference for mTLS |
| `client_key_path` | `--redis-tls-client-key-path` | Client key path for mTLS |
| `client_key_secret` | `--redis-tls-client-key-secret` | Client key secret reference for mTLS |
| `insecure_skip_verify` | `--redis-tls-insecure-skip-verify` | Optional; accepted only with `enabled` |
| `min_version` | `--redis-tls-min-version` | Defaults to `1.2`; accepts `1.2` or `1.3` |

## Verify registration

```bash
ff provider get <redis-provider-name> --workspace <workspace-id>
ff provider list --workspace <workspace-id>
```

In Python, use `providers.get("<redis-provider-name>")` or `providers.list()`.

Registration resolves the configured secrets, builds the Redis client, and sends a ping before persisting the provider. Keep this health check enabled so endpoint, authentication, TLS, and network errors fail during registration. `--skip-health-check` or `skip_health_check=True` skips only the registration-time check; it doesn't disable recurring monitoring.

## Update safely

| Field | Update behavior |
| --- | --- |
| Standalone database | Immutable |
| Standalone host and port | Requires `force=True` or `--force` |
| Cluster startup endpoints | Requires `force=True` or `--force` |
| Username and password secret | Mutable |
| TLS mode, certificate paths, server name, verification settings, and minimum version | Requires `force=True` or `--force` |
| TLS certificate secret references | Mutable |

Changing endpoints or TLS settings can interrupt materialization and serving if the new configuration isn't reachable from every runtime. Test connectivity from the Feature Form server and compute runtime before forcing the update.

## Troubleshoot registration

| Symptom | What to check |
| --- | --- |
| Redis ping fails | Confirm the endpoint, route, firewall rules, authentication, and TLS settings from the Feature Form server environment |
| Authentication validation fails | Supply a password secret when a username is set; omit the username for password-only authentication |
| Redis Cluster registration rejects endpoints | Pass `host:port` entries as one comma-delimited CLI value, with no empty entries or repeated flag |
| TLS verification fails | Check the TLS mode, CA chain, server name, minimum TLS version, and whether certificate paths exist in the runtime |
| Spark rejects secret-backed TLS certificates | Mount certificate files in the Spark runtime and use the TLS path fields |
| Existing Databricks cluster can't resolve the Redis password | Use a Databricks secret reference from a registered `databricks-secret` provider |

See [Serve features]({{< relref "/develop/ai/featureform/serve-features" >}}) for the serving workflow. To provision a managed deployment, see the [Redis Cloud quick start]({{< relref "/operate/rc/rc-quickstart" >}}).
