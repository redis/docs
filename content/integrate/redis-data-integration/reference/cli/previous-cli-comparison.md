---
Title: Compare the previous and current RDI CLI
linkTitle: Previous CLI comparison
description: Compare the RDI CLI introduced in version 1.19.0 with the previous CLI
weight: 5
alwaysopen: false
categories: ["redis-di"]
aliases:
---

RDI 1.19.0 replaces the previous Python-based `redis-di` CLI with a Go-based CLI.
The executable name stays the same, and several command names are unchanged, but the
current CLI is not a drop-in replacement for the previous connection settings or contexts.

The most important difference is what the CLI connects to. The previous CLI connected
directly to the RDI database and the Kubernetes API. The current CLI is a thin client over
the RDI REST API.

## Compare the CLIs

| Area | Previous CLI (before RDI 1.19.0) | Current CLI (RDI 1.19.0 and later) |
| :--- | :------------------------------- | :---------------------------------- |
| Implementation | Python application | Self-contained Go binary |
| Installation types | VM installations | VM, Kubernetes, and Redis Cloud installations |
| Connection | RDI database and Kubernetes API | RDI REST API |
| Pipeline scope | The `default` pipeline | Multiple named pipelines; defaults to `default` |
| Connection options | `--rdi-host`, `--rdi-port`, `--rdi-user`, `--rdi-password`, and RDI database TLS options | `--api-url`, `--user`, `--password`, and API TLS options; Redis Cloud also supports `--account-key` and `--user-key` |
| Contexts | A list of RDI database connections in `~/.redis-di`, with an `is_active` field on each entry | A map of API connections in `~/.redis-di`, with one `current-context` |
| Output | Human-readable tables | Compact tables and sectioned descriptions; `list` and `get` commands also support JSON and YAML |
| Secrets | `set-secret` on VM installations; `rdi-secret.sh` for Kubernetes | Create, inspect, update, and delete operations through `redis-di` on every installation type |

## Update the connection options

Replace the RDI database address with the RDI API URL. For example, a previous CLI
invocation such as:

```bash
redis-di status \
  --rdi-host <rdi-database-host> \
  --rdi-port <rdi-database-port> \
  --rdi-user <user> \
  --rdi-password <password>
```

becomes:

```bash
redis-di describe \
  --api-url https://<rdi-api-host> \
  --user <user> \
  --password <password>
```

The current CLI does not accept the previous RDI database connection options on
API-based commands. Update scripts and environment variables as follows:

| Previous setting | Current setting |
| :--------------- | :-------------- |
| `--rdi-host` and `--rdi-port` | `--api-url` or `RDI_API_URL` |
| `--rdi-user` or `RDI_REDIS_USERNAME` | `--user` or `RDI_USER` |
| `--rdi-password` or `RDI_REDIS_PASSWORD` | `--password` or `RDI_PASSWORD` |
| `--rdi-cacert` | `--cacert` or `RDI_CACERT` |
| `--rdi-key`, `--rdi-cert`, `--rdi-key-password` | No equivalent; the CLI authenticates to the API instead of the RDI database |
| `--rdi-namespace` or `RDI_NAMESPACE` | No equivalent; pipeline operations go through the API |

For Redis Cloud, use `--account-key` with `--user-key` instead of `--user` with
`--password`. See the [CLI reference overview]({{< relref "/integrate/redis-data-integration/reference/cli#connecting-to-the-api" >}})
for all authentication modes.

## Recreate contexts

Both CLIs use `~/.redis-di`, but the file formats and stored connection details are
different. Previous contexts contain RDI database and Kubernetes connection details and
cannot be used as API contexts.

The standard VM [`upgrade.sh`]({{< relref "/integrate/redis-data-integration/installation/upgrade#upgrading-a-vm-installation" >}})
flow preserves the previous context for the VM administration commands and creates a
default API context. If you replace the CLI independently and still have a previous-format
`~/.redis-di` file, back it up before creating current contexts:

```bash
mv ~/.redis-di ~/.redis-di.pre-1.19

redis-di set-context <context-name> \
  --api-url https://<rdi-api-host> \
  --user <user>
redis-di use-context <context-name>
```

The context commands also changed meaning:

| Task | Previous CLI | Current CLI |
| :--- | :----------- | :---------- |
| Create a context | `redis-di add-context <name> [connection options]` | `redis-di set-context <name> [connection options]` |
| Select the active context | `redis-di set-context <name>` | `redis-di use-context <name>` |
| Update a context | Recreate the context | `redis-di set-context <name> [options to update]` |
| Remove all contexts | `redis-di delete-all-contexts` | Delete contexts individually with `redis-di delete-context <name>` |

Passwords and Redis Cloud user keys are not saved in current contexts. Supply them with an
environment variable, a command option, or the interactive prompt.

## Update commands

Pipeline lifecycle commands keep their previous names. They now take an optional pipeline
name that defaults to `default`:

```bash
redis-di deploy [pipeline] --dir <path>
redis-di start [pipeline]
redis-di stop [pipeline]
redis-di reset [pipeline]
```

Other common tasks changed as follows:

| Task | Previous CLI | Current CLI |
| :--- | :----------- | :---------- |
| Inspect pipeline status | `redis-di status` | `redis-di describe [pipeline]`; `status` remains an alias |
| Continuously refresh status | `redis-di status --live` | `watch -n 1 redis-di describe [pipeline]` |
| List pipelines | Not available | `redis-di list` |
| Get a pipeline | Not available | `redis-di get [pipeline]` |
| Delete a pipeline | Not available | `redis-di delete [pipeline]` |
| Inspect rejected records | `redis-di get-rejected [options]` | `redis-di list-dlqs`, then `redis-di list-dlq-records <dlq>`; `get-rejected` remains an alias |
| Inspect jobs | `redis-di list-jobs` and `redis-di describe-job <job>` | The same commands, with `--pipeline <pipeline>` for a non-default pipeline |
| Manage secrets | `redis-di set-secret <key> <value>` or `rdi-secret.sh` | `list-secrets`, `get-secret`, `describe-secret`, `set-secret`, and `delete-secret` |
| Install or upgrade RDI on a VM | `redis-di install` or `redis-di upgrade` | Run `install.sh` or `upgrade.sh` from the VM installation package |
| Install or upgrade RDI on Kubernetes | Not available | Use the RDI Helm chart |
| Trace pipeline records | `redis-di trace` | Removed |
| Create the RDI database | `redis-di create` | Removed; use the installation workflow |

On VM installations, `configure-rdi` and `dump-support-package` remain available through
`redis-di`. They are not available with a standalone CLI or on Kubernetes, Redis Cloud,
macOS, or Windows.

The current `describe` output is sourced from the API. It does not include the connected
Redis client list or Debezium offsets that the previous `status` command read directly.
The `--live`, `--page-number`, `--page-size`, and `--ingested-only` status options were
removed.

## Update scripts that read CLI output

The current CLI uses a compact, kubectl-style table for list operations and a sectioned,
human-readable layout for `describe` operations. Scripts that parse the previous bordered
tables must be updated.

For list and get operations, prefer machine-readable output instead of parsing a table:

```bash
redis-di list -o json
redis-di get <pipeline> -o yaml
redis-di list-secrets -o json
```

Command results are written to standard output and diagnostics are written to standard
error, so you can redirect or pipe results without including log messages.

## Verify the migration

After updating your contexts and commands:

1. Run `redis-di --version` and verify that it reports version 1.19.0 or later.
1. Run `redis-di info` to verify the API connection and RDI version.
1. Run `redis-di list` to verify that the expected pipelines are visible.
1. Run `redis-di describe [pipeline]` to verify pipeline status and metrics.
1. Run `redis-di help <command>` to review changed options before updating automation.
