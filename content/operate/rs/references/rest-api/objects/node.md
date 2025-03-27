---
Title: Node object
alwaysopen: false
categories:
- docs
- operate
- rs
description: An object that represents a node in the cluster
linkTitle: node
weight: $weight
---

An API object that represents a node in the cluster.

| Name | Type/Value | Description |
|------|------------|-------------|
| uid | integer | Cluster unique ID of node (read-only) |
| accept_servers | boolean (default:&nbsp;true) | The node only accepts new shards if `accept_servers` is `true` |
| addr | string | Internal IP address of node |
| architecture | string | Hardware architecture (read-only) |
| bigredis_storage_path | string | Flash storage path (read-only) |
| bigstore_driver | 'ibm-capi-ga1'<br />'ibm-capi-ga2'<br />'ibm-capi-ga4'<br />'speedb'<br />'rocksdb' | Bigstore driver name or none (deprecated as of Redis Enterprise v7.2, use the [cluster object]({{< relref "/operate/rs/references/rest-api/objects/cluster" >}})'s bigstore_driver instead) |
| bigstore_size | integer | Storage size of bigstore storage (read-only) |
| cores | integer | Total number of CPU cores (read-only) |
| ephemeral_storage_path | string | Ephemeral storage path (read-only) |
| ephemeral_storage_size | number | Ephemeral storage size (bytes) (read-only) |
| external_addr | complex object | External IP addresses of node. `GET`&nbsp;`/jsonschema` to retrieve the object's structure. |
| max_listeners | integer | Maximum number of listeners on the node |
| max_redis_servers | integer | Maximum number of shards on the node |
| os_family | 'rhel'<br />'ubuntu'<br />'amzn' | Operating system family (read-only) |
| os_name | string | Operating system name (read-only) |
| os_semantic_version | string | Full version number (read-only) |
| os_version | string | Installed OS version (human-readable) (read-only) |
| persistent_storage_path | string | Persistent storage path (read-only) |
| persistent_storage_size | number | Persistent storage size (bytes) (read- only) |
| public_addr | string | Public IP address of node (deprecated as of Redis Enterprise v4.3.3, use external_addr instead) |
| rack_id | string | Rack ID where node is installed |
| recovery_path | string | Recovery files path |
| second_rack_id | string | Second rack ID where node is installed |
| shard_count | integer | Number of shards on the node (read-only) |
| shard_list | array of integers | Cluster unique IDs of all node shards |
| software_version | string | Installed Redis Enterprise cluster software version (read-only) |
| status | 'active'<br />'decommissioning'<br />'down'<br />'provisioning' | Node status (read-only) |
| supported_database_versions | {{<code>}}
[{
  "db_type": string,
  "version": string
}, ...]
{{</code>}} | Versions of Redis Community Edition databases supported by Redis Enterprise Software on the node (read-only)<br />**db_type**: Type of database<br />**version**: Version of database |
| system_time | string | System time (UTC) (read-only) |
| total_memory | integer | Total memory of node (bytes) (read-only) |
| uptime | integer | System uptime (seconds) (read-only) |
| use_internal_ipv6 | boolean (default:&nbsp;false) | Node uses IPv6 for internal communication. Value is taken from bootstrap identity (read-only) |
