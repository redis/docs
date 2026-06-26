---
Title: CRDB task object
alwaysopen: false
categories:
- docs
- operate
- rs
description: An object that represents a CRDB task
linkTitle: crdb_task
weight: $weight
url: '/operate/rs/7.8/references/rest-api/objects/crdb_task/'
---

An object that represents an Active-Active (CRDB) task.

| Name | Type/Value | Description |
|------|------------|-------------|
| id | string | CRDB task ID (read-only) |
| crdb_guid | string | Globally unique Active-Active database ID (GUID) (read-only) |
| ended | string | Timestamp when the task ended (read-only) |
| errors | {{<code>}}
[{
  "cluster_name": string,
  "description": string,
  "error_code": string
}, ...] {{</code>}} | Details for errors that occurred on a cluster |
| operation | string | The operation that is running (read-only) |
| progress | {{<code>}}
{
  "clusters": [{
    "name": string,
    "progress": string
  }, ...],
  "worker": string
} {{</code>}} | • `name`: The instance cluster name<br />• `progress`: The step the instance coordinator is running<br />• `worker`: The step the worker is running |
| started | string | Timestamp when the task started (read-only) |
| status | 'queued' <br />'started' <br />'finished' <br />'failed' | CRDB task status (read-only) |
| worker_name | string | The worker that runs the task (read-only) |
