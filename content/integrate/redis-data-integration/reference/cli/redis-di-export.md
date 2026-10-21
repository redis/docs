---
Title: redis-di export
linkTitle: redis-di export
description: Exports a deployable pipeline configuration
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases: []
---

Exports the configuration of a deployed pipeline to a directory, as a `config.yaml` file and one
job file per job in its `jobs` subdirectory, named after the job. You can edit the exported files
and deploy them again with
[`redis-di deploy`](/content/integrate/redis-data-integration/reference/cli/redis-di-deploy.md),
to the same pipeline or to another one.

The export contains secret references such as `${MYSQL_DB_PASSWORD}`, but no secret values, and
the secrets themselves stay with the pipeline. Before you deploy an export to another pipeline or
to another RDI instance, set the secrets there with
[`redis-di set-secret`](/content/integrate/redis-data-integration/reference/cli/redis-di-set-secret.md).

If the directory already contains a configuration, the command asks for confirmation before it
replaces it, unless you pass `--force`. It replaces `config.yaml` and deletes the job files in
`jobs` that do not belong to the exported pipeline, and it leaves other files alone.

## Usage

```
redis-di export [pipeline] [flags]
```

The pipeline name is an optional argument that defaults to `default`.

## Options

| Option    | Description                                                                 |
| :-------- | :-------------------------------------------------------------------------- |
| `--dir`   | Directory to export `config.yaml` and `jobs/*.yaml` to (default `.`).       |
| `--force` | Replace an existing configuration in the directory without confirmation.    |

This command also accepts the
[global options](/content/integrate/redis-data-integration/reference/cli/redis-di.md#global-options).

## Example

```bash
# Export the configuration of the orders pipeline, then deploy it again after editing it
redis-di export orders --dir ./orders
redis-di deploy orders --dir ./orders

# Copy the default pipeline to the RDI instance of the context named staging,
# after setting its secrets there
redis-di export --dir ./copy
redis-di deploy --empty --context staging
redis-di deploy --dir ./copy --context staging
```
