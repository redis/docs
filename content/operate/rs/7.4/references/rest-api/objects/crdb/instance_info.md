---
Title: CRDB instance info object
alwaysopen: false
categories:
- docs
- operate
- rs
description: An object that represents Active-Active instance info
linkTitle: instance_info
weight: $weight
url: '/operate/rs/7.4/references/rest-api/objects/crdb/instance_info/'
---

An object that represents Active-Active instance info.

| Name | Type/Value | Description |
|------|------------|-------------|
| id | integer | Unique instance ID |
| cluster | [CRDB cluster_info]({{< relref "/operate/rs/7.4/references/rest-api/objects/crdb/cluster_info" >}}) object | |
| compression | integer | Compression level when syncing from this source |
| db_config | [CRDB database_config]({{< relref "/operate/rs/7.4/references/rest-api/objects/crdb/database_config" >}}) object | Database configuration |
| db_uid | string | ID of local database instance. This field is likely to be empty for instances other than the local one. |
