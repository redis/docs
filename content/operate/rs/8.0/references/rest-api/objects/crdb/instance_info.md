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
url: '/operate/rs/8.0/references/rest-api/objects/crdb/instance_info/'
---

An object that represents Active-Active instance info.

| Name | Type/Value | Description |
|------|------------|-------------|
| id | integer | Unique instance ID |
| cluster | [CRDB cluster_info](/content/operate/rs/8.0/references/rest-api/objects/crdb/cluster_info.md) object | |
| compression | integer | Compression level when syncing from this source |
| db_config | [CRDB database_config](/content/operate/rs/8.0/references/rest-api/objects/crdb/database_config.md) object | Database configuration for this specific instance. Use `db_config` only when you need to override or add configuration values that differ from the `default_db_config` in the main [CRDB object](/content/operate/rs/8.0/references/rest-api/objects/crdb/_index.md). For a list of which settings must be identical across all instances and which to set per instance, see the [CRDB database config object](/content/operate/rs/8.0/references/rest-api/objects/crdb/database_config.md) reference. |
| db_uid | string | ID of local database instance. This field is likely to be empty for instances other than the local one. |
