---
Title: redis-di describe-job
linkTitle: redis-di describe-job
description: Describes a job of a pipeline
weight: 10
alwaysopen: false
categories: ["redis-di"]
url: '/integrate/redis-data-integration/1.19.1/reference/cli/redis-di-describe-job/'
---

Describes a single job of a pipeline, printing its source properties followed by tables that
summarize its transformations and outputs.

## Usage

```
redis-di describe-job <name> [flags]
```

## Options

| Option             | Description                             |
| :----------------- | :-------------------------------------- |
| `-p`, `--pipeline` | Pipeline to target (default `default`). |

This command also accepts the
[global options]({{< relref "/integrate/redis-data-integration/1.19.1/reference/cli/redis-di#global-options" >}}).

## Example

```bash
redis-di describe-job customers_hash_job
```
