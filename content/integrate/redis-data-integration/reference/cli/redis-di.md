---
Title: redis-di
linkTitle: redis-di
description: Command line tool to manage Redis Data Integration
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases:
- /integrate/redis-data-integration/ingest/reference/cli/redis-di/
---

`redis-di` is the command line tool that manages Redis Data Integration (RDI). It is a thin client
over the RDI API and works the same way for VM, Kubernetes, and Redis Cloud installations. See the
[CLI reference overview](/content/integrate/redis-data-integration/reference/cli/_index.md) for an
introduction to connecting, authentication, and contexts.

## Usage

```
redis-di [command]
```

Run `redis-di help` (or `redis-di --help`) to list every command, and `redis-di help <command>`
(or `redis-di <command> --help`) to print the usage, flags, and arguments for a single command.

## Global options

These options apply to every command. Each one can also be set through an `RDI_`-prefixed environment
variable, for example `RDI_API_URL`, `RDI_USER`, or `RDI_PASSWORD`. Setting a secret such as the
password through an environment variable keeps it out of your shell history.

| Option            | Environment variable | Description                                                                                                     |
| :---------------- | :------------------- | :-------------------------------------------------------------------------------------------------------------- |
| `--api-url`       | `RDI_API_URL`        | RDI API base URL.                                                                                               |
| `--user`          | `RDI_USER`           | User for API (JWT) authentication.                                                                              |
| `--password`      | `RDI_PASSWORD`       | Password for API (JWT) authentication. Prompted for if a user is set and no password is supplied.               |
| `--account-key`   | `RDI_ACCOUNT_KEY`    | Redis Cloud account key for API authentication.                                                                 |
| `--user-key`      | `RDI_USER_KEY`       | Redis Cloud user key for API authentication. Prompted for if an account key is set and no user key is supplied. |
| `--cacert`        | `RDI_CACERT`         | CA certificate that verifies the API ingress.                                                                   |
| `--insecure`      | `RDI_INSECURE`       | Skip TLS verification of the API ingress (insecure). Mutually exclusive with `--cacert`.                        |
| `--context`       | `RDI_CONTEXT`        | Context to use instead of the active one.                                                                       |
| `--log-level`     | `RDI_LOG_LEVEL`      | Log level: `TRACE`, `DEBUG`, `INFO`, `WARNING`, or `ERROR` (default `INFO`).                                    |
| `-v`, `--verbose` |                      | Enable verbose logging, equivalent to `--log-level DEBUG`.                                                      |
| `--version`       |                      | Print the version and build metadata and exit.                                                                  |
| `-h`, `--help`    |                      | Print help for the CLI or a command.                                                                            |

> [!NOTE]
> Setting both `--user` and `--account-key` is an error, because they select mutually exclusive
> authentication modes. Setting both `--cacert` and `--insecure` is also an error.

## Commands

| Command                                                                                                                        | Description                                                              |
| :----------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------- |
| [`info`](/content/integrate/redis-data-integration/reference/cli/redis-di-info.md)                                       | Displays information about the RDI deployment                            |
| [`list`](/content/integrate/redis-data-integration/reference/cli/redis-di-list.md)                                       | Lists all pipelines                                                      |
| [`get`](/content/integrate/redis-data-integration/reference/cli/redis-di-get.md)                                         | Gets a pipeline                                                          |
| [`describe`](/content/integrate/redis-data-integration/reference/cli/redis-di-describe.md)                               | Describes a pipeline with its status (alias `status`)                    |
| [`deploy`](/content/integrate/redis-data-integration/reference/cli/redis-di-deploy.md)                                   | Deploys a pipeline with the specified configuration (alias `set`)        |
| [`start`](/content/integrate/redis-data-integration/reference/cli/redis-di-start.md)                                     | Starts a pipeline                                                        |
| [`stop`](/content/integrate/redis-data-integration/reference/cli/redis-di-stop.md)                                       | Stops a pipeline                                                         |
| [`reset`](/content/integrate/redis-data-integration/reference/cli/redis-di-reset.md)                                     | Resets a pipeline                                                        |
| [`list-secrets`](/content/integrate/redis-data-integration/reference/cli/redis-di-list-secrets.md)                       | Lists the secrets of a pipeline                                          |
| [`get-secret`](/content/integrate/redis-data-integration/reference/cli/redis-di-get-secret.md)                           | Gets a secret of a pipeline                                              |
| [`describe-secret`](/content/integrate/redis-data-integration/reference/cli/redis-di-describe-secret.md)                 | Describes a secret of a pipeline                                         |
| [`set-secret`](/content/integrate/redis-data-integration/reference/cli/redis-di-set-secret.md)                           | Creates or updates a secret of a pipeline                                |
| [`delete-secret`](/content/integrate/redis-data-integration/reference/cli/redis-di-delete-secret.md)                     | Deletes a secret of a pipeline                                           |
| [`list-dlqs`](/content/integrate/redis-data-integration/reference/cli/redis-di-list-dlqs.md)                             | Lists the dead-letter queues of a pipeline                               |
| [`get-dlq`](/content/integrate/redis-data-integration/reference/cli/redis-di-get-dlq.md)                                 | Gets a dead-letter queue of a pipeline                                   |
| [`list-dlq-records`](/content/integrate/redis-data-integration/reference/cli/redis-di-list-dlq-records.md)               | Lists the rejected records of a dead-letter queue (alias `get-rejected`) |
| [`list-jobs`](/content/integrate/redis-data-integration/reference/cli/redis-di-list-jobs.md)                             | Lists the jobs of a pipeline                                             |
| [`get-job`](/content/integrate/redis-data-integration/reference/cli/redis-di-get-job.md)                                 | Gets a job of a pipeline                                                 |
| [`describe-job`](/content/integrate/redis-data-integration/reference/cli/redis-di-describe-job.md)                       | Describes a job of a pipeline                                            |
| [`list-metric-collections`](/content/integrate/redis-data-integration/reference/cli/redis-di-list-metric-collections.md) | Lists the metric collections of a pipeline                               |
| [`get-metric-collection`](/content/integrate/redis-data-integration/reference/cli/redis-di-get-metric-collection.md)     | Gets a metric collection of a pipeline                                   |
| [`scaffold`](/content/integrate/redis-data-integration/reference/cli/redis-di-scaffold.md)                               | Generates pipeline configuration files                                   |
| [`list-contexts`](/content/integrate/redis-data-integration/reference/cli/redis-di-list-contexts.md)                     | Lists all contexts                                                       |
| [`describe-context`](/content/integrate/redis-data-integration/reference/cli/redis-di-describe-context.md)               | Describes a context                                                      |
| [`set-context`](/content/integrate/redis-data-integration/reference/cli/redis-di-set-context.md)                         | Creates or updates a context                                             |
| [`use-context`](/content/integrate/redis-data-integration/reference/cli/redis-di-use-context.md)                         | Sets a context to be the active one                                      |
| [`delete-context`](/content/integrate/redis-data-integration/reference/cli/redis-di-delete-context.md)                   | Deletes a context                                                        |
| [`completion`](/content/integrate/redis-data-integration/reference/cli/redis-di-completion.md)                           | Generates a shell autocompletion script                                  |

On VM installations, the CLI also exposes the
[`configure-rdi`](/content/integrate/redis-data-integration/reference/cli/redis-di-configure-rdi.md),
[`dump-support-package`](/content/integrate/redis-data-integration/reference/cli/redis-di-dump-support-package.md),
and `admin` administration commands.
