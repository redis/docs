---
Title: Bootstrap object
alwaysopen: false
categories:
- docs
- operate
- rs
description: An object for bootstrap configuration
hideListLinks: true
linkTitle: bootstrap
weight: $weight
url: '/operate/rs/7.22/references/rest-api/objects/bootstrap/'
---

A bootstrap configuration object.

| Name | Type/Value | Description |
|------|------------|-------------|
| action | 'create_cluster'<br />'join_cluster'<br />'recover_cluster' | Action to perform |
| cluster | [cluster_identity]({{< relref "/operate/rs/7.22/references/rest-api/objects/bootstrap/cluster_identity" >}}) object | Cluster to join or create |
| cnm_https_port | integer | Port to join a cluster with non-default cnm_https port |
| crdb_coordinator_port | integer, (range:&nbsp;1024-65535) (default:&nbsp;9081) | CRDB coordinator port |
| credentials | [credentials]({{< relref "/operate/rs/7.22/references/rest-api/objects/bootstrap/credentials" >}}) object | Cluster admin credentials |
| dns_suffixes | {{<code>}}
[{
  "name": string,
  "cluster_default": boolean,
  "use_aaaa_ns": boolean,
  "use_internal_addr": boolean,
  "slaves": array
}, ...]
{{</code>}} | Explicit configuration of DNS suffixes<br />**name**: DNS suffix name<br />**cluster_default**: Should this suffix be the default cluster suffix<br />**use_aaaa_ns**: Should AAAA records be published for NS records<br />**use_internal_addr**: Should internal cluster IPs be published for databases<br />**slaves**: List of replica servers that should be published as NS and notified |
| envoy_admin_port | integer, (range:&nbsp;1024-65535) | Envoy admin port. Changing this port during runtime might result in an empty response because envoy serves as the cluster gateway.|
| envoy_mgmt_server_port | integer, (range:&nbsp;1024-65535) | Envoy management server port|
| gossip_envoy_admin_port | integer, (range:&nbsp;1024-65535) | Gossip envoy admin port|
| license | string | License string. If not provided, a trial license is set by default. |
| max_retries | integer | Max number of retries in case of recoverable errors |
| node | [node_identity]({{< relref "/operate/rs/7.22/references/rest-api/objects/bootstrap/node_identity" >}}) object | Node description |
| policy | [policy]({{< relref "/operate/rs/7.22/references/rest-api/objects/bootstrap/policy" >}}) object | Policy object |
| recovery_filename | string | Name of backup file to recover from |
| required_version | string | This node can only join the cluster if all nodes in the cluster have a version greater than the required_version (deprecated as of Redis Enterprise Software v7.8.6) |
| retry_time | integer | Max waiting time between retries (in seconds) |


