---
Title: Deploy a pipeline
aliases: /integrate/redis-data-integration/ingest/data-pipelines/data-type-handling/
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Learn how to deploy an RDI pipeline
group: di
linkTitle: Deploy
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 50
---

When you have created your configuration, including the
[jobs]({{< relref "/integrate/redis-data-integration/data-pipelines/transform-examples" >}}),
and [set the authentication secrets]({{< relref "/integrate/redis-data-integration/data-pipelines/set-secrets" >}})
for your source and target databases, you are ready to deploy. Use
[Redis Insight]({{< relref "/develop/tools/insight/rdi-connector" >}})
to configure and deploy pipelines for both VM and K8s installations.

For VM installations, you can also use the
[`redis-di deploy`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-deploy" >}})
command to deploy a pipeline:

```bash
redis-di deploy --dir <path to pipeline folder>
```
