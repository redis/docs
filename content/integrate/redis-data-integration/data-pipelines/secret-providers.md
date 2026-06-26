---
Title: Using an external secret provider
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: |
    Configure RDI to obtain authentication secrets for your source and target databases
    from an external provider.
group: di
linkTitle: External secret providers
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 49
---

For K8s deployments, you can use an external secret provider, such as
[Vault](https://developer.hashicorp.com/vault) or
[AWS Secrets Manager](https://aws.amazon.com/secrets-manager/) to provide
the authentication secrets for your source and target databases.
See the sections below to learn how to do this. If you prefer to set the secrets for RDI manually, see
[Set secrets]({{< relref "/integrate/redis-data-integration/data-pipelines/set-secrets" >}})
for more information.

{{< note >}}
This page is a work in progress. The sections marked **TODO** below need
confirmation from the RDI developers before the page is published. Please
review and comment.
{{< /note >}}

## Configure an external provider

You define a secret provider in the `secret-providers` section of your
[`config.yaml`]({{< relref "/integrate/redis-data-integration/data-pipelines/pipeline-config" >}})
file. Each provider has:

- a unique **id** (the key under `secret-providers`) that you use to refer to it
- a **`type`** (`vault` or `aws`)
- a **`parameters`** object that configures the connection to the provider and
  lists the secret **`objects`** to fetch from it.

Each entry in `objects` maps a secret stored in the provider to a name that you
can reference elsewhere in the configuration:

```yaml
secret-providers:
  my-provider:
    type: vault            # or "aws"
    parameters:
      # connection parameters (see the sections below)
      objects:
        - objectName: credentials       # the name you reference
          secretPath: secret/data/db-pass
          secretKey: password
```

You then reference a fetched secret using the syntax
`${secret:<provider-id>:<objectName>:<secretKey>}`. For example:

```yaml
connection:
  user: ${secret:my-provider:credentials:user}
  password: ${secret:my-provider:credentials:password}
```

Note that this differs from the `${SECRET_NAME}` syntax used for
[secrets that you set manually]({{< relref "/integrate/redis-data-integration/data-pipelines/set-secrets" >}}).

> **TODO (needs dev input):** Confirm where a provider can be defined. The
> `config.yaml` reference lists `secret-providers` as a config section, but the
> API also exposes `PUT /api/v1/pipelines/secret-providers/{name}`. Can
> providers be configured in `config.yaml`, through the API, and/or in Redis
> Insight?

## Vault

Set `type: vault` and provide the following connection parameters:

| Parameter | Description |
| :-- | :-- |
| `vaultAddress` | URL of the Vault server, for example `http://vault.default:8200`. |
| `roleName` | The Vault role that RDI uses to authenticate. |

Each entry in `objects` has the following fields:

| Field | Description |
| :-- | :-- |
| `objectName` | The name you use to reference the secret in the `${secret:...}` syntax. |
| `secretPath` | The path to the secret in Vault, for example `secret/data/db-pass`. |
| `secretKey` | The key within the secret whose value you want to read. |

For example:

```yaml
secret-providers:
  my-vault:
    type: vault
    parameters:
      vaultAddress: http://vault.default:8200
      roleName: database
      objects:
        - objectName: credentials
          secretPath: secret/data/db-pass
          secretKey: password
```

> **TODO (needs dev input):**
>
> - Which Vault **authentication method** does RDI use (token, Kubernetes auth,
>   AppRole)? How are the credentials or token supplied? The `roleName`
>   parameter suggests a role-based method.
> - The API example includes an extra `someField` parameter. What is the
>   complete, real list of `parameters` for the Vault provider?
> - Are there any TLS options for the connection to Vault?

## AWS Secrets Manager

Set `type: aws`.

> **TODO (needs dev input):** The `config.yaml` reference and the API schema
> currently document only `type: aws` with no parameters, so this section needs
> the full parameter set from the RDI developers, including:
>
> - **Region** and any endpoint configuration.
> - **Authentication** — IAM role, IRSA, or static access keys?
> - The **`objects`** mapping fields — the AWS equivalents of `objectName`, the
>   secret name or ARN, and the key or JSON field to read.

## Secret rotation

*Secret rotation* is a technique where secrets are changed automatically
by the provider according to a schedule.
RDI versions 1.10.0 and above let you configure the pipeline to
restart the appropriate K8s pods automatically whenever a secret rotates in
the external provider that you have configured.

> **TODO (needs dev input):** Document how to enable the automatic pod restart —
> which `config.yaml` setting controls it, and whether it has any per-provider
> requirements.
