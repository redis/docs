---
Title: redis-di delete
linkTitle: redis-di delete
description: Deleting a pipeline is not supported
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases:
  - /integrate/redis-data-integration/ingest/reference/cli/redis-di-delete/
---

Deleting a pipeline is currently not supported, and the `redis-di delete` command is no longer
available.

To stop a pipeline and discard its configuration, deploy an empty configuration instead:

```bash
redis-di deploy --empty
```

See [Clear a pipeline]({{< relref "/integrate/redis-data-integration/data-pipelines/deploy#clear-a-pipeline" >}})
for what this removes and what it keeps, and
[`redis-di deploy`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-deploy" >}})
for the command's options.
