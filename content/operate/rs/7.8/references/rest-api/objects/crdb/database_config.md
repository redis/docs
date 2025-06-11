---
Title: CRDB database config object
alwaysopen: false
categories:
- docs
- operate
- rs
description: An object that represents the database configuration
linkTitle: database_config
weight: $weight
url: '/operate/rs/7.8/references/rest-api/objects/crdb/database_config/'
---

An object that represents the database configuration.

| Name | Type/Value | Description |
|------|------------|-------------|
| aof_policy | **'appendfsync-every-sec'** <br />'appendfsync-always' | Policy for Append-Only File data persistence |
| authentication_admin_pass | string | Administrative databases access token |
| authentication_redis_pass | string | Redis AUTH password (deprecated as of Redis Enterprise v7.2, replaced with multiple passwords feature in version 6.0.X) |
| bigstore | boolean (default: false) | Database driver is Auto Tiering |
| bigstore_ram_size | integer (default: 0) | Memory size of RAM size |
| data_persistence | 'disabled'<br />'snapshot'<br />**'aof'** | Database on-disk persistence policy. For snapshot persistence, a [snapshot_policy]({{< relref "/operate/rs/7.8/references/rest-api/objects/bdb/snapshot_policy" >}}) must be provided |
| enforce_client_authentication | **'enabled'** <br />'disabled' | Require authentication of client certificates for SSL connections to the database. If enabled, a certificate should be provided in either <span class="break-all">`authentication_ssl_client_certs`</span> or <span class="break-all">`authentication_ssl_crdt_certs`</span> |
| max_aof_file_size | integer | Maximum AOF file size in bytes |
| max_aof_load_time | integer (default: 3600) | Maximum AOF reload time in seconds |
| memory_size | integer (default: 0) | Database memory size limit in bytes. 0 is unlimited. |
| oss_cluster | boolean (default: false) | Enables OSS Cluster mode |
| oss_cluster_api_preferred_ip_type | 'internal'<br />'external' | Indicates preferred IP type in OSS cluster API |
| oss_sharding | boolean (default: false) | An alternative to `shard_key_regex` for using the common case of the OSS shard hashing policy |
| port | integer | TCP port for database access |
| proxy_policy | 'single'<br />'all-master-shards'<br />'all-nodes' | The policy used for proxy binding to the endpoint |
| rack_aware | boolean (default: false) | Require the database to be always replicated across multiple racks |
| replication | boolean (default: true) | Database replication |
| sharding | boolean (default:&nbsp;false) | Cluster mode (server-side sharding). When true, shard hashing rules must be provided by either `oss_sharding` or `shard_key_regex` |
| shard_key_regex | `[{ "regex": string }, ...]` | Custom keyname-based sharding rules (required if sharding is enabled)<br /><br />To use the default rules you should set the value to:<br />`[{"regex": ".*\\{(?<tag>.*)\\}.*"}, {"regex": "(?<tag>.*)"}]` |
| shards_count | integer (range: 1-512) (default: 1) | Number of database shards |
| shards_placement | 'dense'<br />'sparse' | Control the density of shards<br />Values:<br />**'dense'**: Shards reside on as few nodes as possible <br /> **'sparse'**: Shards reside on as many nodes as possible |
| snapshot_policy | array of [snapshot_policy]({{< relref "/operate/rs/7.8/references/rest-api/objects/bdb/snapshot_policy" >}}) objects | Policy for snapshot-based data persistence. A dataset snapshot will be taken every N secs if there are at least M writes changes in the dataset. |
| tls_mode | 'enabled'<br /> **'disabled'** <br />'replica_ssl' | Encrypt communication |
