---
Title: Cluster last stats requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Most recent cluster statistics requests
headerRange: '[1-2]'
linkTitle: last
weight: $weight
url: '/operate/rs/7.8/references/rest-api/requests/cluster/stats/last/'
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-cluster-stats-last) | `/v1/cluster/stats/last` | Get most recent cluster stats |

## Get latest cluster stats {#get-cluster-stats-last}

	GET /v1/cluster/stats/last

Get the most recent cluster statistics.

#### Required permissions

| Permission name |
|-----------------|
| [view_cluster_stats]({{< relref "/operate/rs/references/rest-api/permissions#view_cluster_stats" >}}) |

### Request {#get-request} 

#### Example HTTP request

	GET /v1/cluster/stats/last?interval=1sec&stime=2015-10-14T06:44:00Z 


#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

#### Query parameters

| Field | Type | Description |
|-------|------|-------------|
| interval | string | Time interval for which we want stats: 1sec/10sec/5min/15min/1hour/12hour/1week. Default: 1sec. (optional) |
| stime | ISO_8601 | Start time from which we want the stats. Should comply with the [ISO_8601](https://en.wikipedia.org/wiki/ISO_8601) format (optional) |
| etime | ISO_8601 | End time after which we don't want the stats. Should comply with the [ISO_8601](https://en.wikipedia.org/wiki/ISO_8601) format (optional) |

### Response {#get-response} 

Returns the most recent [statistics]({{< relref "/operate/rs/references/rest-api/objects/statistics" >}}) for the cluster.

#### Example JSON body

```json
{
    "conns": 0.0,
    "cpu_idle": 0.8424999999988358,
    "cpu_system": 0.01749999999992724,
    "cpu_user": 0.08374999999978172,
    "egress_bytes": 7403.0,
    "ephemeral_storage_avail": 151638712320.0,
    "ephemeral_storage_free": 162375925760.0,
    "etime": "2015-10-14T06:44:01Z",
    "free_memory": 5862400000.0,
    "ingress_bytes": 7469.0,
    "interval": "1sec",
    "persistent_storage_avail": 151638712320.0,
    "persistent_storage_free": 162375925760.0,
    "stime": "2015-10-14T06:44:00Z",
    "total_req": 0.0
}
```

### Status codes {#get-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | No error |
| [500 Internal Server Error](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.5.1) | Internal server error |
