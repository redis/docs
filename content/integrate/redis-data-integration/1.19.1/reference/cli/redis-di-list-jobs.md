---
Title: redis-di list-jobs
linkTitle: redis-di list-jobs
description: Lists the jobs of a pipeline
weight: 10
alwaysopen: false
categories: ["redis-di"]
url: '/integrate/redis-data-integration/1.19.1/reference/cli/redis-di-list-jobs/'
---

Lists the jobs of a pipeline, one row per job with its source, its transformation and output counts,
and the target connections of its outputs. Use
[`describe-job`](/content/integrate/redis-data-integration/1.19.1/reference/cli/redis-di-describe-job.md)
for the full view of a single job.

## Usage

```
redis-di list-jobs [flags]
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
redis-di list-jobs
```
