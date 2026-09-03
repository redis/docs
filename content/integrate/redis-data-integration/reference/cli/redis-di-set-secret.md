---
Title: redis-di set-secret
linkTitle: redis-di set-secret
description: Creates or updates a secret of a pipeline
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases:
- /integrate/redis-data-integration/ingest/reference/cli/redis-di-set-secret/
---

Creates or updates a secret of a pipeline. Secrets hold the credentials and certificates that the
pipeline uses to connect to its source and target databases (see
[Set secrets]({{< relref "/integrate/redis-data-integration/data-pipelines/deploy#set-secrets" >}})
for the secret keys). Every secret belongs to one database, which you name with `--db`: a source, or
`target`. RDI combines the key and the database into the environment variable that `config.yaml`
references, so `PASSWORD` with `--db mysql` becomes `${MYSQL_DB_PASSWORD}`.

The secret value comes from the `[value]` argument, the `--file` option, or the `--literal` option.
If you provide none of these on an interactive terminal, the command prompts for the value without
echoing it.

## Usage

```
redis-di set-secret <key> [value] [flags]
```

## Options

| Option             | Description                                                                       |
| :----------------- | :-------------------------------------------------------------------------------- |
| `-p`, `--pipeline` | Pipeline to target (default `default`).                                           |
| `--db`             | Database the secret belongs to: a source name, or `target`.                       |
| `--file`           | Read the secret value from the file at this path.                                 |
| `--literal`        | Use this literal string as the secret value.                                      |
| `--wait`           | Wait for the pipeline to reach the expected state (default `true`).               |
| `--timeout`        | Maximum time to wait for the pipeline to reach the expected state (default `2m`). |

This command also accepts the
[global options]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di#global-options" >}}).

## Example

```bash
# Value from an argument
redis-di set-secret USERNAME --db mysql myuser

# Value from a file (for example, a certificate)
redis-di set-secret CACERT --db mysql --file /path/to/myca.crt

# Value read from an interactive prompt
redis-di set-secret PASSWORD --db mysql

# Target database credentials
redis-di set-secret PASSWORD --db target mypassword
```
