---
Title: Endpoints stats requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Endpoint statistics requests
headerRange: '[1-2]'
hideListLinks: true
linkTitle: endpoints/stats
weight: $weight
url: '/operate/rs/7.4/references/rest-api/requests/endpoints-stats/'
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-endpoints-stats) | `/v1/endpoints/stats` | Get stats for all endpoints |

## Get all endpoints stats {#get-endpoints-stats}

	GET /v1/endpoints/stats

Get statistics for all endpoint-proxy links.

{{<note>}}
This method will return both endpoints and listeners stats for backwards
compatability.
{{</note>}}

#### Required permissions

| Permission name |
|-----------------|
| [view_endpoint_stats]({{< relref "/operate/rs/references/rest-api/permissions#view_endpoint_stats" >}}) |

### Request {#get-request} 

#### Example HTTP request

	GET /v1/endpoints/stats?interval=1hour&stime=2014-08-28T10:00:00Z 


#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |


#### Query parameters

| Field | Type | Description |
|-------|------|-------------|
| interval | string | Time interval for which we want stats: 1sec/10sec/5min/15min/1hour/12hour/1week (optional) |
| stime | ISO_8601 | Start time from which we want the stats. Should comply with the [ISO_8601](https://en.wikipedia.org/wiki/ISO_8601) format (optional) |
| etime | ISO_8601 | End time after which we don't want the stats. Should comply with the [ISO_8601](https://en.wikipedia.org/wiki/ISO_8601) format (optional) |

### Response {#get-response} 

The `uid` format in the response is: `"BDB_UID:ENDPOINT_UID:PROXY_UID"`

For example: `{"uid": "1:2:3"}` means `BDB_UID=1`, `ENDPOINT_UID=2`, and `PROXY_UID=3`

#### Example JSON body

```json
[
   {
      "uid" : "365:1:1",
      "intervals" : [
         {
            "interval" : "10sec",
            "total_req" : 0,
            "egress_bytes" : 0,
            "cmd_get" : 0,
            "monitor_sessions_count" : 0,
            "auth_errors" : 0,
            "acc_latency" : 0,
            "stime" : "2017-01-12T14:59:50Z",
            "write_res" : 0,
            "total_connections_received" : 0,
            "cmd_set" : 0,
            "read_req" : 0,
            "max_connections_exceeded" : 0,
            "acc_write_latency" : 0,
            "write_req" : 0,
            "other_res" : 0,
            "cmd_flush" : 0,
            "acc_read_latency" : 0,
            "other_req" : 0,
            "conns" : 0,
            "write_started_res" : 0,
            "cmd_touch" : 0,
            "read_res" : 0,
            "auth_cmds" : 0,
            "etime" : "2017-01-12T15:00:00Z",
            "total_started_res" : 0,
            "ingress_bytes" : 0,
            "last_res_time" : 0,
            "read_started_res" : 0,
            "acc_other_latency" : 0,
            "total_res" : 0,
            "last_req_time" : 0,
            "other_started_res" : 0
         }
      ]
   },
   {
      "intervals" : [
         {
            "acc_read_latency" : 0,
            "other_req" : 0,
            "etime" : "2017-01-12T15:00:00Z",
            "auth_cmds" : 0,
            "total_started_res" : 0,
            "write_started_res" : 0,
            "cmd_touch" : 0,
            "conns" : 0,
            "read_res" : 0,
            "total_res" : 0,
            "other_started_res" : 0,
            "last_req_time" : 0,
            "read_started_res" : 0,
            "last_res_time" : 0,
            "ingress_bytes" : 0,
            "acc_other_latency" : 0,
            "egress_bytes" : 0,
            "interval" : "10sec",
            "total_req" : 0,
            "acc_latency" : 0,
            "auth_errors" : 0,
            "cmd_get" : 0,
            "monitor_sessions_count" : 0,
            "read_req" : 0,
            "max_connections_exceeded" : 0,
            "total_connections_received" : 0,
            "cmd_set" : 0,
            "acc_write_latency" : 0,
            "write_req" : 0,
            "stime" : "2017-01-12T14:59:50Z",
            "write_res" : 0,
            "cmd_flush" : 0,
            "other_res" : 0
         }
      ],
      "uid" : "333:1:2"
   }
]
```

### Status codes {#get-status-codes} 

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | No error |
