---
Title: Metrics configuration requests
alwaysopen: false
categories:
- docs
- operate
- rs
description: Metrics configuration requests
headerRange: '[1-2]'
hideListLinks: true
linkTitle: metrics_config
weight: $weight
---

| Method | Path | Description |
|--------|------|-------------|
| [GET](#get-metrics-config) | `/v1/metrics_config` | Get the cluster's metrics configuration |
| [PUT](#put-metrics-config) | `/v1/metrics_config` | Update the cluster's metrics configuration |

## Get metrics configuration {#get-metrics-config}

	GET /v1/metrics_config

Get the cluster-wide configuration of the [v2 metrics stream engine]({{<relref "/operate/rs/monitoring/metrics_stream_engine">}}).

#### Required permissions

| Permission name |
|-----------------|
| [view_cluster_info]({{< relref "/operate/rs/references/rest-api/permissions#view_cluster_info" >}}) |

### Request {#get-request}

#### Example HTTP request

	GET /v1/metrics_config

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

### Response {#get-response}

Returns a [metrics configuration object]({{< relref "/operate/rs/references/rest-api/objects/metrics_config" >}}). If the configuration has not been set, the default values are returned.

#### Example JSON body

```json
{
    "key_distribution_enabled": false,
    "key_size_buckets": "",
    "key_items_buckets": "",
    "local_storage_max_size_mb": 1024,
    "local_storage_retention_days": 8,
    "expose_db_tags": false,
    "metrics_tag_keys_exposed": [],
    "max_requests_in_flight": 2
}
```

### Status codes {#get-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | No error |

## Update metrics configuration {#put-metrics-config}

	PUT /v1/metrics_config

Update the cluster's metrics configuration.

This is a partial update: only the fields included in the request are changed, and any omitted fields keep their stored values. When a list field is included, its entire value is replaced; it is not merged with the stored list. The request must include at least one recognized field. If the configuration has never been set, the first update creates it, and any omitted fields take their default values.

#### Required permissions

| Permission name |
|-----------------|
| [update_cluster]({{< relref "/operate/rs/references/rest-api/permissions#update_cluster" >}}) |

### Request {#put-request}

#### Example HTTP request

	PUT /v1/metrics_config

#### Example JSON body

```json
{
    "key_distribution_enabled": true,
    "local_storage_retention_days": 14,
    "expose_db_tags": true,
    "metrics_tag_keys_exposed": ["env", "team"]
}
```

The above request enables the key distribution histograms, sets local metrics retention to 14 days, enables database tags in metrics, and exposes the `env` and `team` tag keys.

#### Request headers

| Key | Value | Description |
|-----|-------|-------------|
| Host | cnm.cluster.fqdn | Domain name |
| Accept | application/json | Accepted media type |

#### Request body

Include a [metrics configuration object]({{< relref "/operate/rs/references/rest-api/objects/metrics_config" >}}) with the fields to update in the request body.

### Response {#put-response}

Returns the complete [metrics configuration object]({{< relref "/operate/rs/references/rest-api/objects/metrics_config" >}}) after the update.

#### Example JSON body

```json
{
    "key_distribution_enabled": true,
    "key_size_buckets": "",
    "key_items_buckets": "",
    "local_storage_max_size_mb": 1024,
    "local_storage_retention_days": 14,
    "expose_db_tags": true,
    "metrics_tag_keys_exposed": ["env", "team"],
    "max_requests_in_flight": 2
}
```

### Status codes {#put-status-codes}

| Code | Description |
|------|-------------|
| [200 OK](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.2.1) | No error. |
| [400 Bad Request](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.4.1) | Bad content provided, or the request body is empty. |
