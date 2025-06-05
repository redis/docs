---
Title: Optimize shards placement database action requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Optimize shard placement requests
headerRange: '[1-2]'
linkTitle: optimize_shards_placement
weight: $weight
url: '/operate/rs/7.4/references/rest-api/requests/bdbs/actions/optimize_shards_placement/'
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-bdbs-actions-optimize-shards-placement) | `/v1/bdbs/{uid}/actions/optimize_shards_placement` | Get optimized shards placement for a database  |


## Get optimized shards placement {#get-bdbs-actions-optimize-shards-placement}

```sh
GET /v1/bdbs/{int: uid}/actions/optimize_shards_placement
```

Get optimized shards placement for the given database.

#### Required permissions

| Permission name | Roles |
|-----------------|-------|
| [view_bdb_info]({{< relref "/operate/rs/7.4/references/rest-api/permissions#view_bdb_info" >}}) | admin<br />cluster_member<br />cluster_viewer<br />db_member<br />db_viewer |

### Request {#get-request}

#### Example HTTP request

```sh
GET /v1/bdbs/1/actions/optimize_shards_placement
```

#### Query parameters

Include query parameters in a `GET` request to generate an optimized shard placement blueprint for a database, using settings that are different from the database's current configuration.

| Field | Type | Description |
|-------|------|-------------|
| avoid_nodes | list of integers | Comma-separated list of cluster node IDs to avoid when placing the database’s shards and binding its endpoints (for example, `avoid_nodes=1,2`) |
| memory_size | integer (default:&nbsp;0) | Database memory limit (0 is unlimited), expressed in bytes |
| shards_count | integer, <nobr>(range: 1-512)</nobr> (default:&nbsp;1) | Number of database server-side shards |
| shards_placement | `dense` <br />`sparse` | Control the density of shards <br /> `dense`: Shards reside on as few nodes as possible <br /> `sparse`: Shards reside on as many nodes as possible |
| bigstore_ram_size | integer (default:&nbsp;0) | Memory size of bigstore RAM part, expressed in bytes |
| replication | `enabled`<br />`disabled` | In-memory database replication mode |

The following example request includes `shards_count` and `memory_size` as query parameters:

```sh
GET /v1/bdbs/1/actions/optimize_shards_placement?shards_count=10&memory_size=10000
```

### Response {#get-response}

To rearrange the database shards, you can submit the blueprint returned in this response body as the `shards_blueprint` field in the [`PUT`&nbsp;`/v1/bdbs/{uid}`](#put-bdbs-rearrange-shards) request.

#### Example JSON body

```json
[
    {
        "nodes": [
            {
                "node_uid": "3",
                "role": "master"
            },
            {
                "node_uid": "1",
                "role": "slave"
            }
        ],
        "slot_range": "5461-10922"
    },
    {
        "nodes": [
            {
                "node_uid": "3",
                "role": "master"
            },
            {
                "node_uid": "1",
                "role": "slave"
            }
        ],
        "slot_range": "10923-16383"
    },
    {
        "nodes": [
            {
                "node_uid": "3",
                "role": "master"
            },
            {
                "node_uid": "1",
                "role": "slave"
            }
        ],
        "slot_range": "0-5460"
    }
]
```

#### Headers

| Key | Value | Description |
|-----|-------|-------------|
| Content-Length | 352 | Length of the request body in octets |
| cluster-state-id | 30 | Cluster state ID |

#### Status codes {#get-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | No error |
| [404 Not Found](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.5) | Database UID does not exist |
| [406 Not Acceptable](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.7) | Not enough resources in the cluster to host the database |

## Rearrange database shards {#put-bdbs-rearrange-shards}

Use the blueprint returned by the [`GET`&nbsp;`/v1/bdbs/{uid}/actions/optimize_shards_placement`]({{< relref "/operate/rs/7.4/references/rest-api/requests/bdbs/actions/optimize_shards_placement#get-bdbs-actions-optimize-shards-placement" >}}) request as the value of the `shards_blueprint` field to rearrange the database shards.

To ensure that the optimized shard placement is relevant for the current cluster state, pass the `cluster-state-id`, taken from the response header of the `GET` request, in the [`PUT`&nbsp;`/v1/bdbs/{uid}`]({{< relref "/operate/rs/7.4/references/rest-api/requests/bdbs#put-bdbs" >}}) request headers.

The cluster will reject the update if its state was changed since the optimal shards placement was obtained.

### Request

#### Example HTTP request

```sh
PUT /v1/bdbs/1
```

#### Headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |
| cluster-state-id | 30 | Cluster state ID |

#### Example JSON body

```json
{
  "shards_blueprint": [
    {
      "nodes": [
        {
          "node_uid": "2",
          "role": "master"
        }
      ],
      "slot_range": "0-8191"
    },
    "..."
  ]
}
```

{{<warning>}}
If you submit such an optimized blueprint, it may cause strain on the cluster and its resources. Use with caution.
{{</warning>}}
