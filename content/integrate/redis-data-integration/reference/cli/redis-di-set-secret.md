---
Title: redis-di set-secret
linkTitle: redis-di set-secret
description: Creates or updates a secret of a pipeline
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases:
---

Creates or updates a secret of a pipeline. Secrets hold the credentials and certificates that the
pipeline uses to connect to the source and target databases (see
[Set secrets]({{< relref "/integrate/redis-data-integration/data-pipelines/deploy#set-secrets" >}})
for the list of secret names). You can then refer to a secret in the `config.yaml` file with the
syntax `${SECRET_NAME}`.

The secret value comes from the `[value]` argument, the `--file` option, or the `--literal` option.
If you provide none of these on an interactive terminal, the command prompts for the value without
echoing it.

## Usage

```
redis-di set-secret <key> [value] [flags]
```

## Options

| Option | Description |
| :-- | :-- |
| `-p`, `--pipeline` | Pipeline to target (default `default`). |
| `--file` | Read the secret value from the file at this path. |
| `--literal` | Use this literal string as the secret value. |
| `--wait` | Wait for the pipeline to reach the expected state (default `true`). |
| `--timeout` | Maximum time to wait for the pipeline to reach the expected state (default `2m`). |

This command also accepts the
[global options]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di#global-options" >}}).

## Example

```bash
# Value from an argument
redis-di set-secret SOURCE_DB_USERNAME myuser

# Value from a file (for example, a certificate)
redis-di set-secret SOURCE_DB_CACERT --file /path/to/myca.crt

# Value read from an interactive prompt
redis-di set-secret SOURCE_DB_PASSWORD
```
