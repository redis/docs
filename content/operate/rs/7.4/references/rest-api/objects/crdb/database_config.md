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
url: '/operate/rs/7.4/references/rest-api/objects/crdb/database_config/'
---

An object that represents the database configuration.

| Name | Type/Value | Description |
|------|------------|-------------|
| aof_policy | string | Policy for Append-Only File data persistence |
| authentication_admin_pass | string | Administrative databases access token |
| authentication_redis_pass | string | Redis AUTH password (deprecated as of Redis Enterprise v7.2, replaced with multiple passwords feature in version 6.0.X) |
| bigstore | boolean | Database driver is Auto Tiering |
| bigstore_ram_size | integer | Memory size of RAM size |
| data_persistence | string | Database on-disk persistence |
| enforce_client_authentication | **'enabled'** <br />'disabled' | Require authentication of client certificates for SSL connections to the database. If enabled, a certificate should be provided in either <span class="break-all">`authentication_ssl_client_certs`</span> or <span class="break-all">`authentication_ssl_crdt_certs`</span> |
| max_aof_file_size | integer | Hint for maximum AOF file size |
| max_aof_load_time | integer | Hint for maximum AOF reload time |
| memory_size | integer | Database memory size limit, in bytes |
| oss_cluster | boolean | Enables OSS Cluster mode |
| oss_cluster_api_preferred_ip_type | string | Indicates preferred IP type in OSS cluster API: internal/external |
| oss_sharding | boolean | An alternative to shard_key_regex for using the common case of the OSS shard hashing policy |
| port | integer | TCP port for database access |
| proxy_policy | string | The policy used for proxy binding to the endpoint |
| rack_aware | boolean | Require the database to be always replicated across multiple racks |
| replication | boolean | Database replication |
| sharding | boolean (default:&nbsp;false) | Cluster mode (server-side sharding). When true, shard hashing rules must be provided by either `oss_sharding` or `shard_key_regex` |
| shard_key_regex | `[{ "regex": string }, ...]` | Custom keyname-based sharding rules (required if sharding is enabled)<br /><br />To use the default rules you should set the value to:<br />`[{"regex": ".*\\{(?<tag>.*)\\}.*"}, {"regex": "(?<tag>.*)"}]` |
| shards_count | integer | Number of database shards |
| shards_placement | string | Control the density of shards: should they reside on as few or as many nodes as possible |
| snapshot_policy | array of [snapshot_policy]({{< relref "/operate/rs/7.4/references/rest-api/objects/bdb/snapshot_policy" >}}) objects | Policy for snapshot-based data persistence (required) |
| tls_mode | string | Encrypt communication |
