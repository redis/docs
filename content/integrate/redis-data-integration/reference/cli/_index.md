---
Title: CLI reference
aliases:
  - /integrate/redis-data-integration/ingest/reference/cli/
  - /integrate/redis-data-integration/reference/cli/redis-di-install/
  - /integrate/redis-data-integration/reference/cli/redis-di-upgrade/
  - /integrate/redis-data-integration/reference/cli/redis-di-monitor/
  - /integrate/redis-data-integration/reference/cli/redis-di-trace/
alwaysopen: false
categories:
  - docs
  - integrate
  - rs
  - rdi
description: Reference for the RDI CLI commands
group: di
hideListLinks: false
linkTitle: CLI commands
summary:
  Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 60
---

`redis-di` is the command line tool that manages Redis Data Integration (RDI).
It is a thin client over the RDI REST API, so it works the same way for all
installation types: [VM](/content/integrate/redis-data-integration/installation/install-vm.md),
[Kubernetes](/content/integrate/redis-data-integration/installation/install-k8s.md), and Redis Cloud.
Use it to deploy pipelines, manage secrets, inspect status and metrics, and read rejected records.

> [!NOTE]
> RDI 1.19.0 introduced the current API-based CLI. If you are moving from an earlier RDI version,
> see [Compare the previous and current RDI CLI](/content/integrate/redis-data-integration/reference/cli/previous-cli-comparison.md)
> for the connection, context, command, and output changes.

## Connecting to the API

Most commands connect to the RDI API, which you specify with the `--api-url` option (or the
`RDI_API_URL` environment variable). Because the API is served over HTTPS, you can also supply
`--cacert` to trust a private or self-signed certificate, or `--insecure` to skip TLS verification.

The CLI supports three authentication modes, selected by the credentials you provide:

- **User authentication** (JWT): when you set a `--user`, the CLI logs in with that user and a
  password from `--password`, the `RDI_PASSWORD` environment variable, or an interactive prompt.
  This is the usual mode for VM and Kubernetes installations.
- **Redis Cloud authentication**: when you set an `--account-key`, the CLI authenticates to the
  Redis Cloud API gateway with that account key and a user key from `--user-key`, the `RDI_USER_KEY`
  environment variable, or an interactive prompt. This is the mode for RDI running in Redis Cloud.
- **No authentication**: when you set neither a user nor an account key, the CLI connects without
  authenticating, which is the mode to use when authentication is disabled in the API.

Setting both `--user` and `--account-key` is an error, as is setting both `--cacert` and `--insecure`.
Passwords and user keys are secrets and are never stored on disk.

## Contexts

Instead of passing the connection options on every command, you can save them in a _context_.
Contexts are stored in a `~/.redis-di` file that holds a map of named contexts and the active one,
similar to a `kubeconfig` file. Each context sets an `api-url`, an optional `user` or `account-key`,
and either a `cacert` or `insecure: true`. Secrets (the password and user key) are never stored, so
you still supply them per session.

```yaml
# ~/.redis-di
current-context: prod
contexts:
  prod:
    api-url: https://rdi.example.com
    user: default
    cacert: /etc/rdi/ingress-ca.crt
  dev:
    api-url: https://localhost:8443
    insecure: true
```

Use the [`set-context`](/content/integrate/redis-data-integration/reference/cli/redis-di-set-context.md)
and [`use-context`](/content/integrate/redis-data-integration/reference/cli/redis-di-use-context.md)
commands to create and select contexts rather than editing the file by hand.

## Commands

Pipeline-scoped commands take the pipeline name as an optional positional argument that defaults to
`default`, for example `redis-di start [pipeline]`. Sub-resource commands (for a secret, DLQ, or job)
take their own key or name as the positional argument and target the pipeline with the `-p` / `--pipeline`
option, which also defaults to `default`.

There are two command options that select a particular database of the pipeline. The secret commands take `--db` with
a source name or `target` to address that database's secrets, and the `start`, `stop`, and `reset` commands take
`--source` with a source name to act on that source alone. See
[Multiple sources in one pipeline](/content/integrate/redis-data-integration/data-pipelines/multiple-sources.md) for more information.

The commands group as follows:

- **Information**: [`info`](/content/integrate/redis-data-integration/reference/cli/redis-di-info.md).
- **Pipelines**: [`list`](/content/integrate/redis-data-integration/reference/cli/redis-di-list.md),
  [`get`](/content/integrate/redis-data-integration/reference/cli/redis-di-get.md),
  [`describe`](/content/integrate/redis-data-integration/reference/cli/redis-di-describe.md) (alias `status`),
  [`deploy`](/content/integrate/redis-data-integration/reference/cli/redis-di-deploy.md) (alias `set`),
  [`start`](/content/integrate/redis-data-integration/reference/cli/redis-di-start.md),
  [`stop`](/content/integrate/redis-data-integration/reference/cli/redis-di-stop.md), and
  [`reset`](/content/integrate/redis-data-integration/reference/cli/redis-di-reset.md).
- **Secrets**: [`list-secrets`](/content/integrate/redis-data-integration/reference/cli/redis-di-list-secrets.md),
  [`get-secret`](/content/integrate/redis-data-integration/reference/cli/redis-di-get-secret.md),
  [`describe-secret`](/content/integrate/redis-data-integration/reference/cli/redis-di-describe-secret.md),
  [`set-secret`](/content/integrate/redis-data-integration/reference/cli/redis-di-set-secret.md), and
  [`delete-secret`](/content/integrate/redis-data-integration/reference/cli/redis-di-delete-secret.md).
- **Dead-letter queues**: [`list-dlqs`](/content/integrate/redis-data-integration/reference/cli/redis-di-list-dlqs.md),
  [`get-dlq`](/content/integrate/redis-data-integration/reference/cli/redis-di-get-dlq.md), and
  [`list-dlq-records`](/content/integrate/redis-data-integration/reference/cli/redis-di-list-dlq-records.md) (alias `get-rejected`).
- **Jobs**: [`list-jobs`](/content/integrate/redis-data-integration/reference/cli/redis-di-list-jobs.md),
  [`get-job`](/content/integrate/redis-data-integration/reference/cli/redis-di-get-job.md), and
  [`describe-job`](/content/integrate/redis-data-integration/reference/cli/redis-di-describe-job.md).
- **Metric collections**: [`list-metric-collections`](/content/integrate/redis-data-integration/reference/cli/redis-di-list-metric-collections.md) and
  [`get-metric-collection`](/content/integrate/redis-data-integration/reference/cli/redis-di-get-metric-collection.md).
- **Scaffolding**: [`scaffold`](/content/integrate/redis-data-integration/reference/cli/redis-di-scaffold.md)
- **Contexts**: [`list-contexts`](/content/integrate/redis-data-integration/reference/cli/redis-di-list-contexts.md),
  [`describe-context`](/content/integrate/redis-data-integration/reference/cli/redis-di-describe-context.md),
  [`set-context`](/content/integrate/redis-data-integration/reference/cli/redis-di-set-context.md),
  [`use-context`](/content/integrate/redis-data-integration/reference/cli/redis-di-use-context.md), and
  [`delete-context`](/content/integrate/redis-data-integration/reference/cli/redis-di-delete-context.md).

On VM installations, the CLI also exposes the
[`configure-rdi`](/content/integrate/redis-data-integration/reference/cli/redis-di-configure-rdi.md) and
[`dump-support-package`](/content/integrate/redis-data-integration/reference/cli/redis-di-dump-support-package.md)
administration commands.

See the [`redis-di`](/content/integrate/redis-data-integration/reference/cli/redis-di.md) page for the
global options that apply to every command.

## Output formats

The `list` and `get` commands print an aligned, column-based table by default. Pass `-o` / `--output`
with `json` or `yaml` to emit the underlying data instead, which is useful for scripting and for tools
such as `jq`. The `describe` commands always print a human-readable, sectioned layout.
