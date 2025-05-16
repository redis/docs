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
| id | string | CRDB task ID (read only) |
| crdb_guid | string | Globally unique Active-Active database ID (GUID) (read-only) |
| errors | {{<code>}}
[{
  "cluster_name": string,
  "description": string,
  "error_code": string
}, ...] {{</code>}} | Details for errors that occurred on a cluster |
| status | 'queued' <br />'started' <br />'finished' <br />'failed' | CRDB task status (read only) |
