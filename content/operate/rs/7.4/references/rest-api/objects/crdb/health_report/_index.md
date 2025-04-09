---
Title: CRDB health report object
alwaysopen: false
categories:
- docs
- operate
- rs
description: An object that represents an Active-Active database health report.
hideListLinks: true
linkTitle: health_report
weight: $weight
url: '/operate/rs/7.4/references/rest-api/objects/crdb/health_report/'
---

An object that represents an Active-Active database health report.

| Name | Type/Value | Description |
|------|------------|-------------|
| active_config_version | integer | Active configuration version |
| cluster_name | string | Name of local Active-Active cluster |
| configurations | array of [health_report_configuration]({{< relref "/operate/rs/7.4/references/rest-api/objects/crdb/health_report/health_report_configuration" >}}) objects | Stored database configurations |
| connection_error | string | Error string if remote cluster is not available |
| connections | {{<code>}}
[{
  "name": string,
  "replication_links": [ 
    {
      "link_uid": "bdb_uid:replica_uid", 
      "status": "up | down" 
    } ],
  "status": string
}, ...] {{</code>}} | Connections to other clusters and their statuses. A replication link's `bdb_uid` is the unique ID of a local database instance ([bdb]({{< relref "/operate/rs/7.4/references/rest-api/objects/bdb" >}})) in the current cluster. The `replica_uid` is the unique ID of the database's remote replica, located in the connected cluster. |
| name | string | Name of the Active-Active database |
