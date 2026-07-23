---
Title: redis-di
linkTitle: redis-di
description: Command line tool to manage Redis Data Integration
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases:
---

`redis-di` is the command line tool that manages Redis Data Integration (RDI). It is a thin client
over the RDI API and works the same way for VM, Kubernetes, and Redis Cloud installations. See the
[CLI reference overview]({{< relref "/integrate/redis-data-integration/reference/cli" >}}) for an
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

{{< note >}}Setting both `--user` and `--account-key` is an error, because they select mutually exclusive
authentication modes. Setting both `--cacert` and `--insecure` is also an error.{{< /note >}}

## Commands

| Command                                                                                                                        | Description                                                              |
| :----------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------- |
| [`info`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-info" >}})                                       | Displays information about the RDI deployment                            |
| [`list`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-list" >}})                                       | Lists all pipelines                                                      |
| [`get`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-get" >}})                                         | Gets a pipeline                                                          |
| [`describe`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-describe" >}})                               | Describes a pipeline with its status (alias `status`)                    |
| [`deploy`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-deploy" >}})                                   | Deploys a pipeline with the specified configuration (alias `set`)        |
| [`delete`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-delete" >}})                                   | Deletes a pipeline                                                       |
| [`start`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-start" >}})                                     | Starts a pipeline                                                        |
| [`stop`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-stop" >}})                                       | Stops a pipeline                                                         |
| [`reset`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-reset" >}})                                     | Resets a pipeline                                                        |
| [`list-secrets`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-list-secrets" >}})                       | Lists the secrets of a pipeline                                          |
| [`get-secret`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-get-secret" >}})                           | Gets a secret of a pipeline                                              |
| [`describe-secret`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-describe-secret" >}})                 | Describes a secret of a pipeline                                         |
| [`set-secret`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-set-secret" >}})                           | Creates or updates a secret of a pipeline                                |
| [`delete-secret`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-delete-secret" >}})                     | Deletes a secret of a pipeline                                           |
| [`list-dlqs`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-list-dlqs" >}})                             | Lists the dead-letter queues of a pipeline                               |
| [`get-dlq`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-get-dlq" >}})                                 | Gets a dead-letter queue of a pipeline                                   |
| [`list-dlq-records`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-list-dlq-records" >}})               | Lists the rejected records of a dead-letter queue (alias `get-rejected`) |
| [`list-jobs`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-list-jobs" >}})                             | Lists the jobs of a pipeline                                             |
| [`get-job`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-get-job" >}})                                 | Gets a job of a pipeline                                                 |
| [`describe-job`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-describe-job" >}})                       | Describes a job of a pipeline                                            |
| [`list-metric-collections`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-list-metric-collections" >}}) | Lists the metric collections of a pipeline                               |
| [`get-metric-collection`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-get-metric-collection" >}})     | Gets a metric collection of a pipeline                                   |
| [`scaffold`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-scaffold" >}})                               | Generates pipeline configuration files                                   |
| [`list-contexts`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-list-contexts" >}})                     | Lists all contexts                                                       |
| [`describe-context`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-describe-context" >}})               | Describes a context                                                      |
| [`set-context`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-set-context" >}})                         | Creates or updates a context                                             |
| [`use-context`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-use-context" >}})                         | Sets a context to be the active one                                      |
| [`delete-context`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-delete-context" >}})                   | Deletes a context                                                        |
| [`completion`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-completion" >}})                           | Generates a shell autocompletion script                                  |

On VM installations, the CLI also exposes the
[`configure-rdi`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-configure-rdi" >}}),
[`dump-support-package`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-dump-support-package" >}}),
and `admin` administration commands.
