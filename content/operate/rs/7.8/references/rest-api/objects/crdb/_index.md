---
Title: CRDB object
alwaysopen: false
categories:
- docs
- operate
- rs
description: An object that represents an Active-Active database
hideListLinks: true
linkTitle: crdb
weight: $weight
url: '/operate/rs/7.8/references/rest-api/objects/crdb/'
---

An object that represents an Active-Active database.

| Name | Type/Value | Description |
|------|------------|-------------|
| guid | string | The global unique ID of the Active-Active database |
| causal_consistency | boolean | Enables causal consistency across CRDT instances |
| default_db_config| [CRDB database_config]({{< relref "/operate/rs/7.8/references/rest-api/objects/crdb/database_config" >}}) object | Default database configuration applied to all instances in the CRDB object. In most cases, instances should use the same configuration. If you need to override `default_db_config` or add configuration values for specific instances, you can use `db_config` in individual [instance objects]({{< relref "/operate/rs/7.8/references/rest-api/objects/crdb/instance_info" >}}). |
| encryption | boolean | Encrypt communication |
| featureset_version | integer | Active-Active database active FeatureSet version
| instances | array of [CRDB instance_info]({{< relref "/operate/rs/7.8/references/rest-api/objects/crdb/instance_info" >}}) objects | |
| local_databases | {{<code>}}[{
  "bdb_uid": string,
  "id": integer
}, ...] {{</code>}} | Mapping of instance IDs for local databases to local BDB IDs |
| managed_by | string | The component that manages the Active-Active database |
| modules | {{<code>}}[{
  "featureset_version": integer,
  "module_name": string
}, ...] {{</code>}} | Modules used by the Active-Active database |
| name | string | Name of Active-Active database |
| protocol_version | integer | Active-Active database active protocol version |
| volatile_config_fields | array of strings | A list of database configuration fields that will be set even if unchanged |
