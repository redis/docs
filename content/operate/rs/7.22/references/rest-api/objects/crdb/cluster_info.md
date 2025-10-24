---
Title: CRDB cluster info object
alwaysopen: false
categories:
- docs
- operate
- rs
description: An object that represents Active-Active cluster info
linkTitle: cluster_info
weight: $weight
url: '/operate/rs/7.22/references/rest-api/objects/crdb/cluster_info/'
---

Configuration details for a cluster that is part of an Active-Active database.

| Name | Type/Value | Description |
|------|------------|-------------|
| credentials | {{<code>}}
{
  "username": string,
  "password": string
} {{</code>}} | Cluster access credentials (required) |
| name | string | Cluster fully qualified name, used to uniquely identify the cluster. Typically this is the same as the hostname used in the URL, although in some configruations the URL may point to a different name/address. (required) |
| replication_endpoint | string | Address to use for peer replication. If not specified, it is assumed that standard cluster naming conventions apply. |
| replication_tls_sni | string | Cluster SNI for TLS connections |
| url | string | Cluster access URL (required) |
