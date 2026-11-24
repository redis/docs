---
Title: redis-di get-job
linkTitle: redis-di get-job
description: Gets a job of a pipeline
weight: 10
alwaysopen: false
categories: ["redis-di"]
url: '/integrate/redis-data-integration/1.19.1/reference/cli/redis-di-get-job/'
---

Gets a single job of a pipeline and prints it in the compact `list-jobs` table format. Use
[`describe-job`](/content/integrate/redis-data-integration/1.19.1/reference/cli/redis-di-describe-job.md)
for the full job view with its transformations and outputs.

## Usage

```
redis-di get-job <name> [flags]
```

## Options

| Option             | Description                                          |
| :----------------- | :--------------------------------------------------- |
| `-p`, `--pipeline` | Pipeline to target (default `default`).              |
| `-o`, `--output`   | Output format: `table` (default), `json`, or `yaml`. |

This command also accepts the
[global options](/content/integrate/redis-data-integration/1.19.1/reference/cli/redis-di.md#global-options).

## Example

```bash
redis-di get-job customers_hash_job
```
